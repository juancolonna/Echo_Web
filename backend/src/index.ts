import express from "express";
import config from "./config/config";
import router from "./router/router";
import cookieParser from "cookie-parser";
import setLangCookie from "./middlewares/setLangCookie";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import csrf from "csurf";
import helmet from "helmet";
import { startCleanupCron } from "./utils/cleanup";

declare module "express-session" {
  interface SessionData {
    userType: string;
    userId: string;
  }
}

const app = express();

app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

// CORS without credentials for public static assets
const publicCors = cors({
  origin: config.frontendUrl,
  credentials: false,
});

app.use("/analysis/audio", publicCors);

// Aplica publicCors apenas para GET do spectrogram, não para POST /generate
app.use("/analysis/spectrogram", (req, res, next) => {
  if (req.method === "GET") {
    return publicCors(req, res, next);
  }
  next();
});

// CORS with credentials for authenticated routes
const privateCors = cors({
  origin: config.frontendUrl,
  credentials: true,
});

app.use(privateCors);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(setLangCookie);

app.use(
  session({
    genid: () => uuidv4(),
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: config.session.sameSite,
      secure: config.session.secure,
      maxAge: config.session.maxAge,
    },
  }),
);

app.use(
  csrf({
    ignoreMethods: ["GET", "HEAD", "OPTIONS"],
  }),
);

app.use(router);

// CSRF token validation error handler
app.use((error: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error?.code === "EBADCSRFTOKEN") {
    return res.status(403).json({
      error: "INVALID_CSRF_TOKEN",
      message: "Invalid or missing CSRF token",
    });
  }

  return next(error);
});

app.listen(config.port, () => {
  console.log("[server] Listening on port %d", config.port);
});

startCleanupCron();