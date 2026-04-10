import type { MenuItem } from '@modules/menu/types/menu.types';
import type {
  OrderAddonSelection,
  OrderDraftItem,
  OrderItemCommand,
  OrderSource,
} from '@modules/order/types/order.types';

export const DEFAULT_MENU_IMAGE =
  'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600&auto=format&fit=crop';

export const ORDER_TAX_RATE = 0.08;

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

export const resolveOrderSource = (tableId: string | null | undefined): OrderSource => {
  return tableId ? 'IN_STORE' : 'TAKEAWAY';
};

export const getSafeAddons = (item: OrderDraftItem): OrderAddonSelection[] => {
  return Array.isArray(item.addons) ? item.addons : [];
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
