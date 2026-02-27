# How to Add Images to Properties

## Current Method (Simple)

### Step 1: Upload Images

You have several options:

#### Option A: Use Image Hosting Service (Recommended)
- **Cloudinary** (free tier available): https://cloudinary.com
- **ImgBB**: https://imgbb.com
- **Imgur**: https://imgur.com
- **AWS S3** (if you have AWS account)

#### Option B: Store in Project (for development)
- Put images in `public/properties/` folder
- Use paths like `/properties/villa-1-photo-1.jpg`

### Step 2: Add Image URLs to Property

Edit `data/properties.ts` and add URLs to the `images` array:

```typescript
{
  id: "2",
  title: "New designers 2 bdr villa near Titi Batu",
  // ... other fields
  images: [
    "https://example.com/villa-2-photo-1.jpg",
    "https://example.com/villa-2-photo-2.jpg",
    "https://example.com/villa-2-photo-3.jpg"
  ],
  // ...
}
```

### Step 3: Display Images

The PropertyCard component will automatically display images when you add them to the array.

## Example with Local Images

If you store images in `public/properties/`:

```typescript
images: [
  "/properties/villa-2-photo-1.jpg",
  "/properties/villa-2-photo-2.jpg",
  "/properties/villa-2-photo-3.jpg"
]
```

## Recommended Image Sizes

- **Main image**: 1200x800px (for property card)
- **Gallery images**: 1920x1080px (for detail page)
- **Format**: JPG or WebP (for better compression)
- **Max file size**: 500KB per image (optimize before uploading)
