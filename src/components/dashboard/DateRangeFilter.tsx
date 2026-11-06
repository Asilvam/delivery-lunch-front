import { useState } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onRangeChange: (startDate: string, endDate: string) => void;
}

export default function DateRangeFilter({
  startDate,
  endDate,
  onRangeChange,
}: DateRangeFilterProps) {
  const [start, setStart] = useState<Dayjs | null>(() => dayjs(startDate));
  const [end, setEnd] = useState<Dayjs | null>(() => dayjs(endDate));
  const today = dayjs(
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" }),
  );
  const presets = [
    { label: "Hoy", start: today },
    { label: "Últimos 7 días", start: today.subtract(6, "day") },
    { label: "Últimos 30 días", start: today.subtract(29, "day") },
    { label: "Este mes", start: today.startOf("month") },
  ];
  const valid = Boolean(start?.isValid() && end?.isValid());
  const reversed = valid && start!.isAfter(end!, "day");
  const selected = presets.findIndex(
    (p) =>
      p.start.format("YYYY-MM-DD") === startDate &&
      today.format("YYYY-MM-DD") === endDate,
  );
  const apply = (nextStart: Dayjs | null, nextEnd: Dayjs | null) => {
    if (
      !nextStart?.isValid() ||
      !nextEnd?.isValid() ||
      nextStart.isAfter(nextEnd, "day")
    )
      return;
    onRangeChange(nextStart.format("YYYY-MM-DD"), nextEnd.format("YYYY-MM-DD"));
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
      <Box
        sx={{
          display: { xs: "grid", sm: "flex" },
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          flexWrap: "wrap",
          gap: 1,
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={600}
          mr={1}
          sx={{ gridColumn: "1 / -1" }}
        >
          Período:
        </Typography>
        {presets.map((preset, index) => (
          <Button
            key={preset.label}
            size="small"
            sx={{ minHeight: 44, width: { xs: "100%", sm: "auto" } }}
            variant={selected === index ? "contained" : "outlined"}
            aria-pressed={selected === index}
            onClick={() => {
              setStart(preset.start);
              setEnd(today);
              apply(preset.start, today);
            }}
          >
            {preset.label}
          </Button>
        ))}
      </Box>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <DatePicker
            label="Desde"
            value={start}
            format="DD/MM/YYYY"
            onChange={(value) => {
              setStart(value);
              apply(value, end);
            }}
            slotProps={{
              textField: {
                size: "small",
                error: reversed || !start?.isValid(),
              },
            }}
          />
          <DatePicker
            label="Hasta"
            value={end}
            format="DD/MM/YYYY"
            onChange={(value) => {
              setEnd(value);
              apply(start, value);
            }}
            slotProps={{
              textField: { size: "small", error: reversed || !end?.isValid() },
            }}
          />
        </Box>
      </LocalizationProvider>
      {(!valid || reversed) && (
        <Typography
          variant="caption"
          color="error"
          sx={{ display: "block", mt: 1 }}
        >
          {reversed
            ? "Desde no puede ser posterior a Hasta."
            : "Completa ambas fechas con un valor válido."}
        </Typography>
      )}
    </Paper>
  );
}
