import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// lib/utils.ts
export const isProduction = () => process.env.NODE_ENV === 'production';
export const getBasePath = () => isProduction() ? '/en' : '';