import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/menu/[id]">
) {
  const { id } = await ctx.params

  const item = await db.menuItem.findUnique({
    where: { id },
    include: {
      category: true,
      customizations: true,
    },
  })

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 })
  }

  return NextResponse.json(item)
}
