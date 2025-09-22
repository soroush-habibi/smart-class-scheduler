import Joi from "joi";

const generateScheduleDTO = Joi.object({
    termId: Joi.number().integer().min(1).required(),
}).required();

type generateScheduleDTOType = {
    termId: number;
};

export { generateScheduleDTO, generateScheduleDTOType };