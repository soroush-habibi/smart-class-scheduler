import axios from 'axios';
import type { Term, Room, Instructor, InstructorSchedule, Course } from './types';

const api = axios.create({
    baseURL: '', // مقداردهی در زمان اجرا یا از env
    timeout: 10000,
});

// helper: set base url at runtime
export function setBaseURL(url: string) {
    api.defaults.baseURL = url;
}

// Terms
export async function addTerm(payload: { yearStart: number; yearEnd: number; type: 'first' | 'second' | 'summer'; }) {
    const r = await api.post<Term>('/term', payload);
    return r.data;
}

// Rooms
export async function addRoom(payload: { capacity: number; }) {
    const r = await api.post<Room>('/room', payload);
    return r.data;
}

// Instructors
export async function addInstructor(payload: { name: string; }) {
    const r = await api.post<Instructor>('/instructor', payload);
    return r.data;
}

// schedule instructor
export async function scheduleInstructor(instructorId: number, payload: { maxDailyMinutes: number; maxWeeklyMinutes: number; termId: number; availableDays: string[]; }) {
    const r = await api.put<InstructorSchedule>(`/instructor/schedule/${instructorId}`, payload);
    return r.data;
}

// Course
export async function addCourse(payload: { name: string; instructorTermId: number; sessionCount: number; capacity: number; duration: number; level: string; forTerm: number; }) {
    const r = await api.post<Course>('/course', payload);
    return r.data;
}

// Generate
export async function generateSchedule(payload: { termId: number; }) {
    const r = await api.post('/generate', payload);
    return r.data;
}

export default api;
