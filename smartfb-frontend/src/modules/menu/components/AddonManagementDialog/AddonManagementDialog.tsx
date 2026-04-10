import { useState } from 'react';
import type { MenuAddonInfo } from '@modules/menu/types/menu.types';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/components/ui/dialog';
import { AddonCreateForm } from './AddonCreateForm';
import { AddonList } from './AddonList';

interface AddonManagementDialogProps {
  addons: MenuAddonInfo[];
  isLoading: boolean;
  isError: boolean;
  isFetching?: boolean;
  onRetry: () => void;
  triggerClassName?: string;
}

/**
 * Dialog quản lý topping trong trang thực đơn.
 */
export const AddonManagementDialog = ({
  addons,
  isLoading,
  isError,
  isFetching = false,
  onRetry,
  triggerClassName,
}: AddonManagementDialogProps) => {
  const [open, setOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<MenuAddonInfo | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setEditingAddon(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className={cn('gap-2', triggerClassName)}>
          Quản lý topping
        </Button>
      </DialogTrigger>

      <DialogContent className="flex h-[min(800px,90vh)] w-[calc(100vw-1rem)] max-w-7xl flex-col overflow-hidden border-0 p-0">
        <DialogHeader className="shrink-0 border-b border-amber-100 px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <DialogTitle className="text-lg text-gray-900 sm:text-xl">Quản lý topping</DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden px-4 pb-4 pt-2 sm:gap-6 sm:px-6 sm:pb-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div
            className={cn(
              'min-h-0 overflow-y-auto rounded-3xl border p-4 sm:p-5',
              editingAddon ? 'border-sky-200 bg-sky-50/70' : 'border-amber-100 bg-amber-50/50'
            )}
          >
            <AddonCreateForm
              editingAddon={editingAddon}
              onCancelEdit={() => setEditingAddon(null)}
            />
          </div>

          <div className="min-h-0 overflow-y-auto rounded-3xl border border-amber-100 bg-white p-4 sm:p-5">
            <AddonList
              addons={addons}
              isLoading={isLoading}
              isError={isError}
              isFetching={isFetching}
              onRetry={onRetry}
              onEditAddon={setEditingAddon}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
