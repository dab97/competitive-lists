import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number): string {
  // Round to two decimal places using Math.round to handle floating point precision
  const roundedScore = Math.round(score * 100) / 100;
  
  // Check if the rounded score is an integer (e.g., 83.00 should be 83)
  if (roundedScore % 1 === 0) {
    return roundedScore.toString();
  }
  // Otherwise, display with two decimal places (e.g., 83.57 should be 83.57)
  return roundedScore.toFixed(2);
}
