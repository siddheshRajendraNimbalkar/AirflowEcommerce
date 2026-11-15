
"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dashboardService,
  type Product,
} from "@/services/dashboard.service";

const currency = (value: number) =>
  `₹${Number(value).toLocaleString("en-IN")}`;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await dashboardService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Unable to load products from the backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor your product inventory and stock.
          </p>
        </div>

        <Button variant="outline" onClick={fetchProducts}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Total Products: {products.length}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">
              Loading products...
            </p>
          ) : error ? (
            <div className="space-y-3">
              <p className="text-sm text-red-500">{error}</p>
              <Button onClick={fetchProducts}>Retry</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-3">Product ID</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Availability</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.product_id}
                      className="border-b last:border-0"
                    >
                      <td className="p-3 font-medium">
                        #{product.product_id}
                      </td>
                      <td className="p-3">{product.product_name}</td>
                      <td className="p-3">
                        {currency(product.price)}
                      </td>
                      <td className="p-3">{product.stock_quantity}</td>
                      <td className="p-3">
                        <span
                          className={
                            product.stock_quantity > 0
                              ? "text-green-600"
                              : "text-red-500"
                          }
                        >
                          {product.stock_quantity > 0
                            ? "In Stock"
                            : "Out of Stock"}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {products.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
