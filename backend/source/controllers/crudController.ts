import { NextFunction, Request, Response } from "express";
import { addCourseDTOType, addInstructorDTOType, addRoomDTOType, addTermDTOType, getInstructorsDTOType, getInstructorTermsDTOType, getRoomsDTOType, getTermsDTOType, scheduleInstructorDTOType, scheduleInstructorParamsDTOType } from "../dto/crud.dto.js";
import { CustomErrorClass } from "../utils/customError.js";
import { termType } from "@prisma/client";

export default class CrudController {
    static async addRoom(req: Request, res: Response, next: NextFunction) {
        const body = req.body as addRoomDTOType;

        try {
            const result = await req.prisma.room.create({
                data: {
                    capacity: body.capacity
                }
            });

            res.status(201).json({
                message: "room created!",
                data: result.id
            });
        } catch (e: any) {
            if (e.code === "P2002") return next(CustomErrorClass.duplicate());
            return next(CustomErrorClass.internalError());
        }
    }

    static async getRooms(req: Request, res: Response, next: NextFunction) {
        const query = req.query as getRoomsDTOType;
        if (!query.limit) query.limit = "10";

        try {
            const result = await req.prisma.room.findMany({
                skip: (Number(query.page) - 1) * Number(query.limit),
                take: Number(query.limit),
                orderBy: {
                    id: "desc"
                }
            });

            res.status(200).json({
                message: "rooms list:",
                data: result
            });
        } catch (e: any) {
            return next(CustomErrorClass.internalError());
        }
    }

    static async addTerm(req: Request, res: Response, next: NextFunction) {
        const body = req.body as addTermDTOType;

        try {
            if (body.type === termType.summer) {
                if (body.yearStart !== body.yearEnd) return next(CustomErrorClass.termYearInvalid());
            } else {
                if (body.yearEnd - body.yearStart !== 1) return next(CustomErrorClass.termYearInvalid());
            }

            const result = await req.prisma.term.create({
                data: {
                    yearStart: body.yearStart,
                    yearEnd: body.yearEnd,
                    type: body.type
                }
            });

            res.status(201).json({
                message: "term created!",
                data: result.id
            });
        } catch (e: any) {
            if (e.code === "P2002") return next(CustomErrorClass.duplicate());
            return next(CustomErrorClass.internalError());
        }
    }

    static async getTerms(req: Request, res: Response, next: NextFunction) {
        const query = req.query as getTermsDTOType;
        if (!query.limit) query.limit = "10";

        try {
            const result = await req.prisma.term.findMany({
                skip: (Number(query.page) - 1) * Number(query.limit),
                take: Number(query.limit),
                orderBy: {
                    id: "desc"
                }
            });

            res.status(200).json({
                message: "terms list:",
                data: result
            });
        } catch (e: any) {
            return next(CustomErrorClass.internalError());
        }
    }

    static async addInstructor(req: Request, res: Response, next: NextFunction) {
        const body = req.body as addInstructorDTOType;

        try {
            const result = await req.prisma.instructor.create({
                data: {
                    name: body.name
                }
            });

            res.status(201).json({
                message: "instructor created!",
                data: result.id
            });
        } catch (e: any) {
            if (e.code === "P2002") return next(CustomErrorClass.duplicate());
            return next(CustomErrorClass.internalError());
        }
    }

    static async getInstructors(req: Request, res: Response, next: NextFunction) {
        const query = req.query as getInstructorsDTOType;
        if (!query.limit) query.limit = "10";

        try {
            const result = await req.prisma.instructor.findMany({
                skip: (Number(query.page) - 1) * Number(query.limit),
                take: Number(query.limit),
                orderBy: {
                    id: "desc"
                }
            });

            res.status(200).json({
                message: "instructors list:",
                data: result
            });
        } catch (e: any) {
            return next(CustomErrorClass.internalError());
        }
    }

    static async scheduleInstructor(req: Request, res: Response, next: NextFunction) {
        const body = req.body as scheduleInstructorDTOType;
        const params = req.params as scheduleInstructorParamsDTOType;

        try {
            const result = await req.prisma.instructorTerm.create({
                data: {
                    maxDailyMinutes: body.maxDailyMinutes,
                    maxWeeklyMinutes: body.maxWeeklyMinutes,
                    availableDays: body.availableDays,
                    termId: body.termId,
                    instructorId: Number(params.instructorId)
                }
            });

            res.status(201).json({
                message: "instructor created!",
                data: result.id
            });
        } catch (e: any) {
            if (e.code === "P2003") return next(CustomErrorClass.notFound(`foreign key not found: ${e.meta.constraint}`));
            if (e.code === "P2002") return next(CustomErrorClass.duplicate());
            return next(CustomErrorClass.internalError());
        }
    }

    static async getInstructorTerms(req: Request, res: Response, next: NextFunction) {
        const query = req.query as getInstructorTermsDTOType;
        if (!query.limit) query.limit = "10";

        try {
            const result = await req.prisma.instructorTerm.findMany({
                where: {
                    termId: Number(query.termId)
                },
                skip: (Number(query.page) - 1) * Number(query.limit),
                take: Number(query.limit),
                include: {
                    instructor: {
                        select: {
                            name: true
                        }
                    }
                },
                omit: {
                    termId: true,
                    instructorId: true,
                    maxDailyMinutes: true,
                    maxWeeklyMinutes: true,
                    availableDays: true
                },
                orderBy: {
                    id: "desc"
                }
            });

            res.status(200).json({
                message: "instructorTerms list:",
                data: result.map((value) => {
                    const { instructor, ...rest } = value;
                    return {
                        ...rest,
                        name: instructor.name
                    };
                })
            });
        } catch (e: any) {
            return next(CustomErrorClass.internalError());
        }
    }

    static async addCourse(req: Request, res: Response, next: NextFunction) {
        const body = req.body as addCourseDTOType;

        try {
            const result = await req.prisma.course.create({
                data: {
                    name: body.name,
                    instructorTermId: body.instructorTermId,
                    sessionCount: body.sessionCount,
                    duration: body.duration,
                    capacity: body.capacity,
                    level: body.level,
                    forTerm: body.forTerm
                }
            });

            res.status(201).json({
                message: "course created!",
                data: result.id
            });
        } catch (e: any) {
            if (e.code === "P2003") return next(CustomErrorClass.notFound(`foreign key not found: ${e.meta.constraint}`));
            if (e.code === "P2002") return next(CustomErrorClass.duplicate());
            return next(CustomErrorClass.internalError());
        }
    }
}