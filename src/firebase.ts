import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  Player,
  PropertyState,
  LoanRecord,
  AVATAR_CHARACTERS,
  GameDurationMode,
  resolveHumanJoinRoomPlayers,
  SyncedCustomAssets,
  sanitizeCustomAssetsForFirestore,
  deriveMemberUids,
} from './game/rules';
import type {
  PendingLoanProposal,
  PendingMoneyRequest,
} from './components/GameModals';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface RoomActivityLog {
  id: string;
  text: string;
  type: 'info' | 'gain' | 'penalty' | 'card' | 'bekasi';
  timestamp: string;
}

export interface FirestoreRoomData {
  roomCode: string;
  hostUid: string;
  hostId: number;
  hostName: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  gameState: 'WAITING' | 'PLAYING' | 'FINISHED';
  maxPlayers: number;
  round: number;
  activePlayerIndex: number;
  stateTreasury: number;
  isExtremeMusibahActive: boolean;
  dice: [number, number];
  diceQuip: string;
  players: Player[];
  /** uid pemain manusia (tanpa bot) — sumber validasi keanggotaan di firestore.rules */
  memberUids: string[];
  properties: Record<string, PropertyState>;
  loans: LoanRecord[];
  activityLogs: RoomActivityLog[];
  customAssets?: SyncedCustomAssets;
  /** Mode durasi dipilih Host — ikut disinkronkan agar HUD & layar akhir sama di semua klien. */
  durationMode?: GameDurationMode;
  /** Alasan berakhirnya permainan (mis. target kekayaan / batas ronde tercapai). */
  gameOverReason?: string;
  /** Permintaan uang antar-pemain yang sedang menunggu jawaban pemain tujuan. */
  pendingMoneyRequest?: PendingMoneyRequest | null;
  /** Pengajuan pinjaman antar-pemain yang sedang menunggu persetujuan calon pemberi pinjaman. */
  pendingLoanProposal?: PendingLoanProposal | null;
}

const GAME_DURATION_MODES: GameDurationMode[] = [
  'FAST_10',
  'FAST_15',
  'WEALTH_25M',
  'CLASSIC',
];

const clampPlayerId = (raw: unknown): number =>
  Math.max(0, Math.min(63, Math.round(Number(raw) || 0)));

/**
 * Bentuk request yang dikirim ke Firestore harus dipangkas & dikunci tipenya
 * agar lolos validasi `isValidRoom` di firestore.rules.
 */
export function sanitizePendingMoneyRequestForFirestore(
  req: PendingMoneyRequest | null | undefined
): PendingMoneyRequest | null {
  if (!req) return null;
  return {
    fromPlayerId: clampPlayerId(req.fromPlayerId),
    toPlayerId: clampPlayerId(req.toPlayerId),
    amount: Math.max(1, Math.min(1_000_000_000, Math.round(Number(req.amount) || 0))),
    reason: (req.reason || '').slice(0, 160),
  };
}

export function sanitizePendingLoanProposalForFirestore(
  proposal: PendingLoanProposal | null | undefined
): PendingLoanProposal | null {
  if (!proposal) return null;
  return {
    borrowerId: clampPlayerId(proposal.borrowerId),
    lenderId: clampPlayerId(proposal.lenderId),
    principal: Math.max(
      1,
      Math.min(1_000_000_000, Math.round(Number(proposal.principal) || 0))
    ),
  };
}

export const ROOM_CODE_REGEX = /^[a-zA-Z0-9_\-]+$/;

export function sanitizeRoomCode(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9_\-]/g, '');
  return cleaned.slice(0, 32);
}

export function serializePropertiesForFirestore(
  props: Record<number, PropertyState>
): Record<string, PropertyState> {
  const out: Record<string, PropertyState> = {};
  Object.entries(props)
    .slice(0, 45)
    .forEach(([key, val]) => {
      out[String(key)] = {
        tileId: Number(val.tileId),
        ownerId: val.ownerId === undefined ? null : val.ownerId,
        level: val.level,
        isSeizedByState: Boolean(val.isSeizedByState),
      };
    });
  return out;
}

export function deserializePropertiesFromFirestore(
  raw: Record<string, PropertyState> | undefined
): Record<number, PropertyState> {
  const out: Record<number, PropertyState> = {};
  if (!raw) return out;
  Object.entries(raw).forEach(([k, val]) => {
    const numKey = Number(k);
    if (!Number.isNaN(numKey) && val) {
      out[numKey] = {
        tileId: Number(val.tileId ?? numKey),
        ownerId: val.ownerId === undefined ? null : val.ownerId,
        level: val.level ?? 0,
        isSeizedByState: Boolean(val.isSeizedByState),
      };
    }
  });
  return out;
}

export function sanitizePlayersForFirestore(players: Player[]): Player[] {
  return players.slice(0, 64).map((p, idx) => {
    const fallbackAvatar = AVATAR_CHARACTERS[idx % AVATAR_CHARACTERS.length];
    return {
      id: Math.round(Number(p.id ?? idx)),
      uid: String(p.uid || `p-${idx}`).slice(0, 128),
      isHost: Boolean(p.isHost),
      isBot: Boolean(p.isBot),
      avatarId: String(p.avatarId || fallbackAvatar.id).slice(0, 32),
      name: String(p.name || fallbackAvatar.title).slice(0, 40),
      role: String(p.role || fallbackAvatar.title).slice(0, 80),
      avatarEmoji: String(p.avatarEmoji || fallbackAvatar.emoji).slice(0, 16),
      color: String(p.color || fallbackAvatar.color).slice(0, 24),
      bgLight: String(p.bgLight || fallbackAvatar.bgLight).slice(0, 48),
      borderHex: String(p.borderHex || fallbackAvatar.borderHex).slice(0, 24),
      money: Math.round(Number(p.money ?? 0)),
      earnedIncome: Math.round(Number(p.earnedIncome ?? 0)),
      giftedMoneyReceived: Math.round(Number(p.giftedMoneyReceived ?? 0)),
      position: Math.round(Number(p.position ?? 0)),
      lastPerimeterPosition: Math.round(Number(p.lastPerimeterPosition ?? 0)),
      status: p.status || 'NORMAL',
      skipTurns: Math.round(Number(p.skipTurns ?? 0)),
      premiumTurnsLeft: Math.round(Number(p.premiumTurnsLeft ?? 0)),
      upgradeTokens: Math.round(Number(p.upgradeTokens ?? 0)),
      startPassCount: Math.round(Number(p.startPassCount ?? 0)),
      shieldedByDoa: Boolean(p.shieldedByDoa),
      khodamBoost: Boolean(p.khodamBoost),
      pewarisBoost: Boolean(p.pewarisBoost),
      diskonTolArmed: Boolean(p.diskonTolArmed),
      harbolnasArmed: Boolean(p.harbolnasArmed),
      cashbackArmed: Boolean(p.cashbackArmed),
      wantimpresActive: Boolean(p.wantimpresActive),
      savedCards: (p.savedCards || []).slice(0, 15).map((c) => ({
        id: String(c.id).slice(0, 64),
        key: c.key,
        name: String(c.name).slice(0, 48),
        emoji: String(c.emoji).slice(0, 16),
        description: String(c.description).slice(0, 200),
        usageTiming: String(c.usageTiming).slice(0, 64),
        badgeColor: String(c.badgeColor).slice(0, 24),
        isPermanent: Boolean(c.isPermanent),
      })),
    };
  });
}

export async function signInWithGooglePopup(): Promise<User | null> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (err) {
    console.warn('Google sign-in popup closed or unavailable:', err);
    return null;
  }
}

export async function signOutFirebaseUser(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User, Unsubscribe };

export async function createFirestoreRoom(params: {
  roomCode: string;
  hostUid: string;
  hostId?: number;
  hostName: string;
  maxPlayers: number;
  players: Player[];
  properties: Record<number, PropertyState>;
  activityLogs: RoomActivityLog[];
  customAssets?: {
    pawns?: Record<string, string> | null;
    buildings?: Record<string | number, string> | null;
    boardCenterLogo?: string | null;
  } | null;
}): Promise<void> {
  const code = sanitizeRoomCode(params.roomCode);
  const path = `rooms/${code}`;
  const clampedMax = Math.max(2, Math.min(64, Math.round(params.maxPlayers)));
  try {
    await setDoc(doc(db, 'rooms', code), {
      roomCode: code,
      hostUid: params.hostUid.slice(0, 128),
      hostId: params.hostId ?? 0,
      hostName: (params.hostName.trim() || 'Warga Host').slice(0, 60),
      status: 'WAITING',
      gameState: 'WAITING',
      maxPlayers: clampedMax,
      round: 1,
      activePlayerIndex: 0,
      stateTreasury: 25_000_000,
      isExtremeMusibahActive: false,
      dice: [4, 2],
      diceQuip: 'Menunggu warga berkumpul di Room Konoha!',
      players: sanitizePlayersForFirestore(params.players),
      memberUids: deriveMemberUids(params.players),
      properties: serializePropertiesForFirestore(params.properties),
      loans: [],
      activityLogs: params.activityLogs.slice(0, 40),
      customAssets: sanitizeCustomAssetsForFirestore(params.customAssets),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchFirestoreRoom(
  roomCode: string
): Promise<FirestoreRoomData | null> {
  const code = sanitizeRoomCode(roomCode);
  const path = `rooms/${code}`;
  try {
    const snap = await getDoc(doc(db, 'rooms', code));
    if (!snap.exists()) return null;
    return snap.data() as FirestoreRoomData;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function joinRoom(
  roomCode: string,
  joiningPlayer: {
    name: string;
    avatarId: string;
    uid: string;
  }
): Promise<{
  found: boolean;
  ok: boolean;
  roomData?: FirestoreRoomData;
  updatedPlayers?: Player[];
  updatedLogs?: RoomActivityLog[];
  replacedBotName?: string;
  errorMessage?: string;
}> {
  const existingRoom = await fetchFirestoreRoom(roomCode);
  if (!existingRoom) {
    return { found: false, ok: false };
  }

  const joinResolution = resolveHumanJoinRoomPlayers({
    existingPlayers: existingRoom.players || [],
    maxPlayers: existingRoom.maxPlayers || 4,
    joiningPlayer,
  });

  if (!joinResolution.ok) {
    return {
      found: true,
      ok: false,
      roomData: existingRoom,
      errorMessage:
        joinResolution.errorMessage ||
        `Room Penuh! Seluruh slot sudah terisi oleh pemain manusia asli.`,
    };
  }

  const code = sanitizeRoomCode(roomCode);
  const joinLog: RoomActivityLog = {
    id: `join-${Date.now()}`,
    text: joinResolution.replacedBotName
      ? `👋 ${joiningPlayer.name} bergabung ke Room #${code} (otomatis menggantikan Bot ${joinResolution.replacedBotName})!`
      : `👋 ${joiningPlayer.name} bergabung ke Room #${code}!`,
    type: 'gain',
    timestamp: '00:02',
  };

  const updatedLogs = joinResolution.alreadyInRoom
    ? existingRoom.activityLogs || []
    : [joinLog, ...(existingRoom.activityLogs || []).slice(0, 30)];

  const currentStatus = existingRoom.status === 'PLAYING' ? 'PLAYING' : 'WAITING';
  const currentGameState = existingRoom.gameState === 'PLAYING' ? 'PLAYING' : 'WAITING';

  await updateWaitingRoomInFirestore({
    roomCode: code,
    players: joinResolution.updatedPlayers,
    status: currentStatus,
    gameState: currentGameState,
    maxPlayers: existingRoom.maxPlayers,
    activityLogs: updatedLogs,
  });

  return {
    found: true,
    ok: true,
    roomData: existingRoom,
    updatedPlayers: joinResolution.updatedPlayers,
    updatedLogs,
    replacedBotName: joinResolution.replacedBotName,
  };
}

export async function updateWaitingRoomInFirestore(params: {
  roomCode: string;
  players: Player[];
  status: 'WAITING' | 'PLAYING';
  gameState?: 'WAITING' | 'PLAYING';
  maxPlayers: number;
  activityLogs: RoomActivityLog[];
  customAssets?: {
    pawns?: Record<string, string> | null;
    buildings?: Record<string | number, string> | null;
    boardCenterLogo?: string | null;
  } | null;
}): Promise<void> {
  const code = sanitizeRoomCode(params.roomCode);
  const path = `rooms/${code}`;
  try {
    const payload: Record<string, unknown> = {
      players: sanitizePlayersForFirestore(params.players),
      memberUids: deriveMemberUids(params.players),
      status: params.status,
      gameState: params.gameState || params.status,
      maxPlayers: Math.max(2, Math.min(64, Math.round(params.maxPlayers))),
      activityLogs: params.activityLogs.slice(0, 40),
      updatedAt: serverTimestamp(),
    };
    if (params.customAssets !== undefined) {
      payload.customAssets = sanitizeCustomAssetsForFirestore(params.customAssets);
    }
    await updateDoc(doc(db, 'rooms', code), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncHostCustomAssetsToFirestore(params: {
  roomCode: string;
  customAssets: {
    pawns?: Record<string, string> | null;
    buildings?: Record<string | number, string> | null;
    boardCenterLogo?: string | null;
  };
}): Promise<void> {
  const code = sanitizeRoomCode(params.roomCode);
  const path = `rooms/${code}`;
  try {
    await updateDoc(doc(db, 'rooms', code), {
      customAssets: sanitizeCustomAssetsForFirestore(params.customAssets),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncGameplayToFirestore(params: {
  roomCode: string;
  players: Player[];
  properties: Record<number, PropertyState>;
  loans: LoanRecord[];
  activityLogs: RoomActivityLog[];
  round: number;
  activePlayerIndex: number;
  stateTreasury: number;
  isExtremeMusibahActive: boolean;
  dice: [number, number];
  diceQuip: string;
  status: 'PLAYING' | 'FINISHED';
  durationMode?: GameDurationMode;
  gameOverReason?: string;
  pendingMoneyRequest?: PendingMoneyRequest | null;
  pendingLoanProposal?: PendingLoanProposal | null;
  customAssets?: {
    pawns?: Record<string, string> | null;
    buildings?: Record<string | number, string> | null;
    boardCenterLogo?: string | null;
  } | null;
}): Promise<void> {
  const code = sanitizeRoomCode(params.roomCode);
  const path = `rooms/${code}`;
  try {
    const payload: Record<string, unknown> = {
      players: sanitizePlayersForFirestore(params.players),
      properties: serializePropertiesForFirestore(params.properties),
      loans: params.loans.slice(0, 50),
      activityLogs: params.activityLogs.slice(0, 40),
      round: Math.max(1, Math.min(10000, Math.round(params.round))),
      activePlayerIndex: Math.max(
        0,
        Math.min(63, Math.round(params.activePlayerIndex))
      ),
      stateTreasury: Math.max(0, Math.round(params.stateTreasury)),
      isExtremeMusibahActive: Boolean(params.isExtremeMusibahActive),
      dice: [
        Math.max(1, Math.min(6, Math.round(params.dice[0] || 1))),
        Math.max(1, Math.min(6, Math.round(params.dice[1] || 1))),
      ],
      diceQuip: (params.diceQuip || 'Giliran berjalan...').slice(0, 240),
      status: params.status,
      gameState: params.status === 'FINISHED' ? 'FINISHED' : 'PLAYING',
      gameOverReason: (params.gameOverReason || '').slice(0, 240),
      pendingMoneyRequest: sanitizePendingMoneyRequestForFirestore(
        params.pendingMoneyRequest
      ),
      pendingLoanProposal: sanitizePendingLoanProposalForFirestore(
        params.pendingLoanProposal
      ),
      updatedAt: serverTimestamp(),
    };
    // Mode durasi adalah setelan Host: klien non-host tidak menulisnya agar
    // snapshot lama tidak menimpa pilihan Host saat race di awal permainan.
    if (
      params.durationMode &&
      GAME_DURATION_MODES.includes(params.durationMode)
    ) {
      payload.durationMode = params.durationMode;
    }
    if (params.customAssets !== undefined) {
      payload.customAssets = sanitizeCustomAssetsForFirestore(params.customAssets);
    }
    await updateDoc(doc(db, 'rooms', code), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Hapus dokumen room dari Firestore (hanya Host yang diizinkan rules).
 * Setelah ini, klien lain menerima snapshot "dokumen hilang" lewat `onDeleted`.
 */
export async function deleteFirestoreRoom(roomCode: string): Promise<void> {
  const code = sanitizeRoomCode(roomCode);
  const path = `rooms/${code}`;
  try {
    await deleteDoc(doc(db, 'rooms', code));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToFirestoreRoom(
  roomCode: string,
  onUpdate: (data: FirestoreRoomData) => void,
  onError?: (err: unknown) => void,
  onDeleted?: () => void
): Unsubscribe {
  const code = sanitizeRoomCode(roomCode);
  const path = `rooms/${code}`;
  return onSnapshot(
    doc(db, 'rooms', code),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as FirestoreRoomData);
      } else if (onDeleted) {
        // Dokumen room dihapus dari server (mis. Host membubarkan room)
        onDeleted();
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
