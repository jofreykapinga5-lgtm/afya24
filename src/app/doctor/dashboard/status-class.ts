export function statusClass(status: string) {
  if (status === "active" || status === "available" || status === "scheduled" || status === "paid") {
    return "bg-[#e8f7f4] text-[#087a7b]";
  }
  if (status === "waiting" || status === "pending" || status === "booked") {
    return "bg-[#fff6df] text-[#9a6500]";
  }
  if (status === "suspended" || status === "cancelled" || status === "failed") {
    return "bg-[#fdecec] text-[#b42318]";
  }
  return "bg-[#eef4ff] text-[#083273]";
}
