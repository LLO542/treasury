# TREASURY (Initial Scaffold)

This initial scaffold sets up:

- A **full-stack folder layout** for web, backend, and mobile apps.
- MongoDB/Mongoose schemas for **Works** and **Blog** collections.
- A secure authentication backend with:
  - bcrypt password hashing (`saltRounds = 12`) via Mongoose pre-save middleware.
  - password field hidden by default (`select: false`).
  - login rate limiting.
  - artificial login delay.
  - token blacklisting for logout.

## Project Structure

```txt
.
├── backend
│   ├── package.json
│   └── src
│       ├── app.js
│       ├── server.js
│       ├── config
│       │   ├── db.js
│       │   └── env.js
│       ├── controllers
│       │   └── auth.controller.js
│       ├── middleware
│       │   ├── auth.middleware.js
│       │   ├── error.middleware.js
│       │   ├── login-rate-limit.middleware.js
│       │   └── role.middleware.js
│       ├── models
│       │   ├── blog.model.js
│       │   ├── token-blacklist.model.js
│       │   ├── user.model.js
│       │   └── work.model.js
│       ├── routes
│       │   ├── auth.routes.js
│       │   └── index.js
│       ├── services
│       │   └── token.service.js
│       └── utils
│           └── delay.js
├── docs
├── frontend
│   └── src
│       ├── app
│       ├── components
│       ├── contexts
│       ├── hooks
│       ├── pages
│       ├── services
│       └── styles
└── mobile
    └── src
        ├── components
        ├── screens
        ├── services
        └── storage
```

## Quick Start (Backend)

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

API base path: `/api`

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout` (Bearer token required)
- `GET /api/auth/me` (Bearer token required)

## Next Build Steps

1. Add portfolio/blog CRUD endpoints + admin route protection (`authorize('admin')`).
2. Add media upload endpoints with Node.js file streaming and queue orchestration (`maxParallel=2`).
3. Scaffold React app with React Router + URL search params filtering.
4. Add Context API dark/light mode and RHF upload/blog forms with regex validation + axios request states.
5. Add Axios retry interceptor and offline cache (web + AsyncStorage for mobile).
