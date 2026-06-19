// src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import https from 'https';
import http from 'http';
import contributorRoutes from './routes/contributor.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import adminRoutes from './routes/admin.js';
import plannerRoutes from './routes/planner.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Add health-check endpoint (exempt from rate limit if desired, but we can place rate limiter after or before it. Let's place it before rate limiter or allow it globally)
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// Apply rate limiter to all API endpoints
app.use('/api', apiLimiter);

app.use('/api/contributor', contributorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/planner', plannerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Keep-alive cron job for Render (runs every 14 minutes)
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_URL) {
    cron.schedule('*/14 * * * *', () => {
        console.log(`Sending keep-alive ping to ${RENDER_URL}/ping...`);
        const client = RENDER_URL.startsWith('https') ? https : http;
        client.get(`${RENDER_URL}/ping`, (res) => {
            console.log(`Keep-alive ping status: ${res.statusCode}`);
        }).on('error', (err) => {
            console.error('Keep-alive ping error:', err.message);
        });
    });
} else {
    console.log('RENDER_EXTERNAL_URL not set, skipping keep-alive cron job.');
}
