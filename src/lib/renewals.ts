import { addDays, addMonths, addYears, differenceInCalendarDays, format, parseISO } from "date-fns";

/**
 * Tries to interpret a free-text "prazo" (e.g. "30 dias", "6 meses", "1 ano")
 * as a number of days/months/years to add to a start date. Returns null when
 * the text doesn't match a recognizable pattern (e.g. "até 15/12",
 * "indeterminado", custom text) — in that case the end date must be set
 * manually.
 */
export function parsePrazoToOffset(prazo: string): { amount: number; unit: 'dias' | 'meses' | 'anos' } | null {
  if (!prazo) return null;
  const normalized = prazo.trim().toLowerCase();
  const match = normalized.match(/^(\d+)\s*(dia|dias|mes|mês|meses|ano|anos)$/);
  if (!match) return null;
  const amount = parseInt(match[1], 10);
  const unitRaw = match[2];
  if (unitRaw.startsWith('dia')) return { amount, unit: 'dias' };
  if (unitRaw.startsWith('ano')) return { amount, unit: 'anos' };
  return { amount, unit: 'meses' };
}

/** Computes an end date from a start date (ISO string) and a free-text prazo, or null if prazo isn't parseable. */
export function computeDataTermino(dataInicioISO: string, prazo: string): string | null {
  const offset = parsePrazoToOffset(prazo);
  if (!offset || !dataInicioISO) return null;
  try {
    const inicio = parseISO(dataInicioISO);
    const fim = offset.unit === 'dias' ? addDays(inicio, offset.amount)
      : offset.unit === 'anos' ? addYears(inicio, offset.amount)
      : addMonths(inicio, offset.amount);
    return format(fim, 'yyyy-MM-dd');
  } catch {
    return null;
  }
}

export type RenewalStatus = 'vencido' | 'vencendo' | 'ok' | 'sem_data';

/** Classifies how urgent a renewal is based on days remaining until data_termino_servico. */
export function getRenewalStatus(dataTerminoISO: string | null | undefined, thresholdDays = 15): { status: RenewalStatus; diasRestantes: number | null } {
  if (!dataTerminoISO) return { status: 'sem_data', diasRestantes: null };
  try {
    const termino = parseISO(dataTerminoISO);
    const dias = differenceInCalendarDays(termino, new Date());
    if (dias < 0) return { status: 'vencido', diasRestantes: dias };
    if (dias <= thresholdDays) return { status: 'vencendo', diasRestantes: dias };
    return { status: 'ok', diasRestantes: dias };
  } catch {
    return { status: 'sem_data', diasRestantes: null };
  }
}

export function formatDateBR(dateISO: string | null | undefined): string {
  if (!dateISO) return '—';
  try {
    return format(parseISO(dateISO), 'dd/MM/yyyy');
  } catch {
    return '—';
  }
}
