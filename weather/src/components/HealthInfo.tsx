import { Card, CardContent, Box, Typography, Stack } from "@mui/material";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
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
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
    {icon}
    <Typography variant="body2" sx={{ minWidth: 64 }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: "bold" }}>{level}</Typography>
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
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
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