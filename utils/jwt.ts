require("dotenv").config();
import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";

interface ITokenOptions {
  expire: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

// PARSE ENVIRONMENT VARIABLE TO INTEGRATES WITH FALLBACK VALUES
const access_token_expire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
);
const refresh_token_expire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);

// OPTION FOR COOKIES
export const accessTokenOption: ITokenOptions = {
  expire: new Date(Date.now() + access_token_expire * 60 * 60 * 1000),
  maxAge: access_token_expire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const refreshTokenOption: ITokenOptions = {
  expire: new Date(Date.now() + refresh_token_expire * 24 * 60 * 60 * 1000),
  maxAge: refresh_token_expire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const access_token = user.SignAccessToken();
  const refresh_token = user.SignRefreshToken();

  // UPLOAD SESSION TO REDIS
  redis.set(user._id, JSON.stringify(user) as any);

  // ONLY SET SECURE TO TRUE IF IN PRODUCTION
  if (process.env.NODE === "production") {
    accessTokenOption.secure = true;
    refreshTokenOption.secure = true;
  }

  res.cookie("access_token", access_token, accessTokenOption);
  res.cookie("refresh_token", refresh_token, refreshTokenOption);

  res.status(statusCode).json({
    success: true,
    user,
    access_token,
  });
};
