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
