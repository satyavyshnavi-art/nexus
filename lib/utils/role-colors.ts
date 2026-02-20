export const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  UI: { bg: "bg-purple-500/10", text: "text-purple-700 dark:text-purple-400", border: "border-purple-500/20" },
  Backend: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-500/20" },
  QA: { bg: "bg-green-500/10", text: "text-green-700 dark:text-green-400", border: "border-green-500/20" },
  DevOps: { bg: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-400", border: "border-orange-500/20" },
  "Full-Stack": { bg: "bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-500/20" },
  Design: { bg: "bg-pink-500/10", text: "text-pink-700 dark:text-pink-400", border: "border-pink-500/20" },
  Data: { bg: "bg-cyan-500/10", text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-500/20" },
  Mobile: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-500/20" },
};

const FALLBACK: { bg: string; text: string; border: string } = {
  bg: "bg-gray-500/10",
  text: "text-gray-700 dark:text-gray-400",
  border: "border-gray-500/20",
};

export function getRoleColor(role: string) {
  return ROLE_COLORS[role] || FALLBACK;
}

export const ROLE_DOT_COLORS: Record<string, string> = {
  UI: "bg-purple-500",
  Backend: "bg-blue-500",
  QA: "bg-green-500",
  DevOps: "bg-orange-500",
  "Full-Stack": "bg-indigo-500",
  Design: "bg-pink-500",
  Data: "bg-cyan-500",
  Mobile: "bg-amber-500",
};

export function getRoleDotColor(role: string) {
  return ROLE_DOT_COLORS[role] || "bg-gray-500";
}
