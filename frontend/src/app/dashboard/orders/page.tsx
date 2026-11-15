
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  ShoppingCart,
  IndianRupee,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

import { api } from "@/lib/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { OrderStatusSelect } from "@/components/dashboard/order-status-select";


interface Order {
  order_id: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  total_amount: number;
  order_status: string;
  created_at: string;
  updated_at?: string;
}

const PAGE_SIZE = 10;

const currency = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`;

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase() || "unknown";

  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    delivered: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[normalized] || "bg-muted text-muted-foreground"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h2 className="mt-2 text-2xl font-bold">{value}</h2>
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [period, setPeriod] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders");
      const result = response.data;

      const records = Array.isArray(result)
        ? result
        : result.data ?? [];

      setOrders(records);
    } catch (err) {
      console.error("Orders API error:", err);
      setError("Unable to load orders. Please check your backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Date filter
    if (period !== "all") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - Number(period));

      result = result.filter(
        (order) => new Date(order.created_at) >= cutoff
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(
        (order) =>
          order.order_status?.toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    // Search by order, customer or product ID
    if (search.trim()) {
      const query = search.trim().toLowerCase();

      result = result.filter(
        (order) =>
          String(order.order_id).includes(query) ||
          String(order.customer_id).includes(query) ||
          String(order.product_id).includes(query) ||
          order.order_status?.toLowerCase().includes(query)
      );
    }

    return result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );
  }, [orders, search, statusFilter, period]);

  // Dashboard statistics use the selected date period.
  const periodOrders = useMemo(() => {
    if (period === "all") return orders;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(period));

    return orders.filter(
      (order) => new Date(order.created_at) >= cutoff
    );
  }, [orders, period]);

  const totalRevenue = periodOrders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );

  const completedOrders = periodOrders.filter((order) =>
    ["completed", "delivered"].includes(
      order.order_status?.toLowerCase()
    )
  ).length;

  const pendingOrders = periodOrders.filter((order) =>
    ["pending", "processing"].includes(
      order.order_status?.toLowerCase()
    )
  ).length;

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / PAGE_SIZE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedOrders = filteredOrders.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setPeriod("all");
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        Loading orders...
      </div>
    );
  }

  return (
    <main className="min-h-screen space-y-6 bg-muted/30 p-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage and monitor your orders.
          </p>
        </div>

        <Button>
          <Link href="/dashboard/orders/create">
            Create Order
          </Link>
        </Button>
      </div>
          <p className="mt-1 text-sm text-muted-foreground">
            View, monitor and analyze your e-commerce orders.
          </p>
        </div>

        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-red-500">{error}</p>
            <Button size="sm" onClick={fetchOrders}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={String(periodOrders.length)}
          description="Orders in selected period"
          icon={ShoppingCart}
        />

        <StatCard
          title="Total Revenue"
          value={currency(totalRevenue)}
          description="Revenue from existing orders"
          icon={IndianRupee}
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

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>All Orders</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredOrders.length} matching orders
              </p>
            </div>

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
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and status filter */}
          <div className="mb-5 flex flex-wrap gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search order, customer or product ID..."
                className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

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
                new Set(orders.map((order) => order.order_status))
              )
                .filter(Boolean)
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>

            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>

          {/* Table */}
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
                  <th className="p-3">Order Date</th>
                </tr>
              </thead>

              <tbody>
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.order_id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-3 font-medium">
                      #{order.order_id}
                    </td>

                    <td className="p-3">
                      {order.customer_id}
                    </td>

                    <td className="p-3">
                      {order.product_id}
                    </td>

                    <td className="p-3">
                      {order.quantity}
                    </td>

                    <td className="p-3 font-medium">
                      {currency(Number(order.total_amount))}
                    </td>

                    <td className="p-3">
                      <OrderStatusSelect
                        orderId={order.order_id}
                        initialStatus={order.order_status}
                      />
                    </td>

                    <td className="p-3 whitespace-nowrap">
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
                      className="p-10 text-center text-muted-foreground"
                    >
                      No orders match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {filteredOrders.length === 0
                ? 0
                : (safePage - 1) * PAGE_SIZE + 1}
              {" – "}
              {Math.min(safePage * PAGE_SIZE, filteredOrders.length)}
              {" of "}
              {filteredOrders.length}
            </p>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={safePage === 1}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <span className="text-sm">
                {safePage} / {totalPages}
              </span>

              <Button
                size="sm"
                variant="outline"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1)
                  )
                }
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
