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
userRouter.get("/logout", isAuthenticated, logoutUser);
userRouter.get("/refresh-token", updateAccessToken);
userRouter.get("/me", isAuthenticated, getUserInfo);
userRouter.post("/social-auth", socialAuth);
userRouter.put("/update-user", isAuthenticated, updateUserInfo);
userRouter.put("/update-password", isAuthenticated, updatePassword);
userRouter.put("/update-avatar", isAuthenticated, updateProfilePicture);
userRouter.get(
	"/get-users",
	isAuthenticated,
	authorizeRoles("admin"),
	getAllUsers
);
userRouter.put(
	"/update-user-role",
	isAuthenticated,
	authorizeRoles("admin"),
	updateUserRole
);
userRouter.delete(
	"/delete-user/:id",
	isAuthenticated,
	authorizeRoles("admin"),
	deleteUser
);

export default userRouter;
