export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')         // espaces → tirets
    .replace(/[^\w\-]+/g, '')     // retire les caractères spéciaux
    .replace(/\-\-+/g, '-')       // remplace les doubles tirets
}
