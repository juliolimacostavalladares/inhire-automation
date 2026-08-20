export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export function slugVariants(name: string): string[] {
  const base = slugify(name);
  const compact = base.replace(/-/g, "");
  const withoutCompanySuffix = base.replace(
    /-(brasil|brazil|ltda|sa|group|grupo)$/i,
    "",
  );
  return [...new Set([base, compact, withoutCompanySuffix])].filter(Boolean);
}

export function jobSlug(title: string): string {
  return slugify(title) || "vaga";
}
