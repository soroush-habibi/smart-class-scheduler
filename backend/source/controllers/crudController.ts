import { NextFunction, Request, Response } from "express";
import { addInstructorDTOType, addRoomDTOType, addTermDTOType, scheduleInstructorDTOType, scheduleInstructorParamsDTOType } from "../dto/crud.dto.js";
import { CustomErrorClass } from "../utils/customError.js";
import { $Enums, Prisma } from "@prisma/client";

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

    static async addTerm(req: Request, res: Response, next: NextFunction) {
        const body = req.body as addTermDTOType;

        try {
            if (body.type === $Enums.termType.summer) {
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
}