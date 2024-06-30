import { Router } from "express";

import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
	getNotification,
	updateNotification,
} from "../controllers/notification.controller";

const notificationRouter = Router();

notificationRouter.get(
	"/get-all-notification",
	isAuthenticated,
	authorizeRoles("admin"),
	getNotification
);
notificationRouter.put(
	"/update-notification/:id",
	isAuthenticated,
	authorizeRoles("admin"),
	updateNotification
);

export default notificationRouter;
