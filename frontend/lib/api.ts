import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    withCredentials: true,
});

// Auth
export const register = (data: { username: string; email: string; password: string; character: string }) =>
    api.post('/api/auth/register', data);

export const login = (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data);

export const logout = () => api.post('/api/auth/logout');

export const getMe = () => api.get('/api/auth/me');
export const updateAvatar = (avatar_url: string) => api.patch('/api/auth/avatar', { avatar_url });

// Todos
export const getTodos = () => api.get('/api/todos');

export const createTodo = (data: { title: string; description?: string; priority: string; due_date?: string }) =>
    api.post('/api/todos', data);

export const completeTodo = (id: string) => api.patch(`/api/todos/${id}/complete`);

export const updateTodo = (id: string, data: { title: string; description?: string; priority: string; due_date?: string }) =>
    api.put(`/api/todos/${id}`, data);

export const deleteTodo = (id: string) => api.delete(`/api/todos/${id}`);

export const getAchievements = () => api.get('/api/todos/achievements');

export default api;
