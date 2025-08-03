import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeDate(input: string | Date | undefined | null): Date {
  const d = new Date(input ?? "")
  return isNaN(d.getTime()) ? new Date() : d
}
