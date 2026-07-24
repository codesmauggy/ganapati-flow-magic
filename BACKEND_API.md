# Backend API Contract — Manish Kala Kendra ERP

This React frontend is fully wired to a REST backend. Implement the endpoints
below in Django + Django REST Framework + SimpleJWT and the app will work end
to end without any frontend changes.

## Base URL

Set `VITE_API_BASE_URL` in the frontend `.env` to your Django server, e.g.
`http://localhost:8000`. All paths below are appended to it.

## Auth (SimpleJWT)

- `POST /api/auth/login/` — body `{ username, password }` → `{ access, refresh, user }`
- `POST /api/auth/refresh/` — body `{ refresh }` → `{ access, refresh? }`

The frontend stores `access` and `refresh` in localStorage, sends
`Authorization: Bearer <access>` on every authenticated request, and
transparently retries once on `401` using `refresh`.

`user` shape:
```json
{
  "id": "1",
  "username": "manish",
  "fullName": "Manish K. Salunke",
  "role": "admin",             // admin | wholesale | retail | staff
  "email": "manish@example.com"
}
```

## CORS

Enable `django-cors-headers` and allow the frontend origin (dev:
`http://localhost:8080`, prod: your published URL). Allow headers
`Content-Type, Authorization`.

## Resources

All list endpoints return a plain JSON array (not paginated) for now. All
monetary values are integers in rupees (₹). `photo` is an absolute URL
(Django `/media/...` or a CDN).

### `GET /api/models/` → `Model[]`
```json
{
  "id": "1", "sku": "GN-24-DG", "name": "Dagadusheth 24\" Gold",
  "category": "Ganapati", "size": "24 inch",
  "photo": "https://.../idol.jpg",
  "purchasePrice": 9500, "sellingPrice": 12500, "rawMaterialCost": 1800,
  "available": 124, "lowStockAt": 150,
  "wholesaleSold": 320, "retailSold": 88
}
```
`category` ∈ `"Ganapati" | "Gauri" | "Devi"`.

### `GET /api/bookings/` → `Booking[]`
### `POST /api/bookings/` — create a booking
Request:
```json
{
  "customer": "Rohit Jadhav", "mobile": "98...", "village": "Alandi",
  "modelSku": "GN-24-DG", "qty": 2, "advance": 5000,
  "channel": "Retail",          // "Wholesale" | "Retail"
  "pickupDate": "2026-07-25"
}
```
Response — created `Booking`:
```json
{
  "id": "BK-9025", "customer": "Rohit Jadhav", "village": "Alandi",
  "mobile": "98...", "modelSku": "GN-24-DG",
  "modelName": "Dagadusheth 24\" Gold",
  "qty": 2, "amount": 25000, "advance": 5000,
  "status": "Advance Paid",     // Booked | Advance Paid | Loading | Dispatched | Delivered | Pending
  "channel": "Retail",
  "collector": "Manish K. Salunke",   // derived from request.user
  "date": "2026-07-24"
}
```
Server computes `amount = qty × model.sellingPrice`, sets `collector` from
the authenticated user, and decrements `Model.available` by `qty`.

### `GET /api/workers/` → `Worker[]`
```json
{
  "id": "W-01", "name": "Bhagwan Jadhav", "role": "Polish",
  "category": "Production",              // "Production" | "Painter"
  "operation": "Polish", "pieceRate": 25,
  "todayProduction": 120, "monthlyProduction": 2840,
  "attendance": "Present",               // Present | Half Day | Absent | Late
  "pendingSalary": 18500
}
```

### `GET /api/expenses/` → `Expense[]`
```json
{ "id": "E-01", "date": "2026-07-18", "category": "Colour",
  "description": "Golden paint 5L", "amount": 8500, "paidBy": "Manish" }
```

### `GET /api/tempos/` → `Tempo[]`
```json
{ "id": "T-01", "tempo": "MH-12-AB-4521", "place": "Pune Hub",
  "items": 45, "status": "Loading" }
```

### `GET /api/dashboard/` → `DashboardKpis`
Server-computed aggregates over current season:
```json
{
  "totalStock": 1620, "totalModels": 6,
  "wholesaleValue": 597500, "retailValue": 22800,
  "wholesaleCount": 3, "retailCount": 3,
  "collection": 196500, "pending": 423800,
  "expenses": 285000, "staffPayments": 121500,
  "netProfit": 13800,
  "lowStockCount": 2
}
```

## Suggested Django app layout

```
erp/
├── config/                # settings, urls, wsgi
├── accounts/              # custom User model + role, JWT views
├── catalog/               # Model (SKU), photo upload
├── sales/                 # Booking (channel=W|R), Tempo
├── workforce/             # Worker, Attendance, Production, Salary ledger
├── expenses/              # Expense
└── reports/               # dashboard.views.DashboardView
```

Recommended packages: `djangorestframework`, `djangorestframework-simplejwt`,
`django-cors-headers`, `Pillow` (for photos).

## Error format

The frontend reads `body.detail` for the user-visible message on non-2xx
responses (DRF default). Prefer:
```json
{ "detail": "Human-readable error message." }
```

## Roles & permissions (recommended)

- `admin` — full access, all mutations
- `wholesale` — read/write wholesale bookings, read models/workers
- `retail` — read/write retail bookings, read models
- `staff` — read own attendance/salary only

Enforce via DRF `permission_classes` per viewset. The frontend renders the
role in the header but does not currently gate UI by role — do the enforcement
server-side.

## Notes

- Frontend expects arrays, not `{ results: [...] }`. If you turn on pagination,
  either wrap responses to arrays for these endpoints or update `queries.ts`.
- IDs are strings on the wire (`"1"`, `"BK-9024"`). Cast in the serializer.
- `formatCurrency` and low-stock detection happen on the frontend from
  primitive numbers returned by the API.
