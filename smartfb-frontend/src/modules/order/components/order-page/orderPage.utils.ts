import type { MenuItem } from '@modules/menu/types/menu.types';
import type {
  OrderAddonSelection,
  OrderDraftItem,
  OrderItemCommand,
  OrderItemResponse,
  OrderResponse,
  OrderSource,
  UpdateOrderItemCommand,
} from '@modules/order/types/order.types';

export const DEFAULT_MENU_IMAGE =
  'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600&auto=format&fit=crop';

// Backend order module hiện chưa cộng VAT vào tổng tiền, FE cần giữ cùng contract để tránh lệch số.
export const ORDER_TAX_RATE = 0;

export const buildAddonPayload = (addons: OrderAddonSelection[]): string | undefined => {
  if (addons.length === 0) {
    return undefined;
  }

  return JSON.stringify(
    addons.map((addon) => ({
      addonId: addon.addonId,
      addonName: addon.addonName,
      extraPrice: addon.extraPrice,
      quantity: addon.quantity,
    }))
  );
};

export const calculateLineTotal = (
  unitPrice: number,
  quantity: number,
  addons: OrderAddonSelection[]
): number => {
  const addonPerUnitTotal = addons.reduce(
    (sum, addon) => sum + addon.extraPrice * addon.quantity,
    0
  );

  return (unitPrice + addonPerUnitTotal) * quantity;
};

export const createDraftItemId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const toDraftItem = (
  menuItem: MenuItem,
  quantity: number,
  addons: OrderAddonSelection[],
  notes: string,
  draftItemId?: string,
  orderItemId?: string
): OrderDraftItem => {
  return {
    draftItemId: draftItemId ?? createDraftItemId(),
    menuItemId: menuItem.id,
    orderItemId,
    name: menuItem.name,
    description: menuItem.description,
    image: menuItem.image || DEFAULT_MENU_IMAGE,
    categoryId: menuItem.category,
    quantity,
    unitPrice: menuItem.price,
    addons,
    notes,
    lineTotal: calculateLineTotal(menuItem.price, quantity, addons),
  };
};

export const toOrderItemCommand = (item: OrderDraftItem): OrderItemCommand => {
  return {
    itemId: item.menuItemId,
    itemName: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    addons: buildAddonPayload(item.addons),
    notes: item.notes || undefined,
  };
};

export const toUpdateOrderItemCommand = (item: OrderDraftItem): UpdateOrderItemCommand => {
  return {
    id: item.orderItemId ?? undefined,
    ...toOrderItemCommand(item),
  };
};

export const resolveOrderSource = (tableId: string | null | undefined): OrderSource => {
  return tableId ? 'IN_STORE' : 'TAKEAWAY';
};

export const getSafeAddons = (
  item: Pick<OrderDraftItem, 'addons'>
): OrderAddonSelection[] => {
  return Array.isArray(item.addons) ? item.addons : [];
};

const normalizeDraftItemNote = (notes: string | undefined): string => {
  return (notes ?? '').trim();
};

const createAddonIdentityKey = (addons: OrderAddonSelection[]): string => {
  return [...addons]
    .sort((left, right) => {
      if (left.addonId !== right.addonId) {
        return left.addonId.localeCompare(right.addonId);
      }

      return left.quantity - right.quantity;
    })
    .map((addon) => `${addon.addonId}:${addon.quantity}:${addon.extraPrice}`)
    .join('|');
};

/**
 * So sánh 2 dòng món để biết có thể gộp vào cùng một dòng trong cart hay không.
 * Chỉ gộp khi cùng món, cùng giá, cùng topping và cùng ghi chú.
 */
export const isSameCartLine = (
  leftItem: Pick<OrderDraftItem, 'menuItemId' | 'unitPrice' | 'addons' | 'notes'>,
  rightItem: Pick<OrderDraftItem, 'menuItemId' | 'unitPrice' | 'addons' | 'notes'>
): boolean => {
  return (
    leftItem.menuItemId === rightItem.menuItemId &&
    leftItem.unitPrice === rightItem.unitPrice &&
    normalizeDraftItemNote(leftItem.notes) === normalizeDraftItemNote(rightItem.notes) &&
    createAddonIdentityKey(getSafeAddons(leftItem)) ===
      createAddonIdentityKey(getSafeAddons(rightItem))
  );
};

/**
 * Gộp số lượng vào dòng món đã có để FE gửi update đúng item hiện tại lên backend.
 */
export const mergeCartLineQuantity = (
  currentItem: OrderDraftItem,
  addedItem: OrderDraftItem
): OrderDraftItem => {
  const nextQuantity = currentItem.quantity + addedItem.quantity;
  const safeAddons = getSafeAddons(currentItem);

  return {
    ...currentItem,
    quantity: nextQuantity,
    lineTotal: calculateLineTotal(currentItem.unitPrice, nextQuantity, safeAddons),
  };
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

/**
 * Parse chuỗi addons JSON từ backend về danh sách topping FE đang dùng.
 */
export const parseAddonPayload = (payload?: string | null): OrderAddonSelection[] => {
  if (!payload) {
    return [];
  }

  try {
    const parsedPayload: unknown = JSON.parse(payload);

    if (!Array.isArray(parsedPayload)) {
      return [];
    }

    return parsedPayload.reduce<OrderAddonSelection[]>((accumulator, item) => {
      if (!isObjectRecord(item)) {
        return accumulator;
      }

      const addonId = typeof item.addonId === 'string' ? item.addonId : '';
      const addonName = typeof item.addonName === 'string' ? item.addonName : '';
      const extraPrice =
        typeof item.extraPrice === 'number'
          ? item.extraPrice
          : Number(item.extraPrice ?? 0) || 0;
      const quantity =
        typeof item.quantity === 'number'
          ? item.quantity
          : Number(item.quantity ?? 0) || 0;

      if (!addonId || !addonName || quantity <= 0) {
        return accumulator;
      }

      accumulator.push({
        addonId,
        addonName,
        extraPrice,
        quantity,
      });

      return accumulator;
    }, []);
  } catch {
    return [];
  }
};

export const getCartItemSummary = (item: OrderDraftItem): string => {
  const addonSummary = getSafeAddons(item)
    .map((addon) => `${addon.addonName} x${addon.quantity}`)
    .join(', ');

  if (item.notes && addonSummary) {
    return `${addonSummary} • ${item.notes}`;
  }

  return item.notes || addonSummary || 'Không có ghi chú thêm';
};

export const toDialogMenuItem = (item: OrderDraftItem): MenuItem => {
  return {
    id: item.menuItemId,
    name: item.name,
    category: item.categoryId ?? 'uncategorized',
    price: item.unitPrice,
    gpPercent: 0,
    image: item.image || DEFAULT_MENU_IMAGE,
    status: 'selling',
    soldCount: 0,
    createdAt: Date.now(),
    description: item.description,
    isAvailable: true,
    isActive: true,
  };
};

/**
 * Map một dòng món backend sang cart item FE để render và chỉnh sửa tiếp.
 */
export const toDraftItemFromOrderItem = (
  item: OrderItemResponse,
  menuItem?: MenuItem
): OrderDraftItem => {
  const parsedAddons = parseAddonPayload(item.addons);
  const resolvedImage = menuItem?.image || DEFAULT_MENU_IMAGE;
  const resolvedUnitPrice = item.unitPrice;

  return {
    draftItemId: item.id,
    menuItemId: item.itemId,
    orderItemId: item.id,
    name: item.itemName,
    description: menuItem?.description,
    image: resolvedImage,
    categoryId: menuItem?.category,
    quantity: item.quantity,
    unitPrice: resolvedUnitPrice,
    addons: parsedAddons,
    notes: item.notes ?? '',
    lineTotal: calculateLineTotal(resolvedUnitPrice, item.quantity, parsedAddons),
  };
};

/**
 * Map order detail từ backend sang cart FE để đồng bộ source of truth.
 */
export const toDraftItemsFromOrder = (
  order: OrderResponse,
  menuItemsById: Map<string, MenuItem>
): OrderDraftItem[] => {
  return order.items.map((item) => toDraftItemFromOrderItem(item, menuItemsById.get(item.itemId)));
};
