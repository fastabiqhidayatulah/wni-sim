# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Authentication & Verification Invariant**: Every write (`create`, `update`, `delete`) and list operation on `/rooms/{roomCode}` requires a signed-in user with `request.auth.token.email_verified == true`.
2. **Path & Identity Integrity**: `roomCode` must match `^[a-zA-Z0-9_\-]+$` (length 3..32) and equal `incoming().roomCode`. On creation, `incoming().hostUid == request.auth.uid`.
3. **Immortal Fields**: `roomCode`, `hostUid`, and `createdAt` cannot be modified during any `update` operation.
4. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time` (enforcing `serverTimestamp()`).
5. **Terminal State Locking**: Once `resource.data.status == 'FINISHED'`, no further updates are permitted on the room document.
6. **Bounded Collections & Volumetrics**:
   - `players` list must have size between 1 and 64 (`players.size() >= 1 && players.size() <= 64`).
   - `loans` list must have size `<= 50`.
   - `activityLogs` list must have size `<= 40`.
   - `dice` list must have size `== 2`.
   - `properties` map must have size `<= 45`.
   - `customAssets` map must have size `<= 5` (`pawns` map `<= 10`, `buildings` map `<= 6`, `boardCenterLogo` string `<= 45000`), and only `hostUid` may mutate `customAssets` during room updates.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth = null` attempting to create `/rooms/WNI-101` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `auth = { uid: 'u1', token: { email_verified: false } }` attempting to create `/rooms/WNI-101` -> `PERMISSION_DENIED`.
3. **Host UID Spoofing**: `auth.uid = 'u1'` creating `/rooms/WNI-101` with `hostUid: 'u2'` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Payload containing an undeclared `isAdmin: true` field -> `PERMISSION_DENIED`.
5. **Shadow Field Injection on Update**: Update payload adding `hacked: true` -> `PERMISSION_DENIED`.
6. **Immortal Field Mutation (`hostUid`)**: Non-host or host attempting to change `hostUid` during `update` -> `PERMISSION_DENIED`.
7. **Immortal Field Mutation (`createdAt`)**: Attempting to overwrite `createdAt` during `update` -> `PERMISSION_DENIED`.
8. **Client Timestamp Forgery**: Setting `updatedAt` to a past/future timestamp instead of `request.time` -> `PERMISSION_DENIED`.
9. **Terminal State Bypass**: Updating a room where `existing().status == 'FINISHED'` -> `PERMISSION_DENIED`.
10. **Array Overflow Attack (Denial of Wallet)**: Passing `players` array with 65 items (`> 64`) -> `PERMISSION_DENIED`.
11. **Value Poisoning on Whitelisted Key**: Updating `maxPlayers` to `999` or string `"many"` -> `PERMISSION_DENIED`.
12. **Unauthorized Room Deletion**: User `u2` attempting to `delete` a room where `hostUid == 'u1'` -> `PERMISSION_DENIED`.
