// src/routes/auth.ts
import { Router } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

const signupSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const adminSignupSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    adminSecret: z.string().min(1, 'Admin secret is required'),
});

const loginSchema = z.object({
    usernameOrEmail: z.string().min(1, 'Username or email is required'),
    password: z.string().min(1, 'Password is required'),
});

// Signup Route
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = signupSchema.parse(req.body);

        // Check if username or email already exists
        const existingUser = await db.select()
            .from(users)
            .where(or(eq(users.username, username), eq(users.email, email)));

        if (existingUser.length > 0) {
            const hasUsername = existingUser.some(u => u.username.toLowerCase() === username.toLowerCase());
            return res.status(400).json({
                error: hasUsername ? 'Username is already taken' : 'Email is already registered'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await db.insert(users).values({
            id: randomUUID(),
            username,
            email,
            passwordHash,
            role: 'contributor',
        }).returning();

        const user = result[0];

        // Generate JWT
        const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, {
            expiresIn: '7d',
        });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            }
        });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.issues[0].message });
        }
        res.status(500).json({ error: err.message || 'Signup failed' });
    }
});

// Admin Signup Route
router.post('/admin/signup', async (req, res) => {
    try {
        const { username, email, password, adminSecret } = adminSignupSchema.parse(req.body);

        const expectedSecret = process.env.ADMIN_SECRET;
        if (!expectedSecret) {
            return res.status(500).json({ error: 'Admin secret is not configured' });
        }
        if (adminSecret !== expectedSecret) {
            return res.status(403).json({ error: 'Invalid admin secret' });
        }

        // Check if username or email already exists
        const existingUser = await db.select()
            .from(users)
            .where(or(eq(users.username, username), eq(users.email, email)));

        if (existingUser.length > 0) {
            const hasUsername = existingUser.some(u => u.username.toLowerCase() === username.toLowerCase());
            return res.status(400).json({
                error: hasUsername ? 'Username is already taken' : 'Email is already registered'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert admin user
        const result = await db.insert(users).values({
            id: randomUUID(),
            username,
            email,
            passwordHash,
            role: 'admin',
        }).returning();

        const user = result[0];

        // Generate JWT
        const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, {
            expiresIn: '7d',
        });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            }
        });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.issues[0].message });
        }
        res.status(500).json({ error: err.message || 'Admin signup failed' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { usernameOrEmail, password } = loginSchema.parse(req.body);

        // Find user by username or email
        const userResult = await db.select()
            .from(users)
            .where(or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail)));

        if (userResult.length === 0) {
            return res.status(401).json({ error: 'Invalid username/email or password' });
        }

        const user = userResult[0];

        // Compare password hash
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username/email or password' });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, {
            expiresIn: '7d',
        });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            }
        });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.issues[0].message });
        }
        res.status(500).json({ error: err.message || 'Login failed' });
    }
});

export default router;
