import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOARD_TILES,
  BEKASI_CENTER_TILE,
  BANDUNG_TILE_ID,
  TOLL_TILE_IDS,
  ALL_SAVED_CARDS,
  WANTIMPRES_START_SALARY,
  createInitialPlayers,
  createInitialProperties,
  formatRupiah,
  calculateMovement,
  calculatePropertyRent,
  getUpgradeCostForNextLevel,
  calculateLandTax,
  calculatePungliFee,
  resolveRentRecipient,
  resolveCourtVerdict,
  resolveFitnahRoll,
  calculateLoanTotalDue,
  calculateSellBuildingValue,
  calculateSellLandValue,
  checkExtremeEscalation,
  AVATAR_CHARACTERS,
  createPlayerFromAvatar,
  generateBotPlayers,
  generateRoomCode,
  createHostOnlyRoomPlayers,
  deriveMemberUids,
  removeBotFromRoom,
  removeAllBotsFromRoom,
  resolveHumanJoinRoomPlayers,
  calculatePlayerPropertyValue,
  calculatePlayerNetWorth,
  checkGameEndCondition,
  getTileHoverDetails,
  calculateCameraFollowTransform,
  cycleHudLayoutMode,
  buildTurnTransitionInfo,
  DEFAULT_INTRO_MOVIE_FILENAME,
  renameIntroMovieFilename,
  resolveGameStartTargetScreen,
  MAX_CUSTOM_ASSET_DATA_URL_LENGTH,
  sanitizeCustomAssetsForFirestore,
  deserializeCustomAssetsFromFirestore,
  mergeRemoteCustomAssetsWithLocal,
  countSyncedCustomAssets,
  resolvePublicAvatarsMap,
  resolveEffectivePawnImageUrl,
} from './rules.ts';

test('board has 40 perimeter tiles and 1 Bekasi center tile (#40)', () => {
  assert.equal(BOARD_TILES.length, 40);
  assert.equal(BOARD_TILES[0].name, 'START');
  assert.equal(BOARD_TILES[10].name, 'LAPAS / PENJARA');
  assert.equal(BOARD_TILES[19].name, 'Bandung');
  assert.equal(BOARD_TILES[20].name, 'PARKIRAN PUNGLI');
  assert.equal(BOARD_TILES[30].name, 'PENGADILAN');
  assert.equal(BOARD_TILES[38].name, 'Tilang Elektronik / ETLE');
  assert.equal(BOARD_TILES[39].name, 'Jakarta Selatan / SCBD');
  assert.deepEqual(TOLL_TILE_IDS, [5, 15, 25, 35]);
  assert.equal(BEKASI_CENTER_TILE.id, 40);
});

test('Fase 2 building rent rates (20%, 40%, 70%, 100%, 150%, 250%) and upgrade costs match spec', () => {
  const depok = BOARD_TILES[1]; // Rp1.000.000
  assert.equal(calculatePropertyRent(depok, 0), 200_000); // 20%
  assert.equal(calculatePropertyRent(depok, 1), 400_000); // 40%
  assert.equal(calculatePropertyRent(depok, 2), 700_000); // 70%
  assert.equal(calculatePropertyRent(depok, 3), 1_000_000); // 100%
  assert.equal(calculatePropertyRent(depok, 4), 1_500_000); // 150%
  assert.equal(calculatePropertyRent(depok, 5), 2_500_000); // 250%

  assert.equal(getUpgradeCostForNextLevel(1), 500_000);
  assert.equal(getUpgradeCostForNextLevel(2), 1_000_000);
  assert.equal(getUpgradeCostForNextLevel(3), 1_500_000);
  assert.equal(getUpgradeCostForNextLevel(4), 2_000_000);
  assert.equal(getUpgradeCostForNextLevel(5), 3_000_000);
});

test('calculateMovement wraps around 40 tiles and awards Rp1 Jt normal or Rp76,5 Jt with Wantimpres', () => {
  const moveWrap = calculateMovement(37, 5, false);
  assert.deepEqual(moveWrap.path, [38, 39, 0, 1, 2]);
  assert.equal(moveWrap.newPosition, 2);
  assert.equal(moveWrap.passedOrLandedStart, true);
  assert.equal(moveWrap.salaryEarned, 1_000_000);

  const moveWantimpres = calculateMovement(38, 3, true);
  assert.equal(moveWantimpres.passedOrLandedStart, true);
  assert.equal(moveWantimpres.salaryEarned, WANTIMPRES_START_SALARY);
  assert.equal(formatRupiah(moveWantimpres.salaryEarned), 'Rp76,5 Jt');
});

test('Fase 3: 10 Kartu Simpanan, Fitnah roll, Loan interest (1-200%), 50% asset sell, and Extreme Escalation', () => {
  assert.equal(ALL_SAVED_CARDS.length, 10);

  assert.equal(resolveFitnahRoll(1), 'TARGET_TO_JAIL');
  assert.equal(resolveFitnahRoll(2), 'TARGET_TO_JAIL');
  assert.equal(resolveFitnahRoll(3), 'SELF_TO_JAIL');
  assert.equal(resolveFitnahRoll(4), 'SELF_TO_JAIL');
  assert.equal(resolveFitnahRoll(5), 'BOTH_TO_COURT');
  assert.equal(resolveFitnahRoll(6), 'BOTH_TO_COURT');

  assert.equal(calculateLoanTotalDue(1_000_000, 50), 1_500_000);
  assert.equal(calculateLoanTotalDue(2_000_000, 200), 6_000_000);
  assert.equal(calculateLoanTotalDue(1_000_000, 1), 1_010_000);

  const depok = BOARD_TILES[1]; // Rp1.000.000
  assert.equal(calculateSellBuildingValue(1), 250_000); // 50% of 500rb
  assert.equal(calculateSellLandValue(depok, 0), 500_000); // 50% of 1jt
  assert.equal(calculateSellLandValue(depok, 1), 750_000); // 50% of 1jt + 50% of 500rb

  const players = createInitialPlayers();
  assert.equal(checkExtremeEscalation(players), false);
  players.forEach((p) => {
    p.startPassCount = 2;
  });
  assert.equal(checkExtremeEscalation(players), true);
});

test('calculateLandTax and calculatePungliFee follow WNI Simulator rules with Bandung (#19)', () => {
  const props = createInitialProperties();
  assert.equal(calculateLandTax(0, props).taxAmount, 0);
  assert.equal(calculatePungliFee(0, props).fee, 1_000_000);

  props[1].ownerId = 0;
  props[BANDUNG_TILE_ID].ownerId = 0;

  assert.equal(calculateLandTax(0, props).ownedCount, 2);
  assert.equal(calculateLandTax(0, props).taxAmount, 1_000_000);
  assert.equal(calculatePungliFee(0, props).ownsBandung, true);
  assert.equal(calculatePungliFee(0, props).fee, 0);

  props[BANDUNG_TILE_ID].isSeizedByState = true;
  assert.equal(calculatePungliFee(0, props).ownsBandung, false);
  assert.equal(calculatePungliFee(0, props).fee, 1_000_000);
});

test('resolveRentRecipient and resolveCourtVerdict match spec', () => {
  const players = createInitialPlayers();
  const owner = players[0];
  assert.equal(resolveRentRecipient(owner), 'OWNER');

  owner.status = 'DI_LAPAS';
  assert.equal(resolveRentRecipient(owner), 'NEGARA');

  owner.status = 'SEL_PREMIUM';
  assert.equal(resolveRentRecipient(owner), 'OWNER');

  const win = resolveCourtVerdict(6, 8_000_000);
  assert.equal(win.moneyDelta, 1_000_000);
  assert.equal(win.sendToJail, false);

  const heavy = resolveCourtVerdict(2, 8_000_000);
  assert.equal(heavy.moneyDelta, -4_000_000);
  assert.equal(heavy.sendToJail, true);
});

test('Fase 4: 8 Avatar Characters, Room Code generator, and up to 64 players room capacity', () => {
  assert.equal(AVATAR_CHARACTERS.length, 8);
  assert.equal(AVATAR_CHARACTERS[0].title, 'Driver Ojol');
  assert.equal(AVATAR_CHARACTERS[4].title, 'Kang Bakso');
  assert.equal(AVATAR_CHARACTERS[7].title, 'Pengamen Senja');

  const code = generateRoomCode();
  assert.match(code, /^WNI-\d{3}$/);

  const host = createPlayerFromAvatar({
    id: 0,
    name: 'Warga Teladan',
    avatarId: 'bakso',
    isHost: true,
  });
  assert.equal(host.avatarEmoji, '🍜');
  assert.equal(host.money, 10_000_000);

  const full64Room = generateBotPlayers([host], 70, 64);
  assert.equal(full64Room.length, 64);
  assert.equal(full64Room[0].isHost, true);
  assert.equal(full64Room[63].isBot, true);
});

test('Waiting Room Bugfix: Create Room has ONLY 1 Host (0 Bots), Kick Bot works, and Join Room auto-replaces last Bot when full', () => {
  // 1. Saat Buat Room Baru, hanya ada 1 pemain (Host) dan 0 Bot
  const initialHostOnly = createHostOnlyRoomPlayers({
    hostName: 'Bang Host',
    avatarId: 'ojol',
    uid: 'host-uid-1',
  });
  assert.equal(initialHostOnly.length, 1);
  assert.equal(initialHostOnly[0].isHost, true);
  assert.equal(initialHostOnly[0].isBot, false);
  assert.equal(initialHostOnly[0].name, 'Bang Host');

  // 2. Host menambah 3 Bot manual (total 4/4 pemain), lalu menghapus 1 Bot & semua Bot
  const with3Bots = generateBotPlayers(initialHostOnly, 3, 4);
  assert.equal(with3Bots.length, 4);
  assert.equal(with3Bots.filter((p) => p.isBot).length, 3);

  const afterRemoveOneBot = removeBotFromRoom(with3Bots, with3Bots[1].id);
  assert.equal(afterRemoveOneBot.length, 3);
  assert.equal(afterRemoveOneBot.some((p) => p.id === with3Bots[1].id), false);

  const afterRemoveAllBots = removeAllBotsFromRoom(with3Bots);
  assert.equal(afterRemoveAllBots.length, 1);
  assert.equal(afterRemoveAllBots[0].isBot, false);

  // 3. Prioritas Pemain Asli saat Join Room (Auto-Replace Bot terakhir jika penuh dengan Bot)
  const joinIntoFullWithBots = resolveHumanJoinRoomPlayers({
    existingPlayers: with3Bots, // 1 Host + 3 Bots (4/4 penuh)
    maxPlayers: 4,
    joiningPlayer: {
      name: 'Teman Asli 1',
      avatarId: 'sultan',
      uid: 'human-2',
    },
  });
  assert.equal(joinIntoFullWithBots.ok, true);
  assert.equal(joinIntoFullWithBots.updatedPlayers.length, 4);
  assert.equal(Boolean(joinIntoFullWithBots.replacedBotName), true);
  // Bot terakhir (index 3) harus tergantikan oleh Teman Asli 1
  assert.equal(joinIntoFullWithBots.updatedPlayers[3].name, 'Teman Asli 1');
  assert.equal(joinIntoFullWithBots.updatedPlayers[3].isBot, false);
  assert.equal(
    joinIntoFullWithBots.updatedPlayers.filter((p) => p.isBot).length,
    2
  );

  // 4. Jika seluruh slot (4/4) sudah terisi manusia asli (!isBot), barulah ditolak dengan pesan Room Penuh
  let allHumanPlayers = [...initialHostOnly];
  for (let i = 2; i <= 4; i++) {
    const res = resolveHumanJoinRoomPlayers({
      existingPlayers: allHumanPlayers,
      maxPlayers: 4,
      joiningPlayer: {
        name: `Manusia ${i}`,
        avatarId: 'pns',
        uid: `human-${i}`,
      },
    });
    assert.equal(res.ok, true);
    allHumanPlayers = res.updatedPlayers;
  }
  assert.equal(allHumanPlayers.length, 4);
  assert.equal(allHumanPlayers.every((p) => !p.isBot), true);

  const fifthHumanAttempt = resolveHumanJoinRoomPlayers({
    existingPlayers: allHumanPlayers,
    maxPlayers: 4,
    joiningPlayer: {
      name: 'Manusia Ke-5',
      avatarId: 'kurir',
      uid: 'human-5',
    },
  });
  assert.equal(fifthHumanAttempt.ok, false);
  assert.match(fifthHumanAttempt.errorMessage || '', /Room Penuh/i);
});

test('Fast Duration Mode, Net Worth calculation, and Tile Hover details work accurately', () => {
  const players = createInitialPlayers();
  const props = createInitialProperties();

  // Player 0 buys Depok (#1, Rp1 Jt) and upgrades to Level 2 (Rp500 Rb + Rp1 Jt = Rp1,5 Jt upgrade -> total property value Rp2,5 Jt)
  props[1].ownerId = 0;
  props[1].level = 2;

  const p0PropVal = calculatePlayerPropertyValue(0, props);
  assert.equal(p0PropVal.count, 1);
  assert.equal(p0PropVal.totalValue, 2_500_000);
  assert.equal(calculatePlayerNetWorth(players[0], props, []), 12_500_000);

  // Check FAST_10 end condition at round 11
  const notEndedAt10 = checkGameEndCondition({
    players,
    properties: props,
    round: 10,
    durationMode: 'FAST_10',
  });
  assert.equal(notEndedAt10.isGameOver, false);

  const endedAt11 = checkGameEndCondition({
    players,
    properties: props,
    round: 11,
    durationMode: 'FAST_10',
  });
  assert.equal(endedAt11.isGameOver, true);
  assert.equal(endedAt11.winnerRunnerUp?.id, 0);

  // Check WEALTH_25M end condition when Player 1 reaches Rp25 Jt
  players[1].money = 25_500_000;
  const wealthEnd = checkGameEndCondition({
    players,
    properties: props,
    round: 4,
    durationMode: 'WEALTH_25M',
  });
  assert.equal(wealthEnd.isGameOver, true);
  assert.equal(wealthEnd.winnerRunnerUp?.id, 1);

  // Check Tile Hover details for Bandung (#19) and Start (#0)
  const bandungHover = getTileHoverDetails(BOARD_TILES[BANDUNG_TILE_ID]);
  assert.equal(Boolean(bandungHover.specialPerk), true);
  const startHover = getTileHoverDetails(BOARD_TILES[0]);
  assert.match(startHover.categoryBadge, /START|PETAK AWAL/i);
});

test('Camera Follow transform and HUD Layout Mode cycling work accurately', () => {
  assert.equal(cycleHudLayoutMode('FULL'), 'MINIMAL');
  assert.equal(cycleHudLayoutMode('MINIMAL'), 'HIDDEN');
  assert.equal(cycleHudLayoutMode('HIDDEN'), 'FULL');

  // At Planet Bekasi (#40, center of board 5,5), pan offset is (0, 0)
  const bekasiFollow = calculateCameraFollowTransform({
    tilePosition: 40,
    isIsometric: true,
    baseZoom: 1.38,
    hudMode: 'FULL',
  });
  assert.equal(bekasiFollow.panX, 0);
  assert.equal(bekasiFollow.panY, 0);
  assert.equal(bekasiFollow.zoom, 1.38);

  // At START (#0, bottom-right corner 10,10), isometric camera pans left/up to center the character
  const startFollow = calculateCameraFollowTransform({
    tilePosition: 0,
    isIsometric: true,
    baseZoom: 1.38,
    hudMode: 'MINIMAL',
  });
  assert.equal(startFollow.zoom, 1.44);
  assert.equal(startFollow.panX < 0, true);
  assert.equal(startFollow.panY < 0, true);
  assert.equal(startFollow.targetTileName, 'START');

  // At PARKIRAN PUNGLI (#20, top-left corner 0,0), 2D top-down camera pans right/down
  const pungli2DFollow = calculateCameraFollowTransform({
    tilePosition: 20,
    isIsometric: false,
    baseZoom: 1.38,
    hudMode: 'HIDDEN',
  });
  assert.equal(pungli2DFollow.zoom, 1.5);
  assert.equal(pungli2DFollow.panX > 0, true);
  assert.equal(pungli2DFollow.panY > 0, true);
});

test('Turn Transition Info builder produces accurate player banner and status metadata', () => {
  const players = createInitialPlayers();
  const hostTransition = buildTurnTransitionInfo({
    player: players[0],
    round: 2,
    previousPlayerName: players[3].name,
  });
  assert.equal(hostTransition.playerName, players[0].name);
  assert.equal(hostTransition.round, 2);
  assert.equal(hostTransition.previousPlayerName, players[3].name);
  assert.equal(hostTransition.headline, 'GILIRAN BERMAIN');
  assert.equal(hostTransition.tileName, 'START');
  assert.match(hostTransition.statusLabel, /NORMAL/i);

  const jailedBot = {
    ...players[1],
    isBot: true,
    status: 'DI_LAPAS' as const,
    position: 10,
  };
  const botTransition = buildTurnTransitionInfo({
    player: jailedBot,
    round: 3,
    previousPlayerName: players[0].name,
  });
  assert.equal(botTransition.isBot, true);
  assert.equal(botTransition.headline, 'GILIRAN BOT WNI');
  assert.match(botTransition.statusLabel, /LAPAS/i);
  assert.equal(botTransition.tileName, 'LAPAS / PENJARA');
});

test('Intro Movie filename renaming and game start screen routing work accurately', () => {
  const renamed = renameIntroMovieFilename(
    'Characters_moving_across_Monopol…_1080p_20261019193048.mp4'
  );
  assert.equal(renamed.cleanFilename, 'intro-wni-simulator.mp4');
  assert.equal(
    renamed.originalFilename,
    'Characters_moving_across_Monopol…_1080p_20261019193048.mp4'
  );
  assert.equal(renamed.wasRenamed, true);

  const alreadyClean = renameIntroMovieFilename(DEFAULT_INTRO_MOVIE_FILENAME);
  assert.equal(alreadyClean.cleanFilename, 'intro-wni-simulator.mp4');
  assert.equal(alreadyClean.wasRenamed, false);

  assert.equal(
    resolveGameStartTargetScreen({ introMovieEnabled: true }),
    'INTRO_MOVIE'
  );
  assert.equal(
    resolveGameStartTargetScreen({ introMovieEnabled: false }),
    'GAME'
  );
  assert.equal(
    resolveGameStartTargetScreen({
      introMovieEnabled: true,
      skipIntroQuery: true,
    }),
    'GAME'
  );
});

test('Host Custom Assets Firebase sanitization, deserialization, and merging enforce volumetric bounds', () => {
  const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const oversizedDataUrl = 'data:image/png;base64,' + 'A'.repeat(MAX_CUSTOM_ASSET_DATA_URL_LENGTH + 100);

  const sanitized = sanitizeCustomAssetsForFirestore({
    pawns: {
      ojol: validPng,
      emak: 'blob:http://localhost:3000/not-syncable',
      invalid_avatar: validPng,
      sultan: oversizedDataUrl,
    },
    buildings: {
      1: validPng,
      5: '/custom-kopdes.png',
      99: validPng,
    },
    boardCenterLogo: validPng,
  });

  assert.deepEqual(Object.keys(sanitized.pawns), ['ojol']);
  assert.deepEqual(Object.keys(sanitized.buildings), ['1', '5']);
  assert.equal(sanitized.boardCenterLogo, validPng);
  assert.equal(countSyncedCustomAssets(sanitized), 4);

  const deserialized = deserializeCustomAssetsFromFirestore(sanitized);
  assert.equal(deserialized.pawns.ojol, validPng);
  assert.equal(deserialized.buildings[1], validPng);
  assert.equal(deserialized.buildings[5], '/custom-kopdes.png');
  assert.equal(deserialized.boardCenterLogo, validPng);

  const merged = mergeRemoteCustomAssetsWithLocal(
    {
      pawns: {} as Record<string, string>,
      buildings: {} as Record<number, string>,
      boardCenterLogo: null,
      introMovieFilename: 'intro-wni-simulator.mp4',
    },
    sanitized
  );
  assert.equal(merged.pawns.ojol, validPng);
  assert.equal(merged.buildings[5], '/custom-kopdes.png');
  assert.equal(merged.boardCenterLogo, validPng);
  assert.equal(merged.introMovieFilename, 'intro-wni-simulator.mp4');
});

test('Public server avatar folder (/public/avatars/) maps single or multiple uploaded files to all players', () => {
  // 1. Jika hanya 1 gambar diupload dengan nama bebas, SEMUA 8 karakter otomatis memakai gambar tersebut
  const singleUpload = resolvePublicAvatarsMap({
    '/public/avatars/avatar-pilihan-saya.png': '/public/avatars/avatar-pilihan-saya.png',
  });
  assert.equal(singleUpload.uploadedFiles.length, 1);
  for (const av of AVATAR_CHARACTERS) {
    assert.equal(
      singleUpload.pawnsByAvatarId[av.id],
      '/avatars/avatar-pilihan-saya.png'
    );
  }

  // 2. Jika diupload dengan nama spesifik (mis. ojol.png & emak.jpg), yang cocok dapat namanya dan sisanya round-robin
  const namedUpload = resolvePublicAvatarsMap({
    '/public/avatars/ojol.png': '/avatars/ojol.png',
    '/public/avatars/emak.jpg': '/avatars/emak.jpg',
  });
  assert.equal(namedUpload.pawnsByAvatarId.ojol, '/avatars/ojol.png');
  assert.equal(namedUpload.pawnsByAvatarId.emak, '/avatars/emak.jpg');
  assert.ok(Boolean(namedUpload.pawnsByAvatarId.pns));

  // 3. Prioritas: /public/avatars/ mengalahkan gambar custom lokal
  assert.equal(
    resolveEffectivePawnImageUrl(
      'ojol',
      { ojol: 'data:image/png;base64,LOCAL' },
      namedUpload.pawnsByAvatarId
    ),
    '/avatars/ojol.png'
  );
});

test('deriveMemberUids: hanya uid manusia, tanpa duplikat, maksimal 64 entri', () => {
  // 1. Room khas: host manusia + beberapa bot → hanya uid manusia yang masuk
  const hostOnly = createHostOnlyRoomPlayers({
    hostName: 'Bang Jago',
    avatarId: 'ojol',
    uid: 'uid-host-1',
  });
  const withBots = generateBotPlayers(hostOnly, 3, 8);
  assert.deepEqual(deriveMemberUids(withBots), ['uid-host-1']);

  // 2. Bot tidak pernah ikut, walau uid-nya unik ('p-N')
  const memberList = deriveMemberUids(withBots);
  assert.ok(
    withBots.filter((p) => p.isBot).every((b) => !memberList.includes(String(b.uid)))
  );

  // 3. Setelah join, uid joiner ikut; setelah bot digantikan manusia, uid manusia bertambah
  const joined = resolveHumanJoinRoomPlayers({
    existingPlayers: withBots,
    maxPlayers: 8,
    joiningPlayer: { name: 'Si Cepot', avatarId: 'cepot', uid: 'uid-guest-2' },
  });
  assert.ok(joined.ok);
  const memberUids = deriveMemberUids(joined.updatedPlayers);
  assert.deepEqual(memberUids, ['uid-host-1', 'uid-guest-2']);

  // 4. Tidak ada duplikat & tersanitasi (maks 64 entri, string maks 128 karakter)
  const dupPlayers = [
    ...joined.updatedPlayers,
    { ...joined.updatedPlayers[0], isBot: false },
  ];
  assert.equal(new Set(deriveMemberUids(dupPlayers)).size, 2);

  const longUid = 'x'.repeat(200);
  const longUidPlayer = createPlayerFromAvatar({
    id: 9,
    name: 'Warga',
    avatarId: 'ojol',
    uid: longUid,
  });
  assert.equal(deriveMemberUids([longUidPlayer])[0].length, 128);
});




