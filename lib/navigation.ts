export function getPath(path: string) {
  const prefix = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${prefix}${path}`;
}
