import React, { useState } from 'react';
import {
  BOARD_TILES,
  BUILDING_NAMES,
  BUILDING_RENT_RATES,
  DURATION_MODE_OPTIONS,
  TOLL_TILE_IDS,
  BEKASI_TILE_ID,
  BoardTile,
  BuildingLevel,
  FateCard,
  GameDurationMode,
  LoanRecord,
  Player,
  PropertyState,
  SavedCard,
  calculatePropertyRent,
  getUpgradeCostForNextLevel,
  calculateSellBuildingValue,
  calculateSellLandValue,
  calculateLoanTotalDue,
  resolveFitnahRoll,
  rankPlayersByNetWorth,
  formatRupiah,
} from '../game/rules';
import { CustomImageAssets, getPawnAvatarImageUrl } from '../game/customAssets';
import {
  Sparkles,
  Skull,
  Send,
  HandCoins,
  Building2,
  Scale,
  Car,
  X,
  Trophy,
  RotateCcw,
  Play,
  ShieldCheck,
  Lock,
  Crown,
  Dices,
  ShieldAlert,
  Palmtree,
  Landmark,
  AlertTriangle,
  Flame,
  Percent,
  Ticket,
  ShoppingBag,
} from 'lucide-react';

export interface PendingDebtObligation {
  playerIndex: number;
  amount: number;
  reason: string;
  recipientPlayerId: number | null; // null = Kas Negara
}

export interface PendingMoneyRequest {
  fromPlayerId: number;
  toPlayerId: number;
  amount: number;
  reason: string;
}

export interface PendingLoanProposal {
  borrowerId: number;
  lenderId: number;
  principal: number;
}

interface GameModalsProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  onStartGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  players: Player[];
  activePlayer: Player;
  properties: Record<number, PropertyState>;
  stateTreasury: number;
  round: number;
  dice: [number, number];
  extraDie: number | null;
  // Fate Card Modal (with Dice roll & Doa Orang Tua cancel)
  activeFateCard: { card: FateCard; fromDoubles: boolean } | null;
  fateDiceResult: number | null;
  onRollFateCardDice: () => void;
  onCancelFateCardWithDoa: () => void;
  onConfirmFateCard: () => void;
  // Buy & Upgrade Modal (with Harbolnas 50% discount)
  showBuyUpgradeModal: boolean;
  startUpgradeBanner: boolean;
  onCloseBuyUpgradeModal: () => void;
  onBuyProperty: (tileId: number, useHarbolnas?: boolean) => void;
  onUpgradeProperty: (tileId: number) => void;
  // Give & Ask Money Modals
  showGiveMoneyModal: boolean;
  onCloseGiveMoneyModal: () => void;
  onGiveMoney: (targetPlayerId: number, amount: number, note: string) => void;
  showAskMoneyModal: boolean;
  onCloseAskMoneyModal: () => void;
  onSendAskMoneyRequest: (targetPlayerId: number, amount: number, reason: string) => void;
  pendingMoneyRequest: PendingMoneyRequest | null;
  onAcceptMoneyRequest: () => void;
  onRejectMoneyRequest: () => void;
  // Toll Modal (with Diskon Tol card option)
  showTollModal: boolean;
  tollFeeRefunded: boolean;
  onUseDiskonTolInModal: () => void;
  onSelectTollDestination: (targetTollTileId: number) => void;
  // Court Modal
  showCourtModal: boolean;
  courtDiceResult: number | null;
  onRollCourtDice: () => void;
  onConfirmCourtVerdict: () => void;
  // Lapas & Sel Premium Modals
  showJailModal: boolean;
  onCloseJailModal: () => void;
  onJailTryDoubles: () => void;
  onJailPayFine: () => void;
  onJailUseOrdal: () => void;
  onJailBuyPremiumCell: () => void;
  showPremiumCellModal: boolean;
  onClosePremiumCellModal: () => void;
  onPremiumBuyAnyProperty: (tileId: number) => void;
  onPremiumStayInCell: () => void;
  // 10 Saved Cards Modal & Dukun / Fitnah
  selectedCardToUse: SavedCard | null;
  onCloseUseCardModal: () => void;
  onConfirmUseSavedCard: (
    card: SavedCard,
    options?: {
      targetPlayerId?: number;
      dukunDieIndex?: number;
      dukunDieValue?: number;
      fitnahDiceResult?: number;
    }
  ) => void;
  showDukunModal: boolean;
  onCloseDukunModal: () => void;
  onApplyDukunDiceChange: (dieIndex: number, newValue: number) => void;
  // Financial Crisis, Asset Liquidation (50%), & Loan Shark (1-200% Interest)
  pendingDebtObligation: PendingDebtObligation | null;
  onSellBuildingForCash: (tileId: number) => void;
  onSellLandForCash: (tileId: number) => void;
  onRequestLoanFromPlayer: (lenderId: number, principal: number) => void;
  pendingLoanProposal: PendingLoanProposal | null;
  onApproveLoanWithInterest: (interestRate: number) => void;
  onRejectLoanProposal: () => void;
  onSettlePendingObligation: () => void;
  onDeclareBankruptcyFromCrisis: () => void;
  // Active Loans Manager ("Bayar Utang")
  loans: LoanRecord[];
  showLoanManagerModal: boolean;
  onCloseLoanManagerModal: () => void;
  onRepayLoan: (loanId: string, payAmount: number) => void;
  // Tile Inspector
  selectedTileModal: BoardTile | null;
  onCloseSelectedTileModal: () => void;
  durationMode?: GameDurationMode;
  gameOverReason?: string;
  customAssets?: CustomImageAssets;
}

export const GameModals: React.FC<GameModalsProps> = ({
  gameState,
  onStartGame,
  onResumeGame,
  onRestartGame,
  players,
  activePlayer,
  properties,
  stateTreasury,
  round,
  dice,
  extraDie,
  activeFateCard,
  fateDiceResult,
  onRollFateCardDice,
  onCancelFateCardWithDoa,
  onConfirmFateCard,
  showBuyUpgradeModal,
  startUpgradeBanner,
  onCloseBuyUpgradeModal,
  onBuyProperty,
  onUpgradeProperty,
  showGiveMoneyModal,
  onCloseGiveMoneyModal,
  onGiveMoney,
  showAskMoneyModal,
  onCloseAskMoneyModal,
  onSendAskMoneyRequest,
  pendingMoneyRequest,
  onAcceptMoneyRequest,
  onRejectMoneyRequest,
  showTollModal,
  tollFeeRefunded,
  onUseDiskonTolInModal,
  onSelectTollDestination,
  showCourtModal,
  courtDiceResult,
  onRollCourtDice,
  onConfirmCourtVerdict,
  showJailModal,
  onCloseJailModal,
  onJailTryDoubles,
  onJailPayFine,
  onJailUseOrdal,
  onJailBuyPremiumCell,
  showPremiumCellModal,
  onClosePremiumCellModal,
  onPremiumBuyAnyProperty,
  onPremiumStayInCell,
  selectedCardToUse,
  onCloseUseCardModal,
  onConfirmUseSavedCard,
  showDukunModal,
  onCloseDukunModal,
  onApplyDukunDiceChange,
  pendingDebtObligation,
  onSellBuildingForCash,
  onSellLandForCash,
  onRequestLoanFromPlayer,
  pendingLoanProposal,
  onApproveLoanWithInterest,
  onRejectLoanProposal,
  onSettlePendingObligation,
  onDeclareBankruptcyFromCrisis,
  loans,
  showLoanManagerModal,
  onCloseLoanManagerModal,
  onRepayLoan,
  selectedTileModal,
  onCloseSelectedTileModal,
  durationMode = 'FAST_15',
  gameOverReason = '',
  customAssets,
}) => {
  const otherPlayers = players.filter(
    (p) => p.id !== activePlayer.id && p.status !== 'BANGKRUT'
  );
  const [selectedTargetId, setSelectedTargetId] = useState<number>(
    otherPlayers[0]?.id ?? 1
  );
  const [transferAmount, setTransferAmount] = useState<number>(500_000);
  const [transferNote, setTransferNote] = useState<string>('Uang bensin & kopi');

  // Dukun modal state
  const [dukunDieIdx, setDukunDieIdx] = useState<number>(0);
  const [dukunTargetVal, setDukunTargetVal] = useState<number>(6);

  // Fitnah modal state
  const [fitnahDiceRoll, setFitnahDiceRoll] = useState<number | null>(null);

  // Crisis & Loan state
  const [loanLenderId, setLoanLenderId] = useState<number>(
    otherPlayers[0]?.id ?? 1
  );
  const [loanPrincipalInput, setLoanPrincipalInput] = useState<number>(1_000_000);
  const [lenderInterestRate, setLenderInterestRate] = useState<number>(25); // 1% - 200%

  const currentTile = BOARD_TILES.find((t) => t.id === activePlayer.position);
  const currentProp =
    currentTile && currentTile.type === 'PROPERTY'
      ? properties[currentTile.id]
      : null;

  const fullPrice = currentTile?.price ?? 0;
  const harbolnasPrice = Math.round(fullPrice * 0.5);

  const hasHarbolnasCard =
    activePlayer.harbolnasArmed ||
    activePlayer.savedCards.some((c) => c.key === 'HARBOLNAS');
  const hasDoaCard =
    activePlayer.shieldedByDoa ||
    activePlayer.savedCards.some((c) => c.key === 'DOA_ORTU');
  const hasDiskonTolCard =
    activePlayer.diskonTolArmed ||
    activePlayer.savedCards.some((c) => c.key === 'DISKON_TOL');
  const hasOrdalCard = activePlayer.savedCards.some(
    (c) => c.key === 'ORANG_DALAM'
  );

  const canBuyCurrentTileNormal =
    currentTile &&
    currentTile.type === 'PROPERTY' &&
    currentProp &&
    currentProp.ownerId === null &&
    !currentProp.isSeizedByState &&
    activePlayer.money >= fullPrice;

  const canBuyCurrentTileHarbolnas =
    currentTile &&
    currentTile.type === 'PROPERTY' &&
    currentProp &&
    currentProp.ownerId === null &&
    !currentProp.isSeizedByState &&
    hasHarbolnasCard &&
    activePlayer.money >= harbolnasPrice;

  const ownedProperties = Object.values(properties).filter(
    (p) => p.ownerId === activePlayer.id && !p.isSeizedByState
  );

  const premiumBuyableProperties = Object.values(properties).filter(
    (p) => p.ownerId === null || p.isSeizedByState
  );

  const activePlayerLoans = loans.filter(
    (l) => l.borrowerId === activePlayer.id && l.remainingDue > 0
  );

  // 1. TITLE SCREEN OVERLAY
  if (gameState === 'title') {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 pointer-events-auto"
        style={{
          background:
            'radial-gradient(circle at 28% 50%, rgba(28, 12, 4, 0.92) 0%, rgba(28, 12, 4, 0.72) 52%, rgba(28, 12, 4, 0.38) 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-300/90">
            EDISI SATIR +62 · PAPAN 40 PETAK ISOMETRIK 2.5D · FASE 3 LENGKAP
          </span>
          <span className="text-xs font-mono text-amber-200/80 tabular-nums">
            ROOM #WNI-045 · 4 PEMAIN LOKAL
          </span>
        </div>

        <div className="max-w-xl my-auto">
          <svg
            viewBox="0 0 540 155"
            className="w-full max-w-[500px] h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)]"
            role="img"
            aria-label="WNI Simulator: Bertahan Hidup di Negeri Konoha"
          >
            <rect
              x="6"
              y="8"
              width="528"
              height="138"
              rx="18"
              fill="#451a03"
              stroke="#f59e0b"
              strokeWidth="4"
            />
            <rect
              x="14"
              y="16"
              width="512"
              height="122"
              rx="12"
              fill="#78350f"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            <path d="M 30 16 L 510 16 L 495 44 L 45 44 Z" fill="#dc2626" />
            <text
              x="270"
              y="35"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
              fontSize="13"
              letterSpacing="3"
            >
              MONOPOLI WARGA +62 · JUARA 1 SELALU NEGARA
            </text>
            <text
              x="270"
              y="92"
              textAnchor="middle"
              fill="#fef3c7"
              stroke="#1c0a00"
              strokeWidth="8"
              paintOrder="stroke fill"
              fontFamily="Bricolage Grotesque, Plus Jakarta Sans, sans-serif"
              fontWeight="800"
              fontSize="48"
              letterSpacing="1"
            >
              WNI SIMULATOR
            </text>
            <text
              x="270"
              y="124"
              textAnchor="middle"
              fill="#fcd34d"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="700"
              fontSize="16"
              letterSpacing="0.8"
            >
              Bertahan Hidup di Negeri Konoha
            </text>
          </svg>

          <p className="mt-4 text-sm sm:text-base text-amber-100/90 font-medium leading-relaxed max-w-lg">
            Modal awal <span className="font-bold text-emerald-300">Rp10 Jt</span>. Gunakan 10 Kartu Simpanan sakti (termasuk <span className="font-bold text-amber-300">Wantimpres Gaji Rp76,5 Jt</span>), hadapi Eskalasi Musibah Ekstrem, dan hindari jeratan <span className="font-bold text-rose-300">Utang Berbunga 1–200%</span>!
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartGame();
              }}
              className="flex items-center gap-3 px-7 py-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 text-stone-950 font-black text-base sm:text-lg tracking-wide shadow-[0_6px_0_#b45309,0_12px_24px_rgba(0,0,0,0.5)] transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-5 h-5 fill-stone-950" />
              MULAI SIMULASI WNI
            </button>
          </div>
        </div>

        <div className="text-xs font-mono text-amber-200/85 tracking-wide">
          Space Lempar Dadu · V Ubah Sudut Pandang 3D/2D · Scroll/Drag Zoom Papan · Esc Panduan & Pause
        </div>
      </div>
    );
  }

  // 2. PAUSE / RULES MODAL
  if (gameState === 'paused') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
        <div className="w-full max-w-lg rounded-2xl bg-[#2a1408] border-2 border-amber-500 p-6 text-amber-50 shadow-2xl">
          <div className="flex items-center justify-between border-b border-amber-800 pb-3">
            <h2 className="text-xl font-extrabold text-amber-300">
              PANDUAN LENGKAP WNI SIMULATOR (FASE 1–3)
            </h2>
            <button
              type="button"
              onClick={onResumeGame}
              aria-label="Tutup Jeda"
              className="p-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5 text-xs sm:text-sm text-amber-100/90 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
            <p>
              <strong>1. Tujuan Hidup:</strong> Bertahan dari kebangkrutan. Pemenang terakhir adalah <strong>Juara 2</strong> karena <strong>Juara 1 selalu Negara (Tak Terkalahkan)</strong>!
            </p>
            <p>
              <strong>2. Dek Kartu Berdadu & Eskalasi Negara:</strong> Kartu Takdir/Musibah memiliki mekanik <em>Lempar Dadu Kartu</em> (contoh: Bansos Rp500rb × dadu, Razia Pajak Rp300rb × dadu). Setelah semua pemain melewati START minimal 2x, <strong>🔥 MUSIBAH EKSTREM AKTIF!</strong>
            </p>
            <p>
              <strong>3. 10 Kartu Simpanan Lengkap:</strong> 🙏 Doa Ortu (batalkan kartu), 🔮 Dukun (ubah angka 1 dadu), 👑 Pewaris (lempar 3 dadu), 🗣️ Fitnah (lempar dadu fitnah lawan), 🎫 Diskon Tol, ✨ Khodam (+2 langkah), 🛍️ Harbolnas (diskon 50% tanah), 💸 Cashback 99% (sewa Rp0), 🕴️ Orang Dalam, dan 🏛️ <strong>Kartu Wantimpres</strong> (gaji lewat START naik jadi <strong>Rp76,5 Jt</strong>!).
            </p>
            <p>
              <strong>4. Krisis Keuangan, Gadai 50% & Utang Rentenir (Bunga 1–200%):</strong> Jika uang kurang saat bayar denda/sewa, kamu bisa jual bangunan/tanah (50% ke Negara) atau <strong>Ngutang ke Pemain Lain</strong> dengan bunga 1%–200% (tempo 3 giliran sebelum Tagih Paksa).
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onResumeGame}
              className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-sm shadow-[0_4px_0_#047857] cursor-pointer"
            >
              LANJUT MAIN
            </button>
            <button
              type="button"
              onClick={onRestartGame}
              className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm shadow-[0_4px_0_#b45309] cursor-pointer"
            >
              ULANG DARI AWAL
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. GAME OVER / VICTORY MODAL
  if (gameState === 'gameover') {
    const ranked = rankPlayersByNetWorth(players, properties, loans);
    const runnerUpEntry = ranked[0];
    const runnerUp = runnerUpEntry?.player;
    const modeObj =
      DURATION_MODE_OPTIONS.find((m) => m.id === durationMode) ||
      DURATION_MODE_OPTIONS[1];

    return (
      <div
        data-testid="game-over-modal"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 pointer-events-auto"
      >
        <div className="w-full max-w-lg rounded-2xl bg-[#2a1408] border-2 border-amber-400 p-6 text-center text-amber-50 shadow-2xl">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-1.5" />
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-900/80 border border-amber-500/70 text-[10px] font-mono uppercase tracking-widest text-amber-300 mb-1">
            <span>LAYAR AKHIR KEMENANGAN</span>
            <span>·</span>
            <span>{modeObj.shortLabel}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white mt-1.5 leading-snug bg-amber-950/90 border border-amber-500/70 p-3 rounded-xl">
            JUARA 1: NEGARA (Tak Terkalahkan) | JUARA 2: {runnerUp?.name}
          </h2>
          {gameOverReason && (
            <div className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-xs font-bold text-emerald-200">
              {gameOverReason}
            </div>
          )}
          <p className="text-xs sm:text-sm text-amber-200 mt-2">
            Negara mengumpulkan total kas{' '}
            <span className="font-mono font-bold text-emerald-400">
              {formatRupiah(stateTreasury)}
            </span>
            , sementara <strong>{runnerUp?.name}</strong> meraih{' '}
            <strong>Juara 2</strong> dengan Total Kekayaan Bersih{' '}
            <span className="font-mono font-bold text-yellow-300">
              {formatRupiah(runnerUpEntry?.netWorth ?? 0)}
            </span>
            !
          </p>

          {/* Daftar Peringkat Pemain & Status Inventori Kartu Wantimpres */}
          <div className="mt-4 space-y-2 text-left max-h-60 overflow-y-auto pr-1">
            {ranked.map((entry, idx) => {
              const p = entry.player;
              const hasUnusedWantimpres =
                !p.wantimpresActive &&
                p.savedCards.some((c) => c.key === 'WANTIMPRES');
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border text-xs ${
                    idx === 0
                      ? 'bg-amber-900/60 border-yellow-400 shadow'
                      : 'bg-amber-950/70 border-amber-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 border-white shadow shrink-0 overflow-hidden"
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
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          p.avatarEmoji
                        );
                      })()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                        <span>
                          Juara #{idx + 2} · {p.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            p.status === 'BANGKRUT'
                              ? 'bg-rose-900 text-rose-200'
                              : idx === 0
                              ? 'bg-yellow-400 text-stone-950'
                              : 'bg-emerald-800 text-emerald-200'
                          }`}
                        >
                          {p.status === 'BANGKRUT'
                            ? 'BANGKRUT'
                            : idx === 0
                            ? '🥈 JUARA 2 PEMENANG'
                            : 'BERTAHAN HIDUP'}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-amber-200 mt-0.5 font-mono">
                        💎 Kekayaan Bersih:{' '}
                        <strong className="text-yellow-300">
                          {formatRupiah(entry.netWorth)}
                        </strong>{' '}
                        (Tunai {formatRupiah(p.money)} + {entry.propertyCount}{' '}
                        Kota {formatRupiah(entry.propertyValue)})
                      </div>
                      {hasUnusedWantimpres && (
                        <div className="mt-1 inline-block px-2 py-0.5 rounded bg-purple-900/90 border border-purple-400 text-[9.5px] font-bold text-purple-200">
                          🏛️ Kartu Wantimpres: Tersimpan di Inventori Akun
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            data-start="true"
            onClick={onRestartGame}
            className="mt-5 w-full py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-base flex items-center justify-center gap-2 shadow-[0_5px_0_#b45309] cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            MAIN LAGI DARI AWAL
          </button>
        </div>
      </div>
    );
  }

  // 4. POP-UP PERSETUJUAN PEMBERI PINJAMAN (RENTENIR BUNGA 1% - 200%)
  if (pendingLoanProposal) {
    const borrower = players.find((p) => p.id === pendingLoanProposal.borrowerId);
    const lender = players.find((p) => p.id === pendingLoanProposal.lenderId);
    const totalReturn = calculateLoanTotalDue(
      pendingLoanProposal.principal,
      lenderInterestRate
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto">
        <div className="w-full max-w-md rounded-2xl bg-[#271206] border-2 border-amber-400 p-6 text-white shadow-2xl">
          <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
            <Percent className="w-5 h-5" />
            PENGAJUAN UTANG RENTENIR ANTAR-WNI
          </div>
          <h3 className="text-lg font-black mt-1">
            Konfirmasi Pemberi Pinjaman: {lender?.avatarEmoji} {lender?.name}
          </h3>
          <p className="text-xs text-amber-100/90 mt-1 leading-relaxed">
            <strong>{borrower?.name}</strong> mengajukan pinjaman tunai sebesar{' '}
            <strong className="text-emerald-300">
              {formatRupiah(pendingLoanProposal.principal)}
            </strong>{' '}
            dengan batas waktu <strong>3 putaran giliran peminjam</strong>. Tentukan bunga pinjaman (1% – 200%):
          </p>

          <div className="mt-4 p-3.5 rounded-xl bg-amber-950/90 border border-amber-700 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="loan-interest-range"
                className="text-xs font-extrabold uppercase text-amber-300"
              >
                Bunga Pinjaman Rentenir:
              </label>
              <span className="px-2.5 py-0.5 rounded bg-rose-600 text-white font-mono font-black text-sm">
                {lenderInterestRate}%
              </span>
            </div>

            <input
              id="loan-interest-range"
              type="range"
              min={1}
              max={200}
              value={lenderInterestRate}
              onChange={(e) => setLenderInterestRate(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />

            <div className="flex items-center justify-between gap-1.5">
              {[10, 25, 50, 100, 150, 200].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setLenderInterestRate(pct)}
                  className={`flex-1 py-1 rounded text-[10px] font-mono font-bold border cursor-pointer ${
                    lenderInterestRate === pct
                      ? 'bg-amber-400 text-stone-950 border-white'
                      : 'bg-stone-900 text-amber-200 border-amber-800'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-amber-800/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-amber-200/80">Pokok Pinjaman:</span>
                <span className="font-mono font-bold">
                  {formatRupiah(pendingLoanProposal.principal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-200/80">
                  Total Wajib Dikembalikan (3 Giliran):
                </span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {formatRupiah(totalReturn)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onApproveLoanWithInterest(lenderInterestRate)}
              className="py-3 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-xs uppercase shadow-[0_4px_0_#047857] cursor-pointer"
            >
              SETUJUI (BUNGA {lenderInterestRate}%)
            </button>
            <button
              type="button"
              onClick={onRejectLoanProposal}
              className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase shadow-[0_4px_0_#9f1239] cursor-pointer"
            >
              TOLAK PINJAMAN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. MODAL KRISIS KEUANGAN (SAAT UANG TUNAI KURANG UNTUK SEWA/PAJAK/DENDA)
  if (pendingDebtObligation) {
    const debtor = players[pendingDebtObligation.playerIndex] || activePlayer;
    const shortfall = Math.max(0, pendingDebtObligation.amount - debtor.money);
    const hasEnoughNow = debtor.money >= pendingDebtObligation.amount;
    const debtorProperties = Object.values(properties).filter(
      (p) => p.ownerId === debtor.id && !p.isSeizedByState
    );
    const potentialLenders = players.filter(
      (p) =>
        p.id !== debtor.id &&
        p.status !== 'BANGKRUT' &&
        p.money >= 500_000
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto">
        <div className="w-full max-w-xl rounded-2xl bg-[#290f08] border-2 border-rose-500 p-5 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-rose-800 pb-3">
            <div className="flex items-center gap-2 text-rose-300 font-black text-sm uppercase">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              KRISIS KEUANGAN WNI · TAGIHAN WAJIB BAYAR!
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-900 text-rose-200 font-mono text-xs font-bold">
              {debtor.name}
            </span>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-black/40 border border-rose-800/80 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] uppercase text-rose-300">
                Tagihan ({pendingDebtObligation.reason})
              </div>
              <div className="text-sm sm:text-base font-mono font-black text-rose-400">
                {formatRupiah(pendingDebtObligation.amount)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-amber-300">
                Saldo Tunai Saat Ini
              </div>
              <div className="text-sm sm:text-base font-mono font-black text-emerald-400">
                {formatRupiah(debtor.money)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-amber-300">
                Kekurangan Dana
              </div>
              <div className="text-sm sm:text-base font-mono font-black text-amber-300">
                {hasEnoughNow ? 'Rp0 (Cukup!)' : formatRupiah(shortfall)}
              </div>
            </div>
          </div>

          {hasEnoughNow ? (
            <button
              type="button"
              onClick={onSettlePendingObligation}
              className="mt-4 w-full py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-sm uppercase shadow-[0_4px_0_#047857] cursor-pointer"
            >
              ✅ SALDO CUKUP! BAYAR TAGIHAN ({formatRupiah(pendingDebtObligation.amount)}) SEKARANG
            </button>
          ) : (
            <>
              {/* Opsi A: Jual Bangunan / Gadai Tanah (Harga Jual 50% ke Negara) */}
              <div className="mt-4">
                <div className="text-xs font-extrabold uppercase text-amber-300 mb-1.5">
                  a) Jual Bangunan / Gadai Tanah ke Negara (Nilai Jual 50%)
                </div>
                {debtorProperties.length === 0 ? (
                  <div className="p-3 rounded-xl bg-black/30 border border-rose-900/60 text-xs text-rose-200/80 text-center">
                    Kamu tidak punya aset tanah atau bangunan lagi untuk dijual!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {debtorProperties.map((prop) => {
                      const tile = BOARD_TILES.find((t) => t.id === prop.tileId)!;
                      const sellBuildingCash = calculateSellBuildingValue(prop.level);
                      const sellLandCash = calculateSellLandValue(tile, prop.level);

                      return (
                        <div
                          key={prop.tileId}
                          className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/70 text-xs"
                        >
                          <div>
                            <div className="font-extrabold text-white">
                              #{tile.id} {tile.name} · Lv.{prop.level} ({BUILDING_NAMES[prop.level]})
                            </div>
                            <div className="text-[10px] text-rose-200/80">
                              Harga Beli: {formatRupiah(tile.price ?? 0)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {prop.level > 0 && (
                              <button
                                type="button"
                                onClick={() => onSellBuildingForCash(tile.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-[10px] uppercase cursor-pointer"
                              >
                                Jual 1 Bangunan (+{formatRupiah(sellBuildingCash)})
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onSellLandForCash(tile.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-black text-[10px] uppercase cursor-pointer"
                            >
                              Gadai/Jual Tanah (+{formatRupiah(sellLandCash)})
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Opsi B: Ngutang ke Pemain Lain (Bunga 1% - 200%) */}
              <div className="mt-4 p-3.5 rounded-xl bg-amber-950/70 border border-amber-700/80">
                <div className="text-xs font-extrabold uppercase text-amber-300 mb-2">
                  b) Ngutang ke Pemain Lain (Bunga Rentenir 1% – 200% · Tempo 3 Giliran)
                </div>
                {potentialLenders.length === 0 ? (
                  <div className="text-xs text-amber-200/70">
                    Tidak ada pemain lain yang punya cukup saldo untuk meminjami.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      {potentialLenders.map((lender) => (
                        <button
                          key={lender.id}
                          type="button"
                          onClick={() => setLoanLenderId(lender.id)}
                          className={`p-2 rounded-lg border text-left text-xs font-bold cursor-pointer ${
                            loanLenderId === lender.id
                              ? 'bg-emerald-900/70 border-emerald-400 text-white'
                              : 'bg-black/40 border-amber-800 text-amber-200'
                          }`}
                        >
                          <div>
                            {lender.avatarEmoji} {lender.name.split(' ')[0]}
                          </div>
                          <div className="font-mono text-[10px] text-emerald-300">
                            Saldo: {formatRupiah(lender.money)}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {[
                        Math.max(500_000, Math.ceil(shortfall / 500_000) * 500_000),
                        1_000_000,
                        2_000_000,
                      ].map((amt, i) => (
                        <button
                          key={`${amt}-${i}`}
                          type="button"
                          onClick={() => setLoanPrincipalInput(amt)}
                          className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border cursor-pointer ${
                            loanPrincipalInput === amt
                              ? 'bg-amber-400 text-stone-950 border-white'
                              : 'bg-black/40 text-amber-200 border-amber-800'
                          }`}
                        >
                          Pinjam {formatRupiah(amt)}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onRequestLoanFromPlayer(loanLenderId, loanPrincipalInput)
                      }
                      className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs uppercase shadow cursor-pointer"
                    >
                      🤝 AJUKAN PINJAMAN {formatRupiah(loanPrincipalInput)} KE PEMAIN
                    </button>
                  </div>
                )}
              </div>

              {/* Opsi C: Menyerah / Bangkrut */}
              <button
                type="button"
                onClick={onDeclareBankruptcyFromCrisis}
                className="mt-4 w-full py-2.5 rounded-xl bg-stone-900 hover:bg-rose-950 border border-rose-700 text-rose-300 font-black text-xs uppercase cursor-pointer"
              >
                💀 Aset Tidak Cukup / Menyerah: Nyatakan BANGKRUT (Dikalahkan Negara)
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // 6. POP-UP KONFIRMASI MINTA DUIT (TERIMA / TOLAK OLEH PEMAIN TUJUAN)
  if (pendingMoneyRequest) {
    const requester = players.find((p) => p.id === pendingMoneyRequest.fromPlayerId);
    const target = players.find((p) => p.id === pendingMoneyRequest.toPlayerId);
    const canAfford = (target?.money ?? 0) >= pendingMoneyRequest.amount;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
        <div className="w-full max-w-md rounded-2xl bg-[#271307] border-2 border-sky-400 p-6 text-white shadow-2xl">
          <div className="flex items-center gap-2 text-sky-300 font-black text-xs uppercase">
            <HandCoins className="w-5 h-5" />
            PERMINTAAN MINTA DUIT ANTAR-WNI
          </div>
          <h3 className="text-lg font-black mt-1">
            Untuk: {target?.avatarEmoji} {target?.name}
          </h3>
          <p className="text-xs text-amber-100/90 mt-2 leading-relaxed">
            <strong>
              {requester?.avatarEmoji} {requester?.name}
            </strong>{' '}
            meminta bantuan uang sebesar{' '}
            <strong className="text-emerald-300">
              {formatRupiah(pendingMoneyRequest.amount)}
            </strong>{' '}
            dengan alasan: <em>"{pendingMoneyRequest.reason}"</em>.
          </p>
          <p className="text-[11px] text-amber-300/80 mt-2">
            *Jika waktu giliran habis sebelum dijawab, permintaan otomatis hangus.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!canAfford}
              onClick={onAcceptMoneyRequest}
              className="py-3 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:bg-stone-700 text-stone-950 font-black text-xs uppercase shadow-[0_4px_0_#047857] cursor-pointer"
            >
              TERIMA (TRANSFER)
            </button>
            <button
              type="button"
              onClick={onRejectMoneyRequest}
              className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase shadow-[0_4px_0_#9f1239] cursor-pointer"
            >
              TOLAK
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 7. MODAL DUKUN (UBAH 1 DADU MENJADI ANGKA 1-6 SEBELUM PION BERGERAK)
  if (showDukunModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
        <div className="w-full max-w-md rounded-2xl bg-[#1f1033] border-2 border-purple-400 p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-purple-800 pb-3">
            <div className="flex items-center gap-2 text-purple-300 font-black text-sm uppercase">
              <span>🔮 RITUAL DUKUN SAKTI: UBAH ANGKA DADU</span>
            </div>
            <button
              type="button"
              onClick={onCloseDukunModal}
              className="p-1 rounded-lg bg-purple-900 hover:bg-purple-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-3 text-xs text-purple-200 leading-relaxed">
            Pilih salah satu dadu dan ubah angkanya menjadi <strong>1 sampai 6</strong> sesuai keinginanmu sebelum pion melangkah!
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <div className="text-xs font-bold uppercase text-amber-300 mb-1.5">
                1. Pilih Dadu yang Ingin Diubah:
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDukunDieIdx(0)}
                  className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer ${
                    dukunDieIdx === 0
                      ? 'bg-purple-600 border-amber-300 text-white'
                      : 'bg-purple-950 border-purple-800 text-purple-200'
                  }`}
                >
                  Dadu #1 (Saat Ini: {dice[0]})
                </button>
                <button
                  type="button"
                  onClick={() => setDukunDieIdx(1)}
                  className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer ${
                    dukunDieIdx === 1
                      ? 'bg-purple-600 border-amber-300 text-white'
                      : 'bg-purple-950 border-purple-800 text-purple-200'
                  }`}
                >
                  Dadu #2 (Saat Ini: {dice[1]})
                </button>
                {extraDie !== null && (
                  <button
                    type="button"
                    onClick={() => setDukunDieIdx(2)}
                    className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer ${
                      dukunDieIdx === 2
                        ? 'bg-purple-600 border-amber-300 text-white'
                        : 'bg-purple-950 border-purple-800 text-purple-200'
                    }`}
                  >
                    Dadu #3 (Saat Ini: {extraDie})
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase text-amber-300 mb-1.5">
                2. Pilih Angka Baru (1 – 6):
              </div>
              <div className="grid grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDukunTargetVal(num)}
                    className={`py-2.5 rounded-xl font-mono font-black text-base border cursor-pointer ${
                      dukunTargetVal === num
                        ? 'bg-amber-400 text-stone-950 border-white'
                        : 'bg-purple-950 text-white border-purple-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onApplyDukunDiceChange(dukunDieIdx, dukunTargetVal)}
              className="mt-3 w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs sm:text-sm uppercase shadow-[0_4px_0_#b45309] cursor-pointer"
            >
              🔮 UBAH DADU #{dukunDieIdx + 1} JADI ANGKA {dukunTargetVal} & JALAN!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 8. MODAL PILIHAN LAPAS (#10) SAAT GILIRAN TIBA
  if (showJailModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
        <div className="w-full max-w-md rounded-2xl bg-slate-900 border-2 border-amber-400 p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase">
              <Lock className="w-5 h-5" />
              STATUS: DI LAPAS (#10) · PILIHAN KELUAR
            </div>
            <button
              type="button"
              onClick={onCloseJailModal}
              aria-label="Tutup Modal Lapas"
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-300 leading-relaxed">
            <strong>{activePlayer.name}</strong> sedang mendekam di Lapas Biasa. Selama di Lapas biasa, uang sewa tanahmu <strong>masuk ke Kas Negara</strong>! Pilih cara keluar sebelum giliran ini:
          </p>

          <div className="mt-4 space-y-2.5">
            <button
              type="button"
              onClick={onJailTryDoubles}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs sm:text-sm shadow-[0_4px_0_#b45309] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Dices className="w-4 h-4 shrink-0" />
                <span>a) Coba Dadu Kembar (Bebas & Jalan)</span>
              </span>
              <span className="text-[10px] font-mono uppercase bg-black/15 px-2 py-0.5 rounded">
                Gratis
              </span>
            </button>

            <button
              type="button"
              disabled={activePlayer.money < 500_000}
              onClick={onJailPayFine}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-stone-950 font-black text-xs sm:text-sm shadow-[0_4px_0_#047857] cursor-pointer"
            >
              <span>b) Bayar Denda Rp500 Rb & Lempar Normal</span>
              <span className="text-[10px] font-mono uppercase bg-black/15 px-2 py-0.5 rounded">
                -Rp500 Rb
              </span>
            </button>

            <button
              type="button"
              disabled={!hasOrdalCard}
              onClick={onJailUseOrdal}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-sky-400 hover:bg-sky-300 disabled:bg-slate-800 disabled:text-slate-500 text-stone-950 font-black text-xs sm:text-sm shadow-[0_4px_0_#0369a1] cursor-pointer"
            >
              <span>c) 🕴️ Pakai Kartu Orang Dalam (Bebas Gratis)</span>
              <span className="text-[10px] font-mono uppercase bg-black/15 px-2 py-0.5 rounded">
                {hasOrdalCard ? 'Tersedia' : 'Tidak Punya'}
              </span>
            </button>

            <button
              type="button"
              onClick={onJailBuyPremiumCell}
              className="w-full flex flex-col items-start p-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-[0_4px_0_#4c1d95] cursor-pointer"
            >
              <div className="w-full flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-yellow-300 shrink-0" />
                  <span>d) Beli Sel Premium 👑 (3 Giliran)</span>
                </span>
                <span className="text-[10px] font-mono bg-black/35 px-2 py-0.5 rounded text-yellow-200">
                  Simulasi Google Play Rp15.000 / Gratis Tes
                </span>
              </div>
              <span className="text-[10px] font-normal text-purple-100 mt-1 text-left">
                Fasilitas VIP: Uang sewa tanah tetap masuk ke kamu + bisa jalan-jalan beli 1 Tanah Kosong/Sitaan Negara tiap giliran!
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 9. MODAL EKSKLUSIF SEL PREMIUM 👑
  if (showPremiumCellModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
        <div className="w-full max-w-lg rounded-2xl bg-[#241038] border-2 border-yellow-400 p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-purple-700 pb-3">
            <div className="flex items-center gap-2 text-yellow-300 font-black text-sm uppercase">
              <Crown className="w-5 h-5" />
              FASILITAS VIP SEL PREMIUM 👑 ({activePlayer.premiumTurnsLeft} Giliran Tersisa)
            </div>
            <button
              type="button"
              onClick={onClosePremiumCellModal}
              aria-label="Tutup Modal Sel Premium"
              className="p-1 rounded-lg bg-purple-900 hover:bg-purple-800 text-purple-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-2.5 text-xs text-purple-200 leading-relaxed">
            Di Sel Premium ber-AC & kasur empuk, <strong>uang sewa tanah tetap mengalir ke rekeningmu</strong>! Di giliran ini kamu tidak melempar dadu, melainkan bebas memilih:
          </p>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase text-amber-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Palmtree className="w-4 h-4" />
                Opsi 1: Berlibur & Beli 1 Tanah Kosong / Sitaan Negara (Lalu Balik ke Lapas)
              </span>
              <span className="font-mono text-emerald-300">
                Saldo: {formatRupiah(activePlayer.money)}
              </span>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 bg-purple-950/70 p-2.5 rounded-xl border border-purple-800">
              {premiumBuyableProperties.length === 0 ? (
                <div className="text-center text-xs text-purple-300 py-4">
                  Semua tanah di Negeri Konoha sudah dimiliki pemain lain!
                </div>
              ) : (
                premiumBuyableProperties.map((prop) => {
                  const tile = BOARD_TILES.find((t) => t.id === prop.tileId)!;
                  const price = tile.price ?? 1_500_000;
                  const canAfford = activePlayer.money >= price;

                  return (
                    <div
                      key={prop.tileId}
                      className="flex items-center justify-between p-2 rounded-lg bg-purple-900/70 border border-purple-700/70"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          <span>
                            #{tile.id} {tile.name}
                          </span>
                          {prop.isSeizedByState && (
                            <span className="px-1.5 py-0.5 rounded bg-red-700 text-amber-200 text-[9px] font-black uppercase">
                              SITAAN NEGARA
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-purple-200">
                          Harga: {formatRupiah(price)} · Sewa Awal (20%):{' '}
                          {formatRupiah(calculatePropertyRent(tile, prop.level))}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onPremiumBuyAnyProperty(tile.id)}
                        className={`px-3 py-1.5 rounded-lg font-black text-[11px] uppercase cursor-pointer ${
                          canAfford
                            ? 'bg-yellow-400 hover:bg-yellow-300 text-stone-950'
                            : 'bg-purple-950 text-purple-500 cursor-not-allowed'
                        }`}
                      >
                        Beli & Balik Lapas ({formatRupiah(price)})
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onPremiumStayInCell}
            className="mt-4 w-full py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-xs sm:text-sm uppercase shadow-[0_4px_0_#047857] cursor-pointer"
          >
            Opsi 2: Diam Santai di Sel Premium (Selesai Giliran)
          </button>
        </div>
      </div>
    );
  }

  // 10. ACTIVE FATE CARD MODAL (TAKDIR / MUSIBAH + DICE ROLL + DOA ORANG TUA CANCEL)
  if (activeFateCard) {
    const { card, fromDoubles } = activeFateCard;
    const isTakdir = card.deck === 'TAKDIR';
    const needsDiceRoll = Boolean(card.requiresDice && fateDiceResult === null);
    const computedDiceAmount =
      card.requiresDice && fateDiceResult !== null
        ? (card.diceMultiplier ?? 500_000) * fateDiceResult
        : null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
        <div
          className={`w-full max-w-md rounded-2xl border-4 p-6 text-white shadow-2xl ${
            card.isExtreme
              ? 'bg-gradient-to-b from-red-900 via-rose-950 to-black border-amber-400'
              : isTakdir
              ? 'bg-gradient-to-b from-sky-700 via-sky-800 to-slate-900 border-sky-300'
              : 'bg-gradient-to-b from-rose-700 via-rose-900 to-slate-950 border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="px-2.5 py-1 rounded-md bg-black/35 text-xs font-mono font-extrabold uppercase tracking-wider">
              {card.isExtreme
                ? '🔥 MUSIBAH EKSTREM (ESKALASI NEGARA)'
                : isTakdir
                ? '📘 KARTU TAKDIR (BIRU)'
                : '📕 KARTU MUSIBAH (MERAH)'}
            </span>
            {fromDoubles && (
              <span className="px-2 py-0.5 rounded bg-amber-400 text-stone-950 text-[10px] font-black uppercase">
                Efek Dadu Kembar!
              </span>
            )}
          </div>

          <div className="my-5 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-3 shadow-inner">
              {card.isExtreme ? (
                <Flame className="w-9 h-9 text-amber-300" />
              ) : isTakdir ? (
                <Sparkles className="w-9 h-9 text-amber-300" />
              ) : (
                <Skull className="w-9 h-9 text-rose-200" />
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              {card.title}
            </h3>
            <p className="mt-2 text-sm text-white/90 leading-relaxed">
              "{card.flavorText}"
            </p>
            <div className="mt-4 px-4 py-2 rounded-xl bg-black/40 border border-white/20 font-mono font-extrabold text-amber-300 text-sm">
              EFEK: {card.effectLabel}
            </div>

            {computedDiceAmount !== null && (
              <div className="mt-3 p-3 rounded-xl bg-amber-400 text-stone-950 font-black text-sm w-full">
                🎲 Angka Dadu Kartu: {fateDiceResult} → Total:{' '}
                {formatRupiah(computedDiceAmount)}!
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            {/* Tombol 🙏 Doa Orang Tua (Hanya muncul sebelum dadu kartu dilempar) */}
            {hasDoaCard && fateDiceResult === null && (
              <button
                type="button"
                onClick={onCancelFateCardWithDoa}
                className="w-full py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wide shadow-[0_4px_0_#047857] cursor-pointer"
              >
                🙏 Pakai Doa Orang Tua (Batalkan/Abaikan Kartu Ini)
              </button>
            )}

            {needsDiceRoll ? (
              <button
                type="button"
                onClick={onRollFateCardDice}
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm uppercase tracking-wider shadow-[0_4px_0_#b45309] cursor-pointer flex items-center justify-center gap-2"
              >
                <Dices className="w-5 h-5" />
                LEMPAR DADU KARTU (1 DADU)
              </button>
            ) : (
              <button
                type="button"
                onClick={onConfirmFateCard}
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm uppercase tracking-wider shadow-[0_4px_0_#b45309] cursor-pointer"
              >
                TERIMA NASIB WNI
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 11. GERBANG TOL WAJIB PINDAH MODAL (DENGAN OPSI KARTU DISKON TOL)
  if (showTollModal) {
    const availableTolls = TOLL_TILE_IDS.filter(
      (id) => id !== activePlayer.position
    ).map((id) => BOARD_TILES.find((t) => t.id === id)!);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
        <div className="w-full max-w-md rounded-2xl bg-slate-900 border-2 border-amber-400 p-6 text-white shadow-2xl">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm uppercase">
            <Car className="w-5 h-5" />
            {tollFeeRefunded
              ? '🎫 DISKON TOL AKTIF (BEBAS BIAYA Rp500 Rb!)'
              : 'GERBANG TOL KONOHA (TARIF Rp500 Rb)'}
          </div>
          <h3 className="text-lg font-black mt-1">
            Wajib Pilih Gerbang Tol Tujuan Pindah!
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {tollFeeRefunded
              ? 'Berkat Kartu Diskon Tol, biaya Rp500 Rb digratiskan! Pilih gerbang tol tujuan untuk pindah seketika tanpa mendapat gaji START:'
              : 'Uangmu telah dipotong Rp500 Rb (masuk Kas Negara). Pilih gerbang tol tujuan untuk pindah seketika tanpa mendapat gaji START:'}
          </p>

          {!tollFeeRefunded && hasDiskonTolCard && (
            <button
              type="button"
              onClick={onUseDiskonTolInModal}
              className="mt-3 w-full py-2.5 px-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-stone-950 font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              🎫 Pakai Kartu Diskon Tol (Refund/Bebas Biaya Rp500 Rb)
            </button>
          )}

          <div className="mt-4 space-y-2.5">
            {availableTolls.map((toll) => (
              <button
                key={toll.id}
                type="button"
                onClick={() => onSelectTollDestination(toll.id)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-stone-950 border border-slate-700 font-bold transition-colors cursor-pointer"
              >
                <span>
                  #{toll.id} · {toll.name}
                </span>
                <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-black/30 text-amber-300">
                  Pindah & Selesai →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 12. PENGADILAN (MEJA HIJAU #30) VERDICT DICE MODAL
  if (showCourtModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
        <div className="w-full max-w-md rounded-2xl bg-teal-950 border-2 border-teal-400 p-6 text-white shadow-2xl text-center">
          <Scale className="w-12 h-12 text-amber-300 mx-auto mb-2" />
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-teal-300">
            SIDANG MEJA HIJAU · PENGADILAN (#30)
          </div>
          <h3 className="text-xl font-black mt-1">
            Lempar Dadu Vonis Hakim!
          </h3>

          <div className="mt-3 text-xs text-teal-100/90 space-y-1.5 bg-black/30 p-3.5 rounded-xl border border-teal-800 text-left">
            <div>🎲 <strong>Angka 5–6:</strong> Menang gugatan! Dapat uang <strong>Rp1 Jt</strong> dari Negara.</div>
            <div>🎲 <strong>Angka 3–4:</strong> Kalah! Pindah ke <strong>LAPAS (#10)</strong> & bayar denda <strong>Rp1,5 Jt</strong>.</div>
            <div>🎲 <strong>Angka 1–2:</strong> Vonis Berat! Pindah ke <strong>LAPAS (#10)</strong> & <strong>50% uang tunai disita Negara!</strong></div>
          </div>

          {courtDiceResult === null ? (
            <button
              type="button"
              onClick={onRollCourtDice}
              className="mt-5 w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm uppercase shadow-[0_4px_0_#b45309] cursor-pointer"
            >
              LEMPAR DADU VONIS
            </button>
          ) : (
            <div className="mt-4">
              <div className="text-3xl font-mono font-black text-amber-300">
                ANGKA DADU VONIS: {courtDiceResult}
              </div>
              <button
                type="button"
                onClick={onConfirmCourtVerdict}
                className="mt-4 w-full py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-sm uppercase shadow-[0_4px_0_#047857] cursor-pointer"
              >
                TERIMA PUTUSAN MEJA HIJAU
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 13. BELI TANAH & UPGRADE BANGUNAN MODAL (DENGAN OPSI HARBOLNAS 12.12 DISKON 50%)
  if (showBuyUpgradeModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
        <div className="w-full max-w-lg rounded-2xl bg-[#271307] border-2 border-amber-400 p-5 text-amber-50 shadow-2xl">
          <div className="flex items-center justify-between border-b border-amber-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <h3 className="text-base sm:text-lg font-black">
                {startUpgradeBanner
                  ? '🎉 GAJIAN START! UPGRADE BANGUNAN'
                  : 'KEPEMILIKAN TANAH & UPGRADE BANGUNAN'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onCloseBuyUpgradeModal}
              aria-label="Tutup Modal Beli Upgrade"
              className="p-1 rounded-lg bg-amber-900/60 hover:bg-amber-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {startUpgradeBanner && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/70 text-xs text-emerald-200">
              Kamu baru saja melewati/berhenti di <strong>START (#0)</strong>! Kamu mendapat Gaji{' '}
              <strong>
                {activePlayer.wantimpresActive ? '+Rp76,5 Jt (Wantimpres)' : '+Rp1 Jt'}
              </strong>{' '}
              dan <strong>+1 Kuota Upgrade Bangunan</strong>:
            </div>
          )}

          {/* Section A: Buy Current Tile if Unowned Property */}
          <div className="mt-3 p-3.5 rounded-xl bg-amber-950/70 border border-amber-800/80">
            <div className="text-xs font-mono uppercase text-amber-300 font-bold">
              PETAK SAAT INI: #{activePlayer.position} ·{' '}
              {currentTile ? currentTile.name : 'Bekasi'}
            </div>
            {currentTile && currentTile.type === 'PROPERTY' && currentProp ? (
              currentProp.isSeizedByState ? (
                <div className="mt-1.5 flex items-center gap-2 text-xs text-rose-300 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Tanah ini berstatus SITAAN NEGARA! Hanya bisa dibeli lewat fitur Sel Premium 👑.
                  </span>
                </div>
              ) : currentProp.ownerId === null ? (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-extrabold text-white">
                        Harga Tanah: {formatRupiah(fullPrice)}
                      </div>
                      <div className="text-xs text-amber-200/85">
                        Tingkat 0 (Tanah Kosong) · Sewa 20%:{' '}
                        {formatRupiah(calculatePropertyRent(currentTile, 0))}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canBuyCurrentTileNormal}
                      onClick={() => onBuyProperty(currentTile.id, false)}
                      className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase cursor-pointer ${
                        canBuyCurrentTileNormal
                          ? 'bg-emerald-400 hover:bg-emerald-300 text-stone-950 shadow-[0_3px_0_#047857]'
                          : 'bg-stone-700 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      BELI TANAH ({formatRupiah(fullPrice)})
                    </button>
                  </div>

                  {/* Tombol 🛍️ Pakai Harbolnas 12.12 (Beli Setengah Harga 50%) */}
                  {hasHarbolnasCard && (
                    <button
                      type="button"
                      disabled={!canBuyCurrentTileHarbolnas}
                      onClick={() => onBuyProperty(currentTile.id, true)}
                      className={`w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                        canBuyCurrentTileHarbolnas
                          ? 'bg-gradient-to-r from-pink-500 to-amber-400 hover:brightness-110 text-stone-950 shadow-[0_3px_0_#9d174d]'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      🛍️ Pakai Harbolnas 12.12 (Beli Setengah Harga 50%: {formatRupiah(harbolnasPrice)})
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-1 text-xs text-amber-200">
                  Tanah ini dimiliki oleh{' '}
                  <strong>
                    {players.find((p) => p.id === currentProp.ownerId)?.name}
                  </strong>{' '}
                  · Tingkat {currentProp.level} ({BUILDING_NAMES[currentProp.level]}).
                </div>
              )
            ) : (
              <div className="mt-1 text-xs text-amber-200/80">
                Petak ini bukan tanah properti yang bisa dibeli.
              </div>
            )}
          </div>

          {/* Section B: Upgrade Owned Properties */}
          <div className="mt-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                Kuota Upgrade START: {activePlayer.upgradeTokens}x Tersedia
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                Saldo: {formatRupiah(activePlayer.money)}
              </span>
            </div>
            <div className="text-[10.5px] text-amber-200/80 mt-0.5 leading-snug">
              Tarif Upgrade: Lv1 R.Subsidi 1 (Rp500rb → Sewa 40%) · Lv2 R.Subsidi 2 (Rp1 Jt → 70%) · Lv3 R.OKB (Rp1,5 Jt → 100%) · Lv4 Dapur SPPG (Rp2 Jt → 150%) · Lv5 KopDes (Rp3 Jt → 250%)
            </div>

            <div className="mt-2.5 max-h-48 overflow-y-auto space-y-2 pr-1">
              {ownedProperties.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-900/50 text-center text-xs text-amber-200/70">
                  Kamu belum memiliki tanah. Beli tanah saat mendarat di petak kota kosong!
                </div>
              ) : (
                ownedProperties.map((prop) => {
                  const tile = BOARD_TILES.find((t) => t.id === prop.tileId)!;
                  const nextLevel = (prop.level + 1) as BuildingLevel;
                  const cost =
                    prop.level < 5 ? getUpgradeCostForNextLevel(nextLevel) : 0;
                  const canUpgrade =
                    prop.level < 5 &&
                    activePlayer.upgradeTokens > 0 &&
                    activePlayer.money >= cost;

                  return (
                    <div
                      key={prop.tileId}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-950/80 border border-amber-800/70"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-white">
                          #{tile.id} {tile.name}{' '}
                          <span className="text-amber-300">
                            · Lv.{prop.level} ({BUILDING_NAMES[prop.level]})
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-200/85">
                          Sewa Saat Ini ({Math.round(BUILDING_RENT_RATES[prop.level] * 100)}%):{' '}
                          <strong>
                            {formatRupiah(calculatePropertyRent(tile, prop.level))}
                          </strong>
                          {prop.level < 5 && (
                            <span>
                              {' '}
                              → Naik jadi{' '}
                              {formatRupiah(calculatePropertyRent(tile, nextLevel))} (
                              {Math.round(BUILDING_RENT_RATES[nextLevel] * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>

                      {prop.level < 5 ? (
                        <button
                          type="button"
                          disabled={!canUpgrade}
                          onClick={() => onUpgradeProperty(prop.tileId)}
                          className={`px-3 py-1.5 rounded-lg font-extrabold text-[11px] whitespace-nowrap shrink-0 cursor-pointer ${
                            canUpgrade
                              ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow'
                              : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          Upgrade {BUILDING_NAMES[nextLevel]} ({formatRupiah(cost)})
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-emerald-900 text-emerald-300 text-[10px] font-black shrink-0">
                          MAX: KOPDES (250%)
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseBuyUpgradeModal}
            className="mt-4 w-full py-2.5 rounded-xl bg-amber-900/70 hover:bg-amber-800 text-amber-200 font-bold text-xs uppercase cursor-pointer"
          >
            Selesai / Tutup Panel Properti
          </button>
        </div>
      </div>
    );
  }

  // 14. MODAL MANAJEMEN & BAYAR UTANG RENTENIR ("BAYAR UTANG")
  if (showLoanManagerModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
        <div className="w-full max-w-lg rounded-2xl bg-[#271307] border-2 border-amber-400 p-5 text-amber-50 shadow-2xl">
          <div className="flex items-center justify-between border-b border-amber-800 pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-black">
                BUKU UTANG RENTENIR & CICILAN ({activePlayer.name})
              </h3>
            </div>
            <button
              type="button"
              onClick={onCloseLoanManagerModal}
              className="p-1 rounded-lg bg-amber-900/60 hover:bg-amber-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-2.5 text-xs text-amber-200/90 leading-relaxed">
            Utang ke pemain lain memiliki batas waktu <strong>3 putaran giliran peminjam</strong>. Jika belum lunas saat jatuh tempo, sistem otomatis menjalankan <strong>TAGIH PAKSA</strong> (potong uang & paksa jual aset 50%)!
          </p>

          <div className="mt-3 max-h-60 overflow-y-auto space-y-2 pr-1">
            {activePlayerLoans.length === 0 ? (
              <div className="p-5 rounded-xl bg-amber-950/50 border border-amber-900 text-center text-xs text-emerald-300 font-bold">
                ✅ Alhamdulillah! Kamu sedang bebas dari utang rentenir.
              </div>
            ) : (
              activePlayerLoans.map((loan) => {
                const lender = players.find((p) => p.id === loan.lenderId);
                return (
                  <div
                    key={loan.id}
                    className="p-3 rounded-xl bg-amber-950/90 border border-amber-700 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white">
                        Kreditur: {lender?.avatarEmoji} {lender?.name} (Bunga {loan.interestRate}%)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-700 text-white font-mono text-[10px] font-black">
                        Sisa Tempo: {loan.turnsLeft} Giliran
                      </span>
                    </div>
                    <div className="text-xs text-amber-200 flex justify-between">
                      <span>Pokok: {formatRupiah(loan.principal)}</span>
                      <span className="font-mono font-black text-rose-300">
                        Sisa Tagihan: {formatRupiah(loan.remainingDue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={activePlayer.money < 500_000}
                        onClick={() => onRepayLoan(loan.id, 500_000)}
                        className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-black text-[11px] uppercase cursor-pointer"
                      >
                        Cicil Rp500 Rb
                      </button>
                      <button
                        type="button"
                        disabled={activePlayer.money <= 0}
                        onClick={() =>
                          onRepayLoan(
                            loan.id,
                            Math.min(activePlayer.money, loan.remainingDue)
                          )
                        }
                        className="flex-1 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-black text-[11px] uppercase cursor-pointer"
                      >
                        Bayar Lunas ({formatRupiah(Math.min(activePlayer.money, loan.remainingDue))})
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={onCloseLoanManagerModal}
            className="mt-4 w-full py-2.5 rounded-xl bg-amber-900/70 hover:bg-amber-800 text-amber-200 font-bold text-xs uppercase cursor-pointer"
          >
            Tutup Buku Utang
          </button>
        </div>
      </div>
    );
  }

  // 15. KASIH DUIT MODAL (TRANSFER LANGSUNG TANPA DIHITUNG PENDAPATAN PERINGKAT)
  if (showGiveMoneyModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
        <div className="w-full max-w-md rounded-2xl bg-[#271307] border-2 border-emerald-400 p-5 text-amber-50 shadow-2xl">
          <div className="flex items-center justify-between border-b border-amber-800 pb-3">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-black">KASIH DUIT KE SESAMA WNI</h3>
            </div>
            <button
              type="button"
              onClick={onCloseGiveMoneyModal}
              aria-label="Tutup Modal Kasih Duit"
              className="p-1 rounded-lg bg-amber-900/60 hover:bg-amber-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-[11px] text-amber-200/85">
              *Uang kiriman ditransfer langsung ke pemain tujuan dan <strong>tidak dihitung sebagai pendapatan murni</strong> di papan peringkat.
            </p>
            <div>
              <label className="block text-xs font-bold uppercase text-amber-300 mb-1">
                Pilih Penerima Transfer:
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {otherPlayers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedTargetId(p.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-bold cursor-pointer ${
                      selectedTargetId === p.id
                        ? 'bg-emerald-900/60 border-emerald-400 text-white'
                        : 'bg-amber-950/60 border-amber-800/70 text-amber-200'
                    }`}
                  >
                    <span>
                      {p.avatarEmoji} {p.name}
                    </span>
                    <span className="font-mono">{formatRupiah(p.money)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-amber-300 mb-1">
                Pilih Nominal Rupiah:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[500_000, 1_000_000, 2_000_000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTransferAmount(amt)}
                    className={`py-2 rounded-xl font-mono font-extrabold text-xs border cursor-pointer ${
                      transferAmount === amt
                        ? 'bg-amber-400 text-stone-950 border-amber-300'
                        : 'bg-amber-950/70 text-amber-200 border-amber-800'
                    }`}
                  >
                    {formatRupiah(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="give-note-input"
                className="block text-xs font-bold uppercase text-amber-300 mb-1"
              >
                Catatan Transfer:
              </label>
              <input
                id="give-note-input"
                type="text"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-amber-950 border border-amber-700 text-xs text-white"
              />
            </div>

            <button
              type="button"
              disabled={activePlayer.money < transferAmount}
              onClick={() =>
                onGiveMoney(selectedTargetId, transferAmount, transferNote)
              }
              className="w-full py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:bg-stone-700 text-stone-950 font-black text-sm uppercase shadow-[0_4px_0_#047857] cursor-pointer"
            >
              KIRIM {formatRupiah(transferAmount)} SEKARANG
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 16. MINTA DUIT MODAL (KIRIM PERMINTAAN INTERAKTIF KE PEMAIN LAIN)
  if (showAskMoneyModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
        <div className="w-full max-w-md rounded-2xl bg-[#271307] border-2 border-amber-400 p-5 text-amber-50 shadow-2xl">
          <div className="flex items-center justify-between border-b border-amber-800 pb-3">
            <div className="flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-black">MINTA DUIT KE PEMAIN LAIN</h3>
            </div>
            <button
              type="button"
              onClick={onCloseAskMoneyModal}
              aria-label="Tutup Modal Minta Duit"
              className="p-1 rounded-lg bg-amber-900/60 hover:bg-amber-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-xs text-amber-200/90">
              Mengirim pop-up permintaan uang ke pemain tujuan. Pemain tersebut bisa klik <strong>Terima (Transfer)</strong> atau <strong>Tolak</strong>.
            </p>

            <div className="grid grid-cols-1 gap-1.5">
              {otherPlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedTargetId(p.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-bold cursor-pointer ${
                    selectedTargetId === p.id
                      ? 'bg-amber-800/80 border-amber-300 text-white'
                      : 'bg-amber-950/60 border-amber-800/70 text-amber-200'
                  }`}
                >
                  <span>
                    {p.avatarEmoji} {p.name}
                  </span>
                  <span className="font-mono">{formatRupiah(p.money)}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[500_000, 1_000_000, 1_500_000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTransferAmount(amt)}
                  className={`py-2 rounded-xl font-mono font-extrabold text-xs border cursor-pointer ${
                    transferAmount === amt
                      ? 'bg-amber-400 text-stone-950 border-amber-300'
                      : 'bg-amber-950/70 text-amber-200 border-amber-800'
                  }`}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                onSendAskMoneyRequest(
                  selectedTargetId,
                  transferAmount,
                  'Pinjam dulu seratus buat bertahan hidup'
                )
              }
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm uppercase shadow-[0_4px_0_#b45309] cursor-pointer"
            >
              KIRIM PERMINTAAN {formatRupiah(transferAmount)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 17. PAKAI KARTU SIMPANAN MODAL (MENDUKUNG KE-10 KARTU SIMPANAN LENGKAP FASE 3)
  if (selectedCardToUse) {
    const key = selectedCardToUse.key;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
        <div className="w-full max-w-md rounded-2xl bg-[#271307] border-2 border-amber-400 p-6 text-amber-50 shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded bg-amber-900/90 text-amber-300 text-xs font-mono font-bold uppercase">
              {selectedCardToUse.usageTiming}
            </span>
            <button
              type="button"
              onClick={() => {
                setFitnahDiceRoll(null);
                onCloseUseCardModal();
              }}
              aria-label="Tutup Kartu Simpanan"
              className="p-1 rounded-lg bg-amber-900/60 hover:bg-amber-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="my-4 text-center">
            <div className="text-4xl mb-2">{selectedCardToUse.emoji}</div>
            <h3 className="text-xl font-black text-white">
              {selectedCardToUse.name}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-amber-200/90 leading-relaxed">
              {selectedCardToUse.description}
            </p>
          </div>

          {/* KARTU FITNAH: Pilih 1 pemain target, lempar 1 dadu (1-2 target ke Lapas, 3-4 kamu ke Lapas, 5-6 berdua ke Pengadilan) */}
          {key === 'FITNAH' && (
            <div className="mb-4 space-y-3 text-left bg-amber-950/80 p-3.5 rounded-xl border border-amber-800">
              <div className="text-xs font-bold uppercase text-amber-300">
                Pilih Target Fitnah:
              </div>
              <div className="space-y-1.5">
                {otherPlayers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedTargetId(p.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs font-bold cursor-pointer ${
                      selectedTargetId === p.id
                        ? 'bg-rose-900/80 border-rose-400 text-white'
                        : 'bg-black/40 border-amber-900 text-amber-200'
                    }`}
                  >
                    <span>
                      {p.avatarEmoji} {p.name}
                    </span>
                    <span>Petak #{p.position}</span>
                  </button>
                ))}
              </div>

              {fitnahDiceRoll === null ? (
                <button
                  type="button"
                  onClick={() =>
                    setFitnahDiceRoll(Math.floor(Math.random() * 6) + 1)
                  }
                  className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase cursor-pointer"
                >
                  🎲 LEMPAR DADU FITNAH (1 DADU)
                </button>
              ) : (
                <div className="p-2.5 rounded-xl bg-black/50 border border-amber-400 text-center space-y-2">
                  <div className="text-sm font-mono font-black text-amber-300">
                    ANGKA DADU FITNAH: {fitnahDiceRoll}
                  </div>
                  <div className="text-xs text-white font-bold">
                    {resolveFitnahRoll(fitnahDiceRoll) === 'TARGET_TO_JAIL' &&
                      '🎯 Angka 1–2: Target Fitnah langsung masuk LAPAS (#10)!'}
                    {resolveFitnahRoll(fitnahDiceRoll) === 'SELF_TO_JAIL' &&
                      '💥 Angka 3–4: Senjata makan tuan! Kamu sendiri yang masuk LAPAS (#10)!'}
                    {resolveFitnahRoll(fitnahDiceRoll) === 'BOTH_TO_COURT' &&
                      '⚖️ Angka 5–6: Kamu dan Target sama-sama dikirim ke PENGADILAN (#30)!'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const rollVal = fitnahDiceRoll;
                      setFitnahDiceRoll(null);
                      onConfirmUseSavedCard(selectedCardToUse, {
                        targetPlayerId: selectedTargetId,
                        fitnahDiceResult: rollVal,
                      });
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs uppercase cursor-pointer"
                  >
                    JALANKAN HASIL FITNAH
                  </button>
                </div>
              )}
            </div>
          )}

          {/* KARTU DUKUN: Pilih dadu & ubah angkanya jadi 1-6 */}
          {key === 'DUKUN' && (
            <div className="mb-4 space-y-2.5 text-left bg-amber-950/80 p-3.5 rounded-xl border border-amber-800">
              <div className="text-xs font-bold uppercase text-amber-300">
                Pilih Dadu & Angka Baru (1–6):
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDukunDieIdx(0)}
                  className={`p-2 rounded-lg border text-xs font-bold cursor-pointer ${
                    dukunDieIdx === 0
                      ? 'bg-purple-700 border-amber-300 text-white'
                      : 'bg-black/40 border-amber-800 text-amber-200'
                  }`}
                >
                  Dadu #1 (Saat Ini: {dice[0]})
                </button>
                <button
                  type="button"
                  onClick={() => setDukunDieIdx(1)}
                  className={`p-2 rounded-lg border text-xs font-bold cursor-pointer ${
                    dukunDieIdx === 1
                      ? 'bg-purple-700 border-amber-300 text-white'
                      : 'bg-black/40 border-amber-800 text-amber-200'
                  }`}
                >
                  Dadu #2 (Saat Ini: {dice[1]})
                </button>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDukunTargetVal(val)}
                    className={`py-2 rounded-lg font-mono font-black text-sm border cursor-pointer ${
                      dukunTargetVal === val
                        ? 'bg-amber-400 text-stone-950 border-white'
                        : 'bg-black/40 text-white border-amber-800'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tombol Eksekusi Utama (Selain Fitnah yang punya tombol dadu sendiri) */}
          {key !== 'FITNAH' && (
            <button
              type="button"
              onClick={() =>
                onConfirmUseSavedCard(selectedCardToUse, {
                  targetPlayerId: selectedTargetId,
                  dukunDieIndex: dukunDieIdx,
                  dukunDieValue: dukunTargetVal,
                })
              }
              className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm uppercase tracking-wider shadow-[0_4px_0_#b45309] cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              {key === 'WANTIMPRES'
                ? '🏛️ Pakai Kartu Wantimpres (Simulasi Google Play)'
                : key === 'KHODAM'
                ? '✨ Aktifkan Lempar + Khodam (+2 Langkah)'
                : key === 'PEWARIS'
                ? '👑 Aktifkan 3 Dadu Pewaris Sekarang'
                : key === 'DUKUN'
                ? `🔮 Ubah Dadu #${dukunDieIdx + 1} Jadi ${dukunTargetVal}`
                : `GUNAKAN ${selectedCardToUse.name}`}
            </button>
          )}
        </div>
      </div>
    );
  }

  // 18. TILE INSPECTOR MODAL (WHEN CLICKING ANY BOARD TILE)
  if (selectedTileModal) {
    const prop =
      selectedTileModal.type === 'PROPERTY'
        ? properties[selectedTileModal.id]
        : null;
    const owner =
      prop && prop.ownerId !== null && !prop.isSeizedByState
        ? players.find((p) => p.id === prop.ownerId)
        : null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 pointer-events-auto">
        <div className="w-full max-w-sm rounded-2xl bg-[#271307] border-2 border-amber-400 p-5 text-amber-50 shadow-2xl">
          <div className="flex items-center justify-between border-b border-amber-800 pb-2.5">
            <span className="text-xs font-mono uppercase text-amber-300 font-bold">
              DETAIL PETAK #{selectedTileModal.id}
            </span>
            <button
              type="button"
              onClick={onCloseSelectedTileModal}
              aria-label="Tutup Detail Petak"
              className="p-1 rounded-lg bg-amber-900/60 hover:bg-amber-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-xl font-black text-white mt-2">
            {selectedTileModal.name}
          </h3>
          <p className="text-xs text-amber-300 font-semibold">
            {selectedTileModal.subtitle}
          </p>

          {selectedTileModal.type === 'PROPERTY' && prop && (
            <div className="mt-3 p-3 rounded-xl bg-amber-950/80 border border-amber-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-amber-200/80">Harga Tanah:</span>
                <span className="font-mono font-bold">
                  {formatRupiah(selectedTileModal.price ?? 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-200/80">Status Kepemilikan:</span>
                <span className="font-bold">
                  {prop.isSeizedByState
                    ? '🚨 SITAAN NEGARA'
                    : owner
                    ? `${owner.avatarEmoji} ${owner.name}`
                    : 'Tanah Kosong (Belum Dibeli)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-200/80">Tingkat Bangunan:</span>
                <span className="font-bold text-amber-300">
                  Lv.{prop.level} · {BUILDING_NAMES[prop.level]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-200/80">
                  Tarif Sewa Saat Ini ({Math.round(BUILDING_RENT_RATES[prop.level] * 100)}%):
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatRupiah(calculatePropertyRent(selectedTileModal, prop.level))}
                </span>
              </div>

              <div className="pt-2 mt-2 border-t border-amber-800/70 text-[10px] text-amber-200/80 space-y-0.5">
                <div className="font-bold text-amber-300">Daftar Tarif Sewa & Biaya Upgrade:</div>
                <div>• Lv.0 Tanah Kosong: {formatRupiah(calculatePropertyRent(selectedTileModal, 0))} (20%)</div>
                <div>• Lv.1 R.Subsidi 1 (Biaya Rp500 Rb): {formatRupiah(calculatePropertyRent(selectedTileModal, 1))} (40%)</div>
                <div>• Lv.2 R.Subsidi 2 (Biaya Rp1 Jt): {formatRupiah(calculatePropertyRent(selectedTileModal, 2))} (70%)</div>
                <div>• Lv.3 Rumah OKB (Biaya Rp1,5 Jt): {formatRupiah(calculatePropertyRent(selectedTileModal, 3))} (100%)</div>
                <div>• Lv.4 Dapur SPPG (Biaya Rp2 Jt): {formatRupiah(calculatePropertyRent(selectedTileModal, 4))} (150%)</div>
                <div>• Lv.5 KopDes (Biaya Rp3 Jt): {formatRupiah(calculatePropertyRent(selectedTileModal, 5))} (250%)</div>
              </div>
            </div>
          )}

          {selectedTileModal.id === BEKASI_TILE_ID && (
            <p className="mt-3 text-xs text-purple-200 bg-purple-950/80 border border-purple-700 p-3 rounded-xl">
              Petak khusus di luar angkasa tengah papan! Hanya dikunjungi jika terkena kartu <strong>"Digoreng Netizen Viral!"</strong> dan menyebabkan pemain skip 1 giliran.
            </p>
          )}

          <button
            type="button"
            onClick={onCloseSelectedTileModal}
            className="mt-4 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs uppercase cursor-pointer"
          >
            Tutup Info Petak
          </button>
        </div>
      </div>
    );
  }

  return null;
};
