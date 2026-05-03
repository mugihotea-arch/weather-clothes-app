import { useState, useEffect } from "react";
import type { WeatherData, HourlyPoint } from "../types/weather";

// Open-Meteo の戻り値の最低限の型（必要なフィールドのみ）
interface OpenMeteoResponse {
  current: { temperature_2m: number; weathercode: number };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weathercode: number[];
    surface_pressure: number[];
    uv_index: number[];
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    uv_index_max: number[];
    weathercode: number[];
  };
}

interface UseWeatherResult {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
}

export function useWeather(): UseWeatherResult {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude, longitude } = coords;
          const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,weathercode` +
            `&hourly=temperature_2m,weathercode,surface_pressure,uv_index` +
            `&daily=temperature_2m_max,temperature_2m_min,uv_index_max,weathercode` +
            `&timezone=Asia%2FTokyo` +
            `&forecast_days=1`;

          const res = await fetch(url);
          if (!res.ok) throw new Error("天気データの取得に失敗しました");
          const json: OpenMeteoResponse = await res.json();

          // 9,12,15,18,21時の3時間ごとデータを抽出
          const targetHours = [9, 12, 15, 18, 21];
          const hourly: HourlyPoint[] = targetHours.map((h) => {
            const idx = json.hourly.time.findIndex(
              (t) => new Date(t).getHours() === h
            );
            return {
              hour: h,
              temp: json.hourly.temperature_2m[idx],
              code: json.hourly.weathercode[idx],
            };
          });

          setData({
            lat: latitude,
            lon: longitude,
            current: {
              temp: json.current.temperature_2m,
              code: json.current.weathercode,
            },
            daily: {
              max: json.daily.temperature_2m_max[0],
              min: json.daily.temperature_2m_min[0],
              uvMax: json.daily.uv_index_max[0],
              code: json.daily.weathercode[0],
            },
            hourly,
            pressures: json.hourly.surface_pressure ?? [],
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "不明なエラー");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError("位置情報の取得を許可してください: " + err.message);
        setLoading(false);
      }
    );
  }, []);

  return { data, loading, error };
}