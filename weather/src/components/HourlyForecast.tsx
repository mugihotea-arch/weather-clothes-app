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
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          気温・天気の推移
        </Typography>

        {/* アイコン行 */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${hourly.length}, 1fr)`,
            textAlign: "center",
            mb: 1,
          }}
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