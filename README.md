## Payout Management MVP

Full‑stack implementation of the **Payout Management MVP** practical task (`file://Payout_Management_MVP_Practical_Task (1).pdf`) using **Next.js App Router** + **MongoDB Atlas** + **Mongoose**.

Features:

- **Real login** with JWT (httpOnly cookie), seeded users:
  - OPS: `ops@demo.com` / `ops123`
  - FINANCE: `finance@demo.com` / `fin123`
- **Role-based access control (RBAC)** enforced strictly on the backend.
- **Vendor CRUD (minimal)**:
  - Fields: `name`, `upi_id`, `bank_account`, `ifsc`, `is_active`.
  - Screens: vendor list + add vendor form.
- **Payouts module**:
  - Fields and statuses as per spec (Draft → Submitted → Approved / Rejected).
  - OPS: create + submit; FINANCE: approve + reject (with mandatory reason).
  - Screens: payouts list with filters, create payout, payout detail with role-based actions.
- **Audit trail**:
  - Records `CREATED`, `SUBMITTED`, `APPROVED`, `REJECTED` with actor + timestamp.
  - Visible on payout detail page.

The API roughly follows the suggested endpoints in the task, namespaced under `/api` for Next.js:

- `POST /api/auth/login`
- `GET /api/vendors`
- `POST /api/vendors`
- `GET /api/payouts`
- `POST /api/payouts`
- `GET /api/payouts/:id`
- `POST /api/payouts/:id/submit`
- `POST /api/payouts/:id/approve`
- `POST /api/payouts/:id/reject`

---

## 1. Setup

### 1.1. Install dependencies

```bash
npm install
```

### 1.2. Environment variables

Create a `.env.local` file in the project root (or `.env` for local dev) with:

```bash
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/?retryWrites=true&w=majority
MONGODB_DB_NAME=payout_mgmt
JWT_SECRET=replace-with-strong-random-secret
```

Notes:

- `MONGODB_URI` should point to your **MongoDB Atlas** cluster.
- `MONGODB_DB_NAME` defaults to `payout_mgmt` if omitted.
- `JWT_SECRET` can be any reasonably long random string.

---

## 2. Seed data

The task requires hardcoded/seeded users:

- OPS: `ops@demo.com` / `ops123`
- FINANCE: `finance@demo.com` / `fin123`

To seed these into your MongoDB database:

```bash
npm run seed
```

This script connects using `MONGODB_URI` and `MONGODB_DB_NAME` and will:

- Create the two users above if they do not exist.
- Leave them unchanged if they already exist.

If login returns **401** for those credentials, check:

- You ran `npm run seed` against the same database configured in `.env.local`.
- `MONGODB_URI` / `MONGODB_DB_NAME` are correct.

---

## 3. Run locally

Start the dev server:

```bash
npm run dev
```

Then open `http://localhost:3000`.

- If not authenticated you will be redirected to `/login`.
- Log in as either OPS or FINANCE using the seeded users.

---

## 4. Functional walkthrough

### 4.1. Login

- Navigate to `/login`.
- Enter one of:
  - OPS: `ops@demo.com` / `ops123`
  - FINANCE: `finance@demo.com` / `fin123`
- On success you are redirected to `/payouts`.
- JWT is stored in an httpOnly cookie and validated on the server; RBAC never trusts client role.

### 4.2. Vendors

- Go to `/vendors`:
  - See vendor list with `name`, `upi_id`, `bank_account`, `ifsc`, `is_active`.
- Click **“Add Vendor”**:
  - `/vendors/new` shows a minimal vendor form.
  - `name` is required; other fields optional; `is_active` defaults to true.
  - On save you are returned to the vendor list.

### 4.3. Payouts

- Go to `/payouts`:
  - See payout list with status badges.
  - Filters:
    - **Status** (All / Draft / Submitted / Approved / Rejected).
    - **Vendor** (All / per-vendor).
  - Clicking a row opens `/payouts/:id` (detail page).

#### OPS role

- Can click **“New Payout”**:
  - `/payouts/new` lets you choose vendor, amount (> 0), mode (UPI/IMPS/NEFT), optional note.
  - Creates a **Draft** payout.
- In list or detail:
  - A **Submit** button is available only when:
    - Role = OPS
    - Status = Draft
  - Clicking it calls `POST /api/payouts/:id/submit` to transition `Draft → Submitted`.

#### FINANCE role

- Cannot see “New Payout” button.
- In list or detail, for payouts in **Submitted**:
  - **Approve** button → `POST /api/payouts/:id/approve` (Submitted → Approved).
  - **Reject** button → prompts for a mandatory reason then calls `POST /api/payouts/:id/reject`:
    - Status becomes `Rejected`.
    - `decision_reason` is stored and displayed.

Backend validation prevents invalid transitions (e.g. approving directly from Draft), matching the rules in `file://Payout_Management_MVP_Practical_Task (1).pdf`.

### 4.4. Audit trail

- On `/payouts/:id` you can see a chronological **Audit history**:
  - Entries for each action: `CREATED`, `SUBMITTED`, `APPROVED`, `REJECTED`.
  - Includes **who** performed the action (email + role) and **timestamp**.
- Every status-changing endpoint records an audit entry server-side.

---

## 5. Deployment (summary)

You can deploy to any free platform such as Vercel, Render, Railway, or Netlify.

Typical Vercel flow:

1. Push this repo to GitHub.
2. In Vercel:
   - Import the repo.
   - Set environment variables:
     - `MONGODB_URI`
     - `MONGODB_DB_NAME`
     - `JWT_SECRET`
3. Deploy.
4. Run `npm run seed` once against the production database (either locally with prod env vars or using a one-off task) to create the OPS/FINANCE users.
5. Log in at the live URL using the seeded credentials.

---

## 6. Notes / Assumptions

- All RBAC checks (OPS vs FINANCE) are enforced **server-side**.
- API responses use consistent JSON error shapes (`{ error: string, details?: any }`) for validation and authorization failures.
- UI focuses on clarity and correctness rather than heavy styling, as recommended in the task description.
