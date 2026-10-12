'use client'

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useCartStore } from "@/lib/cart"
import { brand } from "@/lib/brand"
import {
  ShoppingBag,
  UtensilsCrossed,
  Clock,
  LayoutDashboard,
  LogIn,
  LogOut,
  User as UserIcon,
  ChevronDown
} from "lucide-react"

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { openCart, totalItems } = useCartStore()
  const itemCount = totalItems()
  const [dropdownOpen, setDropdownOpen] = React.useState(false)

  const isStaff = session?.user?.role === "STAFF"

  const navLinks = [
    { href: "/", label: "Menu", icon: UtensilsCrossed },
    { href: "/orders", label: "My Orders", icon: Clock },
    ...(isStaff ? [{ href: "/admin", label: "Staff Kitchen", icon: LayoutDashboard }] : []),
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-900/10 dark:border-amber-100/10 bg-amber-50/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
            {brand.emoji}
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {brand.name}
            </span>
            <span className="text-[10px] font-medium tracking-wide uppercase text-amber-700/70 dark:text-amber-400/60">
              {brand.tagline}
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold shadow-xs"
                    : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right actions: Cart Button + Auth */}
        <div className="flex items-center gap-3">
          {/* Cart Trigger Button */}
          <button
            onClick={openCart}
            id="cart-trigger-btn"
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm shadow-sm hover:shadow-md transition-all active:scale-95"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-zinc-900 text-white text-xs font-bold animate-pulse">
                {itemCount}
              </span>
            )}
          </button>

          {/* User Profile or Login */}
          {session?.user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm"
              >
                <div className="w-7 h-7 rounded-full bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-xs uppercase">
                  {session.user.name?.[0] ?? "U"}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold leading-tight text-zinc-900 dark:text-zinc-100 max-w-[100px] truncate">
                    {session.user.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">
                    {session.user.role.toLowerCase()}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-2 z-50 text-sm">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{session.user.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
                      {session.user.studentId && (
                        <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                          ID: {session.user.studentId}
                        </p>
                      )}
                    </div>

                    <Link
                      href="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Order History</span>
                    </Link>

                    {isStaff && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Kitchen Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        signOut({ callbackUrl: "/login" })
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-t border-zinc-100 dark:border-zinc-800 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
