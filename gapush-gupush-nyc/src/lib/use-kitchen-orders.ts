"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchKitchenOrders, runKitchenAction } from "./api-client";
import type { OrderDTO } from "@/server/types";

/**
 * Shared polling hook for anything that needs the live order list (owner
 * dashboard, order queue, kitchen view). There's no websocket/push channel
 * in this simulation, so "real-time" here means "polls every few seconds" —
 * good enough for a phone/tablet at a food truck, and it's what makes
 * "kitchen marks ready" show up on the customer's tracker without a manual
 * refresh (the tracker polls the single order the same way).
 */
export function usePolledOrders(intervalMs = 3000) {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { orders } = await fetchKitchenOrders();
      setOrders(orders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const id = window.setInterval(refresh, intervalMs);
    return () => window.clearInterval(id);
  }, [refresh, intervalMs]);

  const runAction = useCallback(async (orderId: string, action: "accept" | "ready" | "complete") => {
    const { order } = await runKitchenAction(orderId, action);
    setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
    return order;
  }, []);

  return { orders, loading, error, refresh, runAction };
}
