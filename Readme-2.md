# Dispatch Management System

**MERN + React Vite + Normal CSS + MongoDB + System 1 API**

A centralized system for:

**Delivery Challan → Godown → Packing → Roll → QR → Vehicle → Dispatch**

## 1. Objective

Eliminate duplicate DC entry.

``` text
System 1
  ↓ API / Webhook
Dispatch Backend
  ↓
MongoDB
  ↓
Godown / Dispatch Screens
  ↓
Packing → QR → Vehicle → Dispatch
```

System 1 remains the source for Delivery Challan data. The Dispatch
System manages operational tracking, packing, rolls, QR and dispatch.

Google Sheets can be used as a fallback/reporting source if API access
is unavailable.

## 2. DC Data

Expected fields:

  Field           Example
  --------------- ------------------
  Date & Time     23-09-2026 10:30
  Challan No      DC-00982
  Bill To         ABC Interiors
  Bill Address    Surat, Gujarat
  Bill GSTIN      24XXXX
  Screen Name     Burl
  Item Name       Burl 01
  QTY             25
  Godown          S-28
  Mistry          Rajesh
  Delivery Type   Company Vehicle
  Status          Pending
  Roll Qty        3

## 3. Integration

Preferred:

``` text
System 1 → REST API / Webhook → Dispatch Backend → MongoDB
```

Fallback:

``` text
System 1 → Google Sheet → Google Sheets API → Dispatch Backend
```

**MongoDB should be the operational database, not Google Sheets.**

## 4. Godown System

Every godown has a unique code such as:

``` text
S-28
S-17
S-04
```

A DC can contain multiple godowns:

``` text
DC-00982
├── S-28 → Item A, Item B
├── S-17 → Item C
└── S-04 → Item D
```

Each godown only sees its assigned jobs.

## 5. Godown Screen

A dedicated full-screen page runs continuously on a TV/large display.

``` text
┌─────────────────────────────────────────────┐
│ S-28                    ● ONLINE             │
├─────────────────────────────────────────────┤
│ DC-00982   ABC Interiors    25    PACKING  │
│ DC-00983   XYZ Designs      12    PENDING  │
│ DC-00984   Studio XYZ       18    PACKED   │
└─────────────────────────────────────────────┘
```

New DC/job:

-   Top-right popup
-   Notification sound
-   Highlighted row
-   Live update without refresh

## 6. Godown User

PC, tablet and mobile access.

Actions:

``` text
View Job
Start Processing
On Hold
Request Transfer
Pack
Confirm Transfer
```

Users only access authorized godowns.

## 7. Packing & Rolls

Example:

``` text
DC Qty = 25
Roll 01 = 8
Roll 02 = 8
Roll 03 = 9
```

Each physical roll receives a unique ID:

``` text
ROLL-DC00982-01
ROLL-DC00982-02
ROLL-DC00982-03
```

The system validates total roll quantity.

## 8. QR Workflow

QR is generated **per roll**:

``` text
Roll → QR Generate → Print Sticker → Stick on Roll → Scan
```

Scanning shows:

``` text
Customer
DC
Item
Roll
Qty
Godown
Current Status
```

## 9. Dispatch Office

Manages:

-   Packed rolls
-   QR generation/printing
-   QR scanning
-   Vehicle details
-   Loading
-   Final dispatch

``` text
DC-00982
Customer: ABC Interiors
Godown: S-28
Rolls: 3

[GENERATE QR] [SCAN ROLLS] [LOAD VEHICLE] [DISPATCH]
```

## 10. Vehicle Flow

Delivery types:

``` text
PARTY_VEHICLE
COMPANY_VEHICLE
```

Vehicle details:

``` text
Vehicle Number
Driver Name
Driver Mobile
```

Loading:

``` text
Scan Roll 01 ✓
Scan Roll 02 ✓
Scan Roll 03 ✓

3 / 3 VERIFIED
        ↓
LOADED → DISPATCHED
```

## 11. Transfer Workflow

``` text
S-28
 ↓
Transfer Request
 ↓
Transfer In Transit
 ↓
S-17
 ↓
Received
```

Transfer history is stored for audit.

## 12. Roles

  Role                Main Access
  ------------------- -------------------------------------------
  Super Admin         Full system
  Admin               Users, godowns, DCs, settings
  Dispatch Manager    Packing, QR, scanning, vehicles, dispatch
  Dispatch Operator   QR, scanning, loading
  Godown Manager      Godown jobs, packing, transfers
  Godown Operator     Process jobs, status updates
  Viewer              Read-only
  Godown Screen       Display-only device

## 13. Authentication & Security

Users should not need daily login, but sessions must remain revocable.

``` text
Long-lived Session
+
Refresh Token
+
Device Management
+
RBAC
```

Security:

-   HTTPS
-   Password hashing
-   Secure sessions
-   Rate limiting
-   CORS
-   Helmet
-   Input validation
-   RBAC
-   Audit logs
-   Session/device revocation

## 14. Real-Time Updates

Use **Socket.IO**.

``` text
System 1
 ↓
Backend
 ↓
MongoDB
 ↓
Socket.IO
 ↓
Godown TV + Godown User + Dispatch Office
```

Status changes appear without refresh.

## 15. Main Statuses

``` text
PENDING
PROCESSING
ON_HOLD
TRANSFER_REQUESTED
TRANSFERRED
RECEIVED
PACKING
PACKED
READY_FOR_DISPATCH
LOADING
LOADED
DISPATCHED
CANCELLED
```

## 16. Main Screens

``` text
/login
/dashboard

/delivery-challans
/delivery-challans/:id

/godowns
/godowns/:id
/godown-screen/:godownCode

/packing
/transfers

/rolls
/qr
/qr/scan

/dispatch
/vehicles

/users
/screens
/notifications

/integration
/audit-logs
/settings
```

## 17. MongoDB Collections

``` text
users
roles
permissions
godowns
godownScreens

deliveryChallans
deliveryItems
godownJobs

transfers
rolls
qrCodes

vehicles
dispatches

notifications
sessions
auditLogs

integrationConfigs
syncLogs
```

## 18. Technology Stack

**Frontend**

``` text
React + Vite
Normal CSS
PWA
Socket.IO Client
QR Scanner
```

**Backend**

``` text
Node.js + Express
Socket.IO
Authentication + RBAC
```

**Database**

``` text
MongoDB
```

**Integration**

``` text
System 1 REST API
System 1 Webhook
Google Sheets API (fallback)
```

## 19. Complete Flow

``` text
System 1 creates DC
        ↓
API/Webhook
        ↓
Dispatch Backend
        ↓
MongoDB
        ↓
Godown identified
        ↓
Godown Screen notification
        ↓
Godown processes order
        ↓
Packing
        ↓
Roll creation
        ↓
QR generation
        ↓
Dispatch Office
        ↓
QR scan
        ↓
Vehicle loading
        ↓
DISPATCHED
```

## 20. Development Phases

### Phase 1

Authentication + Users + Godowns + API Integration

### Phase 2

DC Management + Godown Jobs + Godown Screen + Notifications

### Phase 3

Packing + Transfers + Roll Management

### Phase 4

QR Generation + QR Scanning

### Phase 5

Vehicles + Loading + Dispatch

### Phase 6

Reports + Analytics + Advanced Notifications

## 21. System 1 Developer Requirements

Request:

-   API Base URL
-   API Documentation
-   Authentication method
-   Unique DC ID
-   DC endpoint
-   Item structure
-   Godown field
-   Created/Updated timestamps
-   Edit/cancel behavior
-   Pagination
-   Rate limits
-   Webhook availability
-   Test/staging access
-   Sample JSON response

If API is unavailable, request **Google Sheets API access**.

## Core Principle

> **System 1 creates the Delivery Challan. Dispatch System tracks what
> physically happens to that order.**

``` text
DC
 ↓
Godown
 ↓
Packing
 ↓
Roll
 ↓
QR
 ↓
Scan
 ↓
Vehicle
 ↓
Dispatch
```

The system should always be able to answer:

**"Where is this roll right now?"**
