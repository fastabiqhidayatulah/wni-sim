---
name: wni-sim
description: Panduan kerja untuk repo WNI Simulator ("Bertahan Hidup di Negeri Konoha"), game papan monopoli satir 2.5D isometrik berbasis React 19 + Vite + Tailwind 4 + Firebase Firestore. Gunakan skill ini setiap kali mengedit game ini, termasuk aturan permainan (rules.ts), petak papan, kartu Takdir/Musibah, kartu simpanan, pinjaman, bot, UI isometrik, modal, lobby/waiting room, sinkronisasi multiplayer Firestore, firestore.rules, custom asset (avatar, bangunan, logo, intro movie), suara, dan unit test. Wajib dipakai walau user hanya bilang "tambah fitur di game", "ubah harga tanah", "tambah kartu", "perbaiki bug giliran", atau "multiplayer error".
license: MIT
metadata:
  project: wni-sim
  language: id
---

# WNI Simulator: panduan edit

Game satir 2.5D isometrik. 4 sampai 64 pemain (manusia + bot), papan 40 petak perimeter + 1 petak tengah (Bekasi). Seluruh teks UI dan komentar memakai **Bahasa Indonesia** bernada satir. Pertahankan gaya itu pada teks baru.

## Stack dan perintah

| Hal | Nilai |
|---|---|
| Package manager | **bun** (`bun.lock`), npm juga jalan |
| Dev server | `bun run dev` (port 3000, host 0.0.0.0) |
| Typecheck ("lint") | `bun run lint` = `tsc --noEmit` |
| Unit test | `npx tsx --test src/game/rules.test.ts` (node:test, 14 test, harus hijau) |
| Build | `bun run build` |
| Alias import | `@/` = root repo |

Jalankan **typecheck + unit test** setelah setiap perubahan yang menyentuh `src/game/` atau `src/firebase.ts`.

## Peta kode (baca dulu sebelum edit)

- `src/game/rules.ts` (~2450 baris): **semua logika murni**, tipe, konstanta, papan (`BOARD_TILES`), kartu, rumus uang, kondisi game selesai, sanitasi custom asset. Tanpa React, tanpa Firebase, mudah dites.
- `src/game/rules.test.ts`: test untuk fungsi di `rules.ts`.
- `src/game/customAssets.ts`: kompres gambar upload host ke dataURL (maks 45.000 karakter).
- `src/App.tsx` (~5800 baris): satu komponen besar berisi seluruh state dan semua handler `handle*` (lempar dadu, beli, upgrade, penjara, tol, pengadilan, pinjaman, bot, lobby, dsb).
- `src/components/`: `IsometricBoard` (papan), `GameModals` (semua modal gameplay), `LobbyAndWaitingRoom`, `HoverInfoPopups`, `Building3DMiniature`, `Dice3DCube`, `IntroMovieScreen`, `CustomAssetsModal`.
- `src/firebase.ts`: init Firebase, auth Google, CRUD room, `sanitizePlayersForFirestore`, `syncGameplayToFirestore`, `subscribeToFirestoreRoom`.
- `src/utils/sound.ts`: `soundFX` (singleton).
- `firestore.rules`, `firebase-blueprint.json`, `security_spec.md`, `firestore.rules.test.ts`: kontrak keamanan data room.
- `public/avatars/` (1.png sampai 8.png), `public/intro-wni-simulator.mp4`.
- `.aistudio/` hanya artefak Google AI Studio (screenshot). **Jangan dibaca atau diedit.**

Detail lengkap ada di `references/`. Baca sesuai tugas:

| Tugas | Baca |
|---|---|
| Struktur App, state, turn flow, bot, modal | `references/architecture.md` |
| Aturan, papan, kartu, uang, mode durasi | `references/game-rules.md` |
| Multiplayer, skema room, firestore.rules, field Player baru | `references/firebase-multiplayer.md` |
| Pindah ke project Firebase sendiri (baru, auth, rules, deploy) | `references/own-firebase-setup.md` |

## Aturan emas (sering bikin bug kalau dilanggar)

1. **Logika baru masuk `rules.ts` sebagai fungsi murni + tambahkan test**, baru dipanggil dari `App.tsx`. Jangan menanam rumus uang di JSX atau handler.
2. **Menambah field di `Player`** wajib diikuti: `createPlayerFromAvatar`, `createInitialPlayers`, **`sanitizePlayersForFirestore`** (field yang tidak ada di sini hilang saat online), dan test. Tipe `Player` ada di `rules.ts`.
3. **Semua angka ke Firestore harus integer** (`Math.round`): `money`, `stateTreasury`, `dice`, `round`, dsb. `firestore.rules` menolak float.
4. **Batas ukuran dokumen room**: players <= 64, loans <= 50, activityLogs <= 40, properties <= 45, customAssets <= 5 key (pawns <= 10, buildings <= 6, logo <= 45.000 char). Jangan menambah data besar ke dokumen room tanpa memikirkan batas ini.
5. **Menambah field top-level di dokumen room** berarti mengubah 4 tempat sekaligus: `FirestoreRoomData` (`firebase.ts`), `isValidRoom` (`firestore.rules`, `hasAll` dan `hasOnly`), daftar `affectedKeys().hasOnly` pada update Action 1/2, dan `firebase-blueprint.json` + `security_spec.md`. Lalu minta user mendeploy rules ke Firebase.
6. **Jangan ubah blok HMR/watch di `vite.config.ts`** (ada komentar "Do not modify", diperlukan AI Studio).
7. **Jangan commit secret.** `.env*` sudah di-gitignore. `firebase-applet-config.json` memang ada di repo (config web Firebase); jangan menambah kunci rahasia (mis. `GEMINI_API_KEY`) ke file yang ter-commit.
8. **Jangan memecah `App.tsx` besar-besaran** kecuali diminta. Perubahan kecil dan terarah lebih aman; state dan efek sync saling terkait.
9. Selama menerapkan snapshot remote, `applyingRemoteSnapshotRef` mencegah echo push balik. Jangan hilangkan guard ini saat mengubah efek sync (`App.tsx` sekitar baris 492 dan 606).
10. Bahasa: teks UI, log aktivitas, dan komentar baru dalam Bahasa Indonesia, konsisten dengan yang ada.

## Alur kerja yang disarankan

1. Pahami fitur: cari dulu dengan `grep` (nama handler `handle*`, `TileType`, `SavedCardKey`, `FateEffectType`) sebelum membaca file besar. Gunakan `view_range`/offset untuk `App.tsx`.
2. Ubah aturan di `rules.ts` + tambah/ubah test di `rules.test.ts`.
3. Sambungkan ke UI (`App.tsx`, `GameModals.tsx`, `IsometricBoard.tsx`).
4. Jika menyentuh data online: cek `references/firebase-multiplayer.md`.
5. Verifikasi: `npx tsx --test src/game/rules.test.ts` lalu `bun run lint`, lalu `bun run dev` untuk uji manual (mode lokal "Quick Play" tidak butuh Firebase).
6. Ringkas perubahan ke user, sebutkan jika perlu deploy `firestore.rules`.

## Resep cepat

- **Tambah kartu simpanan**: tambah key di `SavedCardKey`, entri di `ALL_SAVED_CARDS`, efeknya di `handleConfirmUseSavedCard`/modal terkait, test, dan pastikan tersanitasi di `sanitizePlayersForFirestore` (field `savedCards` sudah ditangani; `key` harus valid).
- **Tambah kartu Takdir/Musibah**: tambah objek `FateCard` di `TAKDIR_CARDS` / `MUSIBAH_CARDS` / `EXTREME_MUSIBAH_CARDS`; jika butuh tipe efek baru, tambah ke `FateEffectType` dan tangani di `handleConfirmFateCard`.
- **Ubah harga/sewa/upgrade**: edit `BOARD_TILES` atau tabel `BUILDING_*` di `rules.ts`; cek test yang meng-assert angka.
- **Tambah mode durasi**: `GameDurationMode` + `DURATION_MODE_OPTIONS` + `checkGameEndCondition`.
- **Tambah karakter avatar**: `AVATAR_CHARACTERS` + file `public/avatars/<n>.png` + batas `customAssets.pawns` (<= 10 di rules).
