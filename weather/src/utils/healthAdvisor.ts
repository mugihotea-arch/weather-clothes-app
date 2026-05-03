import type { HealthAdvice } from "../types/weather";

// UV指数 → ラベル
export function uvAdvice(uv: number): HealthAdvice {
  if (uv >= 8)  return { level: "非常に強い", note: `UV ${uv}` };
  if (uv >= 6)  return { level: "強い",       note: `UV ${uv}` };
  if (uv >= 3)  return { level: "中程度",     note: `UV ${uv}` };
  return          { level: "弱い",       note: `UV ${uv}` };
}

// 24時間の気圧変動から天気痛リスクを判定
export function pressureAdvice(pressures: number[]): HealthAdvice {
  if (!pressures?.length) return { level: "—", note: "データなし" };
  const max = Math.max(...pressures);
  const min = Math.min(...pressures);
  const diff = max - min;

  if (diff >= 10) return { level: "注意",     note: "気圧変化大" };
  if (diff >= 6)  return { level: "やや注意", note: "気圧変化中" };
  return            { level: "安心",     note: "気圧変化小" };
}

// 月から花粉の主な種別を判定（日本基準・簡易版）
export function pollenAdvice(month: number): HealthAdvice {
  if (month >= 2 && month <= 4)  return { level: "やや多い", note: "スギ・ヒノキ" };
  if (month === 5)                return { level: "中程度",   note: "ヒノキ・イネ科" };
  if (month >= 6 && month <= 8)  return { level: "少ない",   note: "イネ科" };
  if (month >= 9 && month <= 10) return { level: "中程度",   note: "ブタクサ・ヨモギ" };
  return                            { level: "少ない",   note: "—" };
}