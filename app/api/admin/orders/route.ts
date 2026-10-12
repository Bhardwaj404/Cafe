import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

async function requireStaff() {
  const session = await auth()
  if (!session?.user || session.user.role !== "STAFF") return null
  return session
}

// GET all orders (for admin kanban)
export async function GET(_req: NextRequest) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const orders = await db.order.findMany({
    where: {
      status: { not: "COLLECTED" },
    },
    include: {
      items: { include: { menuItem: true } },
      payment: true,
      pickupSlot: true,
      user: { select: { name: true, email: true, studentId: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(orders)
}
