import { Eye, Flame, Skull, Sparkles, X } from 'lucide-react';
import {
  SharedFateCard,
  findFateCardById,
  formatRupiah,
} from '../game/rules';

interface SpectatorFateCardOverlayProps {
  event: SharedFateCard;
  onDismiss: () => void;
}

/**
 * Tampilan kartu Takdir/Musibah untuk pemain NON-AKTIF.
 *
 * Kartu yang sama dengan yang dibuka pemain aktif ditampilkan read-only agar
 * semua warga di room ikut menikmati leluconnya. Tidak ada tombol aksi di sini;
 * keputusan tetap hanya bisa diambil klien pemilik giliran.
 */
export function SpectatorFateCardOverlay({
  event,
  onDismiss,
}: SpectatorFateCardOverlayProps) {
  const card = findFateCardById(event.cardId);
  if (!card) return null;

  const isTakdir = card.deck === 'TAKDIR';
  const computedDiceAmount =
    card.requiresDice && event.diceResult !== null
      ? (card.diceMultiplier ?? 500_000) * event.diceResult
      : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 pointer-events-auto">
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
          <span className="px-2.5 py-1 rounded-md bg-black/35 text-xs font-mono font-extrabold uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Mode Penonton · Giliran {event.playerName}
          </span>
          {event.fromDoubles && (
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
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">
            {card.isExtreme
              ? '🔥 Musibah Ekstrem (Eskalasi Negara)'
              : isTakdir
              ? '📘 Kartu Takdir (Biru)'
              : '📕 Kartu Musibah (Merah)'}
          </div>
          <h3 className="mt-1 text-xl sm:text-2xl font-black tracking-tight">
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
              🎲 Angka Dadu Kartu: {event.diceResult} → Total:{' '}
              {formatRupiah(computedDiceAmount)}!
            </div>
          )}

          <p className="mt-4 text-[11px] text-white/70 italic">
            {event.playerName} yang menentukan nasibnya. Kamu hanya ikut
            menyaksikan drama ini. 🍿
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <X className="w-4 h-4" />
          Sembunyikan (Lihat Papan)
        </button>
      </div>
    </div>
  );
}
