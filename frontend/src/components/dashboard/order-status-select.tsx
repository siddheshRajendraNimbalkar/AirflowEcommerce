
"use client";

import { useState } from "react";
import { dashboardService } from "@/services/dashboard.service";

type Props = {
  orderId: number;
  initialStatus: string;
  onUpdated?: (status: string) => void;
};

export function OrderStatusSelect({
  orderId,
  initialStatus,
  onUpdated,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(nextStatus: string) {
    const previousStatus = status;

    try {
      setLoading(true);
      setError("");

      await dashboardService.updateOrderStatus(orderId, nextStatus);

      setStatus(nextStatus);
      onUpdated?.(nextStatus);
    } catch (err) {
      console.error("Status update failed:", err);
      setStatus(previousStatus);
      setError("Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <select
        value={status}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border bg-background px-2 py-1.5 text-sm"
      >
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
      </select>

      {loading && (
        <span className="ml-2 text-xs text-muted-foreground">
          Updating...
        </span>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
