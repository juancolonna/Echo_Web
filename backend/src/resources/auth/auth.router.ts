import { Router } from "express";
import rateLimit from "express-rate-limit";
import authController from "./auth.controller";

const router = Router();

// 10 requests per 15 minutes per IP
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

// 10 failed attempts per 15 minutes per IP (successful logins are not counted)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

router.post("/signup", signupLimiter, authController.signup);
router.post("/login", loginLimiter, authController.login);
router.post("/logout", authController.logout);
router.get("/me", authController.me);
router.get("/csrf", authController.csrfToken);

export default router;