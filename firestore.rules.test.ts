import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesText = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

test('firestore.rules contains required Eight Pillars and Dirty Dozen guards', () => {
  // 1. Global Safety Net
  assert.ok(rulesText.includes('match /{document=**}'));
  assert.ok(rulesText.includes('allow read, write: if false;'));

  // 2. Verified User check
  assert.ok(rulesText.includes('request.auth.token.email_verified == true'));

  // 3. Strict Schema Blueprint keys check
  assert.ok(rulesText.includes('data.keys().hasAll('));
  assert.ok(rulesText.includes('data.keys().hasOnly('));

  // 4. Terminal State Locking
  assert.ok(rulesText.includes("existing().status != 'FINISHED'"));

  // 5. Immortal fields check
  assert.ok(rulesText.includes('incoming().roomCode == existing().roomCode'));
  assert.ok(rulesText.includes('incoming().hostUid == existing().hostUid'));
  assert.ok(rulesText.includes('incoming().createdAt == existing().createdAt'));

  // 6. Temporal Integrity
  assert.ok(rulesText.includes('incoming().createdAt == request.time'));
  assert.ok(rulesText.includes('incoming().updatedAt == request.time'));

  // 7. Bounded 64-player array guard
  assert.ok(rulesText.includes('data.players.size() >= 1 && data.players.size() <= 64'));

  // 8. Host Custom Assets validation & Host-only update guard
  assert.ok(rulesText.includes('isValidCustomAssets(data.customAssets)'));
  assert.ok(
    rulesText.includes(
      '(incoming().customAssets == existing().customAssets || existing().hostUid == request.auth.uid)'
    )
  );
});

