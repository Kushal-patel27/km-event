# Entity-Relationship Diagram - K&M Event Management System

## ER Diagram

```mermaid
erDiagram
 erDiagram
    USER ||--o{ EVENT : organizes
    USER ||--o{ BOOKING : makes
    USER ||--o{ EVENT_REQUEST : submits
    USER ||--o{ ENTRY_LOG : scans
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ CONTACT : submits
    USER ||--o{ FAQ : creates
    USER ||--o{ HELP_ARTICLE : creates
    USER ||--o{ CATEGORY : creates
    USER ||--o{ SECURITY_EVENT : generates
    USER }o--o{ EVENT : "assigned_to_staff"

    EVENT ||--o{ BOOKING : has
    EVENT ||--o{ ENTRY_LOG : tracks
    EVENT ||--o{ FEATURE_TOGGLE : configures
    EVENT }o--|| CATEGORY : belongs_to

    BOOKING ||--o{ ENTRY_LOG : generates

    SUBSCRIPTION_PLAN ||--o{ EVENT : applies_to

    NOTIFICATION_TEMPLATE ||--o{ NOTIFICATION : based_on

    USER {
        ObjectId _id PK
        string name
        string email UK
        string password
        string googleId UK
        string role
        boolean active
        number tokenVersion
        ObjectId[] assignedEvents
        string[] assignedGates
        ObjectId assignedBy FK
        object[] sessions
        date lastLoginAt
        object preferences
        object passwordReset
        date createdAt
        date updatedAt
    }

    EVENT {
        ObjectId _id PK
        string title
        string description
        date date
        string location
        string locationDetails
        number price
        string image
        number totalTickets
        number availableTickets
        string category
        string status
        ObjectId organizer FK
        object[] assignedStaff
        object[] ticketTypes
        object[] gates
        boolean enableQR
        boolean enableSeating
        object seatMap
        date createdAt
        date updatedAt
    }

    BOOKING {
        ObjectId _id PK
        ObjectId user FK
        ObjectId event FK
        object ticketType
        number quantity
        number totalAmount
        number[] seats
        string[] ticketIds
        string qrCode
        object[] qrCodes
        string status
        object[] scans
        date lastScannedAt
        date createdAt
        date updatedAt
    }

    EVENT_REQUEST {
        ObjectId _id PK
        ObjectId organizerId FK
        string organizerName
        string organizerEmail
        string organizerPhone
        string organizerCompany
        string title
        string description
        string category
        date date
        string location
        string locationDetails
        number price
        string image
        number totalTickets
        number availableTickets
        object[] ticketTypes
        object[] gates
        string status
        string rejectionReason
        ObjectId reviewedBy FK
        date reviewedAt
        date createdAt
        date updatedAt
    }

    ENTRY_LOG {
        ObjectId _id PK
        ObjectId event FK
        ObjectId booking FK
        string qrCodeId
        ObjectId staff FK
        string gateId
        string gateName
        string scanMethod
        string ticketStatus
        date scannedAt
        date approvedAt
        ObjectId approvedBy FK
        string notes
        string ipAddress
        boolean isDuplicate
        number duplicateAttemptNumber
        ObjectId originalScanId FK
        string deviceId
        string deviceName
        string deviceType
        date localTimestamp
        date syncedAt
        boolean isOfflineSync
        number validationTime
        boolean cacheHit
        date createdAt
        date updatedAt
    }

    CATEGORY {
        ObjectId _id PK
        string name UK
        boolean isDefault
        ObjectId createdBy FK
        number usageCount
        boolean isActive
        date createdAt
        date updatedAt
    }

    SUBSCRIPTION_PLAN {
        ObjectId _id PK
        string name UK
        string displayName
        string description
        number price
        object features
        object limits
        boolean isActive
        number displayOrder
        boolean mostPopular
        date createdAt
        date updatedAt
    }

    FEATURE_TOGGLE {
        ObjectId _id PK
        ObjectId eventId FK
        object features
        ObjectId toggledBy FK
        date createdAt
        date updatedAt
    }

    NOTIFICATION {
        ObjectId _id PK
        string subject
        string title
        string html
        string messageType
        string recipientType
        string dedupKey
        number sentCount
        string status
        object admin
        string error
        date createdAt
        date updatedAt
    }

    NOTIFICATION_TEMPLATE {
        ObjectId _id PK
        string name
        string subject
        string title
        string html
        string messageType
        object createdBy
        date createdAt
        date updatedAt
    }

    CONTACT {
        ObjectId _id PK
        string name
        string email
        string subject
        string message
        ObjectId userId FK
        string status
        string reply
        date replyDate
        date createdAt
        date updatedAt
    }

    FAQ {
        ObjectId _id PK
        string category
        string question
        string answer
        boolean isActive
        number viewCount
        ObjectId createdBy FK
        ObjectId updatedBy FK
        date createdAt
        date updatedAt
    }

    HELP_ARTICLE {
        ObjectId _id PK
        string category
        string title
        string description
        string[] steps
        number order
        boolean isActive
        ObjectId createdBy FK
        ObjectId updatedBy FK
        date createdAt
        date updatedAt
    }

    ABOUT {
        ObjectId _id PK
        string mission
        string description
        string vision
        string[] values
        object[] team
        object stats
        object socialLinks
        object contactInfo
        ObjectId updatedBy FK
        date createdAt
        date updatedAt
    }

    ORGANIZERS_PAGE_CONTENT {
        ObjectId _id PK
        object hero
        object benefits
        object steps
        object subscriptionPlans
        object testimonials
        object faqs
        object cta
        ObjectId updatedBy FK
        date createdAt
        date updatedAt
    }

    SECURITY_EVENT {
        ObjectId _id PK
        ObjectId user FK
        string email
        string type
        string ip
        string userAgent
        object metadata
        date createdAt
        date updatedAt
    }

    SYSTEM_CONFIG {
        string _id PK
        object qrCodeRules
        object ticketLimits
        object security
        object notifications
        date createdAt
    }

 ?
```

## Entity Descriptions

### Core Entities

#### USER
- **Primary Entity**: Manages all users in the system including regular users, staff, and various admin roles
- **Roles**: user, staff, event_admin, staff_admin, admin, super_admin
- **Key Features**: 
  - OAuth integration (Google)
  - Session management
  - Staff assignment to events and gates
  - Hierarchical assignment tracking

#### EVENT
- **Primary Entity**: Represents events that users can book
- **Key Features**:
  - Multiple ticket types
  - QR code and seating options
  - Gate/zone management
  - Staff assignment
  - Status tracking (scheduled, ongoing, completed, cancelled)

#### BOOKING
- **Primary Entity**: Manages ticket purchases
- **Key Features**:
  - Multiple QR codes per booking
  - Seat selection
  - Scan tracking
  - Unique ticket IDs

### Operational Entities

#### ENTRY_LOG
- **Purpose**: High-performance tracking of event entry scans
- **Key Features**:
  - Gate-wise tracking
  - Duplicate scan detection
  - Offline sync support
  - Device tracking
  - Performance metrics (cache hits, validation time)

#### EVENT_REQUEST
- **Purpose**: Manages event submission requests from organizers
- **Workflow**: pending → approved/rejected
- **Key Features**: Complete event details for approval

#### CATEGORY
- **Purpose**: Dynamic event categorization
- **Key Features**:
  - Default and user-created categories
  - Usage tracking
  - Active/inactive status

### Configuration Entities

#### SUBSCRIPTION_PLAN
- **Purpose**: Defines tiered pricing and features
- **Plans**: Basic, Standard, Professional, Enterprise
- **Key Features**:
  - One-time listing price per event
  - Feature toggles per plan
  - Limits and quotas

#### FEATURE_TOGGLE
- **Purpose**: Per-event feature enabling/disabling
- **Features**: ticketing, qrCheckIn, scannerApp, analytics, emailSms, payments, weatherAlerts, subAdmins, reports

#### SYSTEM_CONFIG
- **Purpose**: Global system settings (singleton)
- **Key Features**:
  - QR code rules
  - Ticket limits
  - Security settings
  - Notification settings

### Communication Entities

#### NOTIFICATION
- **Purpose**: System-generated notifications
- **Types**: offer, announcement, update, custom
- **Recipients**: all, registered, participants, staff

#### NOTIFICATION_TEMPLATE
- **Purpose**: Reusable notification templates

#### CONTACT
- **Purpose**: User contact/support requests
- **Workflow**: new → read → replied

### Content Entities

#### FAQ
- **Purpose**: Frequently Asked Questions
- **Categories**: Booking & Tickets, Tickets & Entry, Payment & Refunds, Account & Profile, Support & Help, Other

#### HELP_ARTICLE
- **Purpose**: Step-by-step help documentation

#### ABOUT
- **Purpose**: Company information (singleton)
- **Key Features**: mission, team, stats, social links

#### ORGANIZERS_PAGE_CONTENT
- **Purpose**: Organizer landing page content (singleton)

#### SECURITY_EVENT
- **Purpose**: Security audit logging
- **Tracks**: Login attempts, password resets, suspicious activities

## Key Relationships

### 1. User ↔ Event (One-to-Many)
- **As Organizer**: One user can organize multiple events
- **As Staff**: Many-to-many relationship (staff can be assigned to multiple events)

### 2. Event ↔ Booking (One-to-Many)
- One event can have multiple bookings
- Each booking references one event

### 3. Booking ↔ Entry Log (One-to-Many)
- Each booking can have multiple entry scans (duplicates tracked)
- Each entry log references one booking

### 4. User ↔ Entry Log (One-to-Many)
- Staff members create entry logs when scanning tickets
- Tracks which staff member performed each scan

### 5. Event ↔ Feature Toggle (One-to-One)
- Each event has one feature configuration
- Enables/disables features per event

### 6. Event ↔ Category (Many-to-One)
- Multiple events can belong to one category
- Category tracks usage count

### 7. User ↔ Event Request (One-to-Many)
- Organizers submit event requests for approval
- Tracks submission and review workflow

## Indexes & Performance

### High-Performance Indexes
- **Entry Log**: Compound indexes on (event, scannedAt), (event, gateId, scannedAt), (qrCodeId, event)
- **Security Event**: Indexes on createdAt and (email, createdAt)
- **Category**: Indexes on name and (isActive, isDefault)

### Unique Constraints
- **User**: email, googleId (sparse)
- **Category**: name
- **Booking**: ticketIds (array elements)
- **Feature Toggle**: eventId
- **Subscription Plan**: name

## Special Features

### 1. QR Code System
- High-performance scanning with Redis caching
- Duplicate detection and logging
- Offline sync capability
- Multiple QR codes per booking

### 2. Role-Based Access Control
- Hierarchical roles (super_admin → event_admin → staff_admin → staff → user)
- Event-specific assignments
- Gate/zone-based access for staff

### 3. Audit & Security
- Session tracking with token versioning
- Security event logging
- Password reset with OTP tracking
- Rate limiting metadata

### 4. Subscription & Features
- One-time pricing model
- Per-event feature toggles
- Plan-based limitations

### 5. Offline Support
- Entry logs support offline scanning
- Sync tracking with timestamps
- Device identification

## Data Flow

```
User Registration/Login
    ↓
Event Discovery (Categories)
    ↓
Event Booking (Subscription Plan Check)
    ↓
QR Code Generation (Feature Toggle Check)
    ↓
Entry Scanning (Entry Log + Duplicate Detection)
    ↓
Analytics & Reports
```

## System Integration Points

1. **Authentication**: Google OAuth + Local Auth
2. **Payment Processing**: Integrated with booking
3. **Email/SMS**: Notification system
4. **Cache Layer**: Redis for high-performance QR scanning
5. **File Storage**: Event images, QR codes
6. **Analytics**: Entry logs, booking statistics

---

*This ER diagram represents the complete database schema for the K&M Event Management System as of January 30, 2026.*
