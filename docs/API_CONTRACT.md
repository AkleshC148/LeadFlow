# LeadFlow API Contract (single source of truth)

## Env vars (exact names)
backend/.env: MONGODB_URI, MONGODB_DB_NAME, JWT_SECRET, JWT_ALGORITHM (HS256), JWT_EXPIRE_MINUTES (1440), CORS_ORIGINS (comma-separated)
frontend/.env.local: NEXT_PUBLIC_API_URL (e.g. http://localhost:8000)

## Conventions
- All routes prefixed /api. JSON is snake_case. Ids are strings, exposed as `id`.
- Datetimes are ISO-8601 UTC strings ending in "Z".
- Errors always return {"detail": "<human readable string>"}, including 422.
- Auth: `Authorization: Bearer <token>` on every route except signup, login, health.
- Status enum (exact strings): "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Won" | "Lost"

## Data model (MongoDB)
users: _id, name, email (unique, lowercase), password_hash, created_at
leads: _id, owner_id, name, company|null, phone|null, status, follow_up_at|null, last_note|null, last_discussion_at|null, created_at, updated_at
discussions: _id, lead_id, owner_id, note, follow_up_at|null, created_at
Indexes: users.email unique; leads (owner_id, status); leads (owner_id, name); discussions (lead_id, created_at desc)
Every lead/discussion query is scoped by owner_id = current user. Another user's lead returns 404.

## Endpoints
GET  /api/health -> 200 {"status":"ok"}
POST /api/auth/signup {name, email, password(min 8)} -> 201 {access_token, token_type:"bearer", user:{id,name,email}}; 409 if email exists; 422 invalid
POST /api/auth/login {email, password} -> 200 same shape; 401 "Invalid email or password"
GET  /api/auth/me -> 200 {id,name,email}; 401 if token missing/invalid/expired

GET   /api/leads?status=<Status>&q=<text> -> 200 Lead[]; q = case-insensitive partial match on name (regex-escaped); sorted updated_at desc; 422 on bad status
POST  /api/leads {name (required, trimmed), company?, phone?, status? default "New"} -> 201 Lead
GET   /api/leads/{id} -> 200 Lead | 404 (invalid ObjectId is also 404, never 500)
PATCH /api/leads/{id} any of {status, name, company, phone, follow_up_at (null clears)} -> 200 Lead | 404 | 422
GET   /api/leads/{id}/discussions -> 200 Discussion[] newest first | 404
POST  /api/leads/{id}/discussions {note (required, non-empty), follow_up_at?} -> 201 {"discussion": Discussion, "lead": Lead}
  Behaviour: insert discussion; set lead.last_note=note, lead.last_discussion_at=discussion.created_at, updated_at=now;
  if follow_up_at provided set lead.follow_up_at, otherwise leave unchanged. `lead` is the UPDATED lead.

Lead: { id, name, company, phone, status, follow_up_at, last_note, last_discussion_at, created_at, updated_at }
Discussion: { id, lead_id, note, follow_up_at, created_at }