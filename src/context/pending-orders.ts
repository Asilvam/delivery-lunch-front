import { createContext } from "react";
import type { UseAdminOrdersStreamResult } from "../hooks/useAdminOrdersStream";
export const PendingOrdersContext =
  createContext<UseAdminOrdersStreamResult | null>(null);
