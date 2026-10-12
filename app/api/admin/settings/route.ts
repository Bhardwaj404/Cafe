import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { cafeteriaSettingsSchema } from "@/lib/validations"

async function requireStaff() {
  const session = await auth()
  if (!session?.user || session.user.role !== "STAFF") return null
  return session
}

export async function GET(_req: NextRequest) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const settings = await db.cafeteriaSettings.findUnique({
    where: { id: "singleton" },
  })

  if (!settings) {
    // Create default
    const defaultSettings = await db.cafeteriaSettings.create({
      data: { id: "singleton" },
    })
    return NextResponse.json(defaultSettings)
  }

  return NextResponse.json(settings)
}

export async function PUT(request: NextRequest) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const parsed = cafeteriaSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const settings = await db.cafeteriaSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  })

  return NextResponse.json(settings)
}
