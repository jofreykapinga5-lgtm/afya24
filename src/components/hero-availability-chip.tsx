import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { Provider } from "@/lib/types";

const avatarTints = ["bg-primary", "bg-info", "bg-pending"];

function initials(name: string) {
  return name
    .replace("Dr. ", "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function HeroAvailabilityChip({ providers }: { providers: Provider[] }) {
  const locale = useAppStore((state) => state.locale);
  const shown = providers.slice(0, 3);
  const soonest = providers[0];

  if (!soonest) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center">
        {shown.map((provider, index) => (
          <span
            key={provider.id}
            style={{ zIndex: shown.length - index }}
            className={`-ml-2 inline-flex size-7 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold text-white first:ml-0 ${avatarTints[index % avatarTints.length]}`}
          >
            {initials(provider.name)}
          </span>
        ))}
      </div>
      <div className="text-sm">
        <span className="font-semibold text-emerald-300">{providers.length} doctors available</span>
        <span className="text-white/75">
          {" "}
          &middot; {t("availability_next", locale)}: {soonest.nextAvailableAt}
        </span>
      </div>
    </div>
  );
}
