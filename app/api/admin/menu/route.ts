import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { menuItemSchema } from "@/lib/validations"

async function requireStaff() {
  const session = await auth()
  if (!session?.user || session.user.role !== "STAFF") {
    return null
  }
  return session
}

export async function GET(_req: NextRequest) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const items = await db.menuItem.findMany({
    include: { category: true, customizations: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const parsed = menuItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const item = await db.menuItem.create({ data: parsed.data })
  return NextResponse.json(item, { status: 201 })
}
