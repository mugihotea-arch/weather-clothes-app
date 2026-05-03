# 天気AI服装アドバイスアプリ 開発ハンズオン解説書（TypeScript版）

React + TypeScript + MUI + OpenAI + Open-Meteo API を使って
「**今日の天気からAIが一言で服装をアドバイスする**」アプリを作る。

---

## 完成イメージ

画面構成は4ブロック構成（縦スクロール）：

1. **AI服装アドバイスヘッダー（青背景）**
   - 「今日の『東京都中野区』の服装」
   - 大きな提案テキスト（例：`長袖 ＋ ジャケット`） ← **OpenAIが生成**
   - サブメッセージ（例：`軽めのアウターが必要です`） ← **OpenAIが生成**

2. **現在の天気**
   - 大きな現在気温（例：`18°`）と天気アイコン
   - 最高気温 / 最低気温

3. **気温・天気の推移**
   - 9時 / 12時 / 15時 / 18時 / 21時 の天気アイコン
   - 折れ線グラフで気温の推移を表示

4. **今日の健康情報**
   - 紫外線（UV指数）
   - 天気痛（気圧変化の度合い）
   - 花粉（季節判定でスギ/ヒノキ/ブタクサ等）

> AIが担当するのは **1. のヘッダー部分のみ**。残りは Open-Meteo の数値データを整形して表示する。

---

## 技術スタック

| 役割 | 採用技術 | 理由 |
|------|---------|------|
| フレームワーク | React (Vite) | 高速DX |
| 言語 | TypeScript | 型安全・補完が効く |
| UI | Material UI (MUI) v6 | リッチなコンポーネント群 |
| グラフ | Recharts | MUIと相性が良くシンプル |
| 天気API | Open-Meteo | 完全無料・APIキー不要 |
| 逆ジオコーディング | BigDataCloud Reverse Geocoding | 緯度経度→都市名 |
| AI | OpenAI API (`gpt-4o-mini`) | 安価で十分な品質 |
| HTTP | fetch (標準) / openai SDK | 依存最小化 |

---

## 1. プロジェクト作成

```bash
npm create vite@latest weather-clothes-app -- --template react-ts
cd weather-clothes-app
npm install
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
npm install recharts
npm install openai
```

> Vite テンプレートは `react-ts` を選択することで TypeScript 構成（`tsconfig.json` 等）が自動生成される。

---

## 2. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成:

```env
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

> **注意**: `.env` は `.gitignore` に必ず追加すること。

`.gitignore` に追記:
```
.env
```

Vite で型補完を効かせたい場合は `src/vite-env.d.ts` に下記を追加：

```ts
interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 3. ディレクトリ構成

```
src/
├── App.tsx
├── types/型定義
│   └── weather.ts             # 天気・健康情報・AI応答の型
├── components/UI
│   ├── ClothingHeader.tsx     # 青いAI服装アドバイスヘッダー
│   ├── CurrentWeather.tsx     # 現在の天気（大きい温度表示）
│   ├── HourlyForecast.tsx     # 気温・天気の推移グラフ
│   └── HealthInfo.tsx         # 今日の健康情報
├── hooks/ロジック
│   ├── useWeather.ts          # 天気データ取得（現在＋時間別＋日別）
│   ├── useLocationName.ts     # 緯度経度から都市名を逆ジオコーディング
│   └── useAiClothingAdvice.ts # OpenAI で服装アドバイスを生成
└── utils/マスタ・判定ロジック
    ├── weatherCodeMap.ts      # WMOコード → 日本語/アイコン
    └── healthAdvisor.ts       # UV/気圧/花粉のメッセージ判定
```

---

## 4. 共通の型定義

`src/types/weather.ts`

```ts
// 天気アイコンの種別（CurrentWeather/HourlyForecast 共通）
export type WeatherIconType =
  | "sunny"
  | "partlyCloudy"
  | "cloudy"
  | "rainy"
  | "snowy"
  | "thunder";

export interface WeatherCodeInfo {
  label: string;
  iconType: WeatherIconType;
}

// 1時点の時間別予報
export interface HourlyPoint {
  hour: number;
  temp: number;
  code: number;
}

// useWeather から返却される正規化済みデータ
export interface WeatherData {
  lat: number;
  lon: number;
  current: { temp: number; code: number };
  daily: { max: number; min: number; uvMax: number; code: number };
  hourly: HourlyPoint[];
  pressures: number[];
}

// 健康情報の単位アドバイス
export interface HealthAdvice {
  level: string;
  note: string;
}

// AIから返ってくる服装アドバイス
export interface ClothingAdvice {
  outfit: string;   // 例: "長袖 ＋ ジャケット"
  message: string;  // 例: "軽めのアウターが必要です"
}
```

---

## 5. 天気コードマップ

`src/utils/weatherCodeMap.ts`

```ts
import type { WeatherCodeInfo } from "../types/weather";

// Open-MeteoのWMOコードを日本語ラベルとアイコン種別に変換
export const weatherCodeMap: Record<number, WeatherCodeInfo> = {
  0:  { label: "快晴",         iconType: "sunny" },
  1:  { label: "晴れ",         iconType: "sunny" },
  2:  { label: "一部曇り",     iconType: "partlyCloudy" },
  3:  { label: "曇り",         iconType: "cloudy" },
  45: { label: "霧",           iconType: "cloudy" },
  48: { label: "霧氷",         iconType: "cloudy" },
  51: { label: "小雨",         iconType: "rainy" },
  53: { label: "雨",           iconType: "rainy" },
  55: { label: "強い雨",       iconType: "rainy" },
  61: { label: "小雨",         iconType: "rainy" },
  63: { label: "雨",           iconType: "rainy" },
  65: { label: "大雨",         iconType: "rainy" },
  71: { label: "小雪",         iconType: "snowy" },
  73: { label: "雪",           iconType: "snowy" },
  75: { label: "大雪",         iconType: "snowy" },
  80: { label: "にわか雨",     iconType: "rainy" },
  81: { label: "にわか雨(強)", iconType: "rainy" },
  95: { label: "雷雨",         iconType: "thunder" },
  99: { label: "雹を伴う雷雨", iconType: "thunder" },
};
```

---

## 6. 健康情報ロジック

`src/utils/healthAdvisor.ts`

```ts
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
```

> **注意**: 花粉ロジックは簡易判定です。実用的には花粉飛散予報APIの利用を検討してください。

---

## 7. 天気取得フック

`src/hooks/useWeather.ts`

```ts
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
```

---

## 8. 都市名取得フック（逆ジオコーディング）

`src/hooks/useLocationName.ts`

```ts
import { useState, useEffect } from "react";

interface BigDataCloudResponse {
  principalSubdivision?: string;
  city?: string;
  locality?: string;
}

// 緯度経度から「東京都中野区」のような表示名を生成する
// BigDataCloud の reverse-geocode-client は無料・APIキー不要
export function useLocationName(
  lat: number | undefined,
  lon: number | undefined
): string {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (lat == null || lon == null) return;
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${lat}&longitude=${lon}&localityLanguage=ja`;

    fetch(url)
      .then((r) => r.json() as Promise<BigDataCloudResponse>)
      .then((d) => {
        const pref = d.principalSubdivision ?? "";
        const city = d.city ?? d.locality ?? "";
        setName(`${pref}${city}`.trim() || "現在地");
      })
      .catch(() => setName("現在地"));
  }, [lat, lon]);

  return name;
}
```

---

## 9. AI服装アドバイス生成フック ★ 本アプリの中核

`src/hooks/useAiClothingAdvice.ts`

天気データを OpenAI に渡し、`{ outfit, message }` のJSONで一言アドバイスを生成する。

```ts
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
```

> **本番運用の注意**: `dangerouslyAllowBrowser: true` はAPIキーがブラウザに露出します。
> 本番では Express などのバックエンドAPIを経由してOpenAIを呼ぶ構成にしてください。

---

## 10. ClothingHeaderコンポーネント

`src/components/ClothingHeader.tsx`

画像トップの青背景エリア。AIの応答を待つ間はスケルトン表示。

```tsx
import { Box, Typography, Skeleton } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import type { ClothingAdvice } from "../types/weather";

interface ClothingHeaderProps {
  locationName: string;
  advice: ClothingAdvice | null;
  loading: boolean;
  error: string | null;
}

export function ClothingHeader({
  locationName,
  advice,
  loading,
  error,
}: ClothingHeaderProps) {
  return (
    <Box
      sx={{
        bgcolor: "primary.main",
        color: "white",
        p: 3,
        borderRadius: 3,
        textAlign: "center",
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={0.5}
        sx={{ opacity: 0.9 }}
      >
        <AutoAwesomeIcon sx={{ fontSize: 16 }} />
        <Typography variant="body2">
          今日の「{locationName}」の服装
        </Typography>
      </Box>

      {loading && (
        <Box mt={2} mb={1}>
          <Skeleton
            variant="text"
            sx={{ bgcolor: "rgba(255,255,255,0.3)", mx: "auto" }}
            width="60%"
            height={48}
          />
          <Skeleton
            variant="text"
            sx={{ bgcolor: "rgba(255,255,255,0.3)", mx: "auto" }}
            width="80%"
          />
        </Box>
      )}

      {!loading && advice && (
        <>
          <Typography variant="h4" fontWeight="bold" mt={2} mb={1}>
            {advice.outfit}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {advice.message}
          </Typography>
        </>
      )}

      {!loading && error && (
        <Typography variant="body2" mt={2} sx={{ opacity: 0.9 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
```

---

## 11. CurrentWeatherコンポーネント

`src/components/CurrentWeather.tsx`

```tsx
import { Card, CardContent, Box, Typography } from "@mui/material";
import CloudIcon from "@mui/icons-material/Cloud";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import UmbrellaIcon from "@mui/icons-material/Umbrella";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import type { ReactElement } from "react";
import { weatherCodeMap } from "../utils/weatherCodeMap";
import type { WeatherData, WeatherIconType } from "../types/weather";

const ICONS: Record<WeatherIconType, ReactElement> = {
  sunny:        <WbSunnyIcon sx={{ fontSize: 40, color: "#fbc02d" }} />,
  partlyCloudy: <CloudIcon sx={{ fontSize: 40, color: "#90a4ae" }} />,
  cloudy:       <CloudIcon sx={{ fontSize: 40, color: "#90a4ae" }} />,
  rainy:        <UmbrellaIcon sx={{ fontSize: 40, color: "#42a5f5" }} />,
  snowy:        <AcUnitIcon sx={{ fontSize: 40, color: "#90caf9" }} />,
  thunder:      <ThunderstormIcon sx={{ fontSize: 40, color: "#5e35b1" }} />,
};

interface CurrentWeatherProps {
  current: WeatherData["current"];
  daily: WeatherData["daily"];
}

export function CurrentWeather({ current, daily }: CurrentWeatherProps) {
  const info = weatherCodeMap[current.code] ?? { iconType: "cloudy" as const };

  return (
    <Card elevation={2} sx={{ borderRadius: 3, mt: 2 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" mb={1}>
          現在の天気
        </Typography>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h2" fontWeight="bold">
            {Math.round(current.temp)}°
          </Typography>
          {ICONS[info.iconType]}
        </Box>
        <Typography variant="body2" color="text.secondary" mt={1}>
          最高 {Math.round(daily.max)}° ・ 最低 {Math.round(daily.min)}°
        </Typography>
      </CardContent>
    </Card>
  );
}
```

---

## 12. HourlyForecastコンポーネント

`src/components/HourlyForecast.tsx`

3時間ごとのアイコン＋折れ線グラフ。

```tsx
import { Card, CardContent, Box, Typography } from "@mui/material";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import CloudIcon from "@mui/icons-material/Cloud";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import UmbrellaIcon from "@mui/icons-material/Umbrella";
import { weatherCodeMap } from "../utils/weatherCodeMap";
import type { HourlyPoint, WeatherIconType } from "../types/weather";

interface SmallIconProps {
  type: WeatherIconType;
}

const SmallIcon = ({ type }: SmallIconProps) => {
  const sx = { fontSize: 20 };
  if (type === "sunny" || type === "partlyCloudy")
    return <WbSunnyIcon sx={{ ...sx, color: "#fbc02d" }} />;
  if (type === "rainy")
    return <UmbrellaIcon sx={{ ...sx, color: "#42a5f5" }} />;
  return <CloudIcon sx={{ ...sx, color: "#90a4ae" }} />;
};

interface HourlyForecastProps {
  hourly: HourlyPoint[];
}

export function HourlyForecast({ hourly }: HourlyForecastProps) {
  const chartData = hourly.map((h) => ({
    label: `${h.hour}時`,
    temp: Math.round(h.temp),
  }));

  return (
    <Card elevation={2} sx={{ borderRadius: 3, mt: 2 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          気温・天気の推移
        </Typography>

        {/* アイコン行 */}
        <Box
          display="grid"
          gridTemplateColumns={`repeat(${hourly.length}, 1fr)`}
          textAlign="center"
          mb={1}
        >
          {hourly.map((h) => {
            const info = weatherCodeMap[h.code] ?? { iconType: "cloudy" as const };
            return (
              <Box key={h.hour}>
                <SmallIcon type={info.iconType} />
              </Box>
            );
          })}
        </Box>

        {/* グラフ */}
        <Box sx={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#888" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#1976d2"
                strokeWidth={2}
                dot={{ r: 4, fill: "#fff", stroke: "#1976d2", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
```

---

## 13. HealthInfoコンポーネント

`src/components/HealthInfo.tsx`

```tsx
import { Card, CardContent, Box, Typography, Stack } from "@mui/material";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import FilterVintageIcon from "@mui/icons-material/FilterVintage";
import type { ReactElement } from "react";
import type { HealthAdvice } from "../types/weather";

interface RowProps {
  icon: ReactElement;
  label: string;
  level: string;
  note: string;
}

const Row = ({ icon, label, level, note }: RowProps) => (
  <Box display="flex" alignItems="center" gap={1.5} py={1}>
    {icon}
    <Typography variant="body2" sx={{ minWidth: 64 }}>{label}</Typography>
    <Typography variant="body2" fontWeight="bold">{level}</Typography>
    <Typography variant="body2" color="text.secondary">{note}</Typography>
  </Box>
);

interface HealthInfoProps {
  uv: HealthAdvice;
  pressure: HealthAdvice;
  pollen: HealthAdvice;
}

export function HealthInfo({ uv, pressure, pollen }: HealthInfoProps) {
  return (
    <Card elevation={2} sx={{ borderRadius: 3, mt: 2 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" mb={1}>
          今日の健康情報
        </Typography>
        <Stack divider={<Box sx={{ borderTop: "1px solid #eee" }} />}>
          <Row
            icon={<WbSunnyOutlinedIcon sx={{ color: "#fbc02d" }} />}
            label="紫外線"
            level={uv.level}
            note={uv.note}
          />
          <Row
            icon={<ErrorOutlineIcon sx={{ color: "#90a4ae" }} />}
            label="天気痛"
            level={pressure.level}
            note={pressure.note}
          />
          <Row
            icon={<FilterVintageIcon sx={{ color: "#7cb342" }} />}
            label="花粉"
            level={pollen.level}
            note={pollen.note}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
```

---

## 14. App.tsx（メイン画面）

`src/App.tsx`

```tsx
import {
  Container, Typography, Box,
  CircularProgress, Alert, CssBaseline,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useWeather } from "./hooks/useWeather";
import { useLocationName } from "./hooks/useLocationName";
import { useAiClothingAdvice } from "./hooks/useAiClothingAdvice";
import { ClothingHeader } from "./components/ClothingHeader";
import { CurrentWeather } from "./components/CurrentWeather";
import { HourlyForecast } from "./components/HourlyForecast";
import { HealthInfo } from "./components/HealthInfo";
import { uvAdvice, pressureAdvice, pollenAdvice } from "./utils/healthAdvisor";

const theme = createTheme({
  palette: {
    primary: { main: "#2196f3" },
    background: { default: "#fafafa" },
  },
  typography: {
    fontFamily: "'Noto Sans JP', sans-serif",
  },
});

export default function App() {
  const { data, loading: weatherLoading, error: weatherError } = useWeather();
  const locationName = useLocationName(data?.lat, data?.lon);
  const { advice, loading: aiLoading, error: aiError } = useAiClothingAdvice(data);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ py: 3 }}>
        {weatherLoading && (
          <Box textAlign="center" py={6}>
            <CircularProgress />
            <Typography mt={2}>位置情報と天気を取得中...</Typography>
          </Box>
        )}

        {weatherError && <Alert severity="error">{weatherError}</Alert>}

        {data && (() => {
          const uv       = uvAdvice(data.daily.uvMax);
          const pressure = pressureAdvice(data.pressures);
          const pollen   = pollenAdvice(new Date().getMonth() + 1);

          return (
            <>
              <ClothingHeader
                locationName={locationName || "現在地"}
                advice={advice}
                loading={aiLoading}
                error={aiError}
              />
              <CurrentWeather current={data.current} daily={data.daily} />
              <HourlyForecast hourly={data.hourly} />
              <HealthInfo uv={uv} pressure={pressure} pollen={pollen} />
            </>
          );
        })()}
      </Container>
    </ThemeProvider>
  );
}
```

---

## 15. tsconfig 補足

Vite の `react-ts` テンプレートで生成された `tsconfig.json` をベースにする。
本アプリで使う主要オプションの推奨値：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

> `strict: true` を有効にして、Props・APIレスポンスの型不一致を早期検出するのがおすすめ。

---

## 16. フォント追加（任意）

`index.html` の `<head>` に追加:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">
```

---

## 17. 起動確認

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開き、位置情報の許可ダイアログで「許可」を選ぶ。

期待される表示順：
1. 青いヘッダーに **AIが生成した服装アドバイス**（例：`長袖 ＋ ジャケット` / `軽めのアウターが必要です`）
2. 現在の気温と天気アイコン
3. 9時〜21時の天気アイコン＋気温推移グラフ
4. 紫外線・天気痛・花粉の健康情報

---

## データフロー

```
ブラウザ位置情報API
        ↓ (緯度・経度)
   ┌────┴─────────────────────┐
   ↓                            ↓
Open-Meteo Forecast API     BigDataCloud Reverse Geocoding
   ↓                            ↓
気温・天気・気圧・UV       都市名（東京都中野区など）
   ↓
   ├── OpenAI API (gpt-4o-mini)
   │       ↓ JSON {outfit, message}
   │   ClothingHeader（青いヘッダー）
   │
   ├── 現在天気        → CurrentWeather
   ├── 時間別予報      → HourlyForecast
   └── 健康情報ロジック → HealthInfo
```

---

## よくあるエラーと対処

| エラー | 原因 | 対処 |
|--------|------|------|
| 位置情報が取得できない | ブラウザの許可設定 | アドレスバーの鍵アイコンから許可 |
| 401 Unauthorized | OpenAI APIキー誤り | `.env` の `VITE_OPENAI_API_KEY` を確認 |
| AIの応答がJSONでない | プロンプトのブレ | `response_format: { type: "json_object" }` を付ける（本書は対応済み） |
| 都市名が「現在地」になる | 逆ジオコーディングAPIの一時障害 | 時間をおいて再読み込み |
| グラフが表示されない | rechartsの未インストール | `npm install recharts` を再実行 |
| `dangerouslyAllowBrowser` 警告 | 本番非推奨の設定 | バックエンドAPI化で解決 |
| TS2307 / 型が見つからない | パスや拡張子の誤り | `import type` の参照と `tsconfig.json` を確認 |
| TS18048 (possibly undefined) | strict有効下での未チェックアクセス | optional chaining (`?.`) や nullish coalescing (`??`) を利用 |

---

## 発展課題

1. **バックエンド化** — Express サーバーで OpenAI 呼び出しをサーバー側に移しAPIキーを隠す
2. **AI再生成ボタン** — ヘッダーに「別の提案を見る」ボタンを置いて再リクエスト
3. **服装プリセットの画像化** — AIに服装カテゴリ（"shirt_jacket"等）も返させてイラスト表示
4. **週間予報** — `forecast_days=7` にして翌日以降の服装提案も表示
5. **設定画面** — 寒がり/暑がり・通勤/休日などをAIプロンプトに追加してパーソナライズ
6. **PWA化** — オフライン対応・ホーム画面追加でアプリらしく

---

*作成日: 2026-05-02*
