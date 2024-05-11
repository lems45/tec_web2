import Router from "express-promise-router";
import { getAllData } from "../controllers/data.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/data", getAllData);

export default router;