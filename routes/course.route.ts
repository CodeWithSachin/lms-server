import { Router } from "express";

import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { updateCourse, uploadCourse } from "../controllers/course.controller";
const courseRouter = Router();

courseRouter.post(
	"/create-course",
	isAuthenticated,
	authorizeRoles("admin"),
	uploadCourse
);
courseRouter.put(
	"/edit-course/:id",
	isAuthenticated,
	authorizeRoles("admin"),
	updateCourse
);

export default courseRouter;
