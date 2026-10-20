import React from 'react';
import {
  AVATAR_CHARACTERS,
  BUILDING_NAMES,
  BuildingLevel,
  BUILDING_UPGRADE_COSTS,
  DEFAULT_INTRO_MOVIE_FILENAME,
  countSyncedCustomAssets,
  formatRupiah,
} from '../game/rules';
import {
  CustomImageAssets,
  compressImageFileToDataUrl,
  getPawnAvatarImageUrl,
  getPublicAvatarsDiscovery,
  hasAnyCustomAsset,
} from '../game/customAssets';
import { Building3DMiniature } from './Building3DMiniature';
import {
  Palette,
  Upload,
  RotateCcw,
  X,
  Check,
  Image as ImageIcon,
  User,
  Building2,
  Sparkles,
  Trash2,
  Film,
  Play,
  Cloud,
} from 'lucide-react';

interface CustomAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customAssets: CustomImageAssets;
  onChangeCustomAssets: (next: CustomImageAssets) => void;
  onUploadIntroMovie?: (file: File) => void;
  onRemoveIntroMovie?: () => void;
  onPreviewIntroMovie?: () => void;
  isOnlineRoom?: boolean;
  isHost?: boolean;
  roomCode?: string;
}

const BUILDING_LEVELS: BuildingLevel[] = [1, 2, 3, 4, 5];

export const CustomAssetsModal: React.FC<CustomAssetsModalProps> = ({
  isOpen,
  onClose,
  customAssets,
  onChangeCustomAssets,
  onUploadIntroMovie,
  onRemoveIntroMovie,
  onPreviewIntroMovie,
  isOnlineRoom = false,
  isHost = true,
  roomCode = '',
}) => {
  if (!isOpen) return null;

  const publicAvatarsInfo = getPublicAvatarsDiscovery();
  const syncedImageCount = countSyncedCustomAssets(customAssets);

  const handleUploadPawn = (avatarId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImageFileToDataUrl(file, 160).then((dataUrl) => {
      if (!dataUrl) return;
      onChangeCustomAssets({
        ...customAssets,
        pawns: {
          ...customAssets.pawns,
          [avatarId]: dataUrl,
        },
      });
    });
    e.target.value = '';
  };

  const handleRemovePawn = (avatarId: string) => {
    const nextPawns = { ...customAssets.pawns };
    delete nextPawns[avatarId];
    onChangeCustomAssets({
      ...customAssets,
      pawns: nextPawns,
    });
  };

  const handleUploadBuilding = (
    level: BuildingLevel,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImageFileToDataUrl(file, 180).then((dataUrl) => {
      if (!dataUrl) return;
      onChangeCustomAssets({
        ...customAssets,
        buildings: {
          ...customAssets.buildings,
          [level]: dataUrl,
        },
      });
    });
    e.target.value = '';
  };

  const handleRemoveBuilding = (level: BuildingLevel) => {
    const nextBuildings = { ...customAssets.buildings };
    delete nextBuildings[level];
    onChangeCustomAssets({
      ...customAssets,
      buildings: nextBuildings,
    });
  };

  const handleUploadCenterLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImageFileToDataUrl(file, 240).then((dataUrl) => {
      if (!dataUrl) return;
      onChangeCustomAssets({
        ...customAssets,
        boardCenterLogo: dataUrl,
      });
    });
    e.target.value = '';
  };

  const handleRemoveCenterLogo = () => {
    onChangeCustomAssets({
      ...customAssets,
      boardCenterLogo: null,
    });
  };

  const handleResetAllToDefault = () => {
    onRemoveIntroMovie?.();
    onChangeCustomAssets({
      pawns: {},
      buildings: {},
      boardCenterLogo: null,
      introMovieUrl: null,
      introMovieFilename: DEFAULT_INTRO_MOVIE_FILENAME,
      introMovieOriginalFilename: null,
    });
  };

  const anyCustom = hasAnyCustomAsset(customAssets);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-testid="custom-assets-modal"
        className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl bg-[#271206] border-4 border-amber-400 text-amber-50 shadow-[0_24px_60px_rgba(0,0,0,0.9)] overflow-hidden"
      >
        {/* MODAL HEADER */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-amber-950 via-[#381908] to-amber-950 border-b-2 border-amber-500/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg border-2 border-white shrink-0">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-white">
                  🎨 Kustomisasi Gambar (Upload File Langsung)
                </h2>
                {anyCustom && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-stone-950 text-[10px] font-black uppercase">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-200/90">
                Pilih foto PNG / JPG / WebP dari HP atau Laptop untuk mengganti Pion, Bangunan 3D, dan Logo Tengah Papan secara instan!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAllToDefault}
              data-testid="reset-custom-assets-btn"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow cursor-pointer border border-rose-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Gambar Bawaan</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Modal Kustomisasi"
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 border border-amber-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* BANNER STATUS SINKRONISASI GAMBAR KUSTOM HOST KE FIREBASE ROOM */}
          <div
            data-testid="firebase-custom-assets-sync-banner"
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-[#152e1d] to-emerald-950/90 border-2 border-emerald-400/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400 text-stone-950 flex items-center justify-center shrink-0 border-2 border-white shadow">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-emerald-200">
                    ☁️ Sinkronisasi Gambar Kustom Host ke Firebase Room: AKTIF
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-400 text-stone-950 text-[10px] font-black uppercase">
                    {syncedImageCount} Gambar Kustom Siap Sinkron
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-emerald-100/90 mt-0.5 leading-relaxed">
                  Saat Anda menjadi <strong>Host Room</strong>, seluruh gambar Pion, Bangunan 3D, dan Logo Tengah yang Anda upload di sini otomatis dikompresi ringan &amp; disinkronkan via <strong>Firebase Firestore</strong> sehingga <strong>semua pemain lain di Room yang sama langsung melihat gambar kustom Anda!</strong>
                </p>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              {isOnlineRoom && roomCode ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-[11px] font-black">
                  🟢 Terhubung ke Room #{roomCode} ({isHost ? 'Host' : 'Anggota'})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-200 text-[11px] font-black">
                  ⚡ Otomatis Sinkron saat Buat / Mulai Room
                </span>
              )}
            </div>
          </div>

          {/* SECTION A: 8 PION KARAKTER + FOLDER SERVER /public/avatars/ */}
          <div className="p-4 rounded-2xl bg-black/40 border border-amber-600/60 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">
                  A. Gambar Avatar & Pion Karakter Warga (Folder Server /public/avatars/)
                </h3>
              </div>
              <span className="text-[11px] text-amber-200/80">
                Format: PNG / JPG / WEBP / GIF / SVG
              </span>
            </div>

            {/* Banner Folder Server /public/avatars/ */}
            <div
              data-testid="public-avatars-folder-card"
              className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-stone-900/95 to-emerald-950/80 border-2 border-amber-400/80 flex flex-col gap-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black text-[10px] uppercase tracking-wider">
                    📂 FOLDER SERVER RESMI
                  </span>
                  <code className="px-2 py-0.5 rounded bg-black/70 border border-amber-500/60 text-amber-300 font-mono font-bold text-xs">
                    /public/avatars/
                  </code>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-300">
                  {publicAvatarsInfo.uploadedFiles.length > 0
                    ? `✓ ${publicAvatarsInfo.uploadedFiles.length} File Avatar di /public/avatars/ Aktif untuk Semua Pemain!`
                    : 'Siap Menerima Upload File Avatar Anda di /public/avatars/'}
                </span>
              </div>

              <p className="text-xs text-amber-100/90 leading-relaxed">
                Sesuai permintaan Anda, folder{' '}
                <strong className="font-mono text-amber-300">/public/avatars/</strong>{' '}
                telah disiapkan di panel File Explorer sebelah kiri. Semua gambar avatar yang Anda upload ke folder{' '}
                <strong className="font-mono text-amber-300">/public/avatars/</strong>{' '}
                akan <strong>otomatis langsung digunakan oleh seluruh pemain</strong> (Manusia maupun Bot di semua perangkat):
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-black/45 p-2.5 rounded-xl border border-amber-700/50">
                <div className="text-amber-100">
                  🎯 <strong>Cara 1 (1 Avatar untuk Semua Pemain):</strong> Upload{' '}
                  <strong>1 gambar saja</strong> dengan nama bebas (mis.{' '}
                  <code className="text-amber-300 font-mono">avatar.png</code>) ke{' '}
                  <code className="text-amber-300 font-mono">/public/avatars/</code> ➔ Semua pemain langsung memakai avatar tersebut!
                </div>
                <div className="text-amber-100">
                  🎭 <strong>Cara 2 (8 Avatar Karakter Berbeda):</strong> Beri nama{' '}
                  <code className="text-emerald-300 font-mono">ojol.png</code>,{' '}
                  <code className="text-emerald-300 font-mono">emak.png</code>,{' '}
                  <code className="text-emerald-300 font-mono">pns.png</code>,{' '}
                  <code className="text-emerald-300 font-mono">mahasiswa.png</code>,{' '}
                  <code className="text-emerald-300 font-mono">bakso.png</code>,{' '}
                  <code className="text-emerald-300 font-mono">sultan.png</code>,{' '}
                  <code className="text-emerald-300 font-mono">kurir.png</code>,{' '}
                  <code className="text-emerald-300 font-mono">pengamen.png</code>{' '}
                  (atau <code className="text-emerald-300 font-mono">1.png</code> s/d{' '}
                  <code className="text-emerald-300 font-mono">8.png</code>).
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {AVATAR_CHARACTERS.map((av) => {
                const customImg = getPawnAvatarImageUrl(av.id, customAssets);
                const isFromPublicFolder = Boolean(
                  publicAvatarsInfo.pawnsByAvatarId[av.id]
                );
                return (
                  <div
                    key={av.id}
                    className="p-3 rounded-2xl border-2 flex flex-col justify-between gap-2.5 shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${av.color}25 0%, #170902 100%)`,
                      borderColor: `${av.color}80`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-12 h-12 rounded-xl border-2 border-white flex items-center justify-center overflow-hidden shrink-0 shadow-md"
                        style={{ backgroundColor: av.color }}
                      >
                        {customImg ? (
                          <img
                            src={customImg}
                            alt={av.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">{av.emoji}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="text-xs font-black text-white truncate">
                            {av.title}
                          </div>
                          <code className="text-[9px] font-mono text-amber-300 bg-black/50 px-1 rounded">
                            {av.id}.png
                          </code>
                        </div>
                        <div className="text-[10px] text-amber-300/85 italic truncate">
                          "{av.tagline}"
                        </div>
                        <div className="mt-0.5 text-[9.5px] font-mono">
                          {isFromPublicFolder ? (
                            <span className="text-emerald-400 font-bold">
                              ✓ Dari /public/avatars/
                            </span>
                          ) : customImg ? (
                            <span className="text-emerald-400 font-bold">
                              ✓ Gambar Kustom Aktif
                            </span>
                          ) : (
                            <span className="text-stone-400">
                              Siap di /public/avatars/{av.id}.png
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-[11px] cursor-pointer shadow text-center">
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                        <span>Upload Gambar</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadPawn(av.id, e)}
                          className="hidden"
                          data-testid={`upload-pawn-${av.id}`}
                        />
                      </label>
                      {customAssets.pawns[av.id] && !isFromPublicFolder && (
                        <button
                          type="button"
                          onClick={() => handleRemovePawn(av.id)}
                          title="Hapus & Kembalikan Pion Bawaan"
                          className="p-2 rounded-xl bg-rose-900/90 hover:bg-rose-800 text-rose-200 border border-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION B: 5 TINGKAT BANGUNAN */}
          <div className="p-4 rounded-2xl bg-black/40 border border-emerald-600/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300">
                  B. Gambar 5 Tingkat Bangunan (Miniatur di Atas Petak Tanah)
                </h3>
              </div>
              <span className="text-[11px] text-emerald-200/80">
                Tampil berdiri 3D di atas tanah yang sudah di-upgrade
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {BUILDING_LEVELS.map((lvl) => {
                const customBld = customAssets.buildings[lvl];
                return (
                  <div
                    key={lvl}
                    className="p-3 rounded-2xl bg-[#1a0b04] border-2 border-emerald-800/80 flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <div className="w-14 h-14 rounded-2xl bg-stone-900/90 border border-emerald-500/60 flex items-center justify-center overflow-hidden shadow-inner">
                        <Building3DMiniature
                          level={lvl}
                          customImageUrl={customBld}
                          isIsometric={false}
                          size="lg"
                        />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-emerald-300 font-bold">
                          Tingkat {lvl}
                        </div>
                        <div className="text-xs font-black text-white leading-tight">
                          {BUILDING_NAMES[lvl]}
                        </div>
                        <div className="text-[10px] text-amber-300/85 font-mono">
                          Upgrade: {formatRupiah(BUILDING_UPGRADE_COSTS[lvl])}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-[11px] cursor-pointer shadow text-center">
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadBuilding(lvl, e)}
                          className="hidden"
                          data-testid={`upload-building-${lvl}`}
                        />
                      </label>
                      {customBld && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBuilding(lvl)}
                          title="Reset Bangunan ke 3D Bawaan"
                          className="p-2 rounded-xl bg-rose-900/90 hover:bg-rose-800 text-rose-200 border border-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION C: BACKGROUND / LOGO TENGAH PAPAN */}
          <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-20 h-20 rounded-2xl bg-[#1a0b04] border-2 border-purple-400 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                  {customAssets.boardCenterLogo ? (
                    <img
                      src={customAssets.boardCenterLogo}
                      alt="Logo Tengah Papan"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-1">
                      <Sparkles className="w-6 h-6 text-amber-400 mx-auto" />
                      <span className="text-[9px] font-black text-amber-200 block mt-0.5">
                        WNI SIMULATOR
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-300" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-purple-300">
                      C. Gambar Background / Logo Tengah Papan Monopoli
                    </h3>
                  </div>
                  <p className="text-xs text-amber-100/85 mt-1 max-w-xl">
                    Unggah gambar poster, foto komunitas, atau logo custom untuk menghiasi area karpet tengah papan WNI Simulator.
                  </p>
                  <div className="mt-1 text-[10px] font-mono">
                    {customAssets.boardCenterLogo ? (
                      <span className="text-emerald-400 font-bold">
                        ✓ Background / Logo Tengah Kustom Aktif
                      </span>
                    ) : (
                      <span className="text-stone-400">
                        Menggunakan Karpet & Logo Bawaan WNI Simulator
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-purple-400 hover:bg-purple-300 text-stone-950 font-black text-xs cursor-pointer shadow-md">
                  <Upload className="w-4 h-4" />
                  <span>Upload Logo / Background Tengah</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadCenterLogo}
                    className="hidden"
                    data-testid="upload-center-logo"
                  />
                </label>

                {customAssets.boardCenterLogo && (
                  <button
                    type="button"
                    onClick={handleRemoveCenterLogo}
                    className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-rose-100 border border-rose-500 font-bold text-xs cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SECTION D: OPENING MOVIE SEBELUM GAME DIMULAI (AUTO-RENAME intro-wni-simulator.mp4) */}
          <div className="p-4 rounded-2xl bg-black/40 border border-amber-400/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-20 h-20 rounded-2xl bg-[#1a0b04] border-2 border-amber-400 flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-lg p-1 text-center">
                  <Film className="w-7 h-7 text-amber-400" />
                  <span className="text-[9px] font-mono font-black text-amber-200 mt-1">
                    {customAssets.introMovieFilename ||
                      DEFAULT_INTRO_MOVIE_FILENAME}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-amber-300" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">
                      D. Video Opening Movie (Muncul Persis Sebelum Masuk Game Utama)
                    </h3>
                  </div>
                  <p className="text-xs text-amber-100/85 mt-1 max-w-xl">
                    Pilih file video MP4 Anda (seperti video karakter melintasi papan Monopoli). Sistem otomatis me-rename file menjadi{' '}
                    <strong className="text-amber-300 font-mono">
                      {DEFAULT_INTRO_MOVIE_FILENAME}
                    </strong>{' '}
                    dan memutarnya setiap kali sebelum masuk ke papan utama!
                  </p>
                  <div className="mt-1 text-[10px] font-mono">
                    {customAssets.introMovieUrl ? (
                      <span className="text-emerald-400 font-bold">
                        ✓ Video Kustom Aktif:{' '}
                        {customAssets.introMovieFilename ||
                          DEFAULT_INTRO_MOVIE_FILENAME}
                        {customAssets.introMovieOriginalFilename
                          ? ` (Di-rename otomatis dari: ${customAssets.introMovieOriginalFilename})`
                          : ''}
                      </span>
                    ) : (
                      <span className="text-emerald-300 font-bold">
                        ✓ Tersimpan di Server (/public/{DEFAULT_INTRO_MOVIE_FILENAME}) — Otomatis Terlihat oleh SEMUA Pemain!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {onPreviewIntroMovie && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onPreviewIntroMovie();
                    }}
                    data-testid="modal-preview-intro-movie-btn"
                    className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-xs cursor-pointer shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-stone-950" />
                    <span>Putar Movie Sekarang</span>
                  </button>
                )}

                <label className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs cursor-pointer shadow-md">
                  <Upload className="w-4 h-4" />
                  <span>Upload Video Movie (.MP4)</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && onUploadIntroMovie) {
                        onUploadIntroMovie(file);
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                    data-testid="upload-intro-movie-modal"
                  />
                </label>

                {customAssets.introMovieUrl && onRemoveIntroMovie && (
                  <button
                    type="button"
                    onClick={onRemoveIntroMovie}
                    className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-rose-100 border border-rose-500 font-bold text-xs cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Reset Movie</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#190b03] border-t-2 border-amber-600/70 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-amber-200/90">
            💡 Seluruh gambar yang di-upload langsung diterapkan di Papan Permainan dan tersimpan otomatis di browser Anda.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAllToDefault}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-amber-600/80 text-amber-200 font-bold text-xs cursor-pointer"
            >
              Reset ke Gambar Bawaan
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-xs sm:text-sm shadow cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Selesai & Terapkan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
