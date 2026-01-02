# PocketBase.cn UI Component Specification

> **Version:** 1.0.0
> **Tech Stack:** Astro + Tailwind CSS + PocketBase SDK
> **Last Updated:** 2025-12-30

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Base Components](#2-base-components)
3. [Layout Components](#3-layout-components)
4. [Business Components](#4-business-components)
5. [Form Components](#5-form-components)
6. [Interactive Components](#6-interactive-components)

---

## 1. Design System

### 1.1 Color System

#### Brand Colors

PocketBase.cn uses a modern, professional color palette centered around a distinctive blue-purple gradient that conveys trust and innovation.

```css
/* tailwind.config.js */
colors: {
  brand: {
    50: '#f0f5ff',
    100: '#e0ebff',
    200: '#c2d6ff',
    300: '#94b8ff',
    400: '#5c8fff',
    500: '#3366ff',  /* Primary brand */
    600: '#1a4fff',
    700: '#0f3de6',
    800: '#1233bf',
    900: '#142e96',
    950: '#0f1d5c',
  },
  pocket: {
    primary: '#3366ff',    /* Main CTA, links */
    secondary: '#6c5ce7',  /* Accents, gradients */
    accent: '#00d9ff',     /* Highlights, badges */
  }
}
```

#### Semantic Colors

```css
semantic: {
  success: {
    light: '#dcfce7',
    DEFAULT: '#10b981',
    dark: '#047857',
  },
  warning: {
    light: '#fef3c7',
    DEFAULT: '#f59e0b',
    dark: '#b45309',
  },
  error: {
    light: '#fee2e2',
    DEFAULT: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    light: '#dbeafe',
    DEFAULT: '#3b82f6',
    dark: '#1d4ed8',
  }
}
```

#### Dark Mode Colors

```css
dark: {
  bg: {
    primary: '#0a0a0a',
    secondary: '#141414',
    tertiary: '#1a1a1a',
    elevated: '#222222',
  },
  border: {
    subtle: '#262626',
    DEFAULT: '#333333',
    strong: '#444444',
  },
  text: {
    primary: '#fafafa',
    secondary: '#a1a1aa',
    muted: '#71717a',
  }
}
```

### 1.2 Typography System

```typescript
// Font Stack
const fonts = {
  sans: "Inter, system-ui, -apple-system, sans-serif",
  mono: "JetBrains Mono, Consolas, monospace",
  display: "Inter, system-ui, sans-serif",
};

// Type Scale
const typography = {
  "display-2xl": {
    size: "72px",
    lineHeight: "1",
    letterSpacing: "-0.025em",
    weight: 700,
  },
  "display-xl": {
    size: "60px",
    lineHeight: "1",
    letterSpacing: "-0.025em",
    weight: 700,
  },
  "display-lg": {
    size: "48px",
    lineHeight: "1.1",
    letterSpacing: "-0.02em",
    weight: 700,
  },
  "display-md": {
    size: "36px",
    lineHeight: "1.2",
    letterSpacing: "-0.02em",
    weight: 600,
  },
  "display-sm": {
    size: "30px",
    lineHeight: "1.3",
    letterSpacing: "-0.01em",
    weight: 600,
  },
  "heading-xl": {
    size: "24px",
    lineHeight: "1.4",
    letterSpacing: "-0.01em",
    weight: 600,
  },
  "heading-lg": {
    size: "20px",
    lineHeight: "1.4",
    letterSpacing: "-0.01em",
    weight: 600,
  },
  "heading-md": {
    size: "18px",
    lineHeight: "1.5",
    letterSpacing: "0",
    weight: 600,
  },
  "heading-sm": {
    size: "16px",
    lineHeight: "1.5",
    letterSpacing: "0",
    weight: 600,
  },
  "body-lg": {
    size: "18px",
    lineHeight: "1.75",
    letterSpacing: "0",
    weight: 400,
  },
  "body-md": {
    size: "16px",
    lineHeight: "1.75",
    letterSpacing: "0",
    weight: 400,
  },
  "body-sm": {
    size: "14px",
    lineHeight: "1.6",
    letterSpacing: "0",
    weight: 400,
  },
  caption: {
    size: "12px",
    lineHeight: "1.5",
    letterSpacing: "0.02em",
    weight: 500,
  },
};
```

**Tailwind Classes:**

```html
<!-- Headings -->
<h1 class="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
  <h2 class="text-3xl md:text-4xl font-semibold tracking-tight">
    <h3 class="text-2xl font-semibold">
      <h4 class="text-xl font-semibold">
        <!-- Body -->
        <p
          class="text-base leading-relaxed text-neutral-600 dark:text-neutral-300"
        ></p>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          <!-- Code -->
          <code
            class="font-mono text-sm bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded"
          ></code>
        </p>
      </h4>
    </h3>
  </h2>
</h1>
```

### 1.3 Spacing System

Based on 4px grid:

| Token      | Value | Use Case                  |
| ---------- | ----- | ------------------------- |
| `space-0`  | 0     | Reset                     |
| `space-1`  | 4px   | Tight inline spacing      |
| `space-2`  | 8px   | Icon gaps, button padding |
| `space-3`  | 12px  | Card internal padding     |
| `space-4`  | 16px  | Default component spacing |
| `space-5`  | 20px  | Component gaps            |
| `space-6`  | 24px  | Section internal spacing  |
| `space-8`  | 32px  | Section gaps              |
| `space-10` | 40px  | Large section spacing     |
| `space-12` | 48px  | Page section margins      |
| `space-16` | 64px  | Major section breaks      |
| `space-20` | 80px  | Hero spacing              |
| `space-24` | 96px  | Page-level spacing        |

### 1.4 Border Radius

```css
borderRadius: {
  'none': '0',
  'sm': '4px',      /* Buttons, badges */
  'md': '6px',      /* Default inputs */
  'lg': '8px',      /* Cards */
  'xl': '12px',     /* Modals, larger cards */
  '2xl': '16px',    /* Feature cards */
  '3xl': '24px',    /* Hero sections */
  'full': '9999px', /* Pills, avatars */
}
```

### 1.5 Shadows

```css
boxShadow: {
  'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  'glow': '0 0 20px -5px rgb(51 102 255 / 0.4)',
  'glow-lg': '0 0 40px -10px rgb(51 102 255 / 0.5)',
  'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
}

/* Dark mode shadows use subtle elevation */
.dark {
  --shadow-color: 0 0% 0%;
  --shadow-elevation-low: 0 1px 1.1px hsl(var(--shadow-color) / 0.2);
  --shadow-elevation-medium: 0 4px 4.5px hsl(var(--shadow-color) / 0.25);
}
```

---

## 2. Base Components

### 2.1 Button

**File:** `src/components/ui/Button.astro`

```typescript
interface Props {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  href?: string;
  type?: "button" | "submit" | "reset";
  icon?: string;
  iconPosition?: "left" | "right";
  class?: string;
}
```

**Variants:**

```html
<!-- Primary (Default CTA) -->
<button
  class="
  inline-flex items-center justify-center gap-2
  px-4 py-2.5 rounded-lg
  bg-brand-500 text-white font-medium
  hover:bg-brand-600 active:bg-brand-700
  focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-all duration-200
"
>
  Primary Button
</button>

<!-- Secondary -->
<button
  class="
  inline-flex items-center justify-center gap-2
  px-4 py-2.5 rounded-lg
  bg-neutral-100 dark:bg-neutral-800
  text-neutral-900 dark:text-neutral-100 font-medium
  border border-neutral-200 dark:border-neutral-700
  hover:bg-neutral-200 dark:hover:bg-neutral-700
  focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2
  transition-all duration-200
"
>
  Secondary Button
</button>

<!-- Ghost -->
<button
  class="
  inline-flex items-center justify-center gap-2
  px-4 py-2.5 rounded-lg
  text-neutral-600 dark:text-neutral-300 font-medium
  hover:bg-neutral-100 dark:hover:bg-neutral-800
  focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2
  transition-all duration-200
"
>
  Ghost Button
</button>

<!-- Danger -->
<button
  class="
  inline-flex items-center justify-center gap-2
  px-4 py-2.5 rounded-lg
  bg-red-500 text-white font-medium
  hover:bg-red-600 active:bg-red-700
  focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
  transition-all duration-200
"
>
  Danger Button
</button>
```

**Sizes:**

| Size | Padding       | Font Size   | Min Height |
| ---- | ------------- | ----------- | ---------- |
| `sm` | `px-3 py-1.5` | `text-sm`   | 32px       |
| `md` | `px-4 py-2.5` | `text-sm`   | 40px       |
| `lg` | `px-6 py-3`   | `text-base` | 48px       |

**Usage Example:**

```astro
---
import Button from '@/components/ui/Button.astro';
---

<Button variant="primary" size="lg">
  Download PocketBase
</Button>

<Button variant="secondary" href="/docs">
  Read Documentation
</Button>

<Button variant="ghost" icon="arrow-right" iconPosition="right">
  Learn More
</Button>
```

**Responsive Design:**

- Touch target minimum: 44x44px on mobile
- Full width on mobile: `w-full sm:w-auto`
- Stacked on mobile, inline on desktop: `flex flex-col sm:flex-row gap-3`

---

### 2.2 Input

**File:** `src/components/ui/Input.astro`

```typescript
interface Props {
  type?: "text" | "email" | "password" | "url" | "search" | "number" | "tel";
  name: string;
  label?: string;
  placeholder?: string;
  value?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: string;
  class?: string;
}
```

**Implementation:**

```html
<div class="space-y-2">
  <!-- Label -->
  <label
    class="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
  >
    Email Address
    <span class="text-red-500">*</span>
  </label>

  <!-- Input Container -->
  <div class="relative">
    <!-- Icon (optional) -->
    <div
      class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
    >
      <svg class="w-5 h-5 text-neutral-400" />
    </div>

    <!-- Input -->
    <input
      type="email"
      class="
        w-full px-4 py-2.5 rounded-lg
        bg-white dark:bg-neutral-900
        border border-neutral-300 dark:border-neutral-700
        text-neutral-900 dark:text-neutral-100
        placeholder:text-neutral-400 dark:placeholder:text-neutral-500
        focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
        disabled:bg-neutral-100 disabled:cursor-not-allowed
        transition-all duration-200
        [&.has-icon]:pl-10
        [&.has-error]:border-red-500 [&.has-error]:focus:ring-red-500/20
      "
      placeholder="you@example.com"
    />
  </div>

  <!-- Error Message -->
  <p class="text-sm text-red-500">Please enter a valid email address</p>

  <!-- Hint -->
  <p class="text-sm text-neutral-500 dark:text-neutral-400">
    We'll never share your email with anyone else.
  </p>
</div>
```

---

### 2.3 Textarea

**File:** `src/components/ui/Textarea.astro`

```typescript
interface Props {
  name: string;
  label?: string;
  placeholder?: string;
  value?: string;
  rows?: number;
  maxLength?: number;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  class?: string;
}
```

```html
<textarea
  class="
  w-full px-4 py-3 rounded-lg
  bg-white dark:bg-neutral-900
  border border-neutral-300 dark:border-neutral-700
  text-neutral-900 dark:text-neutral-100
  placeholder:text-neutral-400
  focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
  resize-y min-h-[120px]
  transition-all duration-200
"
/>
```

---

### 2.4 Select

**File:** `src/components/ui/Select.astro`

```typescript
interface Props {
  name: string;
  label?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  class?: string;
}
```

```html
<div class="relative">
  <select
    class="
    w-full px-4 py-2.5 pr-10 rounded-lg
    appearance-none cursor-pointer
    bg-white dark:bg-neutral-900
    border border-neutral-300 dark:border-neutral-700
    text-neutral-900 dark:text-neutral-100
    focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
    transition-all duration-200
  "
  >
    <option value="" disabled selected>Select an option</option>
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
  </select>

  <!-- Chevron Icon -->
  <div
    class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
  >
    <svg
      class="w-5 h-5 text-neutral-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </div>
</div>
```

---

### 2.5 Card

**File:** `src/components/ui/Card.astro`

```typescript
interface Props {
  variant?: "default" | "bordered" | "elevated" | "ghost";
  padding?: "none" | "sm" | "md" | "lg";
  href?: string;
  interactive?: boolean;
  class?: string;
}
```

**Variants:**

```html
<!-- Default -->
<div
  class="
  bg-white dark:bg-neutral-900
  border border-neutral-200 dark:border-neutral-800
  rounded-xl p-6
"
>
  <!-- Bordered (emphasized border) -->
  <div
    class="
  bg-white dark:bg-neutral-900
  border-2 border-neutral-200 dark:border-neutral-700
  rounded-xl p-6
"
  >
    <!-- Elevated (shadow) -->
    <div
      class="
  bg-white dark:bg-neutral-900
  shadow-lg rounded-xl p-6
  dark:ring-1 dark:ring-neutral-800
"
    >
      <!-- Ghost (transparent) -->
      <div
        class="
  bg-neutral-50/50 dark:bg-neutral-900/50
  backdrop-blur-sm
  rounded-xl p-6
"
      >
        <!-- Interactive (hover effects) -->
        <a
          href="/plugin/123"
          class="
  block bg-white dark:bg-neutral-900
  border border-neutral-200 dark:border-neutral-800
  rounded-xl p-6
  hover:border-brand-500 dark:hover:border-brand-500
  hover:shadow-md
  transition-all duration-200
  group
"
        ></a>
      </div>
    </div>
  </div>
</div>
```

**Padding Options:**

| Size   | Class |
| ------ | ----- |
| `none` | `p-0` |
| `sm`   | `p-4` |
| `md`   | `p-6` |
| `lg`   | `p-8` |

---

### 2.6 Badge

**File:** `src/components/ui/Badge.astro`

```typescript
interface Props {
  variant?: "default" | "success" | "warning" | "error" | "info" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
  class?: string;
}
```

```html
<!-- Default -->
<span
  class="
  inline-flex items-center gap-1.5
  px-2.5 py-0.5 rounded-full
  text-xs font-medium
  bg-neutral-100 dark:bg-neutral-800
  text-neutral-700 dark:text-neutral-300
"
>
  <!-- Success -->
  <span
    class="
  inline-flex items-center gap-1.5
  px-2.5 py-0.5 rounded-full
  text-xs font-medium
  bg-green-100 dark:bg-green-900/30
  text-green-700 dark:text-green-400
"
  >
    <!-- With Dot -->
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
    >
      <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
      Active
    </span>

    <!-- Outline -->
    <span
      class="
  inline-flex items-center
  px-2.5 py-0.5 rounded-full
  text-xs font-medium
  border border-neutral-300 dark:border-neutral-600
  text-neutral-600 dark:text-neutral-300
"
    ></span></span
></span>
```

---

### 2.7 Avatar

**File:** `src/components/ui/Avatar.astro`

```typescript
interface Props {
  src?: string;
  alt: string;
  fallback?: string; // Initials or icon
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy" | "away";
  class?: string;
}
```

```html
<!-- Avatar Sizes -->
<!-- xs: 24px, sm: 32px, md: 40px, lg: 48px, xl: 64px -->

<div class="relative inline-flex">
  <img
    src="/avatars/user.jpg"
    alt="User Name"
    class="
      w-10 h-10 rounded-full object-cover
      ring-2 ring-white dark:ring-neutral-900
    "
  />

  <!-- Fallback (when no image) -->
  <div
    class="
    w-10 h-10 rounded-full
    bg-brand-500 text-white
    flex items-center justify-center
    text-sm font-medium
  "
  >
    JD
  </div>

  <!-- Status Indicator -->
  <span
    class="
    absolute bottom-0 right-0
    w-3 h-3 rounded-full
    bg-green-500 ring-2 ring-white dark:ring-neutral-900
  "
  ></span>
</div>
```

---

### 2.8 Modal

**File:** `src/components/ui/Modal.astro` (with `client:load`)

```typescript
interface Props {
  id: string;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}
```

```html
<!-- Backdrop -->
<div
  id="modal-backdrop"
  class="
    fixed inset-0 z-50
    bg-black/60 backdrop-blur-sm
    opacity-0 invisible
    transition-opacity duration-300
    data-[open]:opacity-100 data-[open]:visible
  "
>
  <!-- Modal Container -->
  <div
    class="
    fixed inset-0 z-50
    flex items-center justify-center p-4
    overflow-y-auto
  "
  >
    <!-- Modal Content -->
    <div
      class="
      relative w-full max-w-lg
      bg-white dark:bg-neutral-900
      rounded-2xl shadow-2xl
      transform scale-95 opacity-0
      transition-all duration-300
      data-[open]:scale-100 data-[open]:opacity-100
    "
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800"
      >
        <h2 class="text-xl font-semibold text-neutral-900 dark:text-white">
          Modal Title
        </h2>
        <button
          class="
          p-2 rounded-lg
          text-neutral-400 hover:text-neutral-600
          hover:bg-neutral-100 dark:hover:bg-neutral-800
          transition-colors
        "
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6">
        <slot />
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800"
      >
        <slot name="footer" />
      </div>
    </div>
  </div>
</div>
```

**Modal Sizes:**

| Size   | Max Width                 |
| ------ | ------------------------- |
| `sm`   | `max-w-sm` (384px)        |
| `md`   | `max-w-lg` (512px)        |
| `lg`   | `max-w-2xl` (672px)       |
| `xl`   | `max-w-4xl` (896px)       |
| `full` | `max-w-[calc(100%-2rem)]` |

---

### 2.9 Toast

**File:** `src/components/ui/Toast.astro` (with `client:load`)

```typescript
interface ToastProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number; // ms, 0 for persistent
  action?: { label: string; onClick: () => void };
}
```

```html
<!-- Toast Container (fixed position) -->
<div
  id="toast-container"
  class="
  fixed bottom-4 right-4 z-[100]
  flex flex-col gap-3
  max-w-sm w-full
  pointer-events-none
"
>
  <!-- Individual Toast -->
  <div
    class="
    pointer-events-auto
    flex items-start gap-3 p-4
    bg-white dark:bg-neutral-900
    border border-neutral-200 dark:border-neutral-800
    rounded-xl shadow-lg
    animate-slide-in-right
  "
    role="alert"
  >
    <!-- Icon -->
    <div class="flex-shrink-0">
      <!-- Success Icon -->
      <div
        class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
      >
        <svg
          class="w-5 h-5 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p class="font-medium text-neutral-900 dark:text-white">Success!</p>
      <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
        Your plugin has been submitted.
      </p>
    </div>

    <!-- Close Button -->
    <button
      class="flex-shrink-0 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <svg
        class="w-4 h-4 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
</div>

<!-- Animation -->
<style>
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }
</style>
```

---

### 2.10 Tooltip

**File:** `src/components/ui/Tooltip.astro`

```typescript
interface Props {
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  class?: string;
}
```

```html
<div class="relative inline-flex group">
  <slot />
  <!-- Trigger element -->

  <!-- Tooltip -->
  <div
    class="
    absolute bottom-full left-1/2 -translate-x-1/2 mb-2
    px-3 py-1.5 rounded-lg
    bg-neutral-900 dark:bg-neutral-100
    text-white dark:text-neutral-900
    text-xs font-medium
    whitespace-nowrap
    opacity-0 invisible
    group-hover:opacity-100 group-hover:visible
    transition-all duration-200
    z-50
  "
  >
    Tooltip content here
    <!-- Arrow -->
    <div
      class="
      absolute top-full left-1/2 -translate-x-1/2
      border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-100
    "
    ></div>
  </div>
</div>
```

---

## 3. Layout Components

### 3.1 Header

**File:** `src/components/layout/Header.astro`

```typescript
interface Props {
  transparent?: boolean;
  sticky?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
  children?: NavItem[];
}
```

```html
<header
  class="
  sticky top-0 z-40
  bg-white/80 dark:bg-neutral-950/80
  backdrop-blur-lg
  border-b border-neutral-200/50 dark:border-neutral-800/50
"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-3">
        <img src="/logo.svg" alt="PocketBase.cn" class="h-8 w-auto" />
        <span class="font-semibold text-lg hidden sm:block">PocketBase.cn</span>
      </a>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center gap-1">
        <a
          href="/plugins"
          class="
          px-4 py-2 rounded-lg
          text-sm font-medium
          text-neutral-600 dark:text-neutral-300
          hover:text-neutral-900 dark:hover:text-white
          hover:bg-neutral-100 dark:hover:bg-neutral-800
          transition-colors
        "
        >
          Plugins
        </a>
        <a
          href="/showcase"
          class="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        >
          Showcase
        </a>
        <a
          href="/docs"
          class="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        >
          Docs
        </a>
        <a
          href="/download"
          class="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        >
          Download
        </a>
      </nav>

      <!-- Right Section -->
      <div class="flex items-center gap-3">
        <!-- Search Trigger -->
        <button
          class="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        <!-- Dark Mode Toggle -->
        <button
          class="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <svg
            class="w-5 h-5 dark:hidden"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          <svg
            class="w-5 h-5 hidden dark:block"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </button>

        <!-- GitHub -->
        <a
          href="https://github.com/pocketbase/pocketbase"
          target="_blank"
          rel="noopener"
          class="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors hidden sm:flex"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fill-rule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clip-rule="evenodd"
            />
          </svg>
        </a>

        <!-- Auth Button -->
        <AuthButton client:load />

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile Navigation (hidden by default) -->
  <nav
    class="md:hidden border-t border-neutral-200 dark:border-neutral-800 hidden"
  >
    <div class="px-4 py-3 space-y-1">
      <a
        href="/plugins"
        class="block px-3 py-2 rounded-lg text-base font-medium text-neutral-600 hover:bg-neutral-100"
        >Plugins</a
      >
      <a
        href="/showcase"
        class="block px-3 py-2 rounded-lg text-base font-medium text-neutral-600 hover:bg-neutral-100"
        >Showcase</a
      >
      <a
        href="/docs"
        class="block px-3 py-2 rounded-lg text-base font-medium text-neutral-600 hover:bg-neutral-100"
        >Docs</a
      >
      <a
        href="/download"
        class="block px-3 py-2 rounded-lg text-base font-medium text-neutral-600 hover:bg-neutral-100"
        >Download</a
      >
    </div>
  </nav>
</header>
```

**Responsive Design:**

- Mobile: Hamburger menu, logo only
- Tablet: Compressed nav
- Desktop: Full navigation

---

### 3.2 Footer

**File:** `src/components/layout/Footer.astro`

```html
<footer
  class="bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800"
>
  <!-- Main Footer -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
      <!-- Brand Column -->
      <div class="col-span-2 md:col-span-1">
        <a href="/" class="flex items-center gap-2">
          <img src="/logo.svg" alt="PocketBase.cn" class="h-8 w-auto" />
          <span class="font-semibold text-lg">PocketBase.cn</span>
        </a>
        <p class="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          Unofficial Chinese community for PocketBase. Providing mirrors,
          plugins, and resources.
        </p>
      </div>

      <!-- Resources -->
      <div>
        <h3 class="font-semibold text-neutral-900 dark:text-white mb-4">
          Resources
        </h3>
        <ul class="space-y-3">
          <li>
            <a
              href="/docs"
              class="text-sm text-neutral-500 hover:text-brand-500 transition-colors"
              >Documentation</a
            >
          </li>
          <li>
            <a
              href="/plugins"
              class="text-sm text-neutral-500 hover:text-brand-500 transition-colors"
              >Plugins</a
            >
          </li>
          <li>
            <a
              href="/showcase"
              class="text-sm text-neutral-500 hover:text-brand-500 transition-colors"
              >Showcase</a
            >
          </li>
          <li>
            <a
              href="/download"
              class="text-sm text-neutral-500 hover:text-brand-500 transition-colors"
              >Download</a
            >
          </li>
        </ul>
      </div>

      <!-- Community -->
      <div>
        <h3 class="font-semibold text-neutral-900 dark:text-white mb-4">
          Community
        </h3>
        <ul class="space-y-3">
          <li>
            <a
              href="https://github.com/pocketbase"
              class="text-sm text-neutral-500 hover:text-brand-500 transition-colors"
              >GitHub</a
            >
          </li>
          <li>
            <a
              href="/discord"
              class="text-sm text-neutral-500 hover:text-brand-500 transition-colors"
              >Discord</a
            >
          </li>
          <li>
            <a
              href="/contribute"
              class="text-sm text-neutral-500 hover:text-brand-500 transition-colors"
              >Contribute</a
            >
          </li>
          <li>
            <a
              href="/sponsor"
              class="text-sm text-neutral-500 hover:text-brand-500 transition-colors"
              >Sponsor</a
            >
          </li>
        </ul>
      </div>

      <!-- Legal -->
      <div>
        <h3 class="font-semibold text-neutral-900 dark:text-white mb-4">
          Legal
        </h3>
        <ul class="space-y-3">
          <li>
            <a
              href="/privacy"
              class="text-sm text-neutral-500 hover:text-brand-500 transition-colors"
              >Privacy Policy</a
            >
          </li>
          <li>
            <a
              href="/terms"
              class="text-sm text-neutral-500 hover:text-brand-500 transition-colors"
              >Terms of Service</a
            >
          </li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Bottom Bar (Disclaimer) -->
  <div class="border-t border-neutral-200 dark:border-neutral-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <p
          class="text-sm text-neutral-500 dark:text-neutral-400 text-center md:text-left"
        >
          2024-2025 PocketBase.cn. This is an unofficial community project and
          is not affiliated with PocketBase.
        </p>
        <div class="flex items-center gap-4">
          <a
            href="https://github.com/pocketbase-cn"
            class="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              ...
            </svg>
          </a>
          <a
            href="https://twitter.com/pocketbase"
            class="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              ...
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</footer>
```

---

### 3.3 Sidebar

**File:** `src/components/layout/Sidebar.astro`

```typescript
interface Props {
  sections: Array<{
    title: string;
    items: Array<{
      label: string;
      href: string;
      isActive?: boolean;
      badge?: string;
    }>;
  }>;
}
```

```html
<aside
  class="
  w-64 shrink-0
  sticky top-20
  h-[calc(100vh-5rem)]
  overflow-y-auto
  border-r border-neutral-200 dark:border-neutral-800
  hidden lg:block
"
>
  <nav class="p-4 space-y-6">
    <!-- Section -->
    <div>
      <h3
        class="
        px-3 mb-2
        text-xs font-semibold uppercase tracking-wider
        text-neutral-500 dark:text-neutral-400
      "
      >
        Getting Started
      </h3>
      <ul class="space-y-1">
        <li>
          <a
            href="/docs/introduction"
            class="
            flex items-center gap-2 px-3 py-2 rounded-lg
            text-sm font-medium
            text-neutral-600 dark:text-neutral-300
            hover:bg-neutral-100 dark:hover:bg-neutral-800
            transition-colors
            [&.active]:bg-brand-50 [&.active]:text-brand-600
            dark:[&.active]:bg-brand-950 dark:[&.active]:text-brand-400
          "
          >
            Introduction
          </a>
        </li>
        <li>
          <a
            href="/docs/installation"
            class="
            flex items-center justify-between gap-2 px-3 py-2 rounded-lg
            text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors
          "
          >
            Installation
            <span
              class="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700"
              >New</span
            >
          </a>
        </li>
      </ul>
    </div>

    <!-- More sections... -->
  </nav>
</aside>

<!-- Mobile Sidebar (Sheet) -->
<div class="lg:hidden fixed inset-0 z-50 hidden" id="mobile-sidebar">
  <div class="absolute inset-0 bg-black/50" onclick="closeSidebar()"></div>
  <aside
    class="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-neutral-900 shadow-xl"
  >
    <!-- Same content as desktop -->
  </aside>
</div>
```

---

### 3.4 Container

**File:** `src/components/layout/Container.astro`

```typescript
interface Props {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: boolean;
  class?: string;
}
```

```html
<!-- Size variants -->
<div class="max-w-3xl mx-auto px-4 sm:px-6">
  <!-- sm: 768px -->
  <div class="max-w-5xl mx-auto px-4 sm:px-6">
    <!-- md: 1024px -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- lg: 1152px -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- xl: 1280px (default) -->
        <div class="w-full px-4 sm:px-6 lg:px-8"><!-- full --></div>
      </div>
    </div>
  </div>
</div>
```

---

### 3.5 Grid

**File:** `src/components/layout/Grid.astro`

```typescript
interface Props {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: "sm" | "md" | "lg";
  class?: string;
}
```

```html
<!-- Responsive Grid Examples -->

<!-- 1 col mobile, 2 cols tablet, 3 cols desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- 1 col mobile, 2 cols tablet, 4 cols desktop -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Bento Grid -->
    <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-4">
      <div class="col-span-4 md:col-span-3 lg:col-span-6">...</div>
      <div class="col-span-4 md:col-span-3 lg:col-span-3">...</div>
      <div class="col-span-4 md:col-span-6 lg:col-span-3">...</div>
    </div>

    <!-- Gap sizes -->
    <!-- sm: gap-4 (16px), md: gap-6 (24px), lg: gap-8 (32px) -->
  </div>
</div>
```

---

## 4. Business Components

### 4.1 PluginCard

**File:** `src/components/business/PluginCard.astro`

```typescript
interface Props {
  plugin: {
    id: string;
    name: string;
    description: string;
    author: {
      name: string;
      avatar?: string;
    };
    category: string;
    tags: string[];
    downloads: number;
    stars: number;
    version: string;
    updatedAt: string;
    verified?: boolean;
    featured?: boolean;
  };
  variant?: "default" | "compact" | "featured";
}
```

```html
<article class="
  group relative
  bg-white dark:bg-neutral-900
  border border-neutral-200 dark:border-neutral-800
  rounded-xl
  hover:border-brand-500/50 dark:hover:border-brand-500/50
  hover:shadow-lg hover:shadow-brand-500/5
  transition-all duration-300
">
  <!-- Featured Badge -->
  <div class="absolute -top-3 left-4">
    <span class="
      inline-flex items-center gap-1.5 px-3 py-1 rounded-full
      text-xs font-semibold
      bg-gradient-to-r from-amber-500 to-orange-500 text-white
      shadow-lg shadow-orange-500/25
    ">
      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">...</svg>
      Featured
    </span>
  </div>

  <div class="p-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 mb-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="font-semibold text-lg text-neutral-900 dark:text-white truncate">
            <a href={`/plugins/${plugin.id}`} class="hover:text-brand-500 transition-colors">
              {plugin.name}
            </a>
          </h3>
          <!-- Verified Badge -->
          <svg class="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
        </div>
        <VersionBadge version={plugin.version} class="mt-2" />
      </div>

      <!-- Category Icon -->
      <div class="
        w-12 h-12 rounded-xl flex-shrink-0
        bg-brand-50 dark:bg-brand-950
        flex items-center justify-center
      ">
        <svg class="w-6 h-6 text-brand-500">...</svg>
      </div>
    </div>

    <!-- Description -->
    <p class="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-4">
      {plugin.description}
    </p>

    <!-- Tags -->
    <div class="flex flex-wrap gap-2 mb-4">
      {plugin.tags.slice(0, 3).map(tag => (
        <span class="
          px-2 py-0.5 rounded-md
          text-xs font-medium
          bg-neutral-100 dark:bg-neutral-800
          text-neutral-600 dark:text-neutral-400
        ">
          {tag}
        </span>
      ))}
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
      <!-- Author -->
      <div class="flex items-center gap-2">
        <img
          src={plugin.author.avatar || '/avatars/default.svg'}
          alt={plugin.author.name}
          class="w-6 h-6 rounded-full"
        />
        <span class="text-sm text-neutral-500">{plugin.author.name}</span>
      </div>

      <!-- Stats -->
      <div class="flex items-center gap-4 text-sm text-neutral-400">
        <span class="flex items-center gap-1">
          <svg class="w-4 h-4">...</svg>
          {formatNumber(plugin.downloads)}
        </span>
        <span class="flex items-center gap-1">
          <svg class="w-4 h-4">...</svg>
          {plugin.stars}
        </span>
      </div>
    </div>
  </div>

  <!-- Hover Overlay -->
  <div class="
    absolute inset-0 rounded-xl
    bg-gradient-to-t from-brand-500/5 to-transparent
    opacity-0 group-hover:opacity-100
    transition-opacity duration-300
    pointer-events-none
  "></div>
</article>
```

**Responsive Design:**

- Mobile: Full width, compact stats
- Tablet: 2-column grid
- Desktop: 3-column grid

---

### 4.2 ShowcaseCard

**File:** `src/components/business/ShowcaseCard.astro`

```typescript
interface Props {
  showcase: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    url: string;
    author: string;
    category: string;
    tech: string[];
    featured?: boolean;
  };
  variant?: "default" | "large";
}
```

```html
<article
  class="
  group relative overflow-hidden
  bg-neutral-900 rounded-2xl
  aspect-[16/10]
"
>
  <!-- Thumbnail -->
  <img
    src="{showcase.thumbnail}"
    alt="{showcase.title}"
    class="
      absolute inset-0 w-full h-full object-cover
      group-hover:scale-105
      transition-transform duration-500
    "
    loading="lazy"
  />

  <!-- Gradient Overlay -->
  <div
    class="
    absolute inset-0
    bg-gradient-to-t from-black/90 via-black/30 to-transparent
  "
  ></div>

  <!-- Content -->
  <div class="absolute inset-0 flex flex-col justify-end p-6">
    <!-- Category Badge -->
    <span
      class="
      self-start mb-3
      px-2.5 py-1 rounded-full
      text-xs font-medium
      bg-white/20 text-white backdrop-blur-sm
    "
    >
      {showcase.category}
    </span>

    <h3 class="font-bold text-xl text-white mb-2 line-clamp-1">
      {showcase.title}
    </h3>

    <p class="text-sm text-neutral-300 line-clamp-2 mb-4">
      {showcase.description}
    </p>

    <!-- Tech Stack -->
    <div class="flex flex-wrap gap-1.5 mb-4">
      {showcase.tech.map(tech => (
      <span
        class="
          px-2 py-0.5 rounded
          text-xs
          bg-white/10 text-neutral-300
        "
      >
        {tech}
      </span>
      ))}
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between">
      <span class="text-sm text-neutral-400">by {showcase.author}</span>
      <a
        href="{showcase.url}"
        target="_blank"
        rel="noopener"
        class="
          inline-flex items-center gap-2 px-4 py-2 rounded-lg
          bg-white text-neutral-900 text-sm font-medium
          hover:bg-neutral-100
          transition-colors
        "
      >
        Visit Site
        <svg
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  </div>

  <!-- Featured Ribbon -->
  {showcase.featured && (
  <div class="absolute top-4 right-4">
    <span
      class="
        px-3 py-1 rounded-full
        text-xs font-bold uppercase tracking-wider
        bg-gradient-to-r from-amber-400 to-orange-500 text-white
        shadow-lg
      "
    >
      Featured
    </span>
  </div>
  )}
</article>
```

---

### 4.3 MirrorDownload

**File:** `src/components/business/MirrorDownload.astro`

```typescript
interface Props {
  version: string;
  assets: Array<{
    os: "linux" | "darwin" | "windows";
    arch: "amd64" | "arm64" | "386";
    filename: string;
    size: string;
    mirrors: Array<{
      name: string;
      url: string;
      region?: string;
    }>;
  }>;
}
```

```html
<div
  class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden"
>
  <!-- Header -->
  <div class="p-6 border-b border-neutral-200 dark:border-neutral-800">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-xl font-semibold text-neutral-900 dark:text-white">
          Download PocketBase
        </h3>
        <p class="text-sm text-neutral-500 mt-1">
          Version {version} - Released Dec 2024
        </p>
      </div>
      <VersionBadge version="{version}" size="lg" />
    </div>
  </div>

  <!-- OS Tabs -->
  <div class="border-b border-neutral-200 dark:border-neutral-800">
    <div class="flex">
      <button
        class="
        flex-1 px-6 py-4
        text-sm font-medium
        border-b-2 border-brand-500 text-brand-600
        bg-brand-50/50 dark:bg-brand-950/30
      "
      >
        <span class="flex items-center justify-center gap-2">
          <svg class="w-5 h-5"><!-- Linux icon --></svg>
          Linux
        </span>
      </button>
      <button
        class="
        flex-1 px-6 py-4
        text-sm font-medium text-neutral-500
        border-b-2 border-transparent
        hover:bg-neutral-50 dark:hover:bg-neutral-800
        transition-colors
      "
      >
        <span class="flex items-center justify-center gap-2">
          <svg class="w-5 h-5"><!-- macOS icon --></svg>
          macOS
        </span>
      </button>
      <button
        class="
        flex-1 px-6 py-4
        text-sm font-medium text-neutral-500
        border-b-2 border-transparent
        hover:bg-neutral-50 dark:hover:bg-neutral-800
        transition-colors
      "
      >
        <span class="flex items-center justify-center gap-2">
          <svg class="w-5 h-5"><!-- Windows icon --></svg>
          Windows
        </span>
      </button>
    </div>
  </div>

  <!-- Download Options -->
  <div class="p-6 space-y-4">
    <!-- Architecture Options -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- AMD64 -->
      <div
        class="
        p-4 rounded-xl
        border-2 border-brand-500 bg-brand-50/50 dark:bg-brand-950/30
      "
      >
        <div class="flex items-center justify-between mb-3">
          <div>
            <h4 class="font-medium text-neutral-900 dark:text-white">
              AMD64 / x86_64
            </h4>
            <p class="text-sm text-neutral-500">Recommended for most systems</p>
          </div>
          <span
            class="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          >
            Recommended
          </span>
        </div>

        <!-- Mirror Selection -->
        <div class="space-y-2">
          <p
            class="text-xs font-medium text-neutral-500 uppercase tracking-wider"
          >
            Choose Mirror:
          </p>
          <div class="grid grid-cols-2 gap-2">
            <a
              href="#"
              class="
              flex items-center justify-center gap-2 px-3 py-2
              bg-brand-500 text-white rounded-lg
              hover:bg-brand-600 transition-colors
              text-sm font-medium
            "
            >
              <svg class="w-4 h-4"><!-- China flag --></svg>
              China CDN
            </a>
            <a
              href="#"
              class="
              flex items-center justify-center gap-2 px-3 py-2
              bg-neutral-100 dark:bg-neutral-800 rounded-lg
              text-neutral-700 dark:text-neutral-300
              hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors
              text-sm font-medium
            "
            >
              <svg class="w-4 h-4"><!-- GitHub icon --></svg>
              GitHub
            </a>
          </div>
        </div>

        <p class="text-xs text-neutral-400 mt-3">
          pocketbase_0.23.0_linux_amd64.zip (18.5 MB)
        </p>
      </div>

      <!-- ARM64 -->
      <div
        class="
        p-4 rounded-xl
        border border-neutral-200 dark:border-neutral-700
        hover:border-brand-500/50 transition-colors
      "
      >
        <div class="flex items-center justify-between mb-3">
          <div>
            <h4 class="font-medium text-neutral-900 dark:text-white">
              ARM64 / aarch64
            </h4>
            <p class="text-sm text-neutral-500">For ARM-based systems</p>
          </div>
        </div>

        <div class="space-y-2">
          <p
            class="text-xs font-medium text-neutral-500 uppercase tracking-wider"
          >
            Choose Mirror:
          </p>
          <div class="grid grid-cols-2 gap-2">
            <a
              href="#"
              class="
              flex items-center justify-center gap-2 px-3 py-2
              bg-neutral-100 dark:bg-neutral-800 rounded-lg
              text-neutral-700 dark:text-neutral-300
              hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors
              text-sm font-medium
            "
            >
              China CDN
            </a>
            <a
              href="#"
              class="
              flex items-center justify-center gap-2 px-3 py-2
              bg-neutral-100 dark:bg-neutral-800 rounded-lg
              text-neutral-700 dark:text-neutral-300
              hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors
              text-sm font-medium
            "
            >
              GitHub
            </a>
          </div>
        </div>

        <p class="text-xs text-neutral-400 mt-3">
          pocketbase_0.23.0_linux_arm64.zip (17.2 MB)
        </p>
      </div>
    </div>

    <!-- Checksum -->
    <div class="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
      <div class="flex items-center justify-between">
        <span class="text-sm text-neutral-500">SHA256 Checksum</span>
        <button class="text-sm text-brand-500 hover:text-brand-600 font-medium">
          Copy
        </button>
      </div>
      <code
        class="block mt-2 text-xs font-mono text-neutral-600 dark:text-neutral-400 break-all"
      >
        a1b2c3d4e5f6...
      </code>
    </div>
  </div>
</div>
```

---

### 4.4 VersionBadge

**File:** `src/components/business/VersionBadge.astro`

```typescript
interface Props {
  version: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "stable" | "beta" | "alpha";
  showPrefix?: boolean;
  class?: string;
}
```

```html
<!-- Default -->
<span
  class="
  inline-flex items-center gap-1.5
  px-2 py-0.5 rounded-md
  text-xs font-mono font-medium
  bg-neutral-100 dark:bg-neutral-800
  text-neutral-700 dark:text-neutral-300
"
>
  v0.23.0
</span>

<!-- Stable (with indicator) -->
<span
  class="
  inline-flex items-center gap-1.5
  px-2.5 py-1 rounded-full
  text-xs font-medium
  bg-green-100 dark:bg-green-900/30
  text-green-700 dark:text-green-400
"
>
  <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
  v0.23.0 Stable
</span>

<!-- Beta -->
<span
  class="
  inline-flex items-center gap-1.5
  px-2.5 py-1 rounded-full
  text-xs font-medium
  bg-amber-100 dark:bg-amber-900/30
  text-amber-700 dark:text-amber-400
"
>
  v0.24.0-beta.1
</span>

<!-- Size Variants -->
<!-- sm: text-xs px-2 py-0.5 -->
<!-- md: text-sm px-2.5 py-1 -->
<!-- lg: text-base px-3 py-1.5 -->
```

---

### 4.5 ContributorWall

**File:** `src/components/business/ContributorWall.astro`

```typescript
interface Props {
  contributors: Array<{
    login: string;
    avatar: string;
    url: string;
    contributions: number;
  }>;
  title?: string;
  maxDisplay?: number;
}
```

```html
<section class="py-12">
  <div class="text-center mb-8">
    <h2 class="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
      Our Contributors
    </h2>
    <p class="text-neutral-500">
      Thanks to all {contributors.length} amazing contributors
    </p>
  </div>

  <!-- Avatar Grid -->
  <div class="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
    {contributors.map((contributor, index) => (
    <a
      href="{contributor.url}"
      target="_blank"
      rel="noopener"
      class="
          relative group
          transition-transform duration-200
          hover:scale-110 hover:z-10
        "
      style="{`animation-delay:"
      ${index
      *
      50}ms`}
    >
      <img
        src="{contributor.avatar}"
        alt="{contributor.login}"
        class="
            w-12 h-12 rounded-full
            ring-2 ring-white dark:ring-neutral-900
            group-hover:ring-brand-500
            transition-all
          "
        loading="lazy"
      />

      <!-- Tooltip -->
      <span
        class="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          px-2 py-1 rounded
          bg-neutral-900 text-white text-xs
          whitespace-nowrap
          opacity-0 invisible
          group-hover:opacity-100 group-hover:visible
          transition-all
        "
      >
        @{contributor.login}
        <span class="text-neutral-400">
          - {contributor.contributions} commits</span
        >
      </span>
    </a>
    ))}

    <!-- Overflow indicator -->
    {contributors.length > maxDisplay && (
    <div
      class="
        w-12 h-12 rounded-full
        bg-neutral-100 dark:bg-neutral-800
        flex items-center justify-center
        text-sm font-medium text-neutral-600
      "
    >
      +{contributors.length - maxDisplay}
    </div>
    )}
  </div>
</section>
```

---

### 4.6 SearchBox

**File:** `src/components/business/SearchBox.astro`

```typescript
interface Props {
  placeholder?: string;
  variant?: "default" | "expanded" | "command";
  shortcut?: string;
}
```

```html
<!-- Default Search -->
<div class="relative">
  <div
    class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none"
  >
    <svg
      class="w-5 h-5 text-neutral-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  </div>

  <input
    type="search"
    placeholder="Search plugins, docs..."
    class="
      w-full pl-12 pr-20 py-3 rounded-xl
      bg-neutral-100 dark:bg-neutral-800
      border-0
      text-neutral-900 dark:text-neutral-100
      placeholder:text-neutral-400
      focus:ring-2 focus:ring-brand-500
      transition-all
    "
  />

  <!-- Keyboard Shortcut -->
  <div class="absolute inset-y-0 right-0 flex items-center pr-4">
    <kbd
      class="
      hidden sm:inline-flex items-center gap-1
      px-2 py-1 rounded
      bg-neutral-200 dark:bg-neutral-700
      text-xs font-mono text-neutral-500
    "
    >
      <span class="text-base">&#8984;</span>K
    </kbd>
  </div>
</div>

<!-- Command Palette Trigger (for modal) -->
<button
  class="
  flex items-center gap-3
  w-full max-w-md px-4 py-2.5 rounded-xl
  bg-neutral-100 dark:bg-neutral-800
  text-neutral-400
  border border-transparent
  hover:border-neutral-300 dark:hover:border-neutral-600
  transition-all
"
>
  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
  <span class="flex-1 text-left text-sm">Search everything...</span>
  <kbd
    class="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700 text-xs font-mono"
  >
    &#8984;K
  </kbd>
</button>
```

---

### 4.7 AuthButton

**File:** `src/components/business/AuthButton.tsx` (React with `client:load`)

```typescript
interface Props {
  variant?: "default" | "minimal";
}

// States: logged-out, loading, logged-in
```

```tsx
// React component for client-side auth state
import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";

export default function AuthButton({ variant = "default" }: Props) {
  const [user, setUser] = useState(pb.authStore.model);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    pb.authStore.onChange(() => {
      setUser(pb.authStore.model);
    });
  }, []);

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => (window.location.href = "/auth/login")}
        className="
          inline-flex items-center gap-2 px-4 py-2 rounded-lg
          bg-brand-500 text-white font-medium text-sm
          hover:bg-brand-600 transition-colors
        "
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-2">
        <img
          src={user.avatar || "/avatars/default.svg"}
          alt={user.name}
          className="w-9 h-9 rounded-full ring-2 ring-transparent group-hover:ring-brand-500 transition-all"
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className="
        absolute right-0 top-full mt-2
        w-56 py-2 rounded-xl
        bg-white dark:bg-neutral-900
        border border-neutral-200 dark:border-neutral-800
        shadow-xl
        opacity-0 invisible
        group-hover:opacity-100 group-hover:visible
        transition-all
      "
      >
        <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
          <p className="font-medium text-neutral-900 dark:text-white">
            {user.name}
          </p>
          <p className="text-sm text-neutral-500">{user.email}</p>
        </div>
        <a
          href="/profile"
          className="block px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Profile
        </a>
        <a
          href="/my-plugins"
          className="block px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          My Plugins
        </a>
        <button
          onClick={() => pb.authStore.clear()}
          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
```

---

## 5. Form Components

### 5.1 PluginSubmitForm

**File:** `src/components/forms/PluginSubmitForm.tsx` (React with `client:load`)

```typescript
interface FormData {
  name: string;
  description: string;
  repository: string;
  category: string;
  tags: string[];
  version: string;
  readme: string;
  license: string;
}

interface Props {
  onSuccess?: (plugin: Plugin) => void;
  defaultValues?: Partial<FormData>;
}
```

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(20).max(500),
  repository: z.string().url().includes("github.com"),
  category: z.string(),
  tags: z.array(z.string()).min(1).max(5),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  readme: z.string().min(100),
  license: z.string(),
});

export default function PluginSubmitForm({ onSuccess, defaultValues }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Plugin Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Plugin Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name")}
          className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          placeholder="my-awesome-plugin"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 resize-none"
          placeholder="A brief description of what your plugin does..."
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Repository URL */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          GitHub Repository <span className="text-red-500">*</span>
        </label>
        <input
          {...register("repository")}
          className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          placeholder="https://github.com/username/plugin"
        />
        {errors.repository && (
          <p className="text-sm text-red-500">{errors.repository.message}</p>
        )}
      </div>

      {/* Category & Version Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Category</label>
          <select
            {...register("category")}
            className="w-full px-4 py-2.5 rounded-lg border"
          >
            <option value="">Select category</option>
            <option value="auth">Authentication</option>
            <option value="storage">Storage</option>
            <option value="email">Email</option>
            <option value="api">API Extensions</option>
            <option value="ui">Admin UI</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Version</label>
          <input
            {...register("version")}
            className="w-full px-4 py-2.5 rounded-lg border"
            placeholder="1.0.0"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Tags (up to 5)</label>
        {/* Tag input component */}
      </div>

      {/* README */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">README (Markdown)</label>
        <textarea
          {...register("readme")}
          rows={10}
          className="w-full px-4 py-3 rounded-lg border font-mono text-sm resize-y"
          placeholder="# My Plugin\n\nDescribe your plugin here..."
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <button
          type="button"
          className="px-4 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            inline-flex items-center gap-2 px-6 py-2.5 rounded-lg
            bg-brand-500 text-white font-medium
            hover:bg-brand-600 disabled:opacity-50
            transition-colors
          "
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Submitting...
            </>
          ) : (
            "Submit Plugin"
          )}
        </button>
      </div>
    </form>
  );
}
```

---

### 5.2 ShowcaseSubmitForm

**File:** `src/components/forms/ShowcaseSubmitForm.tsx`

```typescript
interface FormData {
  title: string;
  url: string;
  description: string;
  thumbnail: File;
  category: string;
  techStack: string[];
}
```

Similar structure to PluginSubmitForm with fields for:

- Site title
- Live URL
- Description
- Screenshot upload (with preview)
- Category selection
- Tech stack tags

---

### 5.3 NewsletterForm

**File:** `src/components/forms/NewsletterForm.astro`

```typescript
interface Props {
  variant?: "inline" | "stacked";
  title?: string;
  description?: string;
}
```

```html
<!-- Inline Variant -->
<form class="flex flex-col sm:flex-row gap-3">
  <div class="flex-1">
    <input
      type="email"
      required
      placeholder="Enter your email"
      class="
        w-full px-4 py-3 rounded-xl
        bg-neutral-100 dark:bg-neutral-800
        border-0
        text-neutral-900 dark:text-neutral-100
        placeholder:text-neutral-400
        focus:ring-2 focus:ring-brand-500
      "
    />
  </div>
  <button
    type="submit"
    class="
      px-6 py-3 rounded-xl
      bg-brand-500 text-white font-medium
      hover:bg-brand-600
      transition-colors
      whitespace-nowrap
    "
  >
    Subscribe
  </button>
</form>

<!-- Stacked Variant (with context) -->
<div
  class="
  p-8 rounded-2xl
  bg-gradient-to-br from-brand-500 to-purple-600
  text-white text-center
"
>
  <h3 class="text-2xl font-bold mb-2">Stay Updated</h3>
  <p class="text-white/80 mb-6">
    Get notified about new plugins, features, and releases.
  </p>
  <form class="max-w-md mx-auto space-y-3">
    <input
      type="email"
      required
      placeholder="you@example.com"
      class="
        w-full px-4 py-3 rounded-xl
        bg-white/20 backdrop-blur
        border border-white/30
        text-white placeholder:text-white/60
        focus:bg-white/30 focus:ring-2 focus:ring-white/50
      "
    />
    <button
      type="submit"
      class="
        w-full px-6 py-3 rounded-xl
        bg-white text-brand-600 font-semibold
        hover:bg-neutral-100
        transition-colors
      "
    >
      Subscribe to Newsletter
    </button>
  </form>
  <p class="text-xs text-white/60 mt-4">No spam, unsubscribe anytime.</p>
</div>
```

---

## 6. Interactive Components

> These components require `client:load` or `client:visible` for hydration.

### 6.1 PluginList

**File:** `src/components/interactive/PluginList.tsx`

```typescript
interface Props {
  initialPlugins: Plugin[];
  categories: Category[];
  totalCount: number;
}

interface Filters {
  search: string;
  category: string | null;
  sort: "popular" | "recent" | "stars";
  page: number;
}
```

```tsx
import { useState, useEffect, useMemo } from "react";
import { PluginCard } from "@/components/business/PluginCard";
import { useDebounce } from "@/hooks/useDebounce";

export default function PluginList({
  initialPlugins,
  categories,
  totalCount,
}: Props) {
  const [plugins, setPlugins] = useState(initialPlugins);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: null,
    sort: "popular",
    page: 1,
  });
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(() => {
    if (debouncedSearch || filters.category || filters.sort !== "popular") {
      fetchPlugins();
    }
  }, [debouncedSearch, filters.category, filters.sort, filters.page]);

  async function fetchPlugins() {
    setLoading(true);
    // Fetch from PocketBase
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="search"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: 1 })
              }
              placeholder="Search plugins..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
          <button
            onClick={() => setFilters({ ...filters, category: null, page: 1 })}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
              transition-colors
              ${
                !filters.category
                  ? "bg-brand-500 text-white"
                  : "bg-white dark:bg-neutral-800 hover:bg-neutral-100"
              }
            `}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setFilters({ ...filters, category: cat.id, page: 1 })
              }
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                transition-colors
                ${
                  filters.category === cat.id
                    ? "bg-brand-500 text-white"
                    : "bg-white dark:bg-neutral-800 hover:bg-neutral-100"
                }
              `}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={(e) =>
            setFilters({
              ...filters,
              sort: e.target.value as Filters["sort"],
              page: 1,
            })
          }
          className="px-4 py-2.5 rounded-lg border bg-white dark:bg-neutral-800"
        >
          <option value="popular">Most Popular</option>
          <option value="recent">Recently Added</option>
          <option value="stars">Most Stars</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          Showing {plugins.length} of {totalCount} plugins
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? // Skeleton loaders
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
              />
            ))
          : plugins.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
      </div>

      {/* Empty State */}
      {!loading && plugins.length === 0 && (
        <div className="text-center py-16">
          <p className="text-neutral-500">
            No plugins found matching your criteria.
          </p>
          <button
            onClick={() =>
              setFilters({
                search: "",
                category: null,
                sort: "popular",
                page: 1,
              })
            }
            className="mt-4 text-brand-500 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalCount > 12 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            className="px-4 py-2 rounded-lg border disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">Page {filters.page}</span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            className="px-4 py-2 rounded-lg border"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### 6.2 ShowcaseGallery

**File:** `src/components/interactive/ShowcaseGallery.tsx`

```typescript
interface Props {
  showcases: Showcase[];
  categories: string[];
}
```

```tsx
import { useState } from "react";
import { ShowcaseCard } from "@/components/business/ShowcaseCard";

export default function ShowcaseGallery({ showcases, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = activeCategory
    ? showcases.filter((s) => s.category === activeCategory)
    : showcases;

  return (
    <div className="space-y-8">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium
            transition-all
            ${
              !activeCategory
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200"
            }
          `}
        >
          All ({showcases.length})
        </button>
        {categories.map((cat) => {
          const count = showcases.filter((s) => s.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium
                transition-all
                ${
                  activeCategory === cat
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200"
                }
              `}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 ${viewMode === "grid" ? "bg-neutral-100 dark:bg-neutral-800" : ""}`}
          >
            <svg className="w-5 h-5" /* Grid icon */ />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 ${viewMode === "list" ? "bg-neutral-100 dark:bg-neutral-800" : ""}`}
          >
            <svg className="w-5 h-5" /* List icon */ />
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div
        className={`
        ${
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }
      `}
      >
        {filtered.map((showcase) => (
          <ShowcaseCard
            key={showcase.id}
            showcase={showcase}
            variant={viewMode === "list" ? "compact" : "default"}
          />
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-16 bg-neutral-50 dark:bg-neutral-900 rounded-2xl">
          <p className="text-neutral-500">No showcases in this category yet.</p>
          <a
            href="/submit/showcase"
            className="mt-4 inline-block text-brand-500 hover:underline"
          >
            Submit your project
          </a>
        </div>
      )}
    </div>
  );
}
```

---

### 6.3 DownloadCounter

**File:** `src/components/interactive/DownloadCounter.tsx`

```typescript
interface Props {
  assetId: string;
  initialCount?: number;
}
```

```tsx
import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";

export default function DownloadCounter({ assetId, initialCount = 0 }: Props) {
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Subscribe to real-time updates
    pb.collection("downloads").subscribe("*", (e) => {
      if (e.record.asset === assetId) {
        setAnimating(true);
        setCount((c) => c + 1);
        setTimeout(() => setAnimating(false), 500);
      }
    });

    return () => {
      pb.collection("downloads").unsubscribe();
    };
  }, [assetId]);

  // Format number with commas
  const formatted = count.toLocaleString();

  return (
    <div className="flex items-center gap-2 text-neutral-500">
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <span
        className={`
        font-mono tabular-nums
        transition-all duration-300
        ${animating ? "text-brand-500 scale-110" : ""}
      `}
      >
        {formatted}
      </span>
      <span className="text-sm">downloads</span>
    </div>
  );
}
```

---

## Appendix: Tailwind Configuration

```javascript
// tailwind.config.mjs
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f5ff",
          100: "#e0ebff",
          200: "#c2d6ff",
          300: "#94b8ff",
          400: "#5c8fff",
          500: "#3366ff",
          600: "#1a4fff",
          700: "#0f3de6",
          800: "#1233bf",
          900: "#142e96",
          950: "#0f1d5c",
        },
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        mono: ["JetBrains Mono", ...defaultTheme.fontFamily.mono],
      },
      animation: {
        "slide-in-right": "slideInRight 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "scale-in": "scaleIn 0.15s ease-out",
      },
      keyframes: {
        slideInRight: {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
```

---

## Component File Structure

```
src/
  components/
    ui/
      Button.astro
      Input.astro
      Textarea.astro
      Select.astro
      Card.astro
      Badge.astro
      Avatar.astro
      Modal.astro
      Toast.tsx
      Tooltip.astro
    layout/
      Header.astro
      Footer.astro
      Sidebar.astro
      Container.astro
      Grid.astro
    business/
      PluginCard.astro
      ShowcaseCard.astro
      MirrorDownload.astro
      VersionBadge.astro
      ContributorWall.astro
      SearchBox.astro
      AuthButton.tsx
    forms/
      PluginSubmitForm.tsx
      ShowcaseSubmitForm.tsx
      NewsletterForm.astro
    interactive/
      PluginList.tsx
      ShowcaseGallery.tsx
      DownloadCounter.tsx
```

---

## Usage Guidelines

### Hydration Strategy

| Component Type | Directive        | Reason                    |
| -------------- | ---------------- | ------------------------- |
| Static UI      | None             | Server-rendered only      |
| Auth State     | `client:load`    | Needs immediate hydration |
| Forms          | `client:load`    | Requires validation       |
| Filters/Search | `client:visible` | Can wait until visible    |
| Counters       | `client:idle`    | Low priority              |

### Accessibility Checklist

- [ ] All interactive elements have focus states
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Form inputs have labels
- [ ] Images have alt text
- [ ] Keyboard navigation works
- [ ] Screen reader tested

### Performance Targets

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1

---

_Document maintained by PocketBase.cn Team_
