# Aturan game (sumber kebenaran: `src/game/rules.ts`)

Jangan menebak angka dari dokumen ini saat mengedit; buka `rules.ts`. Ringkasan untuk orientasi:

## Papan
- 40 petak perimeter (id 0..39) + `BEKASI_CENTER_TILE` (id 40, "Planet Bekasi", di tengah).
- Id khusus: `LAPAS_TILE_ID = 10`, `PUNGLI_TILE_ID = 20`, `COURT_TILE_ID = 30`, `BANDUNG_TILE_ID = 19`, `TOLL_TILE_IDS = [5, 15, 25, 35]`, `BEKASI_TILE_ID = 40`.
- `TileType`: `START, PROPERTY, TAKDIR, MUSIBAH, TAX, TOLL, JAIL, PUNGLI, COURT, TILANG, BEKASI`.
- Properti punya `price`, `baseRent`, `upgradeCost`, `colorGroup`, `headerBg`, `gridRow`, `gridCol`.

## Uang
- Gaji START normal Rp1 jt (`NORMAL_START_SALARY`); pemilik kartu Wantimpres: Rp76,5 jt (`WANTIMPRES_START_SALARY`, permanen).
- Bangunan level 0..5: Tanah Kosong, Rumah Subsidi 1, Rumah Subsidi 2, Rumah OKB, Dapur SPPG, KopDes.
  - Biaya upgrade (`BUILDING_UPGRADE_COSTS`): 0.5 jt, 1 jt, 1.5 jt, 2 jt, 3 jt.
  - Sewa sebagai fraksi harga tanah (`BUILDING_RENT_RATES`): 0.2, 0.4, 0.7, 1.0, 1.5, 2.5.
- Pinjaman antar pemain: bunga 1..200%, tenor 3 giliran peminjam (`LoanRecord`, `calculateLoanTotalDue`).
- Kas Negara (`stateTreasury`) menerima pajak/pungli/sewa tanah sitaan; tanah sitaan (`isSeizedByState`) hanya bisa dibeli via Sel Premium.
- `resolveRentRecipient(owner)` memutuskan sewa ke pemilik atau ke Negara.

## Status pemain
`NORMAL | DI_LAPAS | SEL_PREMIUM | DI_BEKASI | BANGKRUT`. Sel Premium: 3 giliran (`premiumTurnsLeft`). Bekasi = terlempar ke tengah papan.

## Kartu
- Kartu nasib: dek `TAKDIR` (biru, baik) dan `MUSIBAH` (buruk); `EXTREME_MUSIBAH_CARDS` aktif saat Eskalasi Negara (`checkExtremeEscalation`, berdasarkan `startPassCount` pemain).
- `FateEffectType`: `GAIN_MONEY, LOSE_MONEY, GAIN_MONEY_DICE, LOSE_MONEY_DICE, GOTO_BEKASI, GOTO_LAPAS, GOTO_START, GOTO_COURT, SEIZE_RANDOM_PROPERTY, GET_SAVED_CARD`. Efek berbasis dadu memakai `requiresDice` dan `diceMultiplier`.
- Kartu simpanan (`SavedCardKey`): `DOA_ORTU` (tameng), `DUKUN` (ubah dadu), `PEWARIS` (3 dadu), `FITNAH`, `DISKON_TOL`, `KHODAM` (+2 lemparan), `HARBOLNAS` (diskon 50% tanah kosong), `CASHBACK_99` (sewa Rp0), `ORANG_DALAM`, `WANTIMPRES`. Flag boost ada di `Player` (`shieldedByDoa`, `khodamBoost`, `pewarisBoost`, `diskonTolArmed`, `harbolnasArmed`, `cashbackArmed`, `wantimpresActive`).
- Tiap kartu diklon dengan `cloneSavedCard(template, suffix)` agar `id` unik.

## Mode durasi (`GameDurationMode`)
`FAST_10` (10 putaran), `FAST_15` (15 putaran, default), `WEALTH_25M` (target kekayaan bersih Rp25 jt), `CLASSIC` (sampai sisa 1 pemain). Dinilai oleh `checkGameEndCondition`; peringkat dari `rankPlayersByNetWorth` (uang + aset).

## Karakter avatar (8)
`ojol, emak, pns, mahasiswa, bakso, sultan, kurir, pengamen` (`AVATAR_CHARACTERS`). Gambar server di `public/avatars/` (nama `1..8.png` atau id karakter); resolusi lewat `resolvePublicAvatarsMap` / `resolveEffectivePawnImageUrl`. Lihat `public/avatars/PANDUAN_UPLOAD_AVATAR.md`.

## Pola test
`rules.test.ts` memakai `node:test` + `assert/strict` dan mengimpor fungsi murni dari `./rules`. Untuk fungsi baru: satu `test(...)` per perilaku, hindari angka acak (kirim dadu sebagai argumen).
