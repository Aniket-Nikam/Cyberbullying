// ============================================================
//  UNSILENCED — Firebase + Cloudinary Configuration
//  Cloudinary Cloud Name : delwuljga
//  Cloudinary API Key    : 512793948514589
//  Cloudinary Key Name   : Cyberbullying
// ============================================================

// ── FIREBASE ─────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyCBgZdbAG9o1s1BLaScgMMzA7e7InWaUfc',
  authDomain:        'cyberbullying-b861d.firebaseapp.com',
  databaseURL:       'https://cyberbullying-b861d-default-rtdb.firebaseio.com',
  projectId:         'cyberbullying-b861d',
  storageBucket:     'cyberbullying-b861d.firebasestorage.app',
  messagingSenderId: '78205535176',
  appId:             '1:78205535176:web:28f04d1d3587e49f6276fd',
  measurementId:     'G-DGNQY1Z0TR'
};

// ── CLOUDINARY ────────────────────────────────────────────────
//  Your CLOUDINARY_URL pattern:
//    cloudinary://512793948514589:<YOUR_API_SECRET>@delwuljga
//
//  TO GET YOUR UNSIGNED UPLOAD PRESET:
//    1. Login to https://cloudinary.com
//    2. Settings (gear icon) → Upload tab → Upload Presets
//    3. Click 'Add upload preset'
//       - Signing Mode : Unsigned
//       - Folder       : unsilenced-evidence
//    4. Save → copy the preset name → paste below
const CLOUDINARY_CONFIG = {
  cloudName:    'delwuljga',
  apiKey:       '512793948514589',
  uploadPreset: 'YOUR_UNSIGNED_PRESET_NAME',  // <-- only thing you need to fill in
  folder:       'unsilenced-evidence',

  // URL builders — do not edit
  uploadUrl()      { return `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`; },
  videoUploadUrl() { return `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`; },
  thumb(publicId)  { return `https://res.cloudinary.com/${this.cloudName}/image/upload/w_200,h_200,c_thumb/${publicId}`; },
  full(publicId)   { return `https://res.cloudinary.com/${this.cloudName}/image/upload/${publicId}`; }
};

// ── STATE ─────────────────────────────────────────────────────
let firebaseApp = null;
let firebaseDB  = null;
let isRTDBReady = false;

// ── FIREBASE INIT ─────────────────────────────────────────────
async function initFirebase() {
  try {
    const { initializeApp, getApps } = await import(
      'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'
    );
    const { getDatabase, ref, set, push, get, update, onValue, child } = await import(
      'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js'
    );

    firebaseApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    firebaseDB  = getDatabase(firebaseApp);
    isRTDBReady = true;

    window._db = {
      db: firebaseDB,
      ref, set, push, get, update, onValue, child,

      // Push new auto-ID child with createdAt timestamp
      pushNew: (path, data) =>
        push(ref(firebaseDB, path), { ...data, createdAt: Date.now() }),

      // Overwrite a node, stamp updatedAt
      write: (path, data) =>
        set(ref(firebaseDB, path), { ...data, updatedAt: Date.now() }),

      // Read single node; returns value or null
      read: async (path) => {
        const snap = await get(ref(firebaseDB, path));
        return snap.exists() ? snap.val() : null;
      },

      // Read all children; returns object or {}
      readAll: async (path) => {
        const snap = await get(ref(firebaseDB, path));
        return snap.exists() ? snap.val() : {};
      },

      // Partial update — merge fields into existing node
      patch: (path, data) => update(ref(firebaseDB, path), data),

      // Atomically increment a numeric counter; return new value
      increment: async (path) => {
        const current = await window._db.read(path);
        const next    = (typeof current === 'number' ? current : 0) + 1;
        await set(ref(firebaseDB, path), next);
        return next;
      },

      // Save quiz result and update best score on user profile
      saveQuizResult: async (uid, score, total, tier) => {
        const percentage = Math.round((score / total) * 100);
        await window._db.pushNew('quiz_results', {
          uid, score, total, percentage, tier, takenAt: Date.now()
        });
        if (uid) {
          const best = await window._db.read(`users/${uid}/quizBestScore`);
          if (best === null || score > best) {
            await window._db.patch(`users/${uid}`, { quizBestScore: score });
          }
        }
      },

      // Persist user safety plan (overwrites previous)
      saveSafetyPlan: async (uid, planData) => {
        if (!uid) return;
        await window._db.patch(`users/${uid}/safetyPlan`, {
          ...planData, savedAt: Date.now()
        });
      },

      // Increment likes on a story; return new count
      likeStory: async (storyId) => {
        const current = await window._db.read(`stories/${storyId}/likes`);
        const next    = (typeof current === 'number' ? current : 0) + 1;
        await set(ref(firebaseDB, `stories/${storyId}/likes`), next);
        return next;
      },

      // Submit new community story (approved: false — needs moderation)
      submitStory: (tag, text, author, location, uid) =>
        window._db.pushNew('stories', {
          tag, text, author, location,
          uid: uid || null, likes: 0, approved: false
        })
    };

    // Hydrate the live pledge counter on load
    const pledgeSnap = await get(ref(firebaseDB, 'meta/pledgeCount'));
    if (pledgeSnap.exists()) {
      const el = document.getElementById('pledgeCounter');
      if (el) el.textContent = Number(pledgeSnap.val()).toLocaleString('en-IN');
    }

    console.log('%c UNSILENCED Firebase Ready', 'color:#e8281e;font-weight:bold');
  } catch (err) {
    console.warn('Firebase init failed — demo mode active:', err.message);
    isRTDBReady = false;
    window._db  = null;
  }
}

// ── SAVE REPORT ───────────────────────────────────────────────
// path: 'evidence' | 'reports' | 'tips'
async function saveReport(path, data) {
  const uid     = window._auth?.firebaseAuth?.currentUser?.uid || null;
  const refCode = _generateRefCode(path);
  const payload = { ...data, status: 'received', uid, referenceId: refCode };

  if (!isRTDBReady || !window._db) return { id: refCode };  // demo fallback

  const newRef = await window._db.pushNew(path, payload);

  // Cross-index under users node for dashboard queries
  if (uid) {
    await window._db.patch(`users/${uid}/reports/${newRef.key}`, {
      path, status: 'received', referenceId: refCode, createdAt: Date.now()
    });
    const count = await window._db.read(`users/${uid}/reportCount`);
    await window._db.patch(`users/${uid}`, { reportCount: (count || 0) + 1 });
  }

  return { id: refCode, key: newRef.key };
}

function _generateRefCode(path) {
  const map = { evidence: 'EV', reports: 'RP', tips: 'TP' };
  return `${map[path] || 'REF'}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// ── GET REPORT STATUS ─────────────────────────────────────────
// Searches all three collections for a matching referenceId
async function getReportStatus(refId) {
  if (!isRTDBReady || !window._db) return _getDemoStatus(refId);
  try {
    for (const path of ['evidence', 'reports', 'tips']) {
      const all   = await window._db.readAll(path);
      const match = Object.entries(all).find(([, v]) => v.referenceId === refId);
      if (match) return { found: true, path, id: match[0], ...match[1] };
    }
    return { found: false };
  } catch {
    return { found: false };
  }
}

function _getDemoStatus(refId) {
  return {
    found: true, path: 'reports', referenceId: refId,
    status: 'under_review', createdAt: Date.now() - 3600000,
    incidentType: 'harassment', platform: 'instagram', isAnonymous: true
  };
}

// ── CLOUDINARY UPLOAD ─────────────────────────────────────────
// file       — File object from <input type=file> or drag-and-drop
// onProgress — optional callback(percent: 0-100)
// Returns    — { url, publicId, format, bytes, resourceType, thumbnail }
async function uploadToCloudinary(file, onProgress) {

  // Demo / preset-not-yet-set fallback
  if (CLOUDINARY_CONFIG.uploadPreset === 'YOUR_UNSIGNED_PRESET_NAME') {
    return new Promise(resolve => {
      let pct = 0;
      const iv = setInterval(() => {
        pct = Math.min(pct + 20, 100);
        if (onProgress) onProgress(pct);
        if (pct === 100) {
          clearInterval(iv);
          resolve({
            url:          'demo://' + file.name,
            publicId:     'demo/' + file.name,
            format:       file.type.split('/')[1] || 'file',
            bytes:        file.size,
            resourceType: file.type.startsWith('video/') ? 'video' : 'image',
            thumbnail:    'demo://' + file.name
          });
        }
      }, 200);
    });
  }

  // Route videos to the video endpoint; images to the default upload endpoint
  const isVideo  = file.type.startsWith('video/');
  const endpoint = isVideo
    ? CLOUDINARY_CONFIG.videoUploadUrl()
    : CLOUDINARY_CONFIG.uploadUrl();

  const fd = new FormData();
  fd.append('file',          file);
  fd.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  fd.append('folder',        CLOUDINARY_CONFIG.folder);
  fd.append('tags',          'unsilenced,Cyberbullying'); // matches your Cloudinary key name

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);

    // Live upload-progress callback
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const r = JSON.parse(xhr.responseText);
        resolve({
          url:          r.secure_url,
          publicId:     r.public_id,
          format:       r.format,
          bytes:        r.bytes,
          resourceType: r.resource_type,
          thumbnail:    isVideo
            ? `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/video/upload/w_200,h_200,c_thumb/${r.public_id}.jpg`
            : CLOUDINARY_CONFIG.thumb(r.public_id)
        });
      } else {
        reject(new Error(`Cloudinary upload failed: HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
    xhr.send(fd);
  });
}

// ── BOOT ──────────────────────────────────────────────────────
initFirebase();