import type { Server, Socket } from "socket.io";
import userService from "../services/userService.js";
import { Events } from "../socketEvents.js";

export const userController = (io: Server, socket: Socket): void => {
  socket.on(
    Events.JOIN,
    async (username: unknown, callback: (res: { success: boolean }) => void) => {
      console.log("Server Events.JOIN");

      if (typeof username !== "string") {
        callback({ success: false });
        return;
      }

      const name = username.trim().split(" ")[0];
      if (!name) {
        callback({ success: false });
        return;
      }

      const user = await userService.getByName(name);
      if (user) {
        if (username.split(" ")[1] === "-") {
          await userService.delete(user.username);
          callback({ success: false });
          return;
        }
        callback({ success: false });
        return;
      }

      await userService.add(username.trim(), socket.id);
      callback({ success: true });
    },
  );

  socket.on("disconnect", async () => {
    console.log("Server disconnect");
    const user = await userService.getBySocket(socket.id);
    if (user) {
      await userService.delete(user.username);
    }
  });
};
