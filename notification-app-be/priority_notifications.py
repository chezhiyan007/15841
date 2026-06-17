"""
Campus Notification Priority Ranking

Time Complexity:
    O(n log 10), where n is the number of notifications returned by the API.
    The heap size is fixed at 10, so each heap operation is effectively bounded.

Space Complexity:
    O(10) for the ranking heap, excluding the API response object loaded from HTTP.

Why heap is used:
    A fixed-size min heap keeps only the Top 10 unread notifications while scanning
    the API response. This avoids sorting the entire dataset, which would cost
    O(n log n), and supports continuously arriving notifications by allowing each
    new item to be evaluated independently.
"""

from __future__ import annotations

import heapq
import json
import os
import sys
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


API_URL = "http://4.224.186.213/evaluation-service/notifications"
TOKEN_ENV_VAR = "NOTIFICATION_API_TOKEN"
REQUEST_TIMEOUT_SECONDS = 10
TOP_K = 10

TYPE_WEIGHTS = {
    "placement": 3,
    "result": 2,
    "event": 1,
}


class NotificationFetchError(Exception):
    """Raised when notifications cannot be fetched from the remote API."""


def get_bearer_token() -> str:
    """Read the API bearer token from the environment."""
    token = os.getenv(TOKEN_ENV_VAR, "").strip()
    if not token:
        raise NotificationFetchError(
            f"Missing bearer token. Set the {TOKEN_ENV_VAR} environment variable."
        )
    return token


def fetch_notifications(api_url: str, token: str) -> Any:
    """Fetch notifications from the remote API with timeout and error handling."""
    request = Request(
        api_url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
        method="GET",
    )

    try:
        with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            body = response.read().decode(charset)
            return json.loads(body)
    except HTTPError as error:
        raise NotificationFetchError(
            f"API request failed with status {error.code}: {error.reason}"
        ) from error
    except URLError as error:
        raise NotificationFetchError(f"API request failed: {error.reason}") from error
    except TimeoutError as error:
        raise NotificationFetchError("API request timed out.") from error
    except json.JSONDecodeError as error:
        raise NotificationFetchError("API returned invalid JSON.") from error


def extract_notification_list(api_response: Any) -> list[dict[str, Any]]:
    """Extract a notification list from common API response shapes."""
    if isinstance(api_response, list):
        return [item for item in api_response if isinstance(item, dict)]

    if not isinstance(api_response, dict):
        return []

    possible_keys = ("notifications", "data", "items", "results")
    for key in possible_keys:
        value = api_response.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
        if isinstance(value, dict):
            nested = extract_notification_list(value)
            if nested:
                return nested

    return []


def get_first_value(notification: dict[str, Any], keys: tuple[str, ...]) -> Any:
    """Return the first available value from a notification for the given keys."""
    for key in keys:
        if key in notification:
            return notification[key]
    return None


def is_unread(notification: dict[str, Any]) -> bool:
    """Return True when a notification is unread."""
    is_read = get_first_value(notification, ("isRead", "is_read", "read"))
    read_at = get_first_value(notification, ("readAt", "read_at"))

    if isinstance(is_read, bool):
        return not is_read

    if isinstance(is_read, str):
        return is_read.strip().lower() in {"false", "0", "no", "unread"}

    if isinstance(is_read, (int, float)):
        return is_read == 0

    if read_at:
        return False

    status = get_first_value(notification, ("status", "readStatus", "read_status"))
    if isinstance(status, str):
        return status.strip().lower() in {"unread", "new", "pending"}

    return True


def get_notification_type(notification):
    value = get_first_value(
        notification,
        (
            "Type",
            "type",
            "notificationType",
            "notification_type",
            "category",
        ),
    )
    return str(value or "").strip().lower()


def parse_created_at(notification: dict[str, Any]) -> datetime:
    """Parse the notification creation timestamp into a timezone-aware datetime."""
    value = get_first_value(
        notification,
        ("createdAt", "created_at", "timestamp", "createdOn", "created_on"),
    )

    if isinstance(value, (int, float)):
        timestamp = value / 1000 if value > 10_000_000_000 else value
        return datetime.fromtimestamp(timestamp, tz=timezone.utc)

    if isinstance(value, str) and value.strip():
        normalized = value.strip().replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(normalized)
            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except ValueError:
            pass

    return datetime.fromtimestamp(0, tz=timezone.utc)


def calculate_priority_score(notification: dict[str, Any], now: datetime) -> float:
    """Calculate a combined score from type weight and recency."""
    notification_type = get_notification_type(notification)
    type_weight = TYPE_WEIGHTS.get(notification_type, 0)
    created_at = parse_created_at(notification)

    age_seconds = max((now - created_at).total_seconds(), 0)
    age_hours = age_seconds / 3600
    recency_score = 1 / (age_hours + 1)

    return type_weight + recency_score


def get_notification_id(notification: dict[str, Any]) -> str:
    """Return a readable notification identifier."""
    value = get_first_value(notification, ("id", "notificationId", "notification_id"))
    return str(value or "N/A")


def get_notification_title(notification: dict[str, Any]) -> str:
    """Return a readable notification title."""
    value = get_first_value(notification, ("title", "subject", "name"))
    return str(value or "Untitled notification")


def get_notification_message(notification: dict[str, Any]) -> str:
    """Return a readable notification message."""
    value = get_first_value(notification, ("message", "description", "body", "content"))
    return str(value or "")


def top_unread_notifications(
    notifications: list[dict[str, Any]],
    limit: int = TOP_K,
) -> list[tuple[float, dict[str, Any]]]:
    """Return Top K unread notifications using a fixed-size min heap."""

    heap = []
    counter = count()
    now = datetime.now(timezone.utc)

    for notification in notifications:
        if not is_unread(notification):
            continue

        score = calculate_priority_score(notification, now)
        created_at = parse_created_at(notification)

        heap_item = (
            score,
            created_at.timestamp(),
            next(counter),
            notification,
        )

        if len(heap) < limit:
            heapq.heappush(heap, heap_item)
        else:
            if heap_item > heap[0]:
                heapq.heapreplace(heap, heap_item)

    ranked = sorted(
        heap,
        key=lambda item: (item[0], item[1]),
        reverse=True,
    )

    return [
        (score, notification)
        for score, _, _, notification in ranked
    ]


def print_notifications(ranked_notifications: list[tuple[float, dict[str, Any]]]) -> None:
    """Print the ranked notifications in a readable format."""
    if not ranked_notifications:
        print("No unread priority notifications found.")
        return

    print(f"Top {len(ranked_notifications)} Unread Notifications")
    print("=" * 50)

    for index, (score, notification) in enumerate(ranked_notifications, start=1):
        created_at = parse_created_at(notification).isoformat()
        notification_type = get_notification_type(notification).title() or "Unknown"
        message = get_notification_message(notification)

        print(f"{index}. {get_notification_title(notification)}")
        print(f"   ID: {get_notification_id(notification)}")
        print(f"   Type: {notification_type}")
        print(f"   Created At: {created_at}")
        print(f"   Priority Score: {score:.4f}")
        if message:
            print(f"   Message: {message}")
        print()


def main() -> int:
    """Fetch, rank, and print the Top 10 unread notifications."""
    try:
        token = get_bearer_token()
        api_response = fetch_notifications(API_URL, token)
        notifications = extract_notification_list(api_response)
        print(f"Total notifications fetched: {len(notifications)}")

        if notifications:
            print("\nSample Notification:\n")
            print(json.dumps(notifications[0], indent=2))

        if not notifications:
            print("No notifications were returned by the API.")
            return 0

        ranked_notifications = top_unread_notifications(notifications)
        print_notifications(ranked_notifications)
        return 0
    except NotificationFetchError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    except Exception as error:
        print(f"Unexpected error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
