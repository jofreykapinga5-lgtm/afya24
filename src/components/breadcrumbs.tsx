import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export interface BreadcrumbItem {
  name: string;
  path: string;
}

// Renders the visible trail AND its BreadcrumbList JSON-LD from the same
// list, so the two can never drift out of sync with each other. `items`
// excludes the current page -- it's shown as trailing, non-link text, but
// still counts as the last position in the JSON-LD (Google's breadcrumb
// guidelines expect the current page included in the list), which is why
// the caller passes the real currentPath rather than this component
// guessing at it.
export function Breadcrumbs({
  items,
  current,
  currentPath,
}: {
  items: BreadcrumbItem[];
  current: string;
  currentPath: string;
}) {
  const jsonLd = breadcrumbJsonLd([...items, { name: current, path: currentPath }]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[#8a969c]">
        {items.map((item) => (
          <span key={item.path} className="flex items-center gap-1.5">
            <Link href={item.path} className="rounded-sm outline-none transition-colors hover:text-[#083273] focus-visible:ring-3 focus-visible:ring-ring/50">
              {item.name}
            </Link>
            <ChevronRight className="size-3 shrink-0" aria-hidden="true" />
          </span>
        ))}
        <span aria-current="page" className="font-medium text-[#60717a]">
          {current}
        </span>
      </nav>
    </>
  );
}
