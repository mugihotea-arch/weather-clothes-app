import { useState, useEffect } from "react";
import { weatherCodeMap } from "../utils/weatherCodeMap";
import type { WeatherData, ClothingAdvice } from "../types/weather";

interface UseAiClothingAdviceResult {
  advice: ClothingAdvice | null;
  loading: boolean;
  error: string | null;
}

export function useAiClothingAdvice(
  weather: WeatherData | null
): UseAiClothingAdviceResult {
  const [advice, setAdvice] = useState<ClothingAdvice | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!weather) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const label = weatherCodeMap[weather.daily.code]?.label ?? "不明";

      try {
        const response = await fetch("/api/clothing-advice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            label,
            max: Math.round(weather.daily.max),
            min: Math.round(weather.daily.min),
            current: Math.round(weather.current.temp),
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const parsed = (await response.json()) as Partial<ClothingAdvice>;

        if (cancelled) return;

        setAdvice({
          outfit: parsed.outfit ?? "服装提案を取得できませんでした",
          message: parsed.message ?? "",
        });
      } catch (e) {
        if (cancelled) return;
        setError(
          "AI服装アドバイスの生成に失敗しました: " +
            (e instanceof Error ? e.message : "不明なエラー")
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [weather]);

  return { advice, loading, error };
}