import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { slotsQuerySchema } from "@/lib/validations"
import { generateSlots, findEarliestSlot } from "@/lib/slots"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const parsed = slotsQuerySchema.safeParse({
    date: searchParams.get("date"),
    maxPrepTime: searchParams.get("maxPrepTime") ?? "0",
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { date, maxPrepTime } = parsed.data

  // Get settings
  const settings = await db.cafeteriaSettings.findUnique({
    where: { id: "singleton" },
  })

  if (!settings) {
    return NextResponse.json({ error: "Cafeteria settings not found" }, { status: 500 })
  }

  // Get existing slots for this date
  const existingSlots = await db.pickupSlot.findMany({
    where: { date },
  })

  const slots = generateSlots(date, settings, existingSlots)
  const earliest = findEarliestSlot(slots, maxPrepTime, settings.bufferMinutes)

  return NextResponse.json({
    slots,
    earliestSlotIndex: earliest ? slots.indexOf(earliest) : null,
    settings: {
      slotLengthMinutes: settings.slotLengthMinutes,
      bufferMinutes: settings.bufferMinutes,
    },
  })
}

// POST: ensure a slot exists in DB (called before order creation)
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json() as { startTime: string; date: string }
  if (!body.startTime || !body.date) {
    return NextResponse.json({ error: "startTime and date required" }, { status: 400 })
  }

  const settings = await db.cafeteriaSettings.findUnique({
    where: { id: "singleton" },
  })
  if (!settings) {
    return NextResponse.json({ error: "Cafeteria settings not found" }, { status: 500 })
  }

  const startTime = new Date(body.startTime)
  const endTime = new Date(startTime.getTime() + settings.slotLengthMinutes * 60000)

  // Upsert slot
  const slot = await db.pickupSlot.upsert({
    where: { startTime },
    update: {},
    create: {
      startTime,
      endTime,
      capacity: settings.slotCapacity,
      currentCount: 0,
      date: body.date,
    },
  })

  return NextResponse.json(slot)
}
