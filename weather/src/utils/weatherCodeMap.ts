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