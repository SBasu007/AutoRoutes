import { Router } from 'express';
import { db } from '../db/index.js';
import { stands, routes, routeStops } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
const router = Router();
// ── Constants ──────────────────────────────────────────────────────────────
const WALK_ONLY_MAX = 1.2; // km: if origin→dest < this, just walk
const WALK_TO_STAND_MAX = 3.0; // km: max walk to first/last stand
const WALK_TRANSFER_MAX = 0.8; // km: max walk between stands as a transfer
const MAX_BFS_NODES = 2000; // safety cap to avoid infinite loops
// ── Haversine distance ─────────────────────────────────────────────────────
function dist(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
router.get('/plan-trip', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const destLat = parseFloat(req.query.destLat);
        const destLng = parseFloat(req.query.destLng);
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
            lat: parseFloat(s.lat),
            lng: parseFloat(s.lng),
        }));
        const standMap = new Map();
        allStands.forEach(s => standMap.set(s.id, s));
        console.log(`[planner] ${allStands.length} approved stands loaded.`);
        const allRoutes = await db.select().from(routes).where(eq(routes.status, 'approved'));
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
        console.log(`[planner] Start stands: [${startStands.map(x => x.stand.name).join(', ')}]`);
        console.log(`[planner] End stands:   [${endStands.map(x => x.stand.name).join(', ')}]`);
        // ── 3. Build multi-modal graph ────────────────────────────────────
        const graph = new Map();
        const addEdge = (fromId, edge) => {
            if (!graph.has(fromId))
                graph.set(fromId, []);
            graph.get(fromId).push(edge);
        };
        // 3a. Route (auto) edges — directed along the route order
        for (const route of allRoutes) {
            const rStops = allRouteStops
                .filter(rs => rs.routeId === route.id)
                .sort((a, b) => a.stopOrder - b.stopOrder);
            const ordered = [];
            if (route.fromStandId)
                ordered.push(route.fromStandId);
            rStops.forEach(rs => ordered.push(rs.standId));
            if (route.toStandId)
                ordered.push(route.toStandId);
            // Deduplicate consecutive duplicates
            const unique = ordered.filter((id, i) => i === 0 || id !== ordered[i - 1]);
            for (let i = 0; i < unique.length; i++) {
                for (let j = i + 1; j < unique.length; j++) {
                    addEdge(unique[i], {
                        toStandId: unique[j],
                        edgeType: 'auto',
                        routeId: route.id,
                        routeName: route.name,
                    });
                }
            }
        }
        // 3b. Walking transfer edges — bidirectional between nearby stands
        for (let i = 0; i < allStands.length; i++) {
            for (let j = 0; j < allStands.length; j++) {
                if (i === j)
                    continue;
                const s1 = allStands[i];
                const s2 = allStands[j];
                const d = dist(s1.lat, s1.lng, s2.lat, s2.lng);
                if (d <= WALK_TRANSFER_MAX) {
                    addEdge(s1.id, {
                        toStandId: s2.id,
                        edgeType: 'walk_transfer',
                        walkDistKm: d,
                    });
                }
            }
        }
        const queue = startStands.map(x => ({
            standId: x.stand.id,
            path: [],
            autoHops: 0,
        }));
        // visited key = standId (simple BFS, first arrival is shortest)
        const visited = new Set(startStands.map(x => x.stand.id));
        let bestPath = null;
        let explored = 0;
        while (queue.length > 0 && explored < MAX_BFS_NODES) {
            explored++;
            const current = queue.shift();
            if (endStandIds.has(current.standId)) {
                bestPath = current.path;
                break;
            }
            const edges = graph.get(current.standId) || [];
            // Prioritise auto edges over walk transfer edges so we prefer riding
            const sorted = [...edges].sort((a, b) => {
                if (a.edgeType === 'auto' && b.edgeType !== 'auto')
                    return -1;
                if (a.edgeType !== 'auto' && b.edgeType === 'auto')
                    return 1;
                return 0;
            });
            for (const edge of sorted) {
                if (!visited.has(edge.toStandId)) {
                    visited.add(edge.toStandId);
                    queue.push({
                        standId: edge.toStandId,
                        autoHops: current.autoHops + (edge.edgeType === 'auto' ? 1 : 0),
                        path: [
                            ...current.path,
                            {
                                fromStandId: current.standId,
                                toStandId: edge.toStandId,
                                edgeType: edge.edgeType,
                                routeId: edge.routeId,
                                routeName: edge.routeName,
                                walkDistKm: edge.walkDistKm,
                            }
                        ],
                    });
                }
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
        const legs = [];
        // Walk from user origin → first stand in path
        const firstStandId = bestPath[0].fromStandId;
        const firstStand = standMap.get(firstStandId);
        const walkToFirst = dist(lat, lng, firstStand.lat, firstStand.lng);
        legs.push({
            type: 'walk',
            instruction: `Walk to ${firstStand.name}`,
            distanceKm: walkToFirst,
        });
        // Merge consecutive same-route auto edges; emit walk_transfer as walk legs
        let i = 0;
        while (i < bestPath.length) {
            const step = bestPath[i];
            if (step.edgeType === 'walk_transfer') {
                const s = standMap.get(step.toStandId);
                legs.push({
                    type: 'walk',
                    instruction: `Walk to ${s.name}`,
                    distanceKm: step.walkDistKm ?? 0,
                });
                i++;
                continue;
            }
            // auto edge — merge consecutive segments of the same route
            let routeStart = step.fromStandId;
            let routeEnd = step.toStandId;
            const routeId = step.routeId;
            const routeName = step.routeName;
            while (i + 1 < bestPath.length &&
                bestPath[i + 1].edgeType === 'auto' &&
                bestPath[i + 1].routeId === routeId) {
                i++;
                routeEnd = bestPath[i].toStandId;
            }
            const fromStand = standMap.get(routeStart);
            const toStand = standMap.get(routeEnd);
            legs.push({
                type: 'auto',
                instruction: `Take auto "${routeName || 'Route'}" from ${fromStand.name} to ${toStand.name}`,
                routeId,
                fromStand,
                toStand,
            });
            i++;
        }
        // Walk from last stand → destination
        const lastStandId = bestPath[bestPath.length - 1].toStandId;
        const lastStand = standMap.get(lastStandId);
        const walkToEnd = dist(lastStand.lat, lastStand.lng, destLat, destLng);
        legs.push({
            type: 'walk',
            instruction: `Walk from ${lastStand.name} to your destination`,
            distanceKm: walkToEnd,
        });
        return res.json({
            type: 'trip',
            message: 'Trip plan calculated.',
            totalDistanceKm: directDist,
            legs,
        });
    }
    catch (err) {
        console.error('[planner] Error:', err);
        res.status(500).json({ error: err.message });
    }
});
export default router;
