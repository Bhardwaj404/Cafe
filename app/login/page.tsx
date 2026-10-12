'use client'

import React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { brand } from "@/lib/brand"
import { LogIn, UserCheck, Shield, KeyRound, Mail, ArrowRight } from "lucide-react"
import { toast } from "sonner"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please enter email and password")
      return
    }

    try {
      setLoading(true)
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        toast.error("Invalid credentials. Try demo credentials below!")
        return
      }

      toast.success("Welcome back to BitesBay!")
      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      toast.error("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Quick Demo Login helper
  const handleDemoLogin = async (demoEmail: string, demoPass: string, label: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    try {
      setLoading(true)
      const res = await signIn("credentials", {
        email: demoEmail,
        password: demoPass,
        redirect: false,
      })

      if (res?.error) {
        toast.error(`Demo login failed for ${label}`)
        return
      }

      toast.success(`Logged in as ${label}!`)
      if (demoEmail.includes("staff")) {
        router.push("/admin")
      } else {
        router.push(callbackUrl)
      }
      router.refresh()
    } catch {
      toast.error("Demo login error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 text-3xl shadow-xs">
            {brand.emoji}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
            Sign In to {brand.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Preorder campus meals, pick your slot & skip the lines.
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="e.g. arjun@student.campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="login-submit-btn"
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block text-center">
              Quick 1-Click Demo Logins
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleDemoLogin("arjun@student.campus.edu", "Student@123", "Arjun (Student 1)")
                }
                className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-left transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                  🎓
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">Arjun (Student)</p>
                  <p className="text-[10px] text-zinc-400">CS2021001</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDemoLogin("priya@student.campus.edu", "Student@123", "Priya (Student 2)")
                }
                className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-left transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                  🎓
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">Priya (Student)</p>
                  <p className="text-[10px] text-zinc-400">EC2022045</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDemoLogin("staff@bitesbay.campus", "Staff@123", "Rajan (Staff Kitchen)")
                }
                className="sm:col-span-2 flex items-center gap-2 p-2.5 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-100/50 text-left transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  🧑‍🍳
                </div>
                <div className="text-xs">
                  <p className="font-bold text-amber-950 dark:text-amber-200 leading-tight">
                    Rajan (Kitchen Manager / Staff)
                  </p>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-400">
                    Full Admin & Kanban Controls
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Signup link */}
          <div className="text-center text-xs text-zinc-500 pt-2">
            New campus student?{" "}
            <Link
              href="/signup"
              className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  )
}
