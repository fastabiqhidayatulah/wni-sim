# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Authentication & Verification Invariant**: Every write (`create`, `update`, `delete`) and list operation on `/rooms/{roomCode}` requires a signed-in user with `request.auth.token.email_verified == true`.
2. **Path & Identity Integrity**: `roomCode` must match `^[a-zA-Z0-9_\-]+$` (length 3..32) and equal `incoming().roomCode`. On creation, `incoming().hostUid == request.auth.uid`.
3. **Immortal Fields**: `roomCode`, `hostUid`, and `createdAt` cannot be modified during any `update` operation.
4. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time` (enforcing `serverTimestamp()`).
5. **Terminal State Locking**: Once `resource.data.status == 'FINISHED'`, no further updates are permitted — except the room host transitioning it back to `PLAYING` (the "MAIN LAGI" restart button). The restart path has its own `affectedKeys` branch (Action 3) so the host can only reset gameplay keys, never identity fields. Without this exception a finished online room would be permanently frozen and could never be replayed.
6. **Bounded Collections & Volumetrics**:
   - `players` list must have size between 1 and 64 (`players.size() >= 1 && players.size() <= 64`).
   - `memberUids` list must have size between 1 and 64, first entry a string `<= 128` chars (Firebase Auth UIDs of human members, no bots).
   - `loans` list must have size `<= 50`.
   - `activityLogs` list must have size `<= 40`.
   - `dice` list must have size `== 2`.
   - `properties` map must have size `<= 45`.
   - `customAssets` map must have size `<= 5` (`pawns` map `<= 10`, `buildings` map `<= 6`, `boardCenterLogo` string `<= 45000`), and only `hostUid` may mutate `customAssets` during room updates.
7. **Room Membership Invariant**: during `WAITING` and `PLAYING` updates, a writer whose `request.auth.uid` is absent from `existing().memberUids` may only perform a legitimate join write: `affectedKeys` restricted to `players, memberUids, activityLogs, updatedAt`, the incoming `memberUids` must include the writer's own uid, and `players` may not shrink and may grow by at most 1 entry.
8. **Monotonic Member List**: `incoming().memberUids` must contain every `existing().memberUids` entry (`hasAll`) and may grow by at most 1 entry per update — `memberUids` can never shrink, so no writer can evict an existing member.
9. **Cross-Player Request Invariants**: `pendingMoneyRequest` is `null` or a map with exactly `fromPlayerId, toPlayerId, amount, reason` (ids `0..63`, `amount` int `1..1e9`, `reason` string `<= 160`). `pendingLoanProposal` is `null` or a map with exactly `borrowerId, lenderId, principal` (ids `0..63`, `principal` int `1..1e9`). Both are synchronized room fields so the *responder* (target player / lender), not the requester, renders and executes the decision. `durationMode` must be one of `FAST_10 | FAST_15 | WEALTH_25M | CLASSIC`; `gameOverReason` is a string `<= 240`. `sharedFateCard` is `null` or a map with exactly `cardId, deck, fromDoubles, diceResult, playerId, playerName` (`cardId` 1..64 chars, `deck` TAKDIR/MUSIBAH, `diceResult` null or int 1..6, `playerId` 0..63, `playerName` 1..40 chars). It is written only by the active player's client and read by every client so Takdir/Musibah events are visible to all as a read-only spectator overlay.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth = null` attempting to create `/rooms/WNI-101` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `auth = { uid: 'u1', token: { email_verified: false } }` attempting to create `/rooms/WNI-101` -> `PERMISSION_DENIED`.
3. **Host UID Spoofing**: `auth.uid = 'u1'` creating `/rooms/WNI-101` with `hostUid: 'u2'` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Payload containing an undeclared `isAdmin: true` field -> `PERMISSION_DENIED`.
5. **Shadow Field Injection on Update**: Update payload adding `hacked: true` -> `PERMISSION_DENIED`.
6. **Immortal Field Mutation (`hostUid`)**: Non-host or host attempting to change `hostUid` during `update` -> `PERMISSION_DENIED`.
7. **Immortal Field Mutation (`createdAt`)**: Attempting to overwrite `createdAt` during `update` -> `PERMISSION_DENIED`.
8. **Client Timestamp Forgery**: Setting `updatedAt` to a past/future timestamp instead of `request.time` -> `PERMISSION_DENIED`.
9. **Terminal State Bypass**: Updating a room where `existing().status == 'FINISHED'` is denied unless the writer is the host (`hostUid`) and `incoming().status == 'PLAYING'` -> otherwise `PERMISSION_DENIED`.
10. **Array Overflow Attack (Denial of Wallet)**: Passing `players` array with 65 items (`> 64`) -> `PERMISSION_DENIED`.
11. **Value Poisoning on Whitelisted Key**: Updating `maxPlayers` to `999` or string `"many"` -> `PERMISSION_DENIED`.
12. **Unauthorized Room Deletion**: User `u2` attempting to `delete` a room where `hostUid == 'u1'` -> `PERMISSION_DENIED`.
13. **Outsider State Clobber**: Verified user whose uid is absent from `memberUids` attempting to update `stateTreasury`/`round`/`players` values without joining -> `PERMISSION_DENIED` (must go through the join path).
14. **Spoofed-Uid Join**: Join write whose `incoming().memberUids` does not include `request.auth.uid`, or which shrinks `players`, or grows `players`/`memberUids` by more than 1 -> `PERMISSION_DENIED`. Shrinking `memberUids` below the existing set is denied for every writer (monotonic invariant).
