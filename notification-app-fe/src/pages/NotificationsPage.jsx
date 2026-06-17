import { useState } from "react";
import {
  Alert,
  Badge,
  Box,
  CircularProgress,
  Divider,
  Pagination,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";

const PAGE_SIZE = 20;

function isUnread(notification) {
  const value = notification.isRead ?? notification.is_read ?? notification.read;
  if (typeof value === "boolean") return !value;
  if (typeof value === "string") {
    return ["false", "0", "unread", "no"].includes(value.toLowerCase());
  }
  if (typeof value === "number") return value === 0;
  return !notification.readAt && !notification.read_at;
}

export function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);

  const { notifications, total, totalPages, loading, error } = useNotifications({
    page,
    limit: PAGE_SIZE,
    filter,
  });

  const unreadCount = notifications.filter(isUnread).length;

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ maxWidth: 820, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
          mb={3}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Badge badgeContent={unreadCount} color="primary" max={99}>
              <NotificationsIcon sx={{ fontSize: 28 }} />
            </Badge>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                All Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {total} notifications found
              </Typography>
            </Box>
          </Stack>

          <NotificationFilter value={filter} onChange={handleFilterChange} />
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {loading && (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error">Failed to load notifications: {error}</Alert>
        )}

        {!loading && !error && notifications.length === 0 && (
          <Alert severity="info">No notifications found for this filter.</Alert>
        )}

        {!loading && !error && notifications.length > 0 && (
          <Stack spacing={1.5}>
            {notifications.map((notification, index) => (
              <NotificationCard
                key={notification.id ?? notification.notification_id ?? index}
                notification={notification}
              />
            ))}
          </Stack>
        )}

        {!loading && !error && totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
}
