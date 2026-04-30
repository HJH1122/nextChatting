import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSafeIo } from "@/lib/socket";

export async function GET() {
  try {
    const io = getSafeIo();
    
    // Check if the Socket.IO server is initialized
    if (!io) {
      console.warn("[ROOMS_GET] Socket.IO server not initialized. Cannot retrieve participant counts.");
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
      // Get the number of users in the room from the socket adapter
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
