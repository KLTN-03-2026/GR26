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
      <section className="rounded-card border border-dashed border-border bg-card p-8 shadow-card">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Đang thiết lập
          </p>
          <h2 className="mt-3 text-3xl font-bold text-text-primary">{title}</h2>
          <p className="mt-3 text-base leading-7 text-text-secondary">{description}</p>
        </div>
      </section>
    </>
  );
};
