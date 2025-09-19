import Joi from "joi";

const addRoomDTO = Joi.object({
    capacity: Joi.number().integer().min(5).max(200).required()
}).required();

type addRoomDTOType = {
    capacity: number;
};

export { addRoomDTO, addRoomDTOType };

enum termTypeEnum { first = "first", second = "second", summer = "summer" }

const addTermDTO = Joi.object({
    yearStart: Joi.number().integer().min(1395).required(),
    yearEnd: Joi.number().integer().min(1395).required(),
    type: Joi.string().valid(...Object.values(termTypeEnum)).required(),
}).required();

type addTermDTOType = {
    yearStart: number,
    yearEnd: number,
    type: termTypeEnum;
};

export { termTypeEnum, addTermDTO, addTermDTOType };