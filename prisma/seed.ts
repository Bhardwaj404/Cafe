import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Clear existing data
  await prisma.payment.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.pickupSlot.deleteMany()
  await prisma.itemCustomization.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
  await prisma.cafeteriaSettings.deleteMany()

  // Users
  const studentHash = await hash("Student@123", 12)
  const student1 = await prisma.user.create({
    data: {
      name: "Arjun Sharma",
      email: "arjun@student.campus.edu",
      passwordHash: studentHash,
      role: "STUDENT",
      studentId: "CS2021001",
    },
  })

  const student2 = await prisma.user.create({
    data: {
      name: "Priya Patel",
      email: "priya@student.campus.edu",
      passwordHash: studentHash,
      role: "STUDENT",
      studentId: "EC2022045",
    },
  })

  const staffHash = await hash("Staff@123", 12)
  await prisma.user.create({
    data: {
      name: "Rajan Kumar",
      email: "staff@bitesbay.campus",
      passwordHash: staffHash,
      role: "STAFF",
    },
  })

  // Cafeteria settings
  await prisma.cafeteriaSettings.create({
    data: {
      id: "singleton",
      openTime: "07:00",
      closeTime: "22:00",
      slotLengthMinutes: 15,
      slotCapacity: 20,
      bufferMinutes: 10,
    },
  })

  // Categories
  const breakfast = await prisma.category.create({
    data: { name: "Breakfast", icon: "🌅", displayOrder: 1 },
  })
  const meals = await prisma.category.create({
    data: { name: "Meals", icon: "🍱", displayOrder: 2 },
  })
  const snacks = await prisma.category.create({
    data: { name: "Snacks", icon: "🥪", displayOrder: 3 },
  })
  const beverages = await prisma.category.create({
    data: { name: "Beverages", icon: "☕", displayOrder: 4 },
  })
  const desserts = await prisma.category.create({
    data: { name: "Desserts", icon: "🍮", displayOrder: 5 },
  })

  // Menu Items (prices in paise)
  const menuItems = [
    // BREAKFAST (6 items)
    {
      name: "Poha",
      description: "Flattened rice cooked with onions, mustard seeds, curry leaves, and fresh coriander. A light and wholesome morning treat.",
      price: 4500,
      prepTime: 10,
      dietType: "VEG" as const,
      categoryId: breakfast.id,
      imageUrl: "https://images.unsplash.com/photo-1643809020965-a78c28f5a8c0?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: true,
      orderCount: 234,
    },
    {
      name: "Upma",
      description: "Semolina cooked with vegetables, tempered with mustard, curry leaves and green chillies. Classic South Indian breakfast.",
      price: 4000,
      prepTime: 10,
      dietType: "VEG" as const,
      categoryId: breakfast.id,
      imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: false,
      orderCount: 156,
    },
    {
      name: "Masala Dosa",
      description: "Crispy fermented rice and lentil crepe filled with spiced potato masala. Served with sambar and two chutneys.",
      price: 7000,
      prepTime: 15,
      dietType: "VEG" as const,
      categoryId: breakfast.id,
      imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: true,
      orderCount: 412,
    },
    {
      name: "Idli Sambar",
      description: "Soft steamed rice and lentil cakes served with aromatic sambar and coconut chutney. 3 pieces per serving.",
      price: 5500,
      prepTime: 12,
      dietType: "VEG" as const,
      categoryId: breakfast.id,
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: false,
      orderCount: 198,
    },
    {
      name: "Aloo Paratha",
      description: "Whole wheat flatbread stuffed with spiced mashed potatoes. Served with curd, butter, and pickle. 2 pieces.",
      price: 6000,
      prepTime: 15,
      dietType: "VEG" as const,
      categoryId: breakfast.id,
      imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: true,
      orderCount: 287,
    },
    {
      name: "Bread Butter",
      description: "4 slices of fresh white or brown bread served with amul butter and jam. Light morning snack.",
      price: 2500,
      prepTime: 5,
      dietType: "VEG" as const,
      categoryId: breakfast.id,
      imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: false,
      orderCount: 89,
    },

    // MEALS (5 items)
    {
      name: "Veg Thali",
      description: "Complete vegetarian meal with dal, sabzi, rice, 2 rotis, salad, and papad. Wholesome and filling.",
      price: 9000,
      prepTime: 20,
      dietType: "VEG" as const,
      categoryId: meals.id,
      imageUrl: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: true,
      orderCount: 523,
    },
    {
      name: "Chicken Thali",
      description: "Non-veg thali with chicken curry, dal, rice, 2 rotis, salad, and papad. Protein-packed campus meal.",
      price: 12000,
      prepTime: 25,
      dietType: "NON_VEG" as const,
      categoryId: meals.id,
      imageUrl: "https://images.unsplash.com/photo-1631515242808-497c3fbd3972?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: true,
      orderCount: 445,
    },
    {
      name: "Rajma Chawal",
      description: "Red kidney beans slow-cooked in tangy tomato-onion gravy served with steamed basmati rice. North Indian comfort food.",
      price: 8000,
      prepTime: 15,
      dietType: "VEG" as const,
      categoryId: meals.id,
      imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356c36?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: false,
      orderCount: 312,
    },
    {
      name: "Dal Makhani Rice",
      description: "Creamy black lentils simmered overnight with butter and cream. Served with steamed basmati rice and papad.",
      price: 9500,
      prepTime: 20,
      dietType: "VEG" as const,
      categoryId: meals.id,
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: true,
      orderCount: 398,
    },
    {
      name: "Veg Biryani",
      description: "Fragrant basmati rice layered with spiced seasonal vegetables and caramelized onions. Served with raita.",
      price: 10000,
      prepTime: 25,
      dietType: "VEG" as const,
      categoryId: meals.id,
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: false,
      orderCount: 267,
    },

    // SNACKS (6 items)
    {
      name: "Samosa (2 pcs)",
      description: "Crispy golden pastry filled with spiced potatoes and peas. Served with mint chutney and tamarind sauce.",
      price: 3000,
      prepTime: 8,
      dietType: "VEG" as const,
      categoryId: snacks.id,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: true,
      orderCount: 689,
    },
    {
      name: "Paneer Tikka",
      description: "Chunks of fresh cottage cheese marinated in spiced yogurt and grilled in tandoor. 6 pieces with mint chutney.",
      price: 11000,
      prepTime: 20,
      dietType: "VEG" as const,
      categoryId: snacks.id,
      imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: true,
      orderCount: 341,
    },
    {
      name: "Veg Burger",
      description: "Toasted sesame bun with crispy aloo tikki, fresh lettuce, tomato, onion rings, and house special sauce.",
      price: 6500,
      prepTime: 12,
      dietType: "VEG" as const,
      categoryId: snacks.id,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: false,
      orderCount: 213,
    },
    {
      name: "Corn Chaat",
      description: "Steamed sweet corn kernels tossed with butter, chaat masala, lime, and fresh herbs. Street-style snack.",
      price: 4000,
      prepTime: 8,
      dietType: "VEG" as const,
      categoryId: snacks.id,
      imageUrl: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400&h=300&fit=crop",
      isAvailable: false, // sold out example
      stockCount: 0,
      isPopular: false,
      orderCount: 178,
    },
    {
      name: "Bread Pakora",
      description: "Bread slices stuffed with spiced potato filling, dipped in chickpea batter and deep-fried. 4 pieces.",
      price: 3500,
      prepTime: 10,
      dietType: "VEG" as const,
      categoryId: snacks.id,
      imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: false,
      orderCount: 145,
    },
    {
      name: "Pav Bhaji",
      description: "Spiced mashed vegetable gravy served with soft buttered pav buns and topped with butter and lemon.",
      price: 7000,
      prepTime: 15,
      dietType: "VEG" as const,
      categoryId: snacks.id,
      imageUrl: "https://images.unsplash.com/photo-1606755456206-b25206cde27e?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: true,
      orderCount: 456,
    },

    // BEVERAGES (5 items)
    {
      name: "Masala Chai",
      description: "Strong Indian tea brewed with ginger, cardamom, and spices. Served hot in a kulhad glass. Comforting and aromatic.",
      price: 2000,
      prepTime: 5,
      dietType: "VEG" as const,
      categoryId: beverages.id,
      imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: true,
      orderCount: 1024,
    },
    {
      name: "Cold Coffee",
      description: "Chilled blended coffee with milk, sugar, and ice cream. Topped with whipped cream and chocolate drizzle.",
      price: 5500,
      prepTime: 8,
      dietType: "VEG" as const,
      categoryId: beverages.id,
      imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: true,
      orderCount: 567,
    },
    {
      name: "Fresh Lime Soda",
      description: "Freshly squeezed lime juice with sparkling water. Available sweet, salted, or mixed. Refreshing campus classic.",
      price: 3000,
      prepTime: 5,
      dietType: "VEG" as const,
      categoryId: beverages.id,
      imageUrl: "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: false,
      orderCount: 389,
    },
    {
      name: "Mango Lassi",
      description: "Thick yogurt drink blended with Alphonso mangoes and a hint of cardamom. Creamy, sweet perfection.",
      price: 4500,
      prepTime: 5,
      dietType: "VEG" as const,
      categoryId: beverages.id,
      imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: false,
      orderCount: 234,
    },
    {
      name: "Filter Coffee",
      description: "Traditional South Indian filter coffee — strong decoction mixed with frothy hot milk. Served in a davara set.",
      price: 2500,
      prepTime: 5,
      dietType: "VEG" as const,
      categoryId: beverages.id,
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: false,
      orderCount: 312,
    },

    // DESSERTS (3 items)
    {
      name: "Gulab Jamun",
      description: "Soft milk-solid dumplings soaked in rose-flavoured sugar syrup. Served warm with a scoop of vanilla ice cream.",
      price: 5000,
      prepTime: 8,
      dietType: "VEG" as const,
      categoryId: desserts.id,
      imageUrl: "https://images.unsplash.com/photo-1666672427561-f6ed68c40ede?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: true,
      orderCount: 378,
    },
    {
      name: "Kheer",
      description: "Creamy rice pudding slow-cooked with milk, sugar, saffron, cardamom, and garnished with pistachios and almonds.",
      price: 4500,
      prepTime: 10,
      dietType: "VEG" as const,
      categoryId: desserts.id,
      imageUrl: "https://images.unsplash.com/photo-1605197161470-5a33d278e8d5?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: false,
      orderCount: 189,
    },
    {
      name: "Chocolate Brownie",
      description: "Fudgy dark chocolate brownie made fresh daily. Served warm with chocolate sauce and vanilla ice cream.",
      price: 6500,
      prepTime: 10,
      dietType: "VEG" as const,
      categoryId: desserts.id,
      imageUrl: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&h=300&fit=crop",
      isAvailable: true,
      isPopular: true,
      orderCount: 256,
    },
  ]

  const createdItems: Record<string, string> = {}

  for (const item of menuItems) {
    const created = await prisma.menuItem.create({ data: item })
    createdItems[item.name] = created.id
  }

  // Add customizations for key items
  // Masala Dosa - size options
  await prisma.itemCustomization.create({
    data: {
      menuItemId: createdItems["Masala Dosa"],
      type: "SIZE",
      label: "Size",
      options: JSON.stringify([
        { label: "Regular", priceModifier: 0 },
        { label: "Large (+₹20)", priceModifier: 2000 },
      ]),
      required: true,
    },
  })

  await prisma.itemCustomization.create({
    data: {
      menuItemId: createdItems["Masala Dosa"],
      type: "EXTRA",
      label: "Extra Chutney",
      options: JSON.stringify([
        { label: "No extra", priceModifier: 0 },
        { label: "Extra coconut chutney (+₹10)", priceModifier: 1000 },
        { label: "Extra sambar (+₹15)", priceModifier: 1500 },
      ]),
      required: false,
    },
  })

  // Chai - spice level
  await prisma.itemCustomization.create({
    data: {
      menuItemId: createdItems["Masala Chai"],
      type: "SPICE_LEVEL",
      label: "Ginger Level",
      options: JSON.stringify([
        { label: "Light", priceModifier: 0 },
        { label: "Regular", priceModifier: 0 },
        { label: "Strong", priceModifier: 0 },
      ]),
      required: false,
    },
  })

  // Cold Coffee - size
  await prisma.itemCustomization.create({
    data: {
      menuItemId: createdItems["Cold Coffee"],
      type: "SIZE",
      label: "Cup Size",
      options: JSON.stringify([
        { label: "Regular (250ml)", priceModifier: 0 },
        { label: "Large (400ml) (+₹25)", priceModifier: 2500 },
      ]),
      required: true,
    },
  })

  // Veg Thali - extra roti
  await prisma.itemCustomization.create({
    data: {
      menuItemId: createdItems["Veg Thali"],
      type: "EXTRA",
      label: "Extra Roti",
      options: JSON.stringify([
        { label: "No extra", priceModifier: 0 },
        { label: "+1 Roti (+₹8)", priceModifier: 800 },
        { label: "+2 Rotis (+₹15)", priceModifier: 1500 },
      ]),
      required: false,
    },
  })

  // Paneer Tikka - spice level
  await prisma.itemCustomization.create({
    data: {
      menuItemId: createdItems["Paneer Tikka"],
      type: "SPICE_LEVEL",
      label: "Spice Level",
      options: JSON.stringify([
        { label: "Mild", priceModifier: 0 },
        { label: "Medium", priceModifier: 0 },
        { label: "Hot 🌶️", priceModifier: 0 },
        { label: "Extra Hot 🌶️🌶️", priceModifier: 0 },
      ]),
      required: false,
    },
  })

  console.log("✅ Database seeded successfully!")
  console.log("")
  console.log("📋 Demo credentials:")
  console.log("  Student 1: arjun@student.campus.edu / Student@123")
  console.log("  Student 2: priya@student.campus.edu / Student@123")
  console.log("  Staff:     staff@bitesbay.campus  / Staff@123")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
