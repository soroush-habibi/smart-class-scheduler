import { ObjectSchema } from 'joi';
import { Response, Request, NextFunction } from "express";
import { CustomErrorClass } from './customError.js';

export enum FieldType {
    "QUERY" = "query",
    "BODY" = "body",
    "PARAMS" = "params"
}

export const validator = (templateObj: ObjectSchema<any>, fieldType: FieldType = FieldType.BODY) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dataToBeValidate = req[fieldType];

            const validate = templateObj.validate(dataToBeValidate);

            if (validate.error) throw validate.error;

            next();
        } catch (e: any) {
            if (typeof (e._original) === 'object') {
                const message = [];
                for (let i of e.details) {
                    message.push({
                        message: i.message
                    });
                }
                return next(CustomErrorClass.joiError(message));
            } else {
                return next(CustomErrorClass.internalError());
            }
        }
    };
};