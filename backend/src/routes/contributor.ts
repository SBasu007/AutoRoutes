// src/routes/contributor.ts
import { Router } from 'express';
import { db } from '../db/index.js';
import { stands, routes, routeStops } from '../db/schema.js';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { alias } from 'drizzle-orm/pg-core';
const router = Router();

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

// Add new Stand
router.post('/stands', async (req, res) => {
    try {
        const data = standSchema.parse(req.body);
        const result = await db.insert(stands).values({
            ...data,
            addedBy: 'anonymous',
        }).returning();

        res.status(201).json(result[0]);
    } catch (err: any) {
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

        const routeResult =
            await db.insert(routes)
                .values({
                    fromStandId: data.fromStandId,
                    toStandId: data.toStandId,

                    name: data.name,

                    estimatedTimeMin:
                        data.estimatedTimeMin,

                    path: JSON.stringify(data.path),

                    addedBy: 'anonymous',
                })
                .returning();

        const route =
            routeResult[0];

        const orderedStops = [
            data.fromStandId,
            ...data.stops,
            data.toStandId,
        ];

        if (orderedStops.length > 0) {
            await db.insert(routeStops)
                .values(
                    orderedStops.map(
                        (standId, index) => ({
                            routeId: route.id,
                            standId,
                            stopOrder: index + 1,
                        })
                    )
                );
        }

        res.status(201).json(route);

    } catch (err: any) {
        res.status(400).json({
            error: err.message,
        });
    }
});

// Get All Routes with proper joins
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
            );

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

export default router;