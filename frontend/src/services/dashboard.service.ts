
import { api } from "@/lib/api";

export interface Order {
  order_id: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  total_amount: number;
  order_status: string;
  created_at: string;
}

export interface Customer {
  customer_id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface Product {
  product_id: number;
  product_name: string;
  price: number;
  stock_quantity: number;
}

interface ApiResponse<T> {
  data: T;
}

export const dashboardService = {
  async getOrders(): Promise<Order[]> {
    const response = await api.get<ApiResponse<Order[]>>("/orders");
    return response.data.data;
  },

  async getCustomers(): Promise<Customer[]> {
    const response = await api.get<ApiResponse<Customer[]>>("/customers");
    return response.data.data;
  },

  async getProducts(): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>("/products");
    return response.data.data;
  },
  async createOrder(input: {
    customer_id: number;
    product_id: number;
    quantity: number;
  }): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>(
      "/orders",
      input
    );

    return response.data.data;
  },
  async updateOrderStatus(orderId: number, status: string) {
    const response = await api.patch(`/orders/${orderId}/status`, {
      status,
    });

    return response.data.data;
  },
};

