import Joi from "joi";
import { $Enums } from "@prisma/client";

const addRoomDTO = Joi.object({
    capacity: Joi.number().integer().min(5).max(200).required()
}).required();

type addRoomDTOType = {
    capacity: number;
};

export { addRoomDTO, addRoomDTOType };

const addTermDTO = Joi.object({
    yearStart: Joi.number().integer().min(1395).required(),
    yearEnd: Joi.number().integer().min(1395).required(),
    type: Joi.string().valid(...Object.values($Enums.termType)).required(),
}).required();

type addTermDTOType = {
    yearStart: number,
    yearEnd: number,
    type: $Enums.termType;
};

export { addTermDTO, addTermDTOType };

const addInstructorDTO = Joi.object({
    name: Joi.string().max(200).required()
}).required();

type addInstructorDTOType = {
    name: string;
};

export { addInstructorDTO, addInstructorDTOType };

const scheduleInstructorDTO = Joi.object({
    maxDailyMinutes: Joi.number().integer().min(60).required(),
    maxWeeklyMinutes: Joi.number().integer().min(120).required(),
    availableDays: Joi.array().items(Joi.string().valid('Sat', 'Sun', 'Mon', 'Tue', 'Wed')).optional(),
    termId: Joi.number().integer().min(1).required(),
}).required();

type scheduleInstructorDTOType = {
    maxDailyMinutes: number,
    maxWeeklyMinutes: number,
    availableDays?: string[],
    termId: number,
};

const scheduleInstructorParamsDTO = Joi.object({
    instructorId: Joi.number().integer().min(1).required()
}).required();

type scheduleInstructorParamsDTOType = {
    instructorId: string,
};

export { scheduleInstructorDTO, scheduleInstructorDTOType, scheduleInstructorParamsDTO, scheduleInstructorParamsDTOType };