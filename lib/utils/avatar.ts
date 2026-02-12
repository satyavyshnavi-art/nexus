/**
 * Avatar color generation utility
 * Generates consistent colors from a name using a hash function
 */

// Purple/Blue/Indigo color palette for avatars
const AVATAR_COLORS = [
  { bg: 'hsl(270, 75%, 60%)', text: 'hsl(0, 0%, 100%)' },      // Purple
  { bg: 'hsl(263, 70%, 50%)', text: 'hsl(0, 0%, 100%)' },      // Deep Purple
  { bg: 'hsl(281, 89%, 54%)', text: 'hsl(0, 0%, 100%)' },      // Violet
  { bg: 'hsl(242, 84%, 58%)', text: 'hsl(0, 0%, 100%)' },      // Indigo
  { bg: 'hsl(217, 91%, 60%)', text: 'hsl(0, 0%, 100%)' },      // Blue
  { bg: 'hsl(198, 88%, 48%)', text: 'hsl(0, 0%, 100%)' },      // Cyan
  { bg: 'hsl(280, 59%, 56%)', text: 'hsl(0, 0%, 100%)' },      // Purple-Blue
  { bg: 'hsl(259, 80%, 52%)', text: 'hsl(0, 0%, 100%)' },      // Iris
];

/**
 * Generate a simple hash from a string
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get avatar color based on name
 * Returns a consistent color palette entry for the given name
 */
export function getAvatarColor(name: string): {
  bg: string;
  text: string;
} {
  if (!name || name.trim().length === 0) {
    return AVATAR_COLORS[0];
  }

  const hash = hashString(name.toLowerCase());
  const index = hash % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Extract initials from a name
 * "John Doe" -> "JD"
 * "Alice" -> "A"
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return '?';
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0))
    .toUpperCase();
}
