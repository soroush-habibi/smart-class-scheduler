import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import crudRouter from "./routes/crudRouter.js";
import prisma from "@prisma/client";
import { errorEnum, errorType } from "./utils/customError.js";
import operationRouter from "./routes/operationRouter.js";

const app = express();

declare global {
    namespace Express {
        interface Request {
            prisma: prisma.PrismaClient;
        }
    }
}

const Prisma = new prisma.PrismaClient();
app.use((req: Request, res: Response, next: NextFunction) => {
    req.prisma = Prisma;
    next();
});

app.use(express.json());
app.use(express.urlencoded());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(crudRouter);
app.use(operationRouter);

app.use((err: errorType | Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof Error) {
        res.status(500).json({
            name: "INTERNAL ERROR",
            code: errorEnum.INTERNAL_ERROR
        });
    } else {
        res.status(err.httpCode).json({
            name: err.name,
            code: err.code,
            message: err.message
        });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`App is running on port ${process.env.PORT || 3000}`);
});