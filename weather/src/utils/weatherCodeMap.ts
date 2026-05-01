type WeatherCodeInfo = {
  label: string;
  emoji: string;
};

export const weatherCodeMap: Record<number, WeatherCodeInfo> = {
  0: { label: "快晴", emoji: "☀️" },
  1: { label: "晴れ", emoji: "🌤️" },
  2: { label: "一部曇り", emoji: "⛅" },
  3: { label: "曇り", emoji: "☁️" },
  45: { label: "霧", emoji: "🌫️" },
  48: { label: "霧氷", emoji: "🌫️" },
  51: { label: "小雨", emoji: "🌦️" },
  53: { label: "雨", emoji: "🌧️" },
  55: { label: "強い雨", emoji: "🌧️" },
  61: { label: "雨", emoji: "🌧️" },
  63: { label: "雨", emoji: "🌧️" },
  65: { label: "強い雨", emoji: "🌧️" },
  80: { label: "にわか雨", emoji: "🌦️" },
  81: { label: "にわか雨", emoji: "🌦️" },
  82: { label: "激しいにわか雨", emoji: "⛈️" },
  95: { label: "雷雨", emoji: "⛈️" },
  96: { label: "雷雨・ひょう", emoji: "⛈️" },
  99: { label: "雷雨・ひょう", emoji: "⛈️" },
};