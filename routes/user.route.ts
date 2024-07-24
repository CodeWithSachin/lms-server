import { Router } from "express";
import {
	activateUser,
	deleteUser,
	getAllUsers,
	getUserInfo,
	loginUser,
	logoutUser,
	registerUser,
	socialAuth,
	updateAccessToken,
	updatePassword,
	updateProfilePicture,
	updateUserInfo,
	updateUserRole,
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const userRouter = Router();

userRouter.post("/register-user", registerUser);
userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", updateAccessToken, isAuthenticated, logoutUser);
userRouter.get("/refresh-token", updateAccessToken);
userRouter.get("/me", updateAccessToken, isAuthenticated, getUserInfo);
userRouter.post("/social-auth", socialAuth);
userRouter.put(
	"/update-user",
	updateAccessToken,
	isAuthenticated,
	updateUserInfo
);
userRouter.put(
	"/update-password",
	updateAccessToken,
	isAuthenticated,
	updatePassword
);
userRouter.put(
	"/update-avatar",
	updateAccessToken,
	isAuthenticated,
	updateProfilePicture
);
userRouter.get(
	"/get-users",
	updateAccessToken,
	isAuthenticated,
	authorizeRoles("admin"),
	getAllUsers
);
userRouter.put(
	"/update-user-role",
	updateAccessToken,
	isAuthenticated,
	authorizeRoles("admin"),
	updateUserRole
);
userRouter.delete(
	"/delete-user/:id",
	updateAccessToken,
	isAuthenticated,
	authorizeRoles("admin"),
	deleteUser
);

export default userRouter;
