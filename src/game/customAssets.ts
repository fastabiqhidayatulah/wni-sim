import {
  DEFAULT_INTRO_MOVIE_FILENAME,
  DEFAULT_INTRO_MOVIE_PATH,
  DEFAULT_SERVER_AVATAR_GLOB_ENTRIES,
  MAX_CUSTOM_ASSET_DATA_URL_LENGTH,
  PUBLIC_AVATAR_FOLDER_PATH,
  renameIntroMovieFilename,
  resolveEffectivePawnImageUrl,
  resolvePublicAvatarsMap,
} from './rules';

export interface CustomImageAssets {
  pawns: Record<string, string>; // key: avatarId ('ojol', 'emak', 'pns', 'mahasiswa', 'bakso', 'sultan', 'kurir', 'pengamen')
  buildings: Record<number, string>; // key: building level (1..5)
  boardCenterLogo: string | null;
  introMovieUrl?: string | null;
  introMovieFilename?: string | null;
  introMovieOriginalFilename?: string | null;
}

/**
 * Mengompresi gambar yang diunggah Host (PNG/JPG/WebP) menggunakan Canvas
 * agar ukuran Base64 DataURL tetap ringan (<= 45KB per gambar) dan tajam,
 * sehingga dapat disinkronkan secara real-time ke seluruh pemain di Room Firebase Firestore.
 */
export function compressImageFileToDataUrl(
  file: File,
  maxDimension = 180
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl =
        typeof reader.result === 'string' ? reader.result : '';
      if (
        rawDataUrl &&
        rawDataUrl.length <= MAX_CUSTOM_ASSET_DATA_URL_LENGTH &&
        typeof document === 'undefined'
      ) {
        resolve(rawDataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let targetDim = maxDimension;
          let quality = 0.84;
          let bestDataUrl = rawDataUrl;

          for (let attempt = 0; attempt < 4; attempt++) {
            const scale = Math.min(
              1,
              targetDim / Math.max(img.width || 1, img.height || 1)
            );
            const width = Math.max(1, Math.round((img.width || targetDim) * scale));
            const height = Math.max(1, Math.round((img.height || targetDim) * scale));

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) break;
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // Gunakan image/webp agar tetap mendukung transparansi (alpha channel) sekaligus ukuran kecil
            let candidate = canvas.toDataURL('image/webp', quality);
            if (!candidate.startsWith('data:image/webp')) {
              candidate = canvas.toDataURL('image/jpeg', quality);
            }
            bestDataUrl = candidate;

            if (bestDataUrl.length <= MAX_CUSTOM_ASSET_DATA_URL_LENGTH) {
              break;
            }
            targetDim = Math.max(72, Math.round(targetDim * 0.72));
            quality = Math.max(0.55, quality - 0.1);
          }

          resolve(bestDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => {
        resolve(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
}


// Auto-discover any .mp4 / .webm file dropped in project root or src/
const discoveredVideoModules =
  typeof import.meta !== 'undefined' && typeof import.meta.glob === 'function'
    ? (import.meta.glob(['/*.mp4', '/*.webm', '/src/**/*.mp4'], {
        eager: true,
        query: '?url',
        import: 'default',
      }) as Record<string, string>)
    : {};

export function getDefaultIntroMovieAsset(): {
  url: string;
  cleanFilename: string;
  originalFilename: string;
  wasRenamed: boolean;
} {
  const entries = Object.entries(discoveredVideoModules);
  if (entries.length > 0) {
    // Prefer any user-dropped file (e.g. Characters_moving_across_Monopoly...)
    const preferred =
      entries.find(([path]) => /character|monopol/i.test(path)) || entries[0];
    const [rawPath, resolvedUrl] = preferred;
    const renameMeta = renameIntroMovieFilename(rawPath);
    return {
      url: resolvedUrl || DEFAULT_INTRO_MOVIE_PATH,
      cleanFilename: renameMeta.cleanFilename,
      originalFilename: renameMeta.originalFilename,
      wasRenamed: renameMeta.wasRenamed,
    };
  }
  return {
    url: DEFAULT_INTRO_MOVIE_PATH,
    cleanFilename: DEFAULT_INTRO_MOVIE_FILENAME,
    originalFilename: DEFAULT_INTRO_MOVIE_FILENAME,
    wasRenamed: false,
  };
}

// Auto-discover any avatar images dropped in /public/avatars/ or /public/avatar/
const discoveredPublicAvatarModules =
  typeof import.meta !== 'undefined' && typeof import.meta.glob === 'function'
    ? (import.meta.glob(
        [
          '/public/avatars/*.{png,jpg,jpeg,webp,gif,svg,avif,PNG,JPG,JPEG,WEBP,GIF,SVG,AVIF}',
          '/public/avatar/*.{png,jpg,jpeg,webp,gif,svg,avif,PNG,JPG,JPEG,WEBP,GIF,SVG,AVIF}',
        ],
        {
          eager: true,
          query: '?url',
          import: 'default',
        }
      ) as Record<string, string>)
    : {};

export function getPublicAvatarsDiscovery(): {
  folderPath: string;
  pawnsByAvatarId: Record<string, string>;
  uploadedFiles: { filename: string; url: string; matchedAvatarIds: string[] }[];
} {
  const mergedEntries: Record<string, string> = {
    ...DEFAULT_SERVER_AVATAR_GLOB_ENTRIES,
    ...discoveredPublicAvatarModules,
  };
  const resolved = resolvePublicAvatarsMap(mergedEntries);
  return {
    folderPath: PUBLIC_AVATAR_FOLDER_PATH,
    pawnsByAvatarId: resolved.pawnsByAvatarId,
    uploadedFiles: resolved.uploadedFiles,
  };
}

export function getPawnAvatarImageUrl(
  avatarId: string | undefined,
  customAssets?: CustomImageAssets | null
): string | undefined {
  const publicDiscovery = getPublicAvatarsDiscovery();
  return resolveEffectivePawnImageUrl(
    avatarId,
    customAssets?.pawns,
    publicDiscovery.pawnsByAvatarId
  );
}

export const DEFAULT_CUSTOM_ASSETS: CustomImageAssets = {
  pawns: { ...getPublicAvatarsDiscovery().pawnsByAvatarId },
  buildings: {},
  boardCenterLogo: null,
  introMovieUrl: null,
  introMovieFilename: DEFAULT_INTRO_MOVIE_FILENAME,
  introMovieOriginalFilename: null,
};

const STORAGE_KEY = 'wni_simulator_custom_assets_v1';
const IDB_NAME = 'wni_simulator_media_db_v1';
const IDB_STORE = 'intro_movie_store';
const IDB_KEY = 'active_intro_movie';

export function loadCustomAssetsFromStorage(): CustomImageAssets {
  const publicPawns = getPublicAvatarsDiscovery().pawnsByAvatarId;
  if (typeof window === 'undefined') {
    return {
      ...DEFAULT_CUSTOM_ASSETS,
      pawns: { ...publicPawns },
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_CUSTOM_ASSETS,
        pawns: { ...publicPawns },
      };
    }
    const parsed = JSON.parse(raw);
    const storedPawns =
      parsed?.pawns && typeof parsed.pawns === 'object' ? parsed.pawns : {};
    return {
      // Avatar di /public/avatars/ menjadi penentu utama untuk semua pemain!
      pawns: {
        ...storedPawns,
        ...publicPawns,
      },
      buildings:
        parsed?.buildings && typeof parsed.buildings === 'object' ? parsed.buildings : {},
      boardCenterLogo:
        typeof parsed?.boardCenterLogo === 'string' ? parsed.boardCenterLogo : null,
      introMovieUrl: null,
      introMovieFilename:
        typeof parsed?.introMovieFilename === 'string'
          ? parsed.introMovieFilename
          : DEFAULT_INTRO_MOVIE_FILENAME,
      introMovieOriginalFilename:
        typeof parsed?.introMovieOriginalFilename === 'string'
          ? parsed.introMovieOriginalFilename
          : null,
    };
  } catch {
    return {
      ...DEFAULT_CUSTOM_ASSETS,
      pawns: { ...publicPawns },
    };
  }
}

export function saveCustomAssetsToStorage(assets: CustomImageAssets): void {
  if (typeof window === 'undefined') return;
  try {
    const serializable: CustomImageAssets = {
      pawns: assets.pawns,
      buildings: assets.buildings,
      boardCenterLogo: assets.boardCenterLogo,
      // Do not serialize blob: URLs to localStorage; IndexedDB stores the actual video Blob
      introMovieUrl: null,
      introMovieFilename:
        assets.introMovieFilename || DEFAULT_INTRO_MOVIE_FILENAME,
      introMovieOriginalFilename: assets.introMovieOriginalFilename || null,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // Ignore quota errors if user uploads huge uncompressed images; still kept in React state
  }
}

export function hasAnyCustomAsset(assets: CustomImageAssets): boolean {
  return (
    Object.keys(assets.pawns).length > 0 ||
    Object.keys(assets.buildings).length > 0 ||
    Boolean(assets.boardCenterLogo) ||
    Boolean(assets.introMovieUrl)
  );
}

interface StoredIntroMovieRecord {
  blob: Blob;
  cleanFilename: string;
  originalFilename: string;
  updatedAt: number;
}

function openIntroMovieIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveCustomIntroMovieToIDB(
  file: File
): Promise<{
  blobUrl: string;
  cleanFilename: string;
  originalFilename: string;
  wasRenamed: boolean;
}> {
  const renameMeta = renameIntroMovieFilename(file.name);
  const renamedFile = new File([file], renameMeta.cleanFilename, {
    type: file.type || 'video/mp4',
  });
  const blobUrl = URL.createObjectURL(renamedFile);

  const db = await openIntroMovieIDB();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        const record: StoredIntroMovieRecord = {
          blob: renamedFile,
          cleanFilename: renameMeta.cleanFilename,
          originalFilename: renameMeta.originalFilename,
          updatedAt: Date.now(),
        };
        store.put(record, IDB_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  return {
    blobUrl,
    cleanFilename: renameMeta.cleanFilename,
    originalFilename: renameMeta.originalFilename,
    wasRenamed: renameMeta.wasRenamed,
  };
}

export async function loadCustomIntroMovieFromIDB(): Promise<{
  blobUrl: string;
  cleanFilename: string;
  originalFilename: string;
} | null> {
  const db = await openIntroMovieIDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => {
        const rec = req.result as StoredIntroMovieRecord | undefined;
        if (rec && rec.blob instanceof Blob) {
          const blobUrl = URL.createObjectURL(rec.blob);
          resolve({
            blobUrl,
            cleanFilename: rec.cleanFilename || DEFAULT_INTRO_MOVIE_FILENAME,
            originalFilename:
              rec.originalFilename || DEFAULT_INTRO_MOVIE_FILENAME,
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function clearCustomIntroMovieFromIDB(): Promise<void> {
  const db = await openIntroMovieIDB();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.delete(IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

