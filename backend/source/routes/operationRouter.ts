import express from "express";
import { validator } from "../utils/validator.js";
import { generateScheduleDTO } from "../dto/operation.dto.js";
import OperationController from "../controllers/operationController.js";

const operationRouter = express.Router();

operationRouter.post("/generate", validator(generateScheduleDTO), OperationController.generateSchedule);

export default operationRouter;