/** Resolve a question image filename (public/media) to a URL under the base path. */
export function imageUrl(name: string): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}media/${name}`
}
