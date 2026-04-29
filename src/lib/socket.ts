import { Server as NetServer } from "http";
import { Server as ServerIO } from "socket.io";
import { NextApiResponse } from "next";
import { Server as NextServerSocketIO } from "@/types/socket";

// Extend NextApiResponse to include the socket.io server
type NextApiResponseServerIo = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: ServerIO | undefined;
    };
  };
};

export let io: ServerIO | undefined; // Make io a direct export

export const getIo = (httpServer?: NetServer, res?: NextApiResponseServerIo): ServerIO => {
  if (!io) {
    if (!httpServer || !res) {
      // If io is not initialized and no httpServer/res is provided,
      // it means this is a call from a context that cannot initialize it.
      // This might happen if /api/socket/io hasn't been hit yet.
      // We should not throw an error here, but rather return undefined and handle it downstream.
      // Or, better, ensure getIo is *always* called with httpServer/res from the socket API route.
      // For now, let's assume it should be initialized.
      // It's crucial that the /api/socket/io route is accessed first to initialize this.
      throw new Error("Socket.IO server not initialized and no HTTP server/response provided. Please ensure /api/socket/io route is accessed to initialize the server.");
    }

    const path = "/api/socket/io"; // This path should match your pages/api/socket/io.ts file
    io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false, // Ensure consistent path handling
    });
    // Attach io to the response socket server for subsequent checks
    if (res && res.socket && res.socket.server) {
      res.socket.server.io = io;
    }
    console.log("[SOCKET_LIB] Initializing new Socket.io server...");
  }
  return io;
};

// You can also export other utility functions here if needed,
// for example, to get room participant counts.
// However, direct access to io.sockets.adapter.rooms is preferred
// as it's the official way to get room info.
