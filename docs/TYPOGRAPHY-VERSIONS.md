# Typography versions

Use this to roll back or compare. Say "откати типографику до версии 1" to restore V1.

## Version 1 (original)
- **Font:** Inter (Google), variable `--font-inter`
- **layout.tsx:** `import { Inter } from "next/font/google";` → `const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });` → body `className={\`${inter.variable} antialiased\`}`
- **globals.css @theme:** `--font-sans: var(--font-inter);`
- **globals.css body:** `font-family: var(--font-inter), "Apple Color Emoji", ...`

## Version 2 (current — modern / technical)
- **Font:** IBM Plex Sans, variable `--font-sans`, weights 400,500,600,700
- **layout.tsx:** `import { IBM_Plex_Sans } from "next/font/google";` → `fontSans` with `variable: "--font-sans"` → body `className={\`${fontSans.variable} font-sans antialiased\`}`
- **globals.css:** `--font-sans: var(--font-sans);` in @theme, body uses `var(--font-sans)`
