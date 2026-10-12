import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { menuFilterSchema } from "@/lib/validations"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const parsed = menuFilterSchema.safeParse({
    categoryId: searchParams.get("categoryId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    dietType: searchParams.get("dietType") ?? undefined,
    minPrice: searchParams.get("minPrice") ?? undefined,
    maxPrice: searchParams.get("maxPrice") ?? undefined,
    availableOnly: searchParams.get("availableOnly") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { categoryId, search, dietType, minPrice, maxPrice, availableOnly, sort } =
    parsed.data

  const where: Prisma.MenuItemWhereInput = {}

  if (categoryId) where.categoryId = categoryId
  if (dietType && dietType !== "ALL") where.dietType = dietType as "VEG" | "NON_VEG" | "EGG"
  if (availableOnly) where.isAvailable = true
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) where.price.gte = minPrice * 100 // convert to paise
    if (maxPrice !== undefined) where.price.lte = maxPrice * 100
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ]
  }

  let orderBy: Prisma.MenuItemOrderByWithRelationInput = {}
  switch (sort) {
    case "POPULAR":
      orderBy = { orderCount: "desc" }
      break
    case "PRICE_ASC":
      orderBy = { price: "asc" }
      break
    case "PRICE_DESC":
      orderBy = { price: "desc" }
      break
    case "PREP_TIME":
      orderBy = { prepTime: "asc" }
      break
    default:
      orderBy = { isPopular: "desc" }
  }

  const items = await db.menuItem.findMany({
    where,
    orderBy,
    include: {
      category: true,
      customizations: true,
      _count: { select: { orderItems: true } },
    },
  })

  return NextResponse.json(items)
}
