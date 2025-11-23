# Database Schema

This document describes the database schema for the Synapsy assistant, designed for PostgreSQL with the `pgvector` extension.

## Data Models

### `users`

Represents a user of the assistant.

- `id`: Unique identifier for the user.
- `org_id`: The organization the user belongs to.
- `role`: The user's role (e.g., `admin`, `user`).
- `prefs`: JSONB field for user preferences.
- `scopes`: JSONB field for user permissions and scopes.

### `contacts`

Represents a contact in the user's personal CRM.

- `id`: Unique identifier for the contact.
- `user_id`: Foreign key to the `users` table.
- `channels`: JSONB field for contact information (e.g., email, phone).
- `notes`: Text field for notes about the contact.
- `embedding`: Vector field for semantic search.

### `projects`

Represents a project.

- `id`: Unique identifier for the project.
- `client_id`: Foreign key to the `contacts` table.
- `status`: The current status of the project.
- `tags`: JSONB field for project tags.

### `tasks`

Represents a task.

- `id`: Unique identifier for the task.
- `project_id`: Foreign key to the `projects` table.
- `due_at`: Timestamp for when the task is due.
- `status`: The current status of the task.
- `source`: The source of the task (e.g., `email`, `chat`).
- `approvals`: JSONB field for approval information.

### `messages`

Represents a message from any channel.

- `id`: Unique identifier for the message.
- `channel`: The channel the message came from (e.g., `telegram`, `email`).
- `direction`: `inbound` or `outbound`.
- `content`: The content of the message.
- `attachments`: JSONB field for message attachments.
- `meta`: JSONB field for any additional metadata.

### `automations`

Represents an automation rule.

- `id`: Unique identifier for the automation.
- `triggers`: JSONB field describing the triggers.
- `actions`: JSONB field describing the actions.
- `policy`: JSONB field for automation policies.
- `enabled`: Boolean indicating if the automation is active.

### `media_assets`

Represents a media asset.

- `id`: Unique identifier for the media asset.
- `uri`: The URI of the original media file.
- `checksum`: The checksum of the original file.
- `proxy_uri`: The URI of the processed proxy file.
- `tags`: JSONB field for media tags.
- `transcripts`: JSONB field for ASR transcripts.

### `jobs`

Represents a background job.

- `id`: Unique identifier for the job.
- `type`: The type of job (e.g., `media.proxy`, `media.asr`).
- `status`: The current status of the job.
- `metrics`: JSONB field for job metrics.
- `error`: Any error message if the job failed.
- `started_at`: Timestamp for when the job started.
- `ended_at`: Timestamp for when the job ended.

### `memory_chunks`

Represents a chunk of memory for RAG.

- `id`: Unique identifier for the memory chunk.
- `entity_ref`: Reference to the entity this memory is about.
- `embedding`: Vector field for semantic search.
- `ttl`: Time-to-live for the memory chunk.
- `provenance`: The source of the memory chunk.
