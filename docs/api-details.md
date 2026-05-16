# AIEx API Documentation for Frontend

**Base URL:** `http://localhost:3000/api/v1`
**Authentication:** All endpoints (except login) require an `Authorization: Bearer <access_token>` header. The token is obtained via Supabase Auth.

---

## 1. Authentication (`/auth`)

### Login
- **Endpoint:** `POST /auth/login`
- **Body:** `{ "email": "user@example.com", "password": "password123" }`
- **Response:** Returns Supabase session with `access_token` and `user` object.

### Get Current Profile
- **Endpoint:** `GET /auth/me`
- **Response:** `{ "user": { "id": "uuid", "email": "user@example.com", "role": "tenant_admin" } }`

### Logout
- **Endpoint:** `POST /auth/logout`
- **Response:** `{ "message": "Logged out successfully" }`

---

## 2. Super Admin Endpoints (`/tenants`)
*These endpoints require the `super_admin` role.*

### Create Tenant
- **Endpoint:** `POST /tenants`
- **Body:** `{ "name": "Allen Pune", "slug": "allen-pune", "plan": "pro" }`

### List All Tenants
- **Endpoint:** `GET /tenants`
- **Response:** Array of tenant objects.

### Update Tenant
- **Endpoint:** `PATCH /tenants/:id`
- **Body:** `{ "name": "Allen Pune Updated", "is_active": true }`

### Invite Tenant Admin
- **Endpoint:** `POST /tenants/:id/admins/invite`
- **Body:** `{ "email": "admin@allen.com", "full_name": "John Admin" }`
- **Response:** Sends an email invite to the user to manage the specific tenant.

---

## 3. Tenant Admin Endpoints (`/users`)
*These endpoints require the `tenant_admin` role. All actions are strictly isolated to the admin's tenant.*

### Invite Student/User
- **Endpoint:** `POST /users/invite`
- **Body:** `{ "email": "student@example.com", "full_name": "Jane Student", "role": "student" }`
- **Response:** Sends an email invite to the student.

### List All Users in Tenant
- **Endpoint:** `GET /users`
- **Response:** Array of users belonging to the admin's tenant.

### Get User Profile
- **Endpoint:** `GET /users/:id`

### Update User
- **Endpoint:** `PATCH /users/:id`
- **Body:** `{ "full_name": "Jane Smith", "is_active": true }`

### Remove User (Soft Delete)
- **Endpoint:** `DELETE /users/:id`
- **Response:** Marks the user as inactive within the tenant.

---

## Upcoming Endpoints (Phase 4 & 5)
- **Exams:** `GET /exams`, `POST /exams`, `PATCH /exams/:id`
- **Questions:** `GET /exams/:examId/questions`, `POST /exams/:examId/questions`
- **Attempts:** `POST /attempts`, `POST /attempts/:id/answers`, `POST /attempts/:id/submit`
