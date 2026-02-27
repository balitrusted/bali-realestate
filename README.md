# Balitrusted

Platform for real estate in Bali for long-term living and investments.

## Project Concept

This is not a real estate agency or classifieds board. This is a platform that:
- Provides knowledge about the Bali real estate market
- Filters properties for long-term rental
- Helps make informed decisions
- Grows gradually: from a quiet expert site to an open marketplace

## Development Stages

### Stage 1: Quiet Expert Site (0-6 months)
- Catalog of curated properties
- Knowledge base (articles)
- Q&A
- Request form
- Focus: long-term, families, conscious deals

### Stage 2: Semi-open System (6-15 months)
- Registration for clients, owners, experts
- Public requests and answers
- Reputation system
- Paid actions (contact access, responses)

### Stage 3: Open Marketplace (15-30 months)
- Escrow / fund reservation
- Deal ratings
- Services (legal verification, audit)
- Full platform with guarantees

## Technologies

- **Next.js 16** - React framework with App Router
- **TypeScript** - type safety
- **Tailwind CSS** - styling
- **React 19** - UI library

## Project Structure

```
app/
  ├── page.tsx              # Home page
  ├── layout.tsx            # Root layout
  ├── properties/           # Property catalog
  ├── guides/               # Knowledge base
  │   ├── [category]/       # Article categories
  │   └── [slug]/           # Individual articles
  ├── qa/                   # Q&A
  ├── about/                # About
  └── request/              # Request form

components/
  ├── Header.tsx            # Site header
  ├── Footer.tsx            # Footer
  ├── PropertyCard.tsx      # Property card
  └── PropertyFilters.tsx   # Catalog filters

types/
  └── property.ts           # Data types
```

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## SEO and Content

The project focuses on organic growth through:
- Useful articles about areas, rentals, purchases, legal aspects
- Structured information
- Q&A as a content source
- Long-term SEO strategy

## Philosophy

- No aggressive sales
- No spam and tourist approach
- Focus on quality, not quantity
- Honest information about the market
- Help in making informed decisions

## License

Private project.
