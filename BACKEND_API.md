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

---

# Customers (CRM) + Admin Console — added endpoints

The frontend now ships `/customers`, `/customers/:id` (ledger) and `/admin`.
Implement the endpoints below; no other frontend change is needed.

## `Customer` wire shape

```json
{
  "id": "C-001",
  "name": "Rohit Jadhav",
  "contact": "9812345678",
  "altContact": "9800000000",
  "address": "Near Vitthal Mandir, Main Road",
  "village": "Alandi",
  "city": "Pune",
  "tag": "Retail",                 // "Retail" | "Wholesale"
  "dob": "1988-04-12",
  "gstin": "27ABCDE1234F1Z5",
  "refBy": "Manish K. Salunke",     // display name of the user who created it
  "refById": "1",                   // request.user.id — server-set, never trust client
  "notes": "Prefers 24 inch gold finish",
  "isActive": true,
  "createdAt": "2026-07-20T10:12:00Z",
  "totalBilled": 250000,            // server-computed aggregate
  "totalPaid": 180000,
  "balance": 70000,                 // totalBilled - totalPaid
  "bookingsCount": 6,
  "lastTransactionDate": "2026-07-24"
}
```

### Endpoints

- `GET /api/customers/` → `Customer[]`
- `POST /api/customers/` → `Customer`
  Body: `name, contact, altContact?, address, village?, city?, tag, dob?, gstin?, notes?, isActive?`
  Server sets `refBy`/`refById` from `request.user` and `createdAt`.
- `GET /api/customers/{id}/` → `Customer`
- `PATCH /api/customers/{id}/` → `Customer` (partial; same writable fields)
- `DELETE /api/customers/{id}/` → `204`
- `GET /api/customers/{id}/ledger/` → `CustomerLedger`

### `CustomerLedger`

```json
{
  "customer": { /* Customer */ },
  "transactions": [
    {
      "id": "TX-1", "customerId": "C-001", "date": "2026-07-20",
      "type": "Booking",              // Booking | Payment | Adjustment | Return
      "reference": "BK-9024",
      "description": "Dagadusheth 24\" Gold × 2",
      "debit": 25000, "credit": 0,
      "balance": 25000,               // running balance AFTER this row
      "recordedBy": "Manish K. Salunke"
    }
  ],
  "payments": [
    {
      "id": "PY-1", "customerId": "C-001", "date": "2026-07-21",
      "amount": 5000,
      "mode": "UPI",                  // Cash | UPI | Bank Transfer | Cheque | Card
      "reference": "UTR123456",
      "bookingId": "BK-9024",
      "receivedBy": "Manish K. Salunke",
      "note": "Advance"
    }
  ],
  "bookings": [ /* Booking[] for this customer, newest first */ ]
}
```

Return `transactions` in chronological order with `balance` accumulated
server-side; the UI renders it verbatim.

## Payments

- `POST /api/payments/` → `CustomerPayment`
  Body: `{ customerId, amount, mode, date?, reference?, bookingId?, note? }`
  Server sets `receivedBy` from `request.user`, defaults `date` to today, and
  appends a `Payment` ledger row (credit) for the customer.

## Bookings ↔ Customers

`POST /api/bookings/` now optionally accepts `customerId`. When present, link
the booking to that customer (and prefer the stored customer's name/mobile);
when absent, create-or-match a customer from `customer`/`mobile`/`village` so
every booking still lands in someone's ledger. Every booking must append a
`Booking` ledger row (debit = amount) and any `advance` must append a
`Payment` row (credit).

## Admin console mutations

The `/admin` page uses standard DRF ModelViewSet routes:

- Models: `POST /api/models/`, `PATCH /api/models/{id}/`, `DELETE /api/models/{id}/`
- Workers: `POST /api/workers/`, `PATCH /api/workers/{id}/`, `DELETE /api/workers/{id}/`
- Expenses: `POST /api/expenses/`, `PATCH /api/expenses/{id}/`, `DELETE /api/expenses/{id}/`
- Bookings: `PATCH /api/bookings/{id}/` with `{ "status": "Dispatched" }`

Writable fields match the read shapes documented earlier. `paidBy` on expenses
and `collector` on bookings are server-derived from `request.user` when omitted.

Gate all admin mutations to `role == "admin"` with a DRF permission class — the
UI shows the console to any signed-in user but relies on the API to reject
unauthorized writes and surfaces `detail` as the error message.

## Suggested Django additions

```
erp/
├── customers/            # Customer, CustomerPayment, LedgerEntry
│   ├── models.py         # Customer(ref_by=FK(User)), Payment, LedgerEntry
│   ├── serializers.py    # camelCase via source= or djangorestframework-camel-case
│   └── views.py          # CustomerViewSet + @action(detail=True) ledger
```

Recommended: `djangorestframework-camel-case` so snake_case models serialize to
the camelCase keys this frontend expects.
