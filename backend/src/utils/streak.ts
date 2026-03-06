/**
 * Calculates the updated streak based on last_active date.
 * Call this on login, /me, and todo completion.
 */
export const getStreakUpdate = (
    lastActive: Date | string | null,
    currentStreak: number
): { newStreak: number; todayStr: string; changed: boolean } => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // UTC date YYYY-MM-DD

    if (!lastActive) {
        return { newStreak: 1, todayStr, changed: true };
    }

    const lastStr = new Date(lastActive).toISOString().split('T')[0];

    if (lastStr === todayStr) {
        // Already active today, streak is fine
        return { newStreak: currentStreak, todayStr, changed: false };
    }

    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastStr === yesterdayStr) {
        // Active yesterday → extend streak
        return { newStreak: currentStreak + 1, todayStr, changed: true };
    }

    // Gap of more than 1 day → streak broken
    return { newStreak: 1, todayStr, changed: true };
};
