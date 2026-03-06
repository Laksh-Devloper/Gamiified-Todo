import { Router, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getStreakUpdate } from '../utils/streak';

const router = Router();

const XP_TABLE: Record<string, number> = {
    low: 10,
    medium: 25,
    high: 50,
    boss: 100,
};

const calculateLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;

const checkAndGrantAchievements = async (userId: string) => {
    const todosResult = await query('SELECT * FROM todos WHERE user_id = $1', [userId]);
    const todos: any[] = todosResult.rows;
    const completed: any[] = todos.filter((t: any) => t.is_completed);
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    const toGrant: string[] = [];

    if (completed.length >= 1) toGrant.push('first_blood');
    if (completed.length >= 50) toGrant.push('water_breathing');
    if (user.level >= 10) toGrant.push('demon_slayer');
    if (user.streak >= 7) toGrant.push('flame_pillar');
    if (completed.some((t: any) => t.priority === 'boss')) toGrant.push('moon_breathing');

    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = completed.filter((t: any) => {
        const d = t.completed_at ? new Date(t.completed_at).toISOString().split('T')[0] : null;
        return d === today;
    });
    if (todayCompleted.length >= 5) toGrant.push('thunder_god');

    for (const badge of toGrant) {
        await query(
            'INSERT INTO achievements (user_id, badge_key) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, badge]
        );
    }
};

// GET all todos
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await query(
            'SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC',
            [req.userId]
        );
        res.json({ todos: result.rows });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

// CREATE todo
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, description, priority, due_date } = req.body;
    if (!title) {
        res.status(400).json({ error: 'Title required' });
        return;
    }
    const xp_reward = XP_TABLE[priority] || 10;
    try {
        const result = await query(
            `INSERT INTO todos (user_id, title, description, priority, xp_reward, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.userId, title, description || null, priority || 'low', xp_reward, due_date || null]
        );
        res.status(201).json({ todo: result.rows[0] });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

// COMPLETE todo
router.patch('/:id/complete', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const todoResult = await query(
            'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        );
        if (todoResult.rows.length === 0) {
            res.status(404).json({ error: 'Todo not found' });
            return;
        }

        const todo = todoResult.rows[0];
        if (todo.is_completed) {
            res.status(400).json({ error: 'Already completed' });
            return;
        }

        await query(
            'UPDATE todos SET is_completed = true, completed_at = NOW() WHERE id = $1',
            [req.params.id]
        );

        // Update XP and level
        const userResult = await query('SELECT xp, level, streak, last_active FROM users WHERE id = $1', [req.userId]);
        const oldUser = userResult.rows[0];
        const newXP = oldUser.xp + todo.xp_reward;
        const newLevel = calculateLevel(newXP);

        // Also update streak on completion — completing a task counts as being active today
        const { newStreak, todayStr, changed } = getStreakUpdate(oldUser.last_active, oldUser.streak);

        await query(
            'UPDATE users SET xp = $1, level = $2, streak = $3, last_active = $4 WHERE id = $5',
            [newXP, newLevel, newStreak, todayStr, req.userId]
        );

        // Check achievements
        await checkAndGrantAchievements(req.userId!);

        // Get updated achievements
        const achievementsResult = await query(
            'SELECT badge_key, unlocked_at FROM achievements WHERE user_id = $1',
            [req.userId]
        );

        res.json({
            xpGained: todo.xp_reward,
            newXP,
            newLevel,
            newStreak,
            leveledUp: newLevel > oldUser.level,
            streakUpdated: changed,
            achievements: achievementsResult.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// UPDATE todo
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, description, priority, due_date } = req.body;
    const xp_reward = XP_TABLE[priority] || 10;
    try {
        const result = await query(
            `UPDATE todos SET title = $1, description = $2, priority = $3, xp_reward = $4, due_date = $5
       WHERE id = $6 AND user_id = $7 RETURNING *`,
            [title, description || null, priority || 'low', xp_reward, due_date || null, req.params.id, req.userId]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Todo not found' });
            return;
        }
        res.json({ todo: result.rows[0] });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE todo
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        await query('DELETE FROM todos WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        res.json({ message: 'Deleted' });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET achievements
router.get('/achievements', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await query(
            'SELECT badge_key, unlocked_at FROM achievements WHERE user_id = $1',
            [req.userId]
        );
        res.json({ achievements: result.rows });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
