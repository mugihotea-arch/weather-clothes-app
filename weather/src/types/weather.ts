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