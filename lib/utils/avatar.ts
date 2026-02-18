/**
 * Avatar color generation utility
 * Generates consistent colors from a name using a hash function
 */

// Purple/Blue/Indigo color palette for avatars
// Purple/Black/Dark gradient palette for avatars
// Premium solid color palette for avatars (Unisex/Professional)
// Lilac-themed avatar palette
const AVATAR_COLORS = [
  { bg: '#8b5cf6', text: '#ffffff' }, // Violet
  { bg: '#a78bfa', text: '#ffffff' }, // Light Violet
  { bg: '#7c3aed', text: '#ffffff' }, // Deep Violet
  { bg: '#6d28d9', text: '#ffffff' }, // Purple
  { bg: '#c084fc', text: '#ffffff' }, // Lavender
  { bg: '#9333ea', text: '#ffffff' }, // Rich Purple
  { bg: '#a855f7', text: '#ffffff' }, // Medium Purple
  { bg: '#7e22ce', text: '#ffffff' }, // Dark Purple
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
