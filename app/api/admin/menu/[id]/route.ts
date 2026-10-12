import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { menuItemSchema } from "@/lib/validations"

async function requireStaff() {
  const session = await auth()
  if (!session?.user || session.user.role !== "STAFF") return null
  return session
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/admin/menu/[id]">
) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await ctx.params
  const body = await request.json()
  const parsed = menuItemSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const item = await db.menuItem.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json(item)
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/admin/menu/[id]">
) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await ctx.params

  await db.menuItem.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
