
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";

import {
  Activity,
  IndianRupee,
  ShoppingCart,
  CheckCircle,
  Clock,
  RefreshCw,
  Package,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { api } from "@/lib/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

// --------------------------------------------------
// Types
// --------------------------------------------------

interface Order {
  order_id: number;
  customer_id: number | null;
  product_id: number | null;
  quantity: number;
  total_amount: number;
  order_status: string;
  created_at: string;
}

interface TopProduct {
  product_id: number;
  product_name: string;
  units_sold: number;
  revenue: number;
}

interface DailySale {
  report_date: string;
  total_orders: number;
  total_revenue: number;
}

// --------------------------------------------------
// Constants and Helpers
// --------------------------------------------------

const COLORS = [
  "#16a34a",
  "#eab308",
  "#ef4444",
  "#64748b",
  "#3b82f6",
];

const currency = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

// Parse YYYY-MM-DD as a local date to avoid timezone shifts.
function parseReportDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatReportDate(value: string): string {
  return parseReportDate(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

// --------------------------------------------------
// Reusable KPI Card
// --------------------------------------------------

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {value}
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}

// --------------------------------------------------
// Dashboard
// --------------------------------------------------

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [period, setPeriod] = useState("all");

  const pageSize = 5;

  const [orders, setOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailySales, setDailySales] = useState<DailySale[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Fetch Orders
  // --------------------------------------------------

  async function fetchOrders() {
    try {
      const response = await api.get("/orders");
      const result = response.data;

      const records: Order[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      setOrders(records);
    } catch (err) {
      console.error("Fetch orders error:", err);
      throw new Error("Could not fetch orders from the backend.");
    }
  }

  // --------------------------------------------------
  // Fetch Top Products
  // --------------------------------------------------

  async function fetchTopProducts() {
    try {
      const response = await api.get("/analytics/top-products");
      const result = response.data;

      setTopProducts(
        Array.isArray(result?.data) ? result.data : []
      );
    } catch (err) {
      console.error("Fetch top products error:", err);
      setTopProducts([]);
    }
  }

  // --------------------------------------------------
  // Fetch Airflow Daily Sales
  // --------------------------------------------------

  async function fetchDailySales() {
    try {
      const response = await api.get("/analytics/revenue");
      const result = response.data;

      const records: DailySale[] = Array.isArray(result?.data)
        ? result.data.map((item: DailySale) => ({
            ...item,
            total_orders: Number(item.total_orders),
            total_revenue: Number(item.total_revenue),
          }))
        : [];

      setDailySales(records);
    } catch (err) {
      console.error("Fetch daily sales error:", err);
      setDailySales([]);
    }
  }

  // --------------------------------------------------
  // Refresh Dashboard
  // --------------------------------------------------

  async function refreshDashboard() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchOrders(),
        fetchTopProducts(),
        fetchDailySales(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshDashboard();
  }, []);

  // --------------------------------------------------
  // Filter Orders by Date
  // --------------------------------------------------

  const filteredOrders = useMemo(() => {
    if (period === "all") {
      return orders;
    }

    const days = Number(period);
    const cutoff = new Date();

    cutoff.setDate(cutoff.getDate() - days);

    return orders.filter(
      (order) => new Date(order.created_at) >= cutoff
    );
  }, [orders, period]);

  // --------------------------------------------------
  // Filter Airflow Daily Sales by Date
  // --------------------------------------------------

  const filteredDailySales = useMemo(() => {
    if (period === "all") {
      return dailySales;
    }

    const days = Number(period);
    const cutoff = new Date();

    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    return dailySales.filter(
      (sale) => parseReportDate(sale.report_date) >= cutoff
    );
  }, [dailySales, period]);

  // --------------------------------------------------
  // Dashboard KPI Calculations
  // --------------------------------------------------

  const totalRevenue = filteredOrders.reduce(
    (sum, order) =>
      sum + Number(order.total_amount || 0),
    0
  );

  const totalOrders = filteredOrders.length;

  const completedOrders = filteredOrders.filter(
    (order) =>
      ["completed", "delivered"].includes(
        order.order_status?.toLowerCase()
      )
  ).length;

  const pendingOrders = filteredOrders.filter(
    (order) =>
      ["pending", "processing"].includes(
        order.order_status?.toLowerCase()
      )
  ).length;

  // --------------------------------------------------
  // Airflow Revenue Chart Data
  // --------------------------------------------------

  const revenueData = useMemo(() => {
    return filteredDailySales.map((sale) => ({
      date: formatReportDate(sale.report_date),
      revenue: sale.total_revenue,
      orders: sale.total_orders,
    }));
  }, [filteredDailySales]);

  // --------------------------------------------------
  // Order Status Chart Data
  // --------------------------------------------------

  const statusData = useMemo(() => {
    const grouped: Record<string, number> = {};

    filteredOrders.forEach((order) => {
      const status = order.order_status || "Unknown";

      grouped[status] = (grouped[status] || 0) + 1;
    });

    return Object.entries(grouped).map(
      ([name, value]) => ({
        name,
        value,
      })
    );
  }, [filteredOrders]);

  // --------------------------------------------------
  // Search and Status Filter
  // --------------------------------------------------

  const searchedOrders = useMemo(() => {
    return filteredOrders.filter((order) => {
      const matchesSearch =
        String(order.order_id).includes(search) ||
        String(order.customer_id ?? "").includes(search) ||
        String(order.product_id ?? "").includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        order.order_status?.toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [filteredOrders, search, statusFilter]);

  // --------------------------------------------------
  // Pagination
  // --------------------------------------------------

  const totalPages = Math.max(
    1,
    Math.ceil(searchedOrders.length / pageSize)
  );

  const paginatedOrders = searchedOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // --------------------------------------------------
  // Loading State
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading analytics dashboard...
      </div>
    );
  }

  // --------------------------------------------------
  // Error State
  // --------------------------------------------------

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-red-500">{error}</p>

        <Button onClick={refreshDashboard}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // --------------------------------------------------
  // Dashboard UI
  // --------------------------------------------------

  return (
    <main className="min-h-screen space-y-6 bg-muted/30 p-6">

      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Analytics Dashboard
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitor your e-commerce business performance.
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>

          <Button
            variant="outline"
            onClick={refreshDashboard}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={currency(totalRevenue)}
          description="Revenue from filtered orders"
          icon={IndianRupee}
        />

        <StatCard
          title="Total Orders"
          value={String(totalOrders)}
          description="Orders in selected period"
          icon={ShoppingCart}
        />

        <StatCard
          title="Completed Orders"
          value={String(completedOrders)}
          description="Completed or delivered"
          icon={CheckCircle}
        />

        <StatCard
          title="Pending Orders"
          value={String(pendingOrders)}
          description="Pending or processing"
          icon={Clock}
        />
      </section>

      {/* Charts */}

      <section className="grid gap-6 lg:grid-cols-3">

        {/* Airflow Revenue Chart */}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Revenue Overview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Daily aggregated revenue from Airflow ETL
            </p>
          </CardHeader>

          <CardContent>
            {revenueData.length === 0 ? (
              <p className="py-20 text-center text-muted-foreground">
                No Airflow revenue data available for this period.
              </p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart data={revenueData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis dataKey="date" />

                    <YAxis />

                    <Tooltip
                      formatter={(value, name) => [
                        name === "revenue"
                          ? currency(Number(value))
                          : Number(value),
                        name === "revenue"
                          ? "Revenue"
                          : "Orders",
                      ]}
                    />

                    <Bar
                      dataKey="revenue"
                      fill="#3b82f6"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Chart */}

        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>

          <CardContent>
            {statusData.length === 0 ? (
              <p className="py-20 text-center text-muted-foreground">
                No order status data available.
              </p>
            ) : (
              <>
                <div className="h-[230px]">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        label
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {statusData.map((item) => (
                    <div
                      key={item.name}
                      className="flex justify-between text-sm"
                    >
                      <span>{item.name}</span>

                      <span className="font-medium">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Top Selling Products */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Top Selling Products
          </CardTitle>
        </CardHeader>

        <CardContent>
          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No product sales data available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-3">Product</th>
                    <th className="p-3">Product ID</th>
                    <th className="p-3">Units Sold</th>
                    <th className="p-3">Revenue</th>
                  </tr>
                </thead>

                <tbody>
                  {topProducts.map((product) => (
                    <tr
                      key={product.product_id}
                      className="border-b last:border-0"
                    >
                      <td className="p-3 font-medium">
                        {product.product_name}
                      </td>

                      <td className="p-3">
                        #{product.product_id}
                      </td>

                      <td className="p-3">
                        {product.units_sold}
                      </td>

                      <td className="p-3 font-medium">
                        {currency(Number(product.revenue))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Management */}

      <Card>
        <CardHeader>
          <CardTitle>Orders Management</CardTitle>
        </CardHeader>

        <CardContent>

          {/* Search and Status Filter */}

          <div className="mb-4 flex flex-wrap gap-3">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search order, customer or product ID..."
              className="min-w-[220px] flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            />

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All statuses</option>

              {Array.from(
                new Set(
                  orders.map((order) => order.order_status)
                )
              )
                .filter(Boolean)
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>
          </div>

          {/* Orders Table */}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer ID</th>
                  <th className="p-3">Product ID</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.order_id}
                    className="border-b last:border-0"
                  >
                    <td className="p-3 font-medium">
                      #{order.order_id}
                    </td>

                    <td className="p-3">
                      {order.customer_id ?? "—"}
                    </td>

                    <td className="p-3">
                      {order.product_id ?? "—"}
                    </td>

                    <td className="p-3">
                      {order.quantity}
                    </td>

                    <td className="p-3">
                      {currency(Number(order.total_amount))}
                    </td>

                    <td className="p-3">
                      {order.order_status}
                    </td>

                    <td className="p-3">
                      {new Date(order.created_at).toLocaleDateString(
                        "en-IN"
                      )}
                    </td>
                  </tr>
                ))}

                {paginatedOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {searchedOrders.length} matching order(s)
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() =>
                  setCurrentPage((page) => page - 1)
                }
              >
                Previous
              </Button>

              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((page) => page + 1)
                }
              >
                Next
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Footer */}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="h-4 w-4" />
        Dashboard data retrieved from Go backend and Airflow analytics.
      </div>

    </main>
  );
}
