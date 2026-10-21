import React, { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_INTRO_MOVIE_FILENAME,
  DURATION_MODE_OPTIONS,
  GameDurationMode,
  Player,
} from '../game/rules';
import {
  CustomImageAssets,
  getDefaultIntroMovieAsset,
  getPawnAvatarImageUrl,
} from '../game/customAssets';
import {
  Film,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
  Upload,
  Sparkles,
  Play,
  Pause,
  CheckCircle2,
} from 'lucide-react';

interface IntroMovieScreenProps {
  players: Player[];
  roomCode: string;
  durationMode: GameDurationMode;
  customAssets: CustomImageAssets;
  onUploadIntroMovie: (file: File) => void;
  onFinishMovie: () => void;
}

export const IntroMovieScreen: React.FC<IntroMovieScreenProps> = ({
  players,
  roomCode,
  durationMode,
  customAssets,
  onUploadIntroMovie,
  onFinishMovie,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(7);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const defaultAsset = getDefaultIntroMovieAsset();
  const activeVideoUrl = customAssets.introMovieUrl || defaultAsset.url;
  const activeCleanFilename =
    customAssets.introMovieFilename ||
    defaultAsset.cleanFilename ||
    DEFAULT_INTRO_MOVIE_FILENAME;
  const activeOriginalFilename =
    customAssets.introMovieOriginalFilename ||
    (defaultAsset.wasRenamed ? defaultAsset.originalFilename : null);

  const activeDurationOption =
    DURATION_MODE_OPTIONS.find((m) => m.id === durationMode) ||
    DURATION_MODE_OPTIONS[0];

  const triggerExitToGame = () => {
    if (isExiting) return;
    setIsExiting(true);
    window.setTimeout(() => {
      onFinishMovie();
    }, 260);
  };

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    setVideoError(null);
    try {
      vid.currentTime = 0;
    } catch {
      // Sebagian browser melempar error bila metadata video belum siap.
    }
    const tryPlay = () => {
      const playPromise = vid.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Fallback if browser requires muted autoplay
          vid.muted = true;
          setIsMuted(true);
          vid.play().catch(() => {
            // Autoplay tetap diblokir browser: biarkan pengguna menekan
            // tombol Putar atau langsung LEWATI MOVIE.
          });
        });
      }
    };
    tryPlay();
    // Beberapa browser butuh dipanggil lagi setelah metadata siap.
    const onReady = () => tryPlay();
    vid.addEventListener('loadeddata', onReady, { once: true });
    return () => vid.removeEventListener('loadeddata', onReady);
  }, [activeVideoUrl]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' ||
        e.code === 'Enter' ||
        e.code === 'Escape'
      ) {
        e.preventDefault();
        triggerExitToGame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleTogglePlayPause = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
      setIsPaused(false);
    } else {
      vid.pause();
      setIsPaused(true);
    }
  };

  const handleReplay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = 0;
    vid.play().catch(() => {});
    setIsPaused(false);
  };

  const handleToggleMute = () => {
    const vid = videoRef.current;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (vid) {
      vid.muted = nextMuted;
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUploadIntroMovie(file);
    e.target.value = '';
  };

  const formatSec = (sec: number) => {
    const safe = Math.max(0, Math.floor(sec || 0));
    const mins = Math.floor(safe / 60);
    const rem = safe % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <div
      data-testid="intro-movie-screen"
      className={`fixed inset-0 z-[85] bg-[#070301] text-amber-50 flex flex-col justify-between overflow-hidden select-none transition-opacity duration-300 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* TOP CINEMA LETTERBOX BAR */}
      <div className="relative z-20 px-4 sm:px-8 py-3 bg-gradient-to-b from-black via-black/95 to-transparent border-b border-amber-500/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(251,191,36,0.45)]">
            <Film className="w-3.5 h-3.5" />
            OPENING MOVIE · WNI SIMULATOR
          </span>

          <div
            data-testid="intro-movie-filename-badge"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/90 border border-amber-500/60 text-amber-200 text-xs font-mono font-bold"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>File: {activeCleanFilename}</span>
            {activeOriginalFilename && (
              <span className="text-[10px] text-emerald-300/90 hidden md:inline">
                (Di-rename dari: {activeOriginalFilename.slice(0, 32)}
                {activeOriginalFilename.length > 32 ? '…' : ''})
              </span>
            )}
          </div>
        </div>

        {/* TOP RIGHT CONTROLS: UPLOAD VIDEO MP4, REPLAY, MUTE */}
        <div className="flex items-center gap-2 flex-wrap">
          <label
            data-testid="intro-movie-upload-label"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 border border-purple-300 text-white font-black text-xs cursor-pointer shadow-lg transition-all"
            title="Pilih file video .MP4 dari perangkat Anda (otomatis di-rename menjadi intro-wni-simulator.mp4)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>📂 Ganti / Pilih Video (.MP4)</span>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/*"
              onChange={handleFileInput}
              className="hidden"
              data-testid="intro-movie-upload-input"
            />
          </label>

          <button
            type="button"
            onClick={handleTogglePlayPause}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/60 text-amber-200 font-bold text-xs cursor-pointer"
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Putar</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>Jeda</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReplay}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/60 text-amber-200 font-bold text-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ulangi</span>
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/60 text-amber-200 font-bold text-xs cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                <span>Suara OFF</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Suara ON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CENTER VIDEO STAGE */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black px-2 sm:px-6">
        {/* Ambient Golden Glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-45"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.28) 0%, rgba(15, 6, 2, 0.92) 75%)',
          }}
        />

        {/* Video Frame */}
        <div className="relative z-10 w-full max-w-6xl max-h-[72vh] aspect-video rounded-3xl overflow-hidden border-4 border-amber-400/90 shadow-[0_0_70px_rgba(245,158,11,0.35)] bg-[#120702] flex items-center justify-center">
          <video
            ref={videoRef}
            key={activeVideoUrl}
            src={activeVideoUrl}
            autoPlay
            playsInline
            preload="auto"
            muted={isMuted}
            data-testid="intro-movie-video"
            onError={() =>
              setVideoError(
                'Video opening gagal diputar. Periksa file /intro-wni-simulator.mp4 atau tekan tombol LEWATI MOVIE.'
              )
            }
            onTimeUpdate={(e) => {
              const el = e.currentTarget;
              setCurrentTimeSec(el.currentTime);
              if (el.duration && Number.isFinite(el.duration)) {
                setDurationSec(el.duration);
                setProgressPct(
                  Math.min(100, Math.round((el.currentTime / el.duration) * 100))
                );
              }
            }}
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              if (el.duration && Number.isFinite(el.duration)) {
                setDurationSec(el.duration);
              }
            }}
            onEnded={triggerExitToGame}
            onClick={handleTogglePlayPause}
            className="w-full h-full object-cover cursor-pointer"
          />

          {/* CINEMATIC CORNER CAPTION OVERLAY */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/75 border border-amber-400/60 backdrop-blur-xs">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                CUTSCENE PEMBUKA · ROOM #{roomCode}
              </div>
              <div className="text-xs sm:text-sm font-black text-white">
                Para Warga Melintasi Papan Monopoli Negeri Konoha
              </div>
            </div>
          </div>

          {videoError && (
            <div className="absolute inset-x-4 top-20 z-20 rounded-xl border border-rose-400/70 bg-rose-950/90 px-4 py-3 text-center text-xs font-bold text-rose-100">
              {videoError}
            </div>
          )}

          {/* BOTTOM VIDEO PROGRESS BAR */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-6 pb-2.5 px-4 pointer-events-none">
            <div className="flex items-center justify-between text-[11px] font-mono text-amber-200 mb-1">
              <span>
                🎬 Sedang Memutar Opening Movie ({activeCleanFilename})
              </span>
              <span>
                {formatSec(currentTimeSec)} / {formatSec(durationSec)} (
                {progressPct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-800/90 overflow-hidden border border-amber-500/40">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-300 to-emerald-400 transition-all duration-150"
                style={{ width: `${Math.max(4, progressPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CINEMA BAR: PLAYER LINEUP & SKIP / ENTER GAME BUTTON */}
      <div className="relative z-20 px-4 sm:px-8 py-3.5 bg-gradient-to-t from-black via-black/95 to-transparent border-t border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Participating Players Preview */}
        <div className="flex items-center gap-2.5 overflow-x-auto max-w-full py-0.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 shrink-0">
            {players.length} Warga Siap Main ({activeDurationOption.shortLabel}):
          </span>
          <div className="flex items-center gap-1.5">
            {players.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-900/90 border border-amber-600/60 text-xs font-extrabold text-white shrink-0"
              >
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
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      p.avatarEmoji
                    );
                  })()}
                </span>
                <span className="truncate max-w-[90px]">{p.name}</span>
              </div>
            ))}
            {players.length > 6 && (
              <span className="px-2 py-1 rounded-lg bg-amber-950 text-amber-300 text-xs font-mono font-bold">
                +{players.length - 6} Warga
              </span>
            )}
          </div>
        </div>

        {/* Primary Action: Skip / Enter Main Game Immediately */}
        <button
          type="button"
          onClick={triggerExitToGame}
          data-testid="skip-intro-movie-btn"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 hover:brightness-110 active:translate-y-0.5 text-stone-950 font-black text-xs sm:text-sm shadow-[0_4px_0_#b45309] cursor-pointer shrink-0"
        >
          <span>LEWATI MOVIE & MASUK GAME UTAMA</span>
          <SkipForward className="w-4 h-4 fill-stone-950" />
        </button>
      </div>
    </div>
  );
};
