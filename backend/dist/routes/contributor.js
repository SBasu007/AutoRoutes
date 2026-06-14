// src/routes/contributor.ts
import { Router } from 'express';
import { db } from '../db/index.js';
import { stands, routes, routeStops } from '../db/schema.js';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { alias } from 'drizzle-orm/pg-core';
const router = Router();
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
const standSchema = z.object({
    name: z.string().min(2),
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
    type: z.enum(['auto_stand', 'destination', 'stop']).optional().default('auto_stand'),
});
const routeSchema = z.object({
    fromStandId: z.number(),
    toStandId: z.number(),
    name: z.string().optional(),
    estimatedTimeMin: z.number().optional(),
    path: z.array(z.object({
        lat: z.number(),
        lng: z.number(),
    })),
    stops: z.array(z.number()).default([]),
});
// Add new Stand
router.post('/stands', async (req, res) => {
    try {
        const data = standSchema.parse(req.body);
        const result = await db.insert(stands).values({
            ...data,
            addedBy: 'anonymous',
        }).returning();
        res.status(201).json(result[0]);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Get All Stands
router.get('/stands', async (req, res) => {
    const allStands = await db.select().from(stands);
    res.json(allStands);
});
// Add Route
router.post('/routes', async (req, res) => {
    try {
        const data = routeSchema.parse(req.body);
        const routeResult = await db.insert(routes)
            .values({
            fromStandId: data.fromStandId,
            toStandId: data.toStandId,
            name: data.name,
            estimatedTimeMin: data.estimatedTimeMin,
            path: JSON.stringify(data.path),
            addedBy: 'anonymous',
        })
            .returning();
        const route = routeResult[0];
        const orderedStops = [
            data.fromStandId,
            ...data.stops,
            data.toStandId,
        ];
        if (orderedStops.length > 0) {
            await db.insert(routeStops)
                .values(orderedStops.map((standId, index) => ({
                routeId: route.id,
                standId,
                stopOrder: index + 1,
            })));
        }
        res.status(201).json(route);
    }
    catch (err) {
        res.status(400).json({
            error: err.message,
        });
    }
});
// Get All Routes with proper joins
router.get('/routes', async (req, res) => {
    const fromStand = alias(stands, 'from_stand');
    const toStand = alias(stands, 'to_stand');
    const allRoutes = await db.select({
        id: routes.id,
        name: routes.name,
        estimatedTimeMin: routes.estimatedTimeMin,
        path: routes.path,
        from: {
            id: fromStand.id,
            name: fromStand.name,
            lat: fromStand.lat,
            lng: fromStand.lng,
        },
        to: {
            id: toStand.id,
            name: toStand.name,
            lat: toStand.lat,
            lng: toStand.lng,
        },
    })
        .from(routes)
        .leftJoin(fromStand, eq(fromStand.id, routes.fromStandId))
        .leftJoin(toStand, eq(toStand.id, routes.toStandId));
    const routesWithStops = await Promise.all(allRoutes.map(async (route) => {
        const stops = await db
            .select({
            id: stands.id,
            name: stands.name,
            lat: stands.lat,
            lng: stands.lng,
            stopOrder: routeStops.stopOrder,
        })
            .from(routeStops)
            .leftJoin(stands, eq(stands.id, routeStops.standId))
            .where(eq(routeStops.routeId, route.id))
            .orderBy(asc(routeStops.stopOrder));
        return {
            ...route,
            stops,
        };
    }));
    res.json(routesWithStops);
});
// Get Nearby Routes
router.get('/routes/nearby', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radius = parseFloat(req.query.radius || '1'); // Default 1km
        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ error: 'Valid lat and lng query parameters are required' });
        }
        const fromStand = alias(stands, 'from_stand');
        const toStand = alias(stands, 'to_stand');
        const allRoutes = await db.select({
            id: routes.id,
            name: routes.name,
            estimatedTimeMin: routes.estimatedTimeMin,
            path: routes.path,
            from: {
                id: fromStand.id,
                name: fromStand.name,
                lat: fromStand.lat,
                lng: fromStand.lng,
            },
            to: {
                id: toStand.id,
                name: toStand.name,
                lat: toStand.lat,
                lng: toStand.lng,
            },
        })
            .from(routes)
            .leftJoin(fromStand, eq(fromStand.id, routes.fromStandId))
            .leftJoin(toStand, eq(toStand.id, routes.toStandId));
        const routesWithStops = await Promise.all(allRoutes.map(async (route) => {
            const stops = await db.select({
                id: stands.id,
                name: stands.name,
                lat: stands.lat,
                lng: stands.lng,
                stopOrder: routeStops.stopOrder,
            })
                .from(routeStops)
                .leftJoin(stands, eq(stands.id, routeStops.standId))
                .where(eq(routeStops.routeId, route.id))
                .orderBy(asc(routeStops.stopOrder));
            return { ...route, stops };
        }));
        // Filter nearby routes
        const nearbyRoutes = routesWithStops.filter(route => {
            // Check start and end stands
            if (route.from?.lat && route.from?.lng) {
                if (calculateDistance(lat, lng, route.from.lat, route.from.lng) <= radius)
                    return true;
            }
            if (route.to?.lat && route.to?.lng) {
                if (calculateDistance(lat, lng, route.to.lat, route.to.lng) <= radius)
                    return true;
            }
            // Check stops
            for (const stop of route.stops) {
                if (stop?.lat && stop?.lng) {
                    if (calculateDistance(lat, lng, stop.lat, stop.lng) <= radius)
                        return true;
                }
            }
            // Check path points
            if (route.path) {
                try {
                    const pathPoints = JSON.parse(route.path);
                    for (const point of pathPoints) {
                        if (point.lat && point.lng) {
                            if (calculateDistance(lat, lng, point.lat, point.lng) <= radius)
                                return true;
                        }
                    }
                }
                catch (e) {
                    console.error("Failed to parse route path", e);
                }
            }
            return false;
        });
        res.json(nearbyRoutes);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
export default router;
