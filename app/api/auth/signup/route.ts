import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { signupSchema } from "@/lib/validations"
import { hash } from "bcryptjs"

// Rate limiting for signup
const signupRequests = new Map<string, { count: number; resetAt: number }>()

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const now = Date.now()
  const entry = signupRequests.get(ip)

  if (entry && entry.resetAt > now && entry.count >= 5) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again in a minute." },
      { status: 429 }
    )
  }

  if (!entry || entry.resetAt < now) {
    signupRequests.set(ip, { count: 1, resetAt: now + 60000 })
  } else {
    entry.count++
  }

  const body = await request.json()
  const parsed = signupSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, password, studentId } = parsed.data

  // Check email uniqueness
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { error: { fieldErrors: { email: ["This email is already registered."] } } },
      { status: 409 }
    )
  }

  const passwordHash = await hash(password, 12)

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "STUDENT",
      studentId: studentId || null,
    },
    select: { id: true, name: true, email: true, role: true },
  })

  return NextResponse.json(user, { status: 201 })
}
