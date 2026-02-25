## Payout Management

Full‑stack implementation of a payout management system using **Next.js App Router**, **MongoDB Atlas**, and **Mongoose**.

- **Live demo**: https://payout-management-nu.vercel.app/
- **Seed users** (after running the seed script):
  - OPS: `ops@demo.com` / `ops123`
  - FINANCE: `finance@demo.com` / `fin123`

### Main features

- **Authentication & RBAC**
  - Email/password login with JWT stored in an httpOnly cookie.
  - Strict server‑side role checks for OPS vs FINANCE on all sensitive endpoints.
- **Vendors**
  - Minimal vendor model: `name`, `upi_id`, `bank_account`, `ifsc`, `is_active`.
  - Vendor list page and add/edit vendor forms.
- **Payouts**
  - Payout lifecycle: Draft → Submitted → Approved / Rejected.
  - OPS: create draft payouts and submit them.
  - FINANCE: approve or reject submitted payouts (rejection requires a reason).
  - Payout list with status/vendor filters, create form, and detail view with role‑based actions.
- **Audit trail**
  - Records `CREATED`, `SUBMITTED`, `APPROVED`, `REJECTED` with actor (email + role) and timestamp.
  - Displayed on the payout detail page.

### API surface (Next.js `/api` routes)

- `POST /api/auth/login`
- `GET /api/vendors`
- `POST /api/vendors`
- `GET /api/vendors/:id`
- `PUT /api/vendors/:id`
- `DELETE /api/vendors/:id`
- `GET /api/payouts`
- `POST /api/payouts`
- `GET /api/payouts/:id`
- `POST /api/payouts/:id/submit`
- `POST /api/payouts/:id/approve`
- `POST /api/payouts/:id/reject`

---

## 1. Quick start (local)

### 1.1. Install dependencies

```bash
npm install
```

### 1.2. Environment variables

Create a `.env.local` file in the project root with:

```bash
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/?retryWrites=true&w=majority
MONGODB_DB_NAME=payout_mgmt
JWT_SECRET=replace-with-strong-random-secret
```

### 1.3. Seed data

Seed the required OPS and FINANCE users:

```bash
npm run seed
```

### 1.4. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`, log in with one of the seeded users, and you’ll be redirected to `/payouts`.

---

## 2. Implementation notes

- **Tech stack**: Next.js App Router, React, TypeScript, MongoDB Atlas, Mongoose, Zod, JWT (httpOnly cookie).
- **Security**
  - All authentication and RBAC checks are enforced on the server.
  - Protected API routes use helpers like `requireAuth` and `requireRole`.
- **Validation & errors**
  - Request payloads are validated with Zod.
  - API responses use a consistent JSON error shape: `{ error: string, details?: any }`.
- **Data model**
  - `User`: email, password hash, role (`OPS` | `FINANCE`).
  - `Vendor`: payout destination info (`name`, `upi_id`, `bank_account`, `ifsc`, `is_active`).
  - `Payout`: vendor reference, amount, mode, status, optional note, optional decision reason.
  - `PayoutAudit`: payout reference, action, actor, timestamp.

The codebase is intentionally small and focused so it’s easy to review during an interview while still demonstrating real‑world concerns: authentication, RBAC, validation, persistence, and an audit trail.

