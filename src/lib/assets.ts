/** Resolve a question image filename to a URL under the configured base path. */
export function imageUrl(name: string): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}img/${name}`
}
