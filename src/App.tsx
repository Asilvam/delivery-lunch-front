// src/App.tsx
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import PrivateRoute from "./router/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import CustomerApp from "./CustomerApp";

const AdminPage = lazy(() => import("./pages/AdminPage"));
const KitchenPage = lazy(() => import("./pages/KitchenPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

const Spinner = () => (
  <Box display="flex" justifyContent="center" mt={8}>
    <CircularProgress />
  </Box>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CustomerApp />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Solo admin */}
      <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
        <Route
          path="/admin"
          element={
            <Suspense fallback={<Spinner />}>
              <AdminPage />
            </Suspense>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<Spinner />}>
              <DashboardPage />
            </Suspense>
          }
        />
      </Route>

      {/* Admin o cocina */}
      <Route element={<PrivateRoute allowedRoles={["admin", "kitchen"]} />}>
        <Route
          path="/cocina"
          element={
            <Suspense fallback={<Spinner />}>
              <KitchenPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
