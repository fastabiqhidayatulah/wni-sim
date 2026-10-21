# Panduan Pindah ke Project Firebase Sendiri

Saat ini repo memakai project Firebase milik Google AI Studio (`gen-lang-client-0532444077`, database khusus `ai-studio-remixwnisimulato-...`). Kalau mau multiplayer serius untuk semua orang, pindah ke project sendiri supaya kuota, monitoring, dan rules ada di tanganmu.

## Langkah 1 — Buat project
1. Buka <https://console.firebase.google.com> dengan **akun Google milikmu** (bukan akun AI Studio).
2. **Add project** → beri nama (mis. `wni-simulator`) → Nonaktifkan Google Analytics (opsional) → Create.

## Langkah 2 — Aktifkan Authentication (Google)
1. Build → **Authentication** → Get started.
2. Sign-in method → **Google** → Enable → pilih support email project → Save.

## Langkah 3 — Buat Firestore
1. Build → **Firestore Database** → Create database.
2. Pilih **Production mode** → region `asia-southeast1` (Singapura, paling dekat Indonesia) → Enable.
3. Ini menghasilkan database id **`(default)`** — beda dengan config AI Studio yang memakai named database.

## Langkah 4 — Ambil config web & timpa `firebase-applet-config.json`
1. Project settings (ikon gear) → Your apps → **Web app (`</>`)** → Register app (nama bebas) → Register.
2. Salin object `firebaseConfig` yang muncul → timpa isi `firebase-applet-config.json` di root repo:
   - `projectId`, `appId`, `apiKey`, `authDomain`, `storageBucket`, `messagingSenderId` dari config baru.
   - `firestoreDatabaseId` → set ke `"(default)"` (koma & titik-koma di akhir JSON dihapus).
   - `oAuthClientId`: bisa dari config baru atau dikosongkan; `measurementId` `""`; `recaptchaSiteKey` `""`.
3. Config web BUKAN rahasia (sama seperti config yang sudah ada di repo) — aman ter-commit.

## Langkah 5 — Authorized domains (wajib, kalau tidak login gagal)
Authentication → Settings → **Authorized domains**: pastikan ada `localhost` (untuk `bun run dev`). Tambahkan domain hosting produksi kamu (mis. `xxx.web.app`, `xxx.firebaseapp.com`) saat sudah deploy.

## Langkah 6 — Deploy `firestore.rules`
Dari terminal di root repo:
```bash
npm i -g firebase-tools   # sekali saja
firebase login
firebase use <PROJECT_ID_BARU> --alias wniproject
firebase deploy --only firestore:rules
```
Atau manual: Firestore → Rules → tempel seluruh isi file `firestore.rules` → Publish. **Rules versi repo ini wajib yang ter-deploy** — berisi membership enforcement & jalur join.

Cek test kontrak: `npx tsx --test firestore.rules.test.ts`.

## Langkah 7 — Uji multiplayer
1. `bun run dev` → buka **dua browser/profile berbeda** (mis. Chrome + Edge, atau Chrome Incognito).
2. Login dengan **dua akun Google berbeda yang sudah diverifikasi** (akun sama = uid sama → dianggap satu pemain).
3. Profile A: buat room (otomatis login) → catat kode `WNI-XXX`.
4. Profile B: gabung room pakai kode itu → Start → main bersama.
5. Uji juga: host membubarkan room di layar akhir → tab lain wajib otomatis keluar ke Lobby.

## Kuota (tier Spark / gratis) — patokan
- 50K read + 20K write per hari. Gate divergensi lokal sudah memangkas write dari klien penerima; pemain 64 orang papan tetap berat — kalau mulai kena limit, naikkan debounce 350 ms (efek push di `App.tsx`) atau pertimbangkan Blaze plan.

## Troubleshooting
- `PERMISSION_DENIED` saat tulis: cek email akun sudah verified, dan `firestoreDatabaseId` cocok (`(default)` untuk project baru).
- Login popup gagal: cek Authorized domains memuat `localhost`.
- Setelah mengubah `firestore.rules`: **deploy ulang**, lalu test `npx tsx --test firestore.rules.test.ts`.
