import "server-only";

// Shared JSON-LD builders. Every field here is a real, already-displayed
// fact (name, specialty, price, published contact email) -- nothing here
// invents data Afya24 doesn't actually have. In particular, provider
// rating/reviewCount is deliberately left out of all of these: it's an
// admin-typed number with no real patient-review pipeline behind it (see
// the comment on updateProviderRating in app/admin/actions.ts), and
// publishing it as review/rating structured data would tell Google there
// are verified reviews that don't exist -- a real policy and trust risk,
// not just an SEO nice-to-have.

const SITE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

// MedicalBusiness, not LocalBusiness -- Afya24 has no physical, visitable
// premises to send a patient to, so a schema type that implies one would
// be inaccurate. No address/telephone/sameAs fields either: none are
// published anywhere on the site yet, so none are asserted here.
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: "Afya24",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/afya24-logo-header.png`,
    email: "support@afya24.com",
    description:
      "Afya24 is a direct-pay telehealth platform: describe your issue, get matched with a licensed doctor, and consult by chat, voice, or video.",
  };
}

export function faqPageJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function physicianJsonLd({
  name,
  specialty,
  path,
  photoUrl,
  priceValue,
  languages,
}: {
  name: string;
  specialty: string;
  path: string;
  photoUrl: string | null;
  priceValue: number;
  languages: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name,
    medicalSpecialty: specialty,
    url: `${SITE_URL}${path}`,
    ...(photoUrl ? { image: photoUrl } : {}),
    ...(languages.length > 0 ? { knowsLanguage: languages } : {}),
    makesOffer: {
      "@type": "Offer",
      priceCurrency: "TZS",
      price: priceValue,
      availability: "https://schema.org/InStock",
    },
  };
}
