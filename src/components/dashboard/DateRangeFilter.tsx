// src/components/dashboard/DateRangeFilter.tsx
import { useState, useMemo } from "react";
import { Box, Button, ButtonGroup, Paper, Typography } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onRangeChange: (startDate: string, endDate: string) => void;
}

type PresetKey = "today" | "last7" | "last30" | "thisMonth" | "custom";

export default function DateRangeFilter({
  startDate,
  endDate,
  onRangeChange,
}: DateRangeFilterProps) {
  const [preset, setPreset] = useState<PresetKey>("today");
  const [start, setStart] = useState<Dayjs>(dayjs(startDate));
  const [end, setEnd] = useState<Dayjs>(dayjs(endDate));

  const presets: Record<PresetKey, { label: string; action: () => void }> =
    useMemo(
      () => ({
        today: {
          label: "Hoy",
          action: () => {
            const today = dayjs();
            setStart(today);
            setEnd(today);
            onRangeChange(today.format("YYYY-MM-DD"), today.format("YYYY-MM-DD"));
          },
        },
        last7: {
          label: "Últimos 7 días",
          action: () => {
            const end = dayjs();
            const start = end.subtract(6, "day");
            setStart(start);
            setEnd(end);
            onRangeChange(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
          },
        },
        last30: {
          label: "Últimos 30 días",
          action: () => {
            const end = dayjs();
            const start = end.subtract(29, "day");
            setStart(start);
            setEnd(end);
            onRangeChange(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
          },
        },
        thisMonth: {
          label: "Este mes",
          action: () => {
            const start = dayjs().startOf("month");
            const end = dayjs();
            setStart(start);
            setEnd(end);
            onRangeChange(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
          },
        },
        custom: {
          label: "Personalizado",
          action: () => {
            onRangeChange(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
          },
        },
      }),
      [onRangeChange, start, end],
    );

  const handlePresetChange = (key: PresetKey) => {
    setPreset(key);
    presets[key].action();
  };

  const handleStartChange = (newDate: Dayjs | null) => {
    if (!newDate) return;
    setStart(newDate);
    setPreset("custom");
    onRangeChange(newDate.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
  };

  const handleEndChange = (newDate: Dayjs | null) => {
    if (!newDate) return;
    setEnd(newDate);
    setPreset("custom");
    onRangeChange(start.format("YYYY-MM-DD"), newDate.format("YYYY-MM-DD"));
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 1,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
        <Typography variant="subtitle2" fontWeight={600} mr={1}>
          Período:
        </Typography>

        <ButtonGroup size="small" variant="outlined">
          {(Object.keys(presets) as PresetKey[])
            .filter((k) => k !== "custom")
            .map((key) => (
              <Button
                key={key}
                onClick={() => handlePresetChange(key)}
                variant={preset === key ? "contained" : "outlined"}
                sx={{ fontWeight: 600 }}
              >
                {presets[key].label}
              </Button>
            ))}
        </ButtonGroup>

        <Box
          sx={{
            ml: "auto",
            display: "flex",
            gap: { xs: 1.5, sm: 1 },
            width: "100%",
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Desde"
              value={start}
              onChange={handleStartChange}
               slotProps={{
                 textField: {
                   size: "small",
                   sx: {
                     flex: 1,
                     minWidth: 0,
                     fontSize: 13,
                   },
                 },
               }}
            />
            <DatePicker
              label="Hasta"
              value={end}
              onChange={handleEndChange}
               slotProps={{
                 textField: {
                   size: "small",
                   sx: {
                     flex: 1,
                     minWidth: 0,
                     fontSize: 13,
                   },
                 },
               }}
            />
          </LocalizationProvider>
        </Box>
      </Box>
    </Paper>
  );
}
