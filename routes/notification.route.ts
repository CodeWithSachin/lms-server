import { Router } from "express";

import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
	getNotification,
	updateNotification,
} from "../controllers/notification.controller";
import { updateAccessToken } from "../controllers/user.controller";

const notificationRouter = Router();

notificationRouter.get(
	"/get-all-notification",
	updateAccessToken,
	isAuthenticated,
	authorizeRoles("admin"),
	getNotification
);
notificationRouter.put(
	"/update-notification/:id",
	updateAccessToken,
	isAuthenticated,
	authorizeRoles("admin"),
	updateNotification
);

export default notificationRouter;
