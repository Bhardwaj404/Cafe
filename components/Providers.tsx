'use client'

import React from "react"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { CartDrawer } from "@/components/CartDrawer"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <CartDrawer />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: "1rem",
          },
        }}
      />
    </SessionProvider>
  )
}
