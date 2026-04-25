import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    const query = searchParams.get("q");

    if (!roomId) {
      return new NextResponse("Room ID missing", { status: 400 });
    }

    if (!query || query.length < 2) {
      return new NextResponse("Search query must be at least 2 characters", { status: 400 });
    }

    const messages = await db.message.findMany({
      where: {
        roomId,
        content: {
          contains: query,
          mode: 'insensitive', // 대소문자 구분 없이 검색
        },
      },
      include: {
        user: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
        attachments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // 최대 50개까지만 반환
    });

    const formattedMessages = messages.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.userId,
      roomId: m.roomId,
      timestamp: m.createdAt.toISOString(),
      type: m.userId === "bot-helper" ? "BOT" : "USER",
      user: m.user,
      attachments: m.attachments,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("[MESSAGES_SEARCH_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
