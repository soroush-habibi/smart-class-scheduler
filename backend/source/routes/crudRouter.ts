import express from "express";
import { FieldType, validator } from "../utils/validator.js";
import { addCourseDTO, addInstructorDTO, addRoomDTO, addTermDTO, deleteCourseDTO, getCoursesDTO, getInstructorsDTO, getInstructorTermsDTO, getRoomsDTO, getTermsDTO, scheduleInstructorDTO, scheduleInstructorParamsDTO } from "../dto/crud.dto.js";
import CrudController from "../controllers/crudController.js";

const crudRouter = express.Router();

crudRouter.post("/room", validator(addRoomDTO), CrudController.addRoom);
crudRouter.get("/room", validator(getRoomsDTO, FieldType.QUERY), CrudController.getRooms);

crudRouter.post("/term", validator(addTermDTO), CrudController.addTerm);
crudRouter.get("/term", validator(getTermsDTO, FieldType.QUERY), CrudController.getTerms);

crudRouter.post("/instructor", validator(addInstructorDTO), CrudController.addInstructor);
crudRouter.get("/instructor", validator(getInstructorsDTO, FieldType.QUERY), CrudController.getInstructors);
crudRouter.put("/instructor/schedule/:instructorId", validator(scheduleInstructorParamsDTO, FieldType.PARAMS), validator(scheduleInstructorDTO), CrudController.scheduleInstructor);
crudRouter.get("/instructor/term", validator(getInstructorTermsDTO, FieldType.QUERY), CrudController.getInstructorTerms);

crudRouter.post("/course", validator(addCourseDTO), CrudController.addCourse);
crudRouter.get("/course", validator(getCoursesDTO, FieldType.QUERY), CrudController.getCourses);
crudRouter.delete("/course/:id", validator(deleteCourseDTO, FieldType.PARAMS), CrudController.deleteCourse);

export default crudRouter;