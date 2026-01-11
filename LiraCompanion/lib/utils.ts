
// Simplified utils without clsx/tailwind-merge dependencies
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}
