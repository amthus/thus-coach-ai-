/**
 * Evidence-based physiology helpers. Pure functions, shared by client and server.
 *
 * - Max HR: Tanaka et al. (2001) 208 - 0.7 × age, unless the athlete measured it.
 * - Zones: Karvonen heart-rate-reserve method.
 * - VO2max: Uth-Sørensen-Overgaard-Pedersen (2004) 15.3 × HRmax / HRrest.
 */

export const DEFAULT_RESTING_HR = 65;

export function estimateMaxHr(age: number): number {
  return Math.round(208 - 0.7 * age);
}

export function resolveHeartRates(age: number, restingHr?: number | null, maxHr?: number | null) {
  const max = maxHr ?? estimateMaxHr(age);
  const rest = restingHr ?? DEFAULT_RESTING_HR;
  return { max, rest, reserve: Math.max(0, max - rest), restMeasured: restingHr != null, maxMeasured: maxHr != null };
}

export interface HrZone {
  zone: 1 | 2 | 3 | 4 | 5;
  minPct: number;
  maxPct: number;
  minBpm: number;
  maxBpm: number;
}

const ZONE_BOUNDS: [number, number][] = [
  [0.5, 0.6],
  [0.6, 0.7],
  [0.7, 0.8],
  [0.8, 0.9],
  [0.9, 1.0],
];

export function karvonenZones(maxHr: number, restingHr: number): HrZone[] {
  const reserve = maxHr - restingHr;
  return ZONE_BOUNDS.map(([lo, hi], i) => ({
    zone: (i + 1) as HrZone['zone'],
    minPct: Math.round(lo * 100),
    maxPct: Math.round(hi * 100),
    minBpm: Math.round(restingHr + reserve * lo),
    maxBpm: Math.round(restingHr + reserve * hi),
  }));
}

/** Target heart rate for a given % of heart rate reserve. */
export function karvonenTarget(maxHr: number, restingHr: number, pct: number): number {
  return Math.round(restingHr + (maxHr - restingHr) * (pct / 100));
}

/** Returns null when the resting HR was not measured: the estimate would be meaningless. */
export function estimateVo2Max(maxHr: number, restingHr: number | null | undefined): number | null {
  if (!restingHr) return null;
  return Math.round((15.3 * (maxHr / restingHr)) * 10) / 10;
}

export function vo2Category(vo2: number): 'low' | 'fair' | 'good' | 'excellent' | 'superior' {
  if (vo2 < 35) return 'low';
  if (vo2 < 42) return 'fair';
  if (vo2 < 50) return 'good';
  if (vo2 < 57) return 'excellent';
  return 'superior';
}

/** Pace (seconds per km) ↔ speed (km/h). */
export function paceToSpeed(secondsPerKm: number): number {
  return secondsPerKm > 0 ? 3600 / secondsPerKm : 0;
}
export function speedToPace(kmh: number): number {
  return kmh > 0 ? 3600 / kmh : 0;
}
export function formatPace(secondsPerKm: number): string {
  if (!Number.isFinite(secondsPerKm) || secondsPerKm <= 0) return '--:--';
  const total = Math.round(secondsPerKm);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Riegel (1981) race-time prediction: T2 = T1 × (D2 / D1)^1.06 */
export function riegelPredict(knownSeconds: number, knownKm: number, targetKm: number): number {
  return knownSeconds * Math.pow(targetKm / knownKm, 1.06);
}

export function formatDuration(totalSeconds: number): string {
  const t = Math.round(totalSeconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
