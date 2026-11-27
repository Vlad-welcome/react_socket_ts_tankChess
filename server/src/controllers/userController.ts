import type { Server, Socket } from "socket.io";
import userService from "../services/userService.js";
import { Events } from "../socketEvents.js";

import { isSea } from "node:sea";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { playersGame } from "./gameController.js";

export const userController = (io: Server, socket: Socket): void => {
  console.log("Server connection");

  const { username } = socket.handshake.auth;
  const name = typeof username === "string" ? username.trim() : "";

  if (name) {
    const user = userService.getByName(name);
    if (user) {
      user.socketId = socket.id;
    } else {
      userService.add(name, socket.id);
    }
  }
  console.log(userService.getAll());

  socket.on("disconnect", () => {
    console.log("Server disconnect");
    userService.deleteBySocket(socket.id);
    console.log(userService.getAll());
  });

  socket.on(
    Events.JOIN,
    (
      username: unknown,
      callback: (res: { success: boolean; maps: string[]; isContinue: boolean }) => void,
    ) => {
      console.log("Server Events.JOIN");
      if (typeof username !== "string") {
        callback({ success: false, maps: [], isContinue: false });
        return;
      }

      const name = username.trim();
      if (!name) {
        callback({ success: false, maps: [], isContinue: false });
        return;
      }

      const existing = userService.getByName(name);
      if (existing) {
        existing.socketId = socket.id;
      } else {
        userService.add(name, socket.id);
      }

      let maps: string[] = [];
      let pathToMaps: string;
      if (isSea()) {
        pathToMaps = path.join(__dirname, "maps");
      } else {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        pathToMaps = path.join(__dirname, "..", "..", "maps");
      }

      maps = fs
        .readdirSync(pathToMaps)
        .filter((file) => file.endsWith(".txt") && !file.startsWith("_"))
        .map((file) => file.replace(/\.txt$/, ""));

      let game = false;
      if (playersGame.get(name)) {
        game = true;
      }

      callback({ success: true, maps: maps, isContinue: game });
    },
  );
};
