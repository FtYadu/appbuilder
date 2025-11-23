# API Contracts

This document outlines the API contracts for the Synapsy assistant.

## Endpoints

### `POST /v1/chat/:channel`

This endpoint is used for inbound webhooks, which are then normalized into a message envelope.

- **URL Params:**
  - `channel`: The channel from which the message originated (e.g., `telegram`, `whatsapp`).
- **Body:**
  - The body of the request will vary depending on the channel.

### `POST /v1/tasks`

Creates a new task.

- **Body:**
  ```json
  {
    "project_id": "string",
    "due_at": "string (ISO 8601)",
    "status": "string",
    "source": "string"
  }
  ```

### `POST /v1/calendar/events`

Creates or updates a calendar event, with a conflict check.

- **Body:**
  ```json
  {
    "title": "string",
    "start_time": "string (ISO 8601)",
    "end_time": "string (ISO 8601)",
    "attendees": ["string"]
  }
  ```

### `POST /v1/automations`

Defines trigger-to-action rules.

- **Body:**
  ```json
  {
    "triggers": "object",
    "actions": "object",
    "policy": "object",
    "enabled": "boolean"
  }
  ```

### `POST /v1/media/ingest`

Requests a presigned URL and registers a new media asset.

- **Body:**
  ```json
  {
    "filename": "string",
    "content_type": "string"
  }
  ```

### `POST /v1/media/:id/process`

Enqueues a media processing pipeline.

- **URL Params:**
  - `id`: The ID of the media asset.

### `POST /v1/actions/send`

Queues an outbound action with an approval gate.

- **Body:**
  ```json
  {
    "action_type": "string",
    "payload": "object"
  }
  ```

### `GET /v1/memory/search`

Performs a semantic search on the user's memory.

- **Query Params:**
  - `q`: The search query.
