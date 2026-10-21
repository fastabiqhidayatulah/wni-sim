import React, { useState, useRef, useEffect } from 'react';
import {
  BOARD_TILES,
  BEKASI_CENTER_TILE,
  BUILDING_NAMES,
  BUILDING_SHORT_NAMES,
  BEKASI_TILE_ID,
  BoardTile,
  HudLayoutMode,
  Player,
  PropertyState,
  calculateCameraFollowTransform,
  formatRupiah,
} from '../game/rules';
import { Dice3DCube } from './Dice3DCube';
import { CustomImageAssets, getPawnAvatarImageUrl } from '../game/customAssets';
import {
  Building3DMiniature,
  TableOrnamentEsTehManis,
  TableOrnamentGorengan,
  TableOrnamentRupiahStack,
} from './Building3DMiniature';
import {
  Flag,
  Sparkles,
  Skull,
  Receipt,
  Car,
  Lock,
  Siren,
  ParkingCircle,
  Scale,
  Rocket,
  Home,
  Building2,
  Store,
  Utensils,
  Crown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  ShieldAlert,
  Crosshair,
} from 'lucide-react';

interface IsometricBoardProps {
  isIsometric: boolean;
  players: Player[];
  activePlayerIndex: number;
  properties: Record<number, PropertyState>;
  dice: [number, number];
  isRolling: boolean;
  isMoving: boolean;
  diceQuip: string;
  stateTreasury: number;
  selectedTile: BoardTile | null;
  onSelectTile: (tile: BoardTile) => void;
  onRollDice: () => void;
  canRoll: boolean;
  isTitleScreen?: boolean;
  extraDie?: number | null;
  khodamBonus?: number;
  isExtremeMusibahActive?: boolean;
  awaitingDukunConfirm?: boolean;
  onOpenDukunModal?: () => void;
  onProceedWithoutDukun?: () => void;
  customAssets?: CustomImageAssets;
  justLandedTileId?: number | null;
  onHoverTile?: (tile: BoardTile | null, clientX?: number, clientY?: number) => void;
  onHoverPlayer?: (player: Player | null, clientX?: number, clientY?: number) => void;
  isFollowCamera?: boolean;
  onToggleFollowCamera?: () => void;
  hudMode?: HudLayoutMode;
  isTurnTransitioning?: boolean;
}

function getTileIcon(tile: BoardTile) {
  switch (tile.type) {
    case 'START':
      return <Flag className="w-3 h-3 text-white shrink-0" />;
    case 'TAKDIR':
      return <Sparkles className="w-3 h-3 text-sky-100 shrink-0" />;
    case 'MUSIBAH':
      return <Skull className="w-3 h-3 text-rose-100 shrink-0" />;
    case 'TAX':
      return <Receipt className="w-3 h-3 text-red-100 shrink-0" />;
    case 'TOLL':
      return <Car className="w-3 h-3 text-amber-200 shrink-0" />;
    case 'JAIL':
      return <Lock className="w-3 h-3 text-slate-200 shrink-0" />;
    case 'TILANG':
      return <Siren className="w-3 h-3 text-rose-100 shrink-0" />;
    case 'PUNGLI':
      return <ParkingCircle className="w-3 h-3 text-orange-100 shrink-0" />;
    case 'COURT':
      return <Scale className="w-3 h-3 text-teal-100 shrink-0" />;
    case 'BEKASI':
      return <Rocket className="w-3.5 h-3.5 text-purple-100 shrink-0" />;
    default:
      return <Home className="w-2.5 h-2.5 text-white/90 shrink-0" />;
  }
}

function getBuildingIcon(level: number) {
  switch (level) {
    case 1:
      return <Home className="w-2.5 h-2.5 text-emerald-700" />;
    case 2:
      return <Home className="w-2.5 h-2.5 text-sky-700" />;
    case 3:
      return <Building2 className="w-2.5 h-2.5 text-purple-700" />;
    case 4:
      return <Utensils className="w-2.5 h-2.5 text-orange-700" />;
    case 5:
      return <Store className="w-2.5 h-2.5 text-amber-600" />;
    default:
      return null;
  }
}

export const IsometricBoard: React.FC<IsometricBoardProps> = ({
  isIsometric,
  players,
  activePlayerIndex,
  properties,
  dice,
  isRolling,
  isMoving,
  diceQuip,
  stateTreasury,
  selectedTile,
  onSelectTile,
  onRollDice,
  canRoll,
  isTitleScreen = false,
  extraDie = null,
  khodamBonus = 0,
  isExtremeMusibahActive = false,
  awaitingDukunConfirm = false,
  onOpenDukunModal,
  onProceedWithoutDukun,
  customAssets,
  justLandedTileId = null,
  onHoverTile,
  onHoverPlayer,
  isFollowCamera = false,
  onToggleFollowCamera,
  hudMode = 'FULL',
  isTurnTransitioning = false,
}) => {
  const [zoom, setZoom] = useState<number>(1.0);
  const [followBaseZoom, setFollowBaseZoom] = useState<number>(1.38);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [manualFollowOffset, setManualFollowOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const didDragRef = useRef<boolean>(false);

  const activePlayer = players[activePlayerIndex] || players[0];

  // Reset manual drag offset whenever the active player changes turn or moves to a new tile
  useEffect(() => {
    setManualFollowOffset({ x: 0, y: 0 });
  }, [activePlayerIndex, activePlayer?.position, isFollowCamera]);

  const followTransform = calculateCameraFollowTransform({
    tilePosition: activePlayer?.position ?? 0,
    isIsometric,
    baseZoom: followBaseZoom,
    hudMode,
  });

  const effectiveZoom = isFollowCamera ? followTransform.zoom : zoom;
  const effectivePanX = isFollowCamera
    ? Math.max(-420, Math.min(420, followTransform.panX + manualFollowOffset.x))
    : pan.x;
  const effectivePanY = isFollowCamera
    ? Math.max(-340, Math.min(340, followTransform.panY + manualFollowOffset.y))
    : pan.y;

  const bekasiPlayers = players.filter(
    (p) => p.status !== 'BANGKRUT' && p.position === BEKASI_TILE_ID
  );

  const handleZoomIn = () => {
    if (isFollowCamera) {
      setFollowBaseZoom((z) => Math.min(2.05, Number((z + 0.12).toFixed(2))));
    } else {
      setZoom((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))));
    }
  };
  const handleZoomOut = () => {
    if (isFollowCamera) {
      setFollowBaseZoom((z) => Math.max(1.15, Number((z - 0.12).toFixed(2))));
    } else {
      setZoom((z) => Math.max(0.65, Number((z - 0.15).toFixed(2))));
    }
  };
  const handleResetView = () => {
    if (isFollowCamera) {
      setFollowBaseZoom(1.38);
      setManualFollowOffset({ x: 0, y: 0 });
    } else {
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isTitleScreen) return;
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    if (isFollowCamera) {
      setFollowBaseZoom((z) => Math.min(2.05, Math.max(1.15, Number((z + delta).toFixed(2)))));
    } else {
      setZoom((z) => Math.min(2.2, Math.max(0.65, Number((z + delta).toFixed(2)))));
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isTitleScreen) return;
    // Allow dragging with primary mouse button anywhere on the table/board
    if (e.button !== 0) return;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: isFollowCamera ? manualFollowOffset.x : pan.x,
      panY: isFollowCamera ? manualFollowOffset.y : pan.y,
    };
    didDragRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      didDragRef.current = true;
      setIsDragging(true);
      if (isFollowCamera) {
        setManualFollowOffset({
          x: Math.max(-280, Math.min(280, dragStartRef.current.panX + dx)),
          y: Math.max(-240, Math.min(240, dragStartRef.current.panY + dy)),
        });
      } else {
        setPan({
          x: Math.max(-420, Math.min(420, dragStartRef.current.panX + dx)),
          y: Math.max(-340, Math.min(340, dragStartRef.current.panY + dy)),
        });
      }
    }
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
    setIsDragging(false);
  };

  const isCleanBoardView = hudMode === 'MINIMAL' || hudMode === 'HIDDEN';

  return (
    <div
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative isolate z-0 w-full h-full flex items-center justify-center overflow-hidden select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 45%, #7c4a24 0%, #583115 48%, #381d0a 100%)',
      }}
    >
      {/* Subtle warm wood table plank lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 2px, transparent 2px, transparent 110px), repeating-linear-gradient(0deg, rgba(255,215,170,0.05) 0px, rgba(255,215,170,0.05) 4px, transparent 4px, transparent 24px)',
        }}
      />

      {/* Ambient warm lamp spotlight over the wooden table */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(254, 243, 199, 0.18) 0%, transparent 72%)',
        }}
      />

      {/* Floating Center-Top Zoom, Pan & Follow Camera Control Dock */}
      {!isTitleScreen && hudMode !== 'HIDDEN' && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-30 hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#271206]/95 border-2 border-amber-500/80 text-amber-100 shadow-xl pointer-events-auto"
        >
          <button
            type="button"
            data-testid="dock-follow-camera-btn"
            onClick={onToggleFollowCamera}
            aria-label={
              isFollowCamera
                ? 'Matikan Mode Kamera Follow Karakter'
                : 'Aktifkan Mode Kamera Follow Karakter'
            }
            title="Otomatis zoom & arahkan kamera mengikuti karakter yang sedang giliran bermain [C]"
            className={`px-2.5 py-1 rounded-lg font-black text-[10.5px] flex items-center gap-1.5 border transition-all cursor-pointer ${
              isFollowCamera
                ? 'bg-sky-500 hover:bg-sky-400 text-stone-950 border-white shadow-[0_0_12px_rgba(56,189,248,0.65)]'
                : 'bg-amber-950/90 hover:bg-amber-800 text-amber-200 border-amber-700'
            }`}
          >
            <Crosshair
              className={`w-3.5 h-3.5 ${
                isFollowCamera ? 'text-stone-950 animate-spin' : 'text-sky-400'
              }`}
              style={isFollowCamera ? { animationDuration: '6s' } : undefined}
            />
            <span>{isFollowCamera ? '🎥 Follow: ON' : '🎥 Follow Karakter'}</span>
          </button>

          {isFollowCamera && activePlayer && (
            <span
              data-testid="follow-camera-target-badge"
              className="px-2 py-0.5 rounded-lg bg-sky-950/90 border border-sky-500/70 text-[10px] font-bold text-sky-200 flex items-center gap-1"
            >
              {(() => {
                const activePawnImg = getPawnAvatarImageUrl(
                  activePlayer.avatarId,
                  customAssets
                );
                return activePawnImg ? (
                  <img
                    src={activePawnImg}
                    alt={activePlayer.name}
                    className="w-4 h-4 rounded-full object-contain shrink-0"
                    style={{ backgroundColor: activePlayer.color }}
                  />
                ) : (
                  <span>{activePlayer.avatarEmoji}</span>
                );
              })()}
              <span className="max-w-[95px] truncate">{activePlayer.name.split(' ')[0]}</span>
              <span className="font-mono text-amber-300">#{activePlayer.position}</span>
            </span>
          )}

          <div className="h-4 w-[1px] bg-amber-700/70 mx-0.5" />

          <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-amber-300">
            <Move className="w-3 h-3" />
            Zoom:
          </span>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Perkecil Papan (Zoom Out)"
            className="p-1.5 rounded-lg bg-amber-950 hover:bg-amber-800 border border-amber-700 text-amber-200 cursor-pointer"
            title="Perkecil Papan (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span
            data-testid="board-zoom-percentage"
            className="px-1.5 font-mono text-xs font-extrabold text-amber-300 tabular-nums min-w-[46px] text-center"
          >
            {Math.round(effectiveZoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Perbesar Papan (Zoom In)"
            className="p-1.5 rounded-lg bg-amber-950 hover:bg-amber-800 border border-amber-700 text-amber-200 cursor-pointer"
            title="Perbesar Papan (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            aria-label="Reset Posisi dan Zoom Papan"
            className="ml-0.5 px-2 py-1 rounded-lg bg-amber-900/70 hover:bg-amber-800 text-[10px] font-bold text-amber-200 flex items-center gap-1 cursor-pointer"
            title={isFollowCamera ? 'Fokus Ulang ke Karakter Aktif' : 'Reset Sudut & Zoom'}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isFollowCamera ? 'Fokus' : 'Reset'}</span>
          </button>
        </div>
      )}

      {/* 3D Board Stage Wrapper (11x11 Standard Monopoly Proportions) */}
      <div
        data-testid="monopoly-board-stage"
        data-follow-camera={isFollowCamera ? 'true' : 'false'}
        data-effective-zoom={String(effectiveZoom)}
        className={`relative transition-opacity duration-300 ${
          isTurnTransitioning ? 'opacity-35 brightness-75' : 'opacity-100'
        } ${
          isDragging
            ? ''
            : isFollowCamera
            ? 'transition-transform duration-500 ease-out'
            : 'transition-transform duration-300 ease-out'
        }`}
        style={{
          width: isCleanBoardView
            ? 'min(92vw, 88vh, 800px)'
            : 'min(88vw, 82vh, 740px)',
          height: isCleanBoardView
            ? 'min(92vw, 88vh, 800px)'
            : 'min(88vw, 82vh, 740px)',
          transform: isTitleScreen
            ? 'translate3d(16%, 0, 0) perspective(1400px) rotateX(50deg) rotateZ(-35deg) scale(0.82)'
            : isIsometric
            ? `translate3d(${effectivePanX - 24}px, ${effectivePanY - 12}px, 0) perspective(1400px) rotateX(50deg) rotateZ(-35deg) scale(${
                effectiveZoom * 0.8
              })`
            : `translate3d(${effectivePanX}px, ${effectivePanY}px, 0) perspective(1400px) rotateX(0deg) rotateZ(0deg) scale(${
                effectiveZoom * 0.88
              })`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* 3D Board Wooden Frame Base / Shadow Extrusion */}
        <div
          className="absolute -inset-3 rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(145deg, #451a03, #270e02)',
            boxShadow: isIsometric
              ? '24px 30px 0px #291205, 38px 48px 56px rgba(0,0,0,0.72), inset 0 2px 3px rgba(255,255,255,0.22)'
              : '0 24px 52px rgba(0,0,0,0.65), inset 0 2px 3px rgba(255,255,255,0.22)',
          }}
        />

        {/* ORNAMEN MEJA KAYU (DI LUAR PAPAN MONOPOLI): ES TEH MANIS, PIRING GORENGAN, & GEPOKAN RUPIAH */}
        <div
          data-testid="table-ornament-esteh"
          className="hidden md:block absolute -top-28 -right-24 z-10 pointer-events-none"
          style={{
            transform: isIsometric
              ? 'rotateZ(35deg) rotateX(-50deg) scale(0.92)'
              : 'scale(0.85)',
          }}
        >
          <TableOrnamentEsTehManis />
        </div>

        <div
          data-testid="table-ornament-gorengan"
          className="hidden md:block absolute -bottom-24 -left-28 z-10 pointer-events-none"
          style={{
            transform: isIsometric
              ? 'rotateZ(35deg) rotateX(-50deg) scale(0.95)'
              : 'scale(0.88)',
          }}
        >
          <TableOrnamentGorengan />
        </div>

        <div
          data-testid="table-ornament-rupiah"
          className="hidden md:block absolute -bottom-24 -right-24 z-10 pointer-events-none"
          style={{
            transform: isIsometric
              ? 'rotateZ(35deg) rotateX(-50deg) scale(0.92)'
              : 'scale(0.85)',
          }}
        >
          <TableOrnamentRupiahStack />
        </div>

        {/* Main 11x11 Monopoly Grid (40 Perimeter Tiles + 9x9 Inner Courtyard) */}
        <div
          className="relative w-full h-full grid grid-cols-11 grid-rows-11 gap-[2px] p-2 rounded-xl bg-[#f5ebd6] border-4 border-amber-900/90 shadow-inner"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Render the 40 Perimeter Tiles */}
          {BOARD_TILES.map((tile) => {
            const propState = properties[tile.id];
            const owner =
              propState && propState.ownerId !== null
                ? players.find((p) => p.id === propState.ownerId)
                : null;
            const tilePlayers = players.filter(
              (p) => p.status !== 'BANGKRUT' && p.position === tile.id
            );
            const isCorner =
              tile.id === 0 || tile.id === 10 || tile.id === 20 || tile.id === 30;
            const isSelected = selectedTile?.id === tile.id;
            const isJustLanded = justLandedTileId === tile.id;

            return (
              <div
                key={tile.id}
                role="button"
                tabIndex={0}
                data-testid={`board-tile-${tile.id}`}
                data-just-landed={isJustLanded ? 'true' : undefined}
                data-hover-popup-anchor="true"
                onMouseEnter={(e) => {
                  if (!isTitleScreen) {
                    onHoverTile?.(tile, e.clientX, e.clientY);
                  }
                }}
                onMouseMove={(e) => {
                  if (!isTitleScreen) {
                    onHoverTile?.(tile, e.clientX, e.clientY);
                  }
                }}
                onMouseLeave={() => {
                  if (!isTitleScreen) {
                    onHoverTile?.(null);
                  }
                }}
                onClick={() => {
                  if (!didDragRef.current) {
                    onSelectTile(tile);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTile(tile);
                  }
                }}
                aria-label={`Petak ${tile.id}: ${tile.name} (${tile.subtitle})`}
                style={{
                  gridRow: tile.gridRow + 1,
                  gridColumn: tile.gridCol + 1,
                  transformStyle: 'preserve-3d',
                }}
                className={`group relative flex flex-col justify-between rounded-[5px] text-left overflow-visible transition-all duration-150 cursor-pointer focus:outline-none ${
                  isJustLanded
                    ? 'bg-yellow-100 border-2 border-yellow-400 ring-4 ring-yellow-300/90 shadow-[0_0_24px_rgba(250,204,21,0.95)] z-30 animate-pulse'
                    : isCorner
                    ? 'bg-amber-50 border-2 border-amber-800/90 shadow-md'
                    : 'bg-[#fffdf7] border border-stone-300/90 shadow-sm hover:border-amber-600'
                } ${isSelected ? 'ring-2 ring-amber-500 z-20' : ''}`}
              >
                {isJustLanded && (
                  <div
                    data-testid={`landed-tile-highlight-${tile.id}`}
                    className="absolute -inset-1 rounded-[7px] border-2 border-emerald-400 bg-yellow-300/25 pointer-events-none animate-ping z-20"
                  />
                )}
                {/* Top Header Strip */}
                <div
                  className="w-full px-1 py-[1.5px] rounded-t-[4px] flex items-center justify-between gap-0.5"
                  style={{ backgroundColor: tile.headerBg || '#475569' }}
                >
                  <span className="text-[7.5px] font-mono font-extrabold text-white leading-none tabular-nums">
                    #{tile.id}
                  </span>
                  {getTileIcon(tile)}
                </div>

                {/* Tile Body: Name & Price/Subtitle */}
                <div className="px-0.5 py-0.5 flex-1 flex flex-col justify-center items-center text-center overflow-hidden">
                  <div
                    className={`font-extrabold text-stone-900 leading-[1.08] tracking-tight line-clamp-2 ${
                      isCorner ? 'text-[8.5px] sm:text-[9.5px]' : 'text-[7.5px] sm:text-[8.5px]'
                    }`}
                  >
                    {tile.name}
                  </div>
                  <div className="text-[6.8px] sm:text-[7.5px] font-bold text-stone-600 leading-none mt-0.5 tabular-nums line-clamp-1">
                    {tile.subtitle}
                  </div>
                </div>

                {/* Owner & Building Level Bar OR SITAAN NEGARA Badge */}
                {propState && propState.isSeizedByState ? (
                  <div
                    className="w-full px-1 py-[1.5px] rounded-b-[4px] bg-red-800 text-amber-200 flex items-center justify-center gap-0.5 text-[6.5px] font-black uppercase tracking-tighter"
                    title="Tanah Sitaan Negara · Sewa masuk Kas Negara · Hanya bisa dibeli lewat Sel Premium!"
                  >
                    <ShieldAlert className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                    <span className="truncate">SITAAN NEGARA</span>
                  </div>
                ) : (
                  propState &&
                  owner && (
                    <div
                      className="w-full px-1 py-[1.5px] rounded-b-[4px] flex items-center justify-between text-[6.8px] font-bold text-white"
                      style={{ backgroundColor: owner.color }}
                      title={`Milik ${owner.name} · ${BUILDING_NAMES[propState.level]}`}
                    >
                      <span className="truncate leading-none flex items-center">
                        {(() => {
                          const ownerPawnImg = getPawnAvatarImageUrl(
                            owner.avatarId,
                            customAssets
                          );
                          return ownerPawnImg ? (
                            <img
                              src={ownerPawnImg}
                              alt={owner.name}
                              className="w-3 h-3 rounded-full object-contain border border-white/80 shrink-0"
                              style={{ backgroundColor: owner.color }}
                            />
                          ) : (
                            owner.avatarEmoji
                          );
                        })()}
                      </span>
                      <span className="flex items-center gap-0.5 bg-white/95 text-stone-900 px-1 rounded text-[6.2px] font-extrabold tabular-nums leading-none truncate">
                        {getBuildingIcon(propState.level)}
                        {BUILDING_SHORT_NAMES[propState.level]}
                      </span>
                    </div>
                  )
                )}

                {/* MINIATUR BANGUNAN 3D DI ATAS PETAK (Tingkat 1 Rumah Subsidi s/d Tingkat 5 KopDes) */}
                {propState && propState.level >= 1 && (
                  <div
                    data-testid={`tile-building-3d-${tile.id}`}
                    className="absolute -top-3.5 right-0.5 z-30 pointer-events-none"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isIsometric
                        ? 'rotateZ(35deg) rotateX(-50deg) translateZ(8px)'
                        : 'translateY(-2px)',
                    }}
                  >
                    <Building3DMiniature
                      level={propState.level}
                      ownerColor={owner?.color || '#ef4444'}
                      customImageUrl={customAssets?.buildings[propState.level]}
                      isIsometric={isIsometric}
                      size="md"
                    />
                  </div>
                )}

                {/* 3D STANDEE PLAYER PAWNS (Standing upright facing camera in 3D Isometric mode, up to 64 players!) */}
                {tilePlayers.length > 0 && (() => {
                  const activeId = players[activePlayerIndex]?.id;
                  const sortedTilePlayers = [...tilePlayers].sort((a, b) =>
                    a.id === activeId ? -1 : b.id === activeId ? 1 : a.id - b.id
                  );
                  const visiblePawns = sortedTilePlayers.slice(0, 4);
                  const extraPawnCount = Math.max(0, sortedTilePlayers.length - visiblePawns.length);

                  return (
                    <div
                      className="absolute inset-0 flex items-center justify-center flex-wrap gap-0.5 pointer-events-none z-40"
                      style={{
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {visiblePawns.map((p, pIdx) => {
                        const isCurrentTurn = p.id === activeId;
                        const offsetX =
                          visiblePawns.length > 1 ? (pIdx % 2) * 14 - 7 : 0;
                        const offsetY =
                          visiblePawns.length > 2
                            ? Math.floor(pIdx / 2) * 12 - 6
                            : 0;

                        return (
                          <div
                            key={p.id}
                            data-testid={`player-standee-${p.id}`}
                            data-hover-popup-anchor="true"
                            onMouseEnter={(e) => {
                              if (!isTitleScreen) {
                                e.stopPropagation();
                                onHoverTile?.(null);
                                onHoverPlayer?.(p, e.clientX, e.clientY);
                              }
                            }}
                            onMouseMove={(e) => {
                              if (!isTitleScreen) {
                                e.stopPropagation();
                                onHoverTile?.(null);
                                onHoverPlayer?.(p, e.clientX, e.clientY);
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isTitleScreen) {
                                e.stopPropagation();
                                onHoverPlayer?.(null);
                                // Jangan paksa set hover petak di sini: kursor
                                // bisa saja sudah keluar papan. Petak akan
                                // menghidupkan popupnya sendiri lewat onMouseMove.
                                onHoverTile?.(null);
                              }
                            }}
                            className="relative flex flex-col items-center justify-center pointer-events-auto cursor-pointer group/pawn"
                            style={{
                              transformStyle: 'preserve-3d',
                              transform: `translate3d(${offsetX}px, ${offsetY}px, 2px)`,
                            }}
                          >
                            {/* Small dark elliptical shadow on the tile surface beneath the pawn's feet */}
                            <div
                              className="w-8 h-3.5 rounded-full bg-black/65 transition-all duration-200"
                              style={{
                                filter: 'blur(1.5px)',
                                transform:
                                  isCurrentTurn && isMoving
                                    ? 'scale(0.65)'
                                    : 'scale(1)',
                              }}
                            />

                            {/* Standing 3D Standee Figure with counter-rotation */}
                            <div
                              className="flex flex-col items-center transition-transform duration-200 group-hover/pawn:scale-110"
                              style={{
                                transformOrigin: 'bottom center',
                                transform: isIsometric
                                  ? `rotateZ(35deg) rotateX(-50deg) translateY(${
                                      isCurrentTurn && isMoving
                                        ? '-28px'
                                        : '-12px'
                                    }) scale(${isCurrentTurn ? 1.15 : 0.98})`
                                  : `translateY(${
                                      isCurrentTurn && isMoving
                                        ? '-18px'
                                        : '-6px'
                                    }) scale(${isCurrentTurn ? 1.12 : 0.95})`,
                              }}
                            >
                              {/* Standee Figure Body / Acrylic Cutout */}
                              {(() => {
                                const pawnImgUrl = getPawnAvatarImageUrl(
                                  p.avatarId,
                                  customAssets
                                );
                                if (pawnImgUrl) {
                                  // PNG ber-alpha ditampilkan apa adanya: tanpa
                                  // kartu/background warna pemain, sehingga
                                  // bentuk karakter terlihat transparan di papan.
                                  return (
                                    <div className="relative flex flex-col items-center">
                                      <img
                                        src={pawnImgUrl}
                                        alt={p.name}
                                        className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] object-contain"
                                        style={{
                                          filter:
                                            'drop-shadow(0 4px 3px rgba(0,0,0,0.55))',
                                        }}
                                      />
                                      <span
                                        className={`mt-0.5 px-1 rounded bg-black/75 text-[6.5px] font-extrabold text-white uppercase tracking-tighter leading-none ${
                                          isCurrentTurn
                                            ? 'ring-1 ring-yellow-300'
                                            : ''
                                        }`}
                                        style={{ border: `1px solid ${p.color}` }}
                                      >
                                        P{p.id + 1}
                                      </span>
                                    </div>
                                  );
                                }
                                return (
                                  <div
                                    className={`relative flex flex-col items-center justify-center w-8 h-10 sm:w-9 sm:h-11 rounded-t-xl rounded-b-md border-2 border-white shadow-xl overflow-hidden ${
                                      isCurrentTurn
                                        ? 'ring-2 ring-yellow-300'
                                        : 'group-hover/pawn:ring-2 group-hover/pawn:ring-amber-300'
                                    }`}
                                    style={{
                                      background: `linear-gradient(180deg, ${p.color} 0%, #1c1917 100%)`,
                                      boxShadow: '0 6px 12px rgba(0,0,0,0.55)',
                                    }}
                                  >
                                    <span className="text-sm sm:text-base leading-none drop-shadow">
                                      {p.avatarEmoji}
                                    </span>
                                    <span className="mt-0.5 px-1 rounded bg-black/75 text-[6.5px] font-extrabold text-white uppercase tracking-tighter leading-none">
                                      P{p.id + 1}
                                    </span>
                                  </div>
                                );
                              })()}

                              {/* Standee Pedestal Base */}
                              <div
                                className="w-7 h-2 -mt-0.5 rounded-full border border-white/70"
                                style={{ backgroundColor: p.color }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      {extraPawnCount > 0 && (
                        <div
                          className="absolute -top-2 right-0 px-1.5 py-0.5 rounded-full bg-amber-400 text-stone-950 border border-white font-mono font-black text-[7.5px] shadow-lg"
                          style={{
                            transform: isIsometric
                              ? 'rotateZ(35deg) rotateX(-50deg) translateZ(16px)'
                              : 'none',
                          }}
                        >
                          +{extraPawnCount} Warga
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {/* Inner 9x9 Courtyard (Rows 2..10, Cols 2..10 in 1-based CSS Grid) */}
          <div
            style={{
              gridRow: '2 / 11',
              gridColumn: '2 / 11',
              transformStyle: 'preserve-3d',
            }}
            className="relative rounded-xl bg-gradient-to-br from-[#efe2c4] via-[#e7d5ad] to-[#dcc392] border-2 border-amber-900/35 p-3 sm:p-5 flex flex-col justify-between overflow-visible shadow-inner"
          >
            {/* Subtle Indonesian Archipelago geometric pattern OR Custom Uploaded Center Board Background / Logo */}
            {customAssets?.boardCenterLogo ? (
              <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
                <img
                  src={customAssets.boardCenterLogo}
                  alt="Custom Board Center Background"
                  className="w-full h-full object-cover opacity-35"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#efe2c4]/50 via-transparent to-[#dcc392]/60" />
              </div>
            ) : (
              <div
                className="absolute inset-0 opacity-10 pointer-events-none rounded-xl"
                style={{
                  backgroundImage:
                    'radial-gradient(#78350f 1.25px, transparent 1.25px), radial-gradient(#78350f 1.25px, #efe2c4 1.25px)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 10px 10px',
                }}
              />
            )}

            {/* Top Strip inside Courtyard: Brand Banner, Eskalasi Negara Badge, & Kas Negara (Juara 1) */}
            <div className="relative z-10 flex items-center justify-between gap-2 bg-amber-950/95 text-amber-50 px-3.5 py-2 rounded-xl border border-amber-700/70 shadow-md">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] sm:text-xs font-extrabold tracking-wider uppercase text-amber-300 leading-none">
                      JUARA 1 ABADI: NEGARA
                    </span>
                    {isExtremeMusibahActive ? (
                      <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[8.5px] font-black uppercase tracking-wider animate-pulse border border-amber-300">
                        🔥 MUSIBAH EKSTREM AKTIF!
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-amber-900/90 text-amber-200 text-[8px] font-mono uppercase">
                        Eskalasi: Semua WNI ≥2x START
                      </span>
                    )}
                  </div>
                  <div className="text-[9.5px] text-amber-100/80 leading-tight mt-0.5">
                    WNI terakhir bertahan dari pajak, utang & pungli = Juara 2
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-wider text-amber-300/90 font-semibold leading-none">
                  Kas Negara
                </div>
                <div className="text-sm sm:text-base font-mono font-extrabold text-emerald-400 tabular-nums">
                  {formatRupiah(stateTreasury)}
                </div>
              </div>
            </div>

            {/* Centerpiece Split: Special Tile #40 BEKASI (Planet Lain) + True 3D Cube Dice Arena */}
            <div
              className="relative z-20 my-auto grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Special Tile #40: BEKASI (Planet Lain) */}
              <div
                role="button"
                tabIndex={0}
                data-testid="board-tile-40"
                data-hover-popup-anchor="true"
                onMouseEnter={(e) => {
                  if (!isTitleScreen) {
                    onHoverTile?.(BEKASI_CENTER_TILE, e.clientX, e.clientY);
                  }
                }}
                onMouseMove={(e) => {
                  if (!isTitleScreen) {
                    onHoverTile?.(BEKASI_CENTER_TILE, e.clientX, e.clientY);
                  }
                }}
                onMouseLeave={() => {
                  if (!isTitleScreen) {
                    onHoverTile?.(null);
                  }
                }}
                onClick={() => {
                  if (!didDragRef.current) {
                    onSelectTile(BEKASI_CENTER_TILE);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTile(BEKASI_CENTER_TILE);
                  }
                }}
                aria-label="Petak Khusus Tengah #40: BEKASI (Planet Lain)"
                style={{
                  transformStyle: 'preserve-3d',
                  background:
                    'radial-gradient(circle at 30% 25%, #581c87 0%, #3b0764 60%, #1e1b4b 100%)',
                  boxShadow: '0 10px 24px rgba(88, 28, 135, 0.5)',
                }}
                className={`sm:col-span-5 relative group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                  selectedTile?.id === BEKASI_TILE_ID
                    ? 'ring-2 ring-purple-400 border-purple-300'
                    : 'border-purple-400/80 hover:border-purple-200'
                }`}
              >
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-900/90 border border-purple-400/40 text-[9.5px] font-extrabold text-purple-200 tracking-wider uppercase mb-1">
                  <Rocket className="w-3.5 h-3.5 text-amber-300" />
                  PETAK TENGAH #40
                </div>
                <div className="text-sm sm:text-base font-black text-white tracking-tight leading-none">
                  BEKASI (Planet Lain)
                </div>
                <div className="text-[9.5px] text-purple-200/90 mt-1 leading-tight">
                  Khusus korban kartu{' '}
                  <span className="font-bold text-amber-300">
                    "Digoreng Netizen"
                  </span>{' '}
                  (Skip 1 Giliran)
                </div>

                {/* 3D Standee Players currently stranded on Planet Bekasi */}
                <div
                  className="mt-2 min-h-[30px] flex items-center justify-center gap-2 flex-wrap"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {bekasiPlayers.length === 0 ? (
                    <span className="text-[9px] font-mono text-purple-300/80">
                      🛸 Orbit Kosong · Suhu 43°C
                    </span>
                  ) : (
                    bekasiPlayers.map((p) => (
                      <div
                        key={p.id}
                        data-testid={`bekasi-player-standee-${p.id}`}
                        data-hover-popup-anchor="true"
                        onMouseEnter={(e) => {
                          if (!isTitleScreen) {
                            e.stopPropagation();
                            onHoverTile?.(null);
                            onHoverPlayer?.(p, e.clientX, e.clientY);
                          }
                        }}
                        onMouseMove={(e) => {
                          if (!isTitleScreen) {
                            e.stopPropagation();
                            onHoverTile?.(null);
                            onHoverPlayer?.(p, e.clientX, e.clientY);
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isTitleScreen) {
                            e.stopPropagation();
                            onHoverPlayer?.(null);
                            onHoverTile?.(null);
                          }
                        }}
                        className="flex flex-col items-center cursor-pointer"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: isIsometric
                            ? 'rotateZ(35deg) rotateX(-50deg) translateY(-10px)'
                            : 'translateY(-4px)',
                        }}
                      >
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full border-2 border-white text-white text-[10px] font-extrabold shadow-lg animate-bounce"
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
                                className="w-4 h-4 rounded-full object-contain"
                                style={{ backgroundColor: p.color }}
                              />
                            ) : (
                              <span>{p.avatarEmoji}</span>
                            );
                          })()}
                          <span>{p.name.split(' ')[0]}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Central True 3D Cube Dice Arena */}
              <div
                className="sm:col-span-7 flex flex-col items-center justify-center bg-amber-900/15 border-2 border-amber-900/30 rounded-2xl p-3 sm:p-4"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-amber-950/85 mb-2 flex items-center gap-1.5">
                  <span>Arena Dadu Kubus 3D Konoha</span>
                  {extraDie !== null && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500 text-stone-950 text-[8.5px] font-black">
                      👑 3 DADU PEWARIS
                    </span>
                  )}
                  {khodamBonus > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-700 text-amber-200 text-[8.5px] font-black">
                      ✨ +{khodamBonus} KHODAM
                    </span>
                  )}
                </div>

                {/* Two (or Three with Pewaris!) True 3D CSS Cubes with preserve-3d */}
                <div
                  className="flex items-center justify-center gap-6 my-2 py-2"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <Dice3DCube
                    dieIndex={0}
                    value={dice[0]}
                    isRolling={isRolling}
                    onClick={() => canRoll && onRollDice()}
                    disabled={!canRoll}
                  />
                  <Dice3DCube
                    dieIndex={1}
                    value={dice[1]}
                    isRolling={isRolling}
                    onClick={() => canRoll && onRollDice()}
                    disabled={!canRoll}
                  />
                  {extraDie !== null && (
                    <Dice3DCube
                      dieIndex={2}
                      value={extraDie}
                      isRolling={isRolling}
                      onClick={() => canRoll && onRollDice()}
                      disabled={!canRoll}
                    />
                  )}
                </div>

                {/* Doubles Indicator or Dice Sum + Quip */}
                <div className="mt-1.5 text-center">
                  <div className="text-xs sm:text-sm font-extrabold text-amber-950 tabular-nums">
                    Hasil Dadu: {dice[0]} + {dice[1]}
                    {extraDie !== null ? ` + ${extraDie}` : ''}
                    {khodamBonus > 0 ? ` (+${khodamBonus} Khodam)` : ''} ={' '}
                    {dice[0] + dice[1] + (extraDie ?? 0) + khodamBonus} Langkah{' '}
                    {dice[0] === dice[1] && (
                      <span className="ml-1 px-1.5 py-0.5 rounded bg-sky-600 text-white text-[9.5px] font-black">
                        KEMBAR! WAJIB AMBIL TAKDIR
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-semibold text-amber-900/90 italic line-clamp-1 mt-0.5">
                    "{diceQuip}"
                  </div>

                  {/* Quick Dukun Interceptor Bar if awaitingDukunConfirm is active */}
                  {awaitingDukunConfirm && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={onOpenDukunModal}
                        className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-[10px] font-black uppercase shadow cursor-pointer"
                      >
                        🔮 Pakai Dukun (Ubah Angka Dadu)
                      </button>
                      <button
                        type="button"
                        onClick={onProceedWithoutDukun}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase shadow cursor-pointer"
                      >
                        ✅ Jalan Sekarang
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Strip inside Courtyard: Quick Legend of Building Levels */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-1 bg-amber-950/15 border border-amber-900/25 px-3 py-1.5 rounded-lg text-[9px] font-bold text-amber-950">
              <span>Tingkat Bangunan (Naik tiap lewat START):</span>
              <span>1. Rumah Subsidi 1</span>
              <span>→</span>
              <span>2. Rumah Subsidi 2</span>
              <span>→</span>
              <span>3. Rumah OKB</span>
              <span>→</span>
              <span>4. Dapur SPPG</span>
              <span>→</span>
              <span>5. KopDes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
