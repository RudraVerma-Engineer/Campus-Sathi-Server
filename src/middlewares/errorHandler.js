import { AppError } from "../utils/AppError.js";

export function errorHandler(err, req, res, next) {
  console.error(err);

  //custom app error

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // mongoose validation errors
  if (err.name === "ValidationError"){
    return res.status(400).json({
      success: false,
      error: Object.values(err.errors).map(
        (val) => val.message
      ),
    });
  }
  // duplicate key errors
  if(err.code === 11000){
    return res.status(409).json({
      success:false,
      error:"Duplicate field value entered",
    });
  }

  //jwt errors 
  if(err.name === "JsonWebTokenError"){
    return res.status(401).json({
      success:false,
      error:"Invalid token",
    });
  }
    
  // token Expired

  if(err.name === "TokenExpiredError"){
    return res.status(401).json({
      success: false,
      error:"Token expired",
    });
  }

  // defaut server error 
  
  const message = err instanceof Error ? err.message : String(err);
  return res.status(500).json({
    success: false,
    error: message,
  });
}
