import { JsonLd, generateWebsiteJsonLd, generateOrganizationJsonLd } from '@/utils/seo';
import RadeoHome from '@/components/storefront/RadeoHome';

// --- Main Page Component ---

export default function Home() {
  return (
    <>
      <JsonLd data={generateWebsiteJsonLd()} />
      <JsonLd data={generateOrganizationJsonLd()} />

      <RadeoHome />
    </>
  );
}
