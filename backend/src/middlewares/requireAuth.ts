import { NextFunction, Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

// Ensures the request has an authenticated session
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    return next();
  }

  res.status(StatusCodes.UNAUTHORIZED).json({
    error: ReasonPhrases.UNAUTHORIZED,
    message: "You must be logged in to perform this action",
  });
};

export default requireAuth;