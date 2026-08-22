// Patients type their name however their keyboard happens to be -- ALL
// CAPS is common on a mobile form, especially with caps lock left on.
// This only changes how a name is DISPLAYED; the stored value (and
// anything matched against it, e.g. reference-number lookup) is untouched.
export function toTitleCase(name: string): string {
  return name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
