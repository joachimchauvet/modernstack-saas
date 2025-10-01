Tailwind CSS v4.0 is a significant update to the framework, focusing on performance, developer experience, and leveraging modern CSS features. This document provides an overview of the most important changes.

## Key Improvements

### High-Performance Engine

A ground-up rewrite of the framework results in a massive performance boost:

- **Full builds** are up to 5x faster.
- **Incremental builds** are over 100x faster, often measured in microseconds.

### Simplified Setup and Configuration

- **Zero Configuration by Default**: No `tailwind.config.js` is needed to get started.
- **Automatic Content Detection**: Template paths are now detected automatically, so the `content` array is no longer required. The `@source` directive can be used in your CSS to include paths that are not automatically detected.
- **First-Party Vite Plugin**: A new `@tailwindcss/vite` plugin offers even better performance and tighter integration for Vite users.
- **Built-in CSS Imports**: `@import` statements are handled out-of-the-box without needing `postcss-import`.

### CSS-First Customization

The primary way to configure and customize Tailwind is now directly within your CSS files, moving away from JavaScript configuration.

```css
@import 'tailwindcss';

@theme {
	--font-family-display: 'Satoshi', 'sans-serif';

	--color-gray-50: oklch(98.5% 0.01 255);
	--color-gray-100: oklch(96% 0.02 255);
	/* ... */

	--spacing-1: 0.25rem;
	--spacing-2: 0.5rem;
	/* ... */
}
```

- **Theme variables**: All design tokens are exposed as native CSS variables (e.g., `--color-blue-500`, `--spacing-4`).
- **Arbitrary Values**: You can still use arbitrary values, but many common ones are now unnecessary due to dynamic utilities.

### Modern CSS Features

Tailwind v4 is built on modern CSS features, which may require newer browser versions:

- **Cascade Layers (`@layer`)**: Used internally for better style organization and specificity control.
- **Registered Custom Properties (`@property`)**: Improves performance and enables new animation possibilities.
- **`color-mix()`**: Allows for dynamic color opacity adjustments, even on CSS variables.

## New Features and Utilities

### Dynamic Utilities and Variants

Many utilities are now dynamic, meaning you don't need to have a value predefined in your theme.

- **Grid Columns/Rows**: `grid-cols-15` works out of the box.
- **Spacing**: `w-17`, `mt-29`, etc., now work without being explicitly defined in the theme.
- **Data Attributes**: Target custom boolean data attributes like `data-current` with variants: `data-current:opacity-100`.

### Modernized P3 Color Palette

The default color palette has been updated to use `oklch`, providing more vivid colors on modern displays that support the P3 color gamut.

### Core Container Queries

Container queries are now a core feature, eliminating the need for a separate plugin.

- Use the `@` variant to target container sizes: `@sm:grid-cols-2`, `@lg:text-lg`.
- Max-width container queries are supported with `@max-*` variants: `@max-md:hidden`.

### Expanded APIs

- **3D Transform Utilities**: `rotate-x-*`, `translate-z-*`, etc.
- **Expanded Gradient APIs**:
  - **Angles**: `bg-linear-45`
  - **Interpolation Modes**: `bg-linear-to-r/oklch`
  - **Radial and Conic Gradients**: `bg-radial-*`, `bg-conic-*`
- **`@starting-style` Support**: A new `starting:` variant for CSS-only enter/exit transitions.
- **`not-*` Variant**: For applying styles using the `:not()` pseudo-class.

### `size-*` Utility for Square Sizing

To simplify setting equal width and height, v4 introduces the `size-*` utility.

- `size-12` is a shorthand for `w-12 h-12`.
- It's a concise way to define square dimensions for elements like icons, avatars, or decorative shapes.

This overview covers the main highlights of Tailwind CSS v4.0. For a complete list of changes and a comprehensive upgrade guide, refer to the [official Tailwind CSS v4.0 blog post](https://tailwindcss.com/blog/tailwindcss-v4).
