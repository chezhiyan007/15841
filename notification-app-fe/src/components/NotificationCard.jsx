import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";

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

function formatDate(value) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const priorityColors = {
  Urgent: "error",
  High: "warning",
  Medium: "info",
  Low: "default",
};

export function NotificationCard({ notification, score }) {
  const unread = isUnread(notification);
  const title = getField(notification, ["title", "subject"], "Untitled");
  const message = getField(notification, ["message", "body", "description"], "");
  const type = getField(
    notification,
    ["notification_type", "notificationType", "category", "type"],
    "General",
  );
  const priority = getField(notification, ["priority"], unread ? "High" : "Medium");
  const createdAt = getField(notification, ["created_at", "createdAt"], "");

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderLeft: unread ? "4px solid #2563eb" : "4px solid transparent",
        bgcolor: unread ? "#ffffff" : "#f9fafb",
      }}
    >
      <Stack spacing={1.25}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={2}
        >
          <Box minWidth={0}>
            <Stack direction="row" spacing={1} alignItems="center">
              {unread && <CircleIcon color="primary" sx={{ fontSize: 10 }} />}
              <Typography variant="subtitle1" fontWeight={unread ? 800 : 650}>
                {title}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {formatDate(createdAt)}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
            <Chip label={type} size="small" color="primary" variant="outlined" />
            <Chip
              label={unread ? "Unviewed" : "Viewed"}
              size="small"
              color={unread ? "success" : "default"}
            />
          </Stack>
        </Stack>

        {message && (
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        )}

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={priority}
            size="small"
            color={priorityColors[priority] ?? "default"}
          />
          {score !== undefined && (
            <Chip label={`Score ${score.toFixed(2)}`} size="small" variant="outlined" />
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
