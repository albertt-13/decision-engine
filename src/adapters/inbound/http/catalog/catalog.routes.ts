import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { catalogController } from "./catalog.controller.js";

export const catalogRouter = Router();

catalogRouter.get("/", requireAuth, catalogController.list);
catalogRouter.post("/sync", requireAuth, catalogController.sync);
