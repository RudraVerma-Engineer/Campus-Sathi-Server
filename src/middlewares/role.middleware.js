import { AppError } from "../utils/AppError.js";

export const authorizeRoles = (...roles)=>
(req,res, next) => {
    if(!roles.includes(req.user.role)){
        throw new AppError(
            403,
            "Access denied"
        );
    }
    next();
};