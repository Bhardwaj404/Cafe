// Brand configuration - change this file to rebrand the cafeteria
export const brand = {
  name: "BitesBay",
  tagline: "Campus Cafeteria",
  fullName: "BitesBay @ Campus",
  description: "Fresh, delicious food delivered to your pickup spot",
  emoji: "☕",
  supportEmail: "support@bitesbay.campus",
} as const

// CSS variable names (defined in globals.css)
export const colors = {
  // Light mode
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: "hsl(var(--primary))",
  primaryForeground: "hsl(var(--primary-foreground))",
  secondary: "hsl(var(--secondary))",
  secondaryForeground: "hsl(var(--secondary-foreground))",
  muted: "hsl(var(--muted))",
  mutedForeground: "hsl(var(--muted-foreground))",
  accent: "hsl(var(--accent))",
  accentForeground: "hsl(var(--accent-foreground))",
  card: "hsl(var(--card))",
  cardForeground: "hsl(var(--card-foreground))",
  border: "hsl(var(--border))",
  // Semantic
  veg: "hsl(var(--veg))",
  nonVeg: "hsl(var(--non-veg))",
  egg: "hsl(var(--egg))",
} as const

export const fonts = {
  heading: "Playfair Display, Georgia, serif",
  body: "Inter, Poppins, system-ui, sans-serif",
} as const
