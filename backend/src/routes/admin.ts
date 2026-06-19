import { Router } from 'express';
import { db } from '../db/index.js';
import { stands, routes, routeStops } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';

const router = Router();

// Get Pending Stands
router.get('/stands/pending', async (req, res) => {
    try {
        const pendingStands = await db.select().from(stands).where(eq(stands.status, 'pending'));
        res.json(pendingStands);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get Pending Routes
router.get('/routes/pending', async (req, res) => {
    try {
        const fromStand = alias(stands, 'from_stand');
        const toStand = alias(stands, 'to_stand');

        const pendingRoutes = await db.select({
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
        .where(eq(routes.status, 'pending'));

        const routesWithStops = await Promise.all(
            pendingRoutes.map(async (route) => {
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

        res.json(routesWithStops);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

const statusSchema = z.object({
    status: z.enum(['approved', 'rejected'])
});

// Update Stand Status
router.patch('/stands/:id/status', async (req, res) => {
    try {
        const { status } = statusSchema.parse(req.body);
        const { id } = req.params;

        const result = await db.update(stands)
            .set({ status })
            .where(eq(stands.id, parseInt(id)))
            .returning();

        if (result.length === 0) {
            return res.status(404).json({ error: 'Stand not found' });
        }

        res.json(result[0]);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Update Route Status
router.patch('/routes/:id/status', async (req, res) => {
    try {
        const { status } = statusSchema.parse(req.body);
        const { id } = req.params;

        const result = await db.update(routes)
            .set({ status })
            .where(eq(routes.id, parseInt(id)))
            .returning();

        if (result.length === 0) {
            return res.status(404).json({ error: 'Route not found' });
        }

        res.json(result[0]);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
