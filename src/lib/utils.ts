/**
 * Tailwind class-name helper. Combines `clsx` for conditional class
 * construction with `tailwind-merge` so conflicting utilities (e.g.
 * `px-2` and `px-4`) collapse to the last-wins value. Imported by every
 * UI component that accepts a `className` prop.
 *
 * Key export: `cn`.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge any number of class-name inputs into one tailwind-correct string.
 *
 * @param inputs - clsx-compatible class values (strings, arrays, objects).
 * @returns Final className string with conflicts resolved.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
