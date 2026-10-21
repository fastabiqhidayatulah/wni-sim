export type TileType =
  | 'START'
  | 'PROPERTY'
  | 'TAKDIR'
  | 'MUSIBAH'
  | 'TAX'
  | 'TOLL'
  | 'JAIL'
  | 'PUNGLI'
  | 'COURT'
  | 'TILANG'
  | 'BEKASI';

export type BuildingLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const BUILDING_NAMES: Record<BuildingLevel, string> = {
  0: 'Tanah Kosong',
  1: 'Rumah Subsidi 1',
  2: 'Rumah Subsidi 2',
  3: 'Rumah OKB',
  4: 'Dapur SPPG',
  5: 'KopDes',
};

export const BUILDING_SHORT_NAMES: Record<BuildingLevel, string> = {
  0: 'T.Kosong',
  1: 'R.Sub 1',
  2: 'R.Sub 2',
  3: 'R.OKB',
  4: 'Dapur SPPG',
  5: 'KopDes',
};

/**
 * Biaya upgrade untuk naik KE tingkat tersebut (1..5) sesuai aturan Fase 2:
 * - Tingkat 1: Rumah Subsidi 1 (Biaya Rp500rb -> Sewa 40% harga tanah)
 * - Tingkat 2: Rumah Subsidi 2 (Biaya Rp1 Jt -> Sewa 70% harga tanah)
 * - Tingkat 3: Rumah OKB (Biaya Rp1,5 Jt -> Sewa 100% harga tanah)
 * - Tingkat 4: Dapur SPPG (Biaya Rp2 Jt -> Sewa 150% harga tanah)
 * - Tingkat 5: KopDes (Biaya Rp3 Jt -> Sewa 250% harga tanah)
 */
export const BUILDING_UPGRADE_COSTS: Record<BuildingLevel, number> = {
  0: 0,
  1: 500_000,
  2: 1_000_000,
  3: 1_500_000,
  4: 2_000_000,
  5: 3_000_000,
};

/**
 * Persentase sewa dari harga tanah (price) sesuai tingkat bangunan (0..5)
 */
export const BUILDING_RENT_RATES: Record<BuildingLevel, number> = {
  0: 0.2,
  1: 0.4,
  2: 0.7,
  3: 1.0,
  4: 1.5,
  5: 2.5,
};

export interface BoardTile {
  id: number;
  name: string;
  subtitle: string;
  type: TileType;
  price?: number;
  baseRent?: number;
  upgradeCost?: number;
  colorGroup?: string;
  headerBg?: string;
  gridRow: number; // 0..10 for 11x11 perimeter, 5 for Bekasi center
  gridCol: number; // 0..10 for 11x11 perimeter, 5 for Bekasi center
}

export type PlayerStatus = 'NORMAL' | 'DI_LAPAS' | 'SEL_PREMIUM' | 'DI_BEKASI' | 'BANGKRUT';

export type SavedCardKey =
  | 'DOA_ORTU'
  | 'DUKUN'
  | 'PEWARIS'
  | 'FITNAH'
  | 'DISKON_TOL'
  | 'KHODAM'
  | 'HARBOLNAS'
  | 'CASHBACK_99'
  | 'ORANG_DALAM'
  | 'WANTIMPRES';

export interface SavedCard {
  id: string;
  key: SavedCardKey;
  name: string;
  emoji: string;
  description: string;
  usageTiming: string;
  badgeColor: string;
  isPermanent?: boolean;
}

export interface LoanRecord {
  id: string;
  borrowerId: number;
  lenderId: number;
  principal: number;
  interestRate: number; // 1..200 (%)
  totalDue: number;
  remainingDue: number;
  turnsLeft: number; // 3 putaran giliran peminjam
}

export interface AvatarCharacter {
  id: string;
  title: string;
  tagline: string;
  emoji: string;
  color: string;
  bgLight: string;
  borderHex: string;
}

/**
 * 8 Karakter Avatar Pilihan Warga WNI Simulator (Fase 4 Player Select)
 */
export const AVATAR_CHARACTERS: AvatarCharacter[] = [
  {
    id: 'ojol',
    title: 'Driver Ojol',
    tagline: 'Penguasa Jalanan',
    emoji: '🛵',
    color: '#10b981',
    bgLight: 'rgba(16, 185, 129, 0.18)',
    borderHex: '#10b981',
  },
  {
    id: 'emak',
    title: 'Emak-Emak Matic',
    tagline: 'Sein Kiri Belok Kanan',
    emoji: '👩‍🦱',
    color: '#f43f5e',
    bgLight: 'rgba(244, 63, 94, 0.18)',
    borderHex: '#f43f5e',
  },
  {
    id: 'pns',
    title: 'PNS Konoha',
    tagline: 'Pejuang Tanggal Tua',
    emoji: '👔',
    color: '#3b82f6',
    bgLight: 'rgba(59, 130, 246, 0.18)',
    borderHex: '#3b82f6',
  },
  {
    id: 'mahasiswa',
    title: 'Mahasiswa Abadi',
    tagline: 'Semester 14',
    emoji: '🎓',
    color: '#f59e0b',
    bgLight: 'rgba(245, 158, 11, 0.18)',
    borderHex: '#f59e0b',
  },
  {
    id: 'bakso',
    title: 'Kang Bakso',
    tagline: 'Intel Kijang Satu',
    emoji: '🍜',
    color: '#06b6d4',
    bgLight: 'rgba(6, 182, 212, 0.18)',
    borderHex: '#06b6d4',
  },
  {
    id: 'sultan',
    title: 'Sultan OKB',
    tagline: 'Crazy Rich Dadakan',
    emoji: '💼',
    color: '#a855f7',
    bgLight: 'rgba(168, 85, 247, 0.18)',
    borderHex: '#a855f7',
  },
  {
    id: 'kurir',
    title: 'Kurir Paket',
    tagline: 'Lempar Paket Lari',
    emoji: '📦',
    color: '#f97316',
    bgLight: 'rgba(249, 115, 22, 0.18)',
    borderHex: '#f97316',
  },
  {
    id: 'pengamen',
    title: 'Pengamen Senja',
    tagline: 'Kopi & Puisi',
    emoji: '🎸',
    color: '#ec4899',
    bgLight: 'rgba(236, 72, 153, 0.18)',
    borderHex: '#ec4899',
  },
];

export interface Player {
  id: number;
  uid?: string;
  isHost?: boolean;
  isBot?: boolean;
  avatarId?: string;
  name: string;
  role: string;
  avatarEmoji: string;
  color: string;
  bgLight: string;
  borderHex: string;
  money: number;
  earnedIncome: number; // Pendapatan murni (transfer KASIH DUIT tidak dihitung di sini)
  giftedMoneyReceived: number; // Uang kiriman dari pemain lain
  position: number; // 0..39 perimeter, 40 = BEKASI
  lastPerimeterPosition: number;
  status: PlayerStatus;
  skipTurns: number;
  premiumTurnsLeft: number; // Sisa giliran di Sel Premium (3 giliran)
  upgradeTokens: number; // Kuota upgrade bangunan dari melewati/berhenti di START
  startPassCount: number; // Jumlah melewati/berhenti di START (untuk Eskalasi Negara)
  shieldedByDoa: boolean;
  khodamBoost: boolean; // +2 total lemparan dadu
  pewarisBoost: boolean; // Lempar 3 dadu sekaligus
  diskonTolArmed: boolean; // Bebas biaya Rp500rb di Gerbang Tol
  harbolnasArmed: boolean; // Diskon 50% beli tanah kosong
  cashbackArmed: boolean; // Sewa tanah jadi Rp0
  wantimpresActive: boolean; // Gaji lewat START jadi Rp76,5 Jt selamanya!
  savedCards: SavedCard[];
}

export interface PropertyState {
  tileId: number;
  ownerId: number | null; // null = belum dimiliki (atau Sitaan Negara jika isSeizedByState = true)
  level: BuildingLevel; // 0 = Tanah Kosong, 1..5 = Building upgrades
  isSeizedByState?: boolean; // Tanah Sitaan Negara (hanya bisa dibeli via Sel Premium, sewa masuk Negara)
}

export type FateEffectType =
  | 'GAIN_MONEY'
  | 'LOSE_MONEY'
  | 'GAIN_MONEY_DICE'
  | 'LOSE_MONEY_DICE'
  | 'GOTO_BEKASI'
  | 'GOTO_LAPAS'
  | 'GOTO_START'
  | 'GOTO_COURT'
  | 'SEIZE_RANDOM_PROPERTY'
  | 'GET_SAVED_CARD';

export interface FateCard {
  id: string;
  deck: 'TAKDIR' | 'MUSIBAH';
  title: string;
  flavorText: string;
  effectLabel: string;
  effectType: FateEffectType;
  amount?: number;
  requiresDice?: boolean;
  diceMultiplier?: number; // Contoh: 500_000 x angka dadu atau 300_000 x angka dadu
  savedCardKey?: SavedCardKey;
  isExtreme?: boolean;
}

export const PERIMETER_TILE_COUNT = 40;
export const TOLL_TILE_IDS = [5, 15, 25, 35];
export const BANDUNG_TILE_ID = 19;
export const LAPAS_TILE_ID = 10;
export const PUNGLI_TILE_ID = 20;
export const COURT_TILE_ID = 30;
export const BEKASI_TILE_ID = 40;

export const NORMAL_START_SALARY = 1_000_000;
export const WANTIMPRES_START_SALARY = 76_500_000;

/**
 * 10 Kartu Simpanan Lengkap sesuai spesifikasi Fase 3
 */
export const ALL_SAVED_CARDS: SavedCard[] = [
  {
    id: 'card-doa',
    key: 'DOA_ORTU',
    name: 'Doa Orang Tua',
    emoji: '🙏',
    description: 'Batalkan/abaikan kartu Takdir atau Musibah sebelum dadu kartu dilempar.',
    usageTiming: 'Saat Kartu Takdir/Musibah',
    badgeColor: '#10b981',
  },
  {
    id: 'card-dukun',
    key: 'DUKUN',
    name: 'Dukun',
    emoji: '🔮',
    description: 'Ubah angka 1 dadu menjadi angka berapa pun (1–6) setelah lempar dadu sebelum pion jalan.',
    usageTiming: 'Setelah Lempar Dadu',
    badgeColor: '#8b5cf6',
  },
  {
    id: 'card-pewaris',
    key: 'PEWARIS',
    name: 'Pewaris',
    emoji: '👑',
    description: 'Aktifkan sebelum lempar dadu: lemparan kali ini menggunakan 3 dadu sekaligus!',
    usageTiming: 'Sebelum Lempar Dadu',
    badgeColor: '#eab308',
  },
  {
    id: 'card-fitnah',
    key: 'FITNAH',
    name: 'Fitnah',
    emoji: '🗣️',
    description: 'Pilih target & lempar 1 dadu: 1-2 target ke Lapas; 3-4 kamu ke Lapas; 5-6 berdua ke Pengadilan (#30).',
    usageTiming: 'Sebelum Lempar Dadu',
    badgeColor: '#ef4444',
  },
  {
    id: 'card-diskon-tol',
    key: 'DISKON_TOL',
    name: 'Diskon Tol',
    emoji: '🎫',
    description: 'Bebas biaya Rp500 Rb saat mendarat di Gerbang Tol (tetap wajib pindah ke tol lain).',
    usageTiming: 'Saat di Gerbang Tol',
    badgeColor: '#06b6d4',
  },
  {
    id: 'card-khodam',
    key: 'KHODAM',
    name: 'Khodam',
    emoji: '✨',
    description: 'Tombol "Lempar + Khodam": menambah hasil total lemparan dadu +2 langkah!',
    usageTiming: 'Saat Mau Lempar Dadu',
    badgeColor: '#f59e0b',
  },
  {
    id: 'card-harbolnas',
    key: 'HARBOLNAS',
    name: 'Harbolnas 12.12',
    emoji: '🛍️',
    description: 'Diskon 50% (setengah harga) saat membeli tanah kosong di petak mana saja.',
    usageTiming: 'Saat Beli Tanah Kosong',
    badgeColor: '#ec4899',
  },
  {
    id: 'card-cashback',
    key: 'CASHBACK_99',
    name: 'Cashback 99%',
    emoji: '💸',
    description: 'Otomatis/diklik saat harus membayar sewa tanah ke pemain lain/Negara sehingga sewa jadi Rp0 (Gratis).',
    usageTiming: 'Saat Bayar Sewa Tanah',
    badgeColor: '#14b8a6',
  },
  {
    id: 'card-ordal',
    key: 'ORANG_DALAM',
    name: 'Orang Dalam',
    emoji: '🕴️',
    description: 'Digunakan saat di Lapas sebelum lempar dadu untuk langsung bebas gratis.',
    usageTiming: 'Saat di Lapas',
    badgeColor: '#3b82f6',
  },
  {
    id: 'card-wantimpres',
    key: 'WANTIMPRES',
    name: 'Kartu Wantimpres',
    emoji: '🏛️',
    description: 'Simulasi Google Play: Gaji setiap lewat START naik dari Rp1 Jt menjadi Rp76,5 Jt sampai game berakhir!',
    usageTiming: 'Permanen Sepanjang Game',
    badgeColor: '#a855f7',
    isPermanent: true,
  },
];

export const INITIAL_SAVED_CARDS = ALL_SAVED_CARDS;

export const BOARD_TILES: BoardTile[] = [
  // [Sisi Bawah / Baris Pertama]: 0..9 (row 10, col 10 -> 1)
  {
    id: 0,
    name: 'START',
    subtitle: 'Lahir / Gajian Rp1 Jt',
    type: 'START',
    headerBg: '#10b981',
    gridRow: 10,
    gridCol: 10,
  },
  {
    id: 1,
    name: 'Depok',
    subtitle: 'Rp1 Jt',
    type: 'PROPERTY',
    price: 1_000_000,
    baseRent: 200_000,
    upgradeCost: 500_000,
    colorGroup: 'PINGGIRAN',
    headerBg: '#92400e',
    gridRow: 10,
    gridCol: 9,
  },
  {
    id: 2,
    name: 'TAKDIR',
    subtitle: 'Kartu Biru',
    type: 'TAKDIR',
    headerBg: '#0284c7',
    gridRow: 10,
    gridCol: 8,
  },
  {
    id: 3,
    name: 'Bekasi Pinggiran',
    subtitle: 'Rp1,2 Jt',
    type: 'PROPERTY',
    price: 1_200_000,
    baseRent: 240_000,
    upgradeCost: 500_000,
    colorGroup: 'PINGGIRAN',
    headerBg: '#92400e',
    gridRow: 10,
    gridCol: 7,
  },
  {
    id: 4,
    name: 'Pajak Tahunan',
    subtitle: 'Rp500 Rb/Tanah',
    type: 'TAX',
    headerBg: '#dc2626',
    gridRow: 10,
    gridCol: 6,
  },
  {
    id: 5,
    name: 'Gerbang Tol Jagorawi',
    subtitle: 'Tol Rp500 Rb',
    type: 'TOLL',
    headerBg: '#475569',
    gridRow: 10,
    gridCol: 5,
  },
  {
    id: 6,
    name: 'Bogor',
    subtitle: 'Rp1,4 Jt',
    type: 'PROPERTY',
    price: 1_400_000,
    baseRent: 280_000,
    upgradeCost: 500_000,
    colorGroup: 'JABODETABEK',
    headerBg: '#0ea5e9',
    gridRow: 10,
    gridCol: 4,
  },
  {
    id: 7,
    name: 'MUSIBAH',
    subtitle: 'Kartu Merah',
    type: 'MUSIBAH',
    headerBg: '#e11d48',
    gridRow: 10,
    gridCol: 3,
  },
  {
    id: 8,
    name: 'Tangerang',
    subtitle: 'Rp1,5 Jt',
    type: 'PROPERTY',
    price: 1_500_000,
    baseRent: 300_000,
    upgradeCost: 500_000,
    colorGroup: 'JABODETABEK',
    headerBg: '#0ea5e9',
    gridRow: 10,
    gridCol: 2,
  },
  {
    id: 9,
    name: 'Tangsel / BSD',
    subtitle: 'Rp1,6 Jt',
    type: 'PROPERTY',
    price: 1_600_000,
    baseRent: 320_000,
    upgradeCost: 500_000,
    colorGroup: 'JABODETABEK',
    headerBg: '#0ea5e9',
    gridRow: 10,
    gridCol: 1,
  },

  // [Sisi Kiri]: 10..19 (row 10 -> 1, col 0)
  {
    id: 10,
    name: 'LAPAS / PENJARA',
    subtitle: 'Denda Rp500 Rb',
    type: 'JAIL',
    headerBg: '#334155',
    gridRow: 10,
    gridCol: 0,
  },
  {
    id: 11,
    name: 'Serang',
    subtitle: 'Rp1,8 Jt',
    type: 'PROPERTY',
    price: 1_800_000,
    baseRent: 360_000,
    upgradeCost: 500_000,
    colorGroup: 'BANTEN_JABAR',
    headerBg: '#d946ef',
    gridRow: 9,
    gridCol: 0,
  },
  {
    id: 12,
    name: 'Tilang Polisi',
    subtitle: 'Bayar Rp500 Rb',
    type: 'TILANG',
    headerBg: '#ef4444',
    gridRow: 8,
    gridCol: 0,
  },
  {
    id: 13,
    name: 'Cirebon',
    subtitle: 'Rp1,8 Jt',
    type: 'PROPERTY',
    price: 1_800_000,
    baseRent: 360_000,
    upgradeCost: 500_000,
    colorGroup: 'BANTEN_JABAR',
    headerBg: '#d946ef',
    gridRow: 7,
    gridCol: 0,
  },
  {
    id: 14,
    name: 'Sukabumi',
    subtitle: 'Rp2 Jt',
    type: 'PROPERTY',
    price: 2_000_000,
    baseRent: 400_000,
    upgradeCost: 500_000,
    colorGroup: 'BANTEN_JABAR',
    headerBg: '#d946ef',
    gridRow: 6,
    gridCol: 0,
  },
  {
    id: 15,
    name: 'Gerbang Tol Cipularang',
    subtitle: 'Tol Rp500 Rb',
    type: 'TOLL',
    headerBg: '#475569',
    gridRow: 5,
    gridCol: 0,
  },
  {
    id: 16,
    name: 'Tasikmalaya',
    subtitle: 'Rp2,2 Jt',
    type: 'PROPERTY',
    price: 2_200_000,
    baseRent: 440_000,
    upgradeCost: 500_000,
    colorGroup: 'PRIANGAN',
    headerBg: '#f97316',
    gridRow: 4,
    gridCol: 0,
  },
  {
    id: 17,
    name: 'TAKDIR',
    subtitle: 'Kartu Biru',
    type: 'TAKDIR',
    headerBg: '#0284c7',
    gridRow: 3,
    gridCol: 0,
  },
  {
    id: 18,
    name: 'Karawang',
    subtitle: 'Rp2,2 Jt',
    type: 'PROPERTY',
    price: 2_200_000,
    baseRent: 440_000,
    upgradeCost: 500_000,
    colorGroup: 'PRIANGAN',
    headerBg: '#f97316',
    gridRow: 2,
    gridCol: 0,
  },
  {
    id: 19,
    name: 'Bandung',
    subtitle: 'Rp2,4 Jt',
    type: 'PROPERTY',
    price: 2_400_000,
    baseRent: 480_000,
    upgradeCost: 500_000,
    colorGroup: 'PRIANGAN',
    headerBg: '#f97316',
    gridRow: 1,
    gridCol: 0,
  },

  // [Sisi Atas]: 20..29 (row 0, col 0 -> 9)
  {
    id: 20,
    name: 'PARKIRAN PUNGLI',
    subtitle: 'Rp1 Jt (Gratis Punya Bdg)',
    type: 'PUNGLI',
    headerBg: '#ea580c',
    gridRow: 0,
    gridCol: 0,
  },
  {
    id: 21,
    name: 'Pekalongan',
    subtitle: 'Rp2,6 Jt',
    type: 'PROPERTY',
    price: 2_600_000,
    baseRent: 520_000,
    upgradeCost: 500_000,
    colorGroup: 'PANTURA',
    headerBg: '#e11d48',
    gridRow: 0,
    gridCol: 1,
  },
  {
    id: 22,
    name: 'MUSIBAH',
    subtitle: 'Kartu Merah',
    type: 'MUSIBAH',
    headerBg: '#e11d48',
    gridRow: 0,
    gridCol: 2,
  },
  {
    id: 23,
    name: 'Tegal',
    subtitle: 'Rp2,6 Jt',
    type: 'PROPERTY',
    price: 2_600_000,
    baseRent: 520_000,
    upgradeCost: 500_000,
    colorGroup: 'PANTURA',
    headerBg: '#e11d48',
    gridRow: 0,
    gridCol: 3,
  },
  {
    id: 24,
    name: 'Semarang',
    subtitle: 'Rp2,8 Jt',
    type: 'PROPERTY',
    price: 2_800_000,
    baseRent: 560_000,
    upgradeCost: 500_000,
    colorGroup: 'PANTURA',
    headerBg: '#e11d48',
    gridRow: 0,
    gridCol: 4,
  },
  {
    id: 25,
    name: 'Gerbang Tol Trans Jawa',
    subtitle: 'Tol Rp500 Rb',
    type: 'TOLL',
    headerBg: '#475569',
    gridRow: 0,
    gridCol: 5,
  },
  {
    id: 26,
    name: 'Solo',
    subtitle: 'Rp3 Jt',
    type: 'PROPERTY',
    price: 3_000_000,
    baseRent: 600_000,
    upgradeCost: 500_000,
    colorGroup: 'MATARAM',
    headerBg: '#eab308',
    gridRow: 0,
    gridCol: 6,
  },
  {
    id: 27,
    name: 'Magelang',
    subtitle: 'Rp3 Jt',
    type: 'PROPERTY',
    price: 3_000_000,
    baseRent: 600_000,
    upgradeCost: 500_000,
    colorGroup: 'MATARAM',
    headerBg: '#eab308',
    gridRow: 0,
    gridCol: 7,
  },
  {
    id: 28,
    name: 'Pajak Bumi Bangunan',
    subtitle: 'Rp500 Rb/Tanah',
    type: 'TAX',
    headerBg: '#dc2626',
    gridRow: 0,
    gridCol: 8,
  },
  {
    id: 29,
    name: 'Yogyakarta',
    subtitle: 'Rp3,2 Jt',
    type: 'PROPERTY',
    price: 3_200_000,
    baseRent: 640_000,
    upgradeCost: 500_000,
    colorGroup: 'MATARAM',
    headerBg: '#eab308',
    gridRow: 0,
    gridCol: 9,
  },

  // [Sisi Kanan]: 30..39 (row 0 -> 9, col 10)
  {
    id: 30,
    name: 'PENGADILAN',
    subtitle: 'Meja Hijau',
    type: 'COURT',
    headerBg: '#0f766e',
    gridRow: 0,
    gridCol: 10,
  },
  {
    id: 31,
    name: 'Malang',
    subtitle: 'Rp3,4 Jt',
    type: 'PROPERTY',
    price: 3_400_000,
    baseRent: 680_000,
    upgradeCost: 500_000,
    colorGroup: 'TIMUR_BALI',
    headerBg: '#16a34a',
    gridRow: 1,
    gridCol: 10,
  },
  {
    id: 32,
    name: 'Surabaya',
    subtitle: 'Rp3,5 Jt',
    type: 'PROPERTY',
    price: 3_500_000,
    baseRent: 700_000,
    upgradeCost: 500_000,
    colorGroup: 'TIMUR_BALI',
    headerBg: '#16a34a',
    gridRow: 2,
    gridCol: 10,
  },
  {
    id: 33,
    name: 'TAKDIR',
    subtitle: 'Kartu Biru',
    type: 'TAKDIR',
    headerBg: '#0284c7',
    gridRow: 3,
    gridCol: 10,
  },
  {
    id: 34,
    name: 'Bali / Denpasar',
    subtitle: 'Rp3,8 Jt',
    type: 'PROPERTY',
    price: 3_800_000,
    baseRent: 760_000,
    upgradeCost: 500_000,
    colorGroup: 'TIMUR_BALI',
    headerBg: '#16a34a',
    gridRow: 4,
    gridCol: 10,
  },
  {
    id: 35,
    name: 'Gerbang Tol Bali Mandara',
    subtitle: 'Tol Rp500 Rb',
    type: 'TOLL',
    headerBg: '#475569',
    gridRow: 5,
    gridCol: 10,
  },
  {
    id: 36,
    name: 'MUSIBAH',
    subtitle: 'Kartu Merah',
    type: 'MUSIBAH',
    headerBg: '#e11d48',
    gridRow: 6,
    gridCol: 10,
  },
  {
    id: 37,
    name: 'Medan',
    subtitle: 'Rp4 Jt',
    type: 'PROPERTY',
    price: 4_000_000,
    baseRent: 800_000,
    upgradeCost: 500_000,
    colorGroup: 'SULTAN',
    headerBg: '#4f46e5',
    gridRow: 7,
    gridCol: 10,
  },
  {
    id: 38,
    name: 'Tilang Elektronik / ETLE',
    subtitle: 'Bayar Rp500 Rb',
    type: 'TILANG',
    headerBg: '#ef4444',
    gridRow: 8,
    gridCol: 10,
  },
  {
    id: 39,
    name: 'Jakarta Selatan / SCBD',
    subtitle: 'Rp4,5 Jt',
    type: 'PROPERTY',
    price: 4_500_000,
    baseRent: 900_000,
    upgradeCost: 500_000,
    colorGroup: 'SULTAN',
    headerBg: '#4f46e5',
    gridRow: 9,
    gridCol: 10,
  },
];

export const BEKASI_CENTER_TILE: BoardTile = {
  id: 40,
  name: 'BEKASI',
  subtitle: 'Planet Lain (Skip 1 Giliran)',
  type: 'BEKASI',
  headerBg: '#9333ea',
  gridRow: 5,
  gridCol: 5,
};

export const TAKDIR_CARDS: FateCard[] = [
  {
    id: 'takdir-bansos-dadu',
    deck: 'TAKDIR',
    title: 'Bansos Cair / Bantuan UMKM!',
    flavorText: 'Nama kamu masuk daftar penerima Bantuan UMKM & Bansos pusat! Lempar 1 dadu untuk menentukan nominal pencairan dari Negara.',
    effectLabel: 'Lempar 1 Dadu: Dapat Rp500 Rb × Angka Dadu',
    effectType: 'GAIN_MONEY_DICE',
    requiresDice: true,
    diceMultiplier: 500_000,
  },
  {
    id: 'takdir-bekasi',
    deck: 'TAKDIR',
    title: 'Digoreng Netizen Viral!',
    flavorText: 'Salah ketik komentar di medsos, akunmu diserbu netizen +62 sampai diasingkan ke luar angkasa: PLANET BEKASI (#40)!',
    effectLabel: 'Terlempar ke #40 BEKASI (Skip 1 Giliran)',
    effectType: 'GOTO_BEKASI',
  },
  {
    id: 'takdir-viral-meme',
    deck: 'TAKDIR',
    title: 'Viral Jadi Meme Nasional!',
    flavorText: 'Video komplain jalan berlubangmu ditonton 20 juta orang. Diundang podcast & dapat endorse obat masuk angin!',
    effectLabel: 'Dapat Uang Rp1,5 Jt dari Endorse',
    effectType: 'GAIN_MONEY',
    amount: 1_500_000,
  },
  {
    id: 'takdir-ordal',
    deck: 'TAKDIR',
    title: 'Ketemu Paman Orang Dalam!',
    flavorText: 'Pas kondangan ketemu paman jauh yang ternyata pejabat eselon. Dikasih kartu nama sakti!',
    effectLabel: 'Dapat Kartu Simpanan: 🕴️ Orang Dalam',
    effectType: 'GET_SAVED_CARD',
    savedCardKey: 'ORANG_DALAM',
  },
  {
    id: 'takdir-harbolnas',
    deck: 'TAKDIR',
    title: 'Menang Flash Sale Harbolnas 12.12!',
    flavorText: 'Jempolmu secepat kilat saat war voucher tengah malam! Dapat kupon beli tanah diskon 50%.',
    effectLabel: 'Dapat Kartu Simpanan: 🛍️ Harbolnas 12.12',
    effectType: 'GET_SAVED_CARD',
    savedCardKey: 'HARBOLNAS',
  },
  {
    id: 'takdir-cashback',
    deck: 'TAKDIR',
    title: 'Promo Cashback 99% E-Wallet!',
    flavorText: 'Aplikasi dompet digital lagi bakar duit! Kamu dapat voucher bebas bayar sewa tanah 1 kali.',
    effectLabel: 'Dapat Kartu Simpanan: 💸 Cashback 99%',
    effectType: 'GET_SAVED_CARD',
    savedCardKey: 'CASHBACK_99',
  },
  {
    id: 'takdir-pewaris',
    deck: 'TAKDIR',
    title: 'Warisan Kakek Konglomerat!',
    flavorText: 'Ternyata kakek buyutmu punya kebun sawit! Kamu mendapat privilese Kartu Pewaris (3 Dadu).',
    effectLabel: 'Dapat Kartu Simpanan: 👑 Pewaris',
    effectType: 'GET_SAVED_CARD',
    savedCardKey: 'PEWARIS',
  },
  {
    id: 'takdir-start',
    deck: 'TAKDIR',
    title: 'Cepat Pulang Kampung (START)!',
    flavorText: 'Dapat tumpangan helikopter dinas, langsung meluncur ke garis START dan terima gaji bulanan!',
    effectLabel: 'Maju ke START (Gajian + Kuota Upgrade)',
    effectType: 'GOTO_START',
  },
];

export const MUSIBAH_CARDS: FateCard[] = [
  {
    id: 'musibah-razia-dadu',
    deck: 'MUSIBAH',
    title: 'Razia Pajak Mendadak / Proyek Mangkrak!',
    flavorText: 'Tim audit pajak datang memeriksa pembukuan warungmu. Lempar 1 dadu untuk menentukan denda Rp300 Rb × angka dadu ke Negara!',
    effectLabel: 'Lempar 1 Dadu: Bayar Rp300 Rb × Angka Dadu',
    effectType: 'LOSE_MONEY_DICE',
    requiresDice: true,
    diceMultiplier: 300_000,
  },
  {
    id: 'musibah-proyek-strategis',
    deck: 'MUSIBAH',
    title: 'Tanah Disulap Jadi Proyek Strategis!',
    flavorText: 'Satu tanah milikmu terkena gusuran Proyek Strategis & disita menjadi aset Negara (atau denda Rp500 Rb jika belum punya tanah)!',
    effectLabel: '1 Tanah Acak Milikmu Disita Negara!',
    effectType: 'SEIZE_RANDOM_PROPERTY',
  },
  {
    id: 'musibah-bekasi',
    deck: 'MUSIBAH',
    title: 'Digoreng Netizen Viral!',
    flavorText: 'Ketahuan nyerobot antrean BBM subsidi, wajahmu viral di akun gosip dan dideportasi ke Planet Bekasi (#40)!',
    effectLabel: 'Terlempar ke #40 BEKASI (Skip 1 Giliran)',
    effectType: 'GOTO_BEKASI',
  },
  {
    id: 'musibah-kondangan',
    deck: 'MUSIBAH',
    title: 'Kondangan 5 Teman Sekaligus!',
    flavorText: 'Tanggal tua tapi undangan grup WA numpuk. Terpaksa isi amplop demi menjaga martabat.',
    effectLabel: 'Bayar Rp1 Jt ke Kas Negara',
    effectType: 'LOSE_MONEY',
    amount: 1_000_000,
  },
  {
    id: 'musibah-lapas',
    deck: 'MUSIBAH',
    title: 'Terciduk Razia Gabungan!',
    flavorText: 'Lupa bawa STNK dan pajak mati 3 tahun. Langsung diangkut mobil patroli menuju Lapas (#10)!',
    effectLabel: 'Masuk LAPAS (#10) Sekarang',
    effectType: 'GOTO_LAPAS',
  },
  {
    id: 'musibah-court',
    deck: 'MUSIBAH',
    title: 'Dipanggil ke Meja Hijau!',
    flavorText: 'Gara-gara sengketa patok tanah warisan 2 sentimeter, kamu harus menghadap Hakim di Pengadilan (#30)!',
    effectLabel: 'Pindah ke PENGADILAN (#30)',
    effectType: 'GOTO_COURT',
  },
];

/**
 * Kartu Tambahan saat ESKALASI NEGARA ("MUSIBAH EKSTREM AKTIF!")
 * Aktif setelah semua pemain melewati START minimal 2 kali.
 */
export const EXTREME_MUSIBAH_CARDS: FateCard[] = [
  {
    id: 'musibah-ekstrem-audit',
    deck: 'MUSIBAH',
    title: '🔥 [EKSTREM] Audit Pajak Lapis Tujuh!',
    flavorText: 'Eskalasi Negara aktif! Denda razia naik 2x lipat: lempar 1 dadu dan bayar Rp600 Rb × angka dadu ke Kas Negara!',
    effectLabel: 'Lempar 1 Dadu: Bayar Rp600 Rb × Angka Dadu',
    effectType: 'LOSE_MONEY_DICE',
    requiresDice: true,
    diceMultiplier: 600_000,
    isExtreme: true,
  },
  {
    id: 'musibah-ekstrem-sita',
    deck: 'MUSIBAH',
    title: '🔥 [EKSTREM] Nasionalisasi Aset Darurat!',
    flavorText: 'Negara membutuhkan lahan tambahan! 1 tanah milikmu langsung disita menjadi SITAAN NEGARA tanpa ganti rugi.',
    effectLabel: 'Sita Paksa 1 Tanah Milikmu ke Negara!',
    effectType: 'SEIZE_RANDOM_PROPERTY',
    isExtreme: true,
  },
  {
    id: 'musibah-ekstrem-inflasi',
    deck: 'MUSIBAH',
    title: '🔥 [EKSTREM] Krisis Moneter & PPN Naik!',
    flavorText: 'Harga kebutuhan pokok meroket tajam akibat eskalasi Negara. Kamu wajib setor Rp2 Jt ke Kas Negara!',
    effectLabel: 'Bayar Denda Ekstrem Rp2 Jt ke Negara',
    effectType: 'LOSE_MONEY',
    amount: 2_000_000,
    isExtreme: true,
  },
];

/**
 * Mengacak array kartu (Fisher-Yates shuffle) untuk membuat tumpukan dek
 */
export function shuffleDeck<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/**
 * Mengecek apakah Eskalasi Negara ("MUSIBAH EKSTREM AKTIF!") sudah terpenuhi:
 * Semua pemain yang belum bangkrut telah melewati START minimal 2 kali.
 */
export function checkExtremeEscalation(players: Player[]): boolean {
  const active = players.filter((p) => p.status !== 'BANGKRUT');
  if (active.length === 0) return false;
  return active.every((p) => p.startPassCount >= 2);
}

export function cloneSavedCard(template: SavedCard, suffix: string): SavedCard {
  return {
    ...template,
    id: `${template.id}-${suffix}`,
  };
}

export function generateRoomCode(): string {
  const randomDigits = Math.floor(100 + Math.random() * 900);
  return `WNI-${randomDigits}`;
}

/**
 * Derive daftar uid pemain MANUSIA di room (tanpa bot) untuk field top-level
 * `memberUids` di dokumen Firestore. Field ini yang dibaca `firestore.rules`
 * untuk validasi keanggotaan: hanya anggota yang boleh menulis state penuh,
 * selain pendatang lewat jalur join. Daftar ini monoton (tidak pernah menyusut)
 * karena alur game hanya menambah manusia atau mengganti/membuang bot.
 */
export function deriveMemberUids(players: Player[]): string[] {
  const seen = new Set<string>();
  const uids: string[] = [];
  players.forEach((p) => {
    if (p.isBot) return;
    const uid = String(p.uid || '').slice(0, 128);
    if (!uid || seen.has(uid)) return;
    seen.add(uid);
    uids.push(uid);
  });
  return uids.slice(0, 64);
}

export function createPlayerFromAvatar(params: {
  id: number;
  name: string;
  avatarId: string;
  uid?: string;
  isHost?: boolean;
  isBot?: boolean;
}): Player {
  const avatar =
    AVATAR_CHARACTERS.find((a) => a.id === params.avatarId) ||
    AVATAR_CHARACTERS[params.id % AVATAR_CHARACTERS.length];
  const cleanName = params.name.trim().slice(0, 40) || avatar.title;
  return {
    id: params.id,
    uid: params.uid || `p-${params.id}`,
    isHost: Boolean(params.isHost),
    isBot: Boolean(params.isBot),
    avatarId: avatar.id,
    name: cleanName,
    role: `${avatar.title} · "${avatar.tagline}"`,
    avatarEmoji: avatar.emoji,
    color: avatar.color,
    bgLight: avatar.bgLight,
    borderHex: avatar.borderHex,
    money: 10_000_000,
    earnedIncome: 10_000_000,
    giftedMoneyReceived: 0,
    position: 0,
    lastPerimeterPosition: 0,
    status: 'NORMAL',
    skipTurns: 0,
    premiumTurnsLeft: 0,
    upgradeTokens: 1,
    startPassCount: 0,
    shieldedByDoa: false,
    khodamBoost: false,
    pewarisBoost: false,
    diskonTolArmed: false,
    harbolnasArmed: false,
    cashbackArmed: false,
    wantimpresActive: false,
    savedCards: ALL_SAVED_CARDS.map((c) => cloneSavedCard(c, `p${params.id}`)),
  };
}

const BOT_NAMES_POOL = [
  'Bang Jago',
  'Bu Tejo',
  'Pak Camat',
  'Dimas S14',
  'Mang Ujang',
  'Bos Raffi',
  'Mas Kurir',
  'Senja Indie',
  'Ceu Edoh',
  'Pak RT Galak',
  'Mas Agus',
  'Mbak Rara',
  'Kang Cilok',
  'Bunda Corla',
  'Koh Ernest',
  'Bang Bewok',
  'Tante Lala',
  'Om Deddy',
  'Kang Parkir',
  'Wak Doyok',
];

export function generateBotPlayers(
  existingPlayers: Player[],
  countToAdd: number,
  maxPlayersCap: number = 64
): Player[] {
  const cap = Math.min(64, Math.max(2, maxPlayersCap));
  const result = [...existingPlayers];
  const nextStartId =
    result.length > 0 ? Math.max(...result.map((p) => p.id)) + 1 : 0;

  let added = 0;
  while (result.length < cap && added < countToAdd) {
    const newId = nextStartId + added;
    const avatar = AVATAR_CHARACTERS[newId % AVATAR_CHARACTERS.length];
    const baseBotName = BOT_NAMES_POOL[newId % BOT_NAMES_POOL.length];
    const botLabel =
      newId >= BOT_NAMES_POOL.length
        ? `${baseBotName} #${newId + 1}`
        : `${baseBotName} (${avatar.title.split(' ')[0]})`;

    result.push(
      createPlayerFromAvatar({
        id: newId,
        name: botLabel,
        avatarId: avatar.id,
        uid: `bot-${newId}`,
        isHost: false,
        isBot: true,
      })
    );
    added += 1;
  }

  return result;
}

/**
 * Buat daftar pemain awal saat Host menekan "BUAT ROOM BARU":
 * HANYA berisi 1 pemain (Host itu sendiri), TANPA Bot otomatis!
 */
export function createHostOnlyRoomPlayers(params: {
  hostName: string;
  avatarId: string;
  uid?: string;
}): Player[] {
  const hostPlayer = createPlayerFromAvatar({
    id: 0,
    name: params.hostName || 'Warga Host',
    avatarId: params.avatarId,
    uid: params.uid || 'host-0',
    isHost: true,
    isBot: false,
  });
  return [hostPlayer];
}

/**
 * Hapus 1 Bot berdasarkan ID pemain dari daftar Waiting Room
 */
export function removeBotFromRoom(players: Player[], botId: number): Player[] {
  return players.filter((p) => !(p.isBot && p.id === botId));
}

/**
 * Hapus seluruh Bot dari daftar Waiting Room (menyisakan hanya pemain manusia asli)
 */
export function removeAllBotsFromRoom(players: Player[]): Player[] {
  return players.filter((p) => !p.isBot);
}

/**
 * Prioritas Pemain Asli saat Join Room (Auto-Replace Bot):
 * - Jika pemain manusia sudah ada di room (berdasarkan uid), perbarui profilnya atau biarkan.
 * - Jika jumlah pemain < maxPlayers, tambahkan pemain manusia baru di slot kosong.
 * - Jika jumlah pemain >= maxPlayers, cek apakah ada pemain dengan isBot === true:
 *   * Jika ada Bot, otomatis keluarkan/ganti 1 Bot terakhir dengan pemain manusia yang baru masuk!
 *   * Tampilkan pesan "Room Penuh" HANYA jika seluruh slot sudah terisi oleh pemain manusia asli (!isBot).
 */
export function resolveHumanJoinRoomPlayers(params: {
  existingPlayers: Player[];
  maxPlayers: number;
  joiningPlayer: {
    name: string;
    avatarId: string;
    uid: string;
  };
}): {
  ok: boolean;
  updatedPlayers: Player[];
  replacedBotName?: string;
  errorMessage?: string;
  alreadyInRoom: boolean;
} {
  const { existingPlayers, maxPlayers, joiningPlayer } = params;
  const cap = Math.min(64, Math.max(2, maxPlayers));

  const existingHumanIdx = existingPlayers.findIndex(
    (p) => !p.isBot && p.uid === joiningPlayer.uid
  );
  if (existingHumanIdx !== -1) {
    return {
      ok: true,
      updatedPlayers: [...existingPlayers],
      alreadyInRoom: true,
    };
  }

  const nextId =
    existingPlayers.length > 0
      ? Math.max(...existingPlayers.map((p) => p.id)) + 1
      : 0;

  const newHumanPlayer = createPlayerFromAvatar({
    id: nextId,
    name: joiningPlayer.name,
    avatarId: joiningPlayer.avatarId,
    uid: joiningPlayer.uid,
    isHost: false,
    isBot: false,
  });

  // Jika masih ada slot kosong (< maxPlayers), langsung masukkan
  if (existingPlayers.length < cap) {
    return {
      ok: true,
      updatedPlayers: [...existingPlayers, newHumanPlayer],
      alreadyInRoom: false,
    };
  }

  // Jika jumlah pemain sudah mencapai maxPlayers, cari Bot terakhir untuk digantikan
  let lastBotIndex = -1;
  for (let i = existingPlayers.length - 1; i >= 0; i--) {
    if (existingPlayers[i].isBot) {
      lastBotIndex = i;
      break;
    }
  }

  if (lastBotIndex !== -1) {
    const replacedBot = existingPlayers[lastBotIndex];
    const updatedPlayers = [...existingPlayers];
    updatedPlayers.splice(lastBotIndex, 1, {
      ...newHumanPlayer,
      id: replacedBot.id,
    });
    return {
      ok: true,
      updatedPlayers,
      replacedBotName: replacedBot.name,
      alreadyInRoom: false,
    };
  }

  // Seluruh slot sudah terisi oleh pemain manusia asli (!isBot)
  return {
    ok: false,
    updatedPlayers: existingPlayers,
    errorMessage: `Room Penuh! Seluruh ${cap} slot sudah terisi oleh pemain manusia asli.`,
    alreadyInRoom: false,
  };
}

export function createInitialPlayers(): Player[] {
  return [
    {
      id: 0,
      name: 'Bang Jago (Ojol)',
      role: 'Player 1 · Ojol',
      avatarId: 'ojol',
      avatarEmoji: '🛵',
      color: '#10b981',
      bgLight: 'rgba(16, 185, 129, 0.18)',
      borderHex: '#10b981',
      money: 10_000_000,
      earnedIncome: 10_000_000,
      giftedMoneyReceived: 0,
      position: 0,
      lastPerimeterPosition: 0,
      status: 'NORMAL',
      skipTurns: 0,
      premiumTurnsLeft: 0,
      upgradeTokens: 1,
      startPassCount: 0,
      shieldedByDoa: false,
      khodamBoost: false,
      pewarisBoost: false,
      diskonTolArmed: false,
      harbolnasArmed: false,
      cashbackArmed: false,
      wantimpresActive: false,
      // Player 1 dibekali ke-10 Kartu Simpanan agar semua fitur Fase 3 dapat langsung diuji & dimainkan
      savedCards: ALL_SAVED_CARDS.map((c) => cloneSavedCard(c, 'p0')),
    },
    {
      id: 1,
      name: 'Bu Tejo (Emak-emak)',
      role: 'Player 2 · Emak-emak',
      avatarId: 'emak',
      avatarEmoji: '👩‍🦱',
      color: '#f43f5e',
      bgLight: 'rgba(244, 63, 94, 0.18)',
      borderHex: '#f43f5e',
      money: 10_000_000,
      earnedIncome: 10_000_000,
      giftedMoneyReceived: 0,
      position: 0,
      lastPerimeterPosition: 0,
      status: 'NORMAL',
      skipTurns: 0,
      premiumTurnsLeft: 0,
      upgradeTokens: 1,
      startPassCount: 0,
      shieldedByDoa: false,
      khodamBoost: false,
      pewarisBoost: false,
      diskonTolArmed: false,
      harbolnasArmed: false,
      cashbackArmed: false,
      wantimpresActive: false,
      savedCards: ALL_SAVED_CARDS.map((c) => cloneSavedCard(c, 'p1')),
    },
    {
      id: 2,
      name: 'Pak Camat (PNS)',
      role: 'Player 3 · PNS',
      avatarId: 'pns',
      avatarEmoji: '👔',
      color: '#3b82f6',
      bgLight: 'rgba(59, 130, 246, 0.18)',
      borderHex: '#3b82f6',
      money: 10_000_000,
      earnedIncome: 10_000_000,
      giftedMoneyReceived: 0,
      position: 0,
      lastPerimeterPosition: 0,
      status: 'NORMAL',
      skipTurns: 0,
      premiumTurnsLeft: 0,
      upgradeTokens: 1,
      startPassCount: 0,
      shieldedByDoa: false,
      khodamBoost: false,
      pewarisBoost: false,
      diskonTolArmed: false,
      harbolnasArmed: false,
      cashbackArmed: false,
      wantimpresActive: false,
      savedCards: ALL_SAVED_CARDS.map((c) => cloneSavedCard(c, 'p2')),
    },
    {
      id: 3,
      name: 'Dimas (Mahasiswa)',
      role: 'Player 4 · Mahasiswa',
      avatarId: 'mahasiswa',
      avatarEmoji: '🎓',
      color: '#f59e0b',
      bgLight: 'rgba(245, 158, 11, 0.18)',
      borderHex: '#f59e0b',
      money: 10_000_000,
      earnedIncome: 10_000_000,
      giftedMoneyReceived: 0,
      position: 0,
      lastPerimeterPosition: 0,
      status: 'NORMAL',
      skipTurns: 0,
      premiumTurnsLeft: 0,
      upgradeTokens: 1,
      startPassCount: 0,
      shieldedByDoa: false,
      khodamBoost: false,
      pewarisBoost: false,
      diskonTolArmed: false,
      harbolnasArmed: false,
      cashbackArmed: false,
      wantimpresActive: false,
      savedCards: ALL_SAVED_CARDS.map((c) => cloneSavedCard(c, 'p3')),
    },
  ];
}

export function createInitialProperties(): Record<number, PropertyState> {
  const map: Record<number, PropertyState> = {};
  for (const tile of BOARD_TILES) {
    if (tile.type === 'PROPERTY') {
      map[tile.id] = {
        tileId: tile.id,
        ownerId: null,
        level: 0,
        isSeizedByState: false,
      };
    }
  }
  return map;
}

/**
 * Formats integer Rupiah values into compact Indonesian labels (e.g. Rp10 Jt, Rp76,5 Jt, Rp500 Rb).
 */
export function formatRupiah(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(Math.round(amount));
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const formatted = Number.isInteger(millions)
      ? millions.toString()
      : millions.toFixed(1).replace('.', ',').replace(/,0$/, '');
    return `${sign}Rp${formatted} Jt`;
  }
  if (abs >= 1_000) {
    const thousands = Math.round(abs / 1_000);
    return `${sign}Rp${thousands} Rb`;
  }
  return `${sign}Rp${abs}`;
}

/**
 * Menghitung gaji START sesuai status Kartu Wantimpres (Rp1 Jt normal vs Rp76,5 Jt Wantimpres)
 */
export function getStartSalaryForPlayer(player: Pick<Player, 'wantimpresActive'>): number {
  return player.wantimpresActive ? WANTIMPRES_START_SALARY : NORMAL_START_SALARY;
}

/**
 * Calculates step-by-step perimeter movement from currentPosition (0..39) by steps.
 */
export function calculateMovement(
  currentPosition: number,
  steps: number,
  wantimpresActive: boolean = false
): {
  path: number[];
  newPosition: number;
  passedOrLandedStart: boolean;
  salaryEarned: number;
} {
  const startPos = currentPosition >= PERIMETER_TILE_COUNT ? 0 : currentPosition;
  const path: number[] = [];
  let passedOrLandedStart = false;

  for (let i = 1; i <= steps; i++) {
    const nextTile = (startPos + i) % PERIMETER_TILE_COUNT;
    path.push(nextTile);
    if (nextTile === 0) {
      passedOrLandedStart = true;
    }
  }

  const newPosition = path.length > 0 ? path[path.length - 1] : startPos;
  const salaryRate = wantimpresActive ? WANTIMPRES_START_SALARY : NORMAL_START_SALARY;
  return {
    path,
    newPosition,
    passedOrLandedStart,
    salaryEarned: passedOrLandedStart ? salaryRate : 0,
  };
}

/**
 * Calculates property rent according to Fase 2 exact percentage rules
 */
export function calculatePropertyRent(tile: BoardTile, level: BuildingLevel): number {
  const price = tile.price ?? 1_000_000;
  const rate = BUILDING_RENT_RATES[level] ?? 0.2;
  return Math.round(price * rate);
}

/**
 * Returns the upgrade cost to upgrade from currentLevel to (currentLevel + 1).
 */
export function getUpgradeCostForNextLevel(nextLevel: BuildingLevel): number {
  return BUILDING_UPGRADE_COSTS[nextLevel] ?? 500_000;
}

/**
 * Menghitung nilai jual kembali (50% ke Negara) untuk 1 tingkat bangunan atau gadai/jual tanah.
 */
export function calculateSellBuildingValue(level: BuildingLevel): number {
  if (level <= 0) return 0;
  return Math.round((BUILDING_UPGRADE_COSTS[level] ?? 500_000) * 0.5);
}

export function calculateSellLandValue(tile: BoardTile, currentLevel: BuildingLevel): number {
  const landHalf = Math.round((tile.price ?? 1_000_000) * 0.5);
  let buildingsHalf = 0;
  for (let lv = 1; lv <= currentLevel; lv++) {
    buildingsHalf += calculateSellBuildingValue(lv as BuildingLevel);
  }
  return landHalf + buildingsHalf;
}

/**
 * Menghitung total tagihan utang berdasarkan pokok pinjaman dan bunga (1% - 200%).
 */
export function calculateLoanTotalDue(principal: number, interestRatePercent: number): number {
  const clampedRate = Math.max(1, Math.min(200, Math.round(interestRatePercent)));
  return Math.round(principal * (1 + clampedRate / 100));
}

/**
 * Resolves Kartu Fitnah dice roll (1..6):
 * - 1-2: Target masuk Lapas (#10)
 * - 3-4: Pengguna sendiri masuk Lapas (#10)
 * - 5-6: Pengguna dan Target sama-sama dikirim ke Pengadilan (#30)
 */
export function resolveFitnahRoll(diceValue: number): 'TARGET_TO_JAIL' | 'SELF_TO_JAIL' | 'BOTH_TO_COURT' {
  if (diceValue <= 2) return 'TARGET_TO_JAIL';
  if (diceValue <= 4) return 'SELF_TO_JAIL';
  return 'BOTH_TO_COURT';
}

/**
 * Determines who receives the rent when a player lands on an owned property.
 */
export function resolveRentRecipient(owner: Player): 'OWNER' | 'NEGARA' {
  if (owner.status === 'DI_LAPAS') {
    return 'NEGARA';
  }
  return 'OWNER';
}

/**
 * Calculates Tax amount (Rp500.000 per owned property).
 */
export function calculateLandTax(
  playerId: number,
  properties: Record<number, PropertyState>
): { ownedCount: number; taxAmount: number } {
  const ownedCount = Object.values(properties).filter(
    (p) => p.ownerId === playerId && !p.isSeizedByState
  ).length;
  return {
    ownedCount,
    taxAmount: ownedCount * 500_000,
  };
}

/**
 * Calculates Parkiran Pungli fee (Rp1.000.000, or Rp0 if player owns Bandung tile 19).
 */
export function calculatePungliFee(
  playerId: number,
  properties: Record<number, PropertyState>
): { ownsBandung: boolean; fee: number } {
  const ownsBandung =
    properties[BANDUNG_TILE_ID]?.ownerId === playerId &&
    !properties[BANDUNG_TILE_ID]?.isSeizedByState;
  return {
    ownsBandung,
    fee: ownsBandung ? 0 : 1_000_000,
  };
}

/**
 * Resolves Pengadilan (Meja Hijau) dice outcome:
 * - 5-6: Win Rp1.000.000
 * - 3-4: Go to Lapas + fine Rp1.500.000
 * - 1-2: Go to Lapas + 50% money confiscated by Negara
 */
export function resolveCourtVerdict(
  diceValue: number,
  currentMoney: number
): {
  verdictTitle: string;
  verdictText: string;
  moneyDelta: number;
  sendToJail: boolean;
} {
  if (diceValue >= 5) {
    return {
      verdictTitle: 'MENANG GUGATAN! (Dadu ' + diceValue + ')',
      verdictText: 'Pengacaramu pintar berdebat! Hakim memutuskan kamu menang gugatan & dapat uang Rp1 Jt dari Negara.',
      moneyDelta: 1_000_000,
      sendToJail: false,
    };
  }
  if (diceValue >= 3) {
    return {
      verdictTitle: 'KALAH SIDANG! (Dadu ' + diceValue + ')',
      verdictText: 'Hakim mengetuk palu! Kamu langsung pindah ke LAPAS (#10) dan wajib membayar denda Rp1,5 Jt ke Kas Negara.',
      moneyDelta: -1_500_000,
      sendToJail: true,
    };
  }
  const confiscated = Math.floor(Math.max(0, currentMoney) * 0.5);
  return {
    verdictTitle: 'VONIS BERAT: SITA 50% HARTAMU! (Dadu ' + diceValue + ')',
    verdictText: `Vonis berat Meja Hijau! Kamu dijebloskan ke LAPAS (#10) dan 50% uang tunaimu (${formatRupiah(confiscated)}) disita Negara!`,
    moneyDelta: -confiscated,
    sendToJail: true,
  };
}

/**
 * Mode Durasi Permainan (Mode Cepat vs Klasik Bertahan Hidup)
 */
export type GameDurationMode = 'FAST_10' | 'FAST_15' | 'WEALTH_25M' | 'CLASSIC';

export interface DurationModeOption {
  id: GameDurationMode;
  label: string;
  shortLabel: string;
  maxRounds: number | null;
  targetWealth: number | null;
  description: string;
}

export const DURATION_MODE_OPTIONS: DurationModeOption[] = [
  {
    id: 'FAST_10',
    label: '⚡ Kilat (10 Putaran)',
    shortLabel: '⚡ Kilat 10 Ronde',
    maxRounds: 10,
    targetWealth: null,
    description:
      'Permainan berakhir otomatis setelah Putaran ke-10 selesai. Warga dengan Total Kekayaan Bersih tertinggi menjadi Juara 2!',
  },
  {
    id: 'FAST_15',
    label: '⏱️ Cepat (15 Putaran)',
    shortLabel: '⏱️ Cepat 15 Ronde',
    maxRounds: 15,
    targetWealth: null,
    description:
      'Permainan berakhir otomatis setelah Putaran ke-15 selesai. Warga dengan Total Kekayaan Bersih tertinggi menjadi Juara 2!',
  },
  {
    id: 'WEALTH_25M',
    label: '👑 Target Sultan (Rp25 Jt)',
    shortLabel: '👑 Target Rp25 Jt',
    maxRounds: null,
    targetWealth: 25_000_000,
    description:
      'Begitu ada warga mencapai Total Kekayaan Bersih (Uang + Aset Tanah/Bangunan) minimal Rp25 Jt, game langsung berakhir!',
  },
  {
    id: 'CLASSIC',
    label: '∞ Klasik (Bertahan Hidup)',
    shortLabel: '∞ Klasik',
    maxRounds: null,
    targetWealth: null,
    description:
      'Tanpa batas putaran. Bermain sampai tersisa 1 warga terakhir yang tidak bangkrut.',
  },
];

/**
 * Menghitung nilai total aset properti (harga beli tanah + total biaya bangunan yang sudah dibangun) milik pemain.
 */
export function calculatePlayerPropertyValue(
  playerId: number,
  properties: Record<number, PropertyState>
): {
  count: number;
  totalValue: number;
  ownedTiles: Array<{ tile: BoardTile; level: BuildingLevel; value: number; currentRent: number }>;
} {
  const ownedTiles: Array<{
    tile: BoardTile;
    level: BuildingLevel;
    value: number;
    currentRent: number;
  }> = [];
  let totalValue = 0;

  for (const tile of BOARD_TILES) {
    if (tile.type !== 'PROPERTY') continue;
    const prop = properties[tile.id];
    if (!prop || prop.ownerId !== playerId || prop.isSeizedByState) continue;

    let propVal = tile.price ?? 1_000_000;
    for (let lv = 1; lv <= prop.level; lv++) {
      propVal += BUILDING_UPGRADE_COSTS[lv as BuildingLevel] ?? 0;
    }
    const currentRent = calculatePropertyRent(tile, prop.level);
    totalValue += propVal;
    ownedTiles.push({
      tile,
      level: prop.level,
      value: propVal,
      currentRent,
    });
  }

  return {
    count: ownedTiles.length,
    totalValue,
    ownedTiles,
  };
}

/**
 * Menghitung Total Kekayaan Bersih (Net Worth) seorang pemain:
 * Uang Tunai + Nilai Aset Tanah & Bangunan - Sisa Utang Aktif
 */
export function calculatePlayerNetWorth(
  player: Player,
  properties: Record<number, PropertyState>,
  loans: LoanRecord[] = []
): number {
  const propInfo = calculatePlayerPropertyValue(player.id, properties);
  const debtRemaining = loans
    .filter((l) => l.borrowerId === player.id && l.remainingDue > 0)
    .reduce((sum, l) => sum + l.remainingDue, 0);
  return player.money + propInfo.totalValue - debtRemaining;
}

/**
 * Mengurutkan peringkat pemain berdasarkan status hidup dan Total Kekayaan Bersih (Net Worth)
 */
export function rankPlayersByNetWorth(
  players: Player[],
  properties: Record<number, PropertyState>,
  loans: LoanRecord[] = []
): Array<{
  player: Player;
  netWorth: number;
  propertyValue: number;
  propertyCount: number;
  debtRemaining: number;
}> {
  const enriched = players.map((p) => {
    const propInfo = calculatePlayerPropertyValue(p.id, properties);
    const debtRemaining = loans
      .filter((l) => l.borrowerId === p.id && l.remainingDue > 0)
      .reduce((sum, l) => sum + l.remainingDue, 0);
    const netWorth = p.money + propInfo.totalValue - debtRemaining;
    return {
      player: p,
      netWorth,
      propertyValue: propInfo.totalValue,
      propertyCount: propInfo.count,
      debtRemaining,
    };
  });

  return enriched.sort((a, b) => {
    const aAlive = a.player.status !== 'BANGKRUT';
    const bAlive = b.player.status !== 'BANGKRUT';
    if (aAlive && !bAlive) return -1;
    if (!aAlive && bAlive) return 1;
    if (b.netWorth !== a.netWorth) return b.netWorth - a.netWorth;
    return b.player.earnedIncome - a.player.earnedIncome;
  });
}

/**
 * Mengecek apakah permainan sudah berakhir berdasarkan Mode Durasi Cepat atau Kebangkrutan.
 */
export function checkGameEndCondition(params: {
  players: Player[];
  properties: Record<number, PropertyState>;
  loans?: LoanRecord[];
  round: number;
  durationMode: GameDurationMode;
}): {
  isGameOver: boolean;
  reason: string;
  winnerRunnerUp: Player | null;
  rankedPlayers: ReturnType<typeof rankPlayersByNetWorth>;
} {
  const { players, properties, loans = [], round, durationMode } = params;
  const rankedPlayers = rankPlayersByNetWorth(players, properties, loans);
  const alivePlayers = players.filter((p) => p.status !== 'BANGKRUT');
  const topRanked = rankedPlayers[0]?.player ?? null;

  if (alivePlayers.length <= 1) {
    return {
      isGameOver: true,
      reason:
        'Semua lawan telah bangkrut! Tersisa 1 warga terakhir yang berhasil bertahan hidup dari jeratan pajak & utang.',
      winnerRunnerUp: alivePlayers[0] ?? topRanked,
      rankedPlayers,
    };
  }

  const modeOption = DURATION_MODE_OPTIONS.find((m) => m.id === durationMode);
  if (modeOption?.maxRounds && round > modeOption.maxRounds) {
    return {
      isGameOver: true,
      reason: `⏱️ Batas Durasi Cepat (${modeOption.maxRounds} Putaran) telah selesai! Pemenang Juara 2 ditentukan berdasarkan Total Kekayaan Bersih tertinggi.`,
      winnerRunnerUp: topRanked,
      rankedPlayers,
    };
  }

  if (modeOption?.targetWealth) {
    const wealthyWinner = rankedPlayers.find(
      (entry) =>
        entry.player.status !== 'BANGKRUT' &&
        entry.netWorth >= modeOption.targetWealth!
    );
    if (wealthyWinner) {
      return {
        isGameOver: true,
        reason: `👑 Target Sultan (${formatRupiah(
          modeOption.targetWealth
        )}) Tercapai! ${wealthyWinner.player.name} berhasil mengumpulkan Total Kekayaan Bersih ${formatRupiah(
          wealthyWinner.netWorth
        )}!`,
        winnerRunnerUp: wealthyWinner.player,
        rankedPlayers,
      };
    }
  }

  return {
    isGameOver: false,
    reason: '',
    winnerRunnerUp: topRanked,
    rankedPlayers,
  };
}

/**
 * Menghasilkan penjelasan lengkap aturan petak untuk Popup Info Hover Kotak Papan
 */
export function getTileHoverDetails(tile: BoardTile): {
  categoryBadge: string;
  ruleSummary: string;
  specialPerk?: string;
} {
  switch (tile.type) {
    case 'START':
      return {
        categoryBadge: '🏁 PETAK AWAL & GAJIAN',
        ruleSummary:
          'Setiap melewati atau berhenti di START, warga mendapat Gaji Rp1 Jt (atau Rp76,5 Jt jika Kartu Wantimpres aktif) + 1 Hak Upgrade Bangunan di tanah mana pun yang dimiliki.',
      };
    case 'PROPERTY':
      return {
        categoryBadge: `🏙️ KOTA PROPERTI · KOMPLEK ${tile.colorGroup || 'NUSANTARA'}`,
        ruleSummary:
          'Bisa dibeli saat kosong. Setiap kali pemilik melewati/berhenti di START, bangunan kota ini bisa di-upgrade 1 tingkat (Rumah Subsidi 1 → Subsidi 2 → Rumah OKB → Dapur SPPG → KopDes) untuk menaikkan tarif sewa hingga 250%!',
        specialPerk:
          tile.id === BANDUNG_TILE_ID
            ? '🎁 KEISTIMEWAAN BANDUNG: Pemilik kota Bandung BEBAS biaya Rp1 Jt saat mendarat di Parkiran Pungli (#20)!'
            : undefined,
      };
    case 'TAKDIR':
      return {
        categoryBadge: '💠 KARTU TAKDIR (BIRU)',
        ruleSummary:
          'Ambil 1 Kartu Takdir! Berpeluang mendapatkan rezeki uang dadu (Bansos Cair, Menang Tender) atau memperoleh 1 dari 10 Kartu Simpanan sakti.',
      };
    case 'MUSIBAH':
      return {
        categoryBadge: '🔥 KARTU MUSIBAH (MERAH)',
        ruleSummary:
          'Ambil 1 Kartu Musibah! Awas terkena denda dadu, razia pajak, terlempar ke Planet Bekasi (#40), atau sita aset saat Musibah Ekstrem aktif.',
      };
    case 'TAX':
      return {
        categoryBadge: '🏛️ PAJAK NEGARA',
        ruleSummary:
          'Wajib membayar Pajak Bumi & Bangunan sebesar Rp500 Rb dikali jumlah tanah yang kamu miliki langsung ke Kas Negara.',
      };
    case 'TOLL':
      return {
        categoryBadge: '🛣️ GERBANG TOL',
        ruleSummary:
          'Bayar tarif tol Rp500 Rb ke Negara (atau Rp0 jika pakai Kartu Diskon Tol), lalu wajib memilih terbang pindah ke Gerbang Tol lain tanpa mendapat gaji START.',
      };
    case 'JAIL':
      return {
        categoryBadge: '⛓️ LAPAS / PENJARA',
        ruleSummary:
          'Jika hanya mampir dari lemparan dadu normal, kamu aman (Cuma Nengok). Jika berstatus Terpidana Lapas: keluar dengan Dadu Kembar, bayar Rp500 Rb, atau Kartu Orang Dalam. Selama di Lapas biasa, uang sewa tanahmu masuk ke Negara (kecuali di Sel Premium Rp1,5 Jt).',
      };
    case 'PUNGLI':
      return {
        categoryBadge: '🚧 PARKIRAN PUNGLI',
        ruleSummary:
          'Dihadang oknum tukang parkir liar! Wajib bayar Rp1 Jt ke Kas Negara — KECUALI kamu adalah pemilik sah kota Bandung (#19), maka parkir GRATIS (Rp0)!',
      };
    case 'COURT':
      return {
        categoryBadge: '⚖️ PENGADILAN MEJA HIJAU',
        ruleSummary:
          'Lempar 1 dadu vonis hakim: Angka 5–6 Menang Gugatan (+Rp1 Jt dari Negara); Angka 3–4 Kalah Sidang (Masuk Lapas + Denda Rp1,5 Jt); Angka 1–2 Vonis Berat (Masuk Lapas + 50% Uang Tunai Disita Negara)!',
      };
    case 'TILANG':
      return {
        categoryBadge: '🚨 RAZIA & TILANG',
        ruleSummary:
          'Terkena razia lalu lintas / kamera ETLE! Wajib membayar denda tilang sebesar Rp500 Rb ke Kas Negara.',
      };
    case 'BEKASI':
    default:
      return {
        categoryBadge: '🚀 PLANET BEKASI (PETAK TENGAH #40)',
        ruleSummary:
          'Petak pengasingan di luar angkasa tengah papan! Hanya dikunjungi jika terkena kartu Musibah "Digoreng Netizen" (wajib skip/libur 1 giliran sebelum kembali ke Bumi).',
      };
  }
}

export type HudLayoutMode = 'FULL' | 'MINIMAL' | 'HIDDEN';

export interface HudLayoutModeOption {
  id: HudLayoutMode;
  label: string;
  shortLabel: string;
  description: string;
}

export const HUD_LAYOUT_MODE_OPTIONS: HudLayoutModeOption[] = [
  {
    id: 'FULL',
    label: '🖥️ Menu Lengkap (Full HUD)',
    shortLabel: '🖥️ Menu Penuh',
    description: 'Menampilkan seluruh panel Daftar Warga, Kartu Simpanan, Log CCTV, dan Tombol Aksi.',
  },
  {
    id: 'MINIMAL',
    label: '✨ Mode Minimalis (Layar Lega)',
    shortLabel: '✨ Minimalis',
    description: 'Menyembunyikan panel samping & log aktivitas menjadi tab mungil agar papan permainan terlihat jauh lebih luas.',
  },
  {
    id: 'HIDDEN',
    label: '👁️ Sembunyikan Menu (Fokus Papan)',
    shortLabel: '👁️ Fokus Papan',
    description: 'Menyembunyikan seluruh menu utama dan hanya menyisakan kontrol mengambang super ringkas.',
  },
];

export function cycleHudLayoutMode(current: HudLayoutMode): HudLayoutMode {
  if (current === 'FULL') return 'MINIMAL';
  if (current === 'MINIMAL') return 'HIDDEN';
  return 'FULL';
}

/**
 * Menghitung posisi Pan (x, y) dan skala Zoom kamera saat fitur "Follow Karakter" aktif,
 * sehingga kamera men-zoom secukupnya dan mengarah tepat ke karakter yang sedang giliran bermain.
 */
export function calculateCameraFollowTransform(params: {
  tilePosition: number;
  isIsometric: boolean;
  baseZoom?: number;
  hudMode?: HudLayoutMode;
}): {
  zoom: number;
  panX: number;
  panY: number;
  targetTileName: string;
} {
  const {
    tilePosition,
    isIsometric,
    baseZoom = 1.38,
    hudMode = 'FULL',
  } = params;

  const hudBonusZoom = hudMode === 'HIDDEN' ? 0.12 : hudMode === 'MINIMAL' ? 0.06 : 0;
  const effectiveZoom = Math.min(2.2, Math.max(1.15, Number((baseZoom + hudBonusZoom).toFixed(2))));

  const tile =
    tilePosition === BEKASI_TILE_ID
      ? BEKASI_CENTER_TILE
      : BOARD_TILES.find((t) => t.id === tilePosition) || BOARD_TILES[0];

  const gridCol = tilePosition === BEKASI_TILE_ID ? 5 : tile.gridCol;
  const gridRow = tilePosition === BEKASI_TILE_ID ? 5 : tile.gridRow;

  // Normalisasi posisi grid terhadap titik tengah papan (5, 5) dalam rentang [-1, 1]
  const normX = (gridCol - 5) / 5;
  const normY = (gridRow - 5) / 5;

  // Jarak piksel lokal dari pusat papan ke pusat petak pinggir (~290px pada papan 700px)
  const boardHalfSpanPx = 290;
  const localX = normX * boardHalfSpanPx;
  const localY = normY * boardHalfSpanPx;

  let panX = 0;
  let panY = 0;

  if (isIsometric) {
    const effectiveScale = effectiveZoom * 0.8;
    const radZ = (-35 * Math.PI) / 180;
    const radX = (50 * Math.PI) / 180;

    const rotX = localX * Math.cos(radZ) - localY * Math.sin(radZ);
    const rotY = (localX * Math.sin(radZ) + localY * Math.cos(radZ)) * Math.cos(radX);

    const screenOffsetX = rotX * effectiveScale;
    const screenOffsetY = rotY * effectiveScale;

    panX = Math.round(-screenOffsetX * 0.48);
    panY = Math.round(-screenOffsetY * 0.48);
  } else {
    const effectiveScale = effectiveZoom * 0.88;
    const screenOffsetX = localX * effectiveScale;
    const screenOffsetY = localY * effectiveScale;

    panX = Math.round(-screenOffsetX * 0.45);
    panY = Math.round(-screenOffsetY * 0.45);
  }

  const clampedPanX = Math.max(-175, Math.min(175, panX));
  const clampedPanY = Math.max(-145, Math.min(145, panY));

  return {
    zoom: effectiveZoom,
    panX: clampedPanX === 0 ? 0 : clampedPanX,
    panY: clampedPanY === 0 ? 0 : clampedPanY,
    targetTileName: tile.name,
  };
}

// ============================================================================
// FASE 8: EFEK TRANSISI VISUAL PERGANTIAN GILIRAN PEMAIN (TURN TRANSITION OVERLAY)
// ============================================================================

export interface TurnTransitionInfo {
  playerId: number;
  playerName: string;
  avatarId: string;
  avatarEmoji: string;
  avatarRole: string;
  color: string;
  isBot: boolean;
  round: number;
  previousPlayerName?: string;
  tileId: number;
  tileName: string;
  moneyFormatted: string;
  statusLabel: string;
  headline: string;
  subheadline: string;
}

/**
 * Membangun informasi banner transisi visual saat pergantian giliran pemain.
 */
export function buildTurnTransitionInfo(params: {
  player: Player;
  round: number;
  previousPlayerName?: string;
}): TurnTransitionInfo {
  const { player, round, previousPlayerName } = params;
  const tile =
    player.position === BEKASI_TILE_ID
      ? BEKASI_CENTER_TILE
      : BOARD_TILES.find((t) => t.id === player.position) || BOARD_TILES[0];

  let statusLabel = '✨ STATUS NORMAL';
  let subheadline = player.isBot
    ? 'Bot WNI sedang bersiap mengocok dadu secara otomatis...'
    : 'Saatnya melempar dadu dan bertahan hidup dari tagihan Negara!';

  if (player.position === BEKASI_TILE_ID || player.status === 'DI_BEKASI') {
    statusLabel = '🚀 TERDAMPAR DI BEKASI';
    subheadline =
      'Sedang diasingkan di Planet Bekasi akibat Digoreng Netizen!';
  } else if (player.status === 'DI_LAPAS') {
    statusLabel = '🔒 DI DALAM LAPAS';
    subheadline =
      'Tahanan Lapas! Lempar dadu kembar, bayar Rp500 Rb, atau gunakan Orang Dalam.';
  } else if (player.status === 'SEL_PREMIUM') {
    statusLabel = `👑 SEL PREMIUM (${player.premiumTurnsLeft} GILIRAN)`;
    subheadline =
      'Bersantai di Sel Mewah! Uang sewa properti tetap mengalir ke kantong pribadi.';
  }

  return {
    playerId: player.id,
    playerName: player.name,
    avatarId: player.avatarId || 'ojol',
    avatarEmoji: player.avatarEmoji || '🛵',
    avatarRole: player.role || 'Warga +62',
    color: player.color,
    isBot: Boolean(player.isBot),
    round: Math.max(1, round),
    previousPlayerName,
    tileId: tile.id,
    tileName: tile.name,
    moneyFormatted: formatRupiah(player.money),
    statusLabel,
    headline: player.isBot ? 'GILIRAN BOT WNI' : 'GILIRAN BERMAIN',
    subheadline,
  };
}

// ============================================================================
// FASE 9: OPENING INTRO MOVIE SEBELUM MASUK KE GAME UTAMA & AUTO-RENAME FILE
// ============================================================================

export const DEFAULT_INTRO_MOVIE_FILENAME = 'intro-wni-simulator.mp4';
export const DEFAULT_INTRO_MOVIE_PATH = '/intro-wni-simulator.mp4';

export interface IntroMovieRenameResult {
  cleanFilename: string;
  originalFilename: string;
  wasRenamed: boolean;
}

/**
 * Merapikan dan me-rename nama file video panjang (misal:
 * "Characters_moving_across_Monopoly_1080p_20261019193048.mp4")
 * menjadi nama file standar yang bersih ("intro-wni-simulator.mp4").
 */
export function renameIntroMovieFilename(
  rawFilename?: string | null
): IntroMovieRenameResult {
  const trimmed = (rawFilename || '').trim();
  if (!trimmed) {
    return {
      cleanFilename: DEFAULT_INTRO_MOVIE_FILENAME,
      originalFilename: DEFAULT_INTRO_MOVIE_FILENAME,
      wasRenamed: false,
    };
  }

  const baseNameOnly = trimmed.split(/[/\\]/).pop() || trimmed;
  const extMatch = baseNameOnly.match(/\.(mp4|webm|mov|m4v|ogg)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'mp4';
  const cleanFilename = `intro-wni-simulator.${ext}`;

  return {
    cleanFilename,
    originalFilename: baseNameOnly,
    wasRenamed: baseNameOnly.toLowerCase() !== cleanFilename.toLowerCase(),
  };
}

/**
 * Menentukan apakah saat klik Mulai Permainan / Main Cepat harus memutar
 * Opening Movie terlebih dahulu ('INTRO_MOVIE') atau langsung masuk ke 'GAME'.
 */
export function resolveGameStartTargetScreen(params: {
  introMovieEnabled: boolean;
  skipIntroQuery?: boolean;
}): 'INTRO_MOVIE' | 'GAME' {
  if (params.skipIntroQuery) {
    return 'GAME';
  }
  return params.introMovieEnabled ? 'INTRO_MOVIE' : 'GAME';
}

// ============================================================================
// FASE 10: SINKRONISASI GAMBAR KUSTOM HOST KE FIREBASE FIRESTORE ROOM
// ============================================================================

export const MAX_CUSTOM_ASSET_DATA_URL_LENGTH = 45_000;

export interface SyncedCustomAssets {
  pawns: Record<string, string>;
  buildings: Record<string, string>;
  boardCenterLogo: string | null;
}

const VALID_AVATAR_IDS = new Set(AVATAR_CHARACTERS.map((a) => a.id));
const VALID_BUILDING_KEYS = new Set(['1', '2', '3', '4', '5']);

function isAllowedSyncedImageString(val: unknown): val is string {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (
    trimmed.length === 0 ||
    trimmed.length > MAX_CUSTOM_ASSET_DATA_URL_LENGTH
  ) {
    return false;
  }
  // Do not sync local browser-only blob: URLs to Firestore; only data:image/* or https?:// or /... paths
  if (trimmed.startsWith('blob:')) return false;
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/')
  );
}

/**
 * Membersihkan & memvalidasi ukuran gambar kustom Host (Pion, Bangunan 3D, Logo Tengah)
 * agar aman disimpan ke dokumen Firestore (/rooms/{roomCode}) di bawah batas 1MB.
 */
export function sanitizeCustomAssetsForFirestore(
  assets?: {
    pawns?: Record<string, string> | null;
    buildings?: Record<string | number, string> | null;
    boardCenterLogo?: string | null;
  } | null
): SyncedCustomAssets {
  const pawns: Record<string, string> = {};
  const buildings: Record<string, string> = {};
  let boardCenterLogo: string | null = null;

  if (assets?.pawns && typeof assets.pawns === 'object') {
    for (const [key, val] of Object.entries(assets.pawns)) {
      if (VALID_AVATAR_IDS.has(key) && isAllowedSyncedImageString(val)) {
        pawns[key] = val.trim();
      }
    }
  }

  if (assets?.buildings && typeof assets.buildings === 'object') {
    for (const [key, val] of Object.entries(assets.buildings)) {
      const strKey = String(key);
      if (VALID_BUILDING_KEYS.has(strKey) && isAllowedSyncedImageString(val)) {
        buildings[strKey] = val.trim();
      }
    }
  }

  if (isAllowedSyncedImageString(assets?.boardCenterLogo)) {
    boardCenterLogo = assets!.boardCenterLogo!.trim();
  }

  return {
    pawns,
    buildings,
    boardCenterLogo,
  };
}

/**
 * Mengubah struktur customAssets dari Firestore kembali ke format state aplikasi.
 */
export function deserializeCustomAssetsFromFirestore(
  raw?: SyncedCustomAssets | null
): {
  pawns: Record<string, string>;
  buildings: Record<number, string>;
  boardCenterLogo: string | null;
} {
  const sanitized = sanitizeCustomAssetsForFirestore(raw);
  const numericBuildings: Record<number, string> = {};
  for (const [k, v] of Object.entries(sanitized.buildings)) {
    const num = Number(k);
    if (num >= 1 && num <= 5) {
      numericBuildings[num] = v;
    }
  }
  return {
    pawns: sanitized.pawns,
    buildings: numericBuildings,
    boardCenterLogo: sanitized.boardCenterLogo,
  };
}

/**
 * Menggabungkan gambar kustom Host dari Room Firestore ke state lokal pemain
 * tanpa menimpa pengaturan video intro lokal.
 */
export function mergeRemoteCustomAssetsWithLocal<
  T extends {
    pawns: Record<string, string>;
    buildings: Record<number, string>;
    boardCenterLogo: string | null;
  },
>(localAssets: T, remoteRaw?: SyncedCustomAssets | null): T {
  if (!remoteRaw || typeof remoteRaw !== 'object') {
    return localAssets;
  }
  const deserialized = deserializeCustomAssetsFromFirestore(remoteRaw);
  return {
    ...localAssets,
    pawns: deserialized.pawns,
    buildings: deserialized.buildings,
    boardCenterLogo: deserialized.boardCenterLogo,
  };
}

/**
 * Menghitung jumlah gambar kustom (pion + bangunan + logo tengah) yang aktif untuk sinkronisasi.
 */
export function countSyncedCustomAssets(
  assets?: {
    pawns?: Record<string, string> | null;
    buildings?: Record<string | number, string> | null;
    boardCenterLogo?: string | null;
  } | null
): number {
  const sanitized = sanitizeCustomAssetsForFirestore(assets);
  return (
    Object.keys(sanitized.pawns).length +
    Object.keys(sanitized.buildings).length +
    (sanitized.boardCenterLogo ? 1 : 0)
  );
}

// ============================================================================
// FASE 11: AUTO-DISCOVERY AVATAR DARI FOLDER SERVER (/public/avatars/)
// ============================================================================

export const PUBLIC_AVATAR_FOLDER_PATH = '/public/avatars';

export const DEFAULT_SERVER_AVATAR_GLOB_ENTRIES: Record<string, string> = {
  '/public/avatars/1.png': '/avatars/1.png',
  '/public/avatars/2.png': '/avatars/2.png',
  '/public/avatars/3.png': '/avatars/3.png',
  '/public/avatars/4.png': '/avatars/4.png',
  '/public/avatars/5.png': '/avatars/5.png',
  '/public/avatars/6.png': '/avatars/6.png',
  '/public/avatars/7.png': '/avatars/7.png',
  '/public/avatars/8.png': '/avatars/8.png',
};

const AVATAR_ID_ALIASES: Record<string, string[]> = {
  ojol: ['ojol', 'driver-ojol', 'driver_ojol', 'avatar1', 'avatar-1', 'avatar_1', '1'],
  emak: ['emak', 'emak-emak', 'emak_emak', 'avatar2', 'avatar-2', 'avatar_2', '2'],
  pns: ['pns', 'pns-konoha', 'pns_konoha', 'avatar3', 'avatar-3', 'avatar_3', '3'],
  mahasiswa: ['mahasiswa', 'mahasiswa-abadi', 'mahasiswa_abadi', 'avatar4', 'avatar-4', 'avatar_4', '4'],
  bakso: ['bakso', 'kang-bakso', 'kang_bakso', 'avatar5', 'avatar-5', 'avatar_5', '5'],
  sultan: ['sultan', 'sultan-okb', 'sultan_okb', 'avatar6', 'avatar-6', 'avatar_6', '6'],
  kurir: ['kurir', 'kurir-paket', 'kurir_paket', 'avatar7', 'avatar-7', 'avatar_7', '7'],
  pengamen: ['pengamen', 'pengamen-senja', 'pengamen_senja', 'avatar8', 'avatar-8', 'avatar_8', '8'],
};

/**
 * Mencocokkan file gambar yang diupload pemilik game ke folder /public/avatars/
 * ke 8 karakter avatar WNI Simulator:
 * 1. Pencocokan nama spesifik: 'ojol.png', 'emak.jpg', '1.png'..'8.png', 'avatar1.webp', dsb.
 * 2. Fallback Universal ("semua pemain menggunakan avatar yg saya upload"):
 *    Jika Anda mengupload 1 gambar (mis. 'avatar.png' atau nama bebas), atau beberapa gambar,
 *    semua slot karakter yang belum terisi otomatis menggunakan gambar yang Anda upload di /public/avatars/!
 */
export function resolvePublicAvatarsMap(
  globEntries: Record<string, string> = DEFAULT_SERVER_AVATAR_GLOB_ENTRIES
): {
  pawnsByAvatarId: Record<string, string>;
  uploadedFiles: { filename: string; url: string; matchedAvatarIds: string[] }[];
} {
  const validEntries: { filename: string; stem: string; url: string }[] = [];

  for (const [rawPath, rawUrl] of Object.entries(globEntries || {})) {
    if (!rawPath || typeof rawUrl !== 'string' || !rawUrl.trim()) continue;
    const normalizedPath = rawPath.replace(/\\/g, '/');
    const filename = normalizedPath.split('/').pop() || '';
    if (!filename || filename.startsWith('.')) continue;
    const extMatch = filename.match(/\.(png|jpe?g|webp|gif|svg|avif)$/i);
    if (!extMatch) continue;

    // Pastikan URL mengarah ke root static server Vite (tanpa prefix '/public')
    const cleanUrl = rawUrl.startsWith('/public/')
      ? rawUrl.replace(/^\/public\//, '/')
      : rawUrl;
    const stem = filename
      .replace(/\.(png|jpe?g|webp|gif|svg|avif)$/i, '')
      .trim()
      .toLowerCase();

    validEntries.push({
      filename,
      stem,
      url: cleanUrl,
    });
  }

  // Urutkan secara deterministik berdasarkan nama file
  validEntries.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));

  const pawnsByAvatarId: Record<string, string> = {};
  const matchedMap = new Map<string, string[]>();
  for (const entry of validEntries) {
    matchedMap.set(entry.filename, []);
  }

  if (validEntries.length === 0) {
    return { pawnsByAvatarId, uploadedFiles: [] };
  }

  // Tahap 1: Cek kecocokan nama eksplisit atau substring dengan ID karakter
  for (const av of AVATAR_CHARACTERS) {
    const aliases = AVATAR_ID_ALIASES[av.id] || [av.id];
    const exactMatch = validEntries.find((e) => aliases.includes(e.stem));
    const partialMatch =
      exactMatch ||
      validEntries.find((e) =>
        aliases.some((al) => al.length >= 3 && e.stem.includes(al))
      );

    if (partialMatch) {
      pawnsByAvatarId[av.id] = partialMatch.url;
      matchedMap.get(partialMatch.filename)?.push(av.id);
    }
  }

  // Tahap 2: Semua karakter yang belum punya pasangan spesifik otomatis memakai gambar yang diupload
  // secara berurutan (round-robin), sehingga kalau Anda upload 1 gambar saja pun SEMUA pemain otomatis memakainya!
  let fallbackIndex = 0;
  for (const av of AVATAR_CHARACTERS) {
    if (!pawnsByAvatarId[av.id]) {
      const chosen = validEntries[fallbackIndex % validEntries.length];
      pawnsByAvatarId[av.id] = chosen.url;
      matchedMap.get(chosen.filename)?.push(av.id);
      fallbackIndex++;
    }
  }

  return {
    pawnsByAvatarId,
    uploadedFiles: validEntries.map((e) => ({
      filename: e.filename,
      url: e.url,
      matchedAvatarIds: matchedMap.get(e.filename) || [],
    })),
  };
}

/**
 * Mengambil URL gambar avatar aktif untuk suatu karakter / pemain:
 * Prioritas 1: Gambar di folder server /public/avatars/ (ditentukan langsung oleh pemilik game untuk semua pemain)
 * Prioritas 2: Gambar kustom dari Room / CustomAssets
 */
export function resolveEffectivePawnImageUrl(
  avatarId: string | undefined,
  customPawns?: Record<string, string> | null,
  publicPawns?: Record<string, string> | null
): string | undefined {
  const safeId =
    avatarId && VALID_AVATAR_IDS.has(avatarId)
      ? avatarId
      : AVATAR_CHARACTERS[0].id;

  if (publicPawns && publicPawns[safeId]) {
    return publicPawns[safeId];
  }
  if (customPawns && customPawns[safeId]) {
    return customPawns[safeId];
  }
  // Jika ada gambar di publicPawns dengan kunci lain, tetap gunakan sebagai fallback universal
  if (publicPawns) {
    const firstPublic = Object.values(publicPawns)[0];
    if (firstPublic) return firstPublic;
  }
  return undefined;
}



