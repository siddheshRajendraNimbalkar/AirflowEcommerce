
"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dashboardService,
  type Customer,
} from "@/services/dashboard.service";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await dashboardService.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setError("Unable to load customers from the backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View your registered customers.
          </p>
        </div>

        <Button variant="outline" onClick={fetchCustomers}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Total Customers: {customers.length}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">
              Loading customers...
            </p>
          ) : error ? (
            <div className="space-y-3">
              <p className="text-sm text-red-500">{error}</p>
              <Button onClick={fetchCustomers}>Retry</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-3">Customer ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Created At</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.customer_id}
                      className="border-b last:border-0"
                    >
                      <td className="p-3 font-medium">
                        #{customer.customer_id}
                      </td>
                      <td className="p-3">{customer.name}</td>
                      <td className="p-3">{customer.email}</td>
                      <td className="p-3">
                        {customer.created_at
                          ? new Date(customer.created_at).toLocaleDateString(
                              "en-IN"
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}

                  {customers.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No customers found.
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
