import { NextFunction, Request, Response } from "express";
import { addRoomDTOType, addTermDTOType, termTypeEnum } from "../dto/crud.dto.js";
import { CustomErrorClass } from "../utils/customError.js";

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
        } catch (e) {
            return next(CustomErrorClass.internalError());
        }
    }

    static async addTerm(req: Request, res: Response, next: NextFunction) {
        const body = req.body as addTermDTOType;

        try {
            if (body.type === termTypeEnum.summer) {
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
        } catch (e) {
            return next(CustomErrorClass.internalError());
        }
    }
}