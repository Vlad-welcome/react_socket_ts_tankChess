import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { gameController } from "../controllers/gameController.js";
import { userController } from "../controllers/userController.js";

export function initSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.SERVER_API,
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
