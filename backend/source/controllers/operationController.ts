import { NextFunction, Request, Response } from "express";
import { generateScheduleDTOType } from "../dto/operation.dto.js";
import { CustomErrorClass } from "../utils/customError.js";
import { scheduleClasses } from "../algorithm.js";

export default class OperationController {
    static async generateSchedule(req: Request, res: Response, next: NextFunction) {
        const body = req.body as generateScheduleDTOType;

        try {
            const rooms = await req.prisma.room.findMany({});
            const instructors = await req.prisma.instructorTerm.findMany({
                where: {
                    termId: body.termId
                },
                include: {
                    instructor: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                omit: {
                    termId: true,
                    instructorId: true
                }
            });
            const formattedRooms = rooms.map((value) => {
                const { id, ...rest } = value;
                return {
                    ...rest,
                    id: String(id)
                };
            });
            const formattedInstructors = instructors.map((value) => {
                const { instructor, id, availableDays, ...rest } = value;
                return {
                    ...rest,
                    availableDays: availableDays || undefined,
                    id: String(value.instructor.id),
                    name: value.instructor.name
                };
            });

            const courses = await req.prisma.course.findMany({
                where: {
                    instructor: {
                        termId: body.termId
                    }
                },
                include: {
                    instructor: {
                        select: {
                            instructorId: true
                        }
                    }
                },
                omit: {
                    instructorTermId: true
                }
            });
            const formattedCourses = courses.map((value) => {
                const { id, instructor, forTerm, ...rest } = value;
                return {
                    ...rest,
                    id: String(id),
                    instructorId: String(instructor.instructorId),
                    term: forTerm
                };
            });

            const formattedInput = {
                rooms: formattedRooms,
                instructors: formattedInstructors,
                courses: formattedCourses
            };

            const schedule = scheduleClasses(formattedInput as any);

            res.status(200).json({
                message: "schedule generated:",
                data: schedule
            });
        } catch (e: any) {
            if (e.code === "P2003") return next(CustomErrorClass.notFound(`foreign key not found: ${e.meta.constraint}`));
            if (e.code === "P2002") return next(CustomErrorClass.duplicate());
            return next(CustomErrorClass.internalError());
        }
    }
}