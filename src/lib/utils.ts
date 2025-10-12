import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: Date | string | number) {
  const target = new Date(date).getTime();
  const deltaSeconds = Math.floor((Date.now() - target) / 1000);

  const table: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "seconds"],
    [60, "minutes"],
    [24, "hours"],
    [7, "days"],
    [4.34524, "weeks"],
    [12, "months"],
    [Number.POSITIVE_INFINITY, "years"],
  ];

  let value = deltaSeconds;
  let unit: Intl.RelativeTimeFormatUnit = "seconds";

  for (const [limit, currentUnit] of table) {
    if (Math.abs(value) < limit) {
      unit = currentUnit;
      break;
    }
    value /= limit;
  }

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  return formatter.format(-Math.round(value), unit);
}
