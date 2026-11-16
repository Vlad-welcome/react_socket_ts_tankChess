import app from "./app.js";
import http from "node:http";
import debugLib from "debug";

import { initSocket } from "./config/socket.js";

const debug = debugLib("server:server");

type Port = number | string | false;

function normalizePort(val: string | undefined): Port {
  const port = parseInt(val ?? "", 10);

  if (Number.isNaN(port)) {
    return val ?? "";
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  const addr = server.address();

  if (addr === null) {
    debug("Listening on unknown address");
    return;
  }

  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
  console.log("Listening on", bind);
}

const port: Port = normalizePort(process.env.PORT);
app.set("port", port);

const server = http.createServer(app);
initSocket(server);

if (port === false) {
  console.error("Invalid PORT value");
  process.exit(1);
}

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);
