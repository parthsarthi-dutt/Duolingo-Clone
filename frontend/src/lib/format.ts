export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** 11520 -> "3h 12m", 540 -> "9m" */
export function formatCountdown(seconds: number): string {
  const totalMinutes = Math.max(1, Math.ceil(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function formatJoined(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
