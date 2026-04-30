import { Server as NetServer } from "http";
import { Server as ServerIO } from "socket.io";
import { NextApiResponse } from "next";

// Extend NextApiResponse to include the socket.io server
export type NextApiResponseServerIo = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: ServerIO | undefined;
    };
  };
};

// Use a global variable to ensure the Socket.IO instance is shared across the entire process
// This is necessary because Next.js might reload modules or have different entry points
// for App Router and Pages Router.
declare global {
  var io: ServerIO | undefined;
}

export const getIo = (httpServer?: NetServer, res?: NextApiResponseServerIo): ServerIO => {
  // Try to retrieve io from res.socket.server first if it's available
  if (res?.socket?.server?.io) {
    global.io = res.socket.server.io;
  }

  if (!global.io) {
    if (!httpServer) {
      // In some contexts, we might not have the httpServer yet.
      // But we need to return something or handle the undefined case.
      console.warn("[SOCKET_LIB] getIo called without httpServer and global.io is undefined.");
      throw new Error("Socket.IO server not initialized. Please ensure /api/socket/io is called first.");
    }

    const path = "/api/socket/io"; 
    global.io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
    });
    
    // Attach io to the response socket server for subsequent checks
    if (res && res.socket && res.socket.server) {
      res.socket.server.io = global.io;
    }
    console.log("[SOCKET_LIB] Initializing new Socket.io server...");
  }
  
  return global.io;
};

// Helper function to safely get the io instance without initializing it
export const getSafeIo = (): ServerIO | undefined => {
  return global.io;
};
