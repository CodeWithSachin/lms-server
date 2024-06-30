import { Response } from "express";
import { redis } from "../utils/redis";
import userModel from "../models/user.model";

// GET USER INFO BY ID
export const getUserById = async (id: string, res: Response) => {
	const userJson = await redis.get(id);
	if (userJson) {
		const user = JSON.parse(userJson);
		res.status(200).json({
			success: true,
			user,
		});
	}
};

// GET ALL USER --ONLY ADMIN
export const getAllUserService = async (res: Response) => {
	const user = await userModel.find().sort({ createdAt: -1 });
	res.status(200).json({
		success: true,
		user,
	});
};

// UPDATE USER ROLE --ONLY ADMIN
export const updateUserRoleService = async (
	res: Response,
	id: string,
	role: string
) => {
	const user = await userModel.findByIdAndUpdate(id, { role }, { new: true });
	res.status(200).json({
		success: true,
		user,
	});
};
