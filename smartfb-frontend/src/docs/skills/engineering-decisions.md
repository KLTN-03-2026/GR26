# 🏗️ SmartF&B Frontend — Engineering Decisions Template
> Dùng khi cần đánh giá và chốt giải pháp kỹ thuật FE quan trọng.
> AI dùng template này khi developer nêu vấn đề kỹ thuật phức tạp hoặc cần so sánh giải pháp.

---

## 🎯 TRIGGER

Skill này kích hoạt khi developer nói:
- "UI bị giật/chậm ở [trang X]"
- "Nên dùng A hay B cho [tính năng X]?"
- "Có cách nào tối ưu [X] không?"
- "Realtime [X] nên implement thế nào?"
- "State management cho [X] dùng gì?"

---

## 📄 TEMPLATE DECISION RECORD

```markdown
# 🔧 FED-{số}: {Tiêu đề vấn đề / giải pháp}
**Ngày tạo:** YYYY-MM-DD
**Tác giả:** @tên
**Trạng thái:** Proposal | Reviewed | Approved | Implemented
**Module liên quan:** {danh sách module}

---

## 1. 🔍 Mô tả vấn đề

### Triệu chứng hiện tại
{Mô tả vấn đề user/developer gặp phải}

### Tác động
- **Trang/tính năng bị ảnh hưởng:** {Tên trang cụ thể}
- **Tần suất:** {Mỗi lần vào trang | Chỉ khi có nhiều data | Giờ cao điểm}
- **Mức độ:** 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low

### Số liệu đo lường (nếu có)
| Metric | Hiện tại | Mục tiêu |
|--------|----------|----------|
| Thời gian render | {X}ms | <{Y}ms |
| Bundle size | {X}kb | <{Y}kb |
| Re-render count | {X} lần | <{Y} lần |

---

## 2. 🔬 Phân tích nguyên nhân

### Nguyên nhân kỹ thuật
{Giải thích tại sao vấn đề xảy ra trong codebase React/TypeScript}

### Minh họa
```tsx
// Code snippet thể hiện vấn đề
```

---

## 3. 🏆 Giải pháp đề xuất

### Giải pháp A: {Tên}

**Mô tả:** {Giải thích ngắn}

**Cách implement:**
```tsx
// Code snippet minh họa
```

| Tiêu chí | Đánh giá |
|----------|----------|
| Thời gian implement | {X} giờ / ngày |
| Độ phức tạp | ⭐⭐⭐ Cao / ⭐⭐ Trung bình / ⭐ Thấp |
| Breaking change | Có / Không |
| Bundle size impact | +{X}kb / Không đổi / -{X}kb |

**Ưu điểm:**
- ✅ {Ưu điểm 1}

**Nhược điểm:**
- ❌ {Nhược điểm 1}

---

### Giải pháp B: {Tên}

{Cấu trúc tương tự A}

---

## 4. ⚖️ So sánh tổng hợp

| Tiêu chí | Giải pháp A | Giải pháp B |
|----------|-------------|-------------|
| Thời gian implement | | |
| Performance gain | | |
| Phù hợp timeline | | |
| Maintainability | | |

---

## 5. 🎯 Khuyến nghị

**Chọn:** Giải pháp {A/B}

**Lý do:** {Giải thích phù hợp với bối cảnh dự án SmartF&B}

**Fallback:** {Nếu không thành công, làm gì?}

---

## 6. 📝 Definition of Done
- [ ] Không có lỗi TypeScript
- [ ] Performance đạt mục tiêu đề ra
- [ ] Không có regression ở trang liên quan
- [ ] Đã test trên mobile (POS chạy trên tablet)
```

---

## 📌 VÍ DỤ — "POS Screen render chậm khi có nhiều topping"

```markdown
# 🔧 FED-001: Tối ưu render MenuGrid trên POS Screen
**Ngày tạo:** 2026-03-20
**Trạng thái:** Approved
**Module:** order (POS)

---

## 1. Mô tả vấn đề

### Triệu chứng
Khi thực đơn có >50 món, MenuGrid trên POS bị giật lag ~800ms mỗi khi
cashier chọn danh mục. Tab chuyển danh mục lại re-render toàn bộ grid.

### Tác động
- **Trang:** /pos/orders — màn hình chính của cashier
- **Tần suất:** Mỗi lần chuyển tab danh mục (thao tác rất thường xuyên)
- **Mức độ:** 🔴 Critical — ảnh hưởng trực tiếp tốc độ phục vụ

| Metric | Hiện tại | Mục tiêu |
|--------|----------|----------|
| Tab switch render | ~800ms | <100ms |
| Re-render count | Toàn bộ 50+ items | Chỉ items thay đổi |

---

## 2. Nguyên nhân

MenuItemCard không được memoize, parent state thay đổi (activeCategory)
khiến toàn bộ grid re-render dù data không đổi.

```tsx
// Vấn đề: không có React.memo
const MenuItemCard = ({ item, onAdd }) => { ... }; // Re-render mỗi lần parent render
```

---

## 3. Giải pháp

### Giải pháp A: React.memo + useCallback

```tsx
// Memoize component
const MenuItemCard = React.memo(({ item, onAdd }: MenuItemCardProps) => { ... });

// Memoize callback trong parent
const handleAddItem = useCallback((itemId: string) => {
  cartStore.addItem(itemId);
}, []); // Stable reference
```

| Tiêu chí | |
|----------|-|
| Thời gian implement | 2 giờ |
| Độ phức tạp | ⭐ Thấp |
| Breaking change | Không |

✅ Nhanh implement, đúng use case
❌ Phải nhớ memo mọi callback prop

### Giải pháp B: Virtual List (react-virtual)

Chỉ render items trong viewport, scroll ảo.

| Tiêu chí | |
|----------|-|
| Thời gian implement | 1 ngày |
| Độ phức tạp | ⭐⭐⭐ Cao |
| Breaking change | Phải redesign layout |

✅ Giải quyết triệt để với 1000+ items
❌ Over-engineering cho <100 items, khó maintain

---

## 4. Khuyến nghị

**Chọn Giải pháp A** — React.memo + useCallback.
Thực đơn SmartF&B thường <100 items. Virtual list là over-engineering.
Implement nhanh trong 1 buổi, không break layout hiện tại.

**Fallback:** Nếu vẫn chậm với >200 items, áp dụng Giải pháp B sau.

---

## 5. Definition of Done
- [ ] Tab switch < 100ms với 50 items trên Chrome DevTools
- [ ] React DevTools Profiler: không còn unnecessary re-renders
- [ ] Test trên iPad (thiết bị POS thực tế)
```

---

## 📌 VÍ DỤ — "State management cho Cart POS"

```markdown
# 🔧 FED-002: Chọn state management cho giỏ hàng POS
**Ngày tạo:** 2026-03-18
**Trạng thái:** Implemented
**Module:** order

---

## 1. Vấn đề

Cart POS cần:
- Thêm/xóa/sửa item realtime (không cần server)
- Persist khi cashier navigate giữa menu và bàn
- Clear sau khi thanh toán xong
- Không cần share ra ngoài module order

---

## 3. So sánh

| Tiêu chí | TanStack Query | useState | Zustand |
|----------|---------------|----------|---------|
| Server sync | ✅ Tốt | ❌ Không | ❌ Không |
| Local perf | ❌ Overhead | ✅ Tốt | ✅ Tốt |
| Persist session | ❌ Mất khi navigate | ❌ Mất khi navigate | ✅ Giữ được |
| Phù hợp use case | ❌ Server data only | ❌ Mất khi navigate | ✅ |

## 5. Khuyến nghị

**Dùng Zustand** cho cartStore.
Cart là local state cần persist trong session, không liên quan server data.
TanStack Query dành cho server state, useState mất khi component unmount.

cartStore interface:
```typescript
interface CartState {
  items: CartItem[];
  tableId: string | null;
  orderType: 'dine_in' | 'take_away';
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQty: (menuItemId: string, qty: number) => void;
  clearCart: () => void;
  setTable: (tableId: string | null) => void;
}
```
```
