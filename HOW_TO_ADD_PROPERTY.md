# How to Add a Property

## Quick Guide

To add a new villa to the catalog, edit the file: `data/properties.ts`

## Step-by-Step

### 1. Open the file
Open `data/properties.ts` in your editor.

### 2. Add a new property object

Copy this template and fill it with your villa's information:

```typescript
{
  id: "unique-id", // Use a unique ID, e.g., "2", "3", etc.
  title: "Villa Name",
  description: "Detailed description of the villa. What makes it special? Who is it suitable for?",
  type: "rent", // Options: "rent", "sale", "land", "business"
  area: "penestanan", // Options: "gentong", "kedewatan", "lodtunduh", "penestanan", "sukawati"
  bedrooms: 2, // Number of bedrooms
  bathrooms: 2, // Number of bathrooms (optional)
  price: {
    min: 20000000, // Minimum price in IDR (or USD if currency is "USD")
    max: 25000000, // Maximum price (optional)
    currency: "IDR" // "IDR" or "USD"
  },
  duration: {
    min: 1, // Minimum rental duration in months
    max: 12 // Maximum rental duration (optional)
  },
  features: {
    bathtub: true, // true or false
    carPark: true,
    desk: true,
    natureView: true,
    pool: false
  },
  suitableFor: ["digital nomads", "couples", "families"], // Array of strings
  notSuitableFor: ["large groups"], // Optional: who it's NOT suitable for
  images: [], // Array of image URLs (add later)
  createdAt: new Date().toISOString() // Current date/time
}
```

### 3. Example: Real Villa

```typescript
{
  id: "2",
  title: "Modern 2BR Villa with Rice Field View in Kedewatan",
  description: "Beautiful modern villa with stunning rice field views. Perfect for digital nomads and couples. Quiet location, 10 minutes from Ubud center. Fully furnished with high-speed WiFi.",
  type: "rent",
  area: "kedewatan",
  bedrooms: 2,
  bathrooms: 2,
  price: {
    min: 18000000,
    currency: "IDR"
  },
  duration: {
    min: 1
  },
  features: {
    bathtub: true,
    carPark: true,
    desk: true,
    natureView: true,
    pool: false
  },
  suitableFor: ["digital nomads", "couples", "long-stay from 1 month"],
  images: [],
  createdAt: new Date().toISOString()
}
```

## Field Explanations

### Required Fields

- **id**: Unique identifier (string)
- **title**: Villa name/title
- **description**: Detailed description
- **type**: "rent" (most common), "sale", "land", or "business"
- **area**: One of the Ubud areas (gentong, kedewatan, lodtunduh, penestanan, sukawati)
- **bedrooms**: Number (1, 2, 3, or 4)
- **price.min**: Minimum price (number)
- **price.currency**: "IDR" or "USD"
- **features**: Object with all features (bathtub, carPark, desk, natureView, pool)
- **suitableFor**: Array of strings describing who it's for
- **images**: Array of image URLs (can be empty for now)
- **createdAt**: Current date/time

### Optional Fields

- **bathrooms**: Number of bathrooms
- **price.max**: Maximum price (if there's a range)
- **duration.max**: Maximum rental duration
- **notSuitableFor**: Array of strings (who it's NOT for)

## Adding Images

Later, you can add image URLs to the `images` array:

```typescript
images: [
  "https://example.com/villa1.jpg",
  "https://example.com/villa2.jpg"
]
```

For now, you can leave it empty: `images: []`

## After Adding

1. Save the file
2. The site will automatically show your new villa
3. If running `npm run dev`, changes will appear immediately
4. If in production, rebuild: `npm run build`

## Tips

- Be honest and detailed in the description
- Use `suitableFor` to help people find the right property
- Set realistic prices
- Choose the correct area (important for filters)
