/**
 * PostgREST parses commas, parentheses and dots as structure inside an `or()`
 * filter, so a patient called "Rahman, Md." or a drug named "Napa (Extra)"
 * would break the query — or, worse, change its meaning. Strip the syntax
 * characters before interpolating a user-typed term.
 */
export function likeTerm(input: string): string {
  return input.replace(/[,()*%\\"']/g, " ").replace(/\s+/g, " ").trim();
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
