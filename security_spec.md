# Baby Memory — Security Specification (Payload-First TDD)

## 1. Data Invariants
1. **PII Isolation**: User profile documents (`/users/{userId}` containing email and medical conditions) and all medical/health subcollections (`/users/{userId}/**`) are strictly readable and writable ONLY by the verified owner (`request.auth.uid == userId && request.auth.token.email_verified == true`).
2. **Master Gate Relational Sync**: All user subcollection single-document writes (`healthLogs`, `growthEntries`, `milestones`, `memories`, `medicalRecords`, `serviceBookings`, `consultations`, `messages`) verify parent `/users/{userId}` existence and ownership.
3. **Immutable Ownership & Timestamps**: `ownerId`, `uid`, `authorUid`, and `createdAt` can never be reassigned on update; `createdAt` and `updatedAt` must strictly equal `request.time`.
4. **No Shadow Fields / Volumetric Bounds**: Every collection enforces `keys().hasAll(...)` + `keys().hasOnly(...)` on create and `affectedKeys().hasOnly(...)` on update, plus explicit `.size()` bounds on all strings and lists.
5. **Terminal State Locking**: `serviceBookings` reaching `completed` or `cancelled` cannot be reopened or mutated.
6. **Public Community PII Exclusion**: `/communityPosts` only stores non-PII `authorHandle` and `authorUid`; email, phone, and address fields are forbidden by schema allowlist.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Cross-Tenant Profile Read**: User B (`uid: userB`) tries `get(/users/userA)` -> DENIED.
2. **Identity Spoofing on Health Log Create**: User B sends `{ ownerId: "userA", ... }` to `/users/userB/healthLogs/log1` -> DENIED.
3. **Unverified Email Write**: User with `email_verified: false` attempts write to `/users/userA/milestones/m1` -> DENIED.
4. **Shadow Field Injection**: User A creates `/users/userA` with extra ghost key `isAdmin: true` -> DENIED (`hasOnly` check).
5. **Client-Forged Timestamp**: User A creates `/users/userA/growthEntries/g1` with `createdAt` set to yesterday instead of `serverTimestamp()` -> DENIED (`createdAt == request.time`).
6. **Immutable Field Reassignment**: User A updates `/users/userA/medicalRecords/r1` attempting to change `ownerId` or `createdAt` -> DENIED.
7. **Terminal State Bypass**: User A attempts to update `/users/userA/serviceBookings/b1` from `status: "completed"` back to `status: "requested"` -> DENIED.
8. **Path ID Poisoning (1.5KB ID)**: User A creates document with 1500-char ID or invalid characters `../admin` -> DENIED (`isValidId`).
9. **Resource Exhaustion String**: User A sends a 10,000-character string in `healthLogs.title` (max 120) -> DENIED.
10. **Array Flood**: User A sends 25 items in `users.healthConditions` (max 10) -> DENIED.
11. **Community Post Hijack**: User B updates or deletes User A's `/communityPosts/post1` -> DENIED.
12. **Community Like Spoof**: User B creates `/communityPosts/post1/likes/userA` -> DENIED (`userId == request.auth.uid`).
