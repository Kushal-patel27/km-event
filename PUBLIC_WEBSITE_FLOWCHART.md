# Public Website System Flow Chart

This document describes the complete system flow for end users interacting with the K&M Event Management public website.

---

## 1. Top-Level User Journey

```mermaid
flowchart TD
    Start([User Visits Website]) --> Home[Home Page]

    Home --> BrowseEvents[Browse / Search Events]
    Home --> InfoPages[Info Pages\nAbout · FAQ · Help · Contact\nPrivacy · Terms · Cookies]
    Home --> ForOrganizers[For Organizers Page]
    Home --> AuthEntry{Logged In?}

    AuthEntry -- No --> AuthFlow[Authentication Flow]
    AuthEntry -- Yes --> UserActions[Authenticated User Actions]

    BrowseEvents --> EventDetail[Event Detail Page]

    EventDetail --> CheckAuth{Logged In?}
    CheckAuth -- No --> AuthFlow
    CheckAuth -- Yes --> BookingFlow[Booking Flow]
    CheckAuth -- Yes --> WaitlistFlow[Join Waitlist\n/waitlist]

    AuthFlow --> UserActions

    UserActions --> BookingFlow
    UserActions --> MyBookings[My Bookings\n/my-bookings]
    UserActions --> CreateEventReq[Create Event Request\n/create-event]
    UserActions --> MyEventReqs[My Event Requests\n/my-event-requests]
    UserActions --> Settings[Account Settings\n/settings]
    UserActions --> Messages[Messages\n/messages]

    BookingFlow --> PaymentFlow[Payment Flow]
    PaymentFlow --> BookingSuccess[Booking Success\nQR Ticket Generated]

    BookingSuccess --> MyBookings
```

---

## 2. Authentication Flow

```mermaid
flowchart TD
    AuthEntry([User Needs to Authenticate]) --> AuthChoice{Choose Method}

    AuthChoice -->|Email & Password| LoginPage[Login Page\n/login]
    AuthChoice -->|New User| SignupPage[Signup Page\n/signup]
    AuthChoice -->|Google| GoogleOAuth[Google OAuth\n/auth/callback]

    LoginPage --> LoginSubmit{Credentials Valid?}
    LoginSubmit -- No --> LoginError[Show Error Message]
    LoginError --> LoginPage
    LoginSubmit -- Yes --> ForgotPwd?{Forgot Password?}
    ForgotPwd? -- Yes --> ForgotPwdPage[Forgot Password Page\n/forgot-password]
    ForgotPwd? -- No --> Authenticated([User Authenticated\nJWT Token Stored])

    ForgotPwdPage --> ResetEmail[Send Reset Email]
    ResetEmail --> SetPwdPage[Set New Password\n/set-password]
    SetPwdPage --> Authenticated

    SignupPage --> SignupSubmit{Form Valid?\nPassword ≥ min length}
    SignupSubmit -- No --> SignupError[Show Validation Error]
    SignupError --> SignupPage
    SignupSubmit -- Yes --> Authenticated

    GoogleOAuth --> GoogleCallback[Process OAuth Token\n/auth/callback]
    GoogleCallback --> Authenticated
```

---

## 3. Event Discovery Flow

```mermaid
flowchart TD
    Home([Home Page]) --> FeaturedEvents[View Featured / Upcoming Events]
    Home --> CategoryBrowse[Browse by Category]
    Home --> SearchBar[Use Search Bar]

    FeaturedEvents --> EventCard[Event Card Click]
    CategoryBrowse --> FilteredList[Events Page\n/events?category=...]
    SearchBar --> FilteredList

    FilteredList --> ApplyFilters{Apply Filters\nCategory · Date · Price}
    ApplyFilters --> EventCard

    EventCard --> EventDetail[Event Detail Page\n/event/:id]

    EventDetail --> EventInfo[View Details\nDate · Location · Price\nSeat Map · Description]
    EventDetail --> CheckAvailability{Tickets Available?}

    CheckAvailability -- Yes --> BookBtn[Book Now Button]
    CheckAvailability -- No --> WaitlistBtn[Join Waitlist Button]
    CheckAvailability -- No --> SoldOutMsg[Sold Out Badge]

    BookBtn --> CheckLogin{Logged In?}
    CheckLogin -- No --> LoginRedirect[Redirect to /login\nwith return URL]
    CheckLogin -- Yes --> BookingPage[Booking Page\n/book/:id]

    WaitlistBtn --> CheckLoginWL{Logged In?}
    CheckLoginWL -- No --> LoginRedirect
    CheckLoginWL -- Yes --> WaitlistPage[Waitlist Page\n/waitlist]
```

---

## 4. Booking & Payment Flow

```mermaid
flowchart TD
    BookingPage([Booking Page /book/:id]) --> LoadEvent[Load Event Details & Features]

    LoadEvent --> TicketTypeSelect[Select Ticket Type]
    TicketTypeSelect --> QuantitySelect[Choose Quantity]

    QuantitySelect --> SeatMap{Seat Selection\nEnabled?}
    SeatMap -- Yes --> SeatPicker[Interactive Seat Picker\nChoose Seats]
    SeatMap -- No --> SkipSeats[Proceed without\nSeat Selection]

    SeatPicker --> CouponEntry
    SkipSeats --> CouponEntry

    CouponEntry[Apply Coupon Code\nOptional] --> CouponCheck{Coupon Valid?}
    CouponCheck -- Yes --> DiscountApplied[Discount Applied\nShow New Total]
    CouponCheck -- No --> CouponError[Show Coupon Error]
    CouponCheck -- Skip --> OrderSummary
    DiscountApplied --> OrderSummary
    CouponError --> OrderSummary

    OrderSummary[Review Order Summary\nEvent · Seats · Total Amount] --> PaymentMethod{Payment Required?}

    PaymentMethod -- Free Event --> FreeBooking[Confirm Free Booking]
    PaymentMethod -- Paid Event --> RazorpayGateway[Razorpay Payment\nGateway Opens]

    RazorpayGateway --> PaymentStatus{Payment Result}
    PaymentStatus -- Success --> BookingConfirmed[Booking Confirmed\nBooking ID Generated]
    PaymentStatus -- Failed --> PaymentFailed[Show Failure Message\nRetry Option]
    PaymentStatus -- Cancelled --> OrderSummary

    FreeBooking --> BookingConfirmed

    BookingConfirmed --> QRGenerated[QR Ticket Generated\nEmailed to User]
    QRGenerated --> SuccessPage[Booking Success Page\n/booking-success]

    SuccessPage --> DownloadTicket[Download Ticket as Image]
    SuccessPage --> ViewMyBookings[View My Bookings\n/my-bookings]
```

---

## 5. My Bookings Flow

```mermaid
flowchart TD
    MyBookings([My Bookings /my-bookings]) --> LoadBookings[Load User Bookings from API]

    LoadBookings --> HasBookings{Has Bookings?}
    HasBookings -- No --> EmptyState[Show Empty State\nLink to Browse Events]
    HasBookings -- Yes --> BookingList[Display Booking Cards\nEvent · Date · Seats · Status]

    BookingList --> SelectBooking[Select a Booking]
    SelectBooking --> ViewTicket[View QR Ticket]
    SelectBooking --> DownloadTicket[Download Ticket]

    EmptyState --> EventsPage[/events]
```

---

## 6. Create Event Request Flow

```mermaid
flowchart TD
    CreateEventReq([Create Event Request /create-event]) --> RequireLogin{Logged In?}
    RequireLogin -- No --> LoginPage[Redirect to /login]
    RequireLogin -- Yes --> EventReqForm[Event Request Form]

    EventReqForm --> FillDetails[Fill Event Details\nTitle · Category · Date · Venue\nDescription · Expected Attendance]
    FillDetails --> SelectPlan[Select Subscription Plan\nBasic · Standard · Premium]
    SelectPlan --> SubmitRequest[Submit Request]

    SubmitRequest --> ApiCall[POST /api/event-requests]
    ApiCall --> RequestResult{Submission Result}
    RequestResult -- Success --> ConfirmMsg[Show Success Message\nRequest Under Review]
    RequestResult -- Error --> ErrorMsg[Show Error & Retry]

    ConfirmMsg --> MyEventRequests[My Event Requests\n/my-event-requests]

    MyEventRequests --> RequestList[List of Submitted Requests]
    RequestList --> RequestStatus{Request Status}
    RequestStatus --> Pending[Pending Review]
    RequestStatus --> Approved[Approved → Event Created]
    RequestStatus --> Rejected[Rejected with Reason]
```

---

## 7. Complete Public Website Page Map

```mermaid
flowchart LR
    subgraph Public["🌐 Public Pages (No Login Required)"]
        Home[/ Home]
        Events[/events]
        EventDetail[/event/:id]
        About[/about]
        Contact[/contact]
        FAQ[/faq]
        Help[/help]
        Privacy[/privacy]
        Terms[/terms]
        Cookies[/cookies]
        ForOrganizers[/for-organizers]
        BookingSuccess["/booking-success\n(reads from localStorage / state)"]
    end

    subgraph Auth["🔐 Authentication Pages"]
        Login[/login]
        Signup[/signup]
        ForgotPassword[/forgot-password]
        AuthCallback[/auth/callback]
        SetPassword[/set-password]
    end

    subgraph Protected["🔒 Protected Pages (Login Required)"]
        Settings[/settings]
        Booking[/book/:id]
        Waitlist[/waitlist]
        CreateEvent[/create-event]
        MyEventReqs[/my-event-requests]
        MyBookings[/my-bookings]
        Messages[/messages]
    end

    Home --> Events
    Home --> About
    Home --> ForOrganizers
    Events --> EventDetail
    EventDetail --> Booking
    EventDetail --> Waitlist
    Booking --> BookingSuccess
    BookingSuccess --> MyBookings
    Login --> Protected
    Signup --> Protected
    AuthCallback --> Protected
```

---

## 8. Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUBLIC WEBSITE (React SPA)                    │
├──────────────────────────┬──────────────────────────────────────┤
│   UNAUTHENTICATED USER   │         AUTHENTICATED USER           │
│                          │                                       │
│  • Browse Events         │  • Book Tickets (Razorpay / Free)    │
│  • View Event Detail     │  • Apply Coupon Codes                │
│  • View Info Pages       │  • Select Seats (if enabled)         │
│  • Login / Signup        │  • Download QR Ticket                │
│  • Google OAuth          │  • View My Bookings                  │
│  • Forgot Password       │  • Join Waitlist                     │
│                          │  • Submit Event Request              │
│                          │  • Track Event Request Status        │
│                          │  • Update Account Settings           │
│                          │  • View Messages                     │
└──────────────────────────┴──────────────────────────────────────┘
                           │
                           │ REST API (HTTPS)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                          │
├─────────────────────────────────────────────────────────────────┤
│  /api/events          → Browse & search public events           │
│  /api/auth            → Login, signup, Google OAuth, JWT        │
│  /api/bookings        → Create bookings, fetch user bookings    │
│  /api/payments        → Razorpay order creation & verification  │
│  /api/coupons         → Validate & apply coupon codes           │
│  /api/waitlist        → Join / leave waitlist for events        │
│  /api/event-requests  → Submit & track event creation requests  │
│  /api/users           → User profile & settings                 │
│  /api/messages        → User messages                           │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ Mongoose ODM
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (MongoDB)                          │
├─────────────────────────────────────────────────────────────────┤
│  Users · Events · Bookings · Payments · Coupons                 │
│  EventRequests · Waitlist · Messages · FeatureToggles           │
└─────────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌─────────────────────┐   ┌────────────────────────┐
│  Razorpay Gateway   │   │  Email Service          │
│  (Payment)          │   │  (Booking Confirmation  │
└─────────────────────┘   │   & QR Ticket)          │
                          └────────────────────────┘
```
