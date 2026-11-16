export function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

const SMALL = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
  "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];

/** Gallery wall text spells small numbers out. */
export function countWords(n: number) {
  return n <= 20 ? SMALL[n] : String(n);
}

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function initials(name: string) {
  const t = name.trim();
  // A name that is already a monogram (e.g. "HH") is used as it is.
  if (!/\s/.test(t) && t.length <= 4) return t.toUpperCase();
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** Split editable prose into blocks: blank lines separate paragraphs, lines starting "- " form lists. */
export type ProseBlock = { type: "p"; text: string } | { type: "list"; items: string[] };

export function parseProse(body: string): ProseBlock[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split("\n").map((l) => l.trim());
      if (lines.every((l) => l.startsWith("- "))) {
        return { type: "list" as const, items: lines.map((l) => l.slice(2)) };
      }
      return { type: "p" as const, text: lines.join(" ") };
    });
}
