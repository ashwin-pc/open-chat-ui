// utils/groupBy.ts
type ShortcutWithScope = {
  scope?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export function groupBy<T extends ShortcutWithScope>(array: T[], key: keyof T): { scope: string; shortcuts: T[] }[] {
  // Create map of groups
  const groups = array.reduce((groups, item) => {
    const scope = (item[key] as string) || 'Global';
    if (!groups[scope]) {
      groups[scope] = [];
    }
    groups[scope].push(item);
    return groups;
  }, {} as Record<string, T[]>);

  // Convert map to array format
  return Object.entries(groups).map(([scope, shortcuts]) => ({
    scope,
    shortcuts,
  }));
}
