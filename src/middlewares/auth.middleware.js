import jwt from "jsonwebtoken";
import { asyncHandler } from "./asyncHandler.middleware.js";
import { AppError } from "../utils/AppError.js";
import { User } from "../models/user.model.js";

export const authMiddleware = asyncHandler(async (req, res, next) => {
  // get token

  const token =
    req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new AppError(401, "Unauthorized request");
  }

  // verify token

  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

  // find user 
  const user = await User.findById(decodedToken.id);

  if(!user){
    throw new AppError(
        401,
        "Invalid access token"
    );
  }
  
  // check Account status

  if(user.accountStatus !=="active"){
    throw new AppError(
        403,
        `Account is ${user.accountStatus}`
    );
  }

  // attach user

  req.user = user;
  next();
});
