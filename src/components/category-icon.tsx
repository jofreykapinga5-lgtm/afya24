import {
  AlarmClock,
  Baby,
  Brain,
  FlaskConical,
  HeartPulse,
  Pill,
  Repeat,
  ScanFace,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  "alarm-clock": AlarmClock,
  brain: Brain,
  "scan-face": ScanFace,
  "heart-pulse": HeartPulse,
  pill: Pill,
  "flask-conical": FlaskConical,
  baby: Baby,
  repeat: Repeat,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = iconMap[name] ?? Stethoscope;
  return <Icon className={className} />;
}
