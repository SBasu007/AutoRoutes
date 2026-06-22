// src/routes/admin.ts
import { Router } from 'express';
import { db } from '../db/index.js';
import { stands, routes, routeStops, contributions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authenticateAdmin } from '../middleware/auth.js';
const router = Router();
// Apply admin guard to every route in this router
router.use(authenticateAdmin);
// ─── Get all pending contributions ────────────────────────────────────────────
router.get('/contributions/pending', async (req, res) => {
    try {
        const pending = await db
            .select()
            .from(contributions)
            .where(eq(contributions.status, 'pending'));
        res.json(pending);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ─── Get all contributions (any status) ───────────────────────────────────────
router.get('/contributions', async (req, res) => {
    try {
        const all = await db.select().from(contributions);
        res.json(all);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ─── Update contribution status (approve / reject) ────────────────────────────
// On approval: atomically promotes payloads into stands / routes / route_stops.
const reviewSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    review_notes: z.string().nullable().optional(),
});
router.patch('/contributions/:id/status', async (req, res) => {
    try {
        const { status, review_notes } = reviewSchema.parse(req.body);
        const reviewed_by = req.auth?.userId || null;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid contribution id' });
        }
        // Fetch the contribution once – we need the payloads if approving
        const rows = await db
            .select()
            .from(contributions)
            .where(eq(contributions.id, id));
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Contribution not found' });
        }
        const contribution = rows[0];
        if (contribution.status !== 'pending') {
            return res.status(400).json({ error: 'Contribution has already been reviewed' });
        }
        if (status === 'approved') {
            // ── Stand approval ─────────────────────────────────────────────────
            if (contribution.standPayload) {
                const sp = contribution.standPayload;
                await db.insert(stands).values({
                    name: sp.name,
                    lat: sp.lat,
                    lng: sp.lng,
                    address: sp.address ?? undefined,
                    type: sp.type ?? 'auto_stand',
                    addedBy: sp.added_by,
                    status: 'approved',
                });
            }
            // ── Route + stops approval ─────────────────────────────────────────
            if (contribution.routePayload) {
                const rp = contribution.routePayload;
                const [insertedRoute] = await db.insert(routes).values({
                    fromStandId: rp.from_stand_id,
                    toStandId: rp.to_stand_id,
                    name: rp.name ?? undefined,
                    path: rp.path,
                    estimatedTimeMin: rp.estimated_time_min ?? undefined,
                    addedBy: rp.added_by,
                    status: 'approved',
                }).returning({ id: routes.id });
                if (contribution.routeStopsPayload) {
                    const stopRows = contribution.routeStopsPayload;
                    if (stopRows.length > 0) {
                        await db.insert(routeStops).values(stopRows.map((s) => ({
                            routeId: insertedRoute.id,
                            standId: s.stand_id,
                            stopOrder: s.stop_order,
                        })));
                    }
                }
            }
        }
        // ── Mark contribution as reviewed ──────────────────────────────────────
        const [updated] = await db
            .update(contributions)
            .set({
            status,
            reviewNotes: review_notes ?? null,
            reviewedBy: reviewed_by ?? null,
            reviewedAt: new Date(),
        })
            .where(eq(contributions.id, id))
            .returning();
        res.json(updated);
    }
    catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.issues[0].message });
        }
        res.status(500).json({ error: err.message });
    }
});
export default router;
