import { Router } from "express";

import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
	addAnswer,
	addQuestion,
	addReplyToReview,
	addReview,
	deleteCourse,
	generateVideoUrl,
	getAllCourse,
	getAdminCourses,
	getCourseByUser,
	getSingleCourse,
	updateCourse,
	uploadCourse,
} from "../controllers/course.controller";
import { updateAccessToken } from "../controllers/user.controller";
const courseRouter = Router();

courseRouter.post(
	"/create-course",
	updateAccessToken,
	isAuthenticated,
	authorizeRoles("admin"),
	uploadCourse
);
courseRouter.put(
	"/edit-course/:id",
	updateAccessToken,
	isAuthenticated,
	authorizeRoles("admin"),
	updateCourse
);
courseRouter.get("/get-course/:id", getSingleCourse);
courseRouter.get("/get-courses", getAllCourse);
courseRouter.get(
	"/get-course-content/:id",
	updateAccessToken,
	isAuthenticated,
	getCourseByUser
);
courseRouter.put(
	"/add-question",
	updateAccessToken,
	isAuthenticated,
	addQuestion
);
courseRouter.put("/add-answer", updateAccessToken, isAuthenticated, addAnswer);
courseRouter.put(
	"/add-review/:id",
	updateAccessToken,
	isAuthenticated,
	addReview
);
courseRouter.put(
	"/add-reply",

	updateAccessToken,
	isAuthenticated,
	authorizeRoles("admin"),
	addReplyToReview
);
courseRouter.get(
	"/get-all-courses",
	updateAccessToken,
	isAuthenticated,
	authorizeRoles("admin"),
	getAdminCourses
);
courseRouter.delete(
	"/delete-course/:id",
	updateAccessToken,
	isAuthenticated,
	authorizeRoles("admin"),
	deleteCourse
);
courseRouter.post("/generateVideoUrl", generateVideoUrl);

export default courseRouter;
