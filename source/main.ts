import * as fs from 'fs';
import path from "path";
import { fileURLToPath } from 'url';

let temp: string[] = path.dirname(fileURLToPath(import.meta.url)).split('');
temp.splice(temp.length - 6);
const ROOT = temp.join('');
process.env.ROOT = ROOT;

type Day = 'Sat' | 'Sun' | 'Mon' | 'Tue' | 'Wed';

interface Room {
    id: string;
    capacity: number;
}

interface Instructor {
    id: string;
    name: string;
    maxDailyMinutes: number;
    maxWeeklyMinutes: number;
    availableDays?: Day[];
}

interface Course {
    id: string;
    name: string;
    instructorId: string;
    sessionCount: 1 | 2;
    duration: number;
    capacity: number;
    level: 'Undergraduate' | 'Graduate' | 'PhD';
    term: number;
}

interface SessionAssignment {
    courseId: string;
    roomId: string;
    day: Day;
    start: string;
    end: string;
}

interface ScheduleEntry {
    courseId: string;
    roomId: string;
    sessions: { day: Day; start: string; end: string; }[];
}

interface InputData {
    rooms: Room[];
    instructors: Instructor[];
    courses: Course[];
}

interface OutputData {
    schedule: ScheduleEntry[];
}

const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
};

const minutesToTime = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

const generateTimeSlots = (duration: number): string[] => {
    const slots: string[] = [];
    for (let t = 480; t + duration <= 1080; t += 15) {
        slots.push(minutesToTime(t));
    }
    return slots;
};

const DAYS: Day[] = ["Sat", "Sun", "Mon", "Tue", "Wed"];

function scheduleClasses(input: InputData): OutputData | null {
    const schedule: ScheduleEntry[] = [];
    const usedSlots: Map<string, SessionAssignment[]> = new Map();
    const instructorDailyMinutes = new Map<string, Map<Day, number>>();
    const instructorWeeklyMinutes = new Map<string, number>();

    for (const instructor of input.instructors) {
        instructorDailyMinutes.set(instructor.id, new Map());
        instructorWeeklyMinutes.set(instructor.id, 0);
    }

    function isConflict(
        course: Course,
        day: Day,
        start: string,
        end: string,
        roomId: string
    ): boolean {
        const startMin = timeToMinutes(start);
        const endMin = timeToMinutes(end);

        const key = `${roomId}-${day}`;
        const sessions = usedSlots.get(key) || [];
        for (const sess of sessions) {
            const s1 = timeToMinutes(sess.start);
            const e1 = timeToMinutes(sess.end);
            if (!(endMin + 15 <= s1 || startMin >= e1 + 15)) return true;
        }

        for (const entries of usedSlots.values()) {
            for (const sess of entries) {
                if (sess.day !== day) continue;
                const assignedCourse = input.courses.find(c => c.id === sess.courseId);
                if (!assignedCourse) continue;
                if (
                    assignedCourse.id !== course.id &&
                    assignedCourse.term === course.term &&
                    assignedCourse.level === course.level
                ) {
                    const s1 = timeToMinutes(sess.start);
                    const e1 = timeToMinutes(sess.end);
                    if (!(endMin + 15 <= s1 || startMin >= e1 + 15)) return true;
                }
            }
        }

        return false;
    }

    function assign(courseIndex: number): boolean {
        if (courseIndex === input.courses.length) return true;
        const course = input.courses[courseIndex];
        const instructor = input.instructors.find(i => i.id === course.instructorId);
        if (!instructor) return false;

        const sessionDaysCombos = generateDayPairs(course.sessionCount);
        const timeSlots = generateTimeSlots(course.duration);

        const instrAvailableDays: Day[] = (instructor.availableDays && instructor.availableDays.length)
            ? (instructor.availableDays as Day[])
            : DAYS;

        for (const room of input.rooms) {
            if (room.capacity < course.capacity) continue;

            for (const [day1, day2] of sessionDaysCombos) {
                if (!instrAvailableDays.includes(day1)) continue;
                if (day2 && !instrAvailableDays.includes(day2)) continue;

                for (const startTime of timeSlots) {
                    const endTime = minutesToTime(timeToMinutes(startTime) + course.duration);

                    const daily1 = instructorDailyMinutes.get(instructor.id)!;
                    const day1Used = daily1.get(day1) || 0;
                    const weekUsed = instructorWeeklyMinutes.get(instructor.id)!;

                    if (day1Used + course.duration > instructor.maxDailyMinutes) continue;
                    if (weekUsed + course.duration * course.sessionCount > instructor.maxWeeklyMinutes) continue;

                    if (isConflict(course, day1, startTime, endTime, room.id)) continue;
                    if (course.sessionCount === 2 && isConflict(course, day2!, startTime, endTime, room.id)) continue;

                    const sessions: SessionAssignment[] = [
                        { courseId: course.id, roomId: room.id, day: day1, start: startTime, end: endTime },
                    ];
                    if (course.sessionCount === 2) {
                        sessions.push({ courseId: course.id, roomId: room.id, day: day2!, start: startTime, end: endTime });
                    }

                    for (const sess of sessions) {
                        const k = `${sess.roomId}-${sess.day}`;
                        usedSlots.set(k, [...(usedSlots.get(k) || []), sess]);
                        const dMap = instructorDailyMinutes.get(instructor.id)!;
                        dMap.set(sess.day, (dMap.get(sess.day) || 0) + course.duration);
                    }
                    instructorWeeklyMinutes.set(
                        instructor.id,
                        instructorWeeklyMinutes.get(instructor.id)! + course.duration * course.sessionCount
                    );

                    schedule.push({ courseId: course.id, roomId: room.id, sessions });

                    if (assign(courseIndex + 1)) return true;

                    schedule.pop();
                    for (const sess of sessions) {
                        const k = `${sess.roomId}-${sess.day}`;
                        usedSlots.set(
                            k,
                            (usedSlots.get(k) || []).filter(s => s.courseId !== course.id)
                        );
                        const dMap = instructorDailyMinutes.get(instructor.id)!;
                        dMap.set(sess.day, dMap.get(sess.day)! - course.duration);
                    }
                    instructorWeeklyMinutes.set(
                        instructor.id,
                        instructorWeeklyMinutes.get(instructor.id)! - course.duration * course.sessionCount
                    );
                }
            }
        }

        return false;
    }

    const ok = assign(0);
    return ok ? { schedule } : null;
}

function generateDayPairs(sessionCount: 1 | 2): [Day, Day?][] {
    if (sessionCount === 1) return DAYS.map(day => [day]);
    const pairs: [Day, Day][] = [];
    for (let i = 0; i < DAYS.length; i++) {
        for (let j = i + 1; j < DAYS.length; j++) {
            pairs.push([DAYS[i], DAYS[j]]);
        }
    }
    return pairs;
}

const inputJson = fs.readFileSync(path.join(ROOT, 'input.json'), 'utf8');
const inputData: InputData = JSON.parse(inputJson);

const result = scheduleClasses(inputData);

if (result) {
    fs.writeFileSync(path.join(ROOT, 'output.json'), JSON.stringify(result, null, 2));
    console.log('Schedule written to output.json');
} else {
    console.log('Unable to find valid schedule.');
}