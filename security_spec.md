# Security Specification: ScamGuard Database

## 1. Data Invariants
- A scam report must be associated with a valid target (URL, phone, etc.).
- The `reporterId` must match the authenticated user's UID.
- The `status` of a report can only be set to `pending` by regular users.
- Only admins (defined in `/admins/{userId}`) or a backend process can verify or reject reports.
- `createdAt` and `updatedAt` must be server-generated timestamps.
- Reports cannot be deleted by the original reporter once submitted (to prevent evidence tampering), but can be updated (e.g., adding more details).
- User profiles are only writable by the owner.

## 2. The "Dirty Dozen" Payloads (Targeting Scam Reports)

1. **Identity Spoof**: `reporterId: "another-user-uid"` (Should be REJECTED)
2. **State Shortcut**: `status: "verified"` on creation by non-admin (Should be REJECTED)
3. **Resource Poisoning**: `target: "A".repeat(2000)` (Too long, Should be REJECTED)
4. **Invalid Type**: `votesCount: "many"` (Should be integer, Should be REJECTED)
5. **Admin Escape**: `isAdmin: true` in user profile update (Should be REJECTED)
6. **Time Spoof**: `createdAt: "2020-01-01"` (Must be request.time, Should be REJECTED)
7. **Orphan Write**: Write to `scamReports` without being signed in (Should be REJECTED)
8. **Malicious ID**: `reportId: "../hack/my-path"` (Should be REJECTED via path validation)
9. **Bulk Read Scrape**: Standard user attempting to list ALL reports without filters (Should be allowed but checked for query boundaries)
10. **Ghost Field Update**: `isVerifiedByGoogle: true` (Field not in schema, Should be REJECTED)
11. **Negative Vote**: `votesCount: -100` (Should be >= 0, Should be REJECTED)
12. **PII Leak**: Unauthenticated user trying to read `reporterEmail` (Should be REJECTED)

## 3. Test Runner Plan
I will implement `firestore.rules` that block these.
