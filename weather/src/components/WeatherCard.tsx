import { Card, CardContent, Typography, Box, Grid } from "@mui/material";
import { weatherCodeMap } from "../utils/weatherCodeMap";

type Weather = {
  code: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
};

type WeatherCardProps = {
  weather: Weather;
};

export function WeatherCard({ weather }: WeatherCardProps) {
  const { label, emoji } = weatherCodeMap[weather.code] ?? {
    label: "不明",
    emoji: "❓",
  };

  return (
    <Card elevation={3} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Box textAlign="center" mb={2}>
          <Typography variant="h2" component="span">
            {emoji}
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            {label}
          </Typography>
        </Box>

        <Grid container spacing={2} justifyContent="center">
          {[
            { label: "気温", value: `${weather.temp}℃` },
            { label: "体感", value: `${weather.feelsLike}℃` },
            { label: "湿度", value: `${weather.humidity}%` },
            { label: "風速", value: `${weather.wind}km/h` },
          ].map(({ label, value }) => (
            <Grid item xs={6} sm={3} key={label}>
              <Box
                textAlign="center"
                p={1}
                sx={{ bgcolor: "grey.100", borderRadius: 2 }}
              >
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}