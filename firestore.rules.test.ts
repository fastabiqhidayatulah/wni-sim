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

  // 4. Terminal State Locking — FINISHED terkunci kecuali Host menghidupkan lagi (MAIN LAGI)
  assert.ok(rulesText.includes("existing().status != 'FINISHED'"));
  assert.ok(
    rulesText.includes(
      "request.auth.uid == existing().hostUid && incoming().status == 'PLAYING'"
    )
  );
  // Jalur restart FINISHED -> PLAYING harus benar-benar punya cabang update,
  // bukan sekadar pengecualian di gerbang status.
  assert.ok(
    rulesText.includes("existing().status == 'FINISHED' &&")
  );

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

  // 9. Room Membership Enforcement — hanya anggota `memberUids` yang boleh tulis penuh;
  //    pendatang hanya lewat jalur join yang valid (tambah diri sendiri, players tidak boleh menyusut)
  //    CATATAN: firestore.rules TIDAK mendukung lambda map/filter — membership wajib via field `memberUids`
  assert.ok(rulesText.includes('function isRoomMember()'));
  assert.ok(rulesText.includes('function isLegitJoinWrite()'));
  assert.ok(
    rulesText.includes('request.auth.uid in existing().memberUids')
  );
  assert.ok(
    rulesText.includes('incoming().memberUids.hasAny([request.auth.uid])')
  );
  assert.ok(
    rulesText.includes('incoming().players.size() >= existing().players.size()')
  );
  // 10. memberUids monoton: tidak pernah menyusut, maksimal +1 per update
  assert.ok(
    rulesText.includes('incoming().memberUids.hasAll(existing().memberUids)')
  );
  assert.ok(
    rulesText.includes(
      'incoming().memberUids.size() <= existing().memberUids.size() + 1'
    )
  );
  // 11. Skema room menyertakan memberUids (hasAll + hasOnly + validasi bentuk)
  assert.ok(rulesText.includes("'memberUids'"));
  assert.ok(
    rulesText.includes(
      'data.memberUids is list && data.memberUids.size() >= 1 && data.memberUids.size() <= 64'
    )
  );
  // 12. Jalur join hanya boleh menyentuh players + memberUids + activityLogs + updatedAt
  assert.ok(rulesText.includes('!isRoomMember() && isLegitJoinWrite()'));

  // 13. Ajuan antar-pemain + pengaturan durasi/alasan akhir ikut tersinkron
  //     dan divalidasi bentuknya sebelum masuk dokumen room.
  assert.ok(rulesText.includes('isValidPendingMoneyRequest'));
  assert.ok(rulesText.includes('isValidPendingLoanProposal'));
  assert.ok(rulesText.includes("'pendingMoneyRequest'"));
  assert.ok(rulesText.includes("'pendingLoanProposal'"));
  assert.ok(rulesText.includes("'durationMode'"));
  assert.ok(rulesText.includes("'gameOverReason'"));
  assert.ok(
    rulesText.includes(
      "(!('pendingMoneyRequest' in data) || isValidPendingMoneyRequest(data.pendingMoneyRequest))"
    )
  );
  assert.ok(
    rulesText.includes(
      "(!('pendingLoanProposal' in data) || isValidPendingLoanProposal(data.pendingLoanProposal))"
    )
  );
  assert.ok(rulesText.includes("data.durationMode == 'FAST_10'"));
  assert.ok(rulesText.includes("data.durationMode == 'CLASSIC'"));

  // 14. Kartu Takdir/Musibah tersinkron untuk semua klien (read-only di penonton)
  assert.ok(rulesText.includes('isValidSharedFateCard'));
  assert.ok(rulesText.includes("'sharedFateCard'"));
  assert.ok(
    rulesText.includes(
      "(!('sharedFateCard' in data) || isValidSharedFateCard(data.sharedFateCard))"
    )
  );
  assert.ok(
    rulesText.includes(
      "sf.keys().hasAll(['cardId', 'deck', 'fromDoubles', 'diceResult', 'playerId', 'playerName'])"
    )
  );
});

