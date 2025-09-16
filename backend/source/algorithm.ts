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
    duration: number; // minutes (60 to 120, in 15 min steps)
    capacity: number;
    level: 'Undergraduate' | 'Graduate' | 'PhD';
    term: number;
}

interface SessionAssignment {
    courseId: string;
    roomId: string;
    day: Day;
    start: string; // e.g., "08:00"
    end: string;   // e.g., "09:30"
}

// NOTE: ScheduleEntry no longer has top-level roomId.
// Each session carries its own roomId.
interface ScheduleEntry {
    courseId: string;
    sessions: { day: Day; start: string; end: string; roomId: string; }[];
}

interface InputData {
    rooms: Room[];
    instructors: Instructor[];
    courses: Course[];
}

interface OutputData {
    schedule: ScheduleEntry[];
}

// ----------------------
// Utility Functions
// ----------------------

const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
};

const minutesToTime = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

// Generate possible start times from 08:00 to 18:00 - duration
const generateTimeSlots = (duration: number): string[] => {
    const slots: string[] = [];
    for (let t = 480; t + duration <= 1080; t += 15) {
        slots.push(minutesToTime(t));
    }
    return slots;
};

const DAYS: Day[] = ["Sat", "Sun", "Mon", "Tue", "Wed"];

// ----------------------
// Main Scheduler
// ----------------------

function scheduleClasses(input: InputData): OutputData | null {
    const schedule: ScheduleEntry[] = [];
    const usedSlots: Map<string, SessionAssignment[]> = new Map();
    const instructorDailyMinutes = new Map<string, Map<Day, number>>();
    const instructorWeeklyMinutes = new Map<string, number>();

    // track occupancy per (day, start) across all rooms to choose least-used times
    const occupancyCount = new Map<string, number>(); // key: `${day}-${start}` -> count

    for (const instructor of input.instructors) {
        instructorDailyMinutes.set(instructor.id, new Map());
        instructorWeeklyMinutes.set(instructor.id, 0);
    }

    // ----------------------
    // isConflict (unchanged)
    // ----------------------
    function isConflict(
        course: Course,
        day: Day,
        start: string,
        end: string,
        roomId: string
    ): boolean {
        const startMin = timeToMinutes(start);
        const endMin = timeToMinutes(end);

        const BUFFER = 15;

        // 1) Room conflict
        const key = `${roomId}-${day}`;
        const sessions = usedSlots.get(key) || [];
        for (const sess of sessions) {
            const s1 = timeToMinutes(sess.start);
            const e1 = timeToMinutes(sess.end);
            if (!(endMin <= s1 || startMin >= e1)) return true;
        }

        // 2) Same level/term conflict
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
                    if (!(endMin + BUFFER <= s1 || e1 + BUFFER <= startMin)) return true;
                }
            }
        }

        // 3) Instructor conflict (same instructor cannot teach two classes at same time)
        for (const entries of usedSlots.values()) {
            for (const sess of entries) {
                if (sess.day !== day) continue;
                const assignedCourse = input.courses.find(c => c.id === sess.courseId);
                if (!assignedCourse) continue;
                if (assignedCourse.instructorId === course.instructorId) {
                    const s1 = timeToMinutes(sess.start);
                    const e1 = timeToMinutes(sess.end);
                    if (!(endMin <= s1 || startMin >= e1)) return true;
                }
            }
        }

        return false;
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

    // helper: increment occupancy count for a (day,start)
    const incOccupancy = (day: Day, start: string) => {
        const k = `${day}-${start}`;
        occupancyCount.set(k, (occupancyCount.get(k) || 0) + 1);
    };
    const getOccupancy = (day: Day, start: string) => occupancyCount.get(`${day}-${start}`) || 0;

    // helper: add tentative session to usedSlots
    const addTentative = (sess: SessionAssignment) => {
        const key = `${sess.roomId}-${sess.day}`;
        usedSlots.set(key, [...(usedSlots.get(key) || []), sess]);
    };
    const removeTentative = (sess: SessionAssignment) => {
        const key = `${sess.roomId}-${sess.day}`;
        usedSlots.set(key, (usedSlots.get(key) || []).filter(s => !(s.courseId === sess.courseId && s.start === sess.start && s.end === sess.end && s.roomId === sess.roomId && s.day === sess.day)));
    };

    // ----------------------
    // Priority: 2-session first, then larger capacity, then id
    // ----------------------
    const coursesSorted = input.courses.slice().sort((a, b) => {
        if (a.sessionCount !== b.sessionCount) return b.sessionCount - a.sessionCount;
        if (a.capacity !== b.capacity) return b.capacity - a.capacity;
        return a.id.localeCompare(b.id);
    });

    // rooms sorted by fit (min wasted capacity first)
    const roomsSortedGlobal = input.rooms.slice().sort((r1, r2) => r1.capacity - r2.capacity);

    for (const course of coursesSorted) {
        const instructor = input.instructors.find(i => i.id === course.instructorId);
        if (!instructor) {
            console.warn(`Instructor ${course.instructorId} not found for course ${course.id}`);
            continue;
        }

        const instrAvailableDays: Day[] = (instructor.availableDays && instructor.availableDays.length)
            ? (instructor.availableDays as Day[])
            : DAYS;

        const dayPairs = generateDayPairs(course.sessionCount);
        const timeSlots = generateTimeSlots(course.duration);

        // Candidate rooms filtered by capacity and sorted by least-waste for this course
        const roomsForCourse = roomsSortedGlobal.filter(r => r.capacity >= course.capacity)
            .sort((a, b) => (a.capacity - course.capacity) - (b.capacity - course.capacity));

        let assigned = false;

        // Sort dayPairs by instructor current load (sum of daily used) ascending to spread load
        const dayPairsSorted = dayPairs.slice().filter(p => {
            if (!p[1]) return instrAvailableDays.includes(p[0]);
            return instrAvailableDays.includes(p[0]) && instrAvailableDays.includes(p[1]!);
        }).sort((pA, pB) => {
            const map = instructorDailyMinutes.get(instructor.id)!;
            const loadA = (map.get(pA[0]) || 0) + (pA[1] ? (map.get(pA[1]!) || 0) : 0);
            const loadB = (map.get(pB[0]) || 0) + (pB[1] ? (map.get(pB[1]!) || 0) : 0);
            return loadA - loadB;
        });

        // For time slots choose those with least occupancy first
        const timeSlotsSorted = timeSlots.slice().sort((t1, t2) => {
            const occ1 = instrAvailableDays.reduce((s, d) => s + getOccupancy(d, t1), 0);
            const occ2 = instrAvailableDays.reduce((s, d) => s + getOccupancy(d, t2), 0);
            return occ1 - occ2;
        });

        // Try each day-pair (or single day)
        for (const [d1, d2] of dayPairsSorted) {
            // check availability
            if (!instrAvailableDays.includes(d1)) continue;
            if (d2 && !instrAvailableDays.includes(d2)) continue;

            // compute instructor used minutes
            const dailyMap = instructorDailyMinutes.get(instructor.id)!;
            const day1Used = dailyMap.get(d1) || 0;
            const day2Used = d2 ? (dailyMap.get(d2) || 0) : 0;
            const weekUsed = instructorWeeklyMinutes.get(instructor.id)!;

            if (day1Used + course.duration > instructor.maxDailyMinutes) continue;
            if (d2 && (day2Used + course.duration > instructor.maxDailyMinutes)) continue;
            if (weekUsed + course.duration * course.sessionCount > instructor.maxWeeklyMinutes) continue;

            // For each time (least used first)
            for (const startTime of timeSlotsSorted) {
                const endTime = minutesToTime(timeToMinutes(startTime) + course.duration);

                if (course.sessionCount === 1) {
                    // try roomsForCourse in least-waste order
                    let placed = false;
                    for (const room of roomsForCourse) {
                        if (isConflict(course, d1, startTime, endTime, room.id)) continue;
                        // commit atomically for this single session
                        const newSess: SessionAssignment = { courseId: course.id, roomId: room.id, day: d1, start: startTime, end: endTime };
                        addTentative(newSess); // tentative add becomes real
                        incOccupancy(d1, startTime);
                        dailyMap.set(d1, (dailyMap.get(d1) || 0) + course.duration);
                        instructorWeeklyMinutes.set(instructor.id, weekUsed + course.duration);
                        // push schedule entry with roomId per session
                        schedule.push({
                            courseId: course.id,
                            sessions: [{ day: d1, start: startTime, end: endTime, roomId: room.id }]
                        });
                        placed = true;
                        assigned = true;
                        break;
                    }
                    if (placed) break; // break time loop
                } else {
                    // sessionCount == 2: need to find rooms for both sessions (can be same or different)
                    let placed = false;
                    // try combinations of rooms (roomsForCourse is usually small)
                    for (const room1 of roomsForCourse) {
                        if (isConflict(course, d1, startTime, endTime, room1.id)) continue;
                        // tentative add first session
                        const sess1: SessionAssignment = { courseId: course.id, roomId: room1.id, day: d1, start: startTime, end: endTime };
                        addTentative(sess1);
                        try {
                            for (const room2 of roomsForCourse) {
                                if (isConflict(course, d2!, startTime, endTime, room2.id)) continue;
                                // both sessions ok -> commit both
                                const sess2: SessionAssignment = { courseId: course.id, roomId: room2.id, day: d2!, start: startTime, end: endTime };
                                addTentative(sess2);
                                // commit: update occupancy and instructor minutes
                                incOccupancy(d1, startTime);
                                incOccupancy(d2!, startTime);
                                dailyMap.set(d1, (dailyMap.get(d1) || 0) + course.duration);
                                dailyMap.set(d2!, (dailyMap.get(d2!) || 0) + course.duration);
                                instructorWeeklyMinutes.set(instructor.id, weekUsed + course.duration * 2);
                                schedule.push({
                                    courseId: course.id,
                                    sessions: [
                                        { day: d1, start: startTime, end: endTime, roomId: room1.id },
                                        { day: d2!, start: startTime, end: endTime, roomId: room2.id }
                                    ]
                                });
                                placed = true;
                                assigned = true;
                                break;
                            }
                            if (placed) break;
                        } finally {
                            if (!placed) {
                                // remove tentative sess1 if we didn't place final
                                removeTentative(sess1);
                            }
                        }
                    }
                    if (placed) break; // break time loop
                } // end sessionCount==2
            } // end timeSlots
            if (assigned) break; // break dayPairs
        } // end dayPairs

        if (!assigned) {
            console.warn(`Unable to schedule course ${course.id}`);
        }
    } // end courses loop

    return { schedule };
}

// ----------------------
// Main
// ----------------------
const inputJson = fs.readFileSync(path.join(ROOT, 'input.json'), 'utf8');
const inputData: InputData = JSON.parse(inputJson);

const result = scheduleClasses(inputData);

if (result) {
    fs.writeFileSync(path.join(ROOT, 'output.json'), JSON.stringify(result, null, 2));
    console.log('Schedule written to output.json');
} else {
    console.log('Unable to find valid schedule.');
}
