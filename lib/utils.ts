import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCredits(credits: number): string {
  return credits.toLocaleString();
}

export function calculatePercentage(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
}

export function getPlanColor(plan: string): string {
  switch (plan.toUpperCase()) {
    case "FREE":
      return "text-gray-600 bg-gray-100";
    case "BASIC":
      return "text-blue-600 bg-blue-100";
    case "PRO":
      return "text-purple-600 bg-purple-100";
    case "ENTERPRISE":
      return "text-orange-600 bg-orange-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

export function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "text-green-600 bg-green-100";
    case "INACTIVE":
      return "text-gray-600 bg-gray-100";
    case "SUSPENDED":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}
