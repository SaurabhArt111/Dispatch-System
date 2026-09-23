# Build Dispatch Management System from Scratch

Build a complete **Dispatch Management System** from scratch using:

* React + Vite + JavaScript/JSX
* Node.js + Express
* MongoDB + Mongoose
* Socket.IO for real-time updates
* Normal CSS only — **NO Tailwind**
* PWA support
* Responsive UI for Mobile, PC and large TV screens

## 1. Core Concept

There is an existing **System 1** that generates Delivery Challans (DC).

Our Dispatch System must consume DC data from System 1 through an API/Webhook. Google Sheets can be supported later as a fallback.

Do NOT make users manually re-enter DC information.

Flow:

```text
System 1
   ↓ API / Webhook
Dispatch Backend
   ↓
MongoDB
   ↓
Godown Screen / Godown Users / Dispatch Office
   ↓
Packing
   ↓
Roll Creation
   ↓
QR Generation
   ↓
QR Scanning
   ↓
Vehicle Loading
   ↓
Dispatch
```

## 2. DC Data

Support:

```text
Date & Time
Challan No
Bill To
Bill Address
Bill GSTIN
Screen Name
Item Name
QTY
Godown
Mistry
Delivery Type
```

Delivery Type:

```text
PARTY_VEHICLE
COMPANY_VEHICLE
```

Keep the architecture flexible for additional fields.

## 3. Important Architecture Rule

System 1 owns the original DC/source data.

Our Dispatch System owns operational data:

```text
Godown processing
Packing
Rolls
Transfers
QR
Scanning
Vehicles
Loading
Dispatch
Notifications
Audit logs
```

Never overwrite local operational data during DC synchronization.

Use the System 1 unique DC/source ID to prevent duplicate imports.

## 4. Godowns

Each godown has an alphanumeric ID such as:

```text
S-28
S-17
S-04
```

A DC can contain items belonging to multiple godowns.

Example:

```text
DC-00982

S-28 → Item A, Item B
S-17 → Item C
```

Create separate Godown Jobs while keeping the original DC unified.

## 5. Godown Screen

Create a dedicated `/godown-screen/:godownCode` screen designed for a permanently running TV/large display.

Show:

* Godown ID
* Online/offline status
* Current date/time
* Today's DC/jobs
* Customer
* DC number
* Item
* Quantity
* Current status

When a new job arrives for that godown:

* Show a notification popup in the top-right
* Play a notification sound
* Highlight the new row
* Update instantly using Socket.IO
* No page refresh

Example:

```text
┌──────────────────────────────┐
│ 🔔 NEW DELIVERY CHALLAN      │
│                              │
│ DC-2026-00982                │
│ ABC INTERIORS                │
│ BURL LAMINATE                │
│ QTY: 25                      │
│ GODOWN: S-28                 │
└──────────────────────────────┘
```

## 6. Godown Users

Create RBAC.

Roles:

```text
Super Admin
Admin
Dispatch Manager
Dispatch Operator
Godown Manager
Godown Operator
Viewer
Godown Screen
```

Godown users can only access their assigned godowns.

Allow configurable statuses, initially:

```text
PENDING
PROCESSING
ON_HOLD
TRANSFER_REQUESTED
TRANSFERRED
RECEIVED
PACKING
PACKED
READY_FOR_DISPATCH
```

## 7. Packing & Rolls

When an order is packed, create individual physical Roll records.

Example:

```text
DC Qty = 25

Roll 01 = 8
Roll 02 = 8
Roll 03 = 9
```

Validate that roll quantities match the required quantity unless an authorized override exists.

Each roll gets a unique ID:

```text
ROLL-DC00982-01
ROLL-DC00982-02
ROLL-DC00982-03
```

## 8. QR

Generate QR codes at roll level, NOT only DC level.

QR should identify the physical roll and allow the Dispatch System to retrieve:

```text
DC
Customer
Item
Roll
Quantity
Godown
Status
```

Create QR generation, printing and scanning interfaces.

## 9. Dispatch Office

Create a dedicated Dispatch dashboard.

Show:

```text
Packed
QR Generated
Ready
Loaded
Dispatched
```

Workflow:

```text
Packed
 ↓
Generate QR
 ↓
Print QR
 ↓
Scan Roll
 ↓
Verify
 ↓
Vehicle Loading
 ↓
Loaded
 ↓
Dispatched
```

Prevent duplicate scanning/dispatching of the same roll.

## 10. Vehicle

Support:

```text
Party Vehicle
Company Vehicle
```

Store:

```text
Vehicle Number
Driver Name
Driver Mobile
```

When loading a vehicle, the operator should scan all required rolls and the system should verify the expected rolls before allowing final loading confirmation.

## 11. Transfer

Support transfer between godowns:

```text
TRANSFER_REQUESTED
TRANSFERRED
RECEIVED
```

Receiving godown must confirm receipt.

## 12. Authentication

Do not force users to log in every day.

Use secure long-lived revocable sessions/refresh tokens.

Admin must be able to:

* Disable user
* Revoke session
* Force logout
* Manage roles
* Manage godown access

Godown TVs should use a pairing mechanism rather than requiring daily username/password login.

## 13. Real-Time

Use Socket.IO.

Example rooms:

```text
godown:S-28
godown:S-17
dispatch-office
admin
```

Godown updates should instantly reflect on:

* Godown TV
* Godown user devices
* Dispatch Office where relevant

## 14. MongoDB

Create clean Mongoose models for at least:

```text
User
Role
Godown
GodownScreen
DeliveryChallan
DeliveryItem
GodownJob
Transfer
Roll
QRCode
Vehicle
Dispatch
Notification
Session
AuditLog
SyncLog
```

Use proper indexes and relationships.

## 15. UI

Create a clean premium business dashboard.

Use:

* Normal CSS
* CSS variables
* Reusable components
* Responsive layouts
* Mobile-first behavior where appropriate
* Large typography for TV screens
* Tables
* Cards
* Modals
* Toasts
* Loading states
* Empty states
* Error states
* Status badges

Do not use Tailwind.

## 16. Integration

Create a clean integration service so System 1 API can later be configured through `.env`.

Example:

```env
SYSTEM1_API_URL=
SYSTEM1_API_KEY=
SYSTEM1_WEBHOOK_SECRET=
MONGO_URI=
JWT_SECRET=
CLIENT_URL=
```

Create a mock System 1 API/service for development so the application can be tested without the real System 1.

Also create a Sync Log page.

## 17. Project Structure

Use a clean structure:

```text
dispatch-management/
├── frontend/
├── backend/
├── README.md
├── .gitignore
└── package.json
```

Frontend:

```text
src/
├── components/
├── pages/
├── layouts/
├── services/
├── hooks/
├── context/
├── utils/
├── styles/
└── App.jsx
```

Backend:

```text
src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── sockets/
├── utils/
└── server.js
```

## 18. Development Requirements

Build the application as a working project, not just a UI mockup.

Implement:

* Authentication
* RBAC
* MongoDB models
* REST APIs
* Socket.IO
* Godown screens
* Notifications
* Sound
* DC management
* Godown jobs
* Packing
* Rolls
* QR
* Scanning
* Transfers
* Vehicles
* Dispatch
* Audit logs
* Sync logs
* Mock System 1 integration

Use realistic seed/demo data so the application can be tested immediately.

## 19. Final Deliverable

After implementation:

1. Make sure frontend builds successfully.
2. Make sure backend starts successfully.
3. Fix obvious runtime/build errors.
4. Add `.env.example`.
5. Add setup instructions.
6. Add demo credentials.
7. Add README.
8. Include seed/demo data.
9. Create the complete project as a ZIP file.

Final output should contain:

```text
dispatch-management.zip
```

with both frontend and backend included.

Do not only provide code snippets. **Actually create the complete project files and ZIP.**
