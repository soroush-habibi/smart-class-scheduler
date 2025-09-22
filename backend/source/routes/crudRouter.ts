import express from "express";
import { FieldType, validator } from "../utils/validator.js";
import { addCourseDTO, addInstructorDTO, addRoomDTO, addTermDTO, scheduleInstructorDTO, scheduleInstructorParamsDTO } from "../dto/crud.dto.js";
import CrudController from "../controllers/crudController.js";

const crudRouter = express.Router();

crudRouter.post("/room", validator(addRoomDTO), CrudController.addRoom);

crudRouter.post("/term", validator(addTermDTO), CrudController.addTerm);

crudRouter.post("/instructor", validator(addInstructorDTO), CrudController.addInstructor);
crudRouter.put("/instructor/schedule/:instructorId", validator(scheduleInstructorParamsDTO, FieldType.PARAMS), validator(scheduleInstructorDTO), CrudController.scheduleInstructor);

crudRouter.post("/course", validator(addCourseDTO), CrudController.addCourse);

export default crudRouter;