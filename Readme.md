# Dispatch Management System

## MERN + React Vite + Normal CSS + MongoDB + System 1 API / Google Sheets Integration

> **Project Type:** Delivery Challan → Godown Processing → Packing/Roll
> Tracking → QR → Dispatch Management\
> **Frontend:** React + Vite + Normal CSS\
> **Backend:** Node.js + Express.js\
> **Database:** MongoDB\
> **Real-time:** Socket.IO\
> **PWA:** Yes\
> **Primary Integration:** System 1 REST API / Webhook\
> **Fallback Integration:** Google Sheets API\
> **QR:** Roll-level QR generation and scanning

------------------------------------------------------------------------

# 1. Project Overview

The Dispatch Management System is a centralized operational system that
receives Delivery Challan (DC) information from an existing **System
1**, assigns and distributes work to the correct godowns, tracks packing
and transfers, generates roll-level QR labels, and finally manages
scanning and vehicle dispatch.

The primary goal is:

> **Eliminate duplicate manual entry of Delivery Challan data while
> creating a dedicated operational workflow for godowns and dispatch.**

The existing System 1 remains the source for Delivery Challan
generation.

The Dispatch System becomes the source for:

-   Godown processing
-   Packing
-   Roll creation
-   Roll-level tracking
-   QR generation
-   QR scanning
-   Vehicle loading
-   Dispatch tracking
-   Operational notifications
-   Audit history

------------------------------------------------------------------------

# 2. High-Level Architecture

``` text
                         SYSTEM 1
                  Delivery Challan System
                           │
                           │
                 REST API / Webhook
                           │
                           ▼
                 ┌───────────────────┐
                 │ Dispatch Backend  │
                 │ Node + Express    │
                 │ Sync / Validation │
                 └─────────┬─────────┘
                           │
                           ▼
                      ┌─────────┐
                      │ MongoDB │
                      └────┬────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        Godown Screens  Godown Users  Dispatch Office
              │            │            │
              └────────────┼────────────┘
                           │
                           ▼
                         Rolls
                           │
                           ▼
                          QR
                           │
                           ▼
                         Scan
                           │
                           ▼
                        Vehicle
                           │
                           ▼
                        Dispatch
```

------------------------------------------------------------------------

# 3. Integration Strategy

## Preferred Integration

``` text
System 1
   │
   ├── REST API
   │
   └── Webhook (if available)
            │
            ▼
      Dispatch Backend
```

The Dispatch System should request/provision:

-   Delivery Challan ID
-   Challan Number
-   Created Date & Time
-   Updated Date & Time
-   Bill To
-   Bill Address
-   Bill GSTIN
-   Screen Name
-   Item Name
-   Quantity
-   Godown ID
-   Mistry
-   Delivery Type
-   Other relevant DC fields

## Webhook

If System 1 supports webhooks:

``` text
New DC Created
      ↓
System 1 Webhook
      ↓
Dispatch Backend
      ↓
Validate
      ↓
Save to MongoDB
      ↓
Create Godown Jobs
      ↓
Socket.IO notification
```

## API Polling

If webhook is unavailable:

``` text
Dispatch Backend
      ↓
Periodic API request
      ↓
Fetch records using:
- updatedAt
- createdAt
- incremental ID
      ↓
Detect new/changed records
      ↓
Sync MongoDB
```

## Google Sheets Fallback

If API integration is not available:

``` text
System 1
   ↓
Google Spreadsheet
   ↓
Google Sheets API
   ↓
Dispatch Backend
   ↓
MongoDB
```

Google Sheets should preferably be treated as an integration/reporting
source, not as the operational database.

------------------------------------------------------------------------

# 4. Source Data From System 1

Expected Delivery Challan information:

  Field           Description
  --------------- --------------------------------------------
  Date & Time     DC creation date/time
  Challan No      Unique Delivery Challan number
  Source ID       Immutable ID from System 1
  Bill To         Customer/company
  Bill Address    Customer billing address
  Bill GSTIN      Customer GSTIN
  Screen Name     Product/screen/category
  Item Name       Specific product
  QTY             Quantity
  Godown          Godown code such as `S-28`
  Mistry          Responsible person
  Delivery Type   Party vehicle / company vehicle
  Status          Source/operational status where applicable
  Roll Qty        Operational roll quantity
  Updated At      Last source-system update

------------------------------------------------------------------------

# 5. Data Ownership

A critical design rule:

## System 1 owns source/DC information

System 1 should remain responsible for:

-   DC generation
-   Customer information
-   Billing information
-   Original item information
-   Original quantity
-   Original DC identity

## Dispatch System owns operational information

Dispatch System should be responsible for:

-   Godown assignment/processing
-   Packing
-   Roll creation
-   Roll quantity distribution
-   Transfers
-   QR codes
-   QR scanning
-   Vehicle information
-   Loading
-   Dispatch status
-   Operational notifications
-   Audit history

This prevents synchronization from accidentally overwriting dispatch
operations.

------------------------------------------------------------------------

# 6. Delivery Challan Lifecycle

``` text
DC CREATED
    ↓
IMPORTED
    ↓
GODOWN ASSIGNED
    ↓
GODOWN RECEIVED
    ↓
PROCESSING
    ↓
PACKING
    ↓
PACKED
    ↓
ROLL CREATED
    ↓
QR GENERATED
    ↓
READY FOR DISPATCH
    ↓
SCANNED
    ↓
LOADED
    ↓
DISPATCHED
```

Possible alternate path:

``` text
PROCESSING
    ↓
ON HOLD
    ↓
PROCESSING
```

Transfer path:

``` text
GODOWN A
    ↓
TRANSFER REQUESTED
    ↓
TRANSFERRED
    ↓
GODOWN B
    ↓
RECEIVED
    ↓
PROCESSING
```

------------------------------------------------------------------------

# 7. Multiple Godown Handling

Each godown receives a unique alphanumeric identifier.

Examples:

``` text
S-28
S-17
S-04
S-32
M-12
G-08
```

Godown IDs must be unique.

Example DC:

``` text
DC-2026-00982

Item A → S-28
Item B → S-28
Item C → S-17
Item D → S-04
```

The system creates separate operational jobs:

``` text
DC-00982
│
├── S-28 Job
│   ├── Item A
│   └── Item B
│
├── S-17 Job
│   └── Item C
│
└── S-04 Job
    └── Item D
```

The original DC remains one DC.

------------------------------------------------------------------------

# 8. Godown Screen

## Purpose

A Godown Screen is a dedicated display running continuously on a TV,
monitor, or large display.

The screen is linked to exactly one godown.

Example:

``` text
SCREEN ID: S28-TV-01
GODOWN: S-28
```

## Screen Characteristics

-   Full-screen UI
-   No unnecessary navigation
-   Large typography
-   High visibility
-   Dark/light display mode as configured
-   Live status updates
-   Real-time notifications
-   Sound alerts
-   Auto reconnect
-   Connection indicator
-   Current date/time
-   Godown identifier
-   Today's jobs

## Example Screen

``` text
┌───────────────────────────────────────────────────────────────┐
│ S-28                                      ● ONLINE            │
│ GODOWN DISPATCH                         22 SEP 2026 04:45 PM  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ TODAY'S DELIVERY CHALLANS                                     │
│                                                               │
│ DC-00982   ABC INTERIORS      25 QTY      PACKING             │
│ DC-00983   XYZ DESIGNS        12 QTY      PENDING             │
│ DC-00984   STUDIO XYZ         18 QTY      ON HOLD             │
│ DC-00985   DESIGN HOUSE       30 QTY      PACKED              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 9. Godown Screen New Order Notification

When a new DC/job belonging to the logged-in godown arrives, the screen
immediately displays a notification.

## Position

Top-right corner.

## Example

``` text
                              ┌──────────────────────────────┐
                              │ 🔔 NEW DELIVERY CHALLAN      │
                              │                              │
                              │ DC-2026-00982                │
                              │ ABC INTERIORS                │
                              │                              │
                              │ BURL LAMINATE                │
                              │ QTY: 25                      │
                              │                              │
                              │ GODOWN: S-28                 │
                              └──────────────────────────────┘
```

## Notification Behavior

1.  Detect new job.
2.  Play notification sound.
3.  Show top-right popup.
4.  Highlight new row in table.
5.  Keep notification visible for configurable duration.
6.  Allow manual dismiss.
7.  Mark as seen/read.
8.  Preserve event in notification history.

------------------------------------------------------------------------

# 10. Notification Sound

The Godown Screen should support sound alerts.

Requirements:

-   Short professional notification sound
-   Configurable volume
-   Admin can enable/disable sound
-   Browser audio restrictions must be handled
-   Screen should provide a one-time "Enable Sound" action if browser
    autoplay blocks audio
-   New events should not create overlapping uncontrolled sounds
-   Sound should be different from critical/error alerts if required

Recommended event types:

``` text
NEW_DC
TRANSFER_RECEIVED
PACKED_READY
URGENT
SYSTEM_ERROR
```

------------------------------------------------------------------------

# 11. Godown User Screen

Godown users can access the system from:

-   Desktop
-   Laptop
-   Tablet
-   Mobile

Their account is linked to one or more permitted godowns.

Example:

``` text
User: Rajesh
Role: Godown Operator
Godown: S-28
```

## User Dashboard

``` text
┌──────────────────────────────────────────────┐
│ S-28                                         │
│ Godown Dashboard                             │
├──────────────────────────────────────────────┤
│                                              │
│ Pending              08                      │
│ Processing            04                     │
│ Packing               03                     │
│ Packed                06                     │
│ Transfer              02                     │
│ On Hold               01                     │
│                                              │
└──────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 12. Godown Job Details

Example:

``` text
DC-2026-00982

Customer:
ABC Interiors

Bill Address:
...

GSTIN:
...

Delivery Type:
COMPANY VEHICLE

Godown:
S-28

Items:

Burl 01        10
Burl 02         8
Burl 03         7

Total Qty:
25
```

Available actions:

``` text
[ START PROCESSING ]
[ ON HOLD ]
[ REQUEST TRANSFER ]
[ PACK ]
```

The available actions depend on the user's role and configured workflow.

------------------------------------------------------------------------

# 13. Packing Workflow

Example:

``` text
DC Qty = 25

Roll 1 = 8
Roll 2 = 8
Roll 3 = 9
```

The system should validate:

``` text
8 + 8 + 9 = 25
```

The user should not be able to accidentally create:

``` text
8 + 8 + 10 = 26
```

unless an authorized override is explicitly allowed.

------------------------------------------------------------------------

# 14. Roll-Level Tracking

Each physical roll should have its own unique ID.

Example:

``` text
ROLL-DC00982-01
ROLL-DC00982-02
ROLL-DC00982-03
```

Roll information:

``` text
Roll ID
DC No
Item
Godown
Quantity
Packing Date
Packed By
QR ID
Current Status
Current Location
Dispatch Status
```

------------------------------------------------------------------------

# 15. QR Generation

QR codes should identify the physical roll rather than only the Delivery
Challan.

Example:

``` text
QR
 ↓
ROLL-DC00982-01
```

The QR should resolve to the Dispatch System and show the roll's
authorized tracking information.

Example:

``` text
ABC INTERIORS

DC:
DC-00982

ITEM:
BURL LAMINATE

ROLL:
01 / 03

QTY:
8

GODOWN:
S-28

STATUS:
READY FOR DISPATCH
```

------------------------------------------------------------------------

# 16. Dispatch Office

The Dispatch Office is the final operational point before loading the
vehicle.

Main responsibilities:

-   View packed rolls
-   Generate QR labels
-   Print QR labels
-   Scan rolls
-   Verify roll/DC/customer
-   Assign vehicle
-   Record loading
-   Mark dispatch
-   Review dispatch history

------------------------------------------------------------------------

# 17. Dispatch Office Dashboard

``` text
┌──────────────────────────────────────────────────────────────┐
│ DISPATCH OFFICE                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ PACKED           18                                          │
│ QR GENERATED     15                                          │
│ READY             12                                         │
│ LOADED             7                                         │
│ DISPATCHED        32                                         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ READY FOR DISPATCH                                           │
│                                                              │
│ DC        CUSTOMER          GODOWN    ROLLS      ACTION      │
│ 00982     ABC Interiors     S-28        3        OPEN        │
│ 00983     XYZ Designs       S-17        2        OPEN        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 18. QR Scanning Workflow

``` text
SCAN QR
   ↓
Find Roll
   ↓
Validate Roll
   ↓
Display Roll Information
   ↓
Confirm
   ↓
Mark Scanned
   ↓
Assign/Confirm Vehicle
   ↓
Mark Loaded
   ↓
Dispatch
```

Example scan result:

``` text
┌─────────────────────────────────────┐
│ ROLL VERIFIED ✓                     │
├─────────────────────────────────────┤
│ Customer: ABC Interiors             │
│ DC: DC-00982                        │
│ Item: Burl Laminate                 │
│ Roll: 01                            │
│ Qty: 8                              │
│ Godown: S-28                        │
│                                     │
│ Status: READY FOR DISPATCH          │
│                                     │
│ [ MARK LOADED ]                     │
└─────────────────────────────────────┘
```

------------------------------------------------------------------------

# 19. Vehicle Management

Delivery Type:

``` text
PARTY_VEHICLE
COMPANY_VEHICLE
```

Future options can include:

``` text
TRANSPORTER
THIRD_PARTY
SELF_PICKUP
```

For company vehicles:

``` text
Vehicle Number
Driver Name
Driver Mobile
```

For party vehicles:

``` text
Vehicle Number
Driver Name
Driver Mobile
```

can be recorded when the vehicle arrives.

------------------------------------------------------------------------

# 20. Vehicle Loading

Before loading:

``` text
Vehicle:
GJ-XX-1234

Customer:
ABC Interiors

DC:
DC-00982

Required Rolls:
3
```

The operator scans:

``` text
ROLL-DC00982-01 ✓
ROLL-DC00982-02 ✓
ROLL-DC00982-03 ✓
```

System:

``` text
3 / 3 ROLLS VERIFIED
```

Then:

``` text
[ CONFIRM LOADING ]
```

After confirmation:

``` text
LOADED
```

------------------------------------------------------------------------

# 21. Dispatch Completion

Once all required rolls are loaded:

``` text
READY
 ↓
LOADING
 ↓
LOADED
 ↓
DISPATCHED
```

The system records:

-   Dispatch date/time
-   Vehicle
-   Driver
-   Operator
-   Rolls
-   DC
-   Customer
-   Godown
-   Scan history

------------------------------------------------------------------------

# 22. Transfer Between Godowns

Transfers must be tracked separately from normal packing.

Example:

``` text
S-28
   │
   │ Transfer Request
   ▼
S-17
```

Status:

``` text
TRANSFER_REQUESTED
TRANSFER_APPROVED
TRANSFER_IN_TRANSIT
TRANSFERRED
RECEIVED
```

The receiving godown must confirm receipt.

Example:

``` text
S-17

TRANSFER RECEIVED

DC-00982
Item: Burl 02
Qty: 8

[ CONFIRM RECEIVED ]
```

------------------------------------------------------------------------

# 23. Overall DC Status

If a DC contains multiple godowns:

``` text
DC-00982

S-28 → PACKED
S-17 → PACKED
S-04 → PROCESSING
```

Overall status:

``` text
IN_PROGRESS
```

Only after all required work is complete:

``` text
READY_FOR_DISPATCH
```

This prevents one godown from accidentally marking the entire DC
complete.

------------------------------------------------------------------------

# 24. Recommended Roles

## Super Admin

Full access:

-   Users
-   Roles
-   Godowns
-   Screens
-   DCs
-   Rolls
-   QR
-   Dispatch
-   Vehicles
-   Integrations
-   Settings
-   Audit logs

## Admin

Operational and configuration access.

## Dispatch Manager

-   Packed orders
-   Roll management
-   QR generation
-   Scanning
-   Vehicle loading
-   Dispatch

## Dispatch Operator

-   View packed orders
-   Generate QR
-   Print QR
-   Scan rolls
-   Loading operations

## Godown Manager

-   View assigned godown
-   Process jobs
-   Packing
-   Transfers
-   Manage godown workflow

## Godown Operator

-   View assigned jobs
-   Update permitted statuses
-   Confirm packing
-   Confirm transfers

## Management / Viewer

Read-only access to dashboards and reports.

## Godown Screen

Device-only role:

-   View jobs
-   Receive live events
-   Show notifications
-   Play sound
-   No operational modifications

------------------------------------------------------------------------

# 25. Login & Security

Users should not be forced to log in every day, but authentication must
remain revocable.

Recommended architecture:

``` text
Login
 ↓
Access Token
 +
Refresh Token / Session
 ↓
Long-lived session
```

Admin can:

-   Logout device
-   Revoke session
-   Disable user
-   Force logout all sessions
-   Reset password
-   Review active sessions

Security requirements:

-   Password hashing
-   HTTPS
-   Secure cookies where applicable
-   Refresh-token rotation
-   Rate limiting
-   Helmet
-   CORS restrictions
-   Input validation
-   MongoDB query validation
-   RBAC
-   Audit logs
-   Login attempt protection
-   Device/session management
-   No secrets in frontend
-   Environment variables for credentials

------------------------------------------------------------------------

# 26. Godown Screen Pairing

A permanently running TV should not require daily password entry.

Example:

``` text
Screen ID:
S28-TV-01

Pair Code:
8F72-K9
```

Admin opens:

``` text
Settings → Screens → Pair Screen
```

Selects:

``` text
Godown:
S-28

Screen:
S28-TV-01
```

After pairing:

``` text
S28-TV-01
     ↓
Godown S-28
```

The screen automatically receives only S-28 events.

------------------------------------------------------------------------

# 27. Real-Time Communication

Use **Socket.IO**.

Example channels/rooms:

``` text
godown:S-28
godown:S-17
godown:S-04
dispatch-office
admin
```

When S-28 receives a new DC:

``` text
Backend
  ↓
Socket.IO
  ↓
godown:S-28
  ↓
S-28 TV
  ↓
S-28 Users
```

When S-28 marks an item packed:

``` text
Godown User
  ↓
API
  ↓
MongoDB
  ↓
Socket.IO
  ↓
Godown Screen
  +
Dispatch Office
```

------------------------------------------------------------------------

# 28. Notification Types

  Event                Target                  Sound
  -------------------- ----------------------- ----------
  New DC               Godown                  Yes
  New item             Godown                  Yes
  Transfer request     Source Godown           Yes
  Transfer received    Receiving Godown        Yes
  Packed               Dispatch Office         Yes
  QR generated         Dispatch Office         Optional
  Roll scanned         Dispatch Office         Optional
  Loading completed    Dispatch Office/Admin   Yes
  Dispatch completed   Admin/Management        Optional
  Integration error    Admin                   Yes
  System offline       Screen/Admin            Optional

------------------------------------------------------------------------

# 29. Admin Dashboard

Main metrics:

``` text
TODAY

DC RECEIVED              42
PENDING                   9
PROCESSING               12
PACKING                   8
PACKED                   15
READY FOR DISPATCH        6
DISPATCHED               21
ON HOLD                   3
```

Godown overview:

``` text
S-28
Pending: 8
Packing: 3
Packed: 7

S-17
Pending: 4
Packing: 2
Packed: 9

S-04
Pending: 2
Packing: 1
Packed: 4
```

------------------------------------------------------------------------

# 30. Integration Dashboard

Admin should be able to see:

``` text
SYSTEM 1 INTEGRATION

Connection:
● ONLINE

Last Sync:
16:42:10

Records Today:
42

Successful:
40

Failed:
2

Last Error:
API Timeout
```

Actions:

``` text
[ SYNC NOW ]
[ RETRY FAILED ]
[ VIEW LOGS ]
```

------------------------------------------------------------------------

# 31. Sync Logs

Every synchronization operation should be logged.

Example:

``` text
09:42:12
System 1 API
DC-00982
SUCCESS

09:43:10
System 1 API
DC-00983
SUCCESS

09:44:02
System 1 API
DC-00984
FAILED
Reason: API timeout
```

This is important for debugging and auditability.

------------------------------------------------------------------------

# 32. Audit Logs

Track important actions:

``` text
User
Action
Entity
Entity ID
Old Value
New Value
Date/Time
IP / Device where appropriate
```

Example:

``` text
Rajesh
UPDATED_STATUS
DC-00982
PROCESSING → PACKED
22 Sep 2026 16:40
```

------------------------------------------------------------------------

# 33. MongoDB Collections

Recommended initial collections:

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

------------------------------------------------------------------------

# 34. Important Entity Relationships

``` text
DeliveryChallan
      │
      ├── DeliveryItems
      │
      ├── GodownJobs
      │       │
      │       ├── Packing
      │       └── Transfers
      │
      └── Rolls
              │
              └── QR
                     │
                     └── Dispatch
                            │
                            └── Vehicle
```

------------------------------------------------------------------------

# 35. Suggested API Structure

## Authentication

``` text
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/revoke-session
```

## Delivery Challans

``` text
GET  /api/delivery-challans
GET  /api/delivery-challans/:id
POST /api/delivery-challans/sync
```

## Godowns

``` text
GET  /api/godowns
GET  /api/godowns/:id
POST /api/godowns
PATCH /api/godowns/:id
```

## Godown Jobs

``` text
GET   /api/godown-jobs
GET   /api/godown-jobs/:id
PATCH /api/godown-jobs/:id/status
POST  /api/godown-jobs/:id/transfer
POST  /api/godown-jobs/:id/pack
```

## Rolls

``` text
GET  /api/rolls
GET  /api/rolls/:id
POST /api/rolls
PATCH /api/rolls/:id
```

## QR

``` text
POST /api/qr/generate
POST /api/qr/scan
GET  /api/qr/:id
```

## Dispatch

``` text
GET   /api/dispatch
POST  /api/dispatch
PATCH /api/dispatch/:id
POST  /api/dispatch/:id/load
POST  /api/dispatch/:id/complete
```

## Screens

``` text
GET  /api/screens
POST /api/screens/pair
POST /api/screens/:id/revoke
```

------------------------------------------------------------------------

# 36. Frontend Routes

``` text
/login

/dashboard

/delivery-challans
/delivery-challans/:id

/godowns
/godowns/:id
/godown/jobs/:id

/godown-screen/:godownCode

/packing

/transfers

/rolls
/rolls/:id

/qr
/qr/generate
/qr/scan

/dispatch
/dispatch/:id

/vehicles

/notifications

/users
/roles
/screens

/integration
/sync-logs

/audit-logs

/settings
```

------------------------------------------------------------------------

# 37. UI/UX Requirements

## General

-   Premium clean interface
-   Minimal visual clutter
-   Normal CSS only
-   Responsive layout
-   CSS variables
-   Reusable components
-   Clear status colors
-   Accessible contrast
-   Touch-friendly controls
-   Keyboard support where useful
-   Loading states
-   Empty states
-   Error states
-   Skeleton loaders
-   Toast notifications
-   Confirmation dialogs
-   No unnecessary animations

## Mobile

Prioritize:

-   Quick status update
-   Job details
-   Transfer
-   Packing
-   QR scanning
-   Notifications

## Desktop

Prioritize:

-   Tables
-   Filters
-   Dashboards
-   Multi-column details
-   Dispatch operations

## Big Screen

Prioritize:

-   Large typography
-   Status visibility
-   Minimal controls
-   Live updates
-   Notification popup
-   Sound
-   Connection status

------------------------------------------------------------------------

# 38. Responsive Screen Modes

``` text
Mobile
< 768px

Tablet
768px – 1023px

Desktop
1024px – 1599px

Large Display
1600px+
```

Godown Screen should also support:

``` text
1920 × 1080
2560 × 1440
3840 × 2160
```

------------------------------------------------------------------------

# 39. PWA Requirements

The application should support:

-   Installable PWA
-   App icon
-   Offline shell
-   Service worker
-   Cached static assets
-   Auto reconnect
-   Connection status
-   Push notifications where appropriate
-   Full-screen display mode
-   Persistent screen mode

Operational actions that require the server should not falsely appear
successful while offline.

------------------------------------------------------------------------

# 40. Error Handling

The UI should clearly handle:

``` text
Internet disconnected
API unavailable
System 1 unavailable
MongoDB unavailable
Socket disconnected
Invalid QR
Duplicate QR
Roll already dispatched
DC not found
Godown not authorized
Session expired
Sync failed
```

Example:

``` text
┌──────────────────────────────────────┐
│ CONNECTION LOST                      │
│                                      │
│ The system is offline.               │
│ We will reconnect automatically.     │
│                                      │
│ ● Reconnecting...                    │
└──────────────────────────────────────┘
```

------------------------------------------------------------------------

# 41. Duplicate Prevention

The integration must use the System 1 unique ID.

Recommended unique indexes:

``` text
sourceSystem + sourceId
```

and:

``` text
challanNo
```

where business rules permit.

The same DC must never be imported twice.

Example:

``` text
System 1:
ID = 982
DC = DC-00982
```

If fetched again:

``` text
ID = 982
```

the system updates/checks the existing record rather than creating a
duplicate.

------------------------------------------------------------------------

# 42. Operational Rules

### Rule 1

A Godown user can only access authorized godowns.

### Rule 2

A Godown Screen can only display its paired godown.

### Rule 3

A roll cannot be dispatched twice.

### Rule 4

A QR must uniquely identify one roll.

### Rule 5

Roll quantity must match configured DC/item quantities unless an
authorized override exists.

### Rule 6

A multi-godown DC is not globally ready until all required godown jobs
are completed.

### Rule 7

Every important status change creates an audit record.

### Rule 8

System 1 synchronization must not overwrite local operational fields.

------------------------------------------------------------------------

# 43. Security Model

``` text
Internet
   ↓
HTTPS
   ↓
Nginx
   ↓
Express API
   ↓
Authentication
   ↓
RBAC
   ↓
Validation
   ↓
MongoDB
```

Recommended:

-   HTTPS only
-   Secure environment variables
-   Strong password hashing
-   Rate limiting
-   Helmet
-   CORS whitelist
-   Request validation
-   Role/permission checks
-   MongoDB indexes
-   Audit logs
-   Session revocation
-   QR validation
-   API authentication
-   Integration credentials isolated from frontend

------------------------------------------------------------------------

# 44. Recommended Status Configuration

Initial statuses:

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

The Admin should eventually be able to configure which statuses are
available to which roles.

------------------------------------------------------------------------

# 45. Delivery Type

Initial values:

``` text
PARTY_VEHICLE
COMPANY_VEHICLE
```

Future:

``` text
TRANSPORTER
THIRD_PARTY
SELF_PICKUP
```

The Delivery Type should influence the Dispatch workflow.

------------------------------------------------------------------------

# 46. Notification Flow Example

## New DC

``` text
System 1
 ↓
API/Webhook
 ↓
Backend
 ↓
MongoDB
 ↓
Identify Godown S-28
 ↓
Socket.IO → S-28
 ↓
TV Popup
 ↓
Sound
 ↓
Godown User Notification
```

## Packed

``` text
Godown User
 ↓
PACKED
 ↓
MongoDB
 ↓
Socket.IO
 ↓
Dispatch Office
 ↓
"NEW PACKED ORDER"
```

## QR Scan

``` text
Dispatch Operator
 ↓
Scan QR
 ↓
Backend validation
 ↓
Roll found
 ↓
Show roll details
 ↓
Confirm
 ↓
LOADED
```

------------------------------------------------------------------------

# 47. Example Complete Journey

``` text
STEP 01
System 1 generates DC-00982
        ↓

STEP 02
Dispatch API receives DC
        ↓

STEP 03
MongoDB stores source information
        ↓

STEP 04
System identifies S-28
        ↓

STEP 05
Godown Job created
        ↓

STEP 06
S-28 TV receives live notification
        ↓

STEP 07
Sound plays
        ↓

STEP 08
Godown user opens job
        ↓

STEP 09
User starts processing
        ↓

STEP 10
User packs:
8 + 8 + 9 = 25
        ↓

STEP 11
System creates 3 Rolls
        ↓

STEP 12
Dispatch Office receives PACKED notification
        ↓

STEP 13
Dispatch Operator generates QR
        ↓

STEP 14
QR labels are printed and attached
        ↓

STEP 15
Vehicle arrives
        ↓

STEP 16
Operator scans Roll 01
        ↓
Roll 02
        ↓
Roll 03
        ↓

STEP 17
System verifies 3/3
        ↓

STEP 18
Vehicle loading confirmed
        ↓

STEP 19
DISPATCHED
        ↓

STEP 20
Audit trail completed
```

------------------------------------------------------------------------

# 48. Initial MVP

The first release should focus on:

### Phase 1 --- Foundation

-   Authentication
-   Roles
-   Godowns
-   Users
-   MongoDB
-   System 1 API integration
-   DC import
-   Audit logs

### Phase 2 --- Godown

-   Godown dashboard
-   Godown jobs
-   Godown Screen
-   Live Socket.IO updates
-   Notification popup
-   Sound
-   Status management

### Phase 3 --- Packing

-   Packing workflow
-   Roll creation
-   Roll quantity validation
-   Transfer workflow

### Phase 4 --- QR

-   QR generation
-   QR printing
-   QR scanning
-   Roll verification

### Phase 5 --- Dispatch

-   Vehicle management
-   Loading
-   Dispatch
-   Dispatch history

### Phase 6 --- Advanced

-   Reports
-   Analytics
-   Integration dashboard
-   Advanced permissions
-   Push notifications
-   Offline improvements
-   Export
-   Performance monitoring

------------------------------------------------------------------------

# 49. Future Enhancements

Potential future features:

-   WhatsApp notifications
-   SMS notifications
-   Driver application
-   Customer tracking page
-   Customer delivery confirmation
-   Digital Proof of Delivery
-   Delivery photos
-   Signature capture
-   GPS tracking
-   Barcode support
-   Thermal label printing
-   Printer integration
-   Advanced reports
-   Godown productivity reports
-   Dispatch performance analytics
-   Automatic reconciliation with System 1

------------------------------------------------------------------------

# 50. Key Design Principle

The application should always answer:

> **Where is this physical roll right now?**

The system should be able to trace:

``` text
Customer
   ↓
DC
   ↓
Item
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

This roll-level traceability is the core purpose of the Dispatch System.

------------------------------------------------------------------------

# 51. Final Recommended Architecture

``` text
                         ┌─────────────────────────┐
                         │        SYSTEM 1         │
                         │ Delivery Challan Source │
                         └────────────┬────────────┘
                                      │
                         REST API / Webhook
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │    DISPATCH BACKEND    │
                         │                         │
                         │ Node.js + Express       │
                         │ Authentication          │
                         │ RBAC                    │
                         │ Sync Engine             │
                         │ Validation              │
                         │ Socket.IO               │
                         └────────────┬────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │    MongoDB    │
                              └───────┬───────┘
                                      │
             ┌────────────────────────┼────────────────────────┐
             │                        │                        │
             ▼                        ▼                        ▼
      ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
      │ GODOWN TV   │          │ GODOWN USER │          │  DISPATCH   │
      │             │          │             │          │   OFFICE    │
      │ Live Screen │          │ Mobile/PC   │          │ PC/Desktop  │
      │ Popup       │          │ Packing     │          │ QR/Scan     │
      │ Sound       │          │ Transfer    │          │ Vehicle     │
      └─────────────┘          └──────┬──────┘          └──────┬──────┘
                                      │                        │
                                      ▼                        ▼
                                   PACKING                    QR
                                      │                        │
                                      ▼                        ▼
                                    ROLLS                   SCANNING
                                      │                        │
                                      └───────────┬────────────┘
                                                  ▼
                                               VEHICLE
                                                  │
                                                  ▼
                                               DISPATCH
```

------------------------------------------------------------------------

# 52. Final Technical Decision

## Primary

``` text
System 1 API
       ↓
Dispatch Backend
       ↓
MongoDB
```

## Preferred enhancement

``` text
System 1 Webhook
       ↓
Dispatch Backend
```

## Fallback

``` text
Google Sheets API
       ↓
Dispatch Backend
```

## Real-time

``` text
Socket.IO
```

## Frontend

``` text
React + Vite + Normal CSS + PWA
```

## Backend

``` text
Node.js + Express
```

## Database

``` text
MongoDB
```

## Physical tracking

``` text
Roll-level QR
```

## Screen

``` text
Dedicated Godown Screen Mode
```

## Authentication

``` text
Long-lived revocable sessions
+
RBAC
+
Device management
```

------------------------------------------------------------------------

# 53. Immediate Requirements From System 1 Developer

Before development starts, obtain:

-   API base URL
-   API documentation
-   Authentication method
-   Delivery Challan endpoint
-   Unique DC/source ID
-   Item-level data structure
-   Godown field
-   Created timestamp
-   Updated timestamp
-   Cancellation/edit behavior
-   Pagination
-   Rate limits
-   Webhook availability
-   Webhook authentication
-   Error response format
-   Test/staging API
-   Sample JSON response

If API is unavailable, obtain:

-   Google Sheet ID/access
-   Google Sheets API access
-   Sheet structure
-   Unique DC ID
-   Update timestamp
-   Rules for edited/cancelled DCs

------------------------------------------------------------------------

# 54. Project Success Criteria

The system is considered operationally successful when:

-   A DC is entered only once in System 1.
-   Dispatch System automatically receives the DC.
-   Correct godown receives the job.
-   Godown TV shows the new order immediately.
-   Notification sound plays.
-   Godown user can process the job.
-   Multiple godowns can independently process one DC.
-   Transfers are tracked.
-   Packing creates physical roll records.
-   Roll quantities are validated.
-   QR labels identify individual rolls.
-   Dispatch office can scan rolls.
-   Vehicle loading can be verified.
-   Final dispatch is recorded.
-   Every important action is auditable.
-   Users remain securely logged in without daily re-login.
-   Admin can revoke access at any time.
-   System works across mobile, PC and large screens.
-   System 1 remains the DC source while Dispatch System owns
    operational tracking.
