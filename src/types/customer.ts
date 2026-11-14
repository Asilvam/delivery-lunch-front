export interface CustomerRow {
  googleId: string;
  name: string;
  email: string;
  phone: string;
  blocked: boolean;
  blockReason: string;
  totalOrders: number;
  approvedOrders: number;
  lastOrderAt: string | null;
}
export interface CustomerPage {
  items: CustomerRow[];
  total: number;
  page: number;
  pageSize: number;
}
