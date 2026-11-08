/** Convert `?` placeholders to `$n`, skipping anything inside single quotes. */
export function toPg(sql: string): string {
  let n = 0;
  let out = "";
  let inQuote = false;
  for (const ch of sql) {
    if (ch === "'") inQuote = !inQuote;
    out += ch === "?" && !inQuote ? `$${++n}` : ch;
  }
  return out;
}
