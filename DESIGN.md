---
name: Saffron & Spice
colors:
  surface: '#faf9f8'
  surface-dim: '#dadad9'
  surface-bright: '#faf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f2'
  surface-container: '#eeeeed'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e1'
  on-surface: '#1a1c1c'
  on-surface-variant: '#5b403d'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f0f0'
  outline: '#8f6f6c'
  outline-variant: '#e4beba'
  surface-tint: '#ba1a20'
  primary: '#af101a'
  on-primary: '#ffffff'
  primary-container: '#d32f2f'
  on-primary-container: '#fff2f0'
  inverse-primary: '#ffb3ac'
  secondary: '#964900'
  on-secondary: '#ffffff'
  secondary-container: '#fc820c'
  on-secondary-container: '#5e2c00'
  tertiary: '#705300'
  on-tertiary: '#ffffff'
  tertiary-container: '#8e6a00'
  on-tertiary-container: '#fff3e1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb3ac'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#930010'
  secondary-fixed: '#ffdcc6'
  secondary-fixed-dim: '#ffb786'
  on-secondary-fixed: '#311300'
  on-secondary-fixed-variant: '#723600'
  tertiary-fixed: '#ffdf9e'
  tertiary-fixed-dim: '#fabd00'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5b4300'
  background: '#faf9f8'
  on-background: '#1a1c1c'
  surface-variant: '#e3e2e1'
  charcoal-text: '#2D2926'
  surface-cream: '#F9F5F2'
  halal-green: '#2E7D32'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  section-gap: 80px
---

## Brand & Style
The design system is crafted to evoke the rich, aromatic, and premium nature of Indo-Pak cuisine. The target audience includes food enthusiasts seeking an authentic yet elevated dining experience. The visual language balances traditional warmth with modern culinary sophistication.

The design style is **Modern Corporate with Tactile accents**. It leverages high-quality food photography, generous whitespace to denote luxury, and subtle depth through soft shadows. The aesthetic is clean and organized, ensuring the vibrant colors of the cuisine remain the focal point while the interface provides a reliable, high-end framework.

## Colors
The palette is rooted in a deep, appetizing red (#D32F2F) which stimulates appetite and conveys passion. This is complemented by a gradient of spices: Orange and Golden Yellow serve as energetic accents for highlights, ratings, and calls to action.

The background is a curated "Off-white" (#FDFCFB) to reduce eye strain and provide a more "linen-like" premium feel compared to pure white. Neutral tones are slightly warmed with brown undertones to ensure the interface never feels cold or clinical.

## Typography
This design system utilizes **Plus Jakarta Sans** across all levels. Its soft, rounded terminals and modern geometric construction make it approachable yet sophisticated. 

Headlines use tighter letter spacing and heavier weights to command attention, while body copy maintains a generous line height (1.5x) to ensure readability of menu descriptions. Captions and labels use a slightly increased letter spacing for clarity in small formats, such as price tags or spice level indicators.

## Layout & Spacing
The layout follows a **fluid grid** with a 12-column structure for desktop and a 4-column structure for mobile. To maintain a premium feel, the design prioritizes "white space as a feature," allowing high-resolution imagery to breathe.

- **Desktop:** 64px side margins with 24px gutters.
- **Mobile:** 16px side margins.
- **Rhythm:** Spacing follows an 8px linear scale. Vertical rhythm between menu categories is aggressive (80px) to clearly demarcate the transition from "Appetizers" to "Main Courses."

## Elevation & Depth
Depth is achieved through **ambient shadows** and **tonal layering**. 
- **Level 1 (Cards):** Very soft, diffused shadows (0px 4px 20px rgba(0,0,0,0.05)) are used on white cards against the off-white background to create a subtle lift.
- **Level 2 (Active States/Modals):** A more pronounced shadow (0px 8px 30px rgba(0,0,0,0.1)) to focus the user's attention.
- **Layering:** Background surfaces use the neutral cream, while foreground containers (like menu item cards) use pure white to pop against the base layer.

## Shapes
The shape language is defined by **Rounded (16px)** corners. This radius is applied to all primary containers, including dish cards, category buttons, and image wrappers. 

Small UI elements like checkboxes and "Add to Cart" buttons should maintain this 16px radius (or be fully rounded/pill-shaped) to ensure the interface feels soft and welcoming. Avoid sharp corners entirely to maintain the approachable, friendly brand identity.

## Components
- **Buttons:** Primary buttons are Solid Deep Red with white text. Secondary buttons use a Golden Yellow outline with a subtle cream fill.
- **Chips:** Used for dietary tags (e.g., "Gluten-Free", "Chef's Special"). These are pill-shaped with a low-opacity fill of the primary or accent color and dark text.
- **Cards:** High-quality food imagery should occupy the top 60% of the card. Text is left-aligned with the price clearly emphasized in the top right corner or bottom trailing edge.
- **Inputs:** Text fields use a light grey border that transitions to the Deep Red primary color on focus.
- **Spice Level Indicators:** A custom set of 1-3 chili icons using the Orange accent color.
- **Lists:** Menu lists use subtle dividers (1px solid cream) with generous 24px vertical padding between items.
