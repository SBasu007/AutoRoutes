// src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import contributorRoutes from './routes/contributor';

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000' })); // your Next.js frontend
app.use(express.json());

app.use('/api/contributor', contributorRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});