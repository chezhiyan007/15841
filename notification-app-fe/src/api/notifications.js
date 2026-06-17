import { logger } from "../utils/logger";

const API_BASE_URL =
  import.meta.env.VITE_NOTIFICATION_API_BASE_URL ??
  "http://4.224.186.213/evaluation-service";

const API_TOKEN = import.meta.env.VITE_NOTIFICATION_API_TOKEN ?? "";

function buildUrl({ page = 1, limit = 20, notificationType = "All" } = {}) {
  const url = new URL("/notifications", API_BASE_URL);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  if (notificationType && notificationType !== "All") {
    url.searchParams.set("notification_type", notificationType);
  }

  return url;
}

function normalizeResponse(payload, fallbackPage, fallbackLimit) {
  const list =
    (Array.isArray(payload) && payload) ||
    payload?.notifications ||
    payload?.data?.notifications ||
    payload?.data ||
    payload?.items ||
    payload?.results ||
    [];

  const pagination =
    payload?.pagination || payload?.data?.pagination || payload?.meta || {};

  const total =
    pagination.totalItems ??
    pagination.total ??
    payload?.total ??
    payload?.data?.total ??
    list.length;

  const limit = Number(pagination.limit ?? fallbackLimit);
  const page = Number(pagination.page ?? fallbackPage);
  const totalPages =
    Number(pagination.totalPages) || Math.max(1, Math.ceil(total / limit));

  return {
    notifications: Array.isArray(list) ? list : [],
    total,
    page,
    limit,
    totalPages,
  };
}

export async function fetchNotifications(params = {}, signal) {
  const url = buildUrl(params);
  const requestPath = url.pathname + url.search;

  logger.apiRequest("GET", requestPath);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = await response.json();
    return normalizeResponse(payload, params.page ?? 1, params.limit ?? 20);
  } catch (error) {
    if (error.name !== "AbortError") {
      logger.apiFailure("GET", requestPath, error);
    }
    throw error;
  }
}
