// src/types.ts
export type Day = 'Sat' | 'Sun' | 'Mon' | 'Tue' | 'Wed';
export type TermSeason = 'first' | 'second' | 'summer';
export type Level = 'Undergraduate' | 'Graduate' | 'PhD';

export interface Term {
    id: number;           // سرور باید اینو برگردونه
    yearStart: number;
    yearEnd: number;
    type: TermSeason;
}

export interface Room {
    id: number;
    capacity: number;
}

export interface Instructor {
    id: number;
    name: string;
}

export interface InstructorSchedule {
    instructorTermId?: number;
    id?: number;
    maxDailyMinutes?: number;
    maxWeeklyMinutes?: number;
    termId?: number;
    availableDays?: Day[];
}

export interface Course {
    id: number;
    name: string;
    instructorTermId?: number;
    sessionCount?: number;
    capacity?: number;
    duration?: number;
    level?: string;
    forTerm?: number;
}
