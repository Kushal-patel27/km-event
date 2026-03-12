```mermaid
flowchart TD
    U[User (Attendee)]
    PG[Payment Gateway]

    subgraph SYS[K&M Event Management System]
        UC1((Register account))
        UC2((Login to system))
        UC3((Login using Google OAuth))
        UC4((Manage profile))
        UC5((Browse events))
        UC6((Search and filter events))
        UC7((View event details))
        UC8((Select tickets))
        UC9((Book tickets))
        UC10((Make payment))
        UC11((Receive booking confirmation))
        UC12((Download QR ticket))
        UC13((View booking history))
        UC14((Cancel booking))
        UC15((Receive event notifications))
        UC16((Contact support))
        UC17((Check booking policy))
    end

    U --> UC1
    U --> UC2
    U --> UC3
    U --> UC4
    U --> UC5
    U --> UC6
    U --> UC7
    U --> UC8
    U --> UC9
    U --> UC10
    U --> UC11
    U --> UC12
    U --> UC13
    U --> UC14
    U --> UC15
    U --> UC16

    UC9 -. "<<include>>" .-> UC8
    UC9 -. "<<include>>" .-> UC10
    UC10 -->|Processes transaction| PG
    UC9 -->|Successful booking| UC11
    UC11 -->|Provides QR ticket| UC12
    UC14 -. "<<depends on>>" .-> UC17
    UC13 -->|Shows past bookings| UC11
```