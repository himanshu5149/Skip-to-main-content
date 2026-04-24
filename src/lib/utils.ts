import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date helper
export function formatDate(date: any) {
  if (!date) return 'Recently';
  try {
    const d = date?.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return 'Recently';
  }
}

// Privacy masking helper
export function maskData(text: string, type: 'email' | 'phone' | 'other'): string {
  if (!text) return '';
  if (type === 'email') {
    const [name, domain] = text.split('@');
    if (!domain) return text;
    // Show first char, then 3 stars if length > 1, then @domain
    return `${name[0]}***@${domain}`;
  }
  if (type === 'phone') {
    // If it looks like a long number +91-9876543221 -> +91-98****21
    if (text.length > 8) {
      return text.slice(0, 6) + '****' + text.slice(-2);
    }
    return text.replace(/(\d{2})(\d+)(\d{2})/, (_, p1, p2, p3) => `${p1}${'*'.repeat(Math.min(p2.length, 4))}${p3}`);
  }
  return text.slice(0, 3) + '***' + text.slice(-3);
}

// Risk scoring engine
export function calculateRiskScore(reportsCount: number, status: string): { score: number; label: 'Low' | 'Medium' | 'High'; color: string } {
  let score = Math.min(reportsCount * 15, 100);
  if (status === 'verified') score = Math.max(score, 75);
  if (status === 'rejected') score = 5;

  if (score <= 30) return { score, label: 'Low', color: 'text-green-500' };
  if (score <= 70) return { score, label: 'Medium', color: 'text-yellow-500' };
  return { score, label: 'High', color: 'text-red-500' };
}
