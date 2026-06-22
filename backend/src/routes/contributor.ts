// src/routes/contributor.ts
import { Router } from 'express';
import { db } from '../db/index.js';
import { stands, routes, routeStops, contributions } from '../db/schema.js';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { alias } from 'drizzle-orm/pg-core';
import { authenticate } from '../middleware/auth.js';
const router = Router();

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
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
    path: z.array(
        z.object({
            lat: z.number(),
            lng: z.number(),
        })
    ),
    stops: z.array(z.number()).default([]),
});

// Submit new Stand as a contribution
router.post('/stands', authenticate, async (req, res) => {
    try {
        const data = standSchema.parse(req.body);
        const userId = req.auth!.userId;

        // Build stand payload matching the stands table columns
        const standPayload = {
            name: data.name,
            lat: data.lat,
            lng: data.lng,
            address: data.address ?? null,
            type: data.type,
            added_by: userId,
        };

        const result = await db.insert(contributions).values({
            standPayload,
            routePayload: null,
            routeStopsPayload: null,
            status: 'pending',
            addedBy: userId,
        }).returning();

        res.status(201).json({
            contributionId: result[0].id,
            message: 'Stand submitted for review. An admin will approve it shortly.',
        });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Get All Approved Stands
router.get('/stands', async (req, res) => {
    const allStands = await db.select().from(stands).where(eq(stands.status, 'approved'));
    res.json(allStands);
});

// Submit new Route (and its stops) as a contribution
router.post('/routes', authenticate, async (req, res) => {
    try {
        const data = routeSchema.parse(req.body);
        const userId = req.auth!.userId;

        // Build route payload matching the routes table columns
        const routePayload = {
            from_stand_id: data.fromStandId,
            to_stand_id: data.toStandId,
            name: data.name ?? null,
            path: JSON.stringify(data.path),
            estimated_time_min: data.estimatedTimeMin ?? null,
            added_by: userId,
        };

        // Build route_stops payload: ordered list of stand IDs
        const orderedStopIds = [
            data.fromStandId,
            ...data.stops,
            data.toStandId,
        ];

        const routeStopsPayload = orderedStopIds.map((standId, index) => ({
            stand_id: standId,
            stop_order: index + 1,
        }));

        const result = await db.insert(contributions).values({
            standPayload: null,
            routePayload,
            routeStopsPayload,
            status: 'pending',
            addedBy: userId,
        }).returning();

        res.status(201).json({
            contributionId: result[0].id,
            message: 'Route submitted for review. An admin will approve it shortly.',
        });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Get All Approved Routes with proper joins
router.get('/routes', async (req, res) => {

    const fromStand =
        alias(stands, 'from_stand');

    const toStand =
        alias(stands, 'to_stand');

    const allRoutes =
        await db.select({
            id: routes.id,

            name: routes.name,

            estimatedTimeMin:
                routes.estimatedTimeMin,

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
            .leftJoin(
                fromStand,
                eq(
                    fromStand.id,
                    routes.fromStandId
                )
            )
            .leftJoin(
                toStand,
                eq(
                    toStand.id,
                    routes.toStandId
                )
            )
            .where(eq(routes.status, 'approved'));

    const routesWithStops =
        await Promise.all(
            allRoutes.map(
                async (route) => {

                    const stops =
                        await db
                            .select({
                                id: stands.id,
                                name: stands.name,
                                lat: stands.lat,
                                lng: stands.lng,
                                stopOrder:
                                    routeStops.stopOrder,
                            })
                            .from(routeStops)
                            .leftJoin(
                                stands,
                                eq(
                                    stands.id,
                                    routeStops.standId
                                )
                            )
                            .where(
                                eq(
                                    routeStops.routeId,
                                    route.id
                                )
                            )
                            .orderBy(
                                asc(
                                    routeStops.stopOrder
                                )
                            );

                    return {
                        ...route,
                        stops,
                    };
                }
            )
        );

    res.json(routesWithStops);
});

// Get Nearby Routes
router.get('/routes/nearby', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);
        const radius = parseFloat((req.query.radius as string) || '1'); // Default 1km

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
            .leftJoin(toStand, eq(toStand.id, routes.toStandId))
            .where(eq(routes.status, 'approved'));

        const routesWithStops = await Promise.all(
            allRoutes.map(async (route) => {
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
            })
        );

        // Filter nearby routes
        const nearbyRoutes = routesWithStops.filter(route => {
            // Check start and end stands
            if (route.from?.lat && route.from?.lng) {
                if (calculateDistance(lat, lng, route.from.lat, route.from.lng) <= radius) return true;
            }
            if (route.to?.lat && route.to?.lng) {
                if (calculateDistance(lat, lng, route.to.lat, route.to.lng) <= radius) return true;
            }

            // Check stops
            for (const stop of route.stops) {
                if (stop?.lat && stop?.lng) {
                    if (calculateDistance(lat, lng, stop.lat, stop.lng) <= radius) return true;
                }
            }

            // Check path points
            if (route.path) {
                try {
                    const pathPoints = JSON.parse(route.path as string);
                    for (const point of pathPoints) {
                        if (point.lat && point.lng) {
                            if (calculateDistance(lat, lng, point.lat, point.lng) <= radius) return true;
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse route path", e);
                }
            }

            return false;
        });

        res.json(nearbyRoutes);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;