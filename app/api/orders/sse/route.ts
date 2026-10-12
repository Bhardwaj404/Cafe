import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { sseClients } from "../[id]/status/route"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const orderId = request.nextUrl.searchParams.get("orderId")
  if (!orderId) {
    return new Response("orderId required", { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      // Add listener
      if (!sseClients.has(orderId)) {
        sseClients.set(orderId, new Set())
      }
      sseClients.get(orderId)!.add(send)

      // Send keep-alive comment every 30s
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"))
        } catch {
          clearInterval(keepAlive)
        }
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive)
        sseClients.get(orderId)?.delete(send)
        if (sseClients.get(orderId)?.size === 0) {
          sseClients.delete(orderId)
        }
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
