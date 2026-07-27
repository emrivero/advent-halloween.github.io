export function isUuid(value: string | undefined): value is string {
  return (
    !!value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export function isDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function normalizePlanDays(days: string[]): string[] {
  if (!days.length) throw new Error("Selecciona al menos un día");
  if (!days.every(isDateString)) throw new Error("Hay fechas no válidas");
  const normalized = [...new Set(days)].sort();
  if (normalized.length !== days.length)
    throw new Error("No se permiten días duplicados");
  if (normalized.length > 366) throw new Error("Demasiados días seleccionados");
  return normalized;
}

export function pickEvenlySpacedDays(range: string[], count: number) {
  if (count <= 0) return [];
  if (count >= range.length) return [...range];

  const step = range.length / count;
  return Array.from(
    { length: count },
    (_, index) => range[Math.floor(index * step)]
  );
}

export function shuffleInPlace<T>(items: T[], random = Math.random) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function interleaveBlocks<T>(blocks: T[][], random = Math.random): T[] {
  const queues = blocks.map((block) => [...block]);
  const total = queues.reduce((sum, queue) => sum + queue.length, 0);
  const result: T[] = [];
  let start = Math.floor(random() * Math.max(1, queues.length));

  while (result.length < total) {
    for (let offset = 0; offset < queues.length; offset++) {
      const index = (start + offset) % queues.length;
      const item = queues[index].shift();
      if (item !== undefined) result.push(item);
    }
    start = (start + 1) % Math.max(1, queues.length);
  }

  return result;
}
