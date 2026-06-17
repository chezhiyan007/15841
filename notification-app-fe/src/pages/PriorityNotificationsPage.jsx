import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";

const PRIORITY_LIMIT = 10;
const FETCH_LIMIT = 100;
const TYPE_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function getField(notification, keys, fallback = "") {
  for (const key of keys) {
    if (notification[key] !== undefined && notification[key] !== null) {
      return notification[key];
    }
  }
  return fallback;
}

function isUnread(notification) {
  const value = getField(notification, ["isRead", "is_read", "read"], undefined);
  if (typeof value === "boolean") return !value;
  if (typeof value === "string") {
    return ["false", "0", "unread", "no"].includes(value.toLowerCase());
  }
  if (typeof value === "number") return value === 0;
  return !getField(notification, ["readAt", "read_at"], "");
}

function getType(notification) {
  return getField(
    notification,
    ["notification_type", "notificationType", "category", "type"],
    "General",
  );
}

function getCreatedAt(notification) {
  const value = getField(notification, ["created_at", "createdAt"], "");
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function scoreNotification(notification) {
  const type = getType(notification);
  const typeScore = TYPE_WEIGHTS[type] ?? 0;
  const ageHours = Math.max(
    (Date.now() - getCreatedAt(notification).getTime()) / 3600000,
    0,
  );
  const recencyScore = 1 / (ageHours + 1);
  return typeScore + recencyScore;
}

function getTopPriorityNotifications(notifications) {
  return notifications
    .filter(isUnread)
    .map((notification) => ({
      notification,
      score: scoreNotification(notification),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, PRIORITY_LIMIT);
}

export function PriorityNotificationsPage() {
  const [filter, setFilter] = useState("All");
  const { notifications, loading, error } = useNotifications({
    page: 1,
    limit: FETCH_LIMIT,
    filter,
  });

  const priorityNotifications = useMemo(
    () => getTopPriorityNotifications(notifications),
    [notifications],
  );

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
          <Stack direction="row" spacing={1.5} alignItems="center">
            <PriorityHighIcon color="error" />
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Priority Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Top 10 unread notifications ranked by type and recency
              </Typography>
            </Box>
          </Stack>

          <NotificationFilter value={filter} onChange={setFilter} />
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {loading && (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error">Failed to load priority notifications: {error}</Alert>
        )}

        {!loading && !error && priorityNotifications.length === 0 && (
          <Alert severity="info">No unread priority notifications found.</Alert>
        )}

        {!loading && !error && priorityNotifications.length > 0 && (
          <Stack spacing={1.5}>
            {priorityNotifications.map(({ notification, score }, index) => (
              <NotificationCard
                key={notification.id ?? notification.notification_id ?? index}
                notification={notification}
                score={score}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
