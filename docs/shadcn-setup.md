# Shadcn/UI Setup Guide

> Stack: **Vite + React 19 + TypeScript**  
> Shadcn không phải là thư viện cài qua npm — nó **copy source code** component vào thẳng project của bạn (trong `src/shared/components/ui/`).

---

## 1. Cài các dependencies bắt buộc

```bash
cd fe

# Tailwind CSS v4 (shadcn mới nhất dùng v4)
npm install tailwindcss@latest @tailwindcss/vite

# Shadcn peer dependencies
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Radix UI (shadcn dùng nội bộ, tự động cài khi add component)
# Không cần cài tay — shadcn CLI sẽ handle
```

---

## 2. Cài Tailwind CSS vào Vite

### `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'   // ← thêm dòng này

export default defineConfig({
  plugins: [
    tailwindcss(),                              // ← thêm dòng này (đặt trước react)
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})
```

### `src/index.css`

Thêm vào đầu file (thay thế @tailwind directives cũ nếu có):

```css
@import "tailwindcss";
```

---

## 3. Cấu hình path alias `@`

Shadcn dùng alias `@` để import (`@/shared/components/ui/button`).

### `tsconfig.app.json` — thêm `paths`

```json
{
  "compilerOptions": {
    ...
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### `vite.config.ts` — thêm `resolve.alias`

```ts
import path from 'path'

export default defineConfig({
  plugins: [...],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

## 4. Khởi tạo Shadcn

```bash
npx shadcn@latest init
```

CLI sẽ hỏi một số câu — chọn như sau:

| Câu hỏi | Chọn |
|---|---|
| Which style? | **Default** |
| Which color? | **Slate** (hoặc tuỳ) |
| Where is your global CSS file? | `src/index.css` |
| Do you want to use CSS variables? | **Yes** |
| Where is your `tailwind.config`? | *(bỏ qua với Tailwind v4)* |
| Configure `components.json`? | **Yes** |
| Where to put components? | `src/shared/components/ui` |
| Where to put utils? | `src/shared/utils` |

> Sau bước này, project sẽ có file `components.json` ở root `fe/`.

---

## 5. Cấu hình `components.json` thủ công (nếu cần)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/shared/components",
    "utils": "@/shared/utils",
    "ui": "@/shared/components/ui",
    "lib": "@/lib",
    "hooks": "@/shared/hooks"
  }
}
```

---

## 6. Thêm component

```bash
# Cách thêm từng component
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add table
npx shadcn@latest add select
npx shadcn@latest add badge

# Thêm nhiều cùng lúc
npx shadcn@latest add button input dialog table
```

Component sẽ được copy vào `src/shared/components/ui/`.

---

## 7. Dùng component trong project

```tsx
// src/modules/auth/components/LoginForm.tsx
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

export function LoginForm() {
  return (
    <form>
      <Input placeholder="Email" type="email" />
      <Button type="submit">Đăng nhập</Button>
    </form>
  )
}
```

---

## 8. Utility `cn()` (merge class Tailwind)

Shadcn tự tạo file `src/shared/utils/cn.ts` (hoặc trong `lib/utils.ts`). Nếu chưa có:

```ts
// src/shared/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Dùng trong component:

```tsx
import { cn } from '@/shared/utils/cn'

<div className={cn('base-class', isActive && 'active-class', className)} />
```

---

## Cấu trúc sau khi setup

```
fe/
├── components.json              ← shadcn config
├── src/
│   ├── index.css                ← @import "tailwindcss" + CSS variables
│   └── shared/
│       ├── components/
│       │   └── ui/              ← shadcn components (Button, Input, Dialog...)
│       ├── hooks/
│       └── utils/
│           └── cn.ts            ← utility merge class
```

---

## Lưu ý

- **Không push `node_modules`** nhưng **nên push `src/shared/components/ui/`** vì đây là source code thật.
- Mỗi khi cần component mới: `npx shadcn@latest add <tên>`.
- Có thể sửa trực tiếp source code trong `ui/` để tuỳ chỉnh theo design system.
- Xem thêm: [https://ui.shadcn.com/docs](https://ui.shadcn.com/docs)
