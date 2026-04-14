import { useState } from 'react';
import {
  OrderItemDialog,
  OrderCategoryTabs,
  OrderMenuGrid,
  OrderPageCartActions,
  OrderPageCartSidebar,
  OrderPageToolbar,
  TemporaryInvoiceDialog,
} from '@modules/order/components';
import { useOrderPageController } from '@modules/order/hooks';
import { cn } from '@shared/utils/cn';

export default function OrderPage() {
  const [showCart, setShowCart] = useState(true);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const {
    addons,
    cart,
    categories,
    checkoutButtonLabel,
    clearActiveSelections,
    currentUserName,
    dialogMenuItem,
    displayBranchName,
    displayTableName,
    displayZoneName,
    draftOrder,
    editingCartItem,
    filteredItems,
    handleCancelPlacedOrder,
    handleChangeItemQuantity,
    handleCheckout,
    handleDeleteCartItem,
    handleEditCartItem,
    handleOpenInvoice,
    handleOpenItemDialog,
    handleSubmitItem,
    hasErrorState,
    hasLoadingState,
    hasPlacedOrder,
    isInvoiceOpen,
    isPlacedOrderFinalized,
    isSyncingDraft,
    searchKeyword,
    selectedCategory,
    selectedCategoryLabel,
    setIsInvoiceOpen,
    setSearchKeyword,
    setSelectedCategory,
    subtotal,
    tableContext,
    totalAmount,
    totalItemCount,
    vatAmount,
  } = useOrderPageController();

  const cartPanelProps = {
    cart,
    tableContext,
    draftOrder,
    currentUserName,
    hasPlacedOrder,
    isSyncingDraft,
    isItemActionsDisabled: isSyncingDraft || isPlacedOrderFinalized,
    totalItemCount,
    subtotal,
    vatAmount,
    totalAmount,
    checkoutButtonLabel,
    isCheckoutDisabled: isPlacedOrderFinalized,
    onOpenInvoice: handleOpenInvoice,
    onCancelPlacedOrder: handleCancelPlacedOrder,
    onEditCartItem: handleEditCartItem,
    onDeleteCartItem: handleDeleteCartItem,
    onChangeItemQuantity: handleChangeItemQuantity,
    onCheckout: handleCheckout,
  };

  if (hasLoadingState) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-[32px] bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="font-medium text-slate-500">Đang tải dữ liệu order...</p>
        </div>
      </div>
    );
  }

  if (hasErrorState) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white">
        <div className="max-w-md text-center">
          <p className="text-lg font-bold text-slate-800">Không thể tải dữ liệu order</p>
          <p className="mt-2 text-sm text-slate-500">
            Kiểm tra lại API menu, category, addon hoặc dữ liệu order của bàn trước khi thao tác.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'grid min-h-[calc(100vh-10rem)] grid-cols-1 gap-6 xl:items-start',
          showCart && 'xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_440px]'
        )}
      >
        <section className="min-h-0 space-y-5">
          <OrderPageToolbar
            cartActions={
              <OrderPageCartActions
                showCart={showCart}
                totalItemCount={totalItemCount}
                isCartSheetOpen={isCartSheetOpen}
                onCartSheetOpenChange={setIsCartSheetOpen}
                onToggleCart={() => setShowCart((prev) => !prev)}
                cartPanelProps={cartPanelProps}
              />
            }
            searchKeyword={searchKeyword}
            tableName={displayTableName}
            onSearchKeywordChange={setSearchKeyword}
            onClearSearch={() => setSearchKeyword('')}
          />

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          

      
              <OrderCategoryTabs
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
        
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        
             
                <p className="text-sm leading-6 text-slate-500">
                  {searchKeyword
                    ? `Đang lọc theo từ khóa "${searchKeyword}" trong ${selectedCategoryLabel.toLowerCase()}.`
                    : `Hiển thị món trong ${selectedCategoryLabel.toLowerCase()} để chọn nhanh.`}
                </p>
      
            <div className="mt-5">
              <OrderMenuGrid items={filteredItems} onSelectItem={handleOpenItemDialog} />
            </div>
          </section>
        </section>

        <OrderPageCartSidebar showCart={showCart} cartPanelProps={cartPanelProps} />
      </div>

      <OrderItemDialog
        key={`${draftOrder.orderId ?? 'draft'}-${dialogMenuItem?.id ?? 'empty'}-${editingCartItem?.draftItemId ?? 'new'}`}
        open={Boolean(dialogMenuItem)}
        menuItem={dialogMenuItem}
        initialItem={editingCartItem}
        addons={addons}
        isSubmitting={isSyncingDraft}
        onOpenChange={(open) => {
          if (!open) {
            clearActiveSelections();
          }
        }}
        onSubmit={handleSubmitItem}
      />

      <TemporaryInvoiceDialog
        open={isInvoiceOpen}
        branchName={tableContext?.branchName || 'Chi nhánh hiện tại'}
        createdBy={currentUserName}
        orderNumber={draftOrder.orderNumber || 'ORDER-TEMP'}
        createdAt={draftOrder.createdAt ?? new Date().toISOString()}
        tableContext={tableContext}
        cartItems={cart}
        subtotal={subtotal}
        vatAmount={vatAmount}
        totalAmount={totalAmount}
        onOpenChange={setIsInvoiceOpen}
        onPrint={() => window.print()}
      />
    </>
  );
}
