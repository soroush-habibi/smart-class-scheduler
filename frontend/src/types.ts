// روزهای قابل انتخاب
export type Day = "Sat" | "Sun" | "Mon" | "Tue" | "Wed";

// استاد
export interface Instructor {
    id: string;                // I1, I2, ...
    name: string;              // نام استاد
    maxDailyMinutes: number;   // حداکثر دقایق روزانه
    maxWeeklyMinutes: number;  // حداکثر دقایق هفتگی
    availableDays: Day[];      // روزهای در دسترس
}

// سطح کلاس
export type Level = "Undergraduate" | "Graduate" | "PhD";

// درس
export interface Course {
    id: string;           // C1, C2, ...
    instructorId: string; // آیدی استاد (I1, I2, ...)
    name: string;         // نام درس
    sessionCount: 1 | 2;      // تعداد سشن (1 یا 2)
    duration: number;     // مدت زمان هر سشن (دقیقه)
    capacity: number;     // ظرفیت کلاس
    level: Level;         // سطح کلاس
    term: number;         // شماره ترم
}

// اتاق
export interface Room {
    id: string;       // R1, R2, ...
    capacity: number; // ظرفیت اتاق
}
