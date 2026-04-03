import { PageMeta } from './PageMeta';

interface PagePlaceholderProps {
  title: string;
  description: string;
}

/**
 * Placeholder tạm thời cho các page chưa được triển khai riêng.
 */
export const PagePlaceholder = ({ title, description }: PagePlaceholderProps) => {
  return (
    <>
      <PageMeta title={title} description={description} />
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
            Đang thiết lập
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">{title}</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
        </div>
      </section>
    </>
  );
};
