import React, { useState } from 'react';
import {
  AVATAR_CHARACTERS,
  DEFAULT_INTRO_MOVIE_FILENAME,
  DURATION_MODE_OPTIONS,
  GameDurationMode,
  Player,
  formatRupiah,
} from '../game/rules';
import {
  CustomImageAssets,
  getPawnAvatarImageUrl,
  getPublicAvatarsDiscovery,
} from '../game/customAssets';
import {
  Users,
  Sparkles,
  Copy,
  Check,
  Play,
  Plus,
  UserPlus,
  LogIn,
  LogOut,
  Cloud,
  ArrowLeft,
  Crown,
  Bot,
  ShieldCheck,
  Zap,
  Globe,
  Maximize2,
  Minimize2,
  Palette,
  Trash2,
  X,
  Timer,
  Film,
  Upload,
} from 'lucide-react';

interface LobbyAndWaitingRoomProps {
  screen: 'LOBBY' | 'WAITING_ROOM';
  nickname: string;
  onChangeNickname: (val: string) => void;
  selectedAvatarId: string;
  onSelectAvatarId: (id: string) => void;
  maxPlayers: number;
  onChangeMaxPlayers: (cap: number) => void;
  durationMode: GameDurationMode;
  onChangeDurationMode: (mode: GameDurationMode) => void;
  joinCodeInput: string;
  onChangeJoinCodeInput: (val: string) => void;
  roomCode: string;
  players: Player[];
  isHost: boolean;
  isOnlineRoom: boolean;
  firebaseUserEmail: string | null;
  firebaseUserName: string | null;
  lobbyError: string | null;
  isBusy: boolean;
  onSignInGoogle: () => void;
  onSignOutGoogle: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onQuickPlayLocal: () => void;
  onAddBots: (count: number) => void;
  onRemoveBot: (botId: number) => void;
  onRemoveAllBots: () => void;
  onStartGameFromWaitingRoom: () => void;
  onBackToLobby: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  customAssets: CustomImageAssets;
  onOpenCustomAssetsModal: () => void;
  onHoverPlayer?: (player: Player | null, clientX?: number, clientY?: number) => void;
  introMovieEnabled?: boolean;
  onToggleIntroMovieEnabled?: () => void;
  onUploadIntroMovie?: (file: File) => void;
  onPreviewIntroMovie?: () => void;
}

const CAPACITY_OPTIONS = [4, 8, 16, 32, 64];

export const AVATAR_BG_THEMES: Record<
  string,
  {
    cardBg: string;
    cardBorder: string;
    cardGlow: string;
    iconBg: string;
    imageBg: string;
    taglineColor: string;
  }
> = {
  ojol: {
    cardBg: 'bg-gradient-to-br from-emerald-950 via-emerald-900/60 to-[#022c22]',
    cardBorder: 'border-emerald-600/80',
    cardGlow: 'shadow-[0_0_20px_rgba(16,185,129,0.5)] border-emerald-400',
    iconBg: '#059669',
    imageBg: 'bg-emerald-950/70',
    taglineColor: 'text-emerald-300',
  },
  emak: {
    cardBg: 'bg-gradient-to-br from-rose-950 via-rose-900/60 to-[#4c0519]',
    cardBorder: 'border-rose-600/80',
    cardGlow: 'shadow-[0_0_20px_rgba(244,63,94,0.5)] border-rose-400',
    iconBg: '#e11d48',
    imageBg: 'bg-rose-950/70',
    taglineColor: 'text-rose-300',
  },
  pns: {
    cardBg: 'bg-gradient-to-br from-blue-950 via-blue-900/60 to-[#172554]',
    cardBorder: 'border-blue-600/80',
    cardGlow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)] border-blue-400',
    iconBg: '#2563eb',
    imageBg: 'bg-blue-950/70',
    taglineColor: 'text-blue-300',
  },
  mahasiswa: {
    cardBg: 'bg-gradient-to-br from-amber-950 via-amber-900/60 to-[#451a03]',
    cardBorder: 'border-amber-600/80',
    cardGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.5)] border-amber-400',
    iconBg: '#d97706',
    imageBg: 'bg-amber-950/70',
    taglineColor: 'text-amber-300',
  },
  bakso: {
    cardBg: 'bg-gradient-to-br from-cyan-950 via-cyan-900/60 to-[#083344]',
    cardBorder: 'border-cyan-600/80',
    cardGlow: 'shadow-[0_0_20px_rgba(6,182,212,0.5)] border-cyan-400',
    iconBg: '#0891b2',
    imageBg: 'bg-cyan-950/70',
    taglineColor: 'text-cyan-300',
  },
  sultan: {
    cardBg: 'bg-gradient-to-br from-purple-950 via-purple-900/60 to-[#3b0764]',
    cardBorder: 'border-purple-600/80',
    cardGlow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)] border-purple-400',
    iconBg: '#9333ea',
    imageBg: 'bg-purple-950/70',
    taglineColor: 'text-purple-300',
  },
  kurir: {
    cardBg: 'bg-gradient-to-br from-orange-950 via-orange-900/60 to-[#431407]',
    cardBorder: 'border-orange-600/80',
    cardGlow: 'shadow-[0_0_20px_rgba(249,115,22,0.5)] border-orange-400',
    iconBg: '#ea580c',
    imageBg: 'bg-orange-950/70',
    taglineColor: 'text-orange-300',
  },
  pengamen: {
    cardBg: 'bg-gradient-to-br from-pink-950 via-pink-900/60 to-[#500724]',
    cardBorder: 'border-pink-600/80',
    cardGlow: 'shadow-[0_0_20px_rgba(236,72,153,0.5)] border-pink-400',
    iconBg: '#db2777',
    imageBg: 'bg-pink-950/70',
    taglineColor: 'text-pink-300',
  },
};

export const LobbyAndWaitingRoom: React.FC<LobbyAndWaitingRoomProps> = ({
  screen,
  nickname,
  onChangeNickname,
  selectedAvatarId,
  onSelectAvatarId,
  maxPlayers,
  onChangeMaxPlayers,
  durationMode,
  onChangeDurationMode,
  joinCodeInput,
  onChangeJoinCodeInput,
  roomCode,
  players,
  isHost,
  isOnlineRoom,
  firebaseUserEmail,
  firebaseUserName,
  lobbyError,
  isBusy,
  onSignInGoogle,
  onSignOutGoogle,
  onCreateRoom,
  onJoinRoom,
  onQuickPlayLocal,
  onAddBots,
  onRemoveBot,
  onRemoveAllBots,
  onStartGameFromWaitingRoom,
  onBackToLobby,
  isFullscreen,
  onToggleFullscreen,
  customAssets,
  onOpenCustomAssetsModal,
  onHoverPlayer,
  introMovieEnabled = true,
  onToggleIntroMovieEnabled,
  onUploadIntroMovie,
  onPreviewIntroMovie,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const selectedAvatar =
    AVATAR_CHARACTERS.find((a) => a.id === selectedAvatarId) ||
    AVATAR_CHARACTERS[0];
  const publicAvatarsInfo = getPublicAvatarsDiscovery();

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomCode).catch(() => {});
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (screen === 'WAITING_ROOM') {
    const remainingSlots = Math.max(0, maxPlayers - players.length);
    const botCount = players.filter((p) => p.isBot).length;
    const humanCount = players.filter((p) => !p.isBot).length;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
        <div className="w-full max-w-5xl rounded-3xl bg-gradient-to-b from-[#3d1c08] via-[#281205] to-[#1a0b03] border-4 border-amber-400 p-4 sm:p-6 text-amber-50 shadow-[0_25px_80px_rgba(0,0,0,0.9)] my-auto">
          {/* TOP HEADER BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-800/80">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBackToLobby}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-600/70 text-amber-200 text-xs font-extrabold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Lobby</span>
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-stone-950 font-black text-[10px] uppercase tracking-wider">
                    RUANG TUNGGU WARGA +62
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                      isOnlineRoom
                        ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                        : 'bg-sky-950/90 border-sky-500 text-sky-300'
                    }`}
                  >
                    <Cloud className="w-3 h-3" />
                    {isOnlineRoom
                      ? 'Firebase Firestore Real-Time Aktif'
                      : 'Sinkronisasi Room Siap (Cloud + Lokal)'}
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl font-black text-white mt-1">
                  Persiapan Masuk Negeri Konoha (Hingga 64 Pemain)
                </h1>
              </div>
            </div>

            {/* ROOM CODE DISPLAY, COPY BUTTON & FULLSCREEN BUTTON */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2.5 bg-[#160902] border-2 border-amber-400 rounded-2xl px-4 py-2 shadow-lg">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
                    KODE ROOM MULTIPLAYER
                  </div>
                  <div
                    data-testid="waiting-room-code"
                    className="text-xl sm:text-2xl font-mono font-black tracking-widest text-yellow-300"
                  >
                    {roomCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs cursor-pointer shadow"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-900" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={onOpenCustomAssetsModal}
                data-testid="waiting-room-custom-assets-btn"
                className="flex items-center gap-1.5 px-3 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 border-2 border-purple-300 text-white font-black text-xs cursor-pointer shadow-lg shrink-0"
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">🎨 Ganti Gambar Pion & Bangunan</span>
              </button>

              <button
                type="button"
                onClick={onToggleFullscreen}
                aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
                title="Mode Layar Penuh (Full Screen) [F]"
                className="flex items-center gap-1.5 px-3 py-3 rounded-2xl bg-[#160902] hover:bg-amber-950 border-2 border-amber-400 text-amber-300 font-black text-xs cursor-pointer shadow-lg shrink-0"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4 text-amber-300" />
                    <span className="hidden sm:inline">Keluar Full</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4 text-amber-300" />
                    <span className="hidden sm:inline">Full Screen</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CAPACITY & HOST BOT CONTROLS */}
          <div className="mt-4 p-3.5 rounded-2xl bg-black/40 border border-amber-700/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-950/90 border border-amber-500/80">
                <Users className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-300">
                    Kapasitas Room
                  </div>
                  <div
                    data-testid="waiting-room-count"
                    className="text-sm sm:text-base font-mono font-black text-white"
                  >
                    Kapasitas: {players.length} / {maxPlayers} Warga
                  </div>
                </div>
              </div>

              {isHost && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-200 mr-1">
                    Batas Maks:
                  </span>
                  {CAPACITY_OPTIONS.map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => onChangeMaxPlayers(cap)}
                      className={`px-2.5 py-1.5 rounded-lg font-mono text-xs font-black border cursor-pointer transition-all ${
                        maxPlayers === cap
                          ? 'bg-amber-400 text-stone-950 border-white shadow'
                          : 'bg-stone-900/90 text-amber-200 border-amber-800 hover:bg-amber-950'
                      }`}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* HOST BOT FILLER & KICK BUTTONS */}
            {isHost && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={remainingSlots <= 0}
                  onClick={() => onAddBots(1)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-stone-950 font-black text-xs shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Bot WNI</span>
                </button>

                <button
                  type="button"
                  disabled={remainingSlots <= 0}
                  onClick={() => onAddBots(8)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 disabled:opacity-40 text-stone-950 font-black text-xs shadow cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+8 Bot Sekaligus</span>
                </button>

                <button
                  type="button"
                  disabled={players.length >= maxPlayers}
                  onClick={() => onAddBots(maxPlayers - players.length)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-400 hover:bg-purple-300 disabled:opacity-40 text-stone-950 font-black text-xs shadow cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Penuhkan ({maxPlayers} Warga)</span>
                </button>

                <button
                  type="button"
                  disabled={botCount === 0}
                  onClick={onRemoveAllBots}
                  data-testid="remove-all-bots-btn"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 border border-rose-300/70 text-white font-black text-xs shadow cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>🗑️ Hapus Semua Bot{botCount > 0 ? ` (${botCount})` : ''}</span>
                </button>
              </div>
            )}
          </div>

          {/* MODE DURASI PERMAINAN DI WAITING ROOM */}
          <div className="mt-3 p-3 rounded-2xl bg-amber-950/45 border border-amber-700/70 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300">
              <Timer className="w-4 h-4 text-amber-400" />
              <span>Mode Durasi Permainan:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {DURATION_MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`waiting-duration-mode-${opt.id}`}
                  onClick={() => onChangeDurationMode(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                    durationMode === opt.id
                      ? 'bg-amber-400 text-stone-950 border-white shadow'
                      : 'bg-stone-900/90 text-amber-200 border-amber-800 hover:bg-amber-900/60'
                  }`}
                  title={opt.description}
                >
                  {opt.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* PLAYERS GRID (UP TO 64 PLAYERS SCROLLABLE + EMPTY SLOT PLACEHOLDERS) */}
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                Daftar Warga di Room ({humanCount} Manusia, {botCount} Bot, {remainingSlots} Slot Kosong):
              </span>
              <span className="text-[11px] text-amber-200/80">
                💡 Arahkan kursor ke karakter untuk melihat Avatar & Info Lengkap!
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1 p-1 rounded-2xl bg-black/30 border border-amber-900/60">
              {players.map((p, idx) => (
                <div
                  key={p.id}
                  data-testid={`waiting-player-card-${idx}`}
                  onMouseEnter={(e) => onHoverPlayer?.(p, e.clientX, e.clientY)}
                  onMouseMove={(e) => onHoverPlayer?.(p, e.clientX, e.clientY)}
                  onMouseLeave={() => onHoverPlayer?.(null)}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border shadow transition-all cursor-pointer hover:brightness-110"
                  style={{
                    background: `linear-gradient(135deg, ${p.color}35 0%, #1c0c04 100%)`,
                    borderColor: `${p.color}aa`,
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 border-white shrink-0 shadow overflow-hidden"
                      style={{
                        backgroundColor:
                          AVATAR_BG_THEMES[p.avatarId || '']?.iconBg || p.color,
                      }}
                    >
                      {(() => {
                        const pawnImgUrl = getPawnAvatarImageUrl(
                          p.avatarId,
                          customAssets
                        );
                        const pTheme = AVATAR_BG_THEMES[p.avatarId || ''];
                        return pawnImgUrl ? (
                          <img
                            src={pawnImgUrl}
                            alt={p.name}
                            className={`w-full h-full object-contain ${
                              pTheme?.imageBg || 'bg-black/40'
                            } p-0.5`}
                          />
                        ) : (
                          p.avatarEmoji
                        );
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          #{idx + 1}
                        </span>
                        {p.isHost && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-yellow-400 text-stone-950 text-[8.5px] font-black uppercase">
                            <Crown className="w-2.5 h-2.5" /> HOST
                          </span>
                        )}
                        {p.isBot && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-sky-900 border border-sky-500 text-sky-200 text-[8.5px] font-bold uppercase">
                            <Bot className="w-2.5 h-2.5" /> BOT
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-white truncate mt-0.5">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-amber-200/75 truncate">
                        {p.role}
                      </div>
                    </div>
                  </div>

                  {isHost && p.isBot && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBot(p.id);
                      }}
                      data-testid={`kick-bot-btn-${p.id}`}
                      title={`Keluarkan Bot ${p.name}`}
                      className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg bg-rose-900/90 hover:bg-rose-600 border border-rose-400/80 text-rose-100 font-black text-[10px] shrink-0 cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3" />
                      <span>✕ Hapus Bot</span>
                    </button>
                  )}
                </div>
              ))}

              {/* PLACEHOLDER SLOTS BERGARIS PUTUS-PUTUS UNTUK SLOT KOSONG */}
              {Array.from({ length: remainingSlots }).map((_, emptyIdx) => {
                const slotNumber = players.length + emptyIdx + 1;
                return (
                  <div
                    key={`empty-slot-${slotNumber}`}
                    data-testid={`waiting-empty-slot-${slotNumber}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/25 border-2 border-dashed border-amber-700/50 text-amber-200/60"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-mono font-bold border border-dashed border-amber-700/60 bg-amber-950/30 text-amber-400/70 shrink-0">
                      #{slotNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-extrabold text-amber-200/80 leading-snug">
                        Menunggu Warga Bergabung... (Slot Kosong)
                      </div>
                      <div className="text-[9.5px] text-amber-400/60 truncate mt-0.5">
                        Bagikan kode {roomCode} ke teman
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* OPENING MOVIE CONTROL BAR DI WAITING ROOM */}
          <div className="mt-3 p-3 rounded-2xl bg-purple-950/45 border border-purple-400/70 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-black uppercase text-amber-300">
                  🎬 Opening Movie Sebelum Masuk Game:{' '}
                </span>
                <span className="font-mono font-bold text-emerald-300">
                  {customAssets.introMovieFilename ||
                    DEFAULT_INTRO_MOVIE_FILENAME}
                </span>
                {customAssets.introMovieOriginalFilename && (
                  <span className="text-[10px] text-amber-200/80 ml-1.5">
                    (Di-rename dari: {customAssets.introMovieOriginalFilename})
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {onToggleIntroMovieEnabled && (
                <button
                  type="button"
                  onClick={onToggleIntroMovieEnabled}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black border cursor-pointer ${
                    introMovieEnabled
                      ? 'bg-emerald-400 text-stone-950 border-white'
                      : 'bg-stone-900 text-stone-300 border-stone-600'
                  }`}
                >
                  {introMovieEnabled ? '✓ Movie ON' : 'Movie OFF'}
                </button>
              )}

              {onPreviewIntroMovie && (
                <button
                  type="button"
                  onClick={onPreviewIntroMovie}
                  data-testid="waiting-preview-movie-btn"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-[11px] cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-stone-950" />
                  <span>Preview Movie</span>
                </button>
              )}

              {onUploadIntroMovie && (
                <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-[11px] cursor-pointer">
                  <Upload className="w-3 h-3" />
                  <span>Ganti Video (.MP4)</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadIntroMovie(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                    data-testid="waiting-upload-movie-input"
                  />
                </label>
              )}
            </div>
          </div>

          {/* BOTTOM ACTION BAR: START GAME (HOST) OR WAITING STATE (GUEST) */}
          <div className="mt-4 pt-3.5 border-t border-amber-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-amber-200/90">
              {!isHost ? (
                <span>
                  ⏳ <strong>Ruang Tunggu Warga:</strong> Anda berada di Room <strong>{roomCode}</strong>. Menunggu Host memulai permainan untuk bersama-sama masuk ke Negeri Konoha!
                </span>
              ) : players.length < 2 ? (
                <span>
                  ⏳ <strong>Menunggu Minimal 2 Warga:</strong> Ajak teman Join lewat Kode Room <strong>{roomCode}</strong> atau klik <strong>+ Tambah Bot WNI</strong> untuk mulai bermain!
                </span>
              ) : (
                <span>
                  🎬 <strong>Permainan Siap Dimulai:</strong> Klik tombol Mulai Permainan untuk membawa seluruh {players.length} Warga masuk serentak ke papan Negeri Konoha!
                </span>
              )}
            </div>

            {!isHost ? (
              <button
                type="button"
                disabled={true}
                data-testid="waiting-guest-disabled-btn"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-stone-900 border-2 border-amber-500/60 text-amber-300 font-extrabold text-sm sm:text-base shadow cursor-not-allowed opacity-90 shrink-0"
              >
                <span>⏳ MENUNGGU HOST MEMULAI PERMAINAN...</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartGameFromWaitingRoom}
                disabled={isBusy || players.length < 2}
                data-testid="waiting-start-game-btn"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:brightness-110 disabled:opacity-45 active:translate-y-0.5 text-stone-950 font-black text-sm sm:text-base shadow-[0_5px_0_#b45309] cursor-pointer shrink-0"
              >
                <Play className="w-5 h-5 fill-stone-950" />
                <span>
                  MULAI PERMAINAN ({players.length} WARGA MASUK KONOHA)
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // SCREEN === 'LOBBY' (MAIN MENU & PLAYER SELECT)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-3xl bg-gradient-to-b from-[#3d1c08]/95 via-[#261105]/95 to-[#180a02]/95 border-4 border-amber-400 p-4 sm:p-6 text-amber-50 shadow-[0_25px_80px_rgba(0,0,0,0.9)] my-auto">
        {/* TOP BRANDING & FIREBASE AUTH STATUS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-amber-800/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg bg-amber-400 text-stone-950 font-black text-[10px] sm:text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 fill-stone-950" />
              EDISI LENGKAP FASE 1 - 4 · MULTIPLAYER HINGGA 64 PEMAIN
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              WNI SIMULATOR:{' '}
              <span className="text-amber-400">
                BERTAHAN HIDUP DI NEGERI KONOHA
              </span>
            </h1>
            <p className="text-xs text-amber-200/85 mt-0.5">
              Pilih Avatar Warga +62, buat atau gabung Room hingga 64 pemain, dan bertahanlah dari kebangkrutan karena Juara 1 selalu Negara!
            </p>
          </div>

          {/* FIREBASE AUTH BAR, CUSTOM ASSETS BUTTON & FULL SCREEN BUTTON */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenCustomAssetsModal}
              data-testid="lobby-custom-assets-btn"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 border-2 border-purple-300 text-white font-black text-xs shadow-[0_3px_0_#581c87] cursor-pointer transition-all"
            >
              <Palette className="w-4 h-4" />
              <span>🎨 Ganti Gambar Pion & Bangunan</span>
            </button>

            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
              title="Mode Layar Penuh (Full Screen) [F]"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs shadow-[0_3px_0_#b45309] cursor-pointer transition-all"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>Keluar Full Screen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span>Full Screen</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 bg-black/45 border border-amber-600/60 rounded-2xl px-3 py-2">
              {firebaseUserEmail ? (
                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Firebase Cloud Terhubung</span>
                    </div>
                    <div className="text-xs font-extrabold text-white truncate max-w-[160px]">
                      {firebaseUserName || firebaseUserEmail}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onSignOutGoogle}
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 cursor-pointer"
                    title="Keluar Akun Google"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-left">
                    <div className="text-[10px] font-bold text-amber-300 uppercase">
                      Mode Cloud / Lokal
                    </div>
                    <div className="text-[11px] text-amber-100/85">
                      Bisa langsung main atau Login Google
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onSignInGoogle}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-950 font-black text-xs shadow cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-blue-600" />
                    <span>Login Google</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {lobbyError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/90 border-2 border-rose-500 text-xs font-bold text-rose-200">
            ⚠️ {lobbyError}
          </div>
        )}

        {/* MAIN 2-COLUMN LAYOUT: LEFT = NICKNAME & 8 AVATAR SELECT, RIGHT = ROOM & MODE SELECT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
          {/* LEFT COLUMN (7 COLS): INPUT NAMA WARGA & PILIH AVATAR KARAKTER */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* a) Input Nama Warga */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-700/70">
              <label
                htmlFor="warga-nickname-input"
                className="block text-xs font-black uppercase tracking-wider text-amber-300 mb-1.5"
              >
                1. Identitas KTP Konoha — Nama Warga (Nickname):
              </label>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl border-2 border-white shrink-0 shadow-md overflow-hidden"
                  style={{
                    backgroundColor:
                      AVATAR_BG_THEMES[selectedAvatar.id]?.iconBg ||
                      selectedAvatar.color,
                  }}
                >
                  {(() => {
                    const selectedTheme = AVATAR_BG_THEMES[selectedAvatar.id];
                    const selectedImgUrl = getPawnAvatarImageUrl(
                      selectedAvatar.id,
                      customAssets
                    );
                    return selectedImgUrl ? (
                      <img
                        src={selectedImgUrl}
                        alt={selectedAvatar.title}
                        className={`w-full h-full object-contain ${
                          selectedTheme?.imageBg || 'bg-black/40'
                        } p-0.5`}
                      />
                    ) : (
                      selectedAvatar.emoji
                    );
                  })()}
                </div>
                <input
                  id="warga-nickname-input"
                  type="text"
                  maxLength={32}
                  value={nickname}
                  onChange={(e) => onChangeNickname(e.target.value)}
                  placeholder="Ketik nama warga (contoh: Bang Jago)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140802] border-2 border-amber-500/80 text-white font-extrabold text-sm focus:outline-none focus:border-yellow-300"
                />
              </div>
            </div>

            {/* b) Pilih Avatar Karakter (8 Karakter Unik + Folder Server /public/avatars/) */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-700/70 flex-1 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                    2. Pilih Karakter Warga (Avatar Ditentukan dari Folder Server):
                  </span>
                  <span className="text-[11px] font-bold text-emerald-300">
                    Terpilih: {selectedAvatar.emoji} {selectedAvatar.title} ("
                    {selectedAvatar.tagline}")
                  </span>
                </div>

                {/* Banner Info Folder /public/avatars/ */}
                <div
                  data-testid="lobby-public-avatars-banner"
                  className="mb-2.5 px-3 py-2 rounded-xl bg-emerald-950/75 border border-emerald-500/70 flex flex-wrap items-center justify-between gap-2 text-[11px]"
                >
                  <div className="text-emerald-100 leading-snug">
                    📂 <strong>Folder Server Avatar:</strong>{' '}
                    <code className="px-1.5 py-0.5 rounded bg-black/60 text-amber-300 font-mono font-bold">
                      /public/avatars/
                    </code>{' '}
                    {publicAvatarsInfo.uploadedFiles.length > 0 ? (
                      <span className="text-emerald-300 font-extrabold">
                        — ✓ {publicAvatarsInfo.uploadedFiles.length} File Avatar Terdeteksi (Semua Pemain Memakai Avatar Ini!)
                      </span>
                    ) : (
                      <span className="text-amber-200/90">
                        — Upload gambar ke folder <code className="font-mono text-amber-300">/public/avatars/</code> agar semua pemain otomatis memakai avatar Anda!
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {AVATAR_CHARACTERS.map((av) => {
                    const isSelected = av.id === selectedAvatarId;
                    const customPawnImg = getPawnAvatarImageUrl(
                      av.id,
                      customAssets
                    );
                    const theme = AVATAR_BG_THEMES[av.id] || {
                      cardBg: 'bg-stone-900',
                      cardBorder: 'border-amber-700/80',
                      cardGlow: 'shadow-[0_0_20px_rgba(250,204,21,0.5)] border-yellow-300 ring-2 ring-yellow-300',
                      iconBg: av.color,
                      imageBg: 'bg-stone-950/80',
                      taglineColor: 'text-amber-300',
                    };

                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => onSelectAvatarId(av.id)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          theme.cardBg
                        } ${
                          isSelected
                            ? `${theme.cardGlow} scale-[1.03] shadow-lg ring-2 ring-yellow-300`
                            : `${theme.cardBorder} hover:scale-[1.02] hover:brightness-110 opacity-90 hover:opacity-100 shadow-md`
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl border-2 border-white/90 shadow-md overflow-hidden shrink-0"
                            style={{ backgroundColor: theme.iconBg || av.color }}
                          >
                            {customPawnImg ? (
                              <img
                                src={customPawnImg}
                                alt={av.title}
                                className={`w-full h-full object-contain ${theme.imageBg} p-0.5`}
                              />
                            ) : (
                              av.emoji
                            )}
                          </span>
                          {isSelected ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-yellow-400 text-stone-950 text-[8.5px] font-black uppercase tracking-wider shadow">
                              AKTIF
                            </span>
                          ) : (
                            <span
                              className="w-3.5 h-3.5 rounded-full border-2 border-white/80 shadow"
                              style={{ backgroundColor: theme.iconBg || av.color }}
                              title={av.title}
                            />
                          )}
                        </div>
                        <div className="mt-2.5">
                          <div className="text-xs font-black text-white leading-tight">
                            {av.title}
                          </div>
                          <div
                            className={`text-[10px] font-medium italic leading-tight mt-0.5 truncate ${theme.taglineColor}`}
                          >
                            "{av.tagline}"
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (5 COLS): BUAT ROOM (HOST), GABUNG ROOM (JOIN), & MAIN CEPAT */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3">
            {/* Option A: Buat Room Baru (Host) hingga 64 Pemain */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/90 to-[#1c0c04] border-2 border-amber-500/90 shadow-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  Buat Room Baru (Host)
                </span>
                <span className="text-[10px] font-mono text-emerald-300 font-bold">
                  4 s/d 64 Pemain
                </span>
              </div>
              <p className="text-[11px] text-amber-100/85 mb-2.5">
                Atur kapasitas maksimal warga di Room dan dapatkan Kode Room unik untuk dibagikan atau diisi Bot WNI:
              </p>

              <div className="mb-3">
                <div className="text-[10px] font-bold uppercase text-amber-300 mb-1">
                  Kapasitas Maksimal Pemain:
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {CAPACITY_OPTIONS.map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => onChangeMaxPlayers(cap)}
                      className={`py-1.5 rounded-xl font-mono text-xs font-black border cursor-pointer transition-all ${
                        maxPlayers === cap
                          ? 'bg-amber-400 text-stone-950 border-white shadow'
                          : 'bg-black/50 text-amber-200 border-amber-800 hover:bg-amber-900/50'
                      }`}
                    >
                      {cap}P
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={isBusy}
                onClick={onCreateRoom}
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 text-stone-950 font-black text-xs sm:text-sm shadow-[0_4px_0_#b45309] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>BUAT ROOM BARU (KAPASITAS {maxPlayers} WARGA)</span>
              </button>
            </div>

            {/* Option B: Gabung Room (Join) */}
            <div className="p-4 rounded-2xl bg-black/45 border border-sky-500/70">
              <label
                htmlFor="join-room-code-input"
                className="block text-xs font-black uppercase tracking-wider text-sky-300 mb-1.5"
              >
                Gabung Room Teman (Join via Kode Room):
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="join-room-code-input"
                  type="text"
                  maxLength={16}
                  value={joinCodeInput}
                  onChange={(e) =>
                    onChangeJoinCodeInput(e.target.value.toUpperCase())
                  }
                  placeholder="Contoh: WNI-882"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140802] border-2 border-sky-500/70 text-white font-mono font-black text-sm uppercase focus:outline-none focus:border-sky-300"
                />
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={onJoinRoom}
                  className="px-4 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-stone-950 font-black text-xs sm:text-sm shadow-[0_3px_0_#0369a1] cursor-pointer whitespace-nowrap shrink-0"
                >
                  GABUNG ROOM
                </button>
              </div>
            </div>

            {/* Pilih Mode Durasi Cepat / Klasik */}
            <div className="p-3.5 rounded-2xl bg-black/45 border border-amber-600/75">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  3. Pilih Mode Durasi Permainan:
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {DURATION_MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`lobby-duration-mode-${opt.id}`}
                    onClick={() => onChangeDurationMode(opt.id)}
                    className={`px-2.5 py-2 rounded-xl text-[11px] font-black border text-left cursor-pointer transition-all ${
                      durationMode === opt.id
                        ? 'bg-amber-400 text-stone-950 border-white shadow'
                        : 'bg-[#1a0b03] text-amber-200 border-amber-800/80 hover:border-amber-500'
                    }`}
                  >
                    <div>{opt.shortLabel}</div>
                  </button>
                ))}
              </div>
              <div className="mt-1.5 text-[10px] text-amber-200/85 leading-snug">
                {
                  DURATION_MODE_OPTIONS.find((m) => m.id === durationMode)
                    ?.description
                }
              </div>
            </div>

            {/* Option C: Main Cepat / Mode Simulasi Lokal + Opening Movie */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/80 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase text-emerald-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    Main Cepat / Simulasi Lokal
                  </div>
                  <div className="text-[11px] text-emerald-100/85">
                    Putar Opening Movie ({customAssets.introMovieFilename || DEFAULT_INTRO_MOVIE_FILENAME}) lalu terjun ke papan utama!
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onQuickPlayLocal}
                  data-testid="lobby-quick-play-btn"
                  className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-xs sm:text-sm shadow-[0_3px_0_#047857] cursor-pointer whitespace-nowrap shrink-0"
                >
                  ⚡ MAIN CEPAT
                </button>
              </div>

              {/* Strip Opening Movie (.mp4) & Auto-Rename */}
              <div className="pt-2 border-t border-emerald-700/50 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-amber-200 font-mono truncate">
                  <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    Movie: <strong>{customAssets.introMovieFilename || DEFAULT_INTRO_MOVIE_FILENAME}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {onPreviewIntroMovie && (
                    <button
                      type="button"
                      onClick={onPreviewIntroMovie}
                      data-testid="lobby-preview-movie-btn"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-[10px] cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 fill-stone-950" />
                      <span>Tonton Movie</span>
                    </button>
                  )}
                  {onUploadIntroMovie && (
                    <label
                      data-testid="lobby-upload-movie-label"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-black text-[10px] cursor-pointer"
                      title="Pilih video MP4 Anda (otomatis di-rename ke intro-wni-simulator.mp4)"
                    >
                      <Upload className="w-2.5 h-2.5" />
                      <span>📂 Pilih Video (.MP4)</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onUploadIntroMovie(file);
                          e.target.value = '';
                        }}
                        className="hidden"
                        data-testid="lobby-upload-movie-input"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
