
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  dashboardService,
  type Customer,
  type Product,
} from "@/services/dashboard.service";

const currency = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export default function CreateOrderPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [customerData, productData] = await Promise.all([
        dashboardService.getCustomers(),
        dashboardService.getProducts(),
      ]);

      setCustomers(customerData);
      setProducts(productData);
    } catch (err) {
      console.error("Failed to load order form data:", err);
      setError("Unable to load customers or products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedProduct = useMemo(
    () => products.find(
      (product) => String(product.product_id) === productId
    ),
    [products, productId]
  );

  const totalAmount = selectedProduct
    ? Number(selectedProduct.price) * quantity
    : 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!customerId || !productId) {
      setError("Please select a customer and product.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (!selectedProduct || quantity > selectedProduct.stock_quantity) {
      setError("Requested quantity exceeds available stock.");
      return;
    }

    try {
      setSubmitting(true);

      const order = await dashboardService.createOrder({
        customer_id: Number(customerId),
        product_id: Number(productId),
        quantity,
      });

      setSuccess(`Order #${order.order_id} created successfully.`);

      setTimeout(() => {
        router.push("/dashboard/orders");
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      console.error("Order creation failed:", err);

      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof err.response === "object" &&
        err.response !== null &&
        "data" in err.response &&
        typeof err.response.data === "object" &&
        err.response.data !== null &&
        "error" in err.response.data &&
        typeof err.response.data.error === "string"
          ? err.response.data.error
          : "Unable to create order. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="p-6">
        Loading customers and products...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon">
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold">Create Order</h1>
          <p className="text-sm text-muted-foreground">
            Create an order using existing customers and products.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order Details
          </CardTitle>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-md bg-green-500/10 p-3 text-sm text-green-600">
              {success}
            </div>
          )}

          {customers.length === 0 || products.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {customers.length === 0
                  ? "No customers are available."
                  : "No products are available."}
              </p>
              <Button variant="outline" onClick={fetchData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh data
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="customer" className="text-sm font-medium">
                  Select Customer
                </label>

                <select
                  id="customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Choose a customer</option>
                  {customers.map((customer) => (
                    <option
                      key={customer.customer_id}
                      value={customer.customer_id}
                    >
                      {customer.name} — {customer.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="product" className="text-sm font-medium">
                  Select Product
                </label>

                <select
                  id="product"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Choose a product</option>
                  {products.map((product) => (
                    <option
                      key={product.product_id}
                      value={product.product_id}
                      disabled={product.stock_quantity <= 0}
                    >
                      {product.product_name} — {currency(Number(product.price))}
                      {" "}({product.stock_quantity} available)
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="rounded-md bg-muted p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit price</span>
                    <span className="font-medium">
                      {currency(Number(selectedProduct.price))}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between">
                    <span className="text-muted-foreground">Available stock</span>
                    <span className="font-medium">
                      {selectedProduct.stock_quantity}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Quantity
                </label>

                <input
                  id="quantity"
                  type="number"
                  min={1}
                  max={selectedProduct?.stock_quantity ?? undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Order Total</p>
                <p className="mt-1 text-2xl font-bold">
                  {currency(totalAmount)}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  submitting ||
                  !customerId ||
                  !productId ||
                  !Number.isInteger(quantity) ||
                  quantity <= 0 ||
                  !selectedProduct ||
                  quantity > selectedProduct.stock_quantity
                }
              >
                {submitting ? "Creating Order..." : "Create Order"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
