export type Day = 'Sat' | 'Sun' | 'Mon' | 'Tue' | 'Wed';
export type TermSeason = 'First' | 'Second' | 'Summer';
export type Level = 'Graduate' | 'Undergraduate' | 'PhD';

export interface Term {
    id: string;
    yearStart: number;
    yearEnd: number;
    season: TermSeason;
}

export interface Instructor {
    id: string;
    name: string;
    maxDailyMinutes: number;
    maxWeeklyMinutes: number;
    availableDays: Day[];
}

export interface Course {
    id: string;
    name: string;
    instructorId: string;
    sessions: number; // 1 یا 2
    duration: number; // دقیقه
    capacity: number;
    level: Level;
    termId: string;
}

export interface Room {
    id: string;
    capacity: number;
}
