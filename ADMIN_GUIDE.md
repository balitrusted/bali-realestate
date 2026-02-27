# Admin Panel Guide

## 🚀 Quick Start

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Open admin panel**:
   Go to http://localhost:3000/admin/login

3. **Login**:
   - Default password: `admin123`
   - Change it in `.env` file: `ADMIN_PASSWORD=your-secure-password`

## 📋 Features

### ✅ Property Management
- **Add new properties** - Full form with all fields
- **Edit properties** - Update any property details
- **Delete properties** - Remove properties you don't need
- **Drag & drop reordering** - Change property order by dragging

### ✅ Image Management
- **Add images** - Paste image URLs (from Cloudinary, ImgBB, etc.)
- **Reorder images** - Drag images to change their order
- **Delete images** - Remove unwanted images
- **First image is main** - The first image in the list is shown on property cards

## 🎯 How to Use

### Adding a Property

1. Go to `/admin/properties`
2. Click "Add New Property"
3. Fill in all fields:
   - **Title**: Property name
   - **Description**: Detailed description
   - **Type**: Rent, Sale, Land, or Business
   - **Area**: Select from Ubud areas
   - **Bedrooms**: 1-4
   - **Price**: Min and max (optional)
   - **Duration**: Min and max rental duration
   - **Features**: Check available features
   - **Suitable For**: Comma-separated list (e.g., "digital nomads, couples")
   - **Images**: Add image URLs

4. Click "Save Property"

### Reordering Properties

1. Go to `/admin/properties`
2. **Drag properties** up or down using the drag handle (≡ icon)
3. Properties with lower order numbers appear first on the site
4. Changes save automatically

### Managing Images

1. When adding/editing a property:
2. **Add image**: Paste URL in the input field and click "Add Image"
3. **Reorder images**: Drag images left/right to change order
4. **Delete image**: Hover over image and click the X button
5. **First image matters**: The first image is the main image shown on property cards

### Editing a Property

1. Go to `/admin/properties`
2. Click "Edit" on any property
3. Make changes
4. Click "Save Property"

### Deleting a Property

1. Go to `/admin/properties`
2. Click "Delete" on any property
3. Confirm deletion

## 🔒 Security

- **Change default password** in production!
- Create `.env.local` file:
  ```
  ADMIN_PASSWORD=your-secure-password-here
  ```
- The admin panel uses simple cookie-based authentication
- For production, consider using NextAuth.js or Clerk

## 📸 Adding Images

### Option 1: Cloudinary (Recommended)
1. Sign up at https://cloudinary.com
2. Upload images
3. Copy the image URL
4. Paste in the admin panel

### Option 2: ImgBB
1. Go to https://imgbb.com
2. Upload image
3. Copy "Direct link"
4. Paste in the admin panel

### Option 3: Local Storage
1. Put images in `public/properties/` folder
2. Use path: `/properties/your-image.jpg`

## 🎨 Tips

- **Order matters**: Lower order numbers = appear first on site
- **First image**: This is the main image shown on property cards
- **Image quality**: Use optimized images (max 500KB each)
- **Image format**: JPG or WebP recommended

## 🐛 Troubleshooting

**Can't login?**
- Check that password is correct
- Clear browser cookies
- Check `.env.local` file exists

**Changes not saving?**
- Check browser console for errors
- Make sure you're logged in
- Refresh the page

**Images not showing?**
- Check image URLs are valid
- Make sure images are publicly accessible
- Check Next.js image configuration in `next.config.ts`

## 📝 Notes

- All changes are saved to `data/properties.ts`
- The file is auto-generated - manual edits may be overwritten
- Properties are sorted by `order` field on the public site
- Lower order number = appears first
