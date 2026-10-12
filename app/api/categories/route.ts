import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const categories = await db.category.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      _count: {
        select: { items: { where: { isAvailable: true } } },
      },
    },
  })

  return NextResponse.json(categories)
}
