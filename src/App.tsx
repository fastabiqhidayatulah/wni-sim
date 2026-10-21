/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BOARD_TILES,
  BUILDING_NAMES,
  PERIMETER_TILE_COUNT,
  TOLL_TILE_IDS,
  LAPAS_TILE_ID,
  COURT_TILE_ID,
  BEKASI_TILE_ID,
  TAKDIR_CARDS,
  MUSIBAH_CARDS,
  EXTREME_MUSIBAH_CARDS,
  ALL_SAVED_CARDS,
  AVATAR_CHARACTERS,
  BoardTile,
  BuildingLevel,
  FateCard,
  LoanRecord,
  Player,
  PropertyState,
  SavedCard,
  createInitialPlayers,
  createInitialProperties,
  createPlayerFromAvatar,
  createHostOnlyRoomPlayers,
  generateBotPlayers,
  removeBotFromRoom,
  removeAllBotsFromRoom,
  resolveHumanJoinRoomPlayers,
  generateRoomCode,
  formatRupiah,
  getStartSalaryForPlayer,
  calculateMovement,
  calculatePropertyRent,
  getUpgradeCostForNextLevel,
  calculateSellBuildingValue,
  calculateSellLandValue,
  calculateLoanTotalDue,
  resolveFitnahRoll,
  resolveRentRecipient,
  calculateLandTax,
  calculatePungliFee,
  resolveCourtVerdict,
  shuffleDeck,
  checkExtremeEscalation,
  cloneSavedCard,
  DURATION_MODE_OPTIONS,
  GameDurationMode,
  checkGameEndCondition,
  HUD_LAYOUT_MODE_OPTIONS,
  HudLayoutMode,
  cycleHudLayoutMode,
  TurnTransitionInfo,
  buildTurnTransitionInfo,
  DEFAULT_INTRO_MOVIE_FILENAME,
  resolveGameStartTargetScreen,
  mergeRemoteCustomAssetsWithLocal,
  sanitizeCustomAssetsForFirestore,
  countSyncedCustomAssets,
} from './game/rules';
import { IsometricBoard } from './components/IsometricBoard';
import {
  GameModals,
  PendingDebtObligation,
  PendingLoanProposal,
  PendingMoneyRequest,
} from './components/GameModals';
import { LobbyAndWaitingRoom } from './components/LobbyAndWaitingRoom';
import { HoverInfoPopups } from './components/HoverInfoPopups';
import { IntroMovieScreen } from './components/IntroMovieScreen';
import {
  auth,
  onAuthStateChanged,
  signInWithGooglePopup,
  signOutFirebaseUser,
  createFirestoreRoom,
  fetchFirestoreRoom,
  deleteFirestoreRoom,
  joinRoom,
  updateWaitingRoomInFirestore,
  syncHostCustomAssetsToFirestore,
  syncGameplayToFirestore,
  subscribeToFirestoreRoom,
  deserializePropertiesFromFirestore,
  sanitizeRoomCode,
  User,
} from './firebase';
import { soundFX } from './utils/sound';
import {
  CustomImageAssets,
  loadCustomAssetsFromStorage,
  saveCustomAssetsToStorage,
  saveCustomIntroMovieToIDB,
  loadCustomIntroMovieFromIDB,
  clearCustomIntroMovieFromIDB,
  getPawnAvatarImageUrl,
  getPublicAvatarsDiscovery,
} from './game/customAssets';
import { CustomAssetsModal } from './components/CustomAssetsModal';
import {
  Dices,
  Send,
  HandCoins,
  Building2,
  Box,
  Layers,
  Clock,
  Volume2,
  VolumeX,
  Pause,
  RotateCcw,
  ScrollText,
  Sparkles,
  ArrowRightCircle,
  Unlock,
  Crown,
  Landmark,
  Flame,
  Home,
  Bot,
  Cloud,
  Users,
  Maximize2,
  Minimize2,
  Palette,
  Timer,
  Crosshair,
  Eye,
  EyeOff,
  LayoutTemplate,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface ActivityLogItem {
  id: string;
  text: string;
  type: 'info' | 'gain' | 'penalty' | 'card' | 'bekasi';
  timestamp: string;
}

interface FloatingMoneyItem {
  id: string;
  playerId: number;
  playerName: string;
  delta: number;
  text: string;
  isPositive: boolean;
}

const isGameDurationMode = (value: unknown): value is GameDurationMode =>
  typeof value === 'string' &&
  DURATION_MODE_OPTIONS.some((mode) => mode.id === value);

const DICE_QUIPS = [
  'Bismillah keluar angka hoki, jangan masuk Lapas!',
  'Kocok terus mang, semoga lewat START dapat Gaji + Kuota Upgrade!',
  'Awas di depan ada Parkiran Pungli & Tilang ETLE!',
  'Pakai Kartu Wantimpres biar gaji START naik jadi Rp76,5 Jt!',
  'Demi KopDes sewa 250%, ayo meluncur!',
];

function createInitialAppProperties(): Record<number, PropertyState> {
  const base = createInitialProperties();
  if (base[13]) {
    base[13] = {
      ...base[13],
      ownerId: null,
      level: 1,
      isSeizedByState: true,
    };
  }
  return base;
}

export default function App() {
  const initialAutoStart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  // FASE 4 & 9: Screen Navigation State ("LOBBY" | "WAITING_ROOM" | "INTRO_MOVIE" | "GAME")
  const [screen, setScreen] = useState<
    'LOBBY' | 'WAITING_ROOM' | 'INTRO_MOVIE' | 'GAME'
  >(initialAutoStart ? 'GAME' : 'LOBBY');
  const [introMovieEnabled, setIntroMovieEnabled] = useState<boolean>(true);

  const [gameState, setGameState] = useState<
    'title' | 'playing' | 'paused' | 'gameover'
  >('playing');

  // FASE 4: Lobby & Player Select State + Firebase Multiplayer State
  const [nickname, setNickname] = useState<string>('Bang Jago');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('ojol');
  const [maxPlayers, setMaxPlayers] = useState<number>(64);
  const [roomCode, setRoomCode] = useState<string>('WNI-045');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(true);
  const [myPlayerId, setMyPlayerId] = useState<number>(0);
  const [isOnlineRoom, setIsOnlineRoom] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [isLobbyBusy, setIsLobbyBusy] = useState<boolean>(false);
  const [autoBotFastMode, setAutoBotFastMode] = useState<boolean>(true);

  const [isIsometric, setIsIsometric] = useState<boolean>(true);
  const [isFollowCamera, setIsFollowCamera] = useState<boolean>(false);
  const [hudMode, setHudMode] = useState<HudLayoutMode>('FULL');
  const [collapsedPanels, setCollapsedPanels] = useState<{
    players: boolean;
    cards: boolean;
    logs: boolean;
    actions: boolean;
  }>({
    players: false,
    cards: false,
    logs: false,
    actions: false,
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [customAssets, setCustomAssets] = useState<CustomImageAssets>(() =>
    loadCustomAssetsFromStorage()
  );
  const [showCustomAssetsModal, setShowCustomAssetsModal] =
    useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingMoneyItem[]>([]);
  const [playerCardBadges, setPlayerCardBadges] = useState<
    Record<number, FloatingMoneyItem>
  >({});
  const floatingTimersRef = useRef<Set<number>>(new Set());
  const prevMoneyMapRef = useRef<Record<number, number> | null>(null);
  // ID log aksi yang sudah pernah ditampilkan di klien ini (termasuk aksi lokal).
  // Dipakai supaya aksi pemain lain juga memunculkan toast kuning, tanpa
  // menduplikasi toast untuk aksi kita sendiri.
  const seenActivityLogIdsRef = useRef<Set<string>>(new Set());

  /**
   * Snapshot terakhir yang berhasil diterapkan dari Firestore.
   * Dipakai efek push untuk mendeteksi apakah state lokal benar-benar berubah
   * sejak snapshot terakhir — push hanya dikirim saat ada divergensi lokal
   * (hemat kuota Firestore: klien yang murni penerima tidak ikut menulis).
   */
  const lastRemoteSyncedRef = useRef<{
    players: Player[] | null;
    properties: Record<number, PropertyState> | null;
    loans: LoanRecord[] | null;
    activityLogs: ActivityLogItem[] | null;
    round: number | null;
    activePlayerIndex: number | null;
    stateTreasury: number | null;
    isExtremeMusibahActive: boolean | null;
    dice: [number, number] | null;
    diceQuip: string | null;
    durationMode: GameDurationMode | null;
    gameOverReason: string | null;
  }>({
    players: null,
    properties: null,
    loans: null,
    activityLogs: null,
    round: null,
    activePlayerIndex: null,
    stateTreasury: null,
    isExtremeMusibahActive: null,
    dice: null,
    diceQuip: null,
    durationMode: null,
    gameOverReason: null,
  });

  const handleUpdateCustomAssets = useCallback(
    (next: CustomImageAssets) => {
      const publicPawns = getPublicAvatarsDiscovery().pawnsByAvatarId;
      const mergedNext: CustomImageAssets = {
        ...next,
        pawns: {
          ...next.pawns,
          ...publicPawns,
        },
      };
      setCustomAssets(mergedNext);
      saveCustomAssetsToStorage(mergedNext);

      if (isOnlineRoom && isHost && firebaseUser && roomCode) {
        syncHostCustomAssetsToFirestore({
          roomCode,
          customAssets: mergedNext,
        })
          .then(() => {
            const count = countSyncedCustomAssets(mergedNext);
            setToastBanner(
              count > 0
                ? `☁️ ${count} Gambar Kustom Host berhasil disinkronkan ke seluruh pemain di Room #${roomCode}!`
                : `☁️ Gambar Room #${roomCode} dikembalikan ke gambar bawaan untuk semua pemain.`
            );
          })
          .catch((err) => {
            console.warn('Sync host custom assets warning:', err);
          });
      }
    },
    [isOnlineRoom, isHost, firebaseUser, roomCode]
  );

  // Load persisted custom intro movie Blob from IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    loadCustomIntroMovieFromIDB().then((stored) => {
      if (mounted && stored) {
        setCustomAssets((prev) => ({
          ...prev,
          introMovieUrl: stored.blobUrl,
          introMovieFilename: stored.cleanFilename,
          introMovieOriginalFilename: stored.originalFilename,
        }));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const [round, setRound] = useState<number>(1);
  const [durationMode, setDurationMode] = useState<GameDurationMode>('FAST_15');
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [stateTreasury, setStateTreasury] = useState<number>(25_000_000);

  // Hover Popup States (Character Avatar Profile & Board Tile Inspector)
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  const [hoveredTile, setHoveredTile] = useState<BoardTile | null>(null);
  const [hoverMousePos, setHoverMousePos] = useState<{ x: number; y: number }>({
    x: 320,
    y: 180,
  });

  const handleHoverPlayer = useCallback(
    (player: Player | null, clientX?: number, clientY?: number) => {
      setHoveredPlayer(player);
      if (typeof clientX === 'number' && typeof clientY === 'number') {
        setHoverMousePos({ x: clientX, y: clientY });
      }
    },
    []
  );

  const handleHoverTile = useCallback(
    (tile: BoardTile | null, clientX?: number, clientY?: number) => {
      setHoveredTile(tile);
      if (typeof clientX === 'number' && typeof clientY === 'number') {
        setHoverMousePos({ x: clientX, y: clientY });
      }
    },
    []
  );

  const [players, setPlayers] = useState<Player[]>(() => createInitialPlayers());
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [properties, setProperties] = useState<Record<number, PropertyState>>(
    () => createInitialAppProperties()
  );

  // Shuffled Takdir & Musibah Decks + Eskalasi Negara ("MUSIBAH EKSTREM AKTIF!")
  const [takdirDeck, setTakdirDeck] = useState<FateCard[]>(() =>
    shuffleDeck(TAKDIR_CARDS)
  );
  const [musibahDeck, setMusibahDeck] = useState<FateCard[]>(() =>
    shuffleDeck(MUSIBAH_CARDS)
  );
  const [isExtremeMusibahActive, setIsExtremeMusibahActive] =
    useState<boolean>(false);

  // Dice & Movement states + Strict 1x Roll Lock per Turn
  const [dice, setDice] = useState<[number, number]>([4, 2]);
  const [extraDie, setExtraDie] = useState<number | null>(null);
  const [khodamAppliedOnRoll, setKhodamAppliedOnRoll] = useState<number>(0);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [isLandingPause, setIsLandingPause] = useState<boolean>(false);
  const [justLandedTileId, setJustLandedTileId] = useState<number | null>(null);
  const landingPauseTimerRef = useRef<number | null>(null);
  const [hasRolledThisTurn, setHasRolledThisTurn] = useState<boolean>(false);
  const [turnPhase, setTurnPhase] = useState<
    'READY_TO_ROLL' | 'ROLLING' | 'RESOLVING_TILE' | 'TURN_ENDED'
  >('READY_TO_ROLL');
  const rollLockRef = useRef<boolean>(false);
  const [awaitingDukunConfirm, setAwaitingDukunConfirm] =
    useState<boolean>(false);
  const [pendingRollFreedFromJail, setPendingRollFreedFromJail] =
    useState<boolean>(false);
  const [pendingDoublesTakdir, setPendingDoublesTakdir] =
    useState<boolean>(false);

  const [diceQuip, setDiceQuip] = useState<string>(
    'Siap kocok dadu! Ingat: Juara 1 selalu Negara.'
  );
  const [toastBanner, setToastBanner] = useState<string | null>(null);
  const [turnSeconds, setTurnSeconds] = useState<number>(60);

  // Efek Transisi Visual Pergantian Giliran Pemain (Layer Semi-Transparan & Banner Nama Pemain)
  const [turnTransition, setTurnTransition] =
    useState<TurnTransitionInfo | null>(null);
  const [turnTransitionExiting, setTurnTransitionExiting] =
    useState<boolean>(false);
  const turnTransitionTimersRef = useRef<number[]>([]);

  const dismissTurnTransition = useCallback(() => {
    turnTransitionTimersRef.current.forEach((id) => clearTimeout(id));
    turnTransitionTimersRef.current = [];
    setTurnTransition(null);
    setTurnTransitionExiting(false);
  }, []);

  const triggerTurnTransition = useCallback(
    (nextPlayer: Player, nextRound: number, previousPlayerName?: string) => {
      turnTransitionTimersRef.current.forEach((id) => clearTimeout(id));
      turnTransitionTimersRef.current = [];

      const info = buildTurnTransitionInfo({
        player: nextPlayer,
        round: nextRound,
        previousPlayerName,
      });
      setTurnTransition(info);
      setTurnTransitionExiting(false);

      const exitTimer = window.setTimeout(() => {
        setTurnTransitionExiting(true);
      }, 1500);

      const clearTimer = window.setTimeout(() => {
        setTurnTransition(null);
        setTurnTransitionExiting(false);
      }, 1850);

      turnTransitionTimersRef.current = [exitTimer, clearTimer];
    },
    []
  );

  useEffect(() => {
    return () => {
      turnTransitionTimersRef.current.forEach((id) => clearTimeout(id));
      turnTransitionTimersRef.current = [];
    };
  }, []);

  // Modals state
  const [activeFateCard, setActiveFateCard] = useState<{
    card: FateCard;
    fromDoubles: boolean;
  } | null>(null);
  const [fateDiceResult, setFateDiceResult] = useState<number | null>(null);

  const [showBuyUpgradeModal, setShowBuyUpgradeModal] =
    useState<boolean>(false);
  const [startUpgradeBanner, setStartUpgradeBanner] = useState<boolean>(false);

  const [showGiveMoneyModal, setShowGiveMoneyModal] = useState<boolean>(false);
  const [showAskMoneyModal, setShowAskMoneyModal] = useState<boolean>(false);
  const [pendingMoneyRequest, setPendingMoneyRequest] =
    useState<PendingMoneyRequest | null>(null);

  const [showTollModal, setShowTollModal] = useState<boolean>(false);
  const [tollFeeRefunded, setTollFeeRefunded] = useState<boolean>(false);

  const [showCourtModal, setShowCourtModal] = useState<boolean>(false);
  const [courtDiceResult, setCourtDiceResult] = useState<number | null>(null);

  const [showJailModal, setShowJailModal] = useState<boolean>(false);
  const [showPremiumCellModal, setShowPremiumCellModal] =
    useState<boolean>(false);

  const [selectedCardToUse, setSelectedCardToUse] =
    useState<SavedCard | null>(null);
  const [showDukunModal, setShowDukunModal] = useState<boolean>(false);

  // Financial Crisis & Loan Shark (1% - 200% Interest) state
  const [pendingDebtObligation, setPendingDebtObligation] =
    useState<PendingDebtObligation | null>(null);
  const [pendingLoanProposal, setPendingLoanProposal] =
    useState<PendingLoanProposal | null>(null);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [showLoanManagerModal, setShowLoanManagerModal] =
    useState<boolean>(false);

  const [selectedTileModal, setSelectedTileModal] =
    useState<BoardTile | null>(null);

  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([
    {
      id: 'init-1',
      text: 'Permainan dimulai di Room #WNI-045! Modal awal Rp10 Jt & 10 Kartu Simpanan siap diuji.',
      type: 'info',
      timestamp: '00:01',
    },
    {
      id: 'init-2',
      text: '🏛️ Kartu Wantimpres tersedia di panel kanan (Ubah Gaji START dari Rp1 Jt menjadi Rp76,5 Jt!).',
      type: 'gain',
      timestamp: '00:02',
    },
    {
      id: 'init-3',
      text: '🚨 Petak #13 Cirebon berstatus SITAAN NEGARA (Hanya bisa dibeli via Sel Premium 👑).',
      type: 'penalty',
      timestamp: '00:03',
    },
  ]);

  const activePlayer = players[activePlayerIndex] || players[0];

  // Ref cermin gameState — dibaca handler snapshot Firestore yang closure-nya
  // bisa usang (efek subscribe tidak re-run saat gameState berubah).
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Kepemilikan giliran (mode online): HANYA klien pemain aktif yang boleh
  // menjalankan aksi giliran; untuk pemain bot, hanya Host yang menjalankan.
  // Mencegah SEMUA klien melempar dadu otomatis dengan RNG masing-masing.
  const isMyTurnToAct =
    !isOnlineRoom ||
    (activePlayer?.isBot
      ? isHost
      : Boolean(firebaseUser && activePlayer?.uid === firebaseUser.uid));
  // Tombol lempar/akhiri giliran dikunci saat bukan giliran kita secara online.
  const turnControlsLocked = isOnlineRoom && !isMyTurnToAct;
  const applyingRemoteSnapshotRef = useRef<boolean>(false);

  // Identitas kita di room online (fallback ke myPlayerId hasil snapshot).
  const myOnlinePlayer = isOnlineRoom
    ? players.find((p) => p.uid === firebaseUser?.uid) ?? null
    : null;
  const myOnlinePlayerId = myOnlinePlayer ? myOnlinePlayer.id : myPlayerId;

  // --- VISIBILITAS AJUAN ANTAR-PEMAIN ---
  // Minta Duit & pinjaman antar-WNI HARUS dilihat oleh pemain yang menjawab,
  // bukan oleh pemohon. Bot tidak punya klien: permintaan uang ke bot dijawab
  // otomatis di klien pemohon, sedangkan pinjaman dari bot tetap disetujui
  // peminjam (tidak ada manusia yang dirugikan).
  const moneyRequestTarget = pendingMoneyRequest
    ? players.find((p) => p.id === pendingMoneyRequest.toPlayerId) ?? null
    : null;
  const loanProposalLender = pendingLoanProposal
    ? players.find((p) => p.id === pendingLoanProposal.lenderId) ?? null
    : null;
  // Klien yang berhak menjalankan respons (termasuk pemohon bila targetnya bot).
  const canRespondToMoneyRequest =
    Boolean(pendingMoneyRequest) &&
    (!isOnlineRoom ||
      (moneyRequestTarget?.isBot
        ? pendingMoneyRequest?.fromPlayerId === myOnlinePlayerId
        : pendingMoneyRequest?.toPlayerId === myOnlinePlayerId));
  const canRespondToLoanProposal =
    Boolean(pendingLoanProposal) &&
    (!isOnlineRoom ||
      (loanProposalLender?.isBot
        ? pendingLoanProposal?.borrowerId === myOnlinePlayerId
        : pendingLoanProposal?.lenderId === myOnlinePlayerId));
  // Modal hanya untuk pemain tujuan (manusia). Request ke bot diselesaikan
  // otomatis, jadi pemohon tidak perlu melihat modal persetujuan.
  const visibleMoneyRequest =
    pendingMoneyRequest &&
    (!isOnlineRoom ||
      (!moneyRequestTarget?.isBot &&
        pendingMoneyRequest.toPlayerId === myOnlinePlayerId))
      ? pendingMoneyRequest
      : null;
  const visibleLoanProposal = canRespondToLoanProposal
    ? pendingLoanProposal
    : null;

  // Waktu klien ini terakhir mengubah request secara lokal. Snapshot yang tiba
  // <1.5 dtk setelahnya diabaikan agar push kita sendiri tidak saling menimpa.
  const pendingRequestWriteAtRef = useRef<number>(0);

  // Ref cermin players — dipakai animasi gerak pion di klien penerima snapshot.
  const playersRef = useRef<Player[]>(players);
  playersRef.current = players;

  // --- ANIMASI GERAK PION UNTUK KLIEN NON-AKTIF ---
  // Snapshot Firestore hanya membawa posisi akhir, sehingga klien lain dulu
  // melihat pion "teleport" ke petak tujuan. Di sini posisi akhir itu diurai
  // kembali menjadi langkah 1-petak (115-140ms) supaya animasi perjalanan ikut
  // terlihat di semua pemain, bukan hanya di klien yang melempar dadu.
  const remoteWalkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remoteWalkTargetsRef = useRef<Map<number, number>>(new Map());
  const remoteAnimatingRef = useRef<boolean>(false);

  const stopRemoteWalkAnimation = useCallback(() => {
    if (remoteWalkTimerRef.current !== null) {
      clearInterval(remoteWalkTimerRef.current);
      remoteWalkTimerRef.current = null;
    }
    remoteWalkTargetsRef.current.clear();
    remoteAnimatingRef.current = false;
  }, []);

  const applyRemotePlayers = useCallback(
    (remotePlayers: Player[]) => {
      stopRemoteWalkAnimation();

      const prevLocalPlayers = playersRef.current;
      const walkTargets = new Map<number, number>();
      const stagedPlayers = remotePlayers.map((remotePlayer) => {
        const prev = prevLocalPlayers.find((p) => p.id === remotePlayer.id);
        if (!prev || prev.position === remotePlayer.position) {
          return remotePlayer;
        }
        const oldPos = prev.position;
        const newPos = remotePlayer.position;
        const isPerimeter = (v: number) =>
          Number.isInteger(v) && v >= 0 && v < PERIMETER_TILE_COUNT;
        const forwardDelta =
          (newPos - oldPos + PERIMETER_TILE_COUNT) % PERIMETER_TILE_COUNT;
        // Hanya perpindahan wajar hasil lemparan dadu (maju 1..20 petak, status
        // tidak berubah) yang dianimasikan. Teleport (Lapas, Bekasi, Tol yang
        // jauh, restart) tetap snap agar tidak terlihat berjalan mundur/aneh.
        if (
          isPerimeter(oldPos) &&
          isPerimeter(newPos) &&
          forwardDelta >= 1 &&
          forwardDelta <= 20 &&
          remotePlayer.status === prev.status
        ) {
          walkTargets.set(remotePlayer.id, newPos);
          return { ...remotePlayer, position: oldPos };
        }
        return remotePlayer;
      });

      setPlayers(stagedPlayers);
      lastRemoteSyncedRef.current.players = stagedPlayers;

      if (walkTargets.size === 0) return;

      remoteWalkTargetsRef.current = walkTargets;
      remoteAnimatingRef.current = true;

      remoteWalkTimerRef.current = setInterval(() => {
        const targets = remoteWalkTargetsRef.current;
        let allReached = true;
        const steppedPlayers = playersRef.current.map((p) => {
          const target = targets.get(p.id);
          if (target === undefined || p.position === target) return p;
          allReached = false;
          const nextPos = (p.position + 1) % PERIMETER_TILE_COUNT;
          return {
            ...p,
            position: nextPos,
            lastPerimeterPosition: nextPos,
          };
        });

        if (allReached) {
          stopRemoteWalkAnimation();
          // Kunci posisi akhir persis seperti snapshot agar tidak dianggap divergen.
          setPlayers(remotePlayers);
          lastRemoteSyncedRef.current.players = remotePlayers;
          return;
        }
        setPlayers(steppedPlayers);
      }, 140);
    },
    [stopRemoteWalkAnimation]
  );

  // Hentikan animasi berjalan saat komponen unmount / keluar room.
  useEffect(() => () => stopRemoteWalkAnimation(), [stopRemoteWalkAnimation]);

  useEffect(() => {
    document.body.dataset.state = screen === 'GAME' ? gameState : screen.toLowerCase();
  }, [screen, gameState]);

  // Popup hover bisa "nyangkut" ketika elemen yang di-hover hilang (pion pindah
  // petak saat animasi), kursor keluar jendela, atau modal terbuka. Sapu bersih
  // lewat listener global agar popup tidak pernah tertinggal di layar.
  useEffect(() => {
    const clearHover = () => {
      setHoveredPlayer(null);
      setHoveredTile(null);
    };
    const handlePointerMove = (e: PointerEvent) => {
      const target = e.target as Element | null;
      // Semua sumber hover (petak, pion, kartu pemain) ditandai
      // data-hover-popup-anchor="true" — popup hanya boleh hidup di atasnya.
      if (target && target.closest('[data-hover-popup-anchor="true"]')) {
        return;
      }
      clearHover();
    };
    const handleWindowMouseOut = (e: MouseEvent) => {
      // relatedTarget null = kursor meninggalkan jendela/dokumen.
      if (!e.relatedTarget) clearHover();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') clearHover();
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('mouseout', handleWindowMouseOut);
    window.addEventListener('blur', clearHover);
    window.addEventListener('scroll', clearHover, true);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('mouseout', handleWindowMouseOut);
      window.removeEventListener('blur', clearHover);
      window.removeEventListener('scroll', clearHover, true);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Popup hover tidak relevan lagi begitu modal (mis. detail petak) dibuka.
  useEffect(() => {
    if (selectedTileModal) {
      setHoveredPlayer(null);
      setHoveredTile(null);
    }
  }, [selectedTileModal]);

  // Pion yang bergerak/teleport (atau bangkrut) saat sedang di-hover: popup
  // profilnya sudah tidak relevan dan tidak akan menerima onMouseLeave karena
  // elemennya berpindah petak — tutup proaktif.
  useEffect(() => {
    if (!hoveredPlayer) return;
    const fresh = players.find((p) => p.id === hoveredPlayer.id);
    if (
      !fresh ||
      fresh.position !== hoveredPlayer.position ||
      fresh.status === 'BANGKRUT'
    ) {
      setHoveredPlayer(null);
    }
  }, [players, hoveredPlayer]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user?.displayName && nickname === 'Bang Jago') {
        setNickname(user.displayName.slice(0, 28));
      }
    });
    return () => unsub();
  }, [nickname]);

  // Subscribe to Firestore Room onSnapshot when in an online room
  useEffect(() => {
    if (!isOnlineRoom || !roomCode || !firebaseUser) return;
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeToFirestoreRoom(
        roomCode,
        (roomData) => {
          applyingRemoteSnapshotRef.current = true;
          if (roomData.players && roomData.players.length > 0) {
            applyRemotePlayers(roomData.players);

            // Tentukan status Host berdasarkan roomData.hostId === myPlayerId (atau hostUid)
            const me = roomData.players.find(
              (p) => p.uid === firebaseUser.uid
            );
            const currentMyId = me ? me.id : myPlayerId;
            if (me && me.id !== myPlayerId) {
              setMyPlayerId(me.id);
            }
            const isCurrentHost =
              roomData.hostId !== undefined
                ? roomData.hostId === currentMyId
                : roomData.hostUid === firebaseUser.uid;
            setIsHost(isCurrentHost);
          }
          if (roomData.properties) {
            const remoteProps = deserializePropertiesFromFirestore(
              roomData.properties
            );
            setProperties(remoteProps);
            lastRemoteSyncedRef.current.properties = remoteProps;
          }
          if (roomData.customAssets) {
            setCustomAssets((prev) =>
              mergeRemoteCustomAssetsWithLocal(prev, roomData.customAssets)
            );
          }
          if (typeof roomData.maxPlayers === 'number') {
            setMaxPlayers(roomData.maxPlayers);
          }
          if (typeof roomData.round === 'number') {
            setRound(roomData.round);
            lastRemoteSyncedRef.current.round = roomData.round;
          }
          if (typeof roomData.activePlayerIndex === 'number') {
            lastRemoteSyncedRef.current.activePlayerIndex =
              roomData.activePlayerIndex;
            setActivePlayerIndex((prevIdx) => {
              if (prevIdx !== roomData.activePlayerIndex) {
                rollLockRef.current = false;
                setHasRolledThisTurn(false);
                setTurnPhase('READY_TO_ROLL');
                const incomingList =
                  roomData.players && roomData.players.length > 0
                    ? roomData.players
                    : players;
                const incomingPlayer =
                  incomingList[roomData.activePlayerIndex];
                const prevPlayer = incomingList[prevIdx];
                if (incomingPlayer) {
                  triggerTurnTransition(
                    incomingPlayer,
                    typeof roomData.round === 'number' ? roomData.round : round,
                    prevPlayer?.name
                  );
                }
              }
              return roomData.activePlayerIndex;
            });
          }
          if (typeof roomData.stateTreasury === 'number') {
            setStateTreasury(roomData.stateTreasury);
            lastRemoteSyncedRef.current.stateTreasury = roomData.stateTreasury;
          }
          if (typeof roomData.isExtremeMusibahActive === 'boolean') {
            setIsExtremeMusibahActive(roomData.isExtremeMusibahActive);
            lastRemoteSyncedRef.current.isExtremeMusibahActive =
              roomData.isExtremeMusibahActive;
          }
          if (Array.isArray(roomData.dice) && roomData.dice.length === 2) {
            const remoteDice: [number, number] = [
              roomData.dice[0],
              roomData.dice[1],
            ];
            setDice(remoteDice);
            lastRemoteSyncedRef.current.dice = remoteDice;
          }
          if (roomData.diceQuip) {
            setDiceQuip(roomData.diceQuip);
            lastRemoteSyncedRef.current.diceQuip = roomData.diceQuip;
          }
          if (Array.isArray(roomData.loans)) {
            setLoans(roomData.loans);
            lastRemoteSyncedRef.current.loans = roomData.loans;
          }
          if (Array.isArray(roomData.activityLogs) && roomData.activityLogs.length > 0) {
            setActivityLogs(roomData.activityLogs);
            lastRemoteSyncedRef.current.activityLogs = roomData.activityLogs;
          }
          if (isGameDurationMode(roomData.durationMode)) {
            setDurationMode(roomData.durationMode);
            lastRemoteSyncedRef.current.durationMode = roomData.durationMode;
          }
          if (typeof roomData.gameOverReason === 'string') {
            setGameOverReason(roomData.gameOverReason);
            lastRemoteSyncedRef.current.gameOverReason = roomData.gameOverReason;
          }

          // Ajuan antar-pemain ikut disinkronkan. Abaikan snapshot yang datang
          // terlalu cepat setelah klien ini menulis request (hindari balapan
          // dengan push kita sendiri yang belum tentu sudah sampai server).
          if (Date.now() - pendingRequestWriteAtRef.current > 1500) {
            setPendingMoneyRequest(roomData.pendingMoneyRequest ?? null);
            setPendingLoanProposal(roomData.pendingLoanProposal ?? null);
          }

          // FIX 2: TRANSISI KELUAR RUANG TUNGGU BERSAMA-SAMA (HOST & GUEST IKUT PLAY)
          // Begitu gameState berubah jadi 'PLAYING', aplikasi di layar Guest WAJIB otomatis
          // mengubah state navigasi layarnya dari 'WAITING_ROOM' menjadi 'GAME' secara serentak bersama Host!
          if (
            (roomData.gameState === 'PLAYING' || roomData.status === 'PLAYING') &&
            screen === 'WAITING_ROOM'
          ) {
            // Semua klien (Host & Guest) melihat Opening Movie lebih dulu bila
            // diaktifkan. Masing-masing bisa menekan tombol LEWATI kapan saja.
            setScreen(
              resolveGameStartTargetScreen({
                introMovieEnabled,
              })
            );
            setGameState('playing');
          } else if (
            (roomData.gameState === 'PLAYING' || roomData.status === 'PLAYING') &&
            screen === 'GAME' &&
            gameStateRef.current === 'gameover'
          ) {
            // Host menekan "MAIN LAGI": room dihidupkan kembali dari FINISHED,
            // semua klien keluar dari layar akhir dan melanjutkan permainan baru.
            setGameState('playing');
          } else if (
            (roomData.gameState === 'FINISHED' || roomData.status === 'FINISHED') &&
            screen === 'GAME'
          ) {
            setGameState('gameover');
          }
          setTimeout(() => {
            applyingRemoteSnapshotRef.current = false;
          }, 80);
        },
        (err) => {
          console.warn('Firestore room subscription warning:', err);
        },
        () => {
          // Room dihapus dari server (misalnya Host membubarkan room lewat layar akhir)
          if (!isOnlineRoom) return;
          showQuickBanner(
            `🗑️ Room #${roomCode} telah dibubarkan oleh Host. Warga kembali ke Lobby...`
          );
          setIsOnlineRoom(false);
          setRoomCode('');
          setIsHost(false);
          setGameState('title');
          setScreen('LOBBY');
        }
      );
    } catch (err) {
      console.warn('Could not attach Firestore listener:', err);
    }
    return () => {
      stopRemoteWalkAnimation();
      if (unsub) unsub();
    };
  }, [
    isOnlineRoom,
    roomCode,
    firebaseUser,
    screen,
    myPlayerId,
    applyRemotePlayers,
    stopRemoteWalkAnimation,
    introMovieEnabled,
  ]);

  // Push local gameplay state updates to Firestore when in an online room during GAME
  useEffect(() => {
    if (
      !isOnlineRoom ||
      !firebaseUser ||
      screen !== 'GAME' ||
      applyingRemoteSnapshotRef.current ||
      remoteAnimatingRef.current ||
      isRolling ||
      isMoving
    ) {
      return;
    }
    // GATE HEMAT KUOTA: kirim hanya jika state lokal benar-benar berubah sejak
    // snapshot Firestore terakhir (mis. pemain menerima permintaan uang, menyetujui
    // pinjaman, atau klien ini yang sedang menjalankan giliran). Klien yang murni
    // menerima snapshot tidak ikut menulis — mengurangi pemborosan kuota & bentrok.
    const remoteSnapshot = lastRemoteSyncedRef.current;
    const hasLocalDivergence =
      players !== remoteSnapshot.players ||
      properties !== remoteSnapshot.properties ||
      loans !== remoteSnapshot.loans ||
      activityLogs !== remoteSnapshot.activityLogs ||
      round !== remoteSnapshot.round ||
      activePlayerIndex !== remoteSnapshot.activePlayerIndex ||
      stateTreasury !== remoteSnapshot.stateTreasury ||
      isExtremeMusibahActive !== remoteSnapshot.isExtremeMusibahActive ||
      dice !== remoteSnapshot.dice ||
      diceQuip !== remoteSnapshot.diceQuip ||
      durationMode !== remoteSnapshot.durationMode ||
      gameOverReason !== remoteSnapshot.gameOverReason;
    if (!hasLocalDivergence) {
      return;
    }
    const timer = setTimeout(() => {
      syncGameplayToFirestore({
        roomCode,
        players,
        properties,
        loans,
        activityLogs,
        round,
        activePlayerIndex,
        stateTreasury,
        isExtremeMusibahActive,
        dice,
        diceQuip,
        status: gameState === 'gameover' ? 'FINISHED' : 'PLAYING',
        durationMode: isHost ? durationMode : undefined,
        gameOverReason,
        pendingMoneyRequest,
        pendingLoanProposal,
        customAssets: isHost ? customAssets : undefined,
      }).catch((err) => {
        console.warn('Sync gameplay to Firestore failed:', err);
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [
    isOnlineRoom,
    firebaseUser,
    screen,
    roomCode,
    players,
    properties,
    loans,
    activityLogs,
    round,
    activePlayerIndex,
    stateTreasury,
    isExtremeMusibahActive,
    dice,
    diceQuip,
    durationMode,
    gameOverReason,
    pendingMoneyRequest,
    pendingLoanProposal,
    gameState,
    isRolling,
    isMoving,
    isHost,
    customAssets,
  ]);

  const showQuickBanner = useCallback((msg: string) => {
    setToastBanner(msg);
    setTimeout(() => {
      setToastBanner((prev) => (prev === msg ? null : prev));
    }, 4200);
  }, []);

  // TOAST AKSI PEMAIN LAIN (ONLINE):
  // Activity log ikut disinkronkan lewat Firestore, jadi setiap entri log baru
  // dari pemain lain kita tampilkan sebagai pop-up kuning yang sama. Aksi kita
  // sendiri sudah ditandai "seen" di addLog agar toast tidak muncul dua kali.
  const lastActivityLogsForToastRef = useRef<ActivityLogItem[] | null>(null);
  useEffect(() => {
    const prevLogs = lastActivityLogsForToastRef.current;
    lastActivityLogsForToastRef.current = activityLogs;
    if (
      !prevLogs ||
      screen !== 'GAME' ||
      gameState !== 'playing' ||
      activityLogs.length === 0
    ) {
      return;
    }
    const prevIds = new Set(prevLogs.map((log) => log.id));
    const freshRemoteLogs = activityLogs.filter(
      (log) =>
        !prevIds.has(log.id) && !seenActivityLogIdsRef.current.has(log.id)
    );
    if (freshRemoteLogs.length === 0) return;
    freshRemoteLogs.forEach((log) => {
      seenActivityLogIdsRef.current.add(log.id);
    });
    showQuickBanner(freshRemoteLogs[0].text);
  }, [activityLogs, screen, gameState, showQuickBanner]);

  const addLog = useCallback(
    (text: string, type: ActivityLogItem['type'] = 'info') => {
      const now = new Date();
      const timestamp = `${String(now.getMinutes()).padStart(2, '0')}:${String(
        now.getSeconds()
      ).padStart(2, '0')}`;
      const id = `${Date.now()}-${Math.random()}`;
      const seenIds = seenActivityLogIdsRef.current;
      seenIds.add(id);
      if (seenIds.size > 300) {
        // Batasi memori: buang ID paling lama.
        const oldest = seenIds.values().next().value;
        if (oldest) seenIds.delete(oldest);
      }
      setActivityLogs((prev) => [
        {
          id,
          text,
          type,
          timestamp,
        },
        ...prev.slice(0, 32),
      ]);
    },
    []
  );

  // Check if only 1 player remains alive -> Game Over ("JUARA 1: NEGARA | JUARA 2: ...")
  useEffect(() => {
    if (screen !== 'GAME' || gameState !== 'playing') return;
    const alive = players.filter((p) => p.status !== 'BANGKRUT');
    if (alive.length <= 1) {
      setGameState('gameover');
    }
  }, [players, screen, gameState]);

  // Draw a card from the shuffled Takdir or Musibah deck (reshuffles automatically when empty)
  const drawFateCard = useCallback(
    (deck: 'TAKDIR' | 'MUSIBAH', fromDoubles: boolean = false) => {
      soundFX.playCardReveal(deck === 'TAKDIR');
      setFateDiceResult(null);

      if (deck === 'TAKDIR') {
        setTakdirDeck((prevDeck) => {
          const currentPool =
            prevDeck.length > 0 ? prevDeck : shuffleDeck(TAKDIR_CARDS);
          const [picked, ...rest] = currentPool;
          setActiveFateCard({ card: picked, fromDoubles });
          return rest.length > 0 ? rest : shuffleDeck(TAKDIR_CARDS);
        });
      } else {
        setMusibahDeck((prevDeck) => {
          const baseCards = isExtremeMusibahActive
            ? [...MUSIBAH_CARDS, ...EXTREME_MUSIBAH_CARDS]
            : MUSIBAH_CARDS;
          const currentPool =
            prevDeck.length > 0 ? prevDeck : shuffleDeck(baseCards);
          const [picked, ...rest] = currentPool;
          setActiveFateCard({ card: picked, fromDoubles });
          return rest.length > 0 ? rest : shuffleDeck(baseCards);
        });
      }
    },
    [isExtremeMusibahActive]
  );

  /**
   * Charges a player `amount`. If the player has enough cash, deducts immediately and transfers to recipient/Negara.
   * If the player does NOT have enough cash, opens the Fase 3 Financial Crisis Modal (Sell 50% / Loan 1-200% / Bankruptcy)!
   */
  const chargePlayerOrTriggerCrisis = useCallback(
    (
      playerIndex: number,
      amount: number,
      reason: string,
      recipientPlayerId: number | null = null
    ) => {
      if (amount <= 0) return;

      setPlayers((prevPlayers) => {
        const target = prevPlayers[playerIndex];
        if (!target) return prevPlayers;

        if (target.money >= amount) {
          if (recipientPlayerId === null) {
            setStateTreasury((t) => t + amount);
          }
          return prevPlayers.map((p, idx) => {
            if (idx === playerIndex) {
              return { ...p, money: p.money - amount };
            }
            if (recipientPlayerId !== null && p.id === recipientPlayerId) {
              return {
                ...p,
                money: p.money + amount,
                earnedIncome: p.earnedIncome + amount,
              };
            }
            return p;
          });
        }

        // Player does NOT have enough cash -> Open Financial Crisis Modal!
        setPendingDebtObligation({
          playerIndex,
          amount,
          reason,
          recipientPlayerId,
        });
        addLog(
          `⚠️ KRISIS KEUANGAN! Saldo ${target.name} (${formatRupiah(
            target.money
          )}) tidak cukup untuk membayar ${reason} (${formatRupiah(
            amount
          )}). Pilih Gadai Aset 50% atau Ngutang ke Pemain Lain!`,
          'penalty'
        );
        return prevPlayers;
      });
    },
    [addLog]
  );

  /**
   * TAGIH PAKSA: Executed when a borrower's 3-turn loan deadline expires (turnsLeft <= 0).
   */
  const executeForcedLoanCollection = useCallback(
    (expiredLoan: LoanRecord) => {
      const borrowerIdx = players.findIndex(
        (p) => p.id === expiredLoan.borrowerId
      );
      if (borrowerIdx === -1) return;
      const borrower = players[borrowerIdx];
      const lender = players.find((p) => p.id === expiredLoan.lenderId);

      let debtRemaining = expiredLoan.remainingDue;
      let cashAvailable = borrower.money;
      let collectedForLender = 0;

      // 1. Take available cash
      const cashTaken = Math.min(cashAvailable, debtRemaining);
      cashAvailable -= cashTaken;
      debtRemaining -= cashTaken;
      collectedForLender += cashTaken;

      // 2. If still owing, forcibly liquidate borrower's properties at 50% value
      const updatedProps = { ...properties };
      if (debtRemaining > 0) {
        const ownedProps = Object.values(updatedProps).filter(
          (pr) => pr.ownerId === borrower.id && !pr.isSeizedByState
        );
        for (const prop of ownedProps) {
          if (debtRemaining <= 0) break;
          const tile = BOARD_TILES.find((t) => t.id === prop.tileId);
          if (!tile) continue;
          const totalLiquidationVal = calculateSellLandValue(tile, prop.level);
          updatedProps[prop.tileId] = {
            ...prop,
            ownerId: null,
            isSeizedByState: true,
          };
          cashAvailable += totalLiquidationVal;
          const payFromAsset = Math.min(cashAvailable, debtRemaining);
          cashAvailable -= payFromAsset;
          debtRemaining -= payFromAsset;
          collectedForLender += payFromAsset;

          addLog(
            `🚨 TAGIH PAKSA UTANG! Tanah #${tile.id} ${tile.name} milik ${
              borrower.name
            } disita & dilelang paksa 50% (${formatRupiah(
              totalLiquidationVal
            )}) untuk membayar utang ke ${lender?.name ?? 'Kreditur'}!`,
            'penalty'
          );
        }
        setProperties(updatedProps);
      }

      if (debtRemaining <= 0) {
        soundFX.playCashIn();
        setLoans((prev) => prev.filter((l) => l.id !== expiredLoan.id));
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.id === borrower.id) return { ...p, money: cashAvailable };
            if (p.id === expiredLoan.lenderId) {
              return {
                ...p,
                money: p.money + collectedForLender,
                earnedIncome: p.earnedIncome + collectedForLender,
              };
            }
            return p;
          })
        );
        addLog(
          `⚖️ TAGIH PAKSA LUNAS! Utang ${borrower.name} ke ${
            lender?.name ?? 'Kreditur'
          } sebesar ${formatRupiah(collectedForLender)} berhasil dilunasi paksa!`,
          'info'
        );
        showQuickBanner(
          `⚖️ Tagih Paksa! Utang ${borrower.name} dilunasi dari uang & aset.`
        );
      } else {
        soundFX.playPenalty();
        setLoans((prev) => prev.filter((l) => l.id !== expiredLoan.id));
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.id === borrower.id) {
              return { ...p, money: 0, status: 'BANGKRUT' };
            }
            if (p.id === expiredLoan.lenderId) {
              return {
                ...p,
                money: p.money + collectedForLender,
                earnedIncome: p.earnedIncome + collectedForLender,
              };
            }
            return p;
          })
        );
        addLog(
          `💀 BANGKRUT (DIKALAHKAN NEGARA)! ${borrower.name} gagal melunasi Tagih Paksa utang rentenir setelah 3 putaran giliran dan seluruh asetnya habis!`,
          'penalty'
        );
        showQuickBanner(
          `💀 ${borrower.name} BANGKRUT (Dikalahkan Negara) akibat gagal bayar utang!`
        );
      }
    },
    [players, properties, addLog, showQuickBanner]
  );

  // Advance to the next player's turn (ONLY place where dice roll lock is reset!)
  // Anti giliran dobel: semua penjadwalan "maju giliran" lewat satu jalur ini,
  // dan eksekusi mana pun (klik manual maupun timer) membatalkan jadwal lama.
  const pendingTurnAdvanceTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(
    new Set()
  );
  // Ref cermin flag modal yang sedang terbuka — dipakai penjadwal maju giliran
  // otomatis agar tidak menabrak rantai modal yang baru terbuka (kartu Takdir,
  // Pengadilan, Krisis Keuangan, dsb.).
  const modalFlowBusyRef = useRef(false);
  useEffect(() => {
    modalFlowBusyRef.current = Boolean(
      pendingDebtObligation ||
        activeFateCard ||
        showCourtModal ||
        showTollModal ||
        showJailModal ||
        showPremiumCellModal ||
        showBuyUpgradeModal ||
        visibleLoanProposal ||
        visibleMoneyRequest ||
        showGiveMoneyModal ||
        showAskMoneyModal ||
        showDukunModal
    );
  }, [
    pendingDebtObligation,
    activeFateCard,
    showCourtModal,
    showTollModal,
    showJailModal,
    showPremiumCellModal,
    showBuyUpgradeModal,
    visibleLoanProposal,
    visibleMoneyRequest,
    showGiveMoneyModal,
    showAskMoneyModal,
    showDukunModal,
  ]);

  const handleNextTurn = useCallback(() => {
    if (isRolling || isMoving || isLandingPause) return;

    // Batalkan penjadwalan maju giliran yang masih tertunda — klik manual
    // menimpa timer otomatis dan sebaliknya, agar giliran tidak terlewat dua kali.
    pendingTurnAdvanceTimersRef.current.forEach((timer) => clearTimeout(timer));
    pendingTurnAdvanceTimersRef.current.clear();

    if (landingPauseTimerRef.current) {
      clearTimeout(landingPauseTimerRef.current);
      landingPauseTimerRef.current = null;
    }

    rollLockRef.current = false;
    setHasRolledThisTurn(false);
    setTurnPhase('READY_TO_ROLL');
    setIsRolling(false);
    setIsMoving(false);
    setIsLandingPause(false);
    setJustLandedTileId(null);
    setFloatingTexts([]);
    setPlayerCardBadges({});
    setPendingDoublesTakdir(false);
    setStartUpgradeBanner(false);
    setAwaitingDukunConfirm(false);
    setExtraDie(null);
    setKhodamAppliedOnRoll(0);
    setTurnSeconds(60);

    // Expire any unanswered MINTA DUIT request when turn ends!
    if (pendingMoneyRequest) {
      addLog(
        `⌛ Permintaan Minta Duit dari ${activePlayer.name} otomatis hangus karena giliran berakhir.`,
        'info'
      );
      setPendingMoneyRequest(null);
      pendingRequestWriteAtRef.current = Date.now();
    }

    if (pendingLoanProposal) {
      const proposalBorrower = players.find(
        (p) => p.id === pendingLoanProposal.borrowerId
      );
      const proposalLender = players.find(
        (p) => p.id === pendingLoanProposal.lenderId
      );
      addLog(
        `⌛ Pengajuan pinjaman ${proposalBorrower?.name ?? 'pemain'} ke ${
          proposalLender?.name ?? 'pemain'
        } hangus karena giliran berakhir.`,
        'info'
      );
      setPendingLoanProposal(null);
      pendingRequestWriteAtRef.current = Date.now();
    }

    // Tutup sisa modal/antrean giliran sebelumnya agar tidak terbawa ke pemain
    // berikutnya (kartu Takdir, Pengadilan, Gerbang Tol, dsb. yang tertinggal).
    setActiveFateCard(null);
    setFateDiceResult(null);
    setCourtDiceResult(null);
    setShowCourtModal(false);
    setShowTollModal(false);
    setTollFeeRefunded(false);
    setShowBuyUpgradeModal(false);
    setShowGiveMoneyModal(false);
    setShowAskMoneyModal(false);
    setShowDukunModal(false);
    setSelectedCardToUse(null);
    setPendingLoanProposal(null);
    setPendingDebtObligation(null);

    const alive = players.filter((p) => p.status !== 'BANGKRUT');
    if (alive.length <= 1) {
      const endCheck = checkGameEndCondition({
        players,
        properties,
        loans,
        round,
        durationMode,
      });
      setGameOverReason(endCheck.reason);
      setGameState('gameover');
      return;
    }

    let nextIdx = (activePlayerIndex + 1) % players.length;
    let loops = 0;
    while (players[nextIdx]?.status === 'BANGKRUT' && loops < players.length) {
      nextIdx = (nextIdx + 1) % players.length;
      loops += 1;
    }

    const wrappedRound = nextIdx <= activePlayerIndex;
    const nextRound = wrappedRound ? round + 1 : round;

    // Check Fast Duration Mode (Round Limit / Target Wealth) on turn/round transition
    const endCheck = checkGameEndCondition({
      players,
      properties,
      loans,
      round: nextRound,
      durationMode,
    });
    if (endCheck.isGameOver) {
      setGameOverReason(endCheck.reason);
      addLog(`🏆 PERMAINAN BERAKHIR: ${endCheck.reason}`, 'gain');
      soundFX.playCashIn();
      setGameState('gameover');
      return;
    }

    if (wrappedRound) {
      setRound(nextRound);
    }

    const nextPlayer = players[nextIdx];
    if (!nextPlayer) return;

    // Decrement turnsLeft on all active loans belonging to nextPlayer (3 borrower turns)
    const borrowerLoans = loans.filter(
      (l) => l.borrowerId === nextPlayer.id && l.remainingDue > 0
    );
    const expiredLoans: LoanRecord[] = [];
    if (borrowerLoans.length > 0) {
      setLoans((prevLoans) =>
        prevLoans.map((l) => {
          if (l.borrowerId !== nextPlayer.id || l.remainingDue <= 0) return l;
          const updatedTurns = l.turnsLeft - 1;
          const updatedLoan = { ...l, turnsLeft: updatedTurns };
          if (updatedTurns <= 0) {
            expiredLoans.push(updatedLoan);
          }
          return updatedLoan;
        })
      );
    }

    // Handle Bekasi return
    let effectiveNextPlayer: Player = nextPlayer;
    if (nextPlayer.status === 'DI_BEKASI' && nextPlayer.skipTurns > 0) {
      effectiveNextPlayer = {
        ...nextPlayer,
        skipTurns: 0,
        status: 'NORMAL',
        position: nextPlayer.lastPerimeterPosition || 0,
      };
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === nextIdx ? effectiveNextPlayer : p))
      );
      addLog(
        `🚀 ${nextPlayer.name} selesai menjalani isolasi di Planet Bekasi & kembali ke Bumi!`,
        'bekasi'
      );
    }

    setActivePlayerIndex(nextIdx);
    setDiceQuip(`Giliran ${nextPlayer.name}! Ayo beraksi.`);
    triggerTurnTransition(effectiveNextPlayer, nextRound, activePlayer.name);

    // Trigger Tagih Paksa for any expired loans on this borrower's turn
    if (expiredLoans.length > 0) {
      setTimeout(() => {
        expiredLoans.forEach((ln) => executeForcedLoanCollection(ln));
      }, 250);
    }

    // Automatically open Lapas or Sel Premium modal if the new active player is in Lapas / Sel Premium (and not a fast-auto bot)
    if (!nextPlayer.isBot || !autoBotFastMode) {
      if (nextPlayer.status === 'DI_LAPAS') {
        setTimeout(() => setShowJailModal(true), 1200);
      } else if (nextPlayer.status === 'SEL_PREMIUM') {
        setTimeout(() => setShowPremiumCellModal(true), 1200);
      }
    }
  }, [
    activePlayerIndex,
    activePlayer.name,
    players,
    properties,
    loans,
    round,
    durationMode,
    pendingMoneyRequest,
    pendingLoanProposal,
    autoBotFastMode,
    isRolling,
    isMoving,
    isLandingPause,
    addLog,
    executeForcedLoanCollection,
    triggerTurnTransition,
  ]);

  // Jadwalkan maju giliran (semua jalur otomatis lewat sini): jadwal baru
  // menggantikan yang lama, dan saat jatuh tempo bisa dilewati bila ada modal
  // yang baru terbuka — tick auto-action berikutnya yang akan menanganinya.
  const scheduleTurnAdvance = useCallback(
    (delayMs: number, skipIfModalOpen: boolean = false) => {
      pendingTurnAdvanceTimersRef.current.forEach((timer) =>
        clearTimeout(timer)
      );
      pendingTurnAdvanceTimersRef.current.clear();
      const timer = setTimeout(() => {
        pendingTurnAdvanceTimersRef.current.delete(timer);
        if (skipIfModalOpen && modalFlowBusyRef.current) return;
        handleNextTurn();
      }, delayMs);
      pendingTurnAdvanceTimersRef.current.add(timer);
    },
    [handleNextTurn]
  );

  // Evaluate effect of landing on a tile
  const evaluateTileLanding = useCallback(
    (
      tileId: number,
      playerIndex: number,
      rolledDoubles: boolean,
      passedOrLandedStart: boolean,
      currentPlayers: Player[]
    ) => {
      const tile = BOARD_TILES.find((t) => t.id === tileId);
      const player = currentPlayers[playerIndex];
      if (!tile || !player) return;

      const playerOwnedCount = Object.values(properties).filter(
        (pr) => pr.ownerId === player.id && !pr.isSeizedByState
      ).length;

      let triggerModalSavesDoubles = false;

      switch (tile.type) {
        case 'START': {
          const salary = getStartSalaryForPlayer(player);
          soundFX.playCashIn();
          addLog(
            `🎉 ${player.name} berhenti di START (#0)! Gaji +${formatRupiah(
              salary
            )} & +1 Kuota Upgrade Bangunan.`,
            'gain'
          );
          if (playerOwnedCount > 0) {
            setStartUpgradeBanner(true);
            setShowBuyUpgradeModal(true);
            triggerModalSavesDoubles = true;
          }
          break;
        }

        case 'PROPERTY': {
          const prop = properties[tile.id];
          if (prop && prop.isSeizedByState) {
            const rent = calculatePropertyRent(tile, prop.level);
            const cashbackCard = player.savedCards.find(
              (c) => c.key === 'CASHBACK_99'
            );
            if (player.cashbackArmed || cashbackCard) {
              soundFX.playCashIn();
              setPlayers((prev) =>
                prev.map((p, idx) =>
                  idx === playerIndex
                    ? {
                        ...p,
                        cashbackArmed: false,
                        savedCards: cashbackCard
                          ? p.savedCards.filter((c) => c.id !== cashbackCard.id)
                          : p.savedCards,
                      }
                    : p
                )
              );
              addLog(
                `💸 CASHBACK 99% AKTIF! Sewa Tanah Sitaan Negara di ${
                  tile.name
                } (${formatRupiah(rent)}) menjadi Rp0 (Gratis)!`,
                'gain'
              );
              showQuickBanner(
                `💸 Cashback 99%! Sewa ${tile.name} jadi Rp0 (Gratis)!`
              );
            } else {
              soundFX.playPenalty();
              chargePlayerOrTriggerCrisis(
                playerIndex,
                rent,
                `Sewa Sitaan Negara ${tile.name}`,
                null
              );
              addLog(
                `🚨 ${player.name} mendarat di Tanah SITAAN NEGARA (${
                  tile.name
                })! Wajib bayar sewa ${formatRupiah(rent)} ke Kas Negara.`,
                'penalty'
              );
            }
          } else if (!prop || prop.ownerId === null) {
            addLog(
              `🏠 ${player.name} mendarat di tanah kosong ${
                tile.name
              } (${formatRupiah(tile.price ?? 0)}). Pop-up Beli Tanah dibuka!`,
              'info'
            );
            setStartUpgradeBanner(passedOrLandedStart && playerOwnedCount > 0);
            setShowBuyUpgradeModal(true);
            triggerModalSavesDoubles = true;
          } else if (prop.ownerId === player.id) {
            addLog(
              `🏡 ${player.name} mampir di tanah sendiri: ${tile.name} (${
                BUILDING_NAMES[prop.level]
              }).`,
              'info'
            );
            if (passedOrLandedStart) {
              setStartUpgradeBanner(true);
              setShowBuyUpgradeModal(true);
              triggerModalSavesDoubles = true;
            }
          } else {
            const owner = currentPlayers.find((p) => p.id === prop.ownerId);
            if (owner) {
              const rent = calculatePropertyRent(tile, prop.level);
              const recipient = resolveRentRecipient(owner);

              const cashbackCard = player.savedCards.find(
                (c) => c.key === 'CASHBACK_99'
              );
              if (player.cashbackArmed || cashbackCard) {
                soundFX.playCashIn();
                setPlayers((prev) =>
                  prev.map((p, idx) =>
                    idx === playerIndex
                      ? {
                          ...p,
                          cashbackArmed: false,
                          savedCards: cashbackCard
                            ? p.savedCards.filter(
                                (c) => c.id !== cashbackCard.id
                              )
                            : p.savedCards,
                        }
                      : p
                  )
                );
                addLog(
                  `💸 CASHBACK 99% AKTIF! ${player.name} bebas biaya sewa ${formatRupiah(
                    rent
                  )} di ${tile.name} (Jadi Rp0 Gratis)!`,
                  'gain'
                );
                showQuickBanner(
                  `💸 Cashback 99%! Sewa ${tile.name} jadi Rp0 (Gratis)!`
                );
              } else if (recipient === 'NEGARA') {
                soundFX.playPenalty();
                chargePlayerOrTriggerCrisis(
                  playerIndex,
                  rent,
                  `Sewa ${tile.name} (Disita Negara)`,
                  null
                );
                addLog(
                  `⚖️ ${player.name} bayar sewa ${tile.name} ${formatRupiah(
                    rent
                  )} ke KAS NEGARA (karena pemiliknya ${
                    owner.name
                  } sedang di Lapas Biasa)!`,
                  'penalty'
                );
              } else {
                soundFX.playPenalty();
                chargePlayerOrTriggerCrisis(
                  playerIndex,
                  rent,
                  `Sewa ${tile.name} ke ${owner.name}`,
                  owner.id
                );
                addLog(
                  `💸 ${player.name} bayar sewa ${tile.name} (${
                    BUILDING_NAMES[prop.level]
                  }) sebesar ${formatRupiah(rent)} ke ${owner.name}!`,
                  'penalty'
                );
              }
            }
          }
          break;
        }

        case 'TAX': {
          const { ownedCount, taxAmount } = calculateLandTax(
            player.id,
            properties
          );
          if (taxAmount === 0) {
            addLog(
              `🧾 ${player.name} mendarat di ${tile.name}, tapi belum punya tanah. Bebas pajak (Rp0)!`,
              'info'
            );
          } else {
            soundFX.playPenalty();
            chargePlayerOrTriggerCrisis(
              playerIndex,
              taxAmount,
              tile.name,
              null
            );
            addLog(
              `🧾 ${player.name} kena ${tile.name} sebesar ${formatRupiah(
                taxAmount
              )} (${ownedCount} tanah × Rp500 Rb) ke Kas Negara!`,
              'penalty'
            );
            showQuickBanner(
              `🧾 ${tile.name}: -${formatRupiah(
                taxAmount
              )} (${ownedCount} tanah) ke Kas Negara!`
            );
          }
          break;
        }

        case 'TILANG': {
          const fine = 500_000;
          soundFX.playPenalty();
          chargePlayerOrTriggerCrisis(playerIndex, fine, tile.name, null);
          addLog(
            `🚓 ${player.name} kena ${tile.name}! Dipotong Rp500 Rb ke Kas Negara.`,
            'penalty'
          );
          showQuickBanner(`🚓 Kena ${tile.name}! Tagihan Rp500 Rb.`);
          break;
        }

        case 'PUNGLI': {
          const { ownsBandung, fee } = calculatePungliFee(
            player.id,
            properties
          );
          if (ownsBandung) {
            soundFX.playCashIn();
            addLog(
              `😎 ${player.name} mendarat di Parkiran Pungli (#20): Bebas Pungli karena penguasa Bandung!`,
              'gain'
            );
            showQuickBanner('😎 Bebas Pungli karena penguasa Bandung!');
          } else {
            soundFX.playPenalty();
            chargePlayerOrTriggerCrisis(
              playerIndex,
              fee,
              'Parkiran Pungli',
              null
            );
            addLog(
              `🚧 ${player.name} kena Parkiran Pungli (#20)! Tagihan Rp1 Jt ke Negara (belum punya Bandung #19).`,
              'penalty'
            );
            showQuickBanner(
              '🚧 Parkiran Pungli! Tagihan Rp1 Jt (Gratis jika punya Bandung #19).'
            );
          }
          break;
        }

        case 'TOLL': {
          const tollFee = 500_000;
          if (player.diskonTolArmed) {
            soundFX.playCashIn();
            setTollFeeRefunded(true);
            setPlayers((prev) =>
              prev.map((p, idx) =>
                idx === playerIndex ? { ...p, diskonTolArmed: false } : p
              )
            );
            addLog(
              `🎫 ${player.name} masuk ${tile.name} dengan Kartu Diskon Tol (Bebas biaya Rp500 Rb) & wajib pilih tol tujuan!`,
              'gain'
            );
          } else {
            soundFX.playPenalty();
            setTollFeeRefunded(false);
            chargePlayerOrTriggerCrisis(playerIndex, tollFee, tile.name, null);
            addLog(
              `🛣️ ${player.name} masuk ${tile.name} (Tarif Rp500 Rb) & wajib pilih Gerbang Tol tujuan pindah!`,
              'info'
            );
          }
          triggerModalSavesDoubles = true;
          setShowTollModal(true);
          break;
        }

        case 'JAIL': {
          soundFX.playSiren();
          setPlayers((prev) =>
            prev.map((p, idx) =>
              idx === playerIndex ? { ...p, status: 'DI_LAPAS' } : p
            )
          );
          addLog(
            `⛓️ ${player.name} masuk LAPAS (#10)! Selama di Lapas biasa, uang sewa tanahnya masuk ke Kas Negara.`,
            'penalty'
          );
          showQuickBanner(
            `⛓️ ${player.name} masuk Lapas! Sewa tanahnya disita Negara kecuali pindah ke Sel Premium.`
          );
          break;
        }

        case 'COURT': {
          addLog(
            `⚖️ ${player.name} mendarat di PENGADILAN (#30 Meja Hijau)! Wajib lempar dadu vonis hakim.`,
            'penalty'
          );
          triggerModalSavesDoubles = true;
          setCourtDiceResult(null);
          setShowCourtModal(true);
          break;
        }

        case 'TAKDIR': {
          addLog(
            `📘 ${player.name} mendarat di petak TAKDIR! Mengambil Kartu Biru dari tumpukan...`,
            'card'
          );
          triggerModalSavesDoubles = true;
          drawFateCard('TAKDIR', false);
          break;
        }

        case 'MUSIBAH': {
          soundFX.playSiren();
          addLog(
            `📕 ${player.name} mendarat di petak MUSIBAH! Mengambil Kartu Merah dari tumpukan...`,
            'card'
          );
          triggerModalSavesDoubles = true;
          drawFateCard('MUSIBAH', false);
          break;
        }

        default:
          break;
      }

      if (
        passedOrLandedStart &&
        playerOwnedCount > 0 &&
        !triggerModalSavesDoubles &&
        tile.type !== 'PROPERTY' &&
        tile.type !== 'START'
      ) {
        setStartUpgradeBanner(true);
        setShowBuyUpgradeModal(true);
        triggerModalSavesDoubles = true;
      }

      if (rolledDoubles) {
        if (triggerModalSavesDoubles) {
          setPendingDoublesTakdir(true);
        } else {
          setTimeout(() => {
            addLog(
              `🎲🎲 Efek Dadu Kembar: ${player.name} TIDAK jalan lagi, tapi wajib ambil Kartu TAKDIR!`,
              'card'
            );
            drawFateCard('TAKDIR', true);
          }, 350);
        }
      }

      if (!triggerModalSavesDoubles && !rolledDoubles) {
        setTurnPhase('TURN_ENDED');
      }
    },
    [
      addLog,
      drawFateCard,
      properties,
      chargePlayerOrTriggerCrisis,
      showQuickBanner,
    ]
  );

  /**
   * Moves the active player's 3D standee pawn step-by-step along the board after dice are finalized.
   */
  const executePawnHopMovement = useCallback(
    (
      finalD1: number,
      finalD2: number,
      finalD3: number | null,
      khodamBonusSteps: number,
      forceFreedFromJail: boolean
    ) => {
      const currentPlayer = players[activePlayerIndex];
      if (!currentPlayer) return;

      setAwaitingDukunConfirm(false);
      setHasRolledThisTurn(true);
      const isDoubles = finalD1 === finalD2;
      const totalSteps =
        finalD1 + finalD2 + (finalD3 ?? 0) + khodamBonusSteps;

      const moveResult = calculateMovement(
        currentPlayer.position,
        totalSteps,
        currentPlayer.wantimpresActive
      );

      setIsMoving(true);
      setDiceQuip(
        `${currentPlayer.name} melangkah ${totalSteps} petak (${finalD1} + ${finalD2}${
          finalD3 !== null ? ` + ${finalD3}` : ''
        }${khodamBonusSteps > 0 ? ` +${khodamBonusSteps} Khodam` : ''})${
          isDoubles ? ' · DADU KEMBAR!' : ''
        }`
      );

      let stepIdx = 0;
      const hopInterval = setInterval(() => {
        const nextTileId = moveResult.path[stepIdx];
        soundFX.playHop(stepIdx);

        setPlayers((prev) => {
          const nextPlayers = prev.map((p, idx) => {
            if (idx !== activePlayerIndex) return p;
            const hitStart = nextTileId === 0;
            const salary = getStartSalaryForPlayer(p);
            const newPassCount = hitStart
              ? p.startPassCount + 1
              : p.startPassCount;
            return {
              ...p,
              status: forceFreedFromJail ? 'NORMAL' : p.status,
              position: nextTileId,
              lastPerimeterPosition: nextTileId,
              money: hitStart ? p.money + salary : p.money,
              earnedIncome: hitStart
                ? p.earnedIncome + salary
                : p.earnedIncome,
              upgradeTokens: hitStart ? p.upgradeTokens + 1 : p.upgradeTokens,
              startPassCount: newPassCount,
              khodamBoost: false,
              pewarisBoost: false,
            };
          });

          if (!isExtremeMusibahActive && checkExtremeEscalation(nextPlayers)) {
            setIsExtremeMusibahActive(true);
            setMusibahDeck(
              shuffleDeck([...MUSIBAH_CARDS, ...EXTREME_MUSIBAH_CARDS])
            );
            addLog(
              '🔥 ESKALASI NEGARA! Semua pemain telah melewati START minimal 2 kali — MUSIBAH EKSTREM AKTIF!',
              'penalty'
            );
            showQuickBanner(
              '🔥 ESKALASI NEGARA: MUSIBAH EKSTREM AKTIF! Denda 2x lipat & sita aset masuk ke dek!'
            );
          }

          return nextPlayers;
        });

        if (nextTileId === 0 && stepIdx < moveResult.path.length - 1) {
          const salary = getStartSalaryForPlayer(currentPlayer);
          soundFX.playCashIn();
          addLog(
            `💵 ${currentPlayer.name} melewati START (#0)! Gajian +${formatRupiah(
              salary
            )}${
              currentPlayer.wantimpresActive ? ' (Kartu Wantimpres 🏛️)' : ''
            } & +1 Kuota Upgrade Bangunan.`,
            'gain'
          );
          showQuickBanner(
            `💵 Lewat START! ${currentPlayer.name} dapat Gaji +${formatRupiah(
              salary
            )} & +1 Kuota Upgrade!`
          );
        }

        stepIdx += 1;
        if (stepIdx >= moveResult.path.length) {
          clearInterval(hopInterval);
          setIsMoving(false);
          // Tetap kunci hasRolledThisTurn = true & rollLockRef.current = true, ubah fase ke RESOLVING_TILE
          setTurnPhase('RESOLVING_TILE');
          setIsLandingPause(true);
          setJustLandedTileId(moveResult.newPosition);

          const landedTileObj = BOARD_TILES.find(
            (t) => t.id === moveResult.newPosition
          );
          setDiceQuip(
            `📍 ${currentPlayer.name} mendarat di Petak #${
              moveResult.newPosition
            } ${landedTileObj?.name || ''}!`
          );

          // Jeda ~900ms saat pion mendarat (dengan efek highlight petak) sebelum membuka Modal/Pop-up efek petak!
          if (landingPauseTimerRef.current) {
            clearTimeout(landingPauseTimerRef.current);
          }
          landingPauseTimerRef.current = window.setTimeout(() => {
            landingPauseTimerRef.current = null;
            setIsLandingPause(false);

            setPlayers((latestPlayers) => {
              evaluateTileLanding(
                moveResult.newPosition,
                activePlayerIndex,
                isDoubles,
                moveResult.passedOrLandedStart,
                latestPlayers
              );
              return latestPlayers;
            });

            window.setTimeout(() => {
              setJustLandedTileId((prev) =>
                prev === moveResult.newPosition ? null : prev
              );
            }, 600);
          }, 900);
        }
      }, 115);
    },
    [
      players,
      activePlayerIndex,
      isExtremeMusibahActive,
      addLog,
      showQuickBanner,
      evaluateTileLanding,
    ]
  );

  // Execute a dice roll (with optional Khodam +2 or Pewaris 3-dice)
  const executeNormalRollAndMove = useCallback(
    (
      forceFreedFromJail: boolean = false,
      useKhodamNow: boolean = false
    ) => {
      if (isRolling || isMoving || screen !== 'GAME' || gameState !== 'playing')
        return;
      const currentPlayer = players[activePlayerIndex];
      if (!currentPlayer) return;

      // Pastikan kunci mutlak aktif selama proses lempar dadu
      rollLockRef.current = true;
      setHasRolledThisTurn(true);
      setTurnPhase('ROLLING');

      const khodamCard = currentPlayer.savedCards.find(
        (c) => c.key === 'KHODAM'
      );
      const willApplyKhodam = Boolean(
        currentPlayer.khodamBoost || (useKhodamNow && khodamCard)
      );
      const bonusSteps = willApplyKhodam ? 2 : 0;
      setKhodamAppliedOnRoll(bonusSteps);

      if (useKhodamNow && khodamCard) {
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === activePlayerIndex
              ? {
                  ...p,
                  khodamBoost: false,
                  savedCards: p.savedCards.filter(
                    (c) => c.id !== khodamCard.id
                  ),
                }
              : p
          )
        );
        addLog(
          `✨ ${currentPlayer.name} menggunakan Lempar + Khodam! Total lemparan dadu ditambah +2 langkah.`,
          'gain'
        );
      }

      const useThreeDice = currentPlayer.pewarisBoost;
      setIsRolling(true);
      setAwaitingDukunConfirm(false);
      soundFX.playDiceShake();
      setDiceQuip(DICE_QUIPS[Math.floor(Math.random() * DICE_QUIPS.length)]);

      let ticks = 0;
      const rollInterval = setInterval(() => {
        ticks += 1;
        setDice([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]);
        if (useThreeDice) {
          setExtraDie(Math.floor(Math.random() * 6) + 1);
        }

        if (ticks >= 7) {
          clearInterval(rollInterval);
          const d1 = Math.floor(Math.random() * 6) + 1;
          const d2 = Math.floor(Math.random() * 6) + 1;
          const d3 = useThreeDice ? Math.floor(Math.random() * 6) + 1 : null;

          setDice([d1, d2]);
          setExtraDie(d3);
          setIsRolling(false);

          executePawnHopMovement(
            d1,
            d2,
            d3,
            bonusSteps,
            forceFreedFromJail
          );
        }
      }, 65);
    },
    [
      isRolling,
      isMoving,
      screen,
      gameState,
      players,
      activePlayerIndex,
      addLog,
      executePawnHopMovement,
    ]
  );

  // Main "LEMPAR DADU" button handler with strict 1x-per-turn guard
  const handleRollDice = useCallback(
    (withKhodam: boolean = false) => {
      if (
        hasRolledThisTurn ||
        rollLockRef.current ||
        turnPhase !== 'READY_TO_ROLL' ||
        isRolling ||
        isMoving ||
        screen !== 'GAME' ||
        gameState !== 'playing' ||
        turnControlsLocked
      ) {
        return;
      }
      const currentPlayer = players[activePlayerIndex];
      if (!currentPlayer) return;

      // Jika pemain langsung menekan Lempar Dadu saat transisi giliran masih tampil, tutup transisi seketika
      dismissTurnTransition();

      if (currentPlayer.status === 'DI_BEKASI') {
        rollLockRef.current = true;
        setHasRolledThisTurn(true);
        setTurnPhase('TURN_ENDED');
        addLog(
          `🛸 ${currentPlayer.name} masih di Planet Bekasi (Skip 1 giliran) dan kini kembali ke Bumi!`,
          'bekasi'
        );
        handleNextTurn();
        return;
      }

      if (currentPlayer.status === 'DI_LAPAS') {
        setShowJailModal(true);
        return;
      }

      if (currentPlayer.status === 'SEL_PREMIUM') {
        setShowPremiumCellModal(true);
        return;
      }

      // Begitu tombol "LEMPAR DADU" diklik pertama kali, LANGSUNG kunci mutlak:
      rollLockRef.current = true;
      setHasRolledThisTurn(true);
      setTurnPhase('ROLLING');

      executeNormalRollAndMove(false, withKhodam);
    },
    [
      hasRolledThisTurn,
      turnPhase,
      isRolling,
      isMoving,
      screen,
      gameState,
      turnControlsLocked,
      players,
      activePlayerIndex,
      addLog,
      handleNextTurn,
      executeNormalRollAndMove,
    ]
  );

  // --- FASE 2 & 3: LAPAS (#10) 4 OPTIONS HANDLERS ---
  const handleJailTryDoubles = () => {
    if (
      hasRolledThisTurn ||
      rollLockRef.current ||
      turnPhase !== 'READY_TO_ROLL' ||
      isRolling
    ) {
      return;
    }
    rollLockRef.current = true;
    setHasRolledThisTurn(true);
    setTurnPhase('ROLLING');

    setShowJailModal(false);
    setIsRolling(true);
    soundFX.playDiceShake();

    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDice([d1, d2]);
      setIsRolling(false);

      if (d1 === d2) {
        soundFX.playCashIn();
        addLog(
          `🔓 DADU KEMBAR (${d1}-${d2})! ${activePlayer.name} bebas dari Lapas dan langsung jalan!`,
          'gain'
        );
        showQuickBanner(
          `🔓 Dadu Kembar ${d1}-${d2}! ${activePlayer.name} bebas dari Lapas!`
        );
        executePawnHopMovement(d1, d2, null, 0, true);
      } else {
        setTurnPhase('TURN_ENDED');
        soundFX.playPenalty();
        addLog(
          `🔒 Dadu ${d1}-${d2} (Bukan Kembar). ${activePlayer.name} gagal keluar dari Lapas & giliran selesai!`,
          'penalty'
        );
        showQuickBanner(
          `🔒 Gagal Dadu Kembar (${d1}-${d2}). Tetap di Lapas & giliran selesai!`
        );
        scheduleTurnAdvance(900);
      }
    }, 550);
  };

  const handleJailPayFine = () => {
    if (
      hasRolledThisTurn ||
      rollLockRef.current ||
      turnPhase !== 'READY_TO_ROLL' ||
      isRolling
    ) {
      return;
    }
    const fine = 500_000;
    if (activePlayer.money < fine) return;

    rollLockRef.current = true;
    setHasRolledThisTurn(true);
    setTurnPhase('ROLLING');

    setShowJailModal(false);
    soundFX.playCashIn();
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === activePlayerIndex
          ? { ...p, money: p.money - fine, status: 'NORMAL' }
          : p
      )
    );
    setStateTreasury((t) => t + fine);
    addLog(
      `🔓 ${activePlayer.name} bayar denda Lapas Rp500 Rb ke Kas Negara, bebas, dan langsung melempar dadu!`,
      'gain'
    );
    setTimeout(() => {
      executeNormalRollAndMove(true, false);
    }, 250);
  };

  const handleJailUseOrdal = () => {
    if (
      hasRolledThisTurn ||
      rollLockRef.current ||
      turnPhase !== 'READY_TO_ROLL' ||
      isRolling
    ) {
      return;
    }
    const ordalCard = activePlayer.savedCards.find(
      (c) => c.key === 'ORANG_DALAM'
    );
    if (!ordalCard) return;

    rollLockRef.current = true;
    setHasRolledThisTurn(true);
    setTurnPhase('ROLLING');

    setShowJailModal(false);
    soundFX.playCashIn();
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === activePlayerIndex
          ? {
              ...p,
              status: 'NORMAL',
              savedCards: p.savedCards.filter((c) => c.id !== ordalCard.id),
            }
          : p
      )
    );
    addLog(
      `🕴️ ${activePlayer.name} pakai Kartu Orang Dalam untuk bebas dari Lapas gratis & langsung melempar dadu!`,
      'gain'
    );
    setTimeout(() => {
      executeNormalRollAndMove(true, false);
    }, 250);
  };

  const handleJailBuyPremiumCell = () => {
    setShowJailModal(false);
    soundFX.playCashIn();
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === activePlayerIndex
          ? {
              ...p,
              status: 'SEL_PREMIUM',
              premiumTurnsLeft: 3,
            }
          : p
      )
    );
    addLog(
      `👑 ${activePlayer.name} upgrade ke SEL PREMIUM selama 3 giliran! Uang sewa tanah tetap masuk ke kantong pribadi & bebas belanja tanah kosong/Sitaan Negara!`,
      'gain'
    );
    showQuickBanner(
      `👑 ${activePlayer.name} pindah ke Sel Premium (3 Giliran)!`
    );
    setTimeout(() => {
      setShowPremiumCellModal(true);
    }, 250);
  };

  // --- SEL PREMIUM HANDLERS ---
  const handlePremiumBuyAnyProperty = (tileId: number) => {
    const tile = BOARD_TILES.find((t) => t.id === tileId);
    const prop = properties[tileId];
    if (!tile || !prop) return;
    if (prop.ownerId !== null && !prop.isSeizedByState) return;
    const price = tile.price ?? 1_000_000;
    if (activePlayer.money < price) return;

    const wasSeized = Boolean(prop.isSeizedByState);
    soundFX.playBuild();
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === activePlayerIndex ? { ...p, money: p.money - price } : p
      )
    );
    if (wasSeized) {
      setStateTreasury((t) => t + price);
    }
    setProperties((prev) => ({
      ...prev,
      [tileId]: {
        ...prev[tileId],
        ownerId: activePlayer.id,
        isSeizedByState: false,
      },
    }));

    addLog(
      `👑 [SEL PREMIUM] ${activePlayer.name} mengakuisisi ${
        wasSeized ? 'Tanah SITAAN NEGARA' : 'Tanah Kosong'
      } #${tile.id} ${tile.name} dari balik Sel Mewah seharga ${formatRupiah(
        price
      )}!`,
      'gain'
    );
    showQuickBanner(`👑 Akuisisi ${tile.name} dari Sel Premium berhasil!`);
  };

  const handlePremiumStayInCell = () => {
    setShowPremiumCellModal(false);
    const remaining = Math.max(0, activePlayer.premiumTurnsLeft - 1);

    setPlayers((prev) =>
      prev.map((p, idx) => {
        if (idx !== activePlayerIndex) return p;
        if (remaining <= 0) {
          return {
            ...p,
            status: 'NORMAL',
            premiumTurnsLeft: 0,
          };
        }
        return {
          ...p,
          premiumTurnsLeft: remaining,
        };
      })
    );

    if (remaining <= 0) {
      addLog(
        `👑 Masa kontrak 3 giliran Sel Premium ${activePlayer.name} selesai! Kini bebas kembali berstatus Normal.`,
        'info'
      );
      showQuickBanner(
        `🔓 Masa Sel Premium ${activePlayer.name} selesai & bebas!`
      );
    } else {
      addLog(
        `🍷 ${activePlayer.name} bersantai di Sel Premium (Sisa ${remaining} giliran). Sewa tanah tetap masuk ke kantong pribadi!`,
        'info'
      );
    }

    scheduleTurnAdvance(350);
  };

  // --- FASE 3: KARTU TAKDIR & MUSIBAH (TERMASUK KARTU BERDADU & DOA ORTU) ---
  const handleRollFateCardDice = () => {
    soundFX.playDiceShake();
    const rolled = Math.floor(Math.random() * 6) + 1;
    setFateDiceResult(rolled);
  };

  const handleCancelFateCardWithDoa = () => {
    if (!activeFateCard) return;
    const doaCard = activePlayer.savedCards.find((c) => c.key === 'DOA_ORTU');
    soundFX.playCashIn();

    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === activePlayerIndex
          ? {
              ...p,
              shieldedByDoa: false,
              savedCards: doaCard
                ? p.savedCards.filter((c) => c.id !== doaCard.id)
                : p.savedCards,
            }
          : p
      )
    );

    addLog(
      `🙏 DOA ORANG TUA TERKABUL! ${activePlayer.name} membatalkan kartu "${activeFateCard.card.title}" tanpa terkena efek apa pun!`,
      'gain'
    );
    showQuickBanner(
      `🙏 Doa Orang Tua membatalkan kartu "${activeFateCard.card.title}"!`
    );
    setActiveFateCard(null);
    setFateDiceResult(null);

    if (pendingDoublesTakdir) {
      setPendingDoublesTakdir(false);
      setTimeout(() => {
        drawFateCard('TAKDIR', true);
      }, 300);
    }
  };

  const handleConfirmFateCard = () => {
    if (!activeFateCard) return;
    const { card } = activeFateCard;
    const diceVal = fateDiceResult ?? Math.floor(Math.random() * 6) + 1;

    setActiveFateCard(null);
    setFateDiceResult(null);

    if (card.effectType === 'GAIN_MONEY' && card.amount) {
      soundFX.playCashIn();
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === activePlayerIndex
            ? {
                ...p,
                money: p.money + (card.amount ?? 0),
                earnedIncome: p.earnedIncome + (card.amount ?? 0),
              }
            : p
        )
      );
      addLog(
        `✨ ${activePlayer.name} menerima +${formatRupiah(
          card.amount
        )} dari kartu "${card.title}"!`,
        'gain'
      );
    } else if (card.effectType === 'GAIN_MONEY_DICE') {
      const gained = (card.diceMultiplier ?? 500_000) * diceVal;
      soundFX.playCashIn();
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === activePlayerIndex
            ? {
                ...p,
                money: p.money + gained,
                earnedIncome: p.earnedIncome + gained,
              }
            : p
        )
      );
      addLog(
        `🎲💵 [Dadu Kartu: ${diceVal}] ${activePlayer.name} menerima Bansos +${formatRupiah(
          gained
        )} dari Negara!`,
        'gain'
      );
      showQuickBanner(
        `🎲 Dadu ${diceVal}: Dapat +${formatRupiah(gained)} dari Negara!`
      );
    } else if (card.effectType === 'LOSE_MONEY' && card.amount) {
      soundFX.playPenalty();
      chargePlayerOrTriggerCrisis(
        activePlayerIndex,
        card.amount,
        card.title,
        null
      );
      addLog(
        `💸 ${activePlayer.name} terkena "${card.title}" sebesar -${formatRupiah(
          card.amount
        )} ke Kas Negara!`,
        'penalty'
      );
    } else if (card.effectType === 'LOSE_MONEY_DICE') {
      const penalty = (card.diceMultiplier ?? 300_000) * diceVal;
      soundFX.playPenalty();
      chargePlayerOrTriggerCrisis(
        activePlayerIndex,
        penalty,
        `${card.title} (Dadu ${diceVal})`,
        null
      );
      addLog(
        `🎲🚨 [Dadu Kartu: ${diceVal}] ${activePlayer.name} wajib bayar denda -${formatRupiah(
          penalty
        )} ke Kas Negara!`,
        'penalty'
      );
      showQuickBanner(
        `🎲 Dadu ${diceVal}: Denda -${formatRupiah(penalty)} ke Kas Negara!`
      );
    } else if (card.effectType === 'SEIZE_RANDOM_PROPERTY') {
      const ownedProps = Object.values(properties).filter(
        (pr) => pr.ownerId === activePlayer.id && !pr.isSeizedByState
      );
      soundFX.playPenalty();
      if (ownedProps.length > 0) {
        const pickedProp =
          ownedProps[Math.floor(Math.random() * ownedProps.length)];
        const tile = BOARD_TILES.find((t) => t.id === pickedProp.tileId);
        setProperties((prev) => ({
          ...prev,
          [pickedProp.tileId]: {
            ...prev[pickedProp.tileId],
            ownerId: null,
            isSeizedByState: true,
          },
        }));
        addLog(
          `🚨 PROYEK STRATEGIS NEGARA! Tanah #${pickedProp.tileId} ${
            tile?.name ?? ''
          } milik ${activePlayer.name} resmi DISITA NEGARA!`,
          'penalty'
        );
        showQuickBanner(
          `🚨 Tanah ${tile?.name} milik ${activePlayer.name} disita Negara!`
        );
      } else {
        chargePlayerOrTriggerCrisis(
          activePlayerIndex,
          500_000,
          card.title,
          null
        );
        addLog(
          `🚨 ${activePlayer.name} kena "${card.title}", karena belum punya tanah dikenakan biaya administrasi Rp500 Rb!`,
          'penalty'
        );
      }
    } else if (card.effectType === 'GOTO_BEKASI') {
      soundFX.playSiren();
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === activePlayerIndex
            ? {
                ...p,
                lastPerimeterPosition:
                  p.position < PERIMETER_TILE_COUNT
                    ? p.position
                    : p.lastPerimeterPosition,
                position: BEKASI_TILE_ID,
                status: 'DI_BEKASI',
                skipTurns: 1,
              }
            : p
        )
      );
      addLog(
        `🚀 DIGORENG NETIZEN! ${activePlayer.name} terlempar ke tengah papan: PLANET BEKASI (#40 · Skip 1 Giliran)!`,
        'bekasi'
      );
      showQuickBanner(
        `🚀 ${activePlayer.name} Digoreng Netizen & terlempar ke Planet Bekasi (#40)!`
      );
    } else if (card.effectType === 'GOTO_LAPAS') {
      soundFX.playSiren();
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === activePlayerIndex
            ? {
                ...p,
                position: LAPAS_TILE_ID,
                lastPerimeterPosition: LAPAS_TILE_ID,
                status: 'DI_LAPAS',
              }
            : p
        )
      );
      addLog(
        `🚓 ${activePlayer.name} diangkut ke LAPAS (#10) akibat kartu "${card.title}"!`,
        'penalty'
      );
    } else if (card.effectType === 'GOTO_START') {
      const salary = getStartSalaryForPlayer(activePlayer);
      soundFX.playCashIn();
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === activePlayerIndex
            ? {
                ...p,
                position: 0,
                lastPerimeterPosition: 0,
                money: p.money + salary,
                earnedIncome: p.earnedIncome + salary,
                upgradeTokens: p.upgradeTokens + 1,
                startPassCount: p.startPassCount + 1,
              }
            : p
        )
      );
      addLog(
        `🚁 ${activePlayer.name} meluncur ke START (#0)! Gajian +${formatRupiah(
          salary
        )} & +1 Kuota Upgrade.`,
        'gain'
      );
    } else if (card.effectType === 'GOTO_COURT') {
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === activePlayerIndex
            ? {
                ...p,
                position: COURT_TILE_ID,
                lastPerimeterPosition: COURT_TILE_ID,
              }
            : p
        )
      );
      setCourtDiceResult(null);
      setShowCourtModal(true);
      return;
    } else if (card.effectType === 'GET_SAVED_CARD' && card.savedCardKey) {
      const template = ALL_SAVED_CARDS.find((c) => c.key === card.savedCardKey);
      if (template) {
        soundFX.playCashIn();
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === activePlayerIndex
              ? {
                  ...p,
                  savedCards: [
                    ...p.savedCards,
                    cloneSavedCard(template, `${Date.now()}`),
                  ],
                }
              : p
          )
        );
        addLog(
          `🃏 ${activePlayer.name} mendapat Kartu Simpanan baru: ${template.emoji} ${template.name}!`,
          'gain'
        );
      }
    }

    if (pendingDoublesTakdir) {
      setPendingDoublesTakdir(false);
      setTimeout(() => {
        drawFateCard('TAKDIR', true);
      }, 300);
    }
  };

  // --- GERBANG TOL + KARTU DISKON TOL ---
  const handleUseDiskonTolInModal = () => {
    const diskonCard = activePlayer.savedCards.find(
      (c) => c.key === 'DISKON_TOL'
    );
    soundFX.playCashIn();
    setTollFeeRefunded(true);

    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === activePlayerIndex
          ? {
              ...p,
              money: p.money + 500_000,
              diskonTolArmed: false,
              savedCards: diskonCard
                ? p.savedCards.filter((c) => c.id !== diskonCard.id)
                : p.savedCards,
            }
          : p
      )
    );
    setStateTreasury((t) => Math.max(0, t - 500_000));
    addLog(
      `🎫 ${activePlayer.name} memakai Kartu Diskon Tol! Biaya Rp500 Rb dibebaskan (Gratis).`,
      'gain'
    );
    showQuickBanner('🎫 Diskon Tol Aktif! Bebas biaya Rp500 Rb.');
  };

  const handleSelectTollDestination = (targetTollTileId: number) => {
    const targetTile = BOARD_TILES.find((t) => t.id === targetTollTileId);
    setShowTollModal(false);
    setTollFeeRefunded(false);
    soundFX.playHop(2);
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === activePlayerIndex
          ? {
              ...p,
              position: targetTollTileId,
              lastPerimeterPosition: targetTollTileId,
            }
          : p
      )
    );
    addLog(
      `🛣️ ${activePlayer.name} pindah lewat jalan tol ke #${targetTollTileId} ${
        targetTile?.name ?? 'Gerbang Tol'
      } (Tanpa gaji START). Giliran selesai!`,
      'info'
    );
    showQuickBanner(
      `🛣️ Pindah ke ${targetTile?.name} tanpa gaji START. Giliran selesai!`
    );

    if (pendingDoublesTakdir) {
      setPendingDoublesTakdir(false);
      setTimeout(() => {
        drawFateCard('TAKDIR', true);
      }, 300);
    } else {
      // Bila ternyata kartu Doubles menarik kartu Takdir baru (ref masih basi),
      // jadwal dilewati dan tick auto-action berikutnya yang menanganinya.
      scheduleTurnAdvance(650, true);
    }
  };

  // --- PENGADILAN (#30 MEJA HIJAU) ---
  const handleRollCourtDice = () => {
    soundFX.playDiceShake();
    const roll = Math.floor(Math.random() * 6) + 1;
    setCourtDiceResult(roll);
  };

  const handleConfirmCourtVerdict = () => {
    if (courtDiceResult === null) return;
    const verdict = resolveCourtVerdict(courtDiceResult, activePlayer.money);
    setShowCourtModal(false);
    setCourtDiceResult(null);

    if (verdict.moneyDelta > 0) {
      soundFX.playCashIn();
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === activePlayerIndex
            ? {
                ...p,
                money: p.money + verdict.moneyDelta,
                earnedIncome: p.earnedIncome + verdict.moneyDelta,
              }
            : p
        )
      );
    } else {
      const penaltyAbs = Math.abs(verdict.moneyDelta);
      if (verdict.sendToJail) {
        soundFX.playSiren();
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === activePlayerIndex
              ? {
                  ...p,
                  position: LAPAS_TILE_ID,
                  lastPerimeterPosition: LAPAS_TILE_ID,
                  status: 'DI_LAPAS',
                }
              : p
          )
        );
      } else {
        soundFX.playPenalty();
      }
      chargePlayerOrTriggerCrisis(
        activePlayerIndex,
        penaltyAbs,
        'Vonis Pengadilan Meja Hijau',
        null
      );
    }

    addLog(
      `⚖️ ${activePlayer.name}: ${verdict.verdictTitle} — ${verdict.verdictText}`,
      verdict.sendToJail ? 'penalty' : 'gain'
    );
    showQuickBanner(`⚖️ ${verdict.verdictTitle}`);

    if (pendingDoublesTakdir) {
      setPendingDoublesTakdir(false);
      setTimeout(() => {
        drawFateCard('TAKDIR', true);
      }, 300);
    }
  };

  // --- BUY PROPERTY (NORMAL OR 🛍️ HARBOLNAS 12.12 50% DISCOUNT) & UPGRADE ---
  const handleBuyProperty = (tileId: number, useHarbolnas: boolean = false) => {
    const tile = BOARD_TILES.find((t) => t.id === tileId);
    const prop = properties[tileId];
    if (!tile || !prop || prop.ownerId !== null || prop.isSeizedByState) return;

    const basePrice = tile.price ?? 1_000_000;
    const harbolnasCard = activePlayer.savedCards.find(
      (c) => c.key === 'HARBOLNAS'
    );
    const applyDiscount = Boolean(
      useHarbolnas && (activePlayer.harbolnasArmed || harbolnasCard)
    );
    const finalPrice = applyDiscount ? Math.round(basePrice * 0.5) : basePrice;

    if (activePlayer.money < finalPrice) return;

    soundFX.playBuild();
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === activePlayerIndex
          ? {
              ...p,
              money: p.money - finalPrice,
              harbolnasArmed: false,
              savedCards:
                applyDiscount && harbolnasCard
                  ? p.savedCards.filter((c) => c.id !== harbolnasCard.id)
                  : p.savedCards,
            }
          : p
      )
    );
    setProperties((prev) => ({
      ...prev,
      [tileId]: {
        ...prev[tileId],
        ownerId: activePlayer.id,
        level: 0,
        isSeizedByState: false,
      },
    }));
    addLog(
      `🏠 SAH! ${activePlayer.name} membeli tanah #${tile.id} ${tile.name} ${
        applyDiscount ? 'dengan Promo 🛍️ Harbolnas 12.12 (Diskon 50%) ' : ''
      }seharga ${formatRupiah(finalPrice)}!`,
      'gain'
    );
    showQuickBanner(
      `🏠 ${activePlayer.name} membeli ${tile.name} (${formatRupiah(
        finalPrice
      )})!`
    );
    setShowBuyUpgradeModal(false);

    if (pendingDoublesTakdir) {
      setPendingDoublesTakdir(false);
      setTimeout(() => {
        drawFateCard('TAKDIR', true);
      }, 300);
    }
  };

  const handleUpgradeProperty = (tileId: number) => {
    const tile = BOARD_TILES.find((t) => t.id === tileId);
    const prop = properties[tileId];
    if (
      !tile ||
      !prop ||
      prop.ownerId !== activePlayer.id ||
      prop.isSeizedByState
    )
      return;
    if (prop.level >= 5 || activePlayer.upgradeTokens <= 0) return;

    const nextLevel = (prop.level + 1) as BuildingLevel;
    const cost = getUpgradeCostForNextLevel(nextLevel);
    if (activePlayer.money < cost) return;

    soundFX.playBuild();
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === activePlayerIndex
          ? {
              ...p,
              money: p.money - cost,
              upgradeTokens: Math.max(0, p.upgradeTokens - 1),
            }
          : p
      )
    );
    setProperties((prev) => ({
      ...prev,
      [tileId]: {
        ...prev[tileId],
        level: nextLevel,
      },
    }));
    addLog(
      `🏗️ ${activePlayer.name} upgrade #${tile.id} ${tile.name} ke Tingkat ${nextLevel}: ${
        BUILDING_NAMES[nextLevel]
      } (Biaya ${formatRupiah(cost)} → Sewa Baru ${formatRupiah(
        calculatePropertyRent(tile, nextLevel)
      )})!`,
      'gain'
    );
    showQuickBanner(`🏗️ ${tile.name} naik ke ${BUILDING_NAMES[nextLevel]}!`);
    setStartUpgradeBanner(false);
  };

  // --- FASE 3: KASIH DUIT & MINTA DUIT (INTERACTIVE REQUEST POP-UP) ---
  const handleGiveMoney = (
    targetPlayerId: number,
    amount: number,
    note: string
  ) => {
    if (activePlayer.money < amount) return;
    const target = players.find((p) => p.id === targetPlayerId);
    if (!target) return;

    soundFX.playCashIn();
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === activePlayer.id) return { ...p, money: p.money - amount };
        if (p.id === targetPlayerId) {
          return {
            ...p,
            money: p.money + amount,
            giftedMoneyReceived: p.giftedMoneyReceived + amount,
          };
        }
        return p;
      })
    );
    addLog(
      `🤝 ${activePlayer.name} kasih duit ${formatRupiah(amount)} ke ${
        target.name
      } ("${note}") — tidak dihitung sebagai pendapatan peringkat.`,
      'gain'
    );
    showQuickBanner(
      `🤝 Transfer ${formatRupiah(amount)} ke ${target.name} berhasil!`
    );
    setShowGiveMoneyModal(false);
  };

  const handleSendAskMoneyRequest = (
    targetPlayerId: number,
    amount: number,
    reason: string
  ) => {
    const target = players.find((p) => p.id === targetPlayerId);
    setShowAskMoneyModal(false);
    setPendingMoneyRequest({
      fromPlayerId: activePlayer.id,
      toPlayerId: targetPlayerId,
      amount,
      reason,
    });
    pendingRequestWriteAtRef.current = Date.now();
    addLog(
      `🤲 ${activePlayer.name} mengirim permintaan uang ${formatRupiah(
        amount
      )} ke ${target?.name ?? 'pemain'}...`,
      'info'
    );
    if (isOnlineRoom && !target?.isBot) {
      showQuickBanner(
        `⏳ Menunggu jawaban ${target?.name ?? 'pemain'} atas permintaan uang...`
      );
    }
  };

  const handleAcceptMoneyRequest = () => {
    if (!pendingMoneyRequest || !canRespondToMoneyRequest) return;
    const { fromPlayerId, toPlayerId, amount, reason } = pendingMoneyRequest;
    const sender = playersRef.current.find((p) => p.id === toPlayerId);
    const receiver = playersRef.current.find((p) => p.id === fromPlayerId);
    if (!sender || !receiver || sender.money < amount) {
      setPendingMoneyRequest(null);
      pendingRequestWriteAtRef.current = Date.now();
      return;
    }

    soundFX.playCashIn();
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === toPlayerId) return { ...p, money: p.money - amount };
        if (p.id === fromPlayerId) {
          return {
            ...p,
            money: p.money + amount,
            giftedMoneyReceived: p.giftedMoneyReceived + amount,
          };
        }
        return p;
      })
    );
    addLog(
      `✅ ${sender.name} MENERIMA permintaan uang & mentransfer ${formatRupiah(
        amount
      )} ke ${receiver.name} ("${reason}")!`,
      'gain'
    );
    showQuickBanner(
      `✅ ${sender.name} mentransfer ${formatRupiah(amount)} ke ${
        receiver.name
      }!`
    );
    setPendingMoneyRequest(null);
    pendingRequestWriteAtRef.current = Date.now();
  };

  const handleRejectMoneyRequest = () => {
    if (!pendingMoneyRequest || !canRespondToMoneyRequest) return;
    const { fromPlayerId, toPlayerId, amount } = pendingMoneyRequest;
    const sender = playersRef.current.find((p) => p.id === toPlayerId);
    const receiver = playersRef.current.find((p) => p.id === fromPlayerId);
    soundFX.playPenalty();
    addLog(
      `❌ ${sender?.name ?? 'Pemain'} MENOLAK permintaan uang ${formatRupiah(
        amount
      )} dari ${receiver?.name ?? 'pemain'}!`,
      'penalty'
    );
    showQuickBanner(`❌ Permintaan uang ditolak oleh ${sender?.name}!`);
    setPendingMoneyRequest(null);
    pendingRequestWriteAtRef.current = Date.now();
  };

  // Bot tidak punya klien sendiri: permintaan uang ke bot dijawab otomatis di
  // klien pemohon (terima bila bot mampu, tolak bila saldonya kurang).
  const botMoneyResponseRef = useRef({
    accept: handleAcceptMoneyRequest,
    reject: handleRejectMoneyRequest,
  });
  botMoneyResponseRef.current = {
    accept: handleAcceptMoneyRequest,
    reject: handleRejectMoneyRequest,
  };
  useEffect(() => {
    if (!isOnlineRoom || !pendingMoneyRequest || !canRespondToMoneyRequest) {
      return;
    }
    const target = playersRef.current.find(
      (p) => p.id === pendingMoneyRequest.toPlayerId
    );
    if (!target?.isBot) return;
    const request = pendingMoneyRequest;
    const timer = setTimeout(() => {
      const latestTarget = playersRef.current.find(
        (p) => p.id === request.toPlayerId
      );
      if (latestTarget && latestTarget.money >= request.amount) {
        botMoneyResponseRef.current.accept();
      } else {
        botMoneyResponseRef.current.reject();
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [isOnlineRoom, pendingMoneyRequest, canRespondToMoneyRequest]);

  // --- FASE 3: 10 KARTU SIMPANAN HANDLERS ---
  const handleApplyDukunDiceChange = (dieIndex: number, newValue: number) => {
    if (
      hasRolledThisTurn ||
      rollLockRef.current ||
      turnPhase !== 'READY_TO_ROLL' ||
      isRolling ||
      isMoving
    ) {
      setShowDukunModal(false);
      setSelectedCardToUse(null);
      showQuickBanner(
        '🔮 Kartu Dukun hanya bisa digunakan sebelum melempar dadu (1x per giliran)!'
      );
      return;
    }

    rollLockRef.current = true;
    setHasRolledThisTurn(true);
    setTurnPhase('ROLLING');

    const dukunCard = activePlayer.savedCards.find((c) => c.key === 'DUKUN');
    setShowDukunModal(false);
    setSelectedCardToUse(null);
    soundFX.playCardReveal(true);

    const nextD1 = dieIndex === 0 ? newValue : dice[0];
    const nextD2 = dieIndex === 1 ? newValue : dice[1];
    const nextD3 =
      dieIndex === 2 && extraDie !== null ? newValue : extraDie;

    setDice([nextD1, nextD2]);
    if (nextD3 !== null) setExtraDie(nextD3);

    if (dukunCard) {
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === activePlayerIndex
            ? {
                ...p,
                savedCards: p.savedCards.filter((c) => c.id !== dukunCard.id),
              }
            : p
        )
      );
    }

    addLog(
      `🔮 RITUAL DUKUN! ${activePlayer.name} mengubah Dadu #${
        dieIndex + 1
      } menjadi angka ${newValue} lalu melangkah!`,
      'card'
    );
    showQuickBanner(
      `🔮 Dukun Sakti! Dadu #${dieIndex + 1} diubah jadi ${newValue}!`
    );

    executePawnHopMovement(
      nextD1,
      nextD2,
      nextD3,
      khodamAppliedOnRoll,
      pendingRollFreedFromJail
    );
  };

  const handleConfirmUseSavedCard = (
    card: SavedCard,
    options?: {
      targetPlayerId?: number;
      dukunDieIndex?: number;
      dukunDieValue?: number;
      fitnahDiceResult?: number;
    }
  ) => {
    setSelectedCardToUse(null);
    soundFX.playCardReveal(true);

    switch (card.key) {
      case 'DOA_ORTU': {
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === activePlayerIndex
              ? {
                  ...p,
                  shieldedByDoa: true,
                  savedCards: p.savedCards.filter((c) => c.id !== card.id),
                }
              : p
          )
        );
        addLog(
          `🙏 ${activePlayer.name} menyiagakan Doa Orang Tua! Siap membatalkan kartu Takdir/Musibah kapan saja.`,
          'gain'
        );
        showQuickBanner('🙏 Doa Orang Tua Siaga!');
        break;
      }

      case 'DUKUN': {
        const dieIdx = options?.dukunDieIndex ?? 0;
        const dieVal = options?.dukunDieValue ?? 6;
        handleApplyDukunDiceChange(dieIdx, dieVal);
        break;
      }

      case 'PEWARIS': {
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === activePlayerIndex
              ? {
                  ...p,
                  pewarisBoost: true,
                  savedCards: p.savedCards.filter((c) => c.id !== card.id),
                }
              : p
          )
        );
        setExtraDie(6);
        addLog(
          `👑 KARTU PEWARIS AKTIF! Lemparan dadu ${activePlayer.name} kali ini menggunakan 3 DADU sekaligus!`,
          'gain'
        );
        showQuickBanner('👑 Kartu Pewaris Aktif! Siap lempar 3 Dadu sekaligus!');
        break;
      }

      case 'FITNAH': {
        const targetId = options?.targetPlayerId ?? 1;
        const roll = options?.fitnahDiceResult ?? 1;
        const outcome = resolveFitnahRoll(roll);
        const targetPlayer = players.find((p) => p.id === targetId);

        setPlayers((prev) =>
          prev.map((p, idx) => {
            const withoutCard =
              idx === activePlayerIndex
                ? p.savedCards.filter((c) => c.id !== card.id)
                : p.savedCards;

            if (outcome === 'TARGET_TO_JAIL' && p.id === targetId) {
              return {
                ...p,
                savedCards: withoutCard,
                position: LAPAS_TILE_ID,
                lastPerimeterPosition: LAPAS_TILE_ID,
                status: 'DI_LAPAS',
              };
            }
            if (outcome === 'SELF_TO_JAIL' && idx === activePlayerIndex) {
              return {
                ...p,
                savedCards: withoutCard,
                position: LAPAS_TILE_ID,
                lastPerimeterPosition: LAPAS_TILE_ID,
                status: 'DI_LAPAS',
              };
            }
            if (
              outcome === 'BOTH_TO_COURT' &&
              (idx === activePlayerIndex || p.id === targetId)
            ) {
              return {
                ...p,
                savedCards: withoutCard,
                position: COURT_TILE_ID,
                lastPerimeterPosition: COURT_TILE_ID,
                status: p.status === 'BANGKRUT' ? 'BANGKRUT' : 'NORMAL',
              };
            }
            return { ...p, savedCards: withoutCard };
          })
        );

        if (outcome === 'TARGET_TO_JAIL') {
          addLog(
            `🗣️ FITNAH BERHASIL (Dadu ${roll})! ${
              targetPlayer?.name ?? 'Target'
            } difitnah ${activePlayer.name} & langsung dijebloskan ke LAPAS (#10)!`,
            'card'
          );
          showQuickBanner(
            `🗣️ Fitnah Dadu ${roll}: ${targetPlayer?.name} masuk Lapas!`
          );
        } else if (outcome === 'SELF_TO_JAIL') {
          addLog(
            `🗣️ FITNAH SENJATA MAKAN TUAN (Dadu ${roll})! ${activePlayer.name} ketahuan memfitnah & masuk LAPAS (#10) sendiri!`,
            'penalty'
          );
          showQuickBanner(
            `🗣️ Fitnah Dadu ${roll}: Senjata makan tuan, kamu masuk Lapas!`
          );
        } else {
          addLog(
            `🗣️ FITNAH BERUJUNG MEJA HIJAU (Dadu ${roll})! ${
              activePlayer.name
            } dan ${
              targetPlayer?.name ?? 'Target'
            } sama-sama dikirim ke PENGADILAN (#30)!`,
            'penalty'
          );
          showQuickBanner(
            `⚖️ Fitnah Dadu ${roll}: Kedua pemain dikirim ke Pengadilan (#30)!`
          );
          setCourtDiceResult(null);
          setShowCourtModal(true);
        }
        break;
      }

      case 'DISKON_TOL': {
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === activePlayerIndex
              ? {
                  ...p,
                  diskonTolArmed: true,
                  savedCards: p.savedCards.filter((c) => c.id !== card.id),
                }
              : p
          )
        );
        addLog(
          `🎫 ${activePlayer.name} mengaktifkan Kartu Diskon Tol! Kunjungan ke Gerbang Tol berikutnya bebas biaya Rp500 Rb.`,
          'gain'
        );
        showQuickBanner('🎫 Kartu Diskon Tol Siaga (Bebas Rp500 Rb)!');
        break;
      }

      case 'KHODAM': {
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === activePlayerIndex
              ? {
                  ...p,
                  khodamBoost: true,
                  savedCards: p.savedCards.filter((c) => c.id !== card.id),
                }
              : p
          )
        );
        addLog(
          `✨ ${activePlayer.name} mengaktifkan Khodam! Lemparan dadu berikutnya otomatis mendapat tambahan +2 langkah.`,
          'gain'
        );
        showQuickBanner('✨ Khodam Aktif: Lemparan dadu +2 langkah!');
        break;
      }

      case 'HARBOLNAS': {
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === activePlayerIndex
              ? {
                  ...p,
                  harbolnasArmed: true,
                }
              : p
          )
        );
        addLog(
          `🛍️ Voucher Harbolnas 12.12 siap digunakan! Beli tanah kosong berikutnya diskon 50%.`,
          'gain'
        );
        setShowBuyUpgradeModal(true);
        break;
      }

      case 'CASHBACK_99': {
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === activePlayerIndex
              ? {
                  ...p,
                  cashbackArmed: true,
                  savedCards: p.savedCards.filter((c) => c.id !== card.id),
                }
              : p
          )
        );
        addLog(
          `💸 ${activePlayer.name} mengaktifkan Cashback 99%! Tagihan sewa tanah berikutnya otomatis jadi Rp0 (Gratis).`,
          'gain'
        );
        showQuickBanner('💸 Cashback 99% Aktif: Sewa berikutnya Rp0!');
        break;
      }

      case 'ORANG_DALAM': {
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === activePlayerIndex
              ? {
                  ...p,
                  status: p.status === 'DI_LAPAS' ? 'NORMAL' : p.status,
                  savedCards: p.savedCards.filter((c) => c.id !== card.id),
                }
              : p
          )
        );
        addLog(
          `🕴️ ${activePlayer.name} menggunakan Kartu Orang Dalam! Bebas dari Lapas gratis.`,
          'gain'
        );
        showQuickBanner('🕴️ Kartu Orang Dalam digunakan!');
        break;
      }

      case 'WANTIMPRES': {
        soundFX.playCashIn();
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === activePlayerIndex
              ? {
                  ...p,
                  wantimpresActive: true,
                }
              : p
          )
        );
        addLog(
          `🏛️👑 SK WANTIMPRES TURUN! Gaji ${activePlayer.name} setiap melewati/berhenti di START resmi naik dari Rp1 Jt menjadi Rp76,5 Jt sampai game berakhir!`,
          'gain'
        );
        showQuickBanner(
          `🏛️ Kartu Wantimpres Aktif! Gaji START ${activePlayer.name} kini Rp76,5 Jt!`
        );
        break;
      }
    }
  };

  // --- FASE 3: FINANCIAL CRISIS, ASSET LIQUIDATION (50%), & LOAN SHARK (1-200% INTEREST) ---
  const handleSellBuildingForCash = (tileId: number) => {
    const prop = properties[tileId];
    const tile = BOARD_TILES.find((t) => t.id === tileId);
    if (!prop || !tile || prop.level <= 0) return;

    const targetIdx = pendingDebtObligation?.playerIndex ?? activePlayerIndex;
    const cashBack = calculateSellBuildingValue(prop.level);
    const newLevel = (prop.level - 1) as BuildingLevel;

    soundFX.playCashIn();
    setProperties((prev) => ({
      ...prev,
      [tileId]: {
        ...prev[tileId],
        level: newLevel,
      },
    }));
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === targetIdx ? { ...p, money: p.money + cashBack } : p
      )
    );
    addLog(
      `🏚️ ${players[targetIdx]?.name} menjual 1 tingkat bangunan di #${tile.id} ${
        tile.name
      } ke Negara (50%) seharga +${formatRupiah(cashBack)}!`,
      'info'
    );
  };

  const handleSellLandForCash = (tileId: number) => {
    const prop = properties[tileId];
    const tile = BOARD_TILES.find((t) => t.id === tileId);
    if (!prop || !tile) return;

    const targetIdx = pendingDebtObligation?.playerIndex ?? activePlayerIndex;
    const cashBack = calculateSellLandValue(tile, prop.level);

    soundFX.playCashIn();
    setProperties((prev) => ({
      ...prev,
      [tileId]: {
        ...prev[tileId],
        ownerId: null,
        isSeizedByState: true,
      },
    }));
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === targetIdx ? { ...p, money: p.money + cashBack } : p
      )
    );
    addLog(
      `📜 ${players[targetIdx]?.name} menggadaikan/menjual tanah #${tile.id} ${
        tile.name
      } ke Negara (50%) dan menerima tunai +${formatRupiah(cashBack)}!`,
      'info'
    );
  };

  const handleRequestLoanFromPlayer = (lenderId: number, principal: number) => {
    const borrowerIdx = pendingDebtObligation?.playerIndex ?? activePlayerIndex;
    const borrower = players[borrowerIdx];
    const lender = players.find((p) => p.id === lenderId);
    if (!borrower || !lender) return;

    const actualPrincipal = Math.min(lender.money, principal);
    if (actualPrincipal <= 0) return;

    setPendingLoanProposal({
      borrowerId: borrower.id,
      lenderId: lender.id,
      principal: actualPrincipal,
    });
    pendingRequestWriteAtRef.current = Date.now();
    addLog(
      `🤲💸 ${borrower.name} mengajukan pinjaman ${formatRupiah(
        actualPrincipal
      )} ke ${lender.name}. Menunggu persetujuan ${
        lender.isBot ? 'sistem (bot)' : lender.name
      }...`,
      'info'
    );
  };

  const handleApproveLoanWithInterest = (interestRate: number) => {
    if (!pendingLoanProposal || !canRespondToLoanProposal) return;
    const { borrowerId, lenderId, principal } = pendingLoanProposal;
    const totalDue = calculateLoanTotalDue(principal, interestRate);
    const borrower = playersRef.current.find((p) => p.id === borrowerId);
    const lender = playersRef.current.find((p) => p.id === lenderId);

    soundFX.playCashIn();
    const newLoan: LoanRecord = {
      id: `loan-${Date.now()}`,
      borrowerId,
      lenderId,
      principal,
      interestRate,
      totalDue,
      remainingDue: totalDue,
      turnsLeft: 3,
    };

    setLoans((prev) => [...prev, newLoan]);
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === lenderId) return { ...p, money: p.money - principal };
        if (p.id === borrowerId) return { ...p, money: p.money + principal };
        return p;
      })
    );
    setPendingLoanProposal(null);
    pendingRequestWriteAtRef.current = Date.now();

    addLog(
      `🤝💸 PINJAMAN RENTENIR CAIR! ${lender?.name} meminjamkan ${formatRupiah(
        principal
      )} ke ${borrower?.name} dengan BUNGA ${interestRate}% (Wajib kembali ${formatRupiah(
        totalDue
      )} dalam 3 giliran)!`,
      'gain'
    );
    showQuickBanner(
      `💸 Pinjaman ${formatRupiah(
        principal
      )} (Bunga ${interestRate}%) disetujui!`
    );
  };

  const handleRejectLoanProposal = () => {
    if (!pendingLoanProposal || !canRespondToLoanProposal) return;
    const lender = playersRef.current.find(
      (p) => p.id === pendingLoanProposal.lenderId
    );
    soundFX.playPenalty();
    addLog(
      `❌ ${lender?.name ?? 'Pemain'} menolak memberikan pinjaman utang!`,
      'penalty'
    );
    showQuickBanner(`❌ Pengajuan pinjaman ditolak oleh ${lender?.name}!`);
    setPendingLoanProposal(null);
    pendingRequestWriteAtRef.current = Date.now();
  };

  const handleSettlePendingObligation = () => {
    if (!pendingDebtObligation) return;
    const { playerIndex, amount, reason, recipientPlayerId } =
      pendingDebtObligation;
    const debtor = players[playerIndex];
    if (!debtor || debtor.money < amount) return;

    soundFX.playCashIn();
    if (recipientPlayerId === null) {
      setStateTreasury((t) => t + amount);
    }
    setPlayers((prev) =>
      prev.map((p, idx) => {
        if (idx === playerIndex) return { ...p, money: p.money - amount };
        if (recipientPlayerId !== null && p.id === recipientPlayerId) {
          return {
            ...p,
            money: p.money + amount,
            earnedIncome: p.earnedIncome + amount,
          };
        }
        return p;
      })
    );
    addLog(
      `✅ ${debtor.name} berhasil melunasi tagihan ${reason} sebesar ${formatRupiah(
        amount
      )}!`,
      'gain'
    );
    showQuickBanner(`✅ Tagihan ${reason} (${formatRupiah(amount)}) lunas!`);
    setPendingDebtObligation(null);
  };

  const handleDeclareBankruptcyFromCrisis = () => {
    if (!pendingDebtObligation) return;
    const { playerIndex, reason } = pendingDebtObligation;
    const debtor = players[playerIndex];
    if (!debtor) return;

    soundFX.playPenalty();
    setProperties((prev) => {
      const copy = { ...prev };
      Object.values(copy).forEach((pr) => {
        if (pr.ownerId === debtor.id) {
          copy[pr.tileId] = {
            ...pr,
            ownerId: null,
            isSeizedByState: true,
          };
        }
      });
      return copy;
    });

    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === playerIndex ? { ...p, money: 0, status: 'BANGKRUT' } : p
      )
    );
    setPendingDebtObligation(null);

    addLog(
      `💀 BANGKRUT (DIKALAHKAN NEGARA)! ${debtor.name} tidak sanggup membayar ${reason} dan seluruh asetnya disita Negara!`,
      'penalty'
    );
    showQuickBanner(`💀 ${debtor.name} BANGKRUT (Dikalahkan Negara)!`);
  };

  const handleRepayLoan = (loanId: string, payAmount: number) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan || activePlayer.money <= 0) return;

    const actualPay = Math.min(
      activePlayer.money,
      loan.remainingDue,
      payAmount
    );
    if (actualPay <= 0) return;

    const lender = players.find((p) => p.id === loan.lenderId);
    soundFX.playCashIn();

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === activePlayer.id)
          return { ...p, money: p.money - actualPay };
        if (p.id === loan.lenderId) {
          return {
            ...p,
            money: p.money + actualPay,
            earnedIncome: p.earnedIncome + actualPay,
          };
        }
        return p;
      })
    );

    const newRemaining = loan.remainingDue - actualPay;
    setLoans((prev) =>
      prev
        .map((l) =>
          l.id === loanId ? { ...l, remainingDue: newRemaining } : l
        )
        .filter((l) => l.remainingDue > 0)
    );

    addLog(
      `💳 ${activePlayer.name} membayar cicilan/utang sebesar ${formatRupiah(
        actualPay
      )} ke ${lender?.name ?? 'Kreditur'}${
        newRemaining <= 0
          ? ' (LUNAS!)'
          : ` (Sisa utang: ${formatRupiah(newRemaining)})`
      }!`,
      'gain'
    );
    showQuickBanner(
      newRemaining <= 0
        ? `🎉 Utang ke ${lender?.name} LUNAS!`
        : `💳 Cicilan ${formatRupiah(actualPay)} dibayarkan!`
    );
  };

  /**
   * FASE 4: AUTO-TURN EXECUTOR (Triggered when 60-second timer expires OR when Auto-Bot is active!)
   * Ensures a 64-player game NEVER gets stuck!
   */
  const executeAutomatedTurnAction = useCallback(() => {
    if (
      screen !== 'GAME' ||
      gameState !== 'playing' ||
      isRolling ||
      isMoving ||
      isLandingPause ||
      // Kepemilikan giliran: klien lain tidak boleh menjalankan aksi pemain aktif
      !isMyTurnToAct
    )
      return;

    // 1. If Financial Crisis Modal is open, auto-liquidate or declare bankruptcy and advance turn
    if (pendingDebtObligation) {
      const debtor = players[pendingDebtObligation.playerIndex];
      if (debtor && debtor.money >= pendingDebtObligation.amount) {
        handleSettlePendingObligation();
      } else {
        handleDeclareBankruptcyFromCrisis();
      }
      scheduleTurnAdvance(350, true);
      return;
    }

    // 2. If Fate Card Modal is open, auto-roll dice if needed, confirm card, and advance turn
    if (activeFateCard) {
      if (activeFateCard.card.requiresDice && fateDiceResult === null) {
        const autoD = Math.floor(Math.random() * 6) + 1;
        setFateDiceResult(autoD);
        // Dadu disimpan dulu; tick berikutnya yang mengonfirmasi kartu dengan
        // angka yang sama (dulu angka tampilan & efek bisa berbeda).
        return;
      }
      handleConfirmFateCard();
      // Majukan giliran hanya bila kartu tidak membuka rantai berikutnya
      // (Pengadilan, kartu Doubles, atau krisis keuangan) — kalau terbuka,
      // tick auto-action berikutnya yang akan menanganinya.
      scheduleTurnAdvance(400, true);
      return;
    }

    // 3. If Court Modal is open, auto-roll court dice, confirm verdict, and advance turn
    if (showCourtModal) {
      const roll = courtDiceResult ?? Math.floor(Math.random() * 6) + 1;
      const verdict = resolveCourtVerdict(roll, activePlayer.money);
      setShowCourtModal(false);
      setCourtDiceResult(null);
      if (verdict.moneyDelta > 0) {
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === activePlayerIndex
              ? {
                  ...p,
                  money: p.money + verdict.moneyDelta,
                  earnedIncome: p.earnedIncome + verdict.moneyDelta,
                }
              : p
          )
        );
      } else {
        const penaltyAbs = Math.abs(verdict.moneyDelta);
        if (verdict.sendToJail) {
          setPlayers((prev) =>
            prev.map((p, idx) =>
              idx === activePlayerIndex
                ? {
                    ...p,
                    position: LAPAS_TILE_ID,
                    lastPerimeterPosition: LAPAS_TILE_ID,
                    status: 'DI_LAPAS',
                  }
                : p
            )
          );
        }
        chargePlayerOrTriggerCrisis(
          activePlayerIndex,
          penaltyAbs,
          'Vonis Pengadilan Otomatis',
          null
        );
      }
      addLog(
        `⏱️⚖️ [Otomatis] ${activePlayer.name}: ${verdict.verdictTitle}`,
        verdict.sendToJail ? 'penalty' : 'gain'
      );
      scheduleTurnAdvance(400, true);
      return;
    }

    // 4. If Toll Modal is open, pick a random destination toll gate and advance turn
    if (showTollModal) {
      const otherTolls = TOLL_TILE_IDS.filter(
        (id) => id !== activePlayer.position
      );
      const randomDest =
        otherTolls[Math.floor(Math.random() * otherTolls.length)] ||
        TOLL_TILE_IDS[0];
      handleSelectTollDestination(randomDest);
      return;
    }

    // 5. If Jail Modal is open, auto-pay fine if rich or try doubles
    if (showJailModal) {
      if (activePlayer.money >= 2_000_000) {
        handleJailPayFine();
      } else {
        handleJailTryDoubles();
      }
      return;
    }

    // 6. If Sel Premium Modal is open, stay in cell and advance turn
    if (showPremiumCellModal) {
      handlePremiumStayInCell();
      return;
    }

    // 7. If Buy/Upgrade Modal is open, auto-buy if standing on affordable unowned land, then close and advance turn
    if (showBuyUpgradeModal) {
      const tile = BOARD_TILES.find((t) => t.id === activePlayer.position);
      const prop = properties[activePlayer.position];
      if (
        tile?.type === 'PROPERTY' &&
        prop &&
        prop.ownerId === null &&
        !prop.isSeizedByState &&
        activePlayer.money >= (tile.price ?? 1_000_000) * 1.3
      ) {
        handleBuyProperty(tile.id, false);
      } else {
        setShowBuyUpgradeModal(false);
        setStartUpgradeBanner(false);
      }
      scheduleTurnAdvance(350, true);
      return;
    }

    // 8. If player hasn't rolled dice yet this turn, auto-roll!
    if (!hasRolledThisTurn && turnPhase === 'READY_TO_ROLL' && !rollLockRef.current) {
      addLog(
        `⏱️🎲 [Auto-Roll] ${activePlayer.name} otomatis melempar dadu agar giliran tidak macet!`,
        'info'
      );
      showQuickBanner(`⏱️ Auto-Roll: ${activePlayer.name} melempar dadu!`);
      handleRollDice(false);
      return;
    }

    // 9. Otherwise, player has already rolled and resolved modals -> advance to next turn!
    addLog(
      `⏱️➡️ Giliran ${activePlayer.name} selesai otomatis, lanjut ke warga berikutnya!`,
      'info'
    );
    handleNextTurn();
  }, [
    screen,
    gameState,
    isRolling,
    isMoving,
    isLandingPause,
    pendingDebtObligation,
    activeFateCard,
    fateDiceResult,
    showCourtModal,
    courtDiceResult,
    showTollModal,
    showJailModal,
    showPremiumCellModal,
    showBuyUpgradeModal,
    hasRolledThisTurn,
    turnPhase,
    players,
    activePlayer,
    activePlayerIndex,
    properties,
    addLog,
    showQuickBanner,
    handleNextTurn,
    handleRollDice,
    scheduleTurnAdvance,
    isMyTurnToAct,
    handleSettlePendingObligation,
    handleDeclareBankruptcyFromCrisis,
    handleConfirmFateCard,
    handleSelectTollDestination,
    handleJailPayFine,
    handleJailTryDoubles,
    handlePremiumStayInCell,
    handleBuyProperty,
    chargePlayerOrTriggerCrisis,
  ]);

  const autoActionRef = useRef(executeAutomatedTurnAction);
  autoActionRef.current = executeAutomatedTurnAction;

  // FASE 4: 60-Second Countdown Timer (`00:60` -> `00:00`) that triggers `executeAutomatedTurnAction` on expiry!
  useEffect(() => {
    if (screen !== 'GAME' || gameState !== 'playing') return;
    const interval = setInterval(() => {
      setTurnSeconds((prev) => {
        if (prev <= 1) {
          setTimeout(() => {
            autoActionRef.current();
          }, 50);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, gameState, activePlayerIndex]);

  // FASE 4: Fast Auto-Bot Mode (When `autoBotFastMode` is ON and activePlayer is a Bot)
  useEffect(() => {
    if (
      screen !== 'GAME' ||
      gameState !== 'playing' ||
      !autoBotFastMode ||
      !activePlayer?.isBot ||
      isRolling ||
      isMoving ||
      isLandingPause ||
      Boolean(turnTransition)
    ) {
      return;
    }
    const botTimer = setTimeout(() => {
      autoActionRef.current();
    }, 650);
    return () => clearTimeout(botTimer);
  }, [
    screen,
    gameState,
    autoBotFastMode,
    activePlayer,
    activePlayerIndex,
    isRolling,
    isMoving,
    isLandingPause,
    turnTransition,
    hasRolledThisTurn,
    turnPhase,
    showBuyUpgradeModal,
    showTollModal,
    showCourtModal,
    showJailModal,
    showPremiumCellModal,
    activeFateCard,
    pendingDebtObligation,
  ]);

  // --- FASE 4: LOBBY & WAITING ROOM HANDLERS ---
  const handleSignInGoogle = async () => {
    setLobbyError(null);
    const user = await signInWithGooglePopup();
    if (user) {
      if (user.displayName) setNickname(user.displayName.slice(0, 28));
      showQuickBanner(`✅ Login berhasil sebagai ${user.displayName || user.email}!`);
    }
  };

  const handleSignOutGoogle = async () => {
    await signOutFirebaseUser();
    setIsOnlineRoom(false);
    showQuickBanner('Keluar dari akun Google.');
  };

  // Bubarkan room online (khusus Host): hapus dokumen room dari Firestore,
  // semua pemain otomatis keluar lewat callback onDeleted di langganan snapshot.
  const handleDeleteOnlineRoom = useCallback(async () => {
    if (!roomCode) return;
    try {
      await deleteFirestoreRoom(roomCode);
      showQuickBanner(
        `🗑️ Room #${roomCode} resmi dibubarkan. Sampai jumpa di perang berikutnya, Warga!`
      );
    } catch (err) {
      console.warn('Delete online room warning:', err);
      showQuickBanner(`⚠️ Gagal menghapus Room #${roomCode}. Coba lagi ya.`);
      return;
    }
    setIsOnlineRoom(false);
    setRoomCode('');
    setIsHost(false);
    setGameState('title');
    setScreen('LOBBY');
  }, [roomCode, showQuickBanner]);

  // Helper untuk menyimpan & membaca Room lokal di localStorage (agar tab/sesi lokal juga sinkron)
  const saveLocalRoomCache = useCallback(
    (
      code: string,
      roomPlayers: Player[],
      cap: number,
      roomStatus: 'WAITING' | 'PLAYING' = 'WAITING',
      logs: ActivityLogItem[] = []
    ) => {
      try {
        const clean = sanitizeRoomCode(code);
        if (!clean) return;
        localStorage.setItem(
          `wni_room_${clean}`,
          JSON.stringify({
            roomCode: clean,
            maxPlayers: cap,
            players: roomPlayers,
            status: roomStatus,
            activityLogs: logs,
            customAssets: sanitizeCustomAssetsForFirestore(customAssets),
          })
        );
      } catch {
        // Ignore storage errors
      }
    },
    [customAssets]
  );

  // Hanya untuk "⚡ MAIN CEPAT / SIMULASI LOKAL" (1 Host + 3 Bot otomatis)
  const buildQuickPlayLocalPlayers = useCallback(
    (hostNickname: string, avatarId: string, uid?: string): Player[] => {
      const hostOnly = createHostOnlyRoomPlayers({
        hostName: hostNickname || 'Warga Host',
        avatarId,
        uid: uid || 'host-0',
      });
      return generateBotPlayers(hostOnly, 3, maxPlayers);
    },
    [maxPlayers]
  );

  // 1. BUAT ROOM BARU (HOST): HANYA 1 PEMAIN (HOST ITU SENDIRI), TANPA BOT OTOMATIS!
  const handleCreateRoom = async () => {
    const cleanNick = nickname.trim();
    if (!cleanNick) {
      setLobbyError('Mohon isi Nama Warga (Nickname) terlebih dahulu!');
      return;
    }
    setLobbyError(null);
    setIsLobbyBusy(true);

    let currentUser = firebaseUser;
    if (!currentUser) {
      currentUser = await signInWithGooglePopup();
      if (!currentUser) {
        setLobbyError(
          'Silakan Login Google terlebih dahulu untuk membuat Room Multiplayer online!'
        );
        setIsLobbyBusy(false);
        return;
      }
      setFirebaseUser(currentUser);
    }

    const hostUid = currentUser.uid;

    // ANTI-TABRAKAN: kode `WNI-XXX` cuma punya 900 kombinasi. Pastikan kode belum
    // dipakai room lain di Firestore sebelum membuat; kalau tabrakan, generate ulang
    // (maksimal 3 percobaan) supaya tidak menimpa/menolak create.
    let generatedCode = generateRoomCode();
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const existingRoom = await fetchFirestoreRoom(generatedCode);
        if (!existingRoom) break;
        generatedCode = generateRoomCode();
        if (attempt === 2) {
          setLobbyError(
            'Kode room sedang bentrok terus-menerus (kebetulan padat). Coba lagi beberapa saat lagi, Warga!'
          );
          setIsLobbyBusy(false);
          return;
        }
      }
    } catch (err) {
      console.error('Room code availability check error:', err);
      setLobbyError(
        'Gagal memeriksa kode room di server. Periksa koneksi internet Anda.'
      );
      setIsLobbyBusy(false);
      return;
    }

    // WAJIB HANYA 1 PEMAIN (HOST) — DILARANG MEMASUKKAN BOT OTOMATIS SAAT BUAT ROOM BARU!
    const initialRoomPlayers = createHostOnlyRoomPlayers({
      hostName: cleanNick,
      avatarId: selectedAvatarId,
      uid: hostUid,
    });
    const initialProps = createInitialAppProperties();
    const initLogs: ActivityLogItem[] = [
      {
        id: `room-${Date.now()}`,
        text: `Room #${generatedCode} dibuat oleh ${cleanNick} (1/${maxPlayers} Warga — Menunggu teman bergabung)!`,
        type: 'info',
        timestamp: '00:01',
      },
    ];

    setRoomCode(generatedCode);
    setPlayers(initialRoomPlayers);
    setProperties(initialProps);
    setActivityLogs(initLogs);
    setMyPlayerId(0);
    setIsHost(true);
    saveLocalRoomCache(
      generatedCode,
      initialRoomPlayers,
      maxPlayers,
      'WAITING',
      initLogs
    );

    try {
      await createFirestoreRoom({
        roomCode: generatedCode,
        hostUid,
        hostId: 0,
        hostName: cleanNick,
        maxPlayers,
        players: initialRoomPlayers,
        properties: initialProps,
        activityLogs: initLogs,
        customAssets,
      });
      setIsOnlineRoom(true);
    } catch (err) {
      console.error('Firestore room create error:', err);
      setLobbyError(
        'Gagal membuat room di Firestore. Periksa koneksi internet Anda.'
      );
      setIsLobbyBusy(false);
      return;
    }

    setIsLobbyBusy(false);
    setScreen('WAITING_ROOM');
  };

  // 3. GABUNG ROOM (JOIN): PRIORITAS PEMAIN ASLI (AUTO-REPLACE BOT TERAKHIR JIKA PENUH OLEH BOT)
  const handleJoinRoom = async () => {
    const cleanNick = nickname.trim();
    if (!cleanNick) {
      setLobbyError('Mohon isi Nama Warga (Nickname) terlebih dahulu!');
      return;
    }
    const cleanCode = sanitizeRoomCode(joinCodeInput);
    if (cleanCode.length < 3) {
      setLobbyError('Masukkan Kode Room yang valid (contoh: WNI-882)!');
      return;
    }

    setLobbyError(null);
    setIsLobbyBusy(true);

    let currentUser = firebaseUser;
    if (!currentUser) {
      currentUser = await signInWithGooglePopup();
      if (!currentUser) {
        setLobbyError(
          'Silakan Login Google terlebih dahulu untuk bergabung ke Room Multiplayer online!'
        );
        setIsLobbyBusy(false);
        return;
      }
      setFirebaseUser(currentUser);
    }

    const joinerUid = currentUser.uid;

    try {
      const joinRes = await joinRoom(cleanCode, {
        name: cleanNick,
        avatarId: selectedAvatarId,
        uid: joinerUid,
      });

      if (!joinRes.found) {
        setLobbyError(
          `Room #${cleanCode} tidak ditemukan di server! Pastikan Host sudah membuat room.`
        );
        setIsLobbyBusy(false);
        return;
      }

      if (!joinRes.ok) {
        setLobbyError(
          joinRes.errorMessage ||
            `Room Penuh! Seluruh slot di Room #${cleanCode} sudah terisi oleh pemain manusia asli.`
        );
        setIsLobbyBusy(false);
        return;
      }

      const roomData = joinRes.roomData!;
      const updatedPlayers = joinRes.updatedPlayers!;
      const updatedLogs = joinRes.updatedLogs || [];

      // Identifikasi ID pemain sendiri di daftar room
      const myJoinedPlayer =
        updatedPlayers.find((p) => p.uid === joinerUid) ||
        updatedPlayers[updatedPlayers.length - 1];
      const myId = myJoinedPlayer ? myJoinedPlayer.id : 1;
      setMyPlayerId(myId);

      // Tentukan status Host berdasarkan roomData.hostId === myPlayerId (atau hostUid)
      const isRoomHost =
        roomData.hostId !== undefined
          ? roomData.hostId === myId
          : roomData.hostUid === joinerUid;
      setIsHost(isRoomHost);

      saveLocalRoomCache(
        cleanCode,
        updatedPlayers,
        roomData.maxPlayers,
        roomData.status === 'PLAYING' ? 'PLAYING' : 'WAITING',
        updatedLogs
      );

      setRoomCode(cleanCode);
      setMaxPlayers(roomData.maxPlayers);
      setPlayers(updatedPlayers);
      setProperties(
        deserializePropertiesFromFirestore(roomData.properties)
      );
      if (roomData.customAssets) {
        setCustomAssets((prev) =>
          mergeRemoteCustomAssetsWithLocal(prev, roomData.customAssets)
        );
      }
      setActivityLogs(updatedLogs);
      setIsOnlineRoom(true);
      setIsLobbyBusy(false);

      if (joinRes.replacedBotName) {
        showQuickBanner(
          `👋 ${cleanNick} masuk menggantikan Bot ${joinRes.replacedBotName}!`
        );
      }

      setScreen(
        roomData.status === 'PLAYING' || roomData.gameState === 'PLAYING'
          ? 'GAME'
          : 'WAITING_ROOM'
      );
      if (roomData.status === 'PLAYING' || roomData.gameState === 'PLAYING') {
        setGameState('playing');
      }
      return;
    } catch (err) {
      console.error('Firestore join error:', err);
      setLobbyError(
        'Gagal bergabung ke Room di server. Periksa koneksi atau coba lagi.'
      );
      setIsLobbyBusy(false);
      return;
    }
  };

  // CATATAN: HANYA TOMBOL "⚡ MAIN CEPAT / SIMULASI LOKAL" YANG LANGSUNG MENGISI 3 BOT OTOMATIS!
  const handleQuickPlayLocal = () => {
    const cleanNick = nickname.trim() || 'Bang Jago';
    const quickPlayers = buildQuickPlayLocalPlayers(
      cleanNick,
      selectedAvatarId,
      firebaseUser?.uid
    );
    rollLockRef.current = false;
    setHasRolledThisTurn(false);
    setTurnPhase('READY_TO_ROLL');
    setIsRolling(false);
    setIsMoving(false);
    setRoomCode(generateRoomCode());
    setPlayers(quickPlayers);
    setProperties(createInitialAppProperties());
    setTakdirDeck(shuffleDeck(TAKDIR_CARDS));
    setMusibahDeck(shuffleDeck(MUSIBAH_CARDS));
    setIsExtremeMusibahActive(false);
    setActivePlayerIndex(0);
    setRound(1);
    setStateTreasury(25_000_000);
    setTurnSeconds(60);
    setIsOnlineRoom(false);
    const targetScreen = resolveGameStartTargetScreen({
      introMovieEnabled,
    });
    setScreen(targetScreen);
    setGameState('playing');
    if (targetScreen === 'GAME' && quickPlayers[0]) {
      triggerTurnTransition(quickPlayers[0], 1);
    }
  };

  const handleAddBotsInWaitingRoom = async (count: number) => {
    if (!isHost) return;
    const updated = generateBotPlayers(players, count, maxPlayers);
    setPlayers(updated);
    const botLog: ActivityLogItem = {
      id: `bot-${Date.now()}`,
      text: `🤖 Host menambahkan Bot WNI! Total warga di room: ${updated.length}/${maxPlayers}.`,
      type: 'info',
      timestamp: '00:05',
    };
    const nextLogs = [botLog, ...activityLogs.slice(0, 30)];
    setActivityLogs(nextLogs);
    saveLocalRoomCache(roomCode, updated, maxPlayers, 'WAITING', nextLogs);

    if (isOnlineRoom && firebaseUser) {
      updateWaitingRoomInFirestore({
        roomCode,
        players: updated,
        status: 'WAITING',
        gameState: 'WAITING',
        maxPlayers,
        activityLogs: nextLogs,
      }).catch((err) => console.warn('Sync bots error:', err));
    }
  };

  // 2. HAPUS / KICK 1 BOT SPESIFIK DI WAITING ROOM
  const handleRemoveBotInWaitingRoom = async (botId: number) => {
    if (!isHost) return;
    const targetBot = players.find((p) => p.id === botId && p.isBot);
    const updated = removeBotFromRoom(players, botId);
    setPlayers(updated);

    const kickLog: ActivityLogItem = {
      id: `kick-bot-${Date.now()}`,
      text: `✕ Host menghapus Bot ${targetBot?.name || ''} dari Room (${updated.length}/${maxPlayers} Warga).`,
      type: 'info',
      timestamp: '00:06',
    };
    const nextLogs = [kickLog, ...activityLogs.slice(0, 30)];
    setActivityLogs(nextLogs);
    saveLocalRoomCache(roomCode, updated, maxPlayers, 'WAITING', nextLogs);

    if (isOnlineRoom && firebaseUser) {
      updateWaitingRoomInFirestore({
        roomCode,
        players: updated,
        status: 'WAITING',
        gameState: 'WAITING',
        maxPlayers,
        activityLogs: nextLogs,
      }).catch((err) => console.warn('Remove bot sync error:', err));
    }
  };

  // 2B. HAPUS SEMUA BOT DI WAITING ROOM
  const handleRemoveAllBotsInWaitingRoom = async () => {
    if (!isHost) return;
    const updated = removeAllBotsFromRoom(players);
    setPlayers(updated);

    const clearLog: ActivityLogItem = {
      id: `clear-bots-${Date.now()}`,
      text: `🗑️ Host menghapus semua Bot! Slot kosong kembali terbuka untuk teman (${updated.length}/${maxPlayers} Warga).`,
      type: 'info',
      timestamp: '00:07',
    };
    const nextLogs = [clearLog, ...activityLogs.slice(0, 30)];
    setActivityLogs(nextLogs);
    saveLocalRoomCache(roomCode, updated, maxPlayers, 'WAITING', nextLogs);

    if (isOnlineRoom && firebaseUser) {
      updateWaitingRoomInFirestore({
        roomCode,
        players: updated,
        status: 'WAITING',
        gameState: 'WAITING',
        maxPlayers,
        activityLogs: nextLogs,
      }).catch((err) => console.warn('Remove all bots sync error:', err));
    }
  };

  const handleChangeMaxPlayersInRoom = async (newCap: number) => {
    if (!isHost) return;
    setMaxPlayers(newCap);
    // Jika kapasitas diturunkan dan melebihi jumlah pemain saat ini, kurangi Bot dari urutan paling belakang
    let trimmed = [...players];
    while (trimmed.length > newCap && trimmed.some((p) => p.isBot)) {
      let lastBotIdx = -1;
      for (let i = trimmed.length - 1; i >= 0; i--) {
        if (trimmed[i].isBot) {
          lastBotIdx = i;
          break;
        }
      }
      if (lastBotIdx !== -1) {
        trimmed.splice(lastBotIdx, 1);
      } else {
        break;
      }
    }
    if (trimmed.length !== players.length) {
      setPlayers(trimmed);
    }
    if (screen === 'WAITING_ROOM') {
      saveLocalRoomCache(roomCode, trimmed, newCap, 'WAITING', activityLogs);
      if (isOnlineRoom && firebaseUser) {
        updateWaitingRoomInFirestore({
          roomCode,
          players: trimmed,
          status: 'WAITING',
          gameState: 'WAITING',
          maxPlayers: newCap,
          activityLogs,
        }).catch((err) => console.warn('Update maxPlayers sync error:', err));
      }
    }
  };

  const handleStartGameFromWaitingRoom = async () => {
    if (!isHost) return;
    rollLockRef.current = false;
    setHasRolledThisTurn(false);
    setTurnPhase('READY_TO_ROLL');
    setIsRolling(false);
    setIsMoving(false);
    setProperties(createInitialAppProperties());
    setTakdirDeck(shuffleDeck(TAKDIR_CARDS));
    setMusibahDeck(shuffleDeck(MUSIBAH_CARDS));
    setIsExtremeMusibahActive(false);
    setActivePlayerIndex(0);
    setRound(1);
    setStateTreasury(25_000_000);
    setTurnSeconds(60);

    const startLog: ActivityLogItem = {
      id: `start-${Date.now()}`,
      text: `🚀 Permainan dimulai di Room #${roomCode} dengan ${players.length} Warga! Timer 60 detik aktif.`,
      type: 'gain',
      timestamp: '00:01',
    };
    const nextLogs = [startLog, ...activityLogs.slice(0, 30)];
    setActivityLogs(nextLogs);

    if (isOnlineRoom && firebaseUser) {
      try {
        await updateWaitingRoomInFirestore({
          roomCode,
          players,
          status: 'PLAYING',
          gameState: 'PLAYING',
          maxPlayers,
          activityLogs: nextLogs,
        });
      } catch (err) {
        console.warn('Start room sync warning:', err);
      }
    }

    const targetScreen = resolveGameStartTargetScreen({
      introMovieEnabled,
    });
    setScreen(targetScreen);
    setGameState('playing');
    if (targetScreen === 'GAME' && players[0]) {
      triggerTurnTransition(players[0], 1);
    }
  };

  const handleFinishIntroMovie = useCallback(() => {
    setTurnSeconds(60);
    setScreen('GAME');
    setGameState('playing');
    if (isOnlineRoom) {
      // Host tetap menjadi pemilik giliran pertama. Guest cukup masuk ke papan;
      // transisi giliran akan mengikuti snapshot Host agar tidak tampil ganda.
      if (isHost) {
        const openingPlayer = players[activePlayerIndex] || players[0];
        if (openingPlayer) {
          triggerTurnTransition(openingPlayer, Math.max(1, round));
        }
      }
      return;
    }
    if (players[0]) {
      triggerTurnTransition(players[0], 1);
    }
  }, [
    players,
    activePlayerIndex,
    round,
    isOnlineRoom,
    isHost,
    triggerTurnTransition,
  ]);

  const handleUploadIntroMovie = useCallback(
    async (file: File) => {
      const saved = await saveCustomIntroMovieToIDB(file);
      const nextAssets: CustomImageAssets = {
        ...customAssets,
        introMovieUrl: saved.blobUrl,
        introMovieFilename: saved.cleanFilename,
        introMovieOriginalFilename: saved.originalFilename,
      };
      setCustomAssets(nextAssets);
      saveCustomAssetsToStorage(nextAssets);
      showQuickBanner(
        saved.wasRenamed
          ? `🎬 Video "${saved.originalFilename}" otomatis di-rename menjadi "${saved.cleanFilename}" & siap diputar!`
          : `🎬 Video "${saved.cleanFilename}" berhasil disimpan & siap diputar!`
      );
    },
    [customAssets, showQuickBanner]
  );

  const handleRemoveIntroMovie = useCallback(async () => {
    await clearCustomIntroMovieFromIDB();
    const nextAssets: CustomImageAssets = {
      ...customAssets,
      introMovieUrl: null,
      introMovieFilename: DEFAULT_INTRO_MOVIE_FILENAME,
      introMovieOriginalFilename: null,
    };
    setCustomAssets(nextAssets);
    saveCustomAssetsToStorage(nextAssets);
    showQuickBanner(
      `🎬 Video dikembalikan ke movie standar (${DEFAULT_INTRO_MOVIE_FILENAME}).`
    );
  }, [customAssets, showQuickBanner]);

  // Restart full simulation
  const handleRestartGame = useCallback(() => {
    // Online: hanya Host yang boleh me-restart seluruh room (tamunya tidak).
    if (isOnlineRoom && !isHost) return;
    if (landingPauseTimerRef.current) {
      clearTimeout(landingPauseTimerRef.current);
      landingPauseTimerRef.current = null;
    }
    // Batalkan semua penjadwalan maju giliran yang masih tertunda.
    pendingTurnAdvanceTimersRef.current.forEach((timer) => clearTimeout(timer));
    pendingTurnAdvanceTimersRef.current.clear();
    rollLockRef.current = false;
    setHasRolledThisTurn(false);
    setTurnPhase('READY_TO_ROLL');
    setIsRolling(false);
    setIsMoving(false);
    setIsLandingPause(false);
    setJustLandedTileId(null);
    dismissTurnTransition();
    setHoveredPlayer(null);
    setHoveredTile(null);
    setGameOverReason('');
    setFloatingTexts([]);
    setPlayerCardBadges({});
    setPlayers((prev) =>
      prev.map((p, idx) =>
        createPlayerFromAvatar({
          id: idx,
          name: p.name,
          avatarId:
            p.avatarId ||
            AVATAR_CHARACTERS[idx % AVATAR_CHARACTERS.length].id,
          uid: p.uid,
          isHost: p.isHost,
          isBot: p.isBot,
        })
      )
    );
    setProperties(createInitialAppProperties());
    setTakdirDeck(shuffleDeck(TAKDIR_CARDS));
    setMusibahDeck(shuffleDeck(MUSIBAH_CARDS));
    setIsExtremeMusibahActive(false);
    setActivePlayerIndex(0);
    setRound(1);
    setStateTreasury(25_000_000);
    setDice([4, 2]);
    setExtraDie(null);
    setKhodamAppliedOnRoll(0);
    setAwaitingDukunConfirm(false);
    setPendingDoublesTakdir(false);
    setStartUpgradeBanner(false);
    setTurnSeconds(60);
    setActiveFateCard(null);
    setFateDiceResult(null);
    setShowBuyUpgradeModal(false);
    setShowGiveMoneyModal(false);
    setShowAskMoneyModal(false);
    setPendingMoneyRequest(null);
    setShowTollModal(false);
    setShowCourtModal(false);
    setShowJailModal(false);
    setShowPremiumCellModal(false);
    setSelectedCardToUse(null);
    setShowDukunModal(false);
    setPendingDebtObligation(null);
    setPendingLoanProposal(null);
    pendingRequestWriteAtRef.current = Date.now();
    setLoans([]);
    setShowLoanManagerModal(false);
    setSelectedTileModal(null);
    setGameState('playing');
    addLog(
      `🔄 Permainan di Room #${roomCode} diulang dari awal! Semua warga kembali bermodal Rp10 Jt & 10 Kartu Simpanan.`,
      'info'
    );
  }, [addLog, roomCode, isOnlineRoom, isHost]);

  // Fullscreen API sync & toggle handler
  useEffect(() => {
    const onFullscreenChange = () => {
      const docAny = document as Document & {
        webkitFullscreenElement?: Element | null;
      };
      const activeFs = Boolean(
        document.fullscreenElement || docAny.webkitFullscreenElement
      );
      setIsFullscreen(activeFs);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, []);

  // FASE 5: Deteksi Otomatis Transaksi Uang (+Rp1 Jt / -Rp500 Rb) untuk Animasi Uang Melayang (Floating Text)
  // Maksimal 2 notifikasi terbaru di tengah atas (otomatis hilang 2000ms) & badge kartu pemain kiri (otomatis hilang 2500ms)
  useEffect(() => {
    return () => {
      floatingTimersRef.current.forEach((tId) => clearTimeout(tId));
      floatingTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!prevMoneyMapRef.current) {
      const initialMap: Record<number, number> = {};
      players.forEach((p) => {
        initialMap[p.id] = p.money;
      });
      prevMoneyMapRef.current = initialMap;
      return;
    }

    const prevMap = prevMoneyMapRef.current;
    const newItems: FloatingMoneyItem[] = [];
    const nextMap: Record<number, number> = {};

    players.forEach((p) => {
      nextMap[p.id] = p.money;
      const oldMoney = prevMap[p.id];
      if (typeof oldMoney === 'number' && p.money !== oldMoney) {
        const delta = p.money - oldMoney;
        // Abaikan jika ini reset massal ke 10 Jt
        if (
          Math.abs(delta) > 0 &&
          !(p.money === 10_000_000 && p.position === 0 && round === 1)
        ) {
          const isPositive = delta > 0;
          newItems.push({
            id: `float-${p.id}-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 6)}`,
            playerId: p.id,
            playerName: p.name.split(' ')[0],
            delta,
            text: `${isPositive ? '+' : '-'}${formatRupiah(Math.abs(delta))}`,
            isPositive,
          });
        }
      }
    });

    prevMoneyMapRef.current = nextMap;

    if (newItems.length > 0 && screen === 'GAME') {
      // Batasi maksimal hanya 2 notifikasi terbaru di layar tengah
      setFloatingTexts((prev) => [...prev, ...newItems].slice(-2));

      // Update badge perubahan uang terakhir pada kartu pemain di panel kiri
      setPlayerCardBadges((prev) => {
        const nextBadges = { ...prev };
        newItems.forEach((item) => {
          nextBadges[item.playerId] = item;
        });
        return nextBadges;
      });

      // a) Hapus otomatis setiap item floating text setelah 2000ms (2 detik) tanpa dibatalkan oleh re-render players
      newItems.forEach((item) => {
        const centerTimerId = window.setTimeout(() => {
          floatingTimersRef.current.delete(centerTimerId);
          setFloatingTexts((prev) => prev.filter((it) => it.id !== item.id));
        }, 2000);
        floatingTimersRef.current.add(centerTimerId);

        // c) Hapus otomatis badge perubahan uang pada kartu pemain di panel kiri setelah 2500ms (2.5 detik)
        const cardTimerId = window.setTimeout(() => {
          floatingTimersRef.current.delete(cardTimerId);
          setPlayerCardBadges((prev) => {
            if (prev[item.playerId]?.id === item.id) {
              const copy = { ...prev };
              delete copy[item.playerId];
              return copy;
            }
            return prev;
          });
        }, 2500);
        floatingTimersRef.current.add(cardTimerId);
      });
    }
  }, [players, screen, round]);

  const handleToggleFullscreen = useCallback(async () => {
    const docAny = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    const elemAny = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };

    const currentlyFull = Boolean(
      document.fullscreenElement || docAny.webkitFullscreenElement
    );

    if (currentlyFull || isFullscreen) {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (docAny.webkitExitFullscreen) {
          await docAny.webkitExitFullscreen();
        }
      } catch {
        // Fallback if exited in restricted frame
      }
      setIsFullscreen(false);
      showQuickBanner('Keluar dari Mode Layar Penuh (Full Screen).');
    } else {
      try {
        if (elemAny.requestFullscreen) {
          await elemAny.requestFullscreen();
        } else if (elemAny.webkitRequestFullscreen) {
          await elemAny.webkitRequestFullscreen();
        }
        setIsFullscreen(true);
        showQuickBanner('🖥️ Mode Layar Penuh (Full Screen) Aktif! Tekan [F] atau [Esc] untuk keluar.');
      } catch {
        // Fallback state when browser iframe policy restricts native fullscreen
        setIsFullscreen((prev) => !prev);
        showQuickBanner('🖥️ Mode Fokus Layar Penuh Aktif!');
      }
    }
  }, [isFullscreen, showQuickBanner]);

  // Keyboard shortcuts
  const stateRef = useRef({
    screen,
    gameState,
    handleRollDice,
    handleRestartGame,
    handleToggleFullscreen,
  });
  stateRef.current = {
    screen,
    gameState,
    handleRollDice,
    handleRestartGame,
    handleToggleFullscreen,
  };

  const handleToggleFollowCamera = useCallback(() => {
    setIsFollowCamera((prev) => {
      const next = !prev;
      showQuickBanner(
        next
          ? '🎥 Kamera Follow Karakter: ON! Papan otomatis zoom & mengikuti giliran pemain.'
          : '🎥 Kamera Follow Karakter: OFF (Kamera Normal / Bebas).'
      );
      return next;
    });
  }, [showQuickBanner]);

  const handleSetHudMode = useCallback(
    (nextMode: HudLayoutMode) => {
      setHudMode(nextMode);
      if (nextMode === 'MINIMAL') {
        setCollapsedPanels({
          players: true,
          cards: true,
          logs: true,
          actions: false,
        });
        showQuickBanner(
          '✨ Mode Minimalis Aktif! Panel samping & log diringkas agar papan lebih lega.'
        );
      } else if (nextMode === 'HIDDEN') {
        showQuickBanner(
          '👁️ Menu Disembunyikan! Jendela game bersih fokus ke papan (Tekan [H] untuk kembali).'
        );
      } else {
        setCollapsedPanels({
          players: false,
          cards: false,
          logs: false,
          actions: false,
        });
        showQuickBanner('🖥️ Mode Menu Lengkap (Full HUD) Aktif!');
      }
    },
    [showQuickBanner]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'KeyF') {
        e.preventDefault();
        stateRef.current.handleToggleFullscreen();
        return;
      }

      if (stateRef.current.screen !== 'GAME') {
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        setGameState((prev) => (prev === 'paused' ? 'playing' : 'paused'));
      } else if (e.code === 'KeyV') {
        setIsIsometric((prev) => !prev);
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        handleToggleFollowCamera();
      } else if (e.code === 'KeyH') {
        e.preventDefault();
        setHudMode((prev) => {
          const next = cycleHudLayoutMode(prev);
          if (next === 'MINIMAL') {
            setCollapsedPanels({
              players: true,
              cards: true,
              logs: true,
              actions: false,
            });
          } else if (next === 'FULL') {
            setCollapsedPanels({
              players: false,
              cards: false,
              logs: false,
              actions: false,
            });
          }
          return next;
        });
      } else if (e.code === 'KeyM') {
        setIsMuted((prev) => {
          soundFX.muted = !prev;
          return !prev;
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleToggleFollowCamera]);

  const formattedTimer = `00:${String(turnSeconds).padStart(2, '0')}`;
  const alivePlayersCount = players.filter(
    (p) => p.status !== 'BANGKRUT'
  ).length;

  const currentTileObj = BOARD_TILES.find(
    (t) => t.id === activePlayer.position
  );
  const currentPropObj =
    currentTileObj?.type === 'PROPERTY'
      ? properties[currentTileObj.id]
      : undefined;
  const isStandingOnUnownedProperty = Boolean(
    currentTileObj?.type === 'PROPERTY' &&
      currentPropObj &&
      currentPropObj.ownerId === null &&
      !currentPropObj.isSeizedByState
  );

  const hasKhodamInHand =
    activePlayer.khodamBoost ||
    activePlayer.savedCards.some((c) => c.key === 'KHODAM');
  const activePlayerDebtCount = loans.filter(
    (l) => l.borrowerId === activePlayer.id && l.remainingDue > 0
  ).length;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#2b1508] font-['Plus_Jakarta_Sans',sans-serif] select-none">
      {/* 1. CENTRAL 2.5D ISOMETRIC BOARD VIEWPORT */}
      <IsometricBoard
        isIsometric={isIsometric}
        isTitleScreen={screen !== 'GAME'}
        players={players}
        activePlayerIndex={activePlayerIndex}
        properties={properties}
        dice={dice}
        extraDie={extraDie}
        khodamBonus={khodamAppliedOnRoll}
        isExtremeMusibahActive={isExtremeMusibahActive}
        awaitingDukunConfirm={awaitingDukunConfirm}
        onOpenDukunModal={() => setShowDukunModal(true)}
        onProceedWithoutDukun={() =>
          executePawnHopMovement(
            dice[0],
            dice[1],
            extraDie,
            khodamAppliedOnRoll,
            pendingRollFreedFromJail
          )
        }
        isRolling={isRolling}
        isMoving={isMoving}
        diceQuip={diceQuip}
        stateTreasury={stateTreasury}
        selectedTile={selectedTileModal}
        onSelectTile={(tile) => setSelectedTileModal(tile)}
        onRollDice={() => handleRollDice(false)}
        customAssets={customAssets}
        justLandedTileId={justLandedTileId}
        onHoverTile={handleHoverTile}
        onHoverPlayer={handleHoverPlayer}
        isFollowCamera={isFollowCamera}
        onToggleFollowCamera={handleToggleFollowCamera}
        hudMode={hudMode}
        isTurnTransitioning={Boolean(turnTransition && !turnTransitionExiting)}
        canRoll={
          !hasRolledThisTurn &&
          turnPhase === 'READY_TO_ROLL' &&
          !activePlayer.isBot &&
          !isRolling &&
          !isMoving &&
          !isLandingPause &&
          screen === 'GAME' &&
          gameState === 'playing'
        }
      />

      {/* EFEK TRANSISI VISUAL PERGANTIAN GILIRAN PEMAIN (SEMI-TRANSPARENT BOARD FADE & PLAYER TURN BANNER) */}
      {turnTransition && screen === 'GAME' && gameState === 'playing' && (
        <div
          data-testid="turn-transition-overlay"
          onClick={dismissTurnTransition}
          className={`fixed inset-0 z-40 flex items-center justify-center px-4 transition-opacity duration-300 cursor-pointer ${
            turnTransitionExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{
            background: `radial-gradient(circle at 50% 48%, ${turnTransition.color}45 0%, rgba(18, 8, 3, 0.76) 55%, rgba(8, 3, 1, 0.88) 100%)`,
            backdropFilter: 'blur(3.5px)',
          }}
          title="Klik di mana saja untuk langsung mulai bermain"
        >
          <div
            data-testid="turn-transition-card"
            className={`relative w-full max-w-md rounded-3xl bg-[#1c0c04]/95 border-2 border-amber-400 text-amber-50 shadow-[0_24px_60px_rgba(0,0,0,0.92)] overflow-hidden transition-all duration-300 ${
              turnTransitionExiting
                ? 'scale-95 -translate-y-2 opacity-0'
                : 'animate-turn-banner-in scale-100 translate-y-0 opacity-100'
            }`}
          >
            {/* Top Color Ribbon */}
            <div
              className="h-2 w-full"
              style={{ backgroundColor: turnTransition.color }}
            />

            <div className="p-4 sm:p-5 flex flex-col items-center text-center">
              {/* Top Meta Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-300 font-mono font-black text-[10px] tracking-wider uppercase">
                  🔄 PUTARAN {turnTransition.round} • PERGANTIAN GILIRAN
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase border ${
                    turnTransition.isBot
                      ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                      : 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                  }`}
                >
                  {turnTransition.isBot ? '🤖 BOT OTOMATIS' : '🧑 WARGA ASLI'}
                </span>
              </div>

              {turnTransition.previousPlayerName && (
                <div className="text-[11px] font-bold text-amber-200/75 mb-2">
                  Giliran <span className="text-amber-100 font-black">{turnTransition.previousPlayerName}</span> selesai ➔ Selanjutnya:
                </div>
              )}

              {/* Avatar Spotlight */}
              <div className="relative my-1.5">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl border-4 border-white shadow-[0_0_28px_rgba(251,191,36,0.45)] overflow-hidden"
                  style={{ backgroundColor: turnTransition.color }}
                >
                  {(() => {
                    const pawnImgUrl = getPawnAvatarImageUrl(
                      turnTransition.avatarId,
                      customAssets
                    );
                    return pawnImgUrl ? (
                      <img
                        src={pawnImgUrl}
                        alt={turnTransition.playerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{turnTransition.avatarEmoji}</span>
                    );
                  })()}
                </div>
                <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 font-mono font-black text-[10px] border border-stone-950 shadow">
                  #{turnTransition.playerId + 1}
                </span>
              </div>

              {/* Headline & Player Name */}
              <div className="mt-2 text-[10px] sm:text-xs font-black tracking-[0.2em] text-amber-400 uppercase">
                ⚡ {turnTransition.headline} ⚡
              </div>
              <h2
                data-testid="turn-transition-player-name"
                className="mt-0.5 text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
              >
                {turnTransition.playerName}
              </h2>
              <div className="text-xs font-bold text-amber-200/90 mt-0.5">
                {turnTransition.avatarRole}
              </div>

              {/* Player Position, Cash & Status Strip */}
              <div className="mt-3 w-full grid grid-cols-3 gap-1.5 bg-stone-950/80 border border-amber-700/50 rounded-2xl p-2 text-left">
                <div className="px-2 py-1 rounded-xl bg-stone-900/80">
                  <div className="text-[9px] font-bold text-amber-300/70 uppercase">
                    Lokasi Petak
                  </div>
                  <div className="text-[11px] font-black text-white truncate">
                    #{turnTransition.tileId} {turnTransition.tileName}
                  </div>
                </div>
                <div className="px-2 py-1 rounded-xl bg-stone-900/80">
                  <div className="text-[9px] font-bold text-amber-300/70 uppercase">
                    Saldo Tunai
                  </div>
                  <div className="text-[11px] font-mono font-black text-emerald-400 truncate">
                    {turnTransition.moneyFormatted}
                  </div>
                </div>
                <div className="px-2 py-1 rounded-xl bg-stone-900/80">
                  <div className="text-[9px] font-bold text-amber-300/70 uppercase">
                    Status Warga
                  </div>
                  <div className="text-[10px] font-black text-amber-300 truncate">
                    {turnTransition.statusLabel}
                  </div>
                </div>
              </div>

              {/* Action Subheadline */}
              <p className="mt-2.5 text-[11px] sm:text-xs font-bold text-amber-100/90 leading-snug">
                {turnTransition.subheadline}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FASE 4: LOBBY & WAITING ROOM OVERLAYS */}
      {(screen === 'LOBBY' || screen === 'WAITING_ROOM') && (
        <LobbyAndWaitingRoom
          screen={screen}
          nickname={nickname}
          onChangeNickname={setNickname}
          selectedAvatarId={selectedAvatarId}
          onSelectAvatarId={setSelectedAvatarId}
          maxPlayers={maxPlayers}
          onChangeMaxPlayers={handleChangeMaxPlayersInRoom}
          durationMode={durationMode}
          onChangeDurationMode={(mode) => {
            setDurationMode(mode);
            const opt = DURATION_MODE_OPTIONS.find((m) => m.id === mode);
            if (opt) {
              showQuickBanner(`⏱️ Mode Durasi diatur ke: ${opt.label}`);
            }
          }}
          joinCodeInput={joinCodeInput}
          onChangeJoinCodeInput={setJoinCodeInput}
          roomCode={roomCode}
          players={players}
          isHost={isHost}
          isOnlineRoom={isOnlineRoom}
          firebaseUserEmail={firebaseUser?.email || null}
          firebaseUserName={firebaseUser?.displayName || null}
          lobbyError={lobbyError}
          isBusy={isLobbyBusy}
          onSignInGoogle={handleSignInGoogle}
          onSignOutGoogle={handleSignOutGoogle}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onQuickPlayLocal={handleQuickPlayLocal}
          onAddBots={handleAddBotsInWaitingRoom}
          onRemoveBot={handleRemoveBotInWaitingRoom}
          onRemoveAllBots={handleRemoveAllBotsInWaitingRoom}
          onStartGameFromWaitingRoom={handleStartGameFromWaitingRoom}
          onBackToLobby={() => setScreen('LOBBY')}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          customAssets={customAssets}
          onOpenCustomAssetsModal={() => setShowCustomAssetsModal(true)}
          onHoverPlayer={handleHoverPlayer}
          introMovieEnabled={introMovieEnabled}
          onToggleIntroMovieEnabled={() =>
            setIntroMovieEnabled((prev) => !prev)
          }
          onUploadIntroMovie={handleUploadIntroMovie}
          onPreviewIntroMovie={() => setScreen('INTRO_MOVIE')}
        />
      )}

      {/* FASE 9: OPENING MOVIE SCREEN (MUNCUL PERSIS SEBELUM MASUK KE GAME UTAMA) */}
      {screen === 'INTRO_MOVIE' && (
        <IntroMovieScreen
          players={players}
          roomCode={roomCode}
          durationMode={durationMode}
          customAssets={customAssets}
          onUploadIntroMovie={handleUploadIntroMovie}
          onFinishMovie={handleFinishIntroMovie}
        />
      )}

      {/* FLOATING NOTIFICATION TOAST BANNER */}
      {toastBanner && screen === 'GAME' && gameState === 'playing' && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-40 pointer-events-none max-w-[92vw] px-3.5 py-1.5 rounded-xl bg-amber-400 text-stone-950 font-black text-xs sm:text-sm text-center shadow-2xl border-2 border-white animate-bounce">
          {toastBanner}
        </div>
      )}

      {/* FASE 5: ANIMASI UANG MELAYANG (MAKSIMAL 2 NOTIFIKASI TERBARU, OTOMATIS HILANG 2 DETIK) */}
      {floatingTexts.length > 0 && screen === 'GAME' && (
        <div
          data-testid="floating-money-container"
          className="fixed top-28 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-1"
        >
          {floatingTexts.slice(-2).map((item) => (
            <div
              key={item.id}
              data-testid={`floating-money-${item.isPositive ? 'plus' : 'minus'}`}
              className={`px-2.5 py-1 rounded-full font-mono font-black text-xs sm:text-sm border border-white shadow-[0_6px_16px_rgba(0,0,0,0.65)] flex items-center gap-1 animate-bounce animate-float-fade ${
                item.isPositive
                  ? 'bg-emerald-500/95 text-stone-950'
                  : 'bg-rose-600/95 text-white'
              }`}
            >
              <span>{item.isPositive ? '💸' : '📉'}</span>
              <span>{item.playerName}:</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* 2. 2D HUD OVERLAY AROUND THE PERIMETER */}
      {screen === 'GAME' && hudMode === 'HIDDEN' && (
        <div
          data-testid="minimal-hidden-hud-bar"
          className="fixed inset-x-0 bottom-3 z-30 pointer-events-none flex items-center justify-center px-3"
        >
          <div className="pointer-events-auto flex flex-wrap items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#1c0c04]/95 border-2 border-amber-400/90 text-amber-50 shadow-[0_12px_32px_rgba(0,0,0,0.85)]">
            <div className="flex items-center gap-2 pr-2 border-r border-amber-700/70">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm border border-white shrink-0 overflow-hidden"
                style={{ backgroundColor: activePlayer.color }}
              >
                {(() => {
                  const pawnImgUrl = getPawnAvatarImageUrl(
                    activePlayer.avatarId,
                    customAssets
                  );
                  return pawnImgUrl ? (
                    <img
                      src={pawnImgUrl}
                      alt={activePlayer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    activePlayer.avatarEmoji
                  );
                })()}
              </span>
              <div className="leading-tight">
                <div className="text-[11px] font-black text-white flex items-center gap-1.5">
                  <span>{activePlayer.name.split(' ')[0]}</span>
                  <span className="font-mono text-emerald-400">
                    {formatRupiah(activePlayer.money)}
                  </span>
                </div>
                <div className="text-[9.5px] font-mono text-amber-300">
                  Putaran {round} · Petak #{activePlayer.position} · ⏱️ {formattedTimer}
                </div>
              </div>
            </div>

            {!hasRolledThisTurn && turnPhase === 'READY_TO_ROLL' && !activePlayer.isBot ? (
              <button
                type="button"
                disabled={turnControlsLocked}
                onClick={() => handleRollDice(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-black text-xs shadow cursor-pointer"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>LEMPAR DADU</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isRolling || isMoving || isLandingPause || turnControlsLocked}
                onClick={handleNextTurn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-stone-950 font-black text-xs shadow cursor-pointer"
              >
                <span>AKHIRI GILIRAN ➔</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleFollowCamera}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-black text-[11px] cursor-pointer ${
                isFollowCamera
                  ? 'bg-sky-500 text-stone-950 border-white'
                  : 'bg-amber-950 text-amber-200 border-amber-700'
              }`}
              title="Toggle Kamera Follow Karakter [C]"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{isFollowCamera ? 'Follow: ON' : 'Follow: OFF'}</span>
            </button>

            <button
              type="button"
              data-testid="restore-hud-btn"
              onClick={() => handleSetHudMode('FULL')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs border border-white shadow cursor-pointer"
              title="Tampilkan Kembali Menu Utama [H]"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>👁️ Tampilkan Menu</span>
            </button>
          </div>
        </div>
      )}

      {screen === 'GAME' && hudMode !== 'HIDDEN' && (
        <div className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between p-2 sm:p-4">
          {/* TOP ROW */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-1.5">
              {/* KIRI ATAS: Tombol Kembali ke Lobby, Room Badge, Putaran Game, Toggle 3D/2D & Kamera Follow */}
              <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setScreen('LOBBY')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#271206]/95 hover:bg-amber-950 border-2 border-amber-500/80 text-amber-200 font-black text-[11px] shadow-lg cursor-pointer shrink-0"
                  title="Kembali ke Lobby & Pilih Avatar"
                >
                  <Home className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lobby</span>
                </button>

                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#271206]/95 border-2 border-amber-500/80 text-amber-50 shadow-lg">
                  <div>
                    <div className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-amber-300 font-bold leading-none">
                      <span>Room: #{roomCode}</span>
                      {isOnlineRoom && (
                        <Cloud className="w-3 h-3 text-emerald-400 inline" />
                      )}
                    </div>
                    <div
                      data-testid="hud-round-display"
                      className="text-xs sm:text-sm font-black tracking-tight text-white tabular-nums mt-0.5"
                    >
                      Putaran {round}
                      {durationMode === 'FAST_10'
                        ? ' / 10'
                        : durationMode === 'FAST_15'
                        ? ' / 15'
                        : ''}
                    </div>
                  </div>
                  <div className="h-5 w-[1px] bg-amber-700/70" />
                  <div className="text-[11px] font-bold text-amber-200">
                    <span className="text-amber-400 font-extrabold">
                      #{activePlayer.position}{' '}
                      {activePlayer.position === BEKASI_TILE_ID
                        ? 'BEKASI'
                        : BOARD_TILES[activePlayer.position]?.name}
                    </span>
                  </div>
                </div>

                {/* Mode Durasi Cepat Selector Button in HUD */}
                <button
                  type="button"
                  data-testid="hud-duration-mode-btn"
                  onClick={() => {
                    if (isOnlineRoom && !isHost) {
                      showQuickBanner(
                        '⏱️ Hanya Host yang bisa mengganti Mode Durasi di room online.'
                      );
                      return;
                    }
                    const idx = DURATION_MODE_OPTIONS.findIndex(
                      (m) => m.id === durationMode
                    );
                    const nextOpt =
                      DURATION_MODE_OPTIONS[
                        (idx + 1) % DURATION_MODE_OPTIONS.length
                      ];
                    setDurationMode(nextOpt.id);
                    showQuickBanner(
                      `⏱️ Mode Durasi diubah ke: ${nextOpt.label}`
                    );
                  }}
                  title="Klik untuk mengganti Mode Durasi Permainan (Kilat 10 Ronde / Cepat 15 Ronde / Target Rp25 Jt / Klasik)"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-950/95 hover:bg-emerald-900 border-2 border-emerald-400/90 text-emerald-200 font-black text-[11px] shadow-lg cursor-pointer shrink-0"
                >
                  <Timer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {DURATION_MODE_OPTIONS.find((m) => m.id === durationMode)
                      ?.shortLabel || '⏱️ Cepat 15 Ronde'}
                  </span>
                </button>

                {/* Camera Angle Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setIsIsometric((prev) => !prev);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 text-stone-950 font-black text-[11px] shadow-[0_3px_0_#b45309] transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isIsometric ? (
                    <>
                      <Layers className="w-3.5 h-3.5 shrink-0" />
                      <span>3D / 2D</span>
                    </>
                  ) : (
                    <>
                      <Box className="w-3.5 h-3.5 shrink-0" />
                      <span>2D / 3D</span>
                    </>
                  )}
                </button>

                {/* Camera Follow Active Character Toggle Button */}
                <button
                  type="button"
                  data-testid="hud-follow-camera-btn"
                  onClick={handleToggleFollowCamera}
                  title="Otomatis zoom & arahkan kamera mengikuti karakter yang sedang giliran bermain [C]"
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border-2 font-black text-[11px] shadow-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isFollowCamera
                      ? 'bg-sky-400 hover:bg-sky-300 text-stone-950 border-white shadow-[0_0_16px_rgba(56,189,248,0.75)]'
                      : 'bg-[#271206]/95 hover:bg-amber-950 text-sky-200 border-sky-500/80'
                  }`}
                >
                  <Crosshair
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isFollowCamera ? 'text-stone-950' : 'text-sky-400'
                    }`}
                  />
                  <span>
                    {isFollowCamera ? '🎥 Follow: ON' : '🎥 Follow Karakter'}
                  </span>
                </button>
              </div>

              {/* KANAN ATAS: Mode Minimalis / Hide Menu + Auto-Bot Toggle + Utility Controls */}
              <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
                {/* Toggle Mode Minimalis vs Menu Penuh */}
                <button
                  type="button"
                  data-testid="hud-layout-mode-btn"
                  onClick={() =>
                    handleSetHudMode(hudMode === 'MINIMAL' ? 'FULL' : 'MINIMAL')
                  }
                  title="Ubah tampilan antara Mode Minimalis (Layar Bersih) dan Menu Lengkap [H]"
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border-2 font-black text-[11px] shadow-lg cursor-pointer whitespace-nowrap ${
                    hudMode === 'MINIMAL'
                      ? 'bg-amber-300 hover:bg-amber-200 text-stone-950 border-white shadow-[0_0_14px_rgba(252,211,77,0.7)]'
                      : 'bg-[#271206]/95 hover:bg-amber-950 text-amber-200 border-amber-500/80'
                  }`}
                >
                  <LayoutTemplate className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {hudMode === 'MINIMAL'
                      ? '✨ Minimalis: ON'
                      : '✨ Mode Minimalis'}
                  </span>
                </button>

                {/* Tombol Sembunyikan Semua Menu (Fokus Papan Bersih) */}
                <button
                  type="button"
                  data-testid="hud-quick-hide-btn"
                  onClick={() => handleSetHudMode('HIDDEN')}
                  title="Sembunyikan semua menu agar papan permainan terlihat paling bersih [H]"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#271206]/95 hover:bg-amber-900 border border-amber-500/80 text-amber-200 font-black text-[11px] shadow cursor-pointer whitespace-nowrap"
                >
                  <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Hide Menu</span>
                </button>

                {hudMode === 'FULL' && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setAutoBotFastMode((prev) => {
                          const next = !prev;
                          showQuickBanner(
                            next
                              ? '🤖 Auto-Jalan Bot Diaktifkan! Bot otomatis jalan cepat tanpa tunggu 60 detik.'
                              : '🤖 Auto-Jalan Bot Dimatikan (Mengikuti Timer 60 Detik).'
                          );
                          return next;
                        })
                      }
                      className={`hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-black text-[10.5px] shadow cursor-pointer ${
                        autoBotFastMode
                          ? 'bg-emerald-700 border-emerald-300 text-white'
                          : 'bg-[#271206]/95 border-amber-700/80 text-amber-200 hover:bg-amber-950'
                      }`}
                      title="Otomatis jalankan giliran Bot WNI secara cepat"
                    >
                      <Bot className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>{autoBotFastMode ? 'Auto-Bot: ON' : 'Auto-Bot: 60s'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExtremeMusibahActive((prev) => {
                          const next = !prev;
                          setMusibahDeck(
                            shuffleDeck(
                              next
                                ? [...MUSIBAH_CARDS, ...EXTREME_MUSIBAH_CARDS]
                                : MUSIBAH_CARDS
                            )
                          );
                          showQuickBanner(
                            next
                              ? '🔥 MUSIBAH EKSTREM AKTIF! Kartu denda 2x & sita aset masuk dek!'
                              : 'Mode Musibah Standar.'
                          );
                          return next;
                        });
                      }}
                      className={`hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-black text-[10.5px] shadow cursor-pointer ${
                        isExtremeMusibahActive
                          ? 'bg-red-700 border-amber-300 text-white animate-pulse'
                          : 'bg-[#271206]/95 border-amber-700/80 text-amber-300 hover:bg-amber-950'
                      }`}
                      title="Otomatis aktif saat semua WNI lewat START ≥2x (Klik untuk tes langsung)"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>
                        {isExtremeMusibahActive
                          ? '🔥 MUSIBAH EKSTREM!'
                          : 'Eskalasi: START ≥2x'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCustomAssetsModal(true)}
                      data-testid="game-custom-assets-btn"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 border border-purple-300 text-white font-black text-[10.5px] shadow cursor-pointer whitespace-nowrap"
                      title="🎨 Ganti Gambar Pion & Bangunan (Upload File Langsung)"
                    >
                      <Palette className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                      <span>🎨 Ganti Gambar</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setIsMuted((prev) => {
                      soundFX.muted = !prev;
                      return !prev;
                    });
                  }}
                  className="p-2 sm:p-2.5 rounded-xl bg-[#271206]/95 hover:bg-amber-900 border border-amber-600/70 text-amber-200 shadow cursor-pointer"
                  title="Suara [M]"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Panduan dan Jeda Permainan"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setGameState('paused');
                  }}
                  className="p-2 sm:p-2.5 rounded-xl bg-[#271206]/95 hover:bg-amber-900 border border-amber-600/70 text-amber-200 shadow cursor-pointer"
                  title="Aturan & Pause [P / Esc]"
                >
                  <Pause className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Ulang Permainan"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleRestartGame();
                  }}
                  className="p-2 sm:p-2.5 rounded-xl bg-[#271206]/95 hover:bg-amber-900 border border-amber-600/70 text-amber-200 shadow cursor-pointer"
                  title="Ulang Simulasi"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={
                    isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'
                  }
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleToggleFullscreen();
                  }}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 text-stone-950 font-black text-[11px] sm:text-xs shadow-[0_3px_0_#b45309] cursor-pointer whitespace-nowrap"
                  title="Layar Penuh (Full Screen) [F]"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline">Keluar Full</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline">Full Screen</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* MOBILE-ONLY COMPACT PLAYER STRIP & SAVED CARDS BAR (< 768px) */}
            {!collapsedPanels.players && (
              <div className="md:hidden pointer-events-auto flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  {players.map((p, idx) => {
                    const isTurn = idx === activePlayerIndex;
                    return (
                      <div
                        key={p.id}
                        data-testid={`mobile-player-card-${p.id}`}
                        data-hover-popup-anchor="true"
                        onMouseEnter={(e) =>
                          handleHoverPlayer(p, e.clientX, e.clientY)
                        }
                        onMouseMove={(e) =>
                          handleHoverPlayer(p, e.clientX, e.clientY)
                        }
                        onMouseLeave={() => handleHoverPlayer(null)}
                        className={`p-1.5 rounded-lg text-left transition-all shrink-0 w-24 cursor-pointer ${
                          isTurn
                            ? 'bg-[#361907] border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]'
                            : 'bg-[#210f04]/90 border border-amber-900/70 opacity-85'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="w-5 h-5 rounded-md flex items-center justify-center text-xs border border-white overflow-hidden"
                            style={{ backgroundColor: p.color }}
                          >
                            {(() => {
                              const pawnImgUrl = getPawnAvatarImageUrl(
                                p.avatarId,
                                customAssets
                              );
                              return pawnImgUrl ? (
                                <img
                                  src={pawnImgUrl}
                                  alt={p.name}
                                  className="w-full h-full object-contain"
                                  style={{ backgroundColor: p.color }}
                                />
                              ) : (
                                p.avatarEmoji
                              );
                            })()}
                          </span>
                          {isTurn && (
                            <span className="px-1 rounded bg-yellow-400 text-stone-950 text-[7.5px] font-black">
                              GILIRANMU
                            </span>
                          )}
                        </div>
                        <div className="text-[9.5px] font-bold text-white truncate mt-0.5">
                          {p.name.split(' ')[0]}
                        </div>
                        <div className="text-[9.5px] font-mono font-black text-emerald-400 tabular-nums">
                          {formatRupiah(p.money)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!collapsedPanels.cards && (
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                    <span className="text-[9px] font-black uppercase text-amber-300 shrink-0 px-1">
                      10 Kartu:
                    </span>
                    {activePlayer.savedCards.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedCardToUse(card)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#271206]/95 border border-amber-600/70 text-white text-[10px] font-bold whitespace-nowrap shrink-0"
                      >
                        <span>{card.emoji}</span>
                        <span>{card.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MIDDLE ROW (DESKTOP >= 768px): Kiri Samping (Daftar Pemain) & Kanan Samping (10 Kartu Simpanan) */}
          <div className="hidden md:flex items-center justify-between gap-2 my-auto">
            {/* KIRI SAMPING: Daftar Pemain (Bisa Diringkas / Di-minimize) */}
            {collapsedPanels.players ? (
              <button
                type="button"
                data-testid="expand-players-panel-btn"
                onClick={() =>
                  setCollapsedPanels((prev) => ({ ...prev, players: false }))
                }
                className="pointer-events-auto flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-[#1c0c04]/95 hover:bg-amber-950 border-2 border-amber-500/85 text-amber-100 shadow-xl cursor-pointer transition-all"
                title="Klik untuk membuka kembali Panel Daftar Pemain WNI"
              >
                <Users className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] font-mono uppercase text-amber-300 font-bold">
                    Warga ({alivePlayersCount}/{players.length})
                  </div>
                  <div className="text-xs font-black text-white flex items-center gap-1">
                    {(() => {
                      const activePawnImg = getPawnAvatarImageUrl(
                        activePlayer.avatarId,
                        customAssets
                      );
                      return activePawnImg ? (
                        <img
                          src={activePawnImg}
                          alt={activePlayer.name}
                          className="w-4 h-4 rounded object-contain shrink-0"
                          style={{ backgroundColor: activePlayer.color }}
                        />
                      ) : (
                        <span>{activePlayer.avatarEmoji}</span>
                      );
                    })()}
                    <span>{activePlayer.name.split(' ')[0]}</span>
                    <span className="font-mono text-emerald-400">
                      {formatRupiah(activePlayer.money)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-300 ml-1" />
              </button>
            ) : (
              <aside
                aria-label="Daftar Pemain WNI"
                className="pointer-events-auto w-60 lg:w-64 rounded-2xl bg-[#1c0c04]/85 border-2 border-amber-600/75 p-2.5 shadow-xl flex flex-col gap-2"
              >
                <div className="flex items-center justify-between border-b border-amber-800/80 pb-1.5 px-1">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Warga ({players.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      Hidup: {alivePlayersCount}/{players.length}
                    </span>
                    <button
                      type="button"
                      data-testid="collapse-players-panel-btn"
                      onClick={() =>
                        setCollapsedPanels((prev) => ({ ...prev, players: true }))
                      }
                      aria-label="Sembunyikan Panel Daftar Pemain"
                      title="Sembunyikan / Ringkas Panel Warga"
                      className="px-1.5 py-0.5 rounded bg-amber-950/90 hover:bg-amber-800 border border-amber-600/70 text-[9.5px] font-black text-amber-200 flex items-center gap-0.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span>Hide</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[54vh] overflow-y-auto pr-1">
                  {players.map((p, idx) => {
                    const isTurn = idx === activePlayerIndex;
                    const ownedCount = Object.values(properties).filter(
                      (prop) => prop.ownerId === p.id && !prop.isSeizedByState
                    ).length;
                    const playerLoans = loans.filter(
                      (l) => l.borrowerId === p.id && l.remainingDue > 0
                    );
                    const hasUnusedWantimpres =
                      !p.wantimpresActive &&
                      p.savedCards.some((c) => c.key === 'WANTIMPRES');

                    const statusLabel =
                      p.status === 'DI_LAPAS'
                        ? '⛓️ Di Lapas'
                        : p.status === 'SEL_PREMIUM'
                        ? `👑 Sel Premium (${p.premiumTurnsLeft})`
                        : p.status === 'DI_BEKASI'
                        ? '🚀 Di Bekasi'
                        : p.status === 'BANGKRUT'
                        ? '💀 BANGKRUT'
                        : '✅ Normal';

                    return (
                      <div
                        key={p.id}
                        data-testid={`player-card-${p.id}`}
                        data-hover-popup-anchor="true"
                        onMouseEnter={(e) =>
                          handleHoverPlayer(p, e.clientX, e.clientY)
                        }
                        onMouseMove={(e) =>
                          handleHoverPlayer(p, e.clientX, e.clientY)
                        }
                        onMouseLeave={() => handleHoverPlayer(null)}
                        className={`relative rounded-xl p-2.5 transition-all cursor-pointer ${
                          isTurn
                            ? 'bg-[#361907]/95 border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.45)]'
                            : 'bg-[#210f04]/90 hover:bg-[#2b1406] border border-amber-900/80 hover:border-amber-500 opacity-90 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          {isTurn ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-400 text-stone-950 text-[10px] font-black uppercase tracking-wider shadow">
                              <Sparkles className="w-3 h-3 fill-stone-950" />
                              GILIRANMU
                            </div>
                          ) : (
                            <span className="text-[9px] font-mono text-amber-400/80">
                              #{idx + 1} · START: {p.startPassCount}x
                            </span>
                          )}

                          <div className="flex items-center gap-1">
                            {p.isBot && (
                              <span className="px-1 py-0.2 rounded bg-sky-950 border border-sky-600 text-sky-200 text-[8px] font-bold uppercase">
                                BOT
                              </span>
                            )}
                            {p.wantimpresActive && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-700 text-amber-200 text-[8.5px] font-black uppercase">
                                🏛️ Rp76,5Jt
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-base border-2 border-white shadow shrink-0 overflow-hidden"
                              style={{ backgroundColor: p.color }}
                            >
                              {(() => {
                                const pawnImgUrl = getPawnAvatarImageUrl(
                                  p.avatarId,
                                  customAssets
                                );
                                return pawnImgUrl ? (
                                  <img
                                    src={pawnImgUrl}
                                    alt={p.name}
                                    className="w-full h-full object-contain p-0.5"
                                    style={{ backgroundColor: p.color }}
                                  />
                                ) : (
                                  p.avatarEmoji
                                );
                              })()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-extrabold text-white truncate">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-amber-200/85 font-medium truncate">
                                {statusLabel} · {ownedCount} Tanah
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 relative">
                            <div className="text-xs sm:text-sm font-mono font-black text-emerald-400 tabular-nums">
                              {formatRupiah(p.money)}
                            </div>
                            <div className="text-[9.5px] font-mono text-amber-300/90 tabular-nums">
                              Petak #{p.position}
                            </div>
                            {playerCardBadges[p.id] && (
                              <span
                                key={playerCardBadges[p.id].id}
                                data-testid={`player-card-money-badge-${p.id}`}
                                className={`absolute -top-4 right-0 px-1.5 py-0.5 rounded-md font-mono font-black text-[10px] shadow-md border border-white animate-bounce whitespace-nowrap ${
                                  playerCardBadges[p.id].isPositive
                                    ? 'bg-emerald-500 text-stone-950'
                                    : 'bg-rose-600 text-white'
                                }`}
                              >
                                {playerCardBadges[p.id].text}
                              </span>
                            )}
                          </div>
                        </div>

                        {playerLoans.length > 0 && (
                          <div className="mt-1.5 px-2 py-0.5 rounded bg-rose-950/90 border border-rose-600/70 flex items-center justify-between text-[9.5px] text-rose-200 font-bold">
                            <span>
                              💸 Utang:{' '}
                              {formatRupiah(
                                playerLoans.reduce(
                                  (s, l) => s + l.remainingDue,
                                  0
                                )
                              )}
                            </span>
                            <span className="font-mono text-amber-300">
                              Tempo: {playerLoans[0].turnsLeft} Giliran
                            </span>
                          </div>
                        )}

                        {p.status === 'BANGKRUT' && hasUnusedWantimpres && (
                          <div className="mt-1 px-2 py-0.5 rounded bg-purple-950 border border-purple-500 text-[9px] font-bold text-purple-200">
                            🏛️ Wantimpres: Tersimpan di Inventori Akun
                          </div>
                        )}

                        {isTurn && p.status === 'DI_LAPAS' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowJailModal(true);
                            }}
                            className="mt-2 w-full py-1 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Unlock className="w-3 h-3" />
                            Pilihan Keluar Lapas / Sel Premium 👑
                          </button>
                        )}

                        {isTurn && p.status === 'SEL_PREMIUM' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPremiumCellModal(true);
                            }}
                            className="mt-2 w-full py-1 px-2 rounded-lg bg-gradient-to-r from-purple-500 to-amber-400 text-stone-950 font-black text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Crown className="w-3 h-3" />
                            Buka Menu VIP Sel Premium ({p.premiumTurnsLeft})
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </aside>
            )}

            {/* KANAN SAMPING: Panel "10 Kartu Simpanan" milik Pemain Aktif (Bisa Diringkas / Di-minimize) */}
            {collapsedPanels.cards ? (
              <button
                type="button"
                data-testid="expand-cards-panel-btn"
                onClick={() =>
                  setCollapsedPanels((prev) => ({ ...prev, cards: false }))
                }
                className="pointer-events-auto flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-[#271206]/95 hover:bg-amber-950 border-2 border-amber-500/85 text-amber-100 shadow-xl cursor-pointer transition-all"
                title="Klik untuk membuka kembali Panel Kartu Simpanan"
              >
                <ChevronLeft className="w-4 h-4 text-amber-300" />
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase text-amber-300 font-bold">
                    🃏 Kartu Simpanan ({activePlayer.savedCards.length})
                  </div>
                  <div className="text-xs font-black text-amber-400">
                    +{activePlayer.upgradeTokens} Hak Upgrade START
                  </div>
                </div>
              </button>
            ) : (
              <aside
                aria-label="Panel Kartu Simpanan"
                className="pointer-events-auto w-60 lg:w-64 rounded-2xl bg-[#271206]/95 border-2 border-amber-500/80 p-3 text-amber-50 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-amber-800/80 pb-2 mb-2">
                  <div>
                    <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">
                      KARTU SIMPANAN ({activePlayer.savedCards.length})
                    </h2>
                    <p className="text-[10px] text-amber-200/80 truncate">
                      Milik {activePlayer.name.split(' ')[0]} · +{activePlayer.upgradeTokens} Hak START
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid="collapse-cards-panel-btn"
                    onClick={() =>
                      setCollapsedPanels((prev) => ({ ...prev, cards: true }))
                    }
                    aria-label="Sembunyikan Panel Kartu Simpanan"
                    title="Sembunyikan / Ringkas Panel Kartu Simpanan"
                    className="px-1.5 py-0.5 rounded bg-amber-950/90 hover:bg-amber-800 border border-amber-600/70 text-[9.5px] font-black text-amber-200 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Hide</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                  {activePlayer.savedCards.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-950/60 text-center text-[11px] text-amber-300/70">
                      Semua Kartu Simpanan sudah terpakai! Ambil dari petak Takdir.
                    </div>
                  ) : (
                    activePlayer.savedCards.map((card) => {
                      const isWantimpresActive =
                        card.key === 'WANTIMPRES' && activePlayer.wantimpresActive;
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => setSelectedCardToUse(card)}
                          className={`w-full flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer group ${
                            isWantimpresActive
                              ? 'bg-purple-950/90 border-purple-400'
                              : 'bg-amber-950/85 hover:bg-amber-900 border-amber-700/70'
                          }`}
                        >
                          <span className="w-7 h-7 rounded-lg bg-black/40 flex items-center justify-center text-sm shrink-0 group-hover:scale-110 transition-transform">
                            {card.emoji}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[11px] font-extrabold text-white truncate">
                                {card.name}
                              </span>
                              {isWantimpresActive ? (
                                <span className="px-1 py-0.2 rounded bg-emerald-500 text-stone-950 text-[8px] font-black uppercase shrink-0">
                                  AKTIF Rp76,5Jt
                                </span>
                              ) : (
                                card.key === 'WANTIMPRES' && (
                                  <span className="px-1 py-0.2 rounded bg-amber-900 text-amber-200 text-[7.5px] font-mono shrink-0">
                                    Inventori Akun
                                  </span>
                                )
                              )}
                            </div>
                            <div className="text-[9px] text-amber-200/80 line-clamp-1">
                              {card.description}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>
            )}
          </div>

          {/* BOTTOM ROW: Kiri Bawah (Kotak Log Aktivitas) & Kanan Bawah (Timer 00:60 Otomatis + Tombol Aksi) */}
          <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-2">
            {/* KIRI BAWAH: Kotak Log Aktivitas Transparan (Bisa Diringkas / Di-minimize) */}
            {collapsedPanels.logs ? (
              <button
                type="button"
                data-testid="expand-logs-panel-btn"
                onClick={() =>
                  setCollapsedPanels((prev) => ({ ...prev, logs: false }))
                }
                className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#1a0c04]/95 hover:bg-amber-950 border border-amber-600/80 text-amber-100 shadow-xl cursor-pointer max-w-xs sm:max-w-sm"
                title="Klik untuk membuka kembali Log Aktivitas Warga +62"
              >
                <ScrollText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-bold text-amber-200 truncate">
                  {activityLogs[0]?.text || 'Log Aktivitas Warga +62'}
                </span>
                <ChevronUp className="w-3.5 h-3.5 text-amber-300 shrink-0 ml-auto" />
              </button>
            ) : (
              <section
                aria-label="Log Aktivitas Permainan"
                className="pointer-events-auto w-full md:w-80 lg:w-96 rounded-2xl bg-[#1a0c04]/90 border border-amber-700/70 p-2.5 sm:p-3 text-amber-50 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-amber-800/70 pb-1 mb-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-300">
                    <ScrollText className="w-3.5 h-3.5" />
                    <span>Log Aktivitas Warga +62</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-amber-300/80">
                      Live CCTV
                    </span>
                    <button
                      type="button"
                      data-testid="collapse-logs-panel-btn"
                      onClick={() =>
                        setCollapsedPanels((prev) => ({ ...prev, logs: true }))
                      }
                      aria-label="Sembunyikan Log Aktivitas"
                      title="Sembunyikan / Ringkas Log Aktivitas"
                      className="px-1.5 py-0.5 rounded bg-amber-950/90 hover:bg-amber-800 border border-amber-600/70 text-[9.5px] font-black text-amber-200 flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Hide</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 max-h-16 sm:max-h-28 overflow-y-auto pr-1 text-[11px] sm:text-xs">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-start gap-1.5 leading-snug ${
                        log.type === 'gain'
                          ? 'text-emerald-300'
                          : log.type === 'penalty'
                          ? 'text-rose-300'
                          : log.type === 'bekasi'
                          ? 'text-purple-300 font-bold'
                          : log.type === 'card'
                          ? 'text-sky-300'
                          : 'text-amber-100/90'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-amber-400/75 shrink-0 tabular-nums">
                        [{log.timestamp}]
                      </span>
                      <span>{log.text}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* KANAN BAWAH: Timer Mundur 00:60 Otomatis + Tombol Lempar + Khodam + Bayar Utang + Tombol Aksi */}
            <section
              aria-label="Panel Kontrol dan Aksi Giliran"
              className="pointer-events-auto flex flex-col items-stretch sm:items-end gap-1.5 sm:gap-2"
            >
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-1.5 sm:gap-2">
                {/* Tombol Ringkas / Buka Semua Tombol Aksi */}
                <button
                  type="button"
                  data-testid="collapse-actions-panel-btn"
                  onClick={() =>
                    setCollapsedPanels((prev) => ({
                      ...prev,
                      actions: !prev.actions,
                    }))
                  }
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#271206]/95 hover:bg-amber-900 border border-amber-600/70 text-[10px] font-black text-amber-200 shadow cursor-pointer"
                  title="Sembunyikan / Tampilkan tombol transaksi sekunder (Kasih Duit, Minta Duit, Utang)"
                >
                  {collapsedPanels.actions ? (
                    <>
                      <ChevronUp className="w-3 h-3 text-amber-400" />
                      <span>Tampilkan Aksi Lain</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 text-amber-400" />
                      <span>Ringkas Aksi</span>
                    </>
                  )}
                </button>

                {/* Tombol "Lempar + Khodam (+2)" jika punya Kartu Khodam & belum lempar dadu */}
                {hasKhodamInHand && !hasRolledThisTurn && turnPhase === 'READY_TO_ROLL' && (
                  <button
                    type="button"
                    disabled={
                      hasRolledThisTurn ||
                      turnPhase !== 'READY_TO_ROLL' ||
                      Boolean(activePlayer.isBot) ||
                      isRolling ||
                      isMoving
                    }
                    onClick={() => handleRollDice(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-300 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-black text-[11px] sm:text-xs shadow cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-stone-950" />
                    <span>Lempar + Khodam (+2)</span>
                  </button>
                )}

                {/* Tombol "Bayar Utang" */}
                {!collapsedPanels.actions && (
                  <button
                    type="button"
                    onClick={() => setShowLoanManagerModal(true)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-extrabold text-[11px] sm:text-xs shadow cursor-pointer ${
                      activePlayerDebtCount > 0
                        ? 'bg-rose-600 hover:bg-rose-500 border-amber-300 text-white animate-pulse'
                        : 'bg-[#271206]/95 hover:bg-amber-950 border-amber-600/70 text-amber-200'
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      Bayar Utang
                      {activePlayerDebtCount > 0
                        ? ` (${activePlayerDebtCount})`
                        : ''}
                    </span>
                  </button>
                )}

                {/* Timer 60 Detik Otomatis */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-xl border-2 text-white shadow ${
                    turnSeconds <= 10
                      ? 'bg-rose-950/95 border-rose-400 animate-pulse'
                      : 'bg-[#271206]/95 border-amber-500/80'
                  }`}
                  title="Jika 60 detik habis, dadu otomatis dilempar & giliran pindah otomatis!"
                >
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span className="text-[11px] sm:text-xs font-bold uppercase text-amber-200">
                    Auto 60s:
                  </span>
                  <span
                    data-testid="turn-timer-display"
                    className="text-xs sm:text-base font-mono font-black text-yellow-300 tabular-nums"
                  >
                    {formattedTimer}
                  </span>
                </div>

                <button
                  type="button"
                  data-testid="next-turn-btn"
                  disabled={
                    isRolling || isMoving || isLandingPause || turnControlsLocked
                  }
                  onClick={handleNextTurn}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl font-black text-[11px] sm:text-xs shadow cursor-pointer whitespace-nowrap shrink-0 transition-all ${
                    isRolling || isMoving || isLandingPause || turnControlsLocked
                      ? 'bg-stone-800/70 border border-stone-600 text-stone-400 opacity-50 cursor-not-allowed pointer-events-none'
                      : hasRolledThisTurn
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-stone-950 border-2 border-white ring-2 ring-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.85)] animate-pulse'
                      : 'bg-stone-800 hover:bg-stone-700 border border-amber-500/60 text-amber-200'
                  }`}
                >
                  <span>AKHIRI GILIRAN ➔</span>
                  <ArrowRightCircle
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                      hasRolledThisTurn && !isRolling && !isMoving && !isLandingPause
                        ? 'text-stone-950'
                        : 'text-amber-400'
                    }`}
                  />
                </button>
              </div>

              {/* Tombol Aksi Besar Berwarna-warni */}
              <div
                className={`grid gap-1.5 sm:gap-2 ${
                  collapsedPanels.actions
                    ? 'grid-cols-2'
                    : 'grid-cols-2 sm:grid-cols-4'
                }`}
              >
                <button
                  type="button"
                  data-testid="roll-dice-btn"
                  disabled={
                    hasRolledThisTurn ||
                    turnPhase !== 'READY_TO_ROLL' ||
                    Boolean(activePlayer.isBot) ||
                    turnControlsLocked
                  }
                  onClick={() => handleRollDice(false)}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all whitespace-nowrap shrink-0 ${
                    hasRolledThisTurn ||
                    turnPhase !== 'READY_TO_ROLL' ||
                    Boolean(activePlayer.isBot) ||
                    turnControlsLocked
                      ? 'bg-stone-700 text-stone-300 border border-stone-500 opacity-50 cursor-not-allowed pointer-events-none shadow-none'
                      : 'bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 text-stone-950 shadow-[0_4px_0_#b45309] cursor-pointer'
                  }`}
                >
                  {hasRolledThisTurn ? (
                    <span>🚫 SUDAH LEMPAR (1x)</span>
                  ) : turnControlsLocked ? (
                    <span>⏳ BUKAN GILIRANMU</span>
                  ) : (
                    <>
                      <Dices className="w-4 h-4 shrink-0" />
                      <span>LEMPAR DADU</span>
                    </>
                  )}
                </button>

                {!collapsedPanels.actions && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowGiveMoneyModal(true)}
                      className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:translate-y-0.5 text-stone-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_4px_0_#047857] transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Send className="w-4 h-4 shrink-0" />
                      <span>KASIH DUIT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAskMoneyModal(true)}
                      className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-sky-400 hover:bg-sky-300 active:translate-y-0.5 text-stone-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_4px_0_#0369a1] transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <HandCoins className="w-4 h-4 shrink-0" />
                      <span>MINTA DUIT</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setStartUpgradeBanner(false);
                    setShowBuyUpgradeModal(true);
                  }}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-purple-400 hover:bg-purple-300 active:translate-y-0.5 text-stone-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_4px_0_#6d28d9] transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isStandingOnUnownedProperty
                      ? 'ring-2 ring-yellow-300 animate-pulse'
                      : ''
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>BELI / UPGRADE</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* 3. GAME MODALS & OVERLAYS */}
      {screen === 'GAME' && (
        <GameModals
          gameState={gameState}
          onStartGame={() => setGameState('playing')}
          onResumeGame={() => setGameState('playing')}
          onRestartGame={handleRestartGame}
          players={players}
          activePlayer={activePlayer}
          properties={properties}
          stateTreasury={stateTreasury}
          round={round}
          dice={dice}
          extraDie={extraDie}
          activeFateCard={activeFateCard}
          fateDiceResult={fateDiceResult}
          onRollFateCardDice={handleRollFateCardDice}
          onCancelFateCardWithDoa={handleCancelFateCardWithDoa}
          onConfirmFateCard={handleConfirmFateCard}
          showBuyUpgradeModal={showBuyUpgradeModal}
          startUpgradeBanner={startUpgradeBanner}
          onCloseBuyUpgradeModal={() => {
            setShowBuyUpgradeModal(false);
            setStartUpgradeBanner(false);
          }}
          onBuyProperty={handleBuyProperty}
          onUpgradeProperty={handleUpgradeProperty}
          showGiveMoneyModal={showGiveMoneyModal}
          onCloseGiveMoneyModal={() => setShowGiveMoneyModal(false)}
          onGiveMoney={handleGiveMoney}
          showAskMoneyModal={showAskMoneyModal}
          onCloseAskMoneyModal={() => setShowAskMoneyModal(false)}
          onSendAskMoneyRequest={handleSendAskMoneyRequest}
          pendingMoneyRequest={visibleMoneyRequest}
          onAcceptMoneyRequest={handleAcceptMoneyRequest}
          onRejectMoneyRequest={handleRejectMoneyRequest}
          showTollModal={showTollModal}
          tollFeeRefunded={tollFeeRefunded}
          onUseDiskonTolInModal={handleUseDiskonTolInModal}
          onSelectTollDestination={handleSelectTollDestination}
          showCourtModal={showCourtModal}
          courtDiceResult={courtDiceResult}
          onRollCourtDice={handleRollCourtDice}
          onConfirmCourtVerdict={handleConfirmCourtVerdict}
          showJailModal={showJailModal}
          onCloseJailModal={() => setShowJailModal(false)}
          onJailTryDoubles={handleJailTryDoubles}
          onJailPayFine={handleJailPayFine}
          onJailUseOrdal={handleJailUseOrdal}
          onJailBuyPremiumCell={handleJailBuyPremiumCell}
          showPremiumCellModal={showPremiumCellModal}
          onClosePremiumCellModal={() => setShowPremiumCellModal(false)}
          onPremiumBuyAnyProperty={handlePremiumBuyAnyProperty}
          onPremiumStayInCell={handlePremiumStayInCell}
          selectedCardToUse={selectedCardToUse}
          onCloseUseCardModal={() => setSelectedCardToUse(null)}
          onConfirmUseSavedCard={handleConfirmUseSavedCard}
          showDukunModal={showDukunModal}
          onCloseDukunModal={() => setShowDukunModal(false)}
          onApplyDukunDiceChange={handleApplyDukunDiceChange}
          pendingDebtObligation={pendingDebtObligation}
          onSellBuildingForCash={handleSellBuildingForCash}
          onSellLandForCash={handleSellLandForCash}
          onRequestLoanFromPlayer={handleRequestLoanFromPlayer}
          pendingLoanProposal={visibleLoanProposal}
          onApproveLoanWithInterest={handleApproveLoanWithInterest}
          onRejectLoanProposal={handleRejectLoanProposal}
          onSettlePendingObligation={handleSettlePendingObligation}
          onDeclareBankruptcyFromCrisis={handleDeclareBankruptcyFromCrisis}
          loans={loans}
          showLoanManagerModal={showLoanManagerModal}
          onCloseLoanManagerModal={() => setShowLoanManagerModal(false)}
          onRepayLoan={handleRepayLoan}
          selectedTileModal={selectedTileModal}
          onCloseSelectedTileModal={() => setSelectedTileModal(null)}
          durationMode={durationMode}
          gameOverReason={gameOverReason}
          customAssets={customAssets}
          isOnlineRoom={isOnlineRoom}
          isHost={isHost}
          onlineRoomCode={roomCode}
          onDeleteOnlineRoom={handleDeleteOnlineRoom}
        />
      )}

      {/* 4. FASE 5 & 9: MODAL KUSTOMISASI GAMBAR & OPENING MOVIE */}
      <CustomAssetsModal
        isOpen={showCustomAssetsModal}
        onClose={() => setShowCustomAssetsModal(false)}
        customAssets={customAssets}
        onChangeCustomAssets={handleUpdateCustomAssets}
        onUploadIntroMovie={handleUploadIntroMovie}
        onRemoveIntroMovie={handleRemoveIntroMovie}
        onPreviewIntroMovie={() => setScreen('INTRO_MOVIE')}
        isOnlineRoom={isOnlineRoom}
        isHost={isHost}
        roomCode={roomCode}
      />

      {/* 5. POPUP HOVER PROFIL KARAKTER (AVATAR) & POPUP INFO KOTAK PAPAN PERMAINAN */}
      <HoverInfoPopups
        hoveredPlayer={hoveredPlayer}
        hoveredTile={hoveredTile}
        mousePos={hoverMousePos}
        players={players}
        activePlayerId={activePlayer.id}
        properties={properties}
        loans={loans}
        customAssets={customAssets}
      />
    </main>
  );
}
