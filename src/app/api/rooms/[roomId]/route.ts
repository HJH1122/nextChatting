import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSafeIo } from "@/lib/socket";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { creatorId } = await req.json();
    const { roomId } = await params;

    if (!creatorId) {
      return new NextResponse("Creator ID is required", { status: 400 });
    }

    const room = await db.room.findUnique({
      where: {
        id: roomId,
      },
    });

    if (!room) {
      return new NextResponse("Room not found", { status: 404 });
    }

    if (room.creatorId !== creatorId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete the room. Cascading delete is configured in Prisma,
    // so messages, polls, etc., will be deleted automatically.
    await db.room.delete({
      where: {
        id: roomId,
      },
    });

    // Notify all clients in the room that the room has been deleted
    const io = getSafeIo();
    if (io) {
      io.to(roomId).emit("room-deleted", { roomId });
      console.log(`[ROOM_DELETE] Room ${roomId} deleted. Broadcasted to clients.`);
    } else {
      console.warn(`[ROOM_DELETE] Room ${roomId} deleted, but Socket.IO was not initialized to broadcast.`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ROOM_DELETE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
