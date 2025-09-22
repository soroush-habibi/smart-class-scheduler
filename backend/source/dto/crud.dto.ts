import Joi from "joi";
import { levelType, termType } from "@prisma/client";

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
    type: Joi.string().valid(...Object.values(termType)).required(),
}).required();

type addTermDTOType = {
    yearStart: number,
    yearEnd: number,
    type: termType;
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

const addCourseDTO = Joi.object({
    name: Joi.string().max(200).required(),
    instructorTermId: Joi.number().integer().min(1).required(),
    sessionCount: Joi.number().integer().valid(1, 2).required(),
    duration: Joi.number().integer().min(15).custom((value: number, helpers: Joi.CustomHelpers) => {
        if (value % 15 !== 0) return helpers.error("number.invalid");
        return value;
    }).messages({
        "number.invalid": "duration should be multiply of 15!"
    }).required(),
    capacity: Joi.number().integer().min(5).required(),
    level: Joi.string().valid(...Object.values(levelType)).required()
}).required();

type addCourseDTOType = {
    name: string,
    instructorTermId: number,
    sessionCount: number,
    duration: number,
    capacity: number,
    level: levelType,
};

export { addCourseDTO, addCourseDTOType };