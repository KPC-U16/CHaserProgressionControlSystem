import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const Prisma = new PrismaClient();

/**
 * PATCH /api/users/[userId]
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const { userId } = params;
    const name = await request.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updatedUser = await Prisma.user.update({
      where: {
        id: Number(userId),
      },
      data: {
        name,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}
