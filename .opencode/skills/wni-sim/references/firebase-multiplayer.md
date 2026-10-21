# Multiplayer Firebase (Firestore + Google Auth)

## Model
- Satu dokumen per room: `rooms/{roomCode}`. `roomCode` cocok `^[a-zA-Z0-9_\-]+$`, panjang 3..32 (`sanitizeRoomCode`, `generateRoomCode`). Kode `WNI-XXX` cuma 900 kombinasi → `handleCreateRoom` selalu cek `fetchFirestoreRoom` dulu dan generate ulang maksimal 3x saat tabrakan.
- Login Google (`signInWithGooglePopup`). **Rules mewajibkan `email_verified == true`** untuk tulis/list.
- **Enforcement keanggotaan (update Action 1 & 2)**: penulis harus terdaftar di `memberUids` (`isRoomMember()` — daftar uid Firebase Auth pemain manusia, tanpa bot, diturunkan via `deriveMemberUids`). Pendatang (uid belum ada di `memberUids`) hanya boleh menulis jalur join: key `players, memberUids, activityLogs, updatedAt`, uid asli wajib ikut masuk ke `memberUids`, `players` tidak boleh menyusut dan naik maksimal +1 (`isLegitJoinWrite()`). `memberUids` monoton global: `hasAll(existing)` + maksimal +1 per update.
- **PENTING**: `firestore.rules` klasik **TIDAK mendukung lambda `map()`/`filter()`** (compile sukses tapi dengan warning "Invalid function name" dan error saat runtime). Jangan pernah memakai `players.map(p, ...)` di rules — semua pengecekan koleksi harus lewat field turunan seperti `memberUids` atau akses indeks langsung.
- **Kepemilikan giliran (sisi klien)**: di mode online hanya klien pemain aktif yang menjalankan aksi giliran (lempar dadu, akhiri giliran, auto-action 60 detik); untuk pemain bot hanya klien Host. Klien lain hanya menerima snapshot — mencegah semua klien melempar dadu dengan RNG masing-masing untuk pemain yang sama. Semua penjadwalan "maju giliran" memakai `scheduleTurnAdvance()` di `App.tsx` (jadwal baru menggantikan yang lama; jatuh tempo dilewati bila ada modal baru terbuka).
- **FINISHED bukan lagi jalan buntu**: Host bisa me-restart room online (FINISHED -> PLAYING), dan semua klien keluar otomatis dari layar akhir saat snapshot PLAYING masuk. Tombol restart hanya dirender untuk Host.
- **Animasi gerak tersinkron**: dokumen Firestore hanya menyimpan posisi akhir, jadi klien penerima snapshot mengurai ulang lompatan posisi menjadi langkah 1-petak di `applyRemotePlayers()` (`App.tsx`) — hanya untuk perpindahan maju 1..20 petak dengan status sama; teleport (Lapas/Bekasi/Tol jauh/restart) tetap snap. Selama animasi, `remoteAnimatingRef` memblokir push agar posisi antara tidak dikirim balik. Popup hover dibersihkan lewat listener global (`data-hover-popup-anchor`) supaya tidak "nyangkut" ketika pion berpindah petak saat animasi atau kursor keluar papan.
- Status room: `WAITING -> PLAYING -> FINISHED`. Setelah `FINISHED` dokumen terkunci, **kecuali Host menekan "MAIN LAGI"** (status kembali ke `PLAYING`, lihat rules: `existing().status != 'FINISHED' || (request.auth.uid == existing().hostUid && incoming().status == 'PLAYING')`). Pengecualian status itu WAJIB disertai cabang update **Action 3** (`existing().status == 'FINISHED' && host && incoming().status == 'PLAYING'` + `affectedKeys` gameplay) — tanpa cabang tersebut pengecualian status saja tetap ditolak karena Action 1/2 mensyaratkan status lama WAITING/PLAYING.
- **Ajuan antar-pemain tersinkron + visibilitas benar**: `pendingMoneyRequest` & `pendingLoanProposal` adalah field dokumen room, bukan state lokal. Modal hanya dirender di klien **pemain tujuan** (target minta duit / calon pemberi pinjaman); handler menerima guard `canRespondToMoneyRequest`/`canRespondToLoanProposal`. Target berupa **bot** tidak punya klien: permintaan uang ke bot dijawab otomatis di klien pemohon (900 ms, terima bila saldo cukup), sedangkan pinjaman dari bot tetap disetujui peminjam. `durationMode` & `gameOverReason` juga disinkronkan agar HUD/layar akhir identik; HUD mode durasi hanya bisa diubah Host di room online.
- Database id Firestore khusus (named database) diambil dari `firebase-applet-config.json` (`firestoreDatabaseId`).

## Alur data
- `subscribeToFirestoreRoom(onUpdate, onError, onDeleted)` (onSnapshot) menerapkan snapshot ke state lokal; `applyingRemoteSnapshotRef.current = true` selama penerapan agar tidak memicu push balik. Jika dokumen dihapus (Host bubarkan room), callback `onDeleted` memindahkan semua klien ke Lobby.
- Efek push di `App.tsx` memanggil `syncGameplayToFirestore` (debounce 350 ms) saat `screen === 'GAME'`, tidak sedang `isRolling`/`isMoving`, dan bukan sedang menerapkan snapshot. **Gate hemat kuota**: push hanya dikirim kalau `lastRemoteSyncedRef` menunjukkan divergensi lokal (state berbeda dari snapshot terakhir yang diterapkan) — klien penerima murni tidak ikut menulis. Isi snapshot tetap penuh (players, properties, loans, activityLogs, round, activePlayerIndex, stateTreasury, dice, ...). Model: **last-write-wins**, tanpa transaksi.
- `customAssets` hanya didorong oleh host (`isHost ? customAssets : undefined` di payload sync, plus `handleUpdateCustomAssets` → `syncHostCustomAssetsToFirestore`); rules menolak perubahan `customAssets` dari non-host.
- Fungsi lain: `createFirestoreRoom`, `joinRoom`, `fetchFirestoreRoom`, `updateWaitingRoomInFirestore`, `syncHostCustomAssetsToFirestore`, `deleteFirestoreRoom` (khusus host; pemain lain keluar otomatis lewat `onDeleted`).
- Catatan desain: pemain non-aktif **sah** mengubah state bersama (terima/uang, setujui pinjaman) — karena itu gate push berbasis divergensi lokal, bukan "hanya pemain aktif". Timer giliran 60 dtk masih dieksekusi semua klien (rasa-race LWW lama); otoritas giliran ketat adalah pekerjaan lanjutan.

## Skema dokumen room
`roomCode, hostUid, hostId, hostName, status, gameState, maxPlayers (2..64), round (1..10000), activePlayerIndex (0..63), stateTreasury (int >= 0), isExtremeMusibahActive, dice (2 int), diceQuip (1..240), players (1..64), memberUids (1..64 string uid <= 128 char, tanpa bot), properties (map <= 45), loans (<= 50), activityLogs (<= 40), customAssets, durationMode (FAST_10|FAST_15|WEALTH_25M|CLASSIC), gameOverReason (string <= 240), pendingMoneyRequest (null | map), pendingLoanProposal (null | map), createdAt, updatedAt`.
`createdAt`/`updatedAt` harus `serverTimestamp()`. `roomCode`, `hostUid`, `hostId`, `createdAt` tidak boleh berubah.

## Update yang diizinkan
- **WAITING**: anggota → key `players, status, gameState, maxPlayers, activityLogs, customAssets, updatedAt`; pendatang (jalur join) → `players, memberUids, activityLogs, updatedAt`.
- **PLAYING**: anggota → key `players, properties, loans, activityLogs, customAssets, round, activePlayerIndex, stateTreasury, isExtremeMusibahActive, dice, diceQuip, status, gameState, durationMode, gameOverReason, pendingMoneyRequest, pendingLoanProposal, updatedAt`; pendatang (jalur join) → `players, memberUids, activityLogs, updatedAt`.
- **FINISHED → PLAYING (host, MAIN LAGI)**: Action 3 dengan daftar key gameplay yang sama seperti PLAYING.
- `memberUids` tidak pernah ditulis `syncGameplayToFirestore` (nilai lama melekat di dokumen); hanya `createFirestoreRoom` & `updateWaitingRoomInFirestore` yang menurunkannya dari daftar pemain.
- Delete: hanya host.

## Checklist saat mengubah data online
1. Field baru di `Player`? Tambahkan ke `sanitizePlayersForFirestore` (dan batasi panjang string).
2. Field baru di dokumen room? Ubah `FirestoreRoomData`, `isValidRoom` (hasAll + hasOnly), `affectedKeys().hasOnly` Action 1/2, `firebase-blueprint.json`, `security_spec.md`.
3. Semua angka di-`Math.round`; string dipotong sesuai batas.
4. Perbarui `firestore.rules.test.ts` bila perilaku rules berubah.
5. Beri tahu user: **rules harus dideploy ulang** (`firebase deploy --only firestore:rules` atau lewat Firebase Console). `DRAFT_firestore.rules` hanya draf, bukan yang dipakai.
6. Uji dengan dua browser/profil berbeda (dua akun Google terverifikasi) untuk memastikan sinkron.

## Error umum
- `PERMISSION_DENIED` saat sync: biasanya ada field tak terdaftar, angka float, array melebihi batas, atau `updatedAt` bukan server timestamp.
- Pemain "kehilangan" field setelah online: field belum ada di `sanitizePlayersForFirestore`.
- Loop sync/flicker: guard `applyingRemoteSnapshotRef` rusak atau dependency efek push berubah tiap render.
