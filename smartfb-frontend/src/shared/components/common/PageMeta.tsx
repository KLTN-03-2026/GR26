import { useEffect } from 'react';

interface PageMetaProps {
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
  noIndex?: boolean;
}

const DEFAULT_DESCRIPTION =
  'SmartF&B là nền tảng quản lý chuỗi quán cafe và nhà hàng, hỗ trợ POS, quản lý chi nhánh, thực đơn, kho và báo cáo vận hành theo thời gian thực.';
const DEFAULT_IMAGE = '/favicon.svg';
const DEFAULT_KEYWORDS =
  'SmartF&B, POS, quản lý nhà hàng, quản lý quán cafe, SaaS F&B, quản lý chuỗi';

const upsertMetaTag = (
  selector: string,
  attributeName: 'name' | 'property',
  attributeValue: string,
  content: string
) => {
  let metaTag = document.querySelector<HTMLMetaElement>(selector);

  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute(attributeName, attributeValue);
    document.head.appendChild(metaTag);
  }

  metaTag.setAttribute('content', content);
};

/**
 * Component cập nhật metadata phía client cho từng page trong SPA.
 * `index.html` giữ vai trò fallback mặc định, còn PageMeta ghi đè theo route hiện tại.
 */
export const PageMeta = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  keywords = DEFAULT_KEYWORDS,
  noIndex = false,
}: PageMetaProps) => {
  useEffect(() => {
    const resolvedTitle = title.includes('SmartF&B') ? title : `${title} | SmartF&B`;
    const robotsContent = noIndex ? 'noindex, nofollow' : 'index, follow';

    document.title = resolvedTitle;

    upsertMetaTag('meta[name="description"]', 'name', 'description', description);
    upsertMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
    upsertMetaTag('meta[name="robots"]', 'name', 'robots', robotsContent);
    upsertMetaTag('meta[property="og:title"]', 'property', 'og:title', resolvedTitle);
    upsertMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
    upsertMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', resolvedTitle);
    upsertMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    upsertMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);
  }, [description, image, keywords, noIndex, title]);

  return null;
};
