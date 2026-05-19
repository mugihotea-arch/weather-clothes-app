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
    sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        opacity: 0.9,
    }}
    >
        <AutoAwesomeIcon sx={{ fontSize: 16 }} />
        <Typography variant="body2">
          今日の「{locationName}」の服装
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ mt: 2, mb: 1 }}>
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
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              mt: 2,
              mb: 1,
              fontSize: { xs: "1.2rem", sm: "2.125rem" }, // スマホで小さめ
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              width: "100%",
              display: "block"
            }}
          >
            {advice.outfit}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {advice.message}
          </Typography>
        </>
      )}

      {!loading && error && (
        <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}