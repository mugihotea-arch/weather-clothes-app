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
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          現在の天気
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h2" sx={{ fontWeight: "bold" }}>
            {Math.round(current.temp)}°
          </Typography>
          {ICONS[info.iconType]}
        </Box>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
          最高 {Math.round(daily.max)}° ・ 最低 {Math.round(daily.min)}°
        </Typography>
      </CardContent>
    </Card>
  );
}