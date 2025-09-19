import express from "express";
import { validator } from "../utils/validator.js";
import { addRoomDTO, addTermDTO } from "../dto/crud.dto.js";
import CrudController from "../controllers/crudController.js";

const crudRouter = express.Router();

crudRouter.post("/room", validator(addRoomDTO), CrudController.addRoom);

crudRouter.post("/term", validator(addTermDTO), CrudController.addTerm);

export default crudRouter;