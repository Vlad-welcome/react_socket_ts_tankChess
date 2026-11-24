import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { gameController } from "../controllers/gameController.js";
import { userController } from "../controllers/userController.js";
import { isSea } from "node:sea";

export function initSocket(httpServer: HttpServer): Server {
  let api = "";
  if (isSea()) {
    api = process.env.SERVER_API_PROD!;
  } else {
    api = process.env.SERVER_API!;
  }

  const io = new Server(httpServer, {
    cors: {
      origin: api,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("connected:", socket.id);
    // каждый контроллер вешает свои обработчики
    userController(io, socket);
    gameController(io, socket);
  });

  return io;
}
