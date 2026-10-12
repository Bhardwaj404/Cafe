'use client'

import React from "react"
import { useCartStore } from "@/lib/cart"
import { formatPrice, formatPrepTime } from "@/lib/utils"
import { brand } from "@/lib/brand"
import { ItemCustomModal, type MenuItemWithCustomizations } from "@/components/ItemCustomModal"
import {
  Search,
  Filter,
  Clock,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  SlidersHorizontal,
  Flame,
  Check
} from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  icon: string
  displayOrder: number
  _count?: { items: number }
}

export default function MenuPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [items, setItems] = React.useState<MenuItemWithCustomizations[]>([])
  const [loading, setLoading] = React.useState(true)

  // Filters
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL")
  const [dietFilter, setDietFilter] = React.useState<"ALL" | "VEG" | "NON_VEG" | "EGG">("ALL")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortBy, setSortBy] = React.useState<"POPULAR" | "PRICE_ASC" | "PRICE_DESC" | "PREP_TIME">("POPULAR")

  // Modal item for customization
  const [activeModalItem, setActiveModalItem] = React.useState<MenuItemWithCustomizations | null>(null)

  const { items: cartItems, addItem, updateQuantity, openCart } = useCartStore()

  // Fetch categories and items
  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [catRes, menuRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/menu"),
        ])

        if (catRes.ok) {
          const catData = await catRes.json()
          setCategories(catData)
        }

        if (menuRes.ok) {
          const menuData = await menuRes.json()
          setItems(menuData)
        }
      } catch (err) {
        console.error("Failed to load menu data:", err)
        toast.error("Could not load cafeteria menu")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter & sort logic
  const filteredItems = React.useMemo(() => {
    return items
      .filter((item) => {
        // Category filter
        if (selectedCategory !== "ALL" && (item as any).categoryId !== selectedCategory) {
          return false
        }
        // Diet filter
        if (dietFilter !== "ALL" && item.dietType !== dietFilter) {
          return false
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const nameMatch = item.name.toLowerCase().includes(q)
          const descMatch = item.description.toLowerCase().includes(q)
          if (!nameMatch && !descMatch) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === "PRICE_ASC") return a.price - b.price
        if (sortBy === "PRICE_DESC") return b.price - a.price
        if (sortBy === "PREP_TIME") return a.prepTimeMinutes - b.prepTimeMinutes
        return 0 // Default popularity order as returned by backend
      })
  }, [items, selectedCategory, dietFilter, searchQuery, sortBy])

  // Quick add to cart
  const handleQuickAdd = (item: MenuItemWithCustomizations) => {
    // If item has required customizations, open modal instead
    const hasRequired = item.customizations?.some((c) => c.required || c.type === "SIZE")
    if (hasRequired) {
      setActiveModalItem(item)
      return
    }

    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      dietType: item.dietType,
      quantity: 1,
      customizations: [],
    })
    toast.success(`Added ${item.name} to order`)
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-amber-900/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              Cafeteria Kitchen Open • Slot Pickup Available
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Fresh Campus Bites,{" "}
              <span className="text-amber-600 dark:text-amber-400">Zero Waiting.</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Browse today&apos;s specials, preorder your favorite snacks, and choose a pickup slot when your classes wrap up!
            </p>
          </div>

          {/* Search bar inside hero */}
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes, drinks, snacks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-sm focus:outline-hidden focus:border-amber-500 transition-all placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Category Filter Horizontal Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold shrink-0 transition-all ${
              selectedCategory === "ALL"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <span>🍽️</span>
            <span>All Items</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
              {items.length}
            </span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold shrink-0 transition-all ${
                  isSelected
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{cat.icon || "🍴"}</span>
                <span>{cat.name}</span>
                {cat._count?.items !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                    {cat._count.items}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Secondary Filter Controls: Diet Type & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-y border-zinc-200/60 dark:border-zinc-800/60">
          {/* Diet Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-400 mr-1 hidden sm:inline">Diet:</span>
            {(
              [
                { id: "ALL", label: "All" },
                { id: "VEG", label: "Veg Only 🌱" },
                { id: "NON_VEG", label: "Non-Veg 🍖" },
                { id: "EGG", label: "Egg 🥚" },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                onClick={() => setDietFilter(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  dietFilter === d.id
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-hidden cursor-pointer"
            >
              <option value="POPULAR">Most Popular</option>
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="PRICE_DESC">Price: High to Low</option>
              <option value="PREP_TIME">Quickest Prep Time</option>
            </select>
          </div>
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-3xl bg-zinc-200/50 dark:bg-zinc-850 animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 mx-auto flex items-center justify-center">
              <Search className="w-8 h-8 stroke-1" />
            </div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
              No menu items found
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              Try adjusting your category selection, diet filters, or search keywords.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
            {filteredItems.map((item) => {
              const inCart = cartItems.find((ci) => ci.menuItemId === item.id)
              const hasCustomizations = (item.customizations?.length ?? 0) > 0

              return (
                <div
                  key={item.id}
                  className="group relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/70 dark:border-zinc-800 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden"
                >
                  {/* Item Image */}
                  <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop"
                      }}
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                    {/* Diet type indicator badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center bg-white/90 backdrop-blur-xs shadow-xs ${
                          item.dietType === "VEG"
                            ? "border-green-600"
                            : item.dietType === "EGG"
                            ? "border-amber-600"
                            : "border-red-600"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.dietType === "VEG"
                              ? "bg-green-600"
                              : item.dietType === "EGG"
                              ? "bg-amber-600"
                              : "bg-red-600"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Prep time badge */}
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatPrepTime(item.prepTimeMinutes)}
                    </div>

                    {/* Price banner */}
                    <div className="absolute bottom-3 left-3 text-white">
                      <span className="text-lg font-extrabold tracking-tight drop-shadow-md">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    {/* Out of stock badge */}
                    {(!item.isAvailable || item.stockCount === 0) && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
                        <span className="px-3 py-1 rounded-full bg-red-600 text-white font-bold text-xs uppercase tracking-wider">
                          Sold Out Today
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                      {hasCustomizations ? (
                        <button
                          onClick={() => setActiveModalItem(item)}
                          disabled={!item.isAvailable || item.stockCount === 0}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-700 dark:text-amber-300 font-semibold text-xs transition-all disabled:opacity-40"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Customize & Add</span>
                        </button>
                      ) : inCart ? (
                        <div className="w-full flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl px-2 py-1">
                          <button
                            onClick={() => updateQuantity(item.id, inCart.quantity - 1)}
                            className="p-1 text-amber-800 dark:text-amber-200 hover:bg-amber-200/50 rounded-lg"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-xs text-amber-900 dark:text-amber-100">
                            {inCart.quantity} in cart
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, inCart.quantity + 1)}
                            className="p-1 text-amber-800 dark:text-amber-200 hover:bg-amber-200/50 rounded-lg"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleQuickAdd(item)}
                          disabled={!item.isAvailable || item.stockCount === 0}
                          className="w-full flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-40"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add to Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar (shows on mobile or when items present) */}
      {cartItems.length > 0 && (
        <aside 
          aria-label="Order summary bar"
          className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-30"
        >
          <button
            onClick={openCart}
            id="floating-cart-bar-btn"
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 dark:bg-amber-500 text-white shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs">
                {cartItems.reduce((s, i) => s + i.quantity, 0)}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-white/80">View Order Cart</p>
                <p className="text-xs font-bold">
                  {cartItems.length} item{cartItems.length > 1 ? "s" : ""} added
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm">
                {formatPrice(
                  cartItems.reduce(
                    (sum, i) =>
                      sum +
                      (i.price +
                        i.customizations.reduce((m, c) => m + c.priceModifier, 0)) *
                        i.quantity,
                    0
                  )
                )}
              </span>
              <ShoppingBag className="w-4 h-4" />
            </div>
          </button>
        </aside>
      )}

      {/* Item Customization Modal */}
      <ItemCustomModal
        item={activeModalItem}
        onClose={() => setActiveModalItem(null)}
      />
    </div>
  )
}
