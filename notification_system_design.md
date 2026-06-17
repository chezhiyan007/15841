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

# Stage 2

## 1. Database Selection

PostgreSQL is recommended as the primary persistent storage for the Campus Notification Platform.

### Why PostgreSQL

#### Relational Nature of Notification Data

Notification data has clear relational behavior:

- A notification has structured attributes such as title, message, category, priority, and timestamps.
- A notification can be read by many users.
- A user can read many notifications.
- Read tracking is best represented as a separate relational table with foreign key constraints.

This makes PostgreSQL a natural fit because it can model notifications and read receipts using normalized tables and well-defined relationships.

#### ACID Guarantees

PostgreSQL provides ACID guarantees, which are important for correctness in operations such as:

- Creating a notification and making it immediately available for reads.
- Marking a notification as read exactly once per user.
- Marking all notifications as read in a consistent transaction.
- Deleting or expiring notifications without leaving invalid read-tracking records.

These guarantees reduce the risk of inconsistent notification state.

#### Query Flexibility

The Stage 1 APIs require flexible querying by:

- Category
- Read or unread status
- Created date
- Expiration date
- Priority
- Pagination order

PostgreSQL supports these access patterns with expressive SQL, joins, filtering, aggregation, and ordering.

#### Indexing Support

PostgreSQL provides strong indexing options, including:

- B-tree indexes for category, timestamps, user IDs, and foreign keys.
- Composite indexes for common query patterns.
- Partial indexes for targeted optimization.
- Index-only scans where query shape allows it.

These indexing features directly support fast filtering, pagination, unread count retrieval, and read-state lookup.

#### Scalability Options

PostgreSQL can scale through:

- Vertical scaling
- Read replicas
- Connection pooling
- Table partitioning
- Archival tables
- Caching with Redis
- Managed cloud PostgreSQL services with automated backups and failover

For a campus notification workload, PostgreSQL provides a strong balance of consistency, query power, and operational maturity.

### Why MongoDB Was Not Chosen as the Primary Database

MongoDB is useful for flexible document storage, but it is not the primary choice for this design because notification read tracking is relational and can grow independently from notification content. Embedding read status inside notification documents would become inefficient as the number of users grows. MongoDB can support references, but PostgreSQL provides stronger relational constraints, transaction semantics, and SQL query flexibility for the required API patterns.

MongoDB could still be considered for secondary use cases such as storing flexible notification templates or analytics events, but PostgreSQL is the better primary database for this platform.

## 2. Database Schema

The schema separates notification content from user read tracking. This keeps notification records compact and allows read status to scale independently.

### notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('Placement', 'Event', 'Result', 'General')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NULL
);
```

### notification_reads

```sql
CREATE TABLE notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_notification_reads_notification_user UNIQUE (notification_id, user_id)
);
```

### Notes

- `gen_random_uuid()` requires the `pgcrypto` extension.
- `user_id` is stored as `VARCHAR(100)` because authentication is out of scope, but clients still need a stable pre-authorized user identifier for read tracking.
- `ON DELETE CASCADE` removes related read records when a notification is deleted.
- The unique constraint prevents duplicate read records for the same notification and user.

## 3. Relationships

One notification can be read by many users.

This relationship is represented by the `notification_reads` table:

- `notifications.id` is the parent notification identifier.
- `notification_reads.notification_id` references the notification.
- `notification_reads.user_id` identifies the user who read the notification.
- `notification_reads.read_at` stores when the notification was read by that user.

This creates a one-to-many relationship from `notifications` to `notification_reads`. It also supports a many-to-many logical relationship between users and notifications, where each user may read many notifications and each notification may be read by many users.

## 4. Indexing Strategy

### Index Statements

```sql
CREATE INDEX idx_notifications_category
ON notifications (category);

CREATE INDEX idx_notifications_created_at
ON notifications (created_at DESC);

CREATE INDEX idx_notifications_expires_at
ON notifications (expires_at);

CREATE INDEX idx_notification_reads_notification_id
ON notification_reads (notification_id);

CREATE INDEX idx_notification_reads_user_id
ON notification_reads (user_id);

CREATE INDEX idx_notification_reads_user_notification
ON notification_reads (user_id, notification_id);

CREATE INDEX idx_notifications_expires_created_at
ON notifications (expires_at, created_at DESC);
```

### Benefits

- `idx_notifications_category` improves category filtering for Placement, Event, Result, and General notifications.
- `idx_notifications_created_at` improves newest-first notification listing and pagination.
- `idx_notifications_expires_at` improves expiration cleanup jobs and active notification filtering.
- `idx_notification_reads_notification_id` improves joins from notifications to read records.
- `idx_notification_reads_user_id` improves user-specific read-history lookup.
- `idx_notification_reads_user_notification` improves unread lookup by quickly checking whether a user has read a notification.
- `idx_notifications_expires_created_at` improves active-notification filtering and ordering by combining expiration and creation timestamps.

### Unread Lookup Optimization

Unread notifications are found by selecting notifications that do not have a matching read record for the current user. The composite index on `(user_id, notification_id)` makes this anti-join efficient.

```sql
SELECT n.*
FROM notifications n
LEFT JOIN notification_reads nr
  ON nr.notification_id = n.id
 AND nr.user_id = $1
WHERE nr.id IS NULL
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY n.created_at DESC;
```

## 5. Data Growth Challenges

### Large Notification Volume

Over time, the `notifications` table can grow significantly due to placement announcements, event reminders, result updates, and general campus messages. Large tables can increase index size and slow down queries if old records are not archived or partitioned.

### Read Tracking Explosion

Read tracking can grow much faster than notifications. If there are 20,000 users and 10,000 notifications, the potential read-tracking volume can reach hundreds of millions of rows. This makes the `notification_reads` table the primary growth concern.

### Slow Filtering

Filtering by category, priority, active status, and read status may slow down as data grows. Without proper indexes, the database may need to scan large portions of the table.

### Slow Pagination

Offset-based pagination can become slow for deep pages because the database must scan and discard skipped rows. This becomes more expensive as notification history grows.

### Storage Costs

Notification text, indexes, read receipts, backups, and replicas all contribute to storage costs. Read receipts are especially expensive because they grow with both notification count and user count.

## 6. Scalability Solutions

### Indexing

Create indexes that match the API query patterns, especially category filtering, created-time ordering, expiration cleanup, and user-specific read lookup.

### Pagination

Use limit-based pagination for simple API access. For large datasets, prefer cursor-based pagination using `created_at` and `id` as the cursor.

Example cursor condition:

```sql
WHERE (n.created_at, n.id) < ($1, $2)
ORDER BY n.created_at DESC, n.id DESC
LIMIT $3;
```

### Table Partitioning

Partition large tables by time, such as monthly or quarterly partitions on `created_at`. This is especially useful for:

- Archiving old notifications
- Deleting expired notification ranges
- Improving query performance on recent notifications
- Reducing index size per partition

The `notification_reads` table can also be partitioned by hash on `user_id` or by time through the related notification lifecycle.

### Archival Strategy

Move old or expired notifications to archival tables or object storage. Keep only active and recently expired notifications in the primary operational tables.

Archival candidates:

- Notifications expired more than 90 days ago
- Read records for archived notifications
- Low-priority historical announcements

### Read Replicas

Use PostgreSQL read replicas for read-heavy endpoints such as:

- List notifications
- Filter by category
- Get notification by ID
- Get unread count

Write operations should continue to use the primary database.

### Caching

Use Redis to cache frequently accessed data:

- Unread counts per user
- Recent notifications
- Category-filtered recent notification lists

Cache entries should be invalidated or updated when notifications are created, deleted, expired, or marked as read.

### Database Connection Pooling

Use a connection pooler such as PgBouncer or application-level pooling to avoid exhausting PostgreSQL connections during high-traffic periods.

Connection pooling is especially important when:

- Many API instances are running.
- WebSocket servers also access the database.
- Campus-wide announcements trigger request spikes.

## 7. SQL Queries Supporting Stage 1 APIs

The following queries use PostgreSQL syntax and assume the API receives a stable `user_id` for read-status operations.

### Create Notification

```sql
INSERT INTO notifications (
  title,
  message,
  category,
  priority,
  expires_at
)
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5
)
RETURNING
  id,
  title,
  message,
  category,
  priority,
  created_at,
  updated_at,
  expires_at;
```

### Get Notification By ID

```sql
SELECT
  n.id,
  n.title,
  n.message,
  n.category,
  n.priority,
  n.created_at,
  n.updated_at,
  n.expires_at,
  CASE WHEN nr.id IS NULL THEN false ELSE true END AS is_read
FROM notifications n
LEFT JOIN notification_reads nr
  ON nr.notification_id = n.id
 AND nr.user_id = $2
WHERE n.id = $1;
```

### Get Notifications List

```sql
SELECT
  n.id,
  n.title,
  n.message,
  n.category,
  n.priority,
  n.created_at,
  n.updated_at,
  n.expires_at,
  CASE WHEN nr.id IS NULL THEN false ELSE true END AS is_read
FROM notifications n
LEFT JOIN notification_reads nr
  ON nr.notification_id = n.id
 AND nr.user_id = $1
WHERE (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY n.created_at DESC, n.id DESC
LIMIT $2
OFFSET $3;
```

### Filter By Category

```sql
SELECT
  n.id,
  n.title,
  n.message,
  n.category,
  n.priority,
  n.created_at,
  n.updated_at,
  n.expires_at,
  CASE WHEN nr.id IS NULL THEN false ELSE true END AS is_read
FROM notifications n
LEFT JOIN notification_reads nr
  ON nr.notification_id = n.id
 AND nr.user_id = $1
WHERE n.category = $2
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY n.created_at DESC, n.id DESC
LIMIT $3
OFFSET $4;
```

### Mark Notification Read

```sql
INSERT INTO notification_reads (
  notification_id,
  user_id,
  read_at
)
VALUES (
  $1,
  $2,
  NOW()
)
ON CONFLICT (notification_id, user_id)
DO UPDATE SET read_at = EXCLUDED.read_at
RETURNING
  id,
  notification_id,
  user_id,
  read_at;
```

### Mark All Notifications Read

```sql
INSERT INTO notification_reads (
  notification_id,
  user_id,
  read_at
)
SELECT
  n.id,
  $1,
  NOW()
FROM notifications n
LEFT JOIN notification_reads nr
  ON nr.notification_id = n.id
 AND nr.user_id = $1
WHERE nr.id IS NULL
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
ON CONFLICT (notification_id, user_id)
DO NOTHING;
```

To return the number of notifications marked as read:

```sql
WITH inserted_reads AS (
  INSERT INTO notification_reads (
    notification_id,
    user_id,
    read_at
  )
  SELECT
    n.id,
    $1,
    NOW()
  FROM notifications n
  LEFT JOIN notification_reads nr
    ON nr.notification_id = n.id
   AND nr.user_id = $1
  WHERE nr.id IS NULL
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
  ON CONFLICT (notification_id, user_id)
  DO NOTHING
  RETURNING id
)
SELECT COUNT(*) AS updated_count
FROM inserted_reads;
```

### Get Unread Count

```sql
SELECT COUNT(*) AS unread_count
FROM notifications n
LEFT JOIN notification_reads nr
  ON nr.notification_id = n.id
 AND nr.user_id = $1
WHERE nr.id IS NULL
  AND (n.expires_at IS NULL OR n.expires_at > NOW());
```

### Delete Notification

```sql
DELETE FROM notifications
WHERE id = $1;
```

To confirm the deleted notification ID:

```sql
DELETE FROM notifications
WHERE id = $1
RETURNING id;
```

## 8. Future Enhancements

### Redis Caching

Redis can cache unread counts, recent notification lists, and category-filtered views. It can also support lightweight pub/sub for smaller real-time deployments.

### Kafka Event Streaming

Kafka can provide durable event streaming for notification lifecycle events such as:

- `notification.created`
- `notification.updated`
- `notification.deleted`
- `notification.read`

This improves reliability for downstream consumers such as analytics, audit logging, email delivery, push notifications, and WebSocket fan-out services.

### Multi-Region Deployment

For institutions with distributed campuses or strict availability requirements, the platform can evolve toward multi-region deployment using:

- Regional read replicas
- Global load balancing
- Region-aware caching
- Disaster recovery replication
- Clearly defined primary write region

### Search Indexing

Use a search engine such as OpenSearch, Elasticsearch, or PostgreSQL full-text search for advanced notification discovery.

Search indexing can support:

- Keyword search across title and message
- Category and priority facets
- Date-range filtering
- Relevance ranking
- Analytics on common search terms

# Stage 3

## 1. Query Review

### Query Under Review

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

### Accuracy Against the Stage 2 Schema

This query is not accurate for the schema designed in Stage 2.

The Stage 2 schema uses:

- `notifications` for notification content.
- `notification_reads` for per-user read tracking.
- Snake case column names such as `created_at`, not camel case names such as `createdAt`.
- `user_id`, not `studentID`.

In the Stage 2 design, `isRead` is not stored directly in the `notifications` table because read status is user-specific. A notification may be unread for one student and read for another student at the same time.

### Why Storing Read State Directly in Notifications Is Problematic

Storing `student_id` and `is_read` directly in the `notifications` table creates major scalability and data modeling problems:

- It mixes global notification content with user-specific state.
- It requires duplicating the same notification for every student.
- With 50,000 students and 5,000,000 notifications, duplication can create extremely large storage and indexing overhead.
- Updating read status causes writes against notification rows instead of a compact read-tracking table.
- The same notification can no longer be represented as one canonical record shared across students.

For example, a single placement notification sent to 50,000 students should be stored once in `notifications`, not copied 50,000 times.

### Why notification_reads Is Preferred

The `notification_reads` table is preferred because it normalizes read tracking:

- One notification is stored once.
- A read record is created only when a student reads the notification.
- Unread state can be inferred by the absence of a read record.
- Read tracking scales independently from notification content.
- The database can enforce uniqueness with `(notification_id, user_id)`.

A normalized unread query should look like this:

```sql
SELECT
  n.id,
  n.title,
  n.message,
  n.category,
  n.priority,
  n.created_at,
  n.updated_at,
  n.expires_at
FROM notifications n
LEFT JOIN notification_reads nr
  ON nr.notification_id = n.id
 AND nr.user_id = '1042'
WHERE nr.id IS NULL
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY n.created_at ASC
LIMIT 50;
```

## 2. Why the Query Is Slow

The reviewed query can become slow with 50,000 students and 5,000,000 notifications.

### Full Table Scans

If there is no useful index on `studentID`, `isRead`, and `createdAt`, PostgreSQL must scan a large number of rows to find matching unread notifications.

### Large Dataset Size

At 5,000,000 notifications, scanning the table repeatedly is expensive. If the table stores one row per student notification, the effective row count can grow much larger than 5,000,000.

### Filtering on Multiple Columns

The query filters by:

- `studentID`
- `isRead`

If these columns are not indexed together, the database may still need to inspect many rows after using a single-column index.

### Sorting Overhead

The query sorts by `createdAt ASC`. Without an index that already matches the filter and sort order, PostgreSQL must sort the filtered result set separately.

### SELECT * Inefficiency

`SELECT *` retrieves every column, even when the client only needs a subset. This increases:

- Disk I/O
- Memory usage
- Network transfer size
- Query execution time

### Complexity Estimate

Without indexes, the query can be estimated as:

```text
O(N log N)
```

This is because the database may need to scan `N` rows for filtering and then sort the matching rows.

## 3. Recommended Improvements

### Composite Index

For a denormalized table that stores `student_id`, `is_read`, and `created_at` directly in `notifications`, the following composite index would help:

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications(student_id, is_read, created_at);
```

This index allows the database to:

- Quickly locate notifications for one student.
- Narrow results to unread notifications.
- Return rows in `created_at` order with less sorting overhead.

However, this index applies to a denormalized schema. In the normalized Stage 2 schema, the preferred indexes are on `notification_reads(user_id, notification_id)` and `notifications(created_at)`.

### Pagination

Always paginate notification lists.

```sql
LIMIT 50 OFFSET 0;
```

For large datasets, cursor-based pagination is preferred:

```sql
WHERE (n.created_at, n.id) > ($1, $2)
ORDER BY n.created_at ASC, n.id ASC
LIMIT 50;
```

### Select Required Columns Only

Avoid `SELECT *`. Return only the fields needed by the API response.

```sql
SELECT
  id,
  title,
  category,
  priority,
  created_at
FROM notifications;
```

### Proper Normalization

Use separate tables for notification content and read tracking:

- `notifications`
- `notification_reads`

This avoids duplicating notification content for every student and keeps read updates isolated to the read-tracking table.

## 4. Cost Analysis

### Without Index

Without an index, the database may need to scan the full table.

```text
O(N)
```

If sorting is also required after filtering, the total cost can approach:

```text
O(N log N)
```

This is expensive for 5,000,000 notifications and becomes worse as the table grows.

### With Composite Index

With a composite index such as:

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications(student_id, is_read, created_at);
```

The lookup cost is closer to:

```text
O(log N)
```

The database can use the index tree to jump directly to rows matching the student and read status, then scan the matching range in creation-time order.

### Expected Improvements

Expected improvements include:

- Lower query latency.
- Less sorting work.
- Fewer scanned rows.
- Lower CPU usage.
- Lower memory usage.
- Better performance during peak notification traffic.

## 5. Should We Index Every Column?

No. Every column should not be indexed.

Indexes improve read performance for specific query patterns, but they also introduce costs.

### Increased Write Cost

Every insert, update, or delete must also update related indexes. More indexes mean slower writes.

### Storage Overhead

Indexes consume disk space. On large tables, index storage can become significant.

### Slower Inserts and Updates

When a notification is created or read status changes, PostgreSQL must maintain each affected index. Too many indexes can slow down write-heavy operations.

### Index Maintenance Cost

Indexes require vacuuming, analysis, memory, and operational monitoring. Unused indexes add maintenance overhead without improving application performance.

Indexes should be added only for columns frequently used in:

- Filtering
- Joins
- Sorting
- Grouping
- Uniqueness checks

## 6. Recommended Index Strategy

The following examples are useful for a denormalized notification table that contains student-specific notification rows.

### Notification Type Index

```sql
CREATE INDEX idx_notification_type
ON notifications(notification_type);
```

Purpose:

- Improves filtering by notification type, such as Placement, Event, Result, or General.
- Supports category-specific screens and reports.

### Created At Index

```sql
CREATE INDEX idx_created_at
ON notifications(created_at);
```

Purpose:

- Improves chronological ordering.
- Supports recent notification lookup.
- Helps range queries such as notifications created in the last 7 days.

### Student Read Created Composite Index

```sql
CREATE INDEX idx_student_read_created
ON notifications(student_id, is_read, created_at);
```

Purpose:

- Improves unread notification lookup for a specific student.
- Supports ordering by creation time.
- Reduces filtering and sorting work for student notification feeds.

### Normalized Schema Index Recommendation

For the Stage 2 normalized schema, prefer these indexes:

```sql
CREATE INDEX idx_notifications_category_created
ON notifications(category, created_at DESC);

CREATE INDEX idx_notifications_created_at_id
ON notifications(created_at DESC, id DESC);

CREATE INDEX idx_notification_reads_user_notification
ON notification_reads(user_id, notification_id);

CREATE INDEX idx_notification_reads_notification_user
ON notification_reads(notification_id, user_id);
```

Purpose:

- `idx_notifications_category_created` supports category filtering with recent-first ordering.
- `idx_notifications_created_at_id` supports stable pagination.
- `idx_notification_reads_user_notification` supports unread lookup for a user.
- `idx_notification_reads_notification_user` supports joins and read-status checks by notification.

## 7. Query to Find Students Who Received Placement Notifications in Last 7 Days

For a denormalized table where `notifications` contains `student_id` and `notification_type`:

```sql
SELECT DISTINCT student_id
FROM notifications
WHERE notification_type = 'Placement'
  AND created_at >= NOW() - INTERVAL '7 days';
```

This query returns the unique students who received Placement notifications during the last 7 days.

It works by:

- Filtering notifications to `notification_type = 'Placement'`.
- Restricting results to notifications created in the last 7 days.
- Using `DISTINCT` to return each student only once.

For the Stage 2 normalized schema, where notifications are shared globally and user targeting is not yet modeled, this query requires a separate delivery or targeting table. A future schema could include `notification_recipients`:

```sql
SELECT DISTINCT nr.user_id AS student_id
FROM notification_recipients nr
JOIN notifications n
  ON n.id = nr.notification_id
WHERE n.category = 'Placement'
  AND n.created_at >= NOW() - INTERVAL '7 days';
```

## 8. Final Recommendation

For a system with 50,000 students and 5,000,000 notifications:

- Normalize read tracking using `notification_reads`.
- Avoid storing `is_read` directly on global notification records.
- Use targeted indexes based on real query patterns.
- Do not index every column.
- Use pagination for all list endpoints.
- Prefer cursor-based pagination for large datasets.
- Select only required columns instead of using `SELECT *`.
- Monitor query plans with `EXPLAIN ANALYZE`.
- Review slow query logs regularly and adjust indexes based on observed workload.

# Stage 4

## Problem Statement

Currently, notifications are fetched from the database on every page load for every student.

This causes:

- Excessive database load
- Increased response times
- Poor user experience
- Reduced scalability

For a platform serving 50,000 students and millions of notifications, direct database reads on every page load can quickly become a bottleneck. The system needs a layered architecture that reduces repeated database access, limits payload size, supports real-time updates, and keeps historical data from slowing down active queries.

## Strategy 1: Redis Caching

Redis should be used to store frequently accessed notification data in memory.

Recommended cached data includes:

- Recent notification lists
- Category-filtered notification lists
- Unread notification counts
- Frequently accessed notification details

### Cache-Aside Pattern

The cache-aside pattern is recommended because it keeps the application in control of cache population and invalidation.

Flow:

1. Check Redis.
2. If cache hit, return data.
3. If cache miss, query database.
4. Store result in Redis.
5. Return data to the client.

Example cache keys:

```text
notifications:recent:page:1:limit:20
notifications:category:Placement:page:1:limit:20
notifications:unread-count:user:1042
notification:noti_01HYX7K9P4Q8R2M6A5B3C1D0EF
```

### Benefits

- Sub-millisecond access for cached data
- Reduced database traffic
- Lower response latency
- Better handling of traffic spikes
- Lower database CPU and I/O pressure

### Tradeoffs

- Additional infrastructure
- Cache invalidation complexity
- Potential stale data
- More operational monitoring
- Memory sizing and eviction policy decisions

### Invalidation Approach

Cache entries should be invalidated or refreshed when:

- A notification is created
- A notification is updated
- A notification is deleted
- A student marks a notification as read
- A student marks all notifications as read
- A notification expires

Unread count caches should be user-specific and should use short TTLs or event-based invalidation.

## Strategy 2: Real-Time Notifications via WebSockets

WebSockets should be used to push notification changes to connected clients instead of forcing clients to poll or reload all notifications on every page load.

When a new notification is created, the backend publishes a real-time event to connected clients. The frontend can update its local notification list immediately without making a full list request.

### Benefits

- Instant updates
- Fewer database requests
- Better user experience
- Reduced polling traffic
- Efficient delivery for urgent notifications

### Tradeoffs

- Persistent connections
- More server memory usage
- Reconnection handling required
- Load balancing needs sticky sessions or shared pub/sub coordination
- Delivery recovery still requires REST sync after reconnect

### Recommended Flow

1. Client loads the first page of notifications through the REST API.
2. Client opens a WebSocket connection.
3. Server pushes `notification.created`, `notification.updated`, and `notification.deleted` events.
4. Client updates local state from WebSocket events.
5. If the connection drops, the client reconnects.
6. After reconnecting, the client calls the REST API to resync missed notifications.

## Strategy 3: Pagination

The API should never load all notifications at once.

Use paginated requests:

```http
GET /api/v1/notifications?page=1&limit=20
```

For very large datasets, cursor-based pagination is preferred over deep offset pagination:

```http
GET /api/v1/notifications?limit=20&cursor=2026-06-17T09:30:00Z:noti_01HYX7K9P4Q8R2M6A5B3C1D0EF
```

### Benefits

- Smaller payloads
- Faster queries
- Lower memory consumption
- Better frontend rendering performance
- Lower network transfer

### Tradeoffs

- More API calls
- Slightly more frontend complexity
- Cursor-based pagination requires stable sorting
- Total count queries may become expensive at scale

### Recommendation

Use page-based pagination for simple lists and cursor-based pagination for large-scale production feeds.

## Strategy 4: Read Replicas

PostgreSQL read replicas should be used to scale notification retrieval.

The primary database handles writes:

- Create notification
- Mark notification as read
- Mark all notifications as read
- Delete notification

Read replicas handle read-heavy operations:

- List notifications
- Get notification by ID
- Filter notifications by category
- Get unread notification count

### Benefits

- Distributes load
- Improves read scalability
- Reduces pressure on the primary database
- Improves availability for read operations

### Tradeoffs

- Replication lag
- Additional infrastructure costs
- More operational complexity
- Read-after-write consistency needs careful handling

### Consistency Recommendation

For operations where immediate consistency matters, such as showing a notification as read immediately after a student marks it read, the API can temporarily read from the primary database or update the frontend state optimistically.

## Strategy 5: Database Partitioning

Partitioning can reduce the amount of data scanned by queries and make large tables easier to manage.

Notifications can be partitioned by:

- Creation date
- Student ID

### Partition by Creation Date

Time-based partitioning is recommended for the `notifications` table.

Examples:

- Monthly partitions
- Quarterly partitions
- Yearly partitions

This works well because notification queries usually focus on recent data and archival policies are time-based.

### Partition by Student ID

Student-based partitioning can be considered for high-volume user-specific tables such as read receipts or future recipient tables.

This can help distribute read-tracking records across partitions.

### Benefits

- Faster scans
- Better query performance
- Smaller indexes per partition
- Easier archival and deletion of old data
- Improved maintenance operations

### Tradeoffs

- More complex maintenance
- Harder migrations
- Partition key must match query patterns
- Poor partition design can reduce benefits
- Application and migration logic may become more complex

## Strategy 6: Archival Strategy

Old notifications should be moved out of active operational tables.

For example, notifications older than 1 year can be moved to archive tables:

```text
notifications_archive
notification_reads_archive
```

### Archival Flow

1. Identify notifications older than the retention threshold.
2. Copy old notifications and related read records to archive tables or cold storage.
3. Verify archived data integrity.
4. Delete archived records from active tables.
5. Vacuum and analyze active tables.

### Benefits

- Smaller active dataset
- Faster queries
- Lower active index size
- Reduced backup size for hot operational data
- Better database maintenance performance

### Tradeoffs

- Additional archive management
- Historical retrieval becomes more complex
- Archive search may require separate APIs
- Compliance and retention policies must be clearly defined

### Recommendation

Keep recent and active notifications in primary tables. Move old or expired notifications to archive storage through scheduled background jobs.

## Strategy 7: Efficient API Design

The API should be designed to minimize unnecessary database work and network transfer.

Recommended practices:

- Fetch only required fields.
- Avoid `SELECT *`.
- Support filtering.
- Use proper indexes.
- Use pagination on all list endpoints.
- Support category and read-status filters.
- Avoid expensive total counts on every request unless needed.

Example:

```sql
SELECT
  n.id,
  n.title,
  n.category,
  n.priority,
  n.created_at,
  CASE WHEN nr.id IS NULL THEN false ELSE true END AS is_read
FROM notifications n
LEFT JOIN notification_reads nr
  ON nr.notification_id = n.id
 AND nr.user_id = $1
WHERE (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY n.created_at DESC, n.id DESC
LIMIT $2;
```

### Benefits

- Lower network transfer
- Faster execution
- Lower memory usage
- Better cache efficiency
- More predictable API performance

### Tradeoffs

- More API design effort
- More endpoint-specific query design
- Frontend must request the correct shape of data
- Backend must maintain clear response contracts

## Recommended Architecture

The recommended architecture combines multiple strategies rather than relying on a single optimization.

### 1. PostgreSQL as Primary Database

PostgreSQL remains the primary source of truth for notifications and read tracking.

It provides:

- Strong consistency
- Relational modeling
- ACID transactions
- Mature indexing
- Read replica support
- Partitioning support

### 2. Redis for Caching

Redis should be used for high-frequency reads such as recent notification lists and unread counts.

This reduces repeated database reads and improves response times for common page loads.

### 3. WebSockets for Real-Time Delivery

WebSockets should push new and changed notifications to clients instantly.

This reduces polling and avoids unnecessary full notification reloads.

### 4. Pagination for Notification Listing

All notification list endpoints should use pagination.

Pagination keeps payloads small and prevents large memory usage in both the backend and frontend.

### 5. Read Replicas for Scaling Reads

Read replicas should serve read-heavy notification endpoints.

This protects the primary database so it can focus on writes and transactional correctness.

### 6. Archival for Historical Data

Old notifications and read records should be archived after a defined retention period.

This keeps active tables smaller, improves index performance, and reduces operational cost.

### Final Architecture Summary

This combination provides the best balance of performance, scalability, cost, and maintainability:

- PostgreSQL provides reliable persistent storage.
- Redis reduces repeated database reads.
- WebSockets deliver instant updates and reduce polling.
- Pagination limits payload and query size.
- Read replicas distribute read traffic.
- Partitioning improves large-table performance.
- Archival keeps the active dataset manageable.
- Efficient API design prevents unnecessary database and network work.

Together, these strategies allow the notification platform to support 50,000 students and millions of notifications while maintaining fast response times and predictable operational behavior.
