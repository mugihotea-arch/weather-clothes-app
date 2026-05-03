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
          <Box sx={{ textAlign: "center", py: 6 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>位置情報と天気を取得中...</Typography>
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