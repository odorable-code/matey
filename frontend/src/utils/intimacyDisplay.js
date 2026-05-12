/**
 * bot-menu 등에서 내려오는 level은 DB intimacy 단계(1부터)이고,
 * UI에서도 동일하게 Lv.1부터 표시합니다.
 */
export function intimacyApiLevelToDisplay(apiLevel) {
  const n = Number(apiLevel);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
}
