import {
  getDashboardStats,
  getRecentOrders,
  getRecentPayments,
} from "@/lib/actions/dashboard";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  // Fetch data on the server
  const [statsResult, ordersResult, paymentsResult] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(),
    getRecentPayments(),
  ]);

  const stats = statsResult.success ? statsResult.data : null;
  const recentOrders = ordersResult.success ? ordersResult.data : [];
  const recentPayments = paymentsResult.success ? paymentsResult.data : [];

  return (
    <DashboardClient
      initialStats={stats}
      initialRecentOrders={recentOrders || []}
      initialRecentPayments={recentPayments || []}
    />
  );
}
