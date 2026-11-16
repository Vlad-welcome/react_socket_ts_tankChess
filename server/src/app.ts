import "dotenv/config";

import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { errorHandler } from "./middlewares/errorHandler.js";

import path from "node:path";
import { isSea } from "node:sea";

const app: Application = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(errorHandler);

//const __dirname = path.dirname(fileURLToPath(import.meta.url));
//const __dirname = __dirname;

let staticDir: string;
if (isSea()) {
  staticDir = path.join(__dirname, "front", "dist");
} else {
  staticDir = path.join(__dirname, "..", "..", "front", "dist");
}

app.use(express.static(staticDir));

// app.use((req, res, next) => {
//   if (req.path.startsWith("/api")) {
//     return next();
//   }
//   res.sendFile(path.join(staticDir, "index.html"));
// });

export default app;
