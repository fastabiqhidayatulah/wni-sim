import React from 'react';
import { BuildingLevel, BUILDING_SHORT_NAMES } from '../game/rules';

interface Building3DMiniatureProps {
  level: BuildingLevel;
  ownerColor?: string;
  customImageUrl?: string;
  isIsometric?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Building3DMiniature: React.FC<Building3DMiniatureProps> = ({
  level,
  ownerColor = '#10b981',
  customImageUrl,
  isIsometric = true,
  size = 'md',
}) => {
  if (level <= 0) return null;

  const sizeClasses =
    size === 'lg'
      ? 'w-11 h-11'
      : size === 'sm'
      ? 'w-5 h-5'
      : 'w-6 h-6 sm:w-7 sm:h-7';

  // If user uploaded a custom image for this building level, render it as a 3D standee
  if (customImageUrl) {
    return (
      <div
        className={`relative inline-flex flex-col items-center justify-end select-none pointer-events-none transition-transform duration-300 ${
          isIsometric ? '-translate-y-1 scale-110' : ''
        }`}
        style={{
          filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.65))',
        }}
        title={BUILDING_SHORT_NAMES[level]}
      >
        <div
          className={`${sizeClasses} rounded-md overflow-hidden border-[1.5px] border-white bg-stone-900/90 flex items-center justify-center`}
          style={{ borderColor: ownerColor }}
        >
          <img
            src={customImageUrl}
            alt={BUILDING_SHORT_NAMES[level]}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-end select-none pointer-events-none transition-transform duration-300 ${sizeClasses} ${
        isIsometric ? '-translate-y-1 scale-110' : ''
      }`}
      style={{
        filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.6))',
      }}
      title={BUILDING_SHORT_NAMES[level]}
    >
      {level === 1 && (
        /* TINGKAT 1: RUMAH SUBSIDI 1 (3D Isometric Small House) */
        <svg viewBox="0 0 40 40" className="w-full h-full overflow-visible">
          {/* Base shadow */}
          <ellipse cx="20" cy="35" rx="14" ry="5" fill="rgba(0,0,0,0.35)" />
          {/* Left wall */}
          <polygon points="8,22 20,28 20,36 8,30" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
          {/* Right wall */}
          <polygon points="32,22 20,28 20,36 32,30" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
          {/* Door */}
          <polygon points="23,34.5 23,29 27,27 27,32.5" fill={ownerColor} />
          {/* Left roof */}
          <polygon points="6,22 20,12 20,27 6,22" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />
          {/* Right roof */}
          <polygon points="34,22 20,12 20,27 34,22" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
          {/* Level 1 badge */}
          <circle cx="20" cy="10" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.2" />
          <text x="20" y="12.5" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="900">
            1
          </text>
        </svg>
      )}

      {level === 2 && (
        /* TINGKAT 2: RUMAH SUBSIDI 2 (3D Isometric Twin / Expanded House) */
        <svg viewBox="0 0 44 42" className="w-full h-full overflow-visible">
          <ellipse cx="22" cy="36" rx="16" ry="5.5" fill="rgba(0,0,0,0.4)" />
          {/* Left Wing */}
          <polygon points="6,23 18,29 18,37 6,31" fill="#dbeafe" stroke="#1e3a8a" strokeWidth="1" />
          <polygon points="30,23 18,29 18,37 30,31" fill="#bfdbfe" stroke="#1e3a8a" strokeWidth="1" />
          <polygon points="4,23 18,13 32,23 18,28" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1" />
          {/* Right Extension */}
          <polygon points="20,20 36,26 36,35 20,29" fill="#93c5fd" stroke="#1e3a8a" strokeWidth="1" />
          <polygon points="18,20 28,11 39,20 28,25" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
          {/* Windows */}
          <rect x="11" y="27" width="3.5" height="3.5" fill="#fde047" />
          <rect x="26" y="26" width="4" height="4" fill="#fde047" />
          <circle cx="22" cy="9" r="5.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.2" />
          <text x="22" y="11.5" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="900">
            2
          </text>
        </svg>
      )}

      {level === 3 && (
        /* TINGKAT 3: RUMAH OKB (2-Story Luxury Mansion with Gold Pillars) */
        <svg viewBox="0 0 46 46" className="w-full h-full overflow-visible">
          <ellipse cx="23" cy="40" rx="17" ry="6" fill="rgba(0,0,0,0.45)" />
          {/* 1st Floor Left & Right */}
          <polygon points="7,26 23,33 23,41 7,34" fill="#fef3c7" stroke="#78350f" strokeWidth="1" />
          <polygon points="39,26 23,33 23,41 39,34" fill="#fde68a" stroke="#78350f" strokeWidth="1" />
          {/* Gold Pillars */}
          <line x1="12" y1="28" x2="12" y2="36" stroke="#eab308" strokeWidth="2" />
          <line x1="34" y1="28" x2="34" y2="36" stroke="#eab308" strokeWidth="2" />
          {/* 2nd Floor Left & Right */}
          <polygon points="10,17 23,23 23,32 10,26" fill="#f3e8ff" stroke="#581c87" strokeWidth="1" />
          <polygon points="36,17 23,23 23,32 36,26" fill="#e9d5ff" stroke="#581c87" strokeWidth="1" />
          {/* Luxury Purple & Gold Roof */}
          <polygon points="8,17 23,7 38,17 23,23" fill="#9333ea" stroke="#facc15" strokeWidth="1.3" />
          {/* Crown Badge */}
          <circle cx="23" cy="7" r="5.5" fill="#9333ea" stroke="#facc15" strokeWidth="1.3" />
          <text x="23" y="9.5" textAnchor="middle" fill="#fef08a" fontSize="7.5" fontWeight="900">
            3
          </text>
        </svg>
      )}

      {level === 4 && (
        /* TINGKAT 4: DAPUR SPPG (3D Industrial Culinary Complex + Chimney) */
        <svg viewBox="0 0 48 48" className="w-full h-full overflow-visible">
          <ellipse cx="24" cy="42" rx="18" ry="6" fill="rgba(0,0,0,0.45)" />
          {/* Smoke Puff & Chimney */}
          <circle cx="34" cy="6" r="3" fill="#e2e8f0" opacity="0.85" />
          <circle cx="37" cy="3" r="2.2" fill="#f1f5f9" opacity="0.7" />
          <rect x="31" y="9" width="5" height="12" rx="1" fill="#ea580c" stroke="#7c2d12" strokeWidth="1" />
          {/* Main Hall Left & Right */}
          <polygon points="6,24 24,32 24,42 6,34" fill="#ffedd5" stroke="#9a3412" strokeWidth="1.1" />
          <polygon points="42,24 24,32 24,42 42,34" fill="#fed7aa" stroke="#9a3412" strokeWidth="1.1" />
          {/* Arched Orange Roof */}
          <polygon points="5,24 24,13 43,24 24,32" fill="#f97316" stroke="#fff7ed" strokeWidth="1.2" />
          {/* Illuminated Windows */}
          <polygon points="11,29 19,32.5 19,36.5 11,33" fill="#fde047" />
          <polygon points="37,29 29,32.5 29,36.5 37,33" fill="#fde047" />
          <circle cx="20" cy="11" r="6" fill="#ea580c" stroke="#ffffff" strokeWidth="1.3" />
          <text x="20" y="13.5" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="900">
            4
          </text>
        </svg>
      )}

      {level === 5 && (
        /* TINGKAT 5: KOPDES (3D Golden Tower / Skyscraper + Flag) */
        <svg viewBox="0 0 50 52" className="w-full h-full overflow-visible">
          <ellipse cx="25" cy="45" rx="19" ry="6.5" fill="rgba(0,0,0,0.5)" />
          {/* Base Podium */}
          <polygon points="6,32 25,40 25,47 6,39" fill="#fef08a" stroke="#854d0e" strokeWidth="1.1" />
          <polygon points="44,32 25,40 25,47 44,39" fill="#facc15" stroke="#854d0e" strokeWidth="1.1" />
          {/* Tower Body Left & Right */}
          <polygon points="11,14 25,21 25,40 11,33" fill="#fde047" stroke="#713f12" strokeWidth="1.1" />
          <polygon points="39,14 25,21 25,40 39,33" fill="#eab308" stroke="#713f12" strokeWidth="1.1" />
          {/* Golden Glass Windows */}
          <line x1="15" y1="20" x2="22" y2="23.5" stroke="#0284c7" strokeWidth="2.2" />
          <line x1="15" y1="26" x2="22" y2="29.5" stroke="#0284c7" strokeWidth="2.2" />
          <line x1="35" y1="20" x2="28" y2="23.5" stroke="#0369a1" strokeWidth="2.2" />
          <line x1="35" y1="26" x2="28" y2="29.5" stroke="#0369a1" strokeWidth="2.2" />
          {/* Golden Roof Pyramid */}
          <polygon points="9,14 25,4 41,14 25,21" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.4" />
          {/* Top Star / Level 5 Badge */}
          <circle cx="25" cy="6" r="6.5" fill="#dc2626" stroke="#fef08a" strokeWidth="1.5" />
          <text x="25" y="8.8" textAnchor="middle" fill="#fef08a" fontSize="8.5" fontWeight="900">
            5★
          </text>
        </svg>
      )}
    </div>
  );
};

/**
 * Ornamen Visual Meja Kayu 1: Gelas Es Teh Manis Dingin + Sedotan Merah
 */
export const TableOrnamentEsTehManis: React.FC = () => (
  <div
    className="pointer-events-none select-none flex flex-col items-center"
    style={{ filter: 'drop-shadow(0 12px 14px rgba(0,0,0,0.55))' }}
  >
    <svg width="96" height="110" viewBox="0 0 96 110">
      {/* Wooden Coaster */}
      <ellipse cx="48" cy="86" rx="36" ry="18" fill="#451a03" stroke="#b45309" strokeWidth="2.5" />
      <ellipse cx="48" cy="83" rx="31" ry="14" fill="#78350f" />
      {/* Plastic Straw */}
      <path d="M52,72 L68,10 L80,6" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M52,72 L68,10 L80,6" fill="none" stroke="#fca5a5" strokeWidth="1.8" strokeDasharray="4 4" strokeLinecap="round" />
      {/* Glass Body */}
      <polygon points="24,26 72,26 64,84 32,84" fill="rgba(254, 243, 199, 0.25)" stroke="#fde68a" strokeWidth="2" />
      {/* Sweet Iced Tea Liquid */}
      <polygon points="26,36 70,36 63,82 33,82" fill="#b45309" opacity="0.88" />
      <ellipse cx="48" cy="36" rx="22" ry="7" fill="#d97706" />
      {/* Ice Cubes */}
      <rect x="33" y="34" width="12" height="10" rx="2.5" fill="rgba(255,255,255,0.75)" transform="rotate(-10 39 39)" />
      <rect x="49" y="36" width="13" height="10" rx="2.5" fill="rgba(255,255,255,0.7)" transform="rotate(14 55 41)" />
      <rect x="40" y="45" width="11" height="9" rx="2" fill="rgba(255,255,255,0.55)" transform="rotate(5 45 49)" />
      {/* Glass Rim & Highlight */}
      <ellipse cx="48" cy="26" rx="24" ry="7.5" fill="rgba(255,255,255,0.18)" stroke="#fef3c7" strokeWidth="2" />
      <line x1="31" y1="34" x2="36" y2="76" stroke="rgba(255,255,255,0.45)" strokeWidth="3" strokeLinecap="round" />
    </svg>
    <span className="mt-0.5 px-2 py-0.5 rounded-full bg-amber-950/90 border border-amber-600/70 text-[9px] font-black text-amber-200 uppercase tracking-wider shadow">
      🍹 Es Teh Manis
    </span>
  </div>
);

/**
 * Ornamen Visual Meja Kayu 2: Piring Gorengan Hangat (Bakwan, Tahu Isi, Mendoan, Cabai Rawit)
 */
export const TableOrnamentGorengan: React.FC = () => (
  <div
    className="pointer-events-none select-none flex flex-col items-center"
    style={{ filter: 'drop-shadow(0 12px 14px rgba(0,0,0,0.55))' }}
  >
    <svg width="112" height="96" viewBox="0 0 112 96">
      {/* Ceramic Plate */}
      <ellipse cx="56" cy="52" rx="48" ry="32" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
      <ellipse cx="56" cy="52" rx="37" ry="23" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 4" />
      {/* Tempe Mendoan */}
      <polygon points="26,48 54,30 68,46 40,64" rx="6" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
      <circle cx="44" cy="46" r="2" fill="#15803d" />
      <circle cx="52" cy="42" r="2" fill="#15803d" />
      <circle cx="48" cy="52" r="1.8" fill="#15803d" />
      {/* Bakwan Sayur */}
      <ellipse cx="68" cy="54" rx="18" ry="13" fill="#d97706" stroke="#92400e" strokeWidth="2" />
      <path d="M58,52 Q68,45 76,55" stroke="#f97316" strokeWidth="2" fill="none" />
      <circle cx="64" cy="56" r="2" fill="#16a34a" />
      {/* Tahu Isi */}
      <polygon points="34,58 58,52 62,68 38,72" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
      {/* Cabai Rawit Hijau */}
      <path d="M72,36 Q84,32 88,42 Q78,44 72,36 Z" fill="#16a34a" stroke="#14532d" strokeWidth="1.5" />
      <path d="M88,42 L93,45" stroke="#14532d" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M24,58 Q18,66 28,70 Q32,64 24,58 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.5" />
    </svg>
    <span className="mt-0.5 px-2 py-0.5 rounded-full bg-amber-950/90 border border-amber-600/70 text-[9px] font-black text-amber-200 uppercase tracking-wider shadow">
      🥟 Sepiring Gorengan
    </span>
  </div>
);

/**
 * Ornamen Visual Meja Kayu 3: Tumpukan Uang Kertas Rupiah (Rp100.000 & Rp50.000)
 */
export const TableOrnamentRupiahStack: React.FC = () => (
  <div
    className="pointer-events-none select-none flex flex-col items-center"
    style={{ filter: 'drop-shadow(0 12px 14px rgba(0,0,0,0.55))' }}
  >
    <svg width="116" height="92" viewBox="0 0 116 92">
      {/* Bottom Stack: Rp 50.000 Blue Notes */}
      <g transform="translate(14, 26) rotate(-12)">
        <rect x="0" y="6" width="76" height="38" rx="4" fill="#0369a1" stroke="#e0f2fe" strokeWidth="1.5" />
        <rect x="0" y="3" width="76" height="38" rx="4" fill="#0284c7" stroke="#e0f2fe" strokeWidth="1.5" />
        <rect x="0" y="0" width="76" height="38" rx="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.8" />
        <rect x="5" y="5" width="66" height="28" rx="2" fill="none" stroke="#0284c7" strokeWidth="1.2" />
        <text x="38" y="23" textAnchor="middle" fill="#0c4a6e" fontSize="10" fontWeight="900" fontFamily="monospace">
          Rp 50.000
        </text>
      </g>
      {/* Top Stack: Rp 100.000 Red Notes */}
      <g transform="translate(26, 16) rotate(8)">
        <rect x="0" y="8" width="80" height="40" rx="4" fill="#991b1b" stroke="#fecaca" strokeWidth="1.5" />
        <rect x="0" y="4" width="80" height="40" rx="4" fill="#dc2626" stroke="#fecaca" strokeWidth="1.5" />
        <rect x="0" y="0" width="80" height="40" rx="4" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
        <rect x="6" y="6" width="68" height="28" rx="2" fill="#ffe4e6" opacity="0.25" />
        <circle cx="20" cy="20" r="8" fill="#fecdd3" opacity="0.5" />
        <text x="44" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="monospace">
          Rp 100.000
        </text>
        {/* Paper Money Band */}
        <rect x="33" y="-1" width="14" height="42" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.2" />
      </g>
    </svg>
    <span className="mt-0.5 px-2 py-0.5 rounded-full bg-amber-950/90 border border-amber-600/70 text-[9px] font-black text-amber-200 uppercase tracking-wider shadow">
      💵 Gepokan Merah & Biru
    </span>
  </div>
);
