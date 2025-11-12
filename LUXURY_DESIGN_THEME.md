# Luxury Design Theme - Vesaki

## Overview
The Vesaki app has been transformed with a classy, luxury design theme inspired by high-end fashion brands like Gucci. The design features sophisticated typography, rich color palettes, elegant gradients, and refined interactions.

## Design Philosophy
- **Elegance**: Serif headings (Playfair Display) paired with clean sans-serif body text (Montserrat)
- **Luxury Colors**: Rich burgundy/wine tones, cream/beige backgrounds, and gold accents
- **Refined Details**: Subtle borders, sophisticated shadows, and smooth transitions
- **Premium Feel**: Uppercase tracking-widest text for buttons and labels

## Color Palette

### Primary Colors
- **Burgundy/Wine**: `#8B1A1A` (primary), `#5C1010` (dark), `#C45151` (light)
- **Gold Accent**: `#D4AF37` (gold), `#B8941F` (dark gold)

### Background & Neutrals
- **Background**: `#FAF8F5` (cream white)
- **Secondary**: `#F5F1E8` (beige/cream)
- **Muted**: `#E8E3D9` (light beige)
- **Muted Foreground**: `#6B6459` (warm gray)

### Borders
- **Primary Border**: `#D9D0C1` (warm taupe)
- **Light Border**: `#EBE6DB` (soft beige)

### Text
- **Foreground**: `#1C1410` (dark brown, almost black)

## Typography

### Fonts
- **Serif (Headings)**: Playfair Display (400, 500, 600, 700, 800)
  - Used for: h1-h6, card titles, prominent text
  - Tracking: 0.03em
  
- **Sans-serif (Body)**: Montserrat (300, 400, 500, 600, 700)
  - Used for: body text, buttons, labels
  - Tracking: 0.02em

### Button Text Styling
- Uppercase
- Tracking: widest (0.1em)
- Font weight: 600-700

## Component Styling

### Buttons
- **Primary**: Burgundy gradient with gold border accent
- **Destructive**: Red gradient
- **Outline**: White with taupe border
- **Secondary**: Cream gradient
- Shadow: luxury shadow with hover elevation
- Transitions: 300ms smooth

### Cards
- Border: Taupe with hover gold accent
- Shadow: luxury shadow (subtle) with hover elevation
- Background: White with subtle gradient
- Border radius: Minimal (0.25rem for refined look)

### Input Fields
- Border: Taupe with focus gold accent
- Background: White/90 transparency
- Focus ring: Burgundy
- Placeholder: Warm muted gray

### Navigation
- **Desktop Sidebar**: Gradient background (white → cream)
- **Active State**: Burgundy gradient with gold border accent
- **Logo**: Burgundy gradient square with gold sparkle icon
- **Premium Footer**: Cream gradient card with burgundy button

### Swipe Cards
- **Try-On Button**: Burgundy gradient with gold border
- **Virtual Try-On Badge**: Gold gradient with white text
- **Product Info**: Serif heading, uppercase brand, burgundy price
- **Swipe Labels**: 
  - Pass: Red gradient
  - Love: Burgundy gradient with gold border
  - Favorite: Gold gradient (center)

## Custom Utilities

### Shadows
```css
.shadow-luxury {
  box-shadow: 0 2px 12px rgba(28, 20, 16, 0.08);
}

.shadow-luxury-lg {
  box-shadow: 0 4px 24px rgba(28, 20, 16, 0.12);
}
```

### Gradients
```css
.gradient-gold {
  background: linear-gradient(135deg, #D4AF37 0%, #F4E5B1 50%, #D4AF37 100%);
}
```

### Scrollbars
- Custom styled with luxury colors
- Cream track with warm gray thumb
- Hover: darker muted foreground

## Page-Specific Enhancements

### Landing Page
- Gradient background (cream tones)
- Elegant hero with glowing logo
- "Fashion Concierge" tagline
- Refined search bar with backdrop blur
- "Curated Collection" section with gold divider
- Elegant product cards with hover scale and overlay

### Swipe Page
- Cream gradient background
- Refined header with backdrop blur
- Luxury swipe buttons (rounded with gradients)
- Gold star for super-like
- Sophisticated loading states

### Profile & Collections
- Consistent luxury theme throughout
- Refined cards with elegant borders
- Burgundy CTAs with gold accents

## Transitions & Animations
- Duration: 300ms (smooth, not too fast)
- Timing: cubic-bezier(0.4, 0, 0.2, 1)
- Hover effects: Scale (1.05), shadow elevation, border color changes
- Card hover: Scale image, show overlay gradient

## Implementation Notes

### Files Modified
1. `src/app/globals.css` - Color palette and typography variables
2. `src/app/layout.tsx` - Font imports (Playfair Display, Montserrat)
3. `src/app/page.tsx` - Landing page luxury styling
4. `src/components/Navigation.tsx` - Sidebar and mobile nav styling
5. `src/components/swipe/SwipeCard.tsx` - Product card luxury design
6. `src/app/swipe/page.tsx` - Swipe interface refinements
7. `src/components/ui/button.tsx` - Button component luxury variants
8. `src/components/ui/card.tsx` - Card component luxury styling
9. `src/components/ui/input.tsx` - Input field luxury design

### Design Consistency
- All interactive elements use burgundy/gold color scheme
- Consistent border styling (taupe with gold accents)
- Unified shadow system (luxury, luxury-lg)
- Uppercase tracking-widest for all CTAs
- Serif for headings, sans-serif for body

## Accessibility
- High contrast maintained (dark text on light backgrounds)
- Focus states clearly visible (burgundy rings)
- Readable font sizes and weights
- Proper color contrast ratios

## Future Enhancements
- Consider adding subtle parallax effects
- Add more micro-interactions on hover
- Implement luxury loading animations
- Add seasonal theme variations

---

**Design Inspiration**: Gucci, Burberry, Louis Vuitton, and other luxury fashion brands
**Last Updated**: November 11, 2025
