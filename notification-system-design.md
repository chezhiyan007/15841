# Notification System Design
# Campus Notification Platform System Design

## 1. System Overview

The Campus Notification Platform provides a REST API and real-time event channel for delivering campus updates to pre-authorized students. Notifications may cover placements, events, results, and general announcements.

Authentication is not required for this design because users are assumed to be pre-authorized by the campus environment. The API focuses on notification creation, retrieval, read-state management, deletion, filtering, unread counts, and real-time updates.

The platform supports:

- Persistent storage of notifications
- Category-based notification discovery
- Per-notification read status
- Bulk read status updates
- Soft or hard deletion depending on implementation policy
- WebSocket delivery of notification changes

## 2. Core Actions Supported

- Create notification
- List notifications
- Get notification by ID
- Mark notification as read
- Mark all notifications as read
- Delete notification
- Filter notifications by category
- Get unread notification count

## 3. API Standards

### Base URL

```text
https://api.campus.example.com/api/v1
```

### Versioning

API versioning is included in the URL path.

```text
/api/v1
```

Future breaking changes should use a new version, such as `/api/v2`.

### Content-Type

All request and response bodies use JSON.

```http
Content-Type: application/json
Accept: application/json
```

### Common Headers

```http
Content-Type: application/json
Accept: application/json
```

### Error Format

All errors follow a predictable structure.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more request fields are invalid.",
    "details": [
      {
        "field": "title",
        "message": "Title is required."
      }
    ]
  }
}
```

### Common HTTP Status Codes

| Status Code | Meaning |
| --- | --- |
| 200 OK | Request completed successfully |
| 201 Created | Resource created successfully |
| 204 No Content | Resource deleted successfully |
| 400 Bad Request | Invalid request body, parameters, or filters |
| 404 Not Found | Requested notification does not exist |
| 409 Conflict | Request conflicts with current resource state |
| 500 Internal Server Error | Unexpected server error |

## 4. Notification Object Schema

```json
{
  "id": "noti_01HYX7K9P4Q8R2M6A5B3C1D0EF",
  "title": "Placement Drive - ABC Technologies",
  "message": "ABC Technologies will conduct a placement drive on Friday at 10:00 AM.",
  "category": "Placement",
  "priority": "High",
  "createdAt": "2026-06-17T09:30:00Z",
  "updatedAt": "2026-06-17T09:30:00Z",
  "isRead": false,
  "expiresAt": "2026-06-24T23:59:59Z"
}
```

### Field Definitions

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | Unique notification identifier |
| title | string | Yes | Short notification title |
| message | string | Yes | Full notification message |
| category | string | Yes | Notification category |
| priority | string | Yes | Notification importance level |
| createdAt | string | Yes | ISO 8601 timestamp when created |
| updatedAt | string | Yes | ISO 8601 timestamp when last updated |
| isRead | boolean | Yes | Whether the notification has been read |
| expiresAt | string or null | No | ISO 8601 expiration timestamp |

### Supported Categories

```json
["Placement", "Event", "Result", "General"]
```

### Supported Priorities

```json
["Low", "Medium", "High", "Urgent"]
```

## 5. REST API Design

### 5.1 Create Notification

#### Endpoint URL

```http
POST /api/v1/notifications
```

#### HTTP Method

```http
POST
```

#### Purpose

Creates a new notification.

#### Headers

```http
Content-Type: application/json
Accept: application/json
```

#### Request JSON

```json
{
  "title": "Placement Drive - ABC Technologies",
  "message": "ABC Technologies will conduct a placement drive on Friday at 10:00 AM.",
  "category": "Placement",
  "priority": "High",
  "expiresAt": "2026-06-24T23:59:59Z"
}
```

#### Success Response JSON

```json
{
  "success": true,
  "data": {
    "id": "noti_01HYX7K9P4Q8R2M6A5B3C1D0EF",
    "title": "Placement Drive - ABC Technologies",
    "message": "ABC Technologies will conduct a placement drive on Friday at 10:00 AM.",
    "category": "Placement",
    "priority": "High",
    "createdAt": "2026-06-17T09:30:00Z",
    "updatedAt": "2026-06-17T09:30:00Z",
    "isRead": false,
    "expiresAt": "2026-06-24T23:59:59Z"
  }
}
```

#### Error Response JSON

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more request fields are invalid.",
    "details": [
      {
        "field": "category",
        "message": "Category must be one of Placement, Event, Result, General."
      }
    ]
  }
}
```

#### HTTP Status Codes

| Status Code | Meaning |
| --- | --- |
| 201 Created | Notification created |
| 400 Bad Request | Invalid request body |
| 500 Internal Server Error | Unexpected server error |

### 5.2 List Notifications

#### Endpoint URL

```http
GET /api/v1/notifications
```

#### HTTP Method

```http
GET
```

#### Purpose

Returns a paginated list of notifications. This endpoint also supports category filtering through query parameters.

#### Headers

```http
Accept: application/json
```

#### Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| page | integer | No | Page number, default `1` |
| limit | integer | No | Items per page, default `20`, max `100` |
| category | string | No | Filter by category |
| isRead | boolean | No | Filter by read status |
| priority | string | No | Filter by priority |
| sort | string | No | Sort field, default `createdAt` |
| order | string | No | `asc` or `desc`, default `desc` |

#### Request JSON

No request body.

#### Success Response JSON

```json
{
  "success": true,
  "data": [
    {
      "id": "noti_01HYX7K9P4Q8R2M6A5B3C1D0EF",
      "title": "Placement Drive - ABC Technologies",
      "message": "ABC Technologies will conduct a placement drive on Friday at 10:00 AM.",
      "category": "Placement",
      "priority": "High",
      "createdAt": "2026-06-17T09:30:00Z",
      "updatedAt": "2026-06-17T09:30:00Z",
      "isRead": false,
      "expiresAt": "2026-06-24T23:59:59Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

#### Error Response JSON

```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "Invalid query parameter value.",
    "details": [
      {
        "field": "limit",
        "message": "Limit must be between 1 and 100."
      }
    ]
  }
}
```

#### HTTP Status Codes

| Status Code | Meaning |
| --- | --- |
| 200 OK | Notifications returned |
| 400 Bad Request | Invalid query parameter |
| 500 Internal Server Error | Unexpected server error |

### 5.3 Get Notification By ID

#### Endpoint URL

```http
GET /api/v1/notifications/{notificationId}
```

#### HTTP Method

```http
GET
```

#### Purpose

Returns a single notification by ID.

#### Headers

```http
Accept: application/json
```

#### Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| notificationId | string | Yes | Unique notification identifier |

#### Request JSON

No request body.

#### Success Response JSON

```json
{
  "success": true,
  "data": {
    "id": "noti_01HYX7K9P4Q8R2M6A5B3C1D0EF",
    "title": "Placement Drive - ABC Technologies",
    "message": "ABC Technologies will conduct a placement drive on Friday at 10:00 AM.",
    "category": "Placement",
    "priority": "High",
    "createdAt": "2026-06-17T09:30:00Z",
    "updatedAt": "2026-06-17T09:30:00Z",
    "isRead": false,
    "expiresAt": "2026-06-24T23:59:59Z"
  }
}
```

#### Error Response JSON

```json
{
  "success": false,
  "error": {
    "code": "NOTIFICATION_NOT_FOUND",
    "message": "Notification was not found.",
    "details": []
  }
}
```

#### HTTP Status Codes

| Status Code | Meaning |
| --- | --- |
| 200 OK | Notification returned |
| 404 Not Found | Notification does not exist |
| 500 Internal Server Error | Unexpected server error |

### 5.4 Mark Notification As Read

#### Endpoint URL

```http
PATCH /api/v1/notifications/{notificationId}/read
```

#### HTTP Method

```http
PATCH
```

#### Purpose

Marks a specific notification as read.

#### Headers

```http
Content-Type: application/json
Accept: application/json
```

#### Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| notificationId | string | Yes | Unique notification identifier |

#### Request JSON

```json
{
  "isRead": true
}
```

#### Success Response JSON

```json
{
  "success": true,
  "data": {
    "id": "noti_01HYX7K9P4Q8R2M6A5B3C1D0EF",
    "title": "Placement Drive - ABC Technologies",
    "message": "ABC Technologies will conduct a placement drive on Friday at 10:00 AM.",
    "category": "Placement",
    "priority": "High",
    "createdAt": "2026-06-17T09:30:00Z",
    "updatedAt": "2026-06-17T10:15:00Z",
    "isRead": true,
    "expiresAt": "2026-06-24T23:59:59Z"
  }
}
```

#### Error Response JSON

```json
{
  "success": false,
  "error": {
    "code": "NOTIFICATION_NOT_FOUND",
    "message": "Notification was not found.",
    "details": []
  }
}
```

#### HTTP Status Codes

| Status Code | Meaning |
| --- | --- |
| 200 OK | Notification marked as read |
| 400 Bad Request | Invalid request body |
| 404 Not Found | Notification does not exist |
| 500 Internal Server Error | Unexpected server error |

### 5.5 Mark All Notifications As Read

#### Endpoint URL

```http
PATCH /api/v1/notifications/read-all
```

#### HTTP Method

```http
PATCH
```

#### Purpose

Marks all unread notifications as read.

#### Headers

```http
Accept: application/json
```

#### Request JSON

No request body.

#### Success Response JSON

```json
{
  "success": true,
  "data": {
    "updatedCount": 12,
    "updatedAt": "2026-06-17T10:20:00Z"
  }
}
```

#### Error Response JSON

```json
{
  "success": false,
  "error": {
    "code": "READ_ALL_FAILED",
    "message": "Unable to mark notifications as read.",
    "details": []
  }
}
```

#### HTTP Status Codes

| Status Code | Meaning |
| --- | --- |
| 200 OK | Notifications marked as read |
| 500 Internal Server Error | Unexpected server error |

### 5.6 Delete Notification

#### Endpoint URL

```http
DELETE /api/v1/notifications/{notificationId}
```

#### HTTP Method

```http
DELETE
```

#### Purpose

Deletes a notification by ID.

#### Headers

```http
Accept: application/json
```

#### Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| notificationId | string | Yes | Unique notification identifier |

#### Request JSON

No request body.

#### Success Response JSON

No response body.

#### Error Response JSON

```json
{
  "success": false,
  "error": {
    "code": "NOTIFICATION_NOT_FOUND",
    "message": "Notification was not found.",
    "details": []
  }
}
```

#### HTTP Status Codes

| Status Code | Meaning |
| --- | --- |
| 204 No Content | Notification deleted |
| 404 Not Found | Notification does not exist |
| 500 Internal Server Error | Unexpected server error |

### 5.7 Filter Notifications By Category

#### Endpoint URL

```http
GET /api/v1/notifications?category=Placement
```

#### HTTP Method

```http
GET
```

#### Purpose

Returns notifications that match a specific category. This uses the list endpoint with a `category` query parameter to keep REST naming predictable.

#### Headers

```http
Accept: application/json
```

#### Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| category | string | Yes | One of `Placement`, `Event`, `Result`, `General` |
| page | integer | No | Page number, default `1` |
| limit | integer | No | Items per page, default `20`, max `100` |

#### Request JSON

No request body.

#### Success Response JSON

```json
{
  "success": true,
  "data": [
    {
      "id": "noti_01HYX7K9P4Q8R2M6A5B3C1D0EF",
      "title": "Placement Drive - ABC Technologies",
      "message": "ABC Technologies will conduct a placement drive on Friday at 10:00 AM.",
      "category": "Placement",
      "priority": "High",
      "createdAt": "2026-06-17T09:30:00Z",
      "updatedAt": "2026-06-17T09:30:00Z",
      "isRead": false,
      "expiresAt": "2026-06-24T23:59:59Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

#### Error Response JSON

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CATEGORY",
    "message": "Category must be one of Placement, Event, Result, General.",
    "details": [
      {
        "field": "category",
        "message": "Unsupported category value."
      }
    ]
  }
}
```

#### HTTP Status Codes

| Status Code | Meaning |
| --- | --- |
| 200 OK | Filtered notifications returned |
| 400 Bad Request | Invalid category |
| 500 Internal Server Error | Unexpected server error |

### 5.8 Get Unread Notification Count

#### Endpoint URL

```http
GET /api/v1/notifications/unread-count
```

#### HTTP Method

```http
GET
```

#### Purpose

Returns the count of unread notifications.

#### Headers

```http
Accept: application/json
```

#### Request JSON

No request body.

#### Success Response JSON

```json
{
  "success": true,
  "data": {
    "unreadCount": 12
  }
}
```

#### Error Response JSON

```json
{
  "success": false,
  "error": {
    "code": "UNREAD_COUNT_FAILED",
    "message": "Unable to retrieve unread notification count.",
    "details": []
  }
}
```

#### HTTP Status Codes

| Status Code | Meaning |
| --- | --- |
| 200 OK | Unread count returned |
| 500 Internal Server Error | Unexpected server error |

## 6. Real-Time Notification Design

The platform uses WebSockets to push notification changes to connected clients in real time. This allows students to receive newly created notifications, updates, and deletions without repeatedly polling the REST API.

### Connection Endpoint

```text
wss://api.campus.example.com/api/v1/notifications/ws
```

For local development:

```text
ws://localhost:8080/api/v1/notifications/ws
```

### Connection Lifecycle

1. Client opens a WebSocket connection to the notification WebSocket endpoint.
2. Server accepts the connection because users are pre-authorized.
3. Server sends a `connection.ready` event after successful connection setup.
4. Server pushes notification events when notifications are created, updated, or deleted.
5. Client may send a `ping` event periodically to keep the connection alive.
6. Server responds with a `pong` event.
7. If the connection drops, the client reconnects using exponential backoff.
8. On reconnect, the client should call `GET /api/v1/notifications` to sync any missed notifications.

### Server-to-Client Event Envelope

```json
{
  "event": "notification.created",
  "eventId": "evt_01HYX8JV4QH3J9Z3R0Q7F7S1AB",
  "occurredAt": "2026-06-17T09:30:00Z",
  "data": {}
}
```

### Event Types

| Event Type | Direction | Purpose |
| --- | --- | --- |
| connection.ready | Server to client | Confirms WebSocket connection is ready |
| notification.created | Server to client | A notification was created |
| notification.updated | Server to client | A notification was updated |
| notification.deleted | Server to client | A notification was deleted |
| ping | Client to server | Client keepalive |
| pong | Server to client | Server keepalive response |

### Sample Event Payloads

#### connection.ready

```json
{
  "event": "connection.ready",
  "eventId": "evt_01HYX8H1X58ADQABZT9F68V2T9",
  "occurredAt": "2026-06-17T09:29:58Z",
  "data": {
    "message": "Connected to campus notification stream."
  }
}
```

#### notification.created

```json
{
  "event": "notification.created",
  "eventId": "evt_01HYX8JV4QH3J9Z3R0Q7F7S1AB",
  "occurredAt": "2026-06-17T09:30:00Z",
  "data": {
    "notification": {
      "id": "noti_01HYX7K9P4Q8R2M6A5B3C1D0EF",
      "title": "Placement Drive - ABC Technologies",
      "message": "ABC Technologies will conduct a placement drive on Friday at 10:00 AM.",
      "category": "Placement",
      "priority": "High",
      "createdAt": "2026-06-17T09:30:00Z",
      "updatedAt": "2026-06-17T09:30:00Z",
      "isRead": false,
      "expiresAt": "2026-06-24T23:59:59Z"
    }
  }
}
```

#### notification.updated

```json
{
  "event": "notification.updated",
  "eventId": "evt_01HYX8KWYAXRQ7D2V3K9H8P6DR",
  "occurredAt": "2026-06-17T10:15:00Z",
  "data": {
    "notification": {
      "id": "noti_01HYX7K9P4Q8R2M6A5B3C1D0EF",
      "title": "Placement Drive - ABC Technologies",
      "message": "ABC Technologies will conduct a placement drive on Friday at 10:00 AM in Seminar Hall 2.",
      "category": "Placement",
      "priority": "High",
      "createdAt": "2026-06-17T09:30:00Z",
      "updatedAt": "2026-06-17T10:15:00Z",
      "isRead": false,
      "expiresAt": "2026-06-24T23:59:59Z"
    },
    "changedFields": ["message", "updatedAt"]
  }
}
```

#### notification.deleted

```json
{
  "event": "notification.deleted",
  "eventId": "evt_01HYX8M5GKJ92CBE61H92JWXTR",
  "occurredAt": "2026-06-17T11:00:00Z",
  "data": {
    "notificationId": "noti_01HYX7K9P4Q8R2M6A5B3C1D0EF",
    "deletedAt": "2026-06-17T11:00:00Z"
  }
}
```

#### Client Ping

```json
{
  "event": "ping",
  "eventId": "evt_01HYX8N77FP3KDTYZQY7A32RQP",
  "occurredAt": "2026-06-17T11:05:00Z",
  "data": {}
}
```

#### Server Pong

```json
{
  "event": "pong",
  "eventId": "evt_01HYX8N79M6KGN9XX6J5WQ4G85",
  "occurredAt": "2026-06-17T11:05:00Z",
  "data": {}
}
```

## 7. Scalability Considerations

### API Layer

- Keep REST APIs stateless so multiple API instances can run behind a load balancer.
- Use horizontal scaling for API servers during peak campus activity, such as result announcements or placement deadlines.
- Apply request validation at the API boundary to reject invalid payloads early.
- Use pagination for list endpoints to avoid returning large notification datasets in one response.
- Add rate limiting to protect the platform from accidental client-side request loops.

### Data Storage

- Store notifications in a durable database with indexes on `id`, `category`, `isRead`, `priority`, `createdAt`, and `expiresAt`.
- Use a TTL cleanup job or scheduled worker to archive or remove expired notifications.
- Consider soft deletion if audit history is required.
- Use database transactions for operations that update multiple notifications, such as marking all as read.

### Real-Time Delivery

- Use a message broker such as Redis Pub/Sub, RabbitMQ, Kafka, or cloud-managed pub/sub to fan out notification events across WebSocket servers.
- Keep WebSocket servers horizontally scalable by avoiding local-only state for notification events.
- Use heartbeat messages to detect stale WebSocket connections.
- Use reconnect and REST resync behavior on the client to recover missed events.

### Caching

- Cache frequently requested data such as unread counts when read/write volume is high.
- Invalidate or update cache entries when notifications are created, marked as read, or deleted.
- Avoid caching stale unread counts for too long because the value is user-facing and changes frequently.

### Observability

- Track request latency, error rates, WebSocket connection counts, event delivery failures, and database query performance.
- Use structured logs with request IDs and event IDs.
- Add alerts for elevated 5xx errors, broker failures, or abnormal WebSocket disconnect rates.

### Reliability

- Generate globally unique IDs for notifications and events.
- Make event publishing idempotent where possible.
- Store notification changes before publishing WebSocket events so REST sync can recover missed real-time messages.
- Use graceful shutdown for WebSocket servers to avoid abruptly dropping active connections.

## 8. Assumptions

- Users are pre-authorized, so no authentication or authorization flow is included.
- All students can access the same notification feed unless future requirements introduce department, batch, role, or user-specific targeting.
- Notification read status is modeled as part of the notification object for this assignment. In a multi-user production system, read status should usually be stored per user.
- The platform supports four categories: `Placement`, `Event`, `Result`, and `General`.
- The platform supports four priority values: `Low`, `Medium`, `High`, and `Urgent`.
- Expired notifications are not deleted immediately unless a cleanup job or retention policy is configured.
- Timestamps use UTC and ISO 8601 format.
- WebSocket clients are responsible for reconnecting and using the REST API to resync after disconnection.
- The API uses JSON only and does not support XML or form-encoded payloads.
