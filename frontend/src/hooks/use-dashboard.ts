
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface Order {
  order_id: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  total_amount: number;
  order_status: string;
  created_at: string;
  updated_at?: string;
}

interface DashboardState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    orders: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await api.get("/orders");

        // Support either a direct array or { data: [...] }
        const result = response.data;
        const orders = Array.isArray(result)
          ? result
          : result.data ?? [];

        setState({
          orders,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Failed to fetch orders:", error);

        setState((previous) => ({
          ...previous,
          loading: false,
          error: "Unable to load orders. Check the backend connection.",
        }));
      }
    }

    fetchOrders();
  }, []);

  const { orders } = state;

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );

  const completedOrders = orders.filter(
    (order) => order.order_status?.toLowerCase() === "completed"
  ).length;

  const pendingOrders = orders.filter(
    (order) => order.order_status?.toLowerCase() === "pending"
  ).length;

  return {
    ...state,
    totalOrders: orders.length,
    totalRevenue,
    completedOrders,
    pendingOrders,
  };
}
