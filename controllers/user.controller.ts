require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import * as jwt from "jsonwebtoken";
import sendMail from "../utils/sendMails";
import { accessTokenOption, refreshTokenOption, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import {
	getAllUserService,
	getUserById,
	updateUserRoleService,
} from "../services/user.service";
import cloudinary from "cloudinary";

// REGISTER USER
interface IUserRegistration {
	name: string;
	email: string;
	password: string;
	avatar?: string;
}

export const registerUser = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { name, email, password } = req.body;

			const isEmailExist = await userModel.find({ email });
			if (isEmailExist.length) {
				return next(new ErrorHandler("Email already exist", 400));
			}
			const user: IUserRegistration = {
				name,
				email,
				password,
			};

			const { token, activationCode } = createActivationToken(user);
			const data = { user: { name: user.name }, activationCode };
			// const html = ejs.renderFile(path.join(__dirname,"../mails/activation-mail.ejs"), data);

			try {
				await sendMail({
					email: user.email,
					subject: `Activate your account`,
					template: `activation-mail.ejs`,
					data,
				});
				res.status(201).json({
					success: true,
					message: `please check your email: ${user.email} to activate your account!`,
					activationToken: token,
				});
			} catch (error: any) {
				return next(new ErrorHandler(error.message, 500));
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

interface IActivationToken {
	token: string;
	activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
	const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
	const token = jwt.sign(
		{
			user,
			activationCode,
		},
		process.env.ACTIVATION_SECRET as jwt.Secret,
		{
			expiresIn: "5m",
		}
	);
	return { token, activationCode };
};

// ACTIVATE USER

interface IActivationRequest {
	activation_token: string;
	activation_code: string;
}

export const activateUser = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { activation_code, activation_token } =
				req.body as IActivationRequest;
			const newUser: { user: IUser; activationCode: string } = jwt.verify(
				activation_token,
				process.env.ACTIVATION_SECRET as string
			) as { user: IUser; activationCode: string };

			if (newUser.activationCode !== activation_code) {
				return next(new ErrorHandler("Invalid activation code", 400));
			}

			const { name, email, password } = newUser.user;

			const userExist = await userModel.find({ email });

			if (userExist.length) {
				return next(new ErrorHandler("Email already exist", 400));
			}

			const user = await userModel.create({ name, email, password });

			res.status(201).json({
				success: true,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// LOGIN USER

interface ILoginRequest {
	email: string;
	password: string;
}

export const loginUser = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { email, password } = req.body as ILoginRequest;
			if (!!!email || !!!password) {
				return next(new ErrorHandler("Please enter email and password", 400));
			}
			const user = await userModel.findOne({ email }).select("+password");

			if (!user) {
				return next(new ErrorHandler("Invalid email and password", 400));
			}

			const isPasswordMatch = await user.comparePassword(password);
			if (!isPasswordMatch) {
				return next(new ErrorHandler("Invalid email and password", 400));
			}

			sendToken(user, 200, res);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// LOGOUT USER
export const logoutUser = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			res.cookie("access_token", "", { maxAge: 1 });
			res.cookie("refresh_token", "", { maxAge: 1 });
			const userId = req.user?._id || "";
			redis.del(userId);
			res.status(200).json({
				success: true,
				message: "Logged out successfully",
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// UPDATE NEW ACCESS TOKEN
export const updateAccessToken = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const refresh_token = req.cookies.refresh_token as string;
			const decoded = jwt.verify(
				refresh_token,
				process.env.REFRESH_TOKEN as string
			) as jwt.JwtPayload;
			const message = "Could not refresh token";
			if (!decoded) {
				return next(new ErrorHandler(message, 400));
			}
			const session = await redis.get(decoded.id as string);
			if (!session) {
				return next(
					new ErrorHandler("Please login to access this resource", 400)
				);
			}
			const user = JSON.parse(session);
			const accessToken = jwt.sign(
				{ id: user._id },
				process.env.ACCESS_TOKEN as string,
				{
					expiresIn: "5m",
				}
			);
			const refreshToken = jwt.sign(
				{ id: user._id },
				process.env.REFRESH_TOKEN as string,
				{
					expiresIn: "3d",
				}
			);

			req.user = user;

			res.cookie("access_token", accessToken, accessTokenOption);
			res.cookie("refresh_token", refreshToken, refreshTokenOption);
			await redis.set(user._id, JSON.stringify(user), "EX", 604800);
			res.status(200).json({
				success: true,
				message: "Success",
				accessToken,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// GET USER INFO
export const getUserInfo = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = req.user?._id;
			getUserById(userId, res);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// SOCIAL AUTH

interface ISocialAuthBody {
	email: string;
	name: string;
	avatar: string;
}

export const socialAuth = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { email, name, avatar } = req.body as ISocialAuthBody;
			const user = await userModel.findOne({ email });
			if (!user) {
				const newUser = await userModel.create({ email, name, avatar });
				sendToken(newUser, 200, res);
			} else {
				sendToken(user, 200, res);
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// UPDATE USER INFO

interface IUpdateUserInfo {
	name?: string;
	email?: string;
}

export const updateUserInfo = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { name, email } = req.body as IUpdateUserInfo;
			const userId = req.user?._id;
			const user = await userModel.findById(userId);
			if (user && email) {
				const isEmailExist = await userModel.findOne({ email });
				if (isEmailExist) {
					return next(new ErrorHandler("Email already exist", 400));
				}
				user.email = email;
			}
			if (user && name) {
				user.name = name;
			}
			await user?.save();
			await redis.set(userId, JSON.stringify(user));
			res.status(201).json({
				success: true,
				user,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// UPDATE USER Password

interface IUpdatePassword {
	oldPassword: string;
	newPassword: string;
}

export const updatePassword = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { oldPassword, newPassword } = req.body as IUpdatePassword;
			if (!!!oldPassword || !!!newPassword) {
				return next(new ErrorHandler("Please enter old and new password", 400));
			}
			const userId = req.user?._id;
			const user = await userModel.findById(userId).select("+password");
			if (user?.password === undefined) {
				return next(new ErrorHandler("Invalid User", 400));
			}
			const isPasswordMatch = await user.comparePassword(oldPassword);
			if (!isPasswordMatch) {
				return next(new ErrorHandler("Invalid Old Password", 400));
			}
			user.password = newPassword;
			await user.save();
			await redis.set(userId, JSON.stringify(user));
			res.status(201).json({
				success: true,
				user,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// UPDATE USER AVATAR

export const updateProfilePicture = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { avatar } = req.body;
			const userId = req.user?._id;

			// Check if avatar is provided and user exists
			if (!avatar) {
				return next(new ErrorHandler("Avatar is required", 400));
			}

			const user = await userModel.findById(userId);
			if (!user) {
				return next(new ErrorHandler("User not found", 404));
			}

			// Destroy previous avatar if exists
			if (user.avatar?.public_id) {
				await cloudinary.v2.uploader.destroy(user.avatar.public_id);
			}

			// Upload new avatar to Cloudinary
			const myCloud = await cloudinary.v2.uploader.upload(avatar, {
				folder: "avatar",
				width: 150,
			});

			// Update user's avatar information
			user.avatar = {
				public_id: myCloud.public_id,
				url: myCloud.secure_url,
			};

			// Save updated user
			await user.save();

			// Update user data in Redis cache
			await redis.set(userId, JSON.stringify(user));

			// Respond with success and updated user data
			res.status(200).json({
				success: true,
				user,
			});
		} catch (error: any) {
			// Handle errors
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// GET ALL USER --ONLY ADMIN
export const getAllUsers = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			getAllUserService(res);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// UPDATE USER ROLE --ONLY ADMIN
export const updateUserRole = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id, role } = req.body;
			updateUserRoleService(res, id, role);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// DELETE USER --ONLY ADMIN
export const deleteUser = CatchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			const user = await userModel.findById(id);
			if (!user) {
				return next(new ErrorHandler("User not found", 404));
			}
			await user.deleteOne({ id });
			await redis.del(id);
			res.status(200).json({
				success: true,
				message: "User deleted successfully",
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);
