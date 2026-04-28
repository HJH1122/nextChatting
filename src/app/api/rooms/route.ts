import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const rooms = await db.room.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(rooms);
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
