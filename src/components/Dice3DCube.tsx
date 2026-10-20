import React, { useEffect, useState } from 'react';

interface Dice3DCubeProps {
  value: number; // 1..6
  isRolling: boolean;
  dieIndex: number;
  onClick?: () => void;
  disabled?: boolean;
}

const PIP_LAYOUTS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function DiceFacePips({ faceValue }: { faceValue: number }) {
  const active = PIP_LAYOUTS[faceValue] || [4];
  const isRed = faceValue === 1 || faceValue === 4;
  return (
    <div className="w-full h-full grid grid-cols-3 grid-rows-3 p-1.5 bg-gradient-to-br from-white via-stone-50 to-stone-200 rounded-[8px] border border-stone-300 shadow-inner">
      {Array.from({ length: 9 }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-center">
          {active.includes(idx) && (
            <span
              className={`rounded-full ${
                isRed
                  ? faceValue === 1
                    ? 'w-3 h-3 bg-rose-600 shadow-sm'
                    : 'w-2 h-2 bg-rose-600'
                  : 'w-2 h-2 bg-stone-900'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Target Euler rotations (in degrees) that bring the given faceValue (1..6)
 * to the +Z top surface of the board.
 */
function getRotationForValue(value: number): { rx: number; ry: number; rz: number } {
  switch (value) {
    case 1:
      return { rx: 0, ry: 0, rz: 0 };
    case 6:
      return { rx: 180, ry: 0, rz: 0 };
    case 2:
      return { rx: 90, ry: 0, rz: 0 };
    case 5:
      return { rx: -90, ry: 0, rz: 0 };
    case 3:
      return { rx: 0, ry: -90, rz: 0 };
    case 4:
      return { rx: 0, ry: 90, rz: 0 };
    default:
      return { rx: 0, ry: 0, rz: 0 };
  }
}

export const Dice3DCube: React.FC<Dice3DCubeProps> = ({
  value,
  isRolling,
  dieIndex,
  onClick,
  disabled,
}) => {
  const [rollCycle, setRollCycle] = useState<number>(0);

  useEffect(() => {
    if (isRolling) {
      setRollCycle((c) => c + 1);
    }
  }, [isRolling]);

  const baseRot = getRotationForValue(value);
  // Add full 360-degree multi-axis tumbles per roll cycle so CSS transition spins smoothly
  const extraSpinsX = rollCycle * 720 + (isRolling ? (dieIndex === 0 ? 540 : -540) : 0);
  const extraSpinsY = rollCycle * 1080 + (isRolling ? (dieIndex === 0 ? -450 : 630) : 0);
  const extraSpinsZ = rollCycle * 360 + (isRolling ? (dieIndex === 0 ? 215 : -195) : dieIndex === 0 ? -12 : 14);

  const finalRx = baseRot.rx + extraSpinsX;
  const finalRy = baseRot.ry + extraSpinsY;
  const finalRz = baseRot.rz + extraSpinsZ;

  // Cube size = 44px (half = 22px)
  const half = 22;

  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled && onClick) {
          onClick();
        }
      }}
      disabled={disabled}
      aria-label={`Dadu 3D ${dieIndex + 1}: nilai ${value}`}
      data-testid={`dice-3d-cube-${dieIndex}`}
      className={`relative w-11 h-11 focus:outline-none group ${
        disabled ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'
      }`}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Dynamic Drop Shadow on the Board Surface */}
      <div
        className="absolute inset-0 rounded-xl bg-black/55 transition-all duration-500 pointer-events-none"
        style={{
          transform: isRolling
            ? 'translateZ(1px) translate(18px, 22px) scale(0.68)'
            : 'translateZ(1px) translate(6px, 8px) scale(0.95)',
          filter: isRolling ? 'blur(8px)' : 'blur(3px)',
          opacity: isRolling ? 0.38 : 0.65,
        }}
      />

      {/* 3D Cube Container that Jumps along +Z and Rotates in X, Y, Z */}
      <div
        className="relative w-11 h-11 transition-transform duration-500 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `translateZ(${
            isRolling ? 88 : half + 2
          }px) rotateX(${finalRx}deg) rotateY(${finalRy}deg) rotateZ(${finalRz}deg)`,
        }}
      >
        {/* Face 1: TOP (+Z) */}
        <div
          className="absolute inset-0"
          style={{
            transform: `rotateY(0deg) translateZ(${half}px)`,
            backfaceVisibility: 'hidden',
          }}
        >
          <DiceFacePips faceValue={1} />
        </div>

        {/* Face 6: BOTTOM (-Z) */}
        <div
          className="absolute inset-0"
          style={{
            transform: `rotateY(180deg) translateZ(${half}px)`,
            backfaceVisibility: 'hidden',
          }}
        >
          <DiceFacePips faceValue={6} />
        </div>

        {/* Face 2: FRONT-SOUTH (-Y) */}
        <div
          className="absolute inset-0"
          style={{
            transform: `rotateX(-90deg) translateZ(${half}px)`,
            backfaceVisibility: 'hidden',
          }}
        >
          <DiceFacePips faceValue={2} />
        </div>

        {/* Face 5: BACK-NORTH (+Y) */}
        <div
          className="absolute inset-0"
          style={{
            transform: `rotateX(90deg) translateZ(${half}px)`,
            backfaceVisibility: 'hidden',
          }}
        >
          <DiceFacePips faceValue={5} />
        </div>

        {/* Face 3: RIGHT-EAST (+X) */}
        <div
          className="absolute inset-0"
          style={{
            transform: `rotateY(90deg) translateZ(${half}px)`,
            backfaceVisibility: 'hidden',
          }}
        >
          <DiceFacePips faceValue={3} />
        </div>

        {/* Face 4: LEFT-WEST (-X) */}
        <div
          className="absolute inset-0"
          style={{
            transform: `rotateY(-90deg) translateZ(${half}px)`,
            backfaceVisibility: 'hidden',
          }}
        >
          <DiceFacePips faceValue={4} />
        </div>
      </div>
    </button>
  );
};
