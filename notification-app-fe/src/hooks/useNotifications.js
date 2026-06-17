import { useEffect, useState } from "react";

import { fetchNotifications } from "../api/notifications";

export function useNotifications({ page = 1, limit = 20, filter = "All" } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchNotifications(
          {
            page,
            limit,
            notificationType: filter,
          },
          controller.signal,
        );

        setNotifications(data.notifications);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load notifications.");
          setNotifications([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => controller.abort();
  }, [page, limit, filter]);

  return { notifications, total, totalPages, loading, error };
}
