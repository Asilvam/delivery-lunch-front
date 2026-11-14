import { Outlet } from "react-router-dom";
import { PendingOrdersContext } from "../../context/pending-orders";
import { useAuth } from "../../hooks/useAuth";
import { useAdminOrdersStream } from "../../hooks/useAdminOrdersStream";

export default function StaffOrdersLayout() {
  const { token, role } = useAuth();
  const orders = useAdminOrdersStream(role === "admin" ? token : null);
  return (
    <PendingOrdersContext.Provider value={orders}>
      <Outlet />
    </PendingOrdersContext.Provider>
  );
}
