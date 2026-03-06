'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, getTodos, createTodo, completeTodo, deleteTodo, logout, updateAvatar } from '@/lib/api';

interface User {
    id: string; username: string; email: string;
    xp: number; level: number; streak: number;
    character: string; avatar_url?: string;
}

interface Todo {
    id: string; title: string; description?: string;
    priority: 'low' | 'medium' | 'high' | 'boss';
    xp_reward: number; is_completed: boolean;
    due_date?: string; completed_at?: string; created_at: string;
}

interface Achievement { badge_key: string; unlocked_at: string; }

// ===== CUTE PRIORITY CONFIG =====
const PRIORITY_CONFIG = {
    low: { icon: '🌱', name: 'Sprout', xp: '10 XP', color: 'low' },
    medium: { icon: '🌸', name: 'Blossom', xp: '25 XP', color: 'medium' },
    high: { icon: '⭐', name: 'Star', xp: '50 XP', color: 'high' },
    boss: { icon: '🦋', name: 'Epic', xp: '100 XP', color: 'boss' },
};

// ===== CUTE ACHIEVEMENT BADGES =====
const BADGE_CONFIG: Record<string, { icon: string; name: string }> = {
    first_blood: { icon: '🌸', name: 'First Blossom' },
    flame_pillar: { icon: '🌈', name: 'Rainbow Streak' },
    thunder_god: { icon: '⚡', name: 'Lightning Star' },
    water_breathing: { icon: '🫧', name: 'Bubble Dream' },
    demon_slayer: { icon: '💫', name: 'Star Master' },
    moon_breathing: { icon: '🌙', name: 'Moon Child' },
};

const ALL_BADGES = Object.keys(BADGE_CONFIG);

const CHARACTER_IMGS: Record<string, string> = {
    tanjiro: '/characters/tanjiro.png',
    nezuko: '/characters/nezuko.png',
    zenitsu: '/characters/zenitsu.png',
    inosuke: '/characters/inosuke.png',
};

const PRESET_CHARACTERS = [
    { key: 'tanjiro', name: 'Tanjiro', img: '/characters/tanjiro.png' },
    { key: 'nezuko', name: 'Nezuko', img: '/characters/nezuko.png' },
    { key: 'zenitsu', name: 'Zenitsu', img: '/characters/zenitsu.png' },
    { key: 'inosuke', name: 'Inosuke', img: '/characters/inosuke.png' },
];

const LEVEL_TITLES = [
    'Little Sprout 🌱', 'Flower Bud 🌷', 'Blooming 🌸', 'Daydreamer 🌼',
    'Star Gazer ⭐', 'Moon Dancer 🌙', 'Rainbow Chaser 🌈', 'Cloud Rider ☁️',
    'Dream Weaver 🦋', 'Petal Master 🌺', 'Sakura Queen 🌸', 'Cosmic Star 💫',
];

const getLevelTitle = (level: number) => LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
const xpForNextLevel = (level: number) => level * level * 100;

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [levelUpModal, setLevelUpModal] = useState<number | null>(null);
    const [xpToast, setXpToast] = useState<{ amount: number; id: number } | null>(null);
    const [completingId, setCompletingId] = useState<string | null>(null);
    const [newTodo, setNewTodo] = useState({ title: '', description: '', priority: 'low', due_date: '' });

    // Avatar picker state
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [avatarSelected, setAvatarSelected] = useState<string>('');
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [avatarSaving, setAvatarSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showXpToast = (amount: number) => {
        const id = Date.now();
        setXpToast({ amount, id });
        setTimeout(() => setXpToast(null), 2500);
    };

    const fetchData = useCallback(async () => {
        try {
            const [meRes, todosRes] = await Promise.all([getMe(), getTodos()]);
            setUser(meRes.data.user);
            setTodos(todosRes.data.todos);
            try {
                const { getAchievements } = await import('@/lib/api');
                const achRes = await getAchievements();
                setAchievements(achRes.data.achievements);
            } catch { }
        } catch {
            router.push('/');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleComplete = async (id: string) => {
        setCompletingId(id);
        setTimeout(() => setCompletingId(null), 700);
        try {
            const res = await completeTodo(id);
            const { xpGained, newXP, newLevel, newStreak, leveledUp, achievements: newAch } = res.data;
            setTodos(prev => prev.map(t => t.id === id ? { ...t, is_completed: true, completed_at: new Date().toISOString() } : t));
            setUser(prev => prev ? { ...prev, xp: newXP, level: newLevel, streak: newStreak ?? prev.streak } : prev);
            setAchievements(newAch || []);
            showXpToast(xpGained);
            if (leveledUp) setTimeout(() => setLevelUpModal(newLevel), 600);
        } catch { }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTodo(id);
            setTodos(prev => prev.filter(t => t.id !== id));
        } catch { }
    };

    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.title.trim()) return;
        setAddLoading(true);
        try {
            const res = await createTodo({
                title: newTodo.title,
                description: newTodo.description || undefined,
                priority: newTodo.priority,
                due_date: newTodo.due_date || undefined,
            });
            setTodos(prev => [res.data.todo, ...prev]);
            setNewTodo({ title: '', description: '', priority: 'low', due_date: '' });
            setShowAddForm(false);
        } catch { }
        setAddLoading(false);
    };

    const handleLogout = async () => { await logout(); router.push('/'); };

    // Avatar helpers
    const getEffectiveAvatar = (u: User | null) => {
        if (!u) return '/characters/tanjiro.png';
        return u.avatar_url || CHARACTER_IMGS[u.character] || '/characters/tanjiro.png';
    };

    const openAvatarPicker = () => {
        setAvatarSelected(''); setAvatarPreview('');
        setShowAvatarPicker(true);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setAvatarPreview(dataUrl);
            setAvatarSelected(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveAvatar = async () => {
        if (!avatarSelected) return;
        setAvatarSaving(true);
        try {
            const res = await updateAvatar(avatarSelected);
            setUser(prev => prev ? { ...prev, avatar_url: res.data.user.avatar_url } : prev);
            setShowAvatarPicker(false);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to save avatar');
        } finally {
            setAvatarSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p style={{ color: 'var(--text-secondary)', fontFamily: 'Nunito, sans-serif', letterSpacing: '3px', fontSize: '0.8rem', fontWeight: 700 }}>
                    ✨ Loading your world...
                </p>
            </div>
        );
    }

    const filteredTodos = todos.filter(t => {
        if (filter === 'active') return !t.is_completed;
        if (filter === 'completed') return t.is_completed;
        return true;
    });

    const activeTodos = todos.filter(t => !t.is_completed).length;
    const completedTodos = todos.filter(t => t.is_completed).length;
    const totalXP = user?.xp || 0;
    const currentLevel = user?.level || 1;
    const prevLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
    const nextLevelXP = xpForNextLevel(currentLevel);
    const xpProgress = Math.min(((totalXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100, 100);

    return (
        <>
            {/* XP Toast */}
            {xpToast && (
                <div key={xpToast.id} className="xp-toast">
                    ✨ +{xpToast.amount} XP!
                </div>
            )}

            {/* Level Up Modal */}
            {levelUpModal && (
                <div className="overlay" onClick={() => setLevelUpModal(null)}>
                    <div className="levelup-modal" onClick={e => e.stopPropagation()}>
                        <span className="levelup-emoji">🌸</span>
                        <h2>Level Up! ✨</h2>
                        <p>You&apos;re blooming beautifully!</p>
                        <span className="levelup-level">LV.{levelUpModal}</span>
                        <p style={{ color: 'var(--accent-lavender)', fontSize: '0.88rem', marginBottom: '24px', fontWeight: 700 }}>
                            {getLevelTitle(levelUpModal)}
                        </p>
                        <button id="close-levelup" className="btn-primary" onClick={() => setLevelUpModal(null)}>
                            🌟 Keep Blooming!
                        </button>
                    </div>
                </div>
            )}

            {/* Avatar Picker Modal */}
            {showAvatarPicker && (
                <div className="overlay" onClick={() => setShowAvatarPicker(false)}>
                    <div className="avatar-modal" onClick={e => e.stopPropagation()}>
                        <h2>🎀 Change Avatar</h2>

                        <span className="avatar-section-label">Choose a Character</span>
                        <div className="avatar-preset-grid">
                            {PRESET_CHARACTERS.map(c => (
                                <div
                                    key={c.key}
                                    id={`avatar-preset-${c.key}`}
                                    className={`avatar-preset-option ${avatarSelected === c.img ? 'selected' : ''}`}
                                    onClick={() => { setAvatarSelected(c.img); setAvatarPreview(''); }}
                                >
                                    <img src={c.img} alt={c.name} />
                                    <span>{c.name}</span>
                                </div>
                            ))}
                        </div>

                        <span className="avatar-section-label">Or Upload Your Own ✨</span>
                        {avatarPreview ? (
                            <div style={{ textAlign: 'center' }}>
                                <img src={avatarPreview} alt="Preview" className="avatar-upload-preview" />
                                <button
                                    id="avatar-remove-upload"
                                    className="btn-ghost"
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={() => {
                                        setAvatarPreview(''); setAvatarSelected('');
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                >
                                    ✕ Remove
                                </button>
                            </div>
                        ) : (
                            <div className="avatar-upload-zone">
                                <input
                                    id="avatar-file-input"
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                                <span className="avatar-upload-icon">📸</span>
                                <p><span>Click to upload</span> or drag & drop</p>
                                <p style={{ marginTop: '4px', fontSize: '0.72rem', opacity: 0.6 }}>PNG, JPG, WEBP up to 5MB</p>
                            </div>
                        )}

                        <div className="avatar-modal-footer">
                            <button
                                id="avatar-save-btn"
                                className="btn-save-avatar"
                                onClick={handleSaveAvatar}
                                disabled={!avatarSelected || avatarSaving}
                            >
                                {avatarSaving ? 'Saving...' : '💾 Save Avatar'}
                            </button>
                            <button className="btn-cancel" onClick={() => setShowAvatarPicker(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard">
                {/* ===== SIDEBAR ===== */}
                <aside className="sidebar">
                    {/* Profile + Avatar */}
                    <div className="profile-section">
                        <div
                            id="open-avatar-picker"
                            className="profile-avatar-wrapper"
                            onClick={openAvatarPicker}
                            title="Change avatar"
                        >
                            <div className="profile-avatar">
                                <img src={getEffectiveAvatar(user)} alt={user?.character} />
                            </div>
                            <div className="avatar-edit-overlay">
                                <span>📷</span>
                                <span>Change</span>
                            </div>
                        </div>
                        <div className="profile-name">{user?.username}</div>
                        <div className="profile-title">{getLevelTitle(currentLevel)}</div>
                    </div>

                    {/* XP Bar */}
                    <div className="xp-section">
                        <div className="xp-header">
                            <span className="xp-label">Experience ✨</span>
                            <span className="xp-level">⭐ LV.{currentLevel}</span>
                        </div>
                        <div className="xp-bar-track">
                            <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
                        </div>
                        <div className="xp-bar-stars">
                            <span>{totalXP} XP</span>
                            <span>Next: {nextLevelXP} XP</span>
                        </div>
                    </div>

                    {/* Streak */}
                    <div className="streak-section">
                        <div className="streak-flame">🔥</div>
                        <div className="streak-info">
                            <div className="streak-count">{user?.streak || 0}</div>
                            <div className="streak-label">Day Streak</div>
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="achievements-section">
                        <h3>✨ Achievements</h3>
                        <div className="achievements-grid">
                            {ALL_BADGES.map(key => {
                                const earned = achievements.some(a => a.badge_key === key);
                                const badge = BADGE_CONFIG[key];
                                return (
                                    <div key={key} className={`badge ${earned ? 'earned' : 'locked'}`}>
                                        {badge.icon}
                                        <span className="badge-tooltip">{badge.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Logout */}
                    <div style={{ marginTop: 'auto' }}>
                        <button id="logout-btn" className="btn-ghost" style={{ width: '100%' }} onClick={handleLogout}>
                            🌙 Log Out
                        </button>
                    </div>
                </aside>

                {/* ===== MAIN ===== */}
                <main className="main-content">
                    {/* Header */}
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">🌸 Mission Board</h1>
                            <p className="page-subtitle">Your cute little task garden ✨</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-icon">🌱</div>
                            <div className="stat-value">{activeTodos}</div>
                            <div className="stat-label">Active</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🌸</div>
                            <div className="stat-value">{completedTodos}</div>
                            <div className="stat-label">Bloomed</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">⭐</div>
                            <div className="stat-value">{totalXP}</div>
                            <div className="stat-label">Total XP</div>
                        </div>
                    </div>

                    {/* Add Button / Form */}
                    {!showAddForm ? (
                        <div className="add-todo-section">
                            <button id="add-todo-btn" className="add-todo-btn" onClick={() => setShowAddForm(true)}>
                                <span style={{ fontSize: '1.3rem' }}>🌸</span>
                                Plant a New Mission
                            </button>
                        </div>
                    ) : (
                        <div className="add-todo-form">
                            <h3>🌱 New Mission</h3>
                            <form onSubmit={handleAddTodo} id="add-todo-form">
                                <div className="form-group">
                                    <label className="form-label">Mission Name</label>
                                    <input
                                        id="todo-title"
                                        className="form-input"
                                        placeholder="What blooms today? ✨"
                                        value={newTodo.title}
                                        onChange={e => setNewTodo({ ...newTodo, title: e.target.value })}
                                        required autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description (optional)</label>
                                    <input
                                        id="todo-desc"
                                        className="form-input"
                                        placeholder="Add some details..."
                                        value={newTodo.description}
                                        onChange={e => setNewTodo({ ...newTodo, description: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Rank</label>
                                    <div className="priority-grid">
                                        {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                                            <div
                                                key={key}
                                                id={`priority-${key}`}
                                                className={`priority-option ${newTodo.priority === key ? 'selected' : ''}`}
                                                onClick={() => setNewTodo({ ...newTodo, priority: key })}
                                            >
                                                <span className="prio-icon">{val.icon}</span>
                                                <span className="prio-name">{val.name}</span>
                                                <span className="prio-xp">{val.xp}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Due Date (optional)</label>
                                    <input
                                        id="todo-due"
                                        className="form-input"
                                        type="date"
                                        value={newTodo.due_date}
                                        onChange={e => setNewTodo({ ...newTodo, due_date: e.target.value })}
                                    />
                                </div>
                                <div className="form-actions">
                                    <button id="submit-todo" className="btn-submit" type="submit" disabled={addLoading}>
                                        {addLoading ? 'Planting...' : '🌸 Plant Mission'}
                                    </button>
                                    <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="filter-tabs">
                        {(['all', 'active', 'completed'] as const).map(f => (
                            <button
                                key={f}
                                id={`filter-${f}`}
                                className={`filter-tab ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f === 'all' ? '🌿 All' : f === 'active' ? '🌱 Active' : '🌸 Bloomed'}
                            </button>
                        ))}
                    </div>

                    {/* Todos */}
                    <div className="todos-list">
                        {filteredTodos.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">🌸</span>
                                <h3>Nothing here yet!</h3>
                                <p>{filter === 'active' ? 'All missions bloomed! 🌺' : 'Plant your first mission above 🌱'}</p>
                            </div>
                        ) : (
                            filteredTodos.map(todo => (
                                <div
                                    key={todo.id}
                                    className={`todo-card priority-${todo.priority} ${todo.is_completed ? 'completed' : ''} ${completingId === todo.id ? 'completing' : ''}`}
                                >
                                    <button
                                        id={`complete-${todo.id}`}
                                        className={`todo-check ${todo.is_completed ? 'done' : ''}`}
                                        onClick={() => !todo.is_completed && handleComplete(todo.id)}
                                        disabled={todo.is_completed}
                                    >
                                        {todo.is_completed && <span>✓</span>}
                                    </button>
                                    <div className="todo-body">
                                        <div className="todo-title">{todo.title}</div>
                                        {todo.description && <div className="todo-description">{todo.description}</div>}
                                        <div className="todo-meta">
                                            <span className={`todo-priority-badge ${todo.priority}`}>
                                                {PRIORITY_CONFIG[todo.priority].icon} {PRIORITY_CONFIG[todo.priority].name}
                                            </span>
                                            <span className="todo-xp">+{todo.xp_reward} XP ✨</span>
                                            {todo.due_date && (
                                                <span className="todo-due">
                                                    🗓️ {new Date(todo.due_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="todo-actions">
                                        <button
                                            id={`delete-${todo.id}`}
                                            className="btn-icon"
                                            onClick={() => handleDelete(todo.id)}
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
