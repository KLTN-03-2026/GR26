import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMenuSchema, type CreateMenuFormValues } from '@modules/menu/schemas/menu.schema';
import { MenuForm } from './MenuForm';
import { useCreateMenu } from '@modules/menu/hooks/useCreateMenu';

interface AddMenuDialogProps {
  onSuccess?: () => void;
}

/**
 * Dialog để tạo mới món ăn
 */
export const AddMenuDialog = ({ onSuccess }: AddMenuDialogProps) => {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateMenu();

  const form = useForm<CreateMenuFormValues>({
    resolver: zodResolver(createMenuSchema),
    defaultValues: {
      name: '',
      category: 'ca-phe',
      price: 0,
      cost: undefined,
      description: '',
      ingredients: [],
      image: '',
      tags: [],
    },
  });

  const handleSubmit = (values: CreateMenuFormValues) => {
    mutate(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Thêm món mới
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Thêm món ăn mới</DialogTitle>
        </DialogHeader>
        <MenuForm form={form} onSubmit={handleSubmit} isPending={isPending} />
      </DialogContent>
    </Dialog>
  );
};
