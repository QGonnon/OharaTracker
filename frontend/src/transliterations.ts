// Translittérations que `NFD` ne sait pas décomposer : ces lettres ne sont pas
// une base + un diacritique, elles disparaîtraient donc entièrement du slug.
export const TRANSLITERATIONS: Record<string, string> = {
  æ: 'ae', œ: 'oe', ø: 'o', đ: 'd', ð: 'd', þ: 'th', ß: 'ss', ł: 'l', ı: 'i',
  '·': '-', '・': '-', '×': 'x', '＆': 'and', '&': 'and', '@': 'at',
}
