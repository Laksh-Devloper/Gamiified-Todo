import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getStreakUpdate } from '../utils/streak';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    const { username, email, password, character } = req.body;
    if (!username || !email || !password) {
        res.status(400).json({ error: 'All fields required' });
        return;
    }
    try {
        const existing = await query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existing.rows.length > 0) {
            res.status(409).json({ error: 'Username or email already exists' });
            return;
        }
        const password_hash = await bcrypt.hash(password, 12);
        const result = await query(
            `INSERT INTO users (username, email, password_hash, character, last_active, streak)
       VALUES ($1, $2, $3, $4, $5, 1)
       RETURNING id, username, email, xp, level, streak, character, avatar_url`,
            [username, email, password_hash, character || 'tanjiro', new Date().toISOString().split('T')[0]]
        );
        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,        // always true — Render uses HTTPS
            sameSite: 'none',    // required for cross-domain (frontend.onrender.com → backend.onrender.com)
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json({ user, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password required' });
        return;
    }
    try {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const { newStreak, todayStr, changed } = getStreakUpdate(user.last_active, user.streak);
        if (changed) {
            await query('UPDATE users SET streak = $1, last_active = $2 WHERE id = $3', [newStreak, todayStr, user.id]);
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        const { password_hash, ...safeUser } = user;
        res.json({ user: { ...safeUser, streak: newStreak }, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user — also refreshes streak in real-time
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await query(
            'SELECT id, username, email, xp, level, streak, character, avatar_url, last_active, created_at FROM users WHERE id = $1',
            [req.userId]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const user = result.rows[0];

        // Real-time streak check: if a new day has started since last activity, update now
        const { newStreak, todayStr, changed } = getStreakUpdate(user.last_active, user.streak);
        if (changed) {
            await query('UPDATE users SET streak = $1, last_active = $2 WHERE id = $3', [newStreak, todayStr, req.userId]);
        }

        res.json({ user: { ...user, streak: newStreak } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update avatar
router.patch('/avatar', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    const { avatar_url } = req.body;
    if (!avatar_url) {
        res.status(400).json({ error: 'avatar_url required' });
        return;
    }
    if (avatar_url.length > 5 * 1024 * 1024) {
        res.status(413).json({ error: 'Image too large (max 5MB)' });
        return;
    }
    try {
        const result = await query(
            'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, username, avatar_url, character',
            [avatar_url, req.userId]
        );
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
router.post('/logout', (_req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});

export default router;
