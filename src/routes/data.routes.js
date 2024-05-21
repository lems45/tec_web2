import Router from "express-promise-router";
import { getAllData, getHistory } from "../controllers/data.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import { postData } from "../controllers/data.controller.js"

const router = Router();

router.get("/data", getAllData);

router.post("/data", postData);

router.get("/history", isAuth, getHistory);

export default router;