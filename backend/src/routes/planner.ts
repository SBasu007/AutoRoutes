import { Router } from 'express';
import { db } from '../db/index.js';
import { stands, routes, routeStops } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';

const router = Router();

// ── Constants ──────────────────────────────────────────────────────────────
const WALK_ONLY_MAX     = 1.2;  // km: if origin→dest < this, just walk
const WALK_TO_STAND_MAX = 3.0;  // km: max walk to first/last stand
const WALK_TRANSFER_MAX = 0.8;  // km: max walk between stands as a transfer
const MAX_NODES         = 5000; // safety cap to avoid infinite loops

// ── Dijkstra cost weights ──────────────────────────────────────────────────
// Walking is penalised heavily so the planner prefers a nearby start stand
// (short walk + ride) over a far start stand (long walk + direct ride).
// 1km walk ≈ 12-15 min, 1km auto ≈ 3-4 min → walk is ~4x "costlier" per km.
const WALK_COST_PER_KM     = 4.0;  // multiplier on walk distance
const AUTO_COST_PER_KM    = 1.0;  // multiplier on ride distance
const TRANSFER_PENALTY    = 0.5;  // fixed cost added on every transfer between stands

// ── Haversine distance ─────────────────────────────────────────────────────
function dist(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Graph edge types ───────────────────────────────────────────────────────
type EdgeType = 'auto' | 'walk_transfer';

interface GraphEdge {
    toStandId: number;
    edgeType: EdgeType;
    routeId?:   number;
    routeName?: string | null;
    distKm:     number;  // distance of this edge (walk or ride, in km)
}

// ── BFS path segment ──────────────────────────────────────────────────────
interface PathStep {
    fromStandId: number;
    toStandId:   number;
    edgeType:    EdgeType;
    routeId?:    number;
    routeName?:  string | null;
    distKm:      number;
}

router.get('/plan-trip', async (req, res) => {
    try {
        const lat     = parseFloat(req.query.lat     as string);
        const lng     = parseFloat(req.query.lng     as string);
        const destLat = parseFloat(req.query.destLat as string);
        const destLng = parseFloat(req.query.destLng as string);

        if (isNaN(lat) || isNaN(lng) || isNaN(destLat) || isNaN(destLng)) {
            return res.status(400).json({ error: 'Valid lat, lng, destLat, and destLng are required.' });
        }

        const directDist = dist(lat, lng, destLat, destLng);
        if (directDist <= WALK_ONLY_MAX) {
            return res.json({
                type: 'walk_only',
                totalDistanceKm: directDist,
                message: 'Destination is very close. You can walk there!',
                legs: []
            });
        }

        // ── 1. Fetch all approved stands & routes ─────────────────────────
        const rawStands = await db.select().from(stands).where(eq(stands.status, 'approved'));
        if (rawStands.length === 0) {
            return res.status(404).json({ error: 'No approved auto stands found in the system.' });
        }

        // Coerce lat/lng to numbers — some Postgres drivers return doublePrecision as strings
        const allStands = rawStands.map(s => ({
            ...s,
            lat: parseFloat(s.lat as any),
            lng: parseFloat(s.lng as any),
        }));

        const standMap = new Map<number, typeof allStands[0]>();
        allStands.forEach(s => standMap.set(s.id, s));

        console.log(`[planner] ${allStands.length} approved stands loaded.`);

        const allRoutes     = await db.select().from(routes).where(eq(routes.status, 'approved'));
        const allRouteStops = await db.select().from(routeStops).orderBy(asc(routeStops.stopOrder));
        console.log(`[planner] ${allRoutes.length} approved routes, ${allRouteStops.length} route stops.`);

        // ── 2. Find start & end stands (generous radius) ──────────────────
        const startStands = allStands
            .map(s => ({ stand: s, d: dist(lat, lng, s.lat, s.lng) }))
            .filter(x => x.d <= WALK_TO_STAND_MAX)
            .sort((a, b) => a.d - b.d);

        const endStands = allStands
            .map(s => ({ stand: s, d: dist(destLat, destLng, s.lat, s.lng) }))
            .filter(x => x.d <= WALK_TO_STAND_MAX)
            .sort((a, b) => a.d - b.d);

        if (startStands.length === 0) {
            return res.status(404).json({
                error: `No auto stands found within ${WALK_TO_STAND_MAX} km of your location. Try from a different spot.`
            });
        }
        if (endStands.length === 0) {
            return res.status(404).json({
                error: `No auto stands found within ${WALK_TO_STAND_MAX} km of your destination. The area may not be served by autos.`
            });
        }

        const endStandIds = new Set(endStands.map(x => x.stand.id));
        console.log(`[planner] Start stands: [${startStands.map(x=>x.stand.name).join(', ')}]`);
        console.log(`[planner] End stands:   [${endStands.map(x=>x.stand.name).join(', ')}]`);

        // ── 3. Build multi-modal graph ────────────────────────────────────
        const graph = new Map<number, GraphEdge[]>();

        const addEdge = (fromId: number, edge: GraphEdge) => {
            if (!graph.has(fromId)) graph.set(fromId, []);
            graph.get(fromId)!.push(edge);
        };

        // 3a. Route (auto) edges — directed along the route order
        for (const route of allRoutes) {
            const rStops = allRouteStops
                .filter(rs => rs.routeId === route.id)
                .sort((a, b) => a.stopOrder - b.stopOrder);

            const ordered: number[] = [];
            if (route.fromStandId) ordered.push(route.fromStandId);
            rStops.forEach(rs => ordered.push(rs.standId));
            if (route.toStandId) ordered.push(route.toStandId);

            // Deduplicate consecutive duplicates
            const unique = ordered.filter((id, i) => i === 0 || id !== ordered[i - 1]);

            // Resolve stand coordinates for distance calc
            const coords = unique.map(id => standMap.get(id)).filter(Boolean) as typeof allStands;

            for (let i = 0; i < unique.length; i++) {
                for (let j = i + 1; j < unique.length; j++) {
                    const fromStand = standMap.get(unique[i]);
                    const toStand   = standMap.get(unique[j]);
                    if (!fromStand || !toStand) continue;
                    // auto distance = straight-line distance between the two stands
                    const rideDist = dist(fromStand.lat, fromStand.lng, toStand.lat, toStand.lng);
                    addEdge(unique[i], {
                        toStandId: unique[j],
                        edgeType:  'auto',
                        routeId:   route.id,
                        routeName: route.name,
                        distKm:    rideDist,
                    });
                }
            }
        }

        // 3b. Walking transfer edges — bidirectional between nearby stands
        for (let i = 0; i < allStands.length; i++) {
            for (let j = 0; j < allStands.length; j++) {
                if (i === j) continue;
                const s1 = allStands[i];
                const s2 = allStands[j];
                const d = dist(s1.lat, s1.lng, s2.lat, s2.lng);
                if (d <= WALK_TRANSFER_MAX) {
                    addEdge(s1.id, {
                        toStandId: s2.id,
                        edgeType:  'walk_transfer',
                        distKm:    d,
                    });
                }
            }
        }

        // ── 4. Dijkstra — lowest total cost, with walk heavily penalised ───
        // Cost model (all in "minutes-like" units):
        //   - auto ride:  distKm * AUTO_COST_PER_KM
        //   - walk:       distKm * WALK_COST_PER_KM   (4x costlier → prefer riding)
        //   - any edge:   + TRANSFER_PENALTY          (discourage stand-hopping)
        const costOf = (edge: GraphEdge): number => {
            const perKm = edge.edgeType === 'auto' ? AUTO_COST_PER_KM : WALK_COST_PER_KM;
            return edge.distKm * perKm + TRANSFER_PENALTY;
        };

        interface DNode {
            standId: number;
            cost:    number;
            path:    PathStep[];
        }

        // Binary-heap-free priority queue: array kept sorted by cost (small graphs).
        const pq: DNode[] = startStands.map(x => ({
            standId: x.stand.id,
            cost:    0,
            path:    [],
        }));

        const bestCost = new Map<number, number>();  // standId → lowest cost seen

        let bestPath: PathStep[] | null = null;
        let explored = 0;

        while (pq.length > 0 && explored < MAX_NODES) {
            explored++;
            // Pop the lowest-cost node
            pq.sort((a, b) => a.cost - b.cost);
            const current = pq.shift()!;

            // If we've reached an end stand, we have the cheapest trip → done
            if (endStandIds.has(current.standId)) {
                bestPath = current.path;
                break;
            }

            const edges = graph.get(current.standId) || [];
            for (const edge of edges) {
                const stepCost = costOf(edge);
                const newCost  = current.cost + stepCost;
                const prevCost = bestCost.get(edge.toStandId);

                // Only relax if this route to the stand is cheaper than any prior
                if (prevCost !== undefined && newCost >= prevCost) continue;
                bestCost.set(edge.toStandId, newCost);

                pq.push({
                    standId: edge.toStandId,
                    cost:    newCost,
                    path: [
                        ...current.path,
                        {
                            fromStandId: current.standId,
                            toStandId:   edge.toStandId,
                            edgeType:    edge.edgeType,
                            routeId:     edge.routeId,
                            routeName:   edge.routeName,
                            distKm:      edge.distKm,
                        }
                    ],
                });
            }
        }

        if (!bestPath || bestPath.length === 0) {
            const graphSize = graph.size;
            console.log(`[planner] No path found. Graph nodes: ${graphSize}, explored: ${explored}`);
            return res.status(404).json({
                error: 'No connected auto route found between your location and destination. The areas may not be linked by any auto route.'
            });
        }
        console.log(`[planner] Path found with ${bestPath.length} steps, explored ${explored} nodes.`);

        // ── 5. Build legs from path ────────────────────────────────────────
        const legs: any[] = [];

        // Walk from user origin → first stand in path
        const firstStandId = bestPath[0].fromStandId;
        const firstStand   = standMap.get(firstStandId)!;
        const walkToFirst  = dist(lat, lng, firstStand.lat, firstStand.lng);
        legs.push({
            type:        'walk',
            instruction: `Walk to ${firstStand.name}`,
            distanceKm:  walkToFirst,
            // endpoints so the frontend can draw the walk segment
            from:        { lat, lng },
            to:          { lat: firstStand.lat, lng: firstStand.lng },
        });

        // Merge consecutive same-route auto edges; emit walk_transfer as walk legs
        let i = 0;
        while (i < bestPath.length) {
            const step = bestPath[i];

            if (step.edgeType === 'walk_transfer') {
                const s = standMap.get(step.toStandId)!;
                const prevStand = standMap.get(step.fromStandId)!;
                legs.push({
                    type:        'walk',
                    instruction: `Walk to ${s.name}`,
                    distanceKm:  step.distKm ?? 0,
                    from:        { lat: prevStand.lat, lng: prevStand.lng },
                    to:          { lat: s.lat, lng: s.lng },
                });
                i++;
                continue;
            }

            // auto edge — merge consecutive segments of the same route
            let routeStart = step.fromStandId;
            let routeEnd   = step.toStandId;
            const routeId   = step.routeId!;
            const routeName = step.routeName;

            while (
                i + 1 < bestPath.length &&
                bestPath[i + 1].edgeType === 'auto' &&
                bestPath[i + 1].routeId  === routeId
            ) {
                i++;
                routeEnd = bestPath[i].toStandId;
            }

            const fromStand = standMap.get(routeStart)!;
            const toStand   = standMap.get(routeEnd)!;
            legs.push({
                type:        'auto',
                instruction: `Take auto "${routeName || 'Route'}" from ${fromStand.name} to ${toStand.name}`,
                routeId,
                fromStand,
                toStand,
            });

            i++;
        }

        // Walk from last stand → destination
        const lastStandId = bestPath[bestPath.length - 1].toStandId;
        const lastStand   = standMap.get(lastStandId)!;
        const walkToEnd   = dist(lastStand.lat, lastStand.lng, destLat, destLng);
        legs.push({
            type:        'walk',
            instruction: `Walk from ${lastStand.name} to your destination`,
            distanceKm:  walkToEnd,
            from:        { lat: lastStand.lat, lng: lastStand.lng },
            to:          { lat: destLat, lng: destLng },
        });

        return res.json({
            type:           'trip',
            message:        'Trip plan calculated.',
            totalDistanceKm: directDist,
            // origin & destination points so the frontend can render start/end markers
            origin:      { lat, lng },
            destination: { lat: destLat, lng: destLng },
            legs,
        });

    } catch (err: any) {
        console.error('[planner] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
