import { useRef, useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import { PageLayout } from "../components/layout/PageLayout";
import StaffNavigation from "../components/admin/StaffNavigation";
import { appAlert } from "../utils/notifications";
import DailyMenuManager from "../components/admin/library/DailyMenuManager";
import DishLibraryManager from "../components/admin/library/DishLibraryManager";

export default function MenuPricesPage() {
  const [tab, setTab] = useState(0);
  const dirty = useRef(false);
  const changeTab = async (value: number) => {
    if (value === tab) return;
    if (
      dirty.current &&
      !(
        await appAlert.fire({
          title: "Hay cambios sin guardar",
          text: "Se descartará la edición actual.",
          showCancelButton: true,
          confirmButtonText: "Cambiar sección",
          cancelButtonText: "Seguir editando",
        })
      ).isConfirmed
    )
      return;
    dirty.current = false;
    setTab(value);
  };
  return (
    <PageLayout header={<StaffNavigation />}>
      <Typography component="h1" variant="h4" fontWeight={800} sx={{ mb: 1 }}>
        Menús y biblioteca
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Guarda tus platos y elige qué ofrecer cada día.
      </Typography>
      <Tabs
        value={tab}
        onChange={(_, value: number) => void changeTab(value)}
        variant="fullWidth"
        sx={{ mb: 3 }}
        aria-label="Administración de menús"
      >
        <Tab label="Menús del día" id="menus-tab" aria-controls="menus-panel" />
        <Tab
          label="Biblioteca de platos"
          id="library-tab"
          aria-controls="library-panel"
        />
      </Tabs>
      <Box
        role="tabpanel"
        id={tab === 0 ? "menus-panel" : "library-panel"}
        aria-labelledby={tab === 0 ? "menus-tab" : "library-tab"}
      >
        {tab === 0 ? (
          <DailyMenuManager
            onDirtyChange={(value) => {
              dirty.current = value;
            }}
            onOpenLibrary={() => void changeTab(1)}
          />
        ) : (
          <DishLibraryManager />
        )}
      </Box>
    </PageLayout>
  );
}
