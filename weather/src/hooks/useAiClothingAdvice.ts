import { useState, useEffect } from "react";
import OpenAI from "openai";
import { weatherCodeMap } from "../utils/weatherCodeMap";
import type { WeatherData, ClothingAdvice } from "../types/weather";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // 開発用。本番はバックエンド経由推奨
});

interface UseAiClothingAdviceResult {
  advice: ClothingAdvice | null;
  loading: boolean;
  error: string | null;
}

// 天気データが揃ったタイミングで自動的に1回だけAIに問い合わせる
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
      const prompt =
        `今日の天気は「${label}」、最高気温${Math.round(weather.daily.max)}℃、` +
        `最低気温${Math.round(weather.daily.min)}℃、現在${Math.round(weather.current.temp)}℃です。` +
        `この天気にぴったりの服装を提案してください。\n` +
        `以下のJSON形式のみで出力してください（前後の説明文は不要）:\n` +
        `{"outfit": "服装の組み合わせを15文字以内で。例: 長袖 ＋ ジャケット", ` +
        `"message": "そのアドバイス理由を20文字程度で。例: 軽めのアウターが必要です"}`;

      try {
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "あなたは天気に詳しいファッションアドバイザーです。" +
                "気温・天気から最適な服装を簡潔にJSONで提案してください。",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 200,
        });

        const text = response.choices[0].message.content?.trim() ?? "{}";
        const parsed = JSON.parse(text) as Partial<ClothingAdvice>;

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