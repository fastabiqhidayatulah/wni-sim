import React from 'react';
import {
  AVATAR_CHARACTERS,
  BOARD_TILES,
  BUILDING_NAMES,
  BUILDING_SHORT_NAMES,
  BUILDING_UPGRADE_COSTS,
  BEKASI_TILE_ID,
  BoardTile,
  BuildingLevel,
  LoanRecord,
  Player,
  PropertyState,
  calculatePlayerNetWorth,
  calculatePlayerPropertyValue,
  calculatePropertyRent,
  calculateSellLandValue,
  formatRupiah,
  getTileHoverDetails,
} from '../game/rules';
import { CustomImageAssets, getPawnAvatarImageUrl } from '../game/customAssets';
import {
  Building2,
  Crown,
  Landmark,
  MapPin,
  ShieldAlert,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';

interface HoverInfoPopupsProps {
  hoveredPlayer: Player | null;
  hoveredTile: BoardTile | null;
  mousePos: { x: number; y: number };
  players: Player[];
  activePlayerId?: number;
  properties: Record<number, PropertyState>;
  loans: LoanRecord[];
  customAssets: CustomImageAssets;
}

function computeSafePopupStyle(
  mousePos: { x: number; y: number },
  popupWidth: number = 320,
  popupHeight: number = 340
): React.CSSProperties {
  if (typeof window === 'undefined') {
    return { left: 24, top: 80 };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = mousePos.x + 18;
  let top = mousePos.y - 20;

  if (left + popupWidth > vw - 16) {
    left = Math.max(16, mousePos.x - popupWidth - 18);
  }
  if (top + popupHeight > vh - 16) {
    top = Math.max(16, vh - popupHeight - 16);
  }
  if (top < 16) {
    top = 16;
  }

  return {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
  };
}

export const HoverInfoPopups: React.FC<HoverInfoPopupsProps> = ({
  hoveredPlayer,
  hoveredTile,
  mousePos,
  players,
  activePlayerId,
  properties,
  loans,
  customAssets,
}) => {
  // 1. POPUP PROFIL KARAKTER / PEMAIN (Prioritas utama saat kursor di atas pion atau kartu pemain)
  if (hoveredPlayer) {
    const avatarMeta = AVATAR_CHARACTERS.find(
      (a) => a.id === hoveredPlayer.avatarId
    );
    const customAvatarUrl = getPawnAvatarImageUrl(
      hoveredPlayer.avatarId,
      customAssets
    );
    const propInfo = calculatePlayerPropertyValue(hoveredPlayer.id, properties);
    const netWorth = calculatePlayerNetWorth(
      hoveredPlayer,
      properties,
      loans
    );
    const activeDebt = loans
      .filter((l) => l.borrowerId === hoveredPlayer.id && l.remainingDue > 0)
      .reduce((sum, l) => sum + l.remainingDue, 0);

    const currentTileName =
      hoveredPlayer.position === BEKASI_TILE_ID
        ? 'BEKASI (Planet Lain #40)'
        : `#${hoveredPlayer.position} ${
            BOARD_TILES[hoveredPlayer.position]?.name || 'START'
          }`;

    const statusBadge =
      hoveredPlayer.status === 'DI_LAPAS'
        ? { text: '⛓️ Terpidana Lapas', cls: 'bg-rose-900 text-rose-200 border-rose-500' }
        : hoveredPlayer.status === 'SEL_PREMIUM'
        ? {
            text: `👑 Sel Premium VIP (${hoveredPlayer.premiumTurnsLeft} Giliran)`,
            cls: 'bg-purple-900 text-amber-200 border-purple-400',
          }
        : hoveredPlayer.status === 'DI_BEKASI'
        ? {
            text: '🚀 Terdampar di Bekasi',
            cls: 'bg-indigo-900 text-indigo-200 border-indigo-400',
          }
        : hoveredPlayer.status === 'BANGKRUT'
        ? {
            text: '💀 Bangkrut',
            cls: 'bg-stone-800 text-rose-400 border-rose-700',
          }
        : {
            text: '✅ Warga Aktif',
            cls: 'bg-emerald-900/90 text-emerald-200 border-emerald-500',
          };

    const style = computeSafePopupStyle(mousePos, 330, 360);

    return (
      <div
        data-testid="hovered-player-popup"
        style={style}
        className="fixed z-[70] w-[310px] sm:w-[330px] rounded-2xl bg-[#1e0d04]/98 border-2 border-amber-400 text-amber-50 shadow-[0_20px_50px_rgba(0,0,0,0.88)] pointer-events-none overflow-hidden backdrop-blur-md transition-opacity duration-100"
      >
        {/* Top Banner with Large Character Avatar */}
        <div
          className="p-3.5 flex items-center gap-3 border-b border-amber-700/80"
          style={{
            background: `linear-gradient(135deg, ${hoveredPlayer.color}33 0%, #2a1205 100%)`,
          }}
        >
          <div
            data-testid="hovered-player-avatar"
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 border-white shadow-[0_8px_20px_rgba(0,0,0,0.6)] shrink-0 overflow-hidden relative"
            style={{ backgroundColor: hoveredPlayer.color }}
          >
            {customAvatarUrl ? (
              <img
                src={customAvatarUrl}
                alt={hoveredPlayer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="drop-shadow">{hoveredPlayer.avatarEmoji}</span>
            )}
            <span className="absolute bottom-0 right-0 px-1.5 py-0.2 rounded-tl-md bg-black/80 text-[9px] font-mono font-black text-amber-300">
              P{hoveredPlayer.id + 1}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              {activePlayerId === hoveredPlayer.id && (
                <span className="px-1.5 py-0.5 rounded bg-yellow-400 text-stone-950 text-[8.5px] font-black uppercase">
                  GILIRAN AKTIF
                </span>
              )}
              <span
                className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                  hoveredPlayer.isBot
                    ? 'bg-sky-900 border border-sky-400 text-sky-200'
                    : 'bg-amber-500 text-stone-950'
                }`}
              >
                {hoveredPlayer.isBot ? '🤖 BOT WNI' : '🧑 WARGA ASLI'}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded border text-[8.5px] font-bold ${statusBadge.cls}`}
              >
                {statusBadge.text}
              </span>
            </div>

            <div className="text-sm sm:text-base font-black text-white truncate mt-1">
              {hoveredPlayer.name}
            </div>
            <div className="text-[11px] font-bold text-amber-300 truncate">
              {avatarMeta
                ? `${avatarMeta.title} — "${avatarMeta.tagline}"`
                : hoveredPlayer.role}
            </div>
          </div>
        </div>

        {/* Financial & Location Stats */}
        <div className="p-3 space-y-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-xl bg-black/45 border border-amber-800/70">
              <div className="flex items-center gap-1 text-[9.5px] uppercase font-bold text-amber-300/90">
                <Wallet className="w-3 h-3 text-emerald-400" />
                <span>Uang Tunai</span>
              </div>
              <div className="text-sm font-mono font-black text-emerald-400 mt-0.5 tabular-nums">
                {formatRupiah(hoveredPlayer.money)}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-black/45 border border-amber-800/70">
              <div className="flex items-center gap-1 text-[9.5px] uppercase font-bold text-amber-300/90">
                <Crown className="w-3 h-3 text-yellow-400" />
                <span>Kekayaan Bersih</span>
              </div>
              <div className="text-sm font-mono font-black text-yellow-300 mt-0.5 tabular-nums">
                {formatRupiah(netWorth)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/70 text-[11px]">
            <span className="flex items-center gap-1 text-amber-200 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Lokasi:</span>
            </span>
            <span className="font-extrabold text-white truncate ml-2">
              {currentTileName}
            </span>
          </div>

          {/* Owned Cities List */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-300 mb-1">
              <span>
                🏘️ Aset Kota ({propInfo.count} Tanah ·{' '}
                {formatRupiah(propInfo.totalValue)})
              </span>
              <span>+{hoveredPlayer.upgradeTokens} Hak START</span>
            </div>

            {propInfo.ownedTiles.length === 0 ? (
              <div className="p-2 rounded-xl bg-black/30 border border-amber-900/50 text-[10.5px] text-amber-200/70 text-center italic">
                Belum memiliki tanah kota di papan.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 max-h-28 overflow-hidden">
                {propInfo.ownedTiles.slice(0, 6).map((item) => (
                  <div
                    key={item.tile.id}
                    className="flex items-center justify-between gap-1 px-2 py-1 rounded-lg bg-black/40 border border-amber-800/60 text-[10px]"
                  >
                    <span className="font-bold text-white truncate">
                      {item.tile.name}
                    </span>
                    <span className="px-1 py-0.2 rounded bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono text-[8.5px] font-extrabold shrink-0">
                      {BUILDING_SHORT_NAMES[item.level]}
                    </span>
                  </div>
                ))}
                {propInfo.ownedTiles.length > 6 && (
                  <div className="col-span-2 text-center text-[9.5px] font-mono text-amber-300">
                    +{propInfo.ownedTiles.length - 6} kota lainnya
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Saved Cards & Active Debt Summary */}
          <div className="flex items-center justify-between pt-1 border-t border-amber-800/70 text-[10.5px] text-amber-200">
            <span>
              🃏 Kartu Simpanan: <strong>{hoveredPlayer.savedCards.length}</strong>
            </span>
            {activeDebt > 0 ? (
              <span className="text-rose-300 font-bold">
                💸 Utang: {formatRupiah(activeDebt)}
              </span>
            ) : (
              <span className="text-emerald-300 font-bold">
                Lewat START: {hoveredPlayer.startPassCount}x
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. POPUP INFO KOTAK KOTA / PETAK PAPAN PERMAINAN
  if (hoveredTile) {
    const details = getTileHoverDetails(hoveredTile);
    const propState =
      hoveredTile.type === 'PROPERTY' ? properties[hoveredTile.id] : undefined;
    const owner =
      propState && propState.ownerId !== null
        ? players.find((p) => p.id === propState.ownerId)
        : null;
    const occupants = players.filter(
      (p) => p.status !== 'BANGKRUT' && p.position === hoveredTile.id
    );

    const style = computeSafePopupStyle(
      mousePos,
      340,
      hoveredTile.type === 'PROPERTY' ? 400 : 290
    );

    return (
      <div
        data-testid="hovered-tile-popup"
        style={style}
        className="fixed z-[70] w-[320px] sm:w-[345px] rounded-2xl bg-[#1e0d04]/98 border-2 border-amber-400 text-amber-50 shadow-[0_20px_50px_rgba(0,0,0,0.88)] pointer-events-none overflow-hidden backdrop-blur-md transition-opacity duration-100"
      >
        {/* Top Colored Header */}
        <div
          className="px-3.5 py-2.5 border-b border-amber-700/80 flex items-center justify-between gap-2"
          style={{
            backgroundColor: hoveredTile.headerBg || '#475569',
          }}
        >
          <div className="min-w-0">
            <div className="text-[9.5px] font-mono font-extrabold uppercase tracking-wider text-white/90">
              {details.categoryBadge}
            </div>
            <div className="text-base font-black text-white leading-tight truncate mt-0.5">
              #{hoveredTile.id} · {hoveredTile.name}
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-black/45 border border-white/30 text-xs font-mono font-black text-amber-300 shrink-0">
            {hoveredTile.subtitle}
          </div>
        </div>

        <div className="p-3 space-y-2.5 text-xs">
          {hoveredTile.type === 'PROPERTY' && propState ? (
            <>
              {/* Status Kepemilikan Kota */}
              <div className="p-2.5 rounded-xl bg-black/45 border border-amber-800/80 flex items-center justify-between gap-2">
                {propState.isSeizedByState ? (
                  <div className="flex items-center gap-2 text-rose-300 font-extrabold">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div className="text-xs uppercase">🔴 Sitaan Negara</div>
                      <div className="text-[10px] text-amber-200/80 font-normal">
                        Sewa masuk Kas Negara · Bisa dibeli lewat Sel Premium
                      </div>
                    </div>
                  </div>
                ) : owner ? (
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base border border-white shrink-0 overflow-hidden"
                      style={{ backgroundColor: owner.color }}
                    >
                      {(() => {
                        const ownerImgUrl = getPawnAvatarImageUrl(
                          owner.avatarId,
                          customAssets
                        );
                        return ownerImgUrl ? (
                          <img
                            src={ownerImgUrl}
                            alt={owner.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          owner.avatarEmoji
                        );
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-amber-300">
                        Pemilik Kota Saat Ini:
                      </div>
                      <div className="text-xs font-black text-white truncate">
                        {owner.name}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-300">
                        Tingkat: {BUILDING_NAMES[propState.level]}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-emerald-400">
                        🟢 TANAH KOSONG (Bisa Dibeli)
                      </div>
                      <div className="text-[10px] text-amber-200/80">
                        Harbolnas 50%: {formatRupiah((hoveredTile.price ?? 0) * 0.5)}
                      </div>
                    </div>
                    <div className="text-right font-mono shrink-0 whitespace-nowrap">
                      <div className="text-[9.5px] text-amber-300">Harga Beli</div>
                      <div className="text-sm font-black text-white">
                        {formatRupiah(hoveredTile.price ?? 0)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tarif Sewa Semua Tingkat (Lv.0 s/d Lv.5 KopDes) */}
              <div className="rounded-xl bg-black/40 border border-amber-800/70 p-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-amber-300 mb-1 px-1">
                  <span>Tingkat Bangunan (Upgrade)</span>
                  <span>Tarif Sewa</span>
                </div>
                <div className="space-y-1">
                  {([0, 1, 2, 3, 4, 5] as BuildingLevel[]).map((lv) => {
                    const isCurrentLevel =
                      (owner || propState.isSeizedByState) &&
                      propState.level === lv;
                    const rentVal = calculatePropertyRent(hoveredTile, lv);
                    const upgCost = BUILDING_UPGRADE_COSTS[lv];
                    return (
                      <div
                        key={lv}
                        className={`flex items-center justify-between px-2 py-1 rounded-lg text-[10.5px] ${
                          isCurrentLevel
                            ? 'bg-amber-400 text-stone-950 font-black shadow'
                            : 'bg-amber-950/40 text-amber-100/90'
                        }`}
                      >
                        <span className="truncate">
                          {lv === 0 ? '0. ' : `${lv}. `}
                          {BUILDING_NAMES[lv]}
                          {lv > 0 && !isCurrentLevel && (
                            <span className="text-[9px] opacity-75 ml-1">
                              (+{formatRupiah(upgCost)})
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-bold tabular-nums shrink-0 ml-2">
                          {formatRupiah(rentVal)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1.5 pt-1 border-t border-amber-800/60 flex items-center justify-between text-[10px] text-amber-300/90 px-1">
                  <span>Nilai Jual Likuidasi (50% ke Negara):</span>
                  <span className="font-mono font-bold text-amber-200">
                    {formatRupiah(
                      calculateSellLandValue(hoveredTile, propState.level)
                    )}
                  </span>
                </div>
              </div>

              {details.specialPerk && (
                <div className="p-2 rounded-xl bg-emerald-950/90 border border-emerald-400/80 text-[10.5px] font-bold text-emerald-200 leading-snug">
                  {details.specialPerk}
                </div>
              )}
            </>
          ) : (
            /* Info untuk Petak Khusus Non-Properti (START, LAPAS, TOL, PAJAK, PENGADILAN, BEKASI, dll.) */
            <div className="p-3 rounded-xl bg-black/45 border border-amber-800/80 text-amber-100 leading-relaxed text-[11.5px]">
              {details.ruleSummary}
            </div>
          )}

          {/* Warga yang sedang berada di petak ini */}
          <div className="pt-1 border-t border-amber-800/70 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase text-amber-300 flex items-center gap-1 shrink-0">
              <Users className="w-3 h-3 text-amber-400" />
              <span>Warga di Petak Ini ({occupants.length}):</span>
            </span>
            {occupants.length === 0 ? (
              <span className="text-[10px] text-amber-200/60 italic">
                Kosong
              </span>
            ) : (
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {occupants.slice(0, 4).map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-extrabold text-white border border-white/80"
                    style={{ backgroundColor: p.color }}
                  >
                    <span>{p.avatarEmoji}</span>
                    <span>{p.name.split(' ')[0]}</span>
                  </span>
                ))}
                {occupants.length > 4 && (
                  <span className="text-[9.5px] font-mono text-amber-300 font-bold">
                    +{occupants.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
