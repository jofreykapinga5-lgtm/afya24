// Format matches the existing mock data / UI placeholder: AF24-2026-00000.
// Not guaranteed unique on its own -- callers should retry on a unique_violation.
export function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const suffix = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `AF24-${year}-${suffix}`;
}
