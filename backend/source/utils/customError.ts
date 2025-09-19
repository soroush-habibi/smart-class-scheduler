export interface errorType {
    name: string,
    code: number,
    httpCode: number,
    message?: string;
}

export enum errorEnum {
    INTERNAL_ERROR = 9999,
    BAD_REQUEST = 400,
    JOI_ERROR = 102,
    TERM_YEAR_INVALID = 103
}

export class CustomErrorClass {
    static internalError(): errorType {
        return {
            name: "INTERNAL_ERROR",
            code: errorEnum.INTERNAL_ERROR,
            httpCode: 500
        };
    }

    static joiError(message: any): errorType {
        return {
            name: "JOI_ERROR",
            code: errorEnum.JOI_ERROR,
            httpCode: 400,
            message: message
        };
    }

    static badRequest(): errorType {
        return {
            name: "BAD_REQUEST",
            code: errorEnum.BAD_REQUEST,
            httpCode: 400
        };
    }

    static termYearInvalid(): errorType {
        return {
            name: "TERM_YEAR_INVALID",
            code: errorEnum.TERM_YEAR_INVALID,
            httpCode: 400
        };
    }
}