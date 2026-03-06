import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initDB } from './db';
import authRoutes from './routes/auth';
import todoRoutes from './routes/todos';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: '⚔️ Demon Slayer API Running' });
});

const start = async () => {
    await initDB();
    app.listen(PORT, () => {
        console.log(`🔥 Server running on port ${PORT}`);
    });
};

start();
