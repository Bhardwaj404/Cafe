import { z } from "zod"

// Auth
export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  studentId: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

// Menu filters
export const menuFilterSchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().optional(),
  dietType: z.enum(["VEG", "NON_VEG", "EGG", "ALL"]).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  availableOnly: z.coerce.boolean().optional(),
  sort: z
    .enum(["POPULAR", "PRICE_ASC", "PRICE_DESC", "PREP_TIME"])
    .optional(),
})

// Cart item (client-side shape)
export const cartItemSchema = z.object({
  menuItemId: z.string().cuid(),
  quantity: z.number().int().positive().max(10),
  customizations: z
    .array(
      z.object({
        customizationId: z.string(),
        label: z.string(),
        selectedOption: z.string(),
        priceModifier: z.number().int(),
      })
    )
    .default([]),
  instructions: z.string().max(200).optional(),
})

// Order creation
export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
  pickupSlotId: z.string().cuid("Invalid pickup slot"),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(["UPI", "CARD", "CASH_AT_COUNTER"]),
  idempotencyKey: z.string().uuid("Invalid idempotency key"),
})

// Pickup slot query
export const slotsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  maxPrepTime: z.coerce.number().int().min(0).default(0),
})

// Admin: create/update menu item
export const menuItemSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(5).max(500),
  price: z.number().int().positive(), // in paise
  prepTime: z.number().int().positive().max(120),
  dietType: z.enum(["VEG", "NON_VEG", "EGG"]),
  categoryId: z.string().cuid(),
  imageUrl: z.string().url(),
  isAvailable: z.boolean().default(true),
  stockCount: z.number().int().nonnegative().nullable().optional(),
  isPopular: z.boolean().default(false),
})

// Admin: update order status
export const updateOrderStatusSchema = z.object({
  status: z.enum(["PLACED", "PREPARING", "READY_FOR_PICKUP", "COLLECTED", "CANCELLED"]),
})

// Admin: cafeteria settings
export const cafeteriaSettingsSchema = z.object({
  openTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format"),
  closeTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format"),
  slotLengthMinutes: z
    .number()
    .int()
    .refine((v) => [10, 15, 20, 30].includes(v), "Slot length must be 10, 15, 20 or 30 minutes"),
  slotCapacity: z.number().int().positive().max(100),
  bufferMinutes: z.number().int().min(0).max(60),
})

// Payment verify (Razorpay)
export const paymentVerifySchema = z.object({
  orderId: z.string().cuid(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type MenuFilterInput = z.infer<typeof menuFilterSchema>
export type CartItemInput = z.infer<typeof cartItemSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type MenuItemInput = z.infer<typeof menuItemSchema>
export type CafeteriaSettingsInput = z.infer<typeof cafeteriaSettingsSchema>
