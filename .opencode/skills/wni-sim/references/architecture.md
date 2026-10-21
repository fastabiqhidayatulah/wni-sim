# Arsitektur aplikasi

## Layar dan state utama (`App.tsx`)

- `screen`: `'LOBBY' | 'WAITING_ROOM' | 'INTRO_MOVIE' | 'GAME'`
- `gameState`: `'title' | 'playing' | 'paused' | 'gameover'`
- `turnPhase`: `'READY_TO_ROLL' | 'ROLLING' | 'RESOLVING_TILE' | 'TURN_ENDED'`
- `rollLockRef` mencegah dobel lempar.
- State inti game: `players`, `activePlayerIndex`, `properties` (Record<tileId, PropertyState>), `round`, `stateTreasury` (Kas Negara, awal Rp25 jt), `takdirDeck`, `musibahDeck`, `loans`, `activityLogs`, `dice`, `extraDie`, `durationMode` (default `FAST_15`).
- State UI: `isIsometric`, `isFollowCamera`, `hudMode` (`FULL|MINIMAL|HIDDEN`), `collapsedPanels`, `isMuted`, `customAssets`, hover state, `floatingTexts`, banner/toast.
- State lobby/online: `nickname`, `selectedAvatarId`, `roomCode`, `isHost`, `myPlayerId`, `isOnlineRoom`, `firebaseUser`.

## Handler utama (semua di `App.tsx`)

Giliran: `handleRollDice`, `handleNextTurn`. Properti: `handleBuyProperty`, `handleUpgradeProperty`, `handleSellBuildingForCash`, `handleSellLandForCash`. Penjara: `handleJailTryDoubles`, `handleJailPayFine`, `handleJailUseOrdal`, `handleJailBuyPremiumCell`, `handlePremiumBuyAnyProperty`, `handlePremiumStayInCell`. Kartu nasib: `handleRollFateCardDice`, `handleConfirmFateCard`, `handleCancelFateCardWithDoa`. Tol/pengadilan: `handleUseDiskonTolInModal`, `handleSelectTollDestination`, `handleRollCourtDice`, `handleConfirmCourtVerdict`. Uang antar pemain: `handleGiveMoney`, `handleSendAskMoneyRequest`, `handleAcceptMoneyRequest`, `handleRejectMoneyRequest`. Pinjaman: `handleRequestLoanFromPlayer`, `handleApproveLoanWithInterest`, `handleRejectLoanProposal`, `handleRepayLoan`, `handleSettlePendingObligation`, `handleDeclareBankruptcyFromCrisis`. Kartu simpanan: `handleConfirmUseSavedCard`, `handleApplyDukunDiceChange`. Lobby: `handleCreateRoom`, `handleJoinRoom`, `handleQuickPlayLocal`, `handleAddBotsInWaitingRoom`, `handleStartGameFromWaitingRoom`, dst.

## Bot

Pemain dengan `isBot: true` bermain otomatis lewat efek di `App.tsx` (sekitar baris 3400 dan 1022). Flag `autoBotFastMode` mempercepat bot. Perubahan pada alur giliran harus tetap berjalan untuk bot (tidak boleh menunggu klik manusia).

## Komponen

- `IsometricBoard.tsx`: render papan 11x11 (gridRow/gridCol 0..10; Bekasi di 5,5), kamera isometrik/follow, pion, bangunan 3D.
- `GameModals.tsx`: modal untuk takdir/musibah, tol, pengadilan, penjara, kartu simpanan, dukun, pinjaman, kas, game over. Props sangat banyak, dioper dari `App`.
- `Building3DMiniature.tsx`, `Dice3DCube.tsx`: visual 3D CSS.
- `HoverInfoPopups.tsx`: tooltip petak dan pemain (memakai `getTileHoverDetails`).
- `CustomAssetsModal.tsx`: host unggah pion/bangunan/logo/intro; `customAssets.ts` mengompres.
- `IntroMovieScreen.tsx`: memutar `/intro-wni-simulator.mp4`.

## Styling

Tailwind CSS 4 lewat plugin Vite (`@import "tailwindcss"` di `src/index.css`), ikon `lucide-react`, animasi `motion`. Tidak ada `tailwind.config`; pakai utility class langsung.

## Penyimpanan lokal

Ada cache room lokal (`saveLocalRoomCache`) untuk mode offline/quick play. Mode lokal tidak butuh login Firebase.
