'use client'

import React from "react"
import { useCartStore, type CartCustomization } from "@/lib/cart"
import { formatPrice, formatPrepTime } from "@/lib/utils"
import { X, Clock, Plus, Minus, Check } from "lucide-react"
import { toast } from "sonner"

export interface CustomOption {
  label: string
  priceModifier: number
}

export interface MenuItemWithCustomizations {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  dietType: "VEG" | "NON_VEG" | "EGG"
  prepTimeMinutes: number
  isAvailable: boolean
  stockCount: number | null
  customizations?: {
    id: string
    name: string
    type: "SIZE" | "EXTRA" | "SPICE_LEVEL"
    options: string // JSON array of CustomOption or string
    required: boolean
  }[]
}

interface ItemCustomModalProps {
  item: MenuItemWithCustomizations | null
  onClose: () => void
}

export function ItemCustomModal({ item, onClose }: ItemCustomModalProps) {
  const { addItem } = useCartStore()
  const [quantity, setQuantity] = React.useState(1)
  const [selectedCustoms, setSelectedCustoms] = React.useState<Record<string, CartCustomization>>({})
  const [note, setNote] = React.useState("")

  React.useEffect(() => {
    if (!item) return
    setQuantity(1)
    setNote("")

    // Pre-select defaults for required groups
    const defaults: Record<string, CartCustomization> = {}
    item.customizations?.forEach((group) => {
      try {
        const parsedOptions = JSON.parse(group.options) as (CustomOption | string)[]
        if (parsedOptions.length > 0 && (group.required || group.type === "SIZE")) {
          const first = parsedOptions[0]
          const label = typeof first === "string" ? first : first.label
          const priceModifier = typeof first === "string" ? 0 : first.priceModifier
          defaults[group.id] = {
            customizationId: group.id,
            label: group.name,
            selectedOption: label,
            priceModifier,
          }
        }
      } catch {
        // ignore parse error
      }
    })
    setSelectedCustoms(defaults)
  }, [item])

  if (!item) return null

  // Calculate adjusted price
  const extraTotal = Object.values(selectedCustoms).reduce(
    (sum, c) => sum + c.priceModifier,
    0
  )
  const unitPrice = item.price + extraTotal
  const total = unitPrice * quantity

  const handleSelectOption = (
    groupId: string,
    groupName: string,
    optionLabel: string,
    priceModifier: number,
    isMulti = false
  ) => {
    if (isMulti) {
      // Toggle extra
      setSelectedCustoms((prev) => {
        const copy = { ...prev }
        const key = `${groupId}-${optionLabel}`
        if (copy[key]) {
          delete copy[key]
        } else {
          copy[key] = {
            customizationId: groupId,
            label: groupName,
            selectedOption: optionLabel,
            priceModifier,
          }
        }
        return copy
      })
    } else {
      // Single choice
      setSelectedCustoms((prev) => ({
        ...prev,
        [groupId]: {
          customizationId: groupId,
          label: groupName,
          selectedOption: optionLabel,
          priceModifier,
        },
      }))
    }
  }

  const handleAddToCart = () => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      dietType: item.dietType,
      quantity,
      customizations: Object.values(selectedCustoms),
      instructions: note.trim() || undefined,
    })

    toast.success(`Added ${quantity}x ${item.name} to cart!`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-150">
        {/* Header with image */}
        <div className="relative h-48 sm:h-56 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // fallback placeholder
              ;(e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop"
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Diet badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-md flex items-center gap-1.5 ${
                item.dietType === "VEG"
                  ? "bg-green-600"
                  : item.dietType === "EGG"
                  ? "bg-amber-600"
                  : "bg-red-600"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              {item.dietType}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-md flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatPrepTime(item.prepTimeMinutes)}
            </span>
          </div>
        </div>

        {/* Item summary */}
        <div className="p-5 pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {item.name}
            </h3>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400 shrink-0">
              {formatPrice(unitPrice)}
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {item.description}
          </p>
        </div>

        {/* Customization Options */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-5">
          {item.customizations?.map((group) => {
            let options: (CustomOption | string)[] = []
            try {
              options = JSON.parse(group.options)
            } catch {
              options = []
            }

            const isMulti = group.type === "EXTRA"

            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {group.name}
                  </h4>
                  {group.required && (
                    <span className="text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                      Required
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {options.map((opt, idx) => {
                    const optLabel = typeof opt === "string" ? opt : opt.label
                    const optPrice = typeof opt === "string" ? 0 : opt.priceModifier

                    const isSelected = isMulti
                      ? !!selectedCustoms[`${group.id}-${optLabel}`]
                      : selectedCustoms[group.id]?.selectedOption === optLabel

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          handleSelectOption(
                            group.id,
                            group.name,
                            optLabel,
                            optPrice,
                            isMulti
                          )
                        }
                        className={`flex items-center justify-between p-3 rounded-2xl border text-left text-xs font-medium transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-semibold shadow-xs"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? "border-amber-500 bg-amber-500 text-white"
                                : "border-zinc-300 dark:border-zinc-600"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-3" />}
                          </div>
                          <span>{optLabel}</span>
                        </div>
                        {optPrice > 0 && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400">
                            +{formatPrice(optPrice)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Cooking note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Special Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Extra napkins, less spicy, separate chutney"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-amber-500"
              maxLength={200}
            />
          </div>
        </div>

        {/* Footer with quantity and add to cart */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-3">
          {/* Quantity selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 p-0.5"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm w-5 text-center text-zinc-900 dark:text-zinc-100">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              disabled={quantity >= 10}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 p-0.5"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add button */}
          <button
            onClick={handleAddToCart}
            id="modal-add-to-cart-btn"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <span>Add to Order</span>
            <span>•</span>
            <span>{formatPrice(total)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
