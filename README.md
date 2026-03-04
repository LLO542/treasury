# TREASURY

Initial scaffold for **TREASURY**: a personal portfolio and blog platform for web/mobile.

## Student Information

- **Student ID:** LLO542
- **Course:** Fullstack Web Development Final Project
- **Repository:** https://github.com/LLO542/treasury

## Initial Project Structure

```text
.
├── backend/
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   └── db.js
│       ├── controllers/
│       │   └── auth.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   └── login-rate-limit.middleware.js
│       ├── models/
│       │   ├── blog.model.js
│       │   ├── token-blacklist.model.js
│       │   ├── user.model.js
│       │   └── work.model.js
│       ├── routes/
│       │   └── auth.routes.js
│       └── utils/
│           ├── async-delay.js
│           └── jwt.js
└── frontend/
    └── src/
        ├── components/
        ├── context/
        ├── pages/
        ├── router/
        └── services/
```

## Mongoose Schemas Implemented

### `Work`
- strict schema with required + unique fields (`slug`).
- media metadata and owner relation.
- `mediaUrl` virtual to avoid redundant storage.

### `Blog`
- strict schema with required + unique fields (`slug`).
- author relation + publication lifecycle (`status`, `publishedAt`).
- `readingTimeMinutes` virtual derived from content.

### `User`
- pre-save middleware hashes passwords with bcrypt (`saltRounds = 12`).
- `password` field hidden by default (`select: false`).
- role enum for `admin` and `user`.

## Authentication Backend Setup

- `POST /api/auth/register` creates users with auto-hashed passwords.
- `POST /api/auth/login` is protected by:
  - rate limiter (5 attempts / 15 minutes)
  - artificial async delay (`LOGIN_DELAY_MS`, default 1200ms)
- `POST /api/auth/logout` uses token blacklisting in MongoDB (with TTL index) so token invalidation is server-enforced.
- `protect` + `authorize(...roles)` middleware support role-based route protection.

## Next Steps

1. Build portfolio/blog CRUD routes and controllers.
2. Add file uploads + stream-based media serving endpoint.
3. Scaffold React + Tailwind SPA with React Router, URL search-param filters, dark-mode Context API, and RHF forms.
4. Add Axios interceptors for retry/error states and offline cache layer.
