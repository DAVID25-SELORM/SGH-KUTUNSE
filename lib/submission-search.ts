function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).flatMap(strings);
  return [];
}

export function buildSubmissionSearchTerms(data: Record<string, unknown>) {
  return [...new Set(strings(data)
    .flatMap(value => value.toLowerCase().split(/[^a-z0-9@+.-]+/))
    .filter(term => term.length >= 2))].slice(0, 80);
}

export function submissionMatchesSearch(data: Record<string, unknown>, search?: string) {
  const term = search?.trim().toLowerCase();
  if (!term) return true;
  if (String(data.reference ?? "").toLowerCase() === term) return true;
  const stored = Array.isArray(data.searchTerms) ? data.searchTerms.map(value => String(value).toLowerCase()) : [];
  return stored.includes(term) || buildSubmissionSearchTerms(data).includes(term);
}

export function paginateSubmissionRows<T extends Record<string, unknown> & { id: string }>(rows: T[], search?: string, cursor?: string, pageSize = 20) {
  const matching = rows.filter(row => submissionMatchesSearch(row, search));
  const cursorIndex = cursor ? matching.findIndex(row => row.id === cursor) : -1;
  const start = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  const page = matching.slice(start, start + pageSize);
  return { page, nextCursor: matching.length > start + pageSize ? page.at(-1)?.id ?? null : null, matchingCount: matching.length };
}
