import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { io } from "@/lib/socket"; // Import the globally exported io instance

export async function GET() {
  try {
    // Check if the Socket.IO server is initialized
    if (!io) {
      console.warn("[ROOMS_GET] Socket.IO server not initialized. Cannot retrieve participant counts.");
      // If io is not initialized, return rooms without participant counts (or an error)
      const rooms = await db.room.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });
      return NextResponse.json(rooms.map(room => ({ ...room, participantCount: 0 })));
    }

    const rooms = await db.room.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Augment rooms with participant counts if io is available
    const roomsWithParticipants = rooms.map(room => {
      const participantCount = io.sockets.adapter.rooms.get(room.id)?.size || 0;
      return {
        ...room,
        participantCount,
      };
    });

    return NextResponse.json(roomsWithParticipants);
  } catch (error) {
    console.error("[ROOMS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const room = await db.room.create({
      data: {
        name,
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("[ROOMS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
