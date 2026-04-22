# Forge Builder — Specification

## Overview

Forge Builder is a web-based website builder inspired by Shopify's section/block editor and Wix's drag-and-drop interface. Built as a Next.js application, it enables non-technical users to visually edit websites through a drag-and-drop editor.

## Architecture

```
forge-builder/
├── SPEC.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              ← Projects Library
│   │   ├── builder/[projectId]/  ← Builder Editor
│   │   └── preview/[projectId]/  ← Preview iframe
│   ├── components/
│   │   ├── builder/
│   │   └── ui/
│   └── lib/
├── projects/                      ← Website project data
│   └── forge-jewellery/
└── public/
```

## Core Features

### 1. Projects Library (Home Page)
- Grid display: name, thumbnail, last edited, status
- "New Project" button
- Click → enter builder

### 2. Builder Editor (Three-Panel Layout)
- **Left Panel (280px):** Sections library + Pages tree
- **Center (flex):** Live preview iframe + device switcher
- **Right Panel (320px):** Inspector for selected section
- **Top Bar (64px):** Project name, Save, Preview, Publish

### 3. Section Types
- `hero` — Full-width hero with headline, CTA, background
- `announcement` — Announcement bar
- `product-grid` — Product grid
- `category-showcase` — Category showcase
- `rich-text` — Rich text block
- `image-block` — Image block
- `trust-badges` — Trust badges
- `newsletter` — Newsletter signup
- `footer` — Footer

### 4. Drag and Drop
- @dnd-kit/core + @dnd-kit/sortable
- Drag from library → drop on canvas
- Reorder within page

### 5. Live Preview
- iframe renders `/preview/[projectId]`
- postMessage communication
- Device switcher: Desktop/Tablet/Mobile
- Zoom controls: 50-150%

### 6. Brand Kit
- Primary/secondary/accent colors
- Font family picker
- Logo URL

## Tech Stack
- Next.js 15 (App Router)
- TypeScript (strict)
- Tailwind CSS
- shadcn/ui
- Zustand (state)
- @dnd-kit (drag-and-drop)
- Framer Motion (animations)
- Lucide React (icons)

## Project Storage (File-Based JSON)
```
projects/[id]/config/manifest.json
projects/[id]/config/brand-kit.json
projects/[id]/content/sections/[section-id].json
```
