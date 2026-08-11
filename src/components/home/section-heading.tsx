import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: ReactNode;
  children: ReactNode;
  body?: ReactNode;
  className?: string;
};

export function SectionHeading({ eyebrow, children, body, className = "" }: SectionHeadingProps) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1f2937]">
        {eyebrow}
      </p>
      <h2 className="mt-4 max-w-[30ch] text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#202020]">
        {children}
      </h2>
      {body ? <p className="mt-4 max-w-[44ch] text-sm leading-6 text-[#60717a]">{body}</p> : null}
    </div>
  );
}
