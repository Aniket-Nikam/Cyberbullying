// ============================================================
//  UNSILENCED — Firebase + Cloudinary Configuration
//  Firebase Project  : cyberbullying-b861d
//  Cloudinary Cloud  : delwuljga
//  Upload Preset     : ml_default  (must be Unsigned in dashboard)
//  Folder            : unsilenced-evidence
// ============================================================

// ── FIREBASE CONFIG ───────────────────────────────────────────
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
//  Upload Preset: ml_default (must be set to Unsigned in Cloudinary dashboard)
//  Cloud: delwuljga | API Key: 512793948514589
//  ⚠️  In Cloudinary: Settings → Upload → Upload Presets → ml_default → set Signing Mode to Unsigned
const CLOUD_NAME    = 'delwuljga';
const UPLOAD_PRESET = 'ml_default';
const UPLOAD_FOLDER = 'unsilenced-evidence';

// URL builder — matches Cloudinary SDK c_fill pattern from official docs
const cld = {
  cloudName: CLOUD_NAME,
  thumb(publicId, w, h) {
    w = w || 200; h = h || 200;
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,w_${w},h_${h},q_auto,f_auto/${publicId}`;
  },
  full(publicId) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto/${publicId}`;
  },
  adminThumb(publicId, w, h) {
    w = w || 120; h = h || 90;
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,w_${w},h_${h},q_auto,f_auto/${publicId}`;
  },
  videoThumb(publicId, w, h) {
    w = w || 200; h = h || 200;
    return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/c_fill,w_${w},h_${h},q_auto/${publicId}.jpg`;
  },
  uploadUrl()      { return `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`; }, // auto = handles any file type
  videoUploadUrl() { return `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`; }  // auto handles video too
};
const CLOUDINARY_CONFIG = cld; // alias for backwards compat

// ── FIREBASE STATE ────────────────────────────────────────────
let firebaseApp = null;
let firebaseDB  = null;
let isRTDBReady = false;

// ── FIREBASE INIT ─────────────────────────────────────────────
async function initFirebase() {
  try {
    const { initializeApp, getApps } = await import(
      'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'
    );
    const { getDatabase, ref, set, push, get, update } = await import(
      'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js'
    );

    firebaseApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    firebaseDB  = getDatabase(firebaseApp);
    isRTDBReady = true;

    window._db = {
      db: firebaseDB,
      ref, set, push, get, update,

      pushNew: (path, data) =>
        push(ref(firebaseDB, path), { ...data, createdAt: Date.now() }),

      // CRITICAL: Primitives (numbers) must NOT be wrapped in an object
      write: (path, data) => {
        if (data !== null && typeof data === 'object') {
          return set(ref(firebaseDB, path), { ...data, updatedAt: Date.now() });
        }
        return set(ref(firebaseDB, path), data);
      },

      // Explicit primitive write — use for counters/flags
      setPrimitive: (path, value) => set(ref(firebaseDB, path), value),

      // Increment counter to a new absolute value (for pledge count)
      increment_to: (path, newValue) => set(ref(firebaseDB, path), newValue),

      // Atomic increment by 1
      increment: async (path) => {
        const current = await window._db.read(path);
        const next = (typeof current === 'number' ? current : 0) + 1;
        await set(ref(firebaseDB, path), next);
        return next;
      },

      read: async (path) => {
        const snap = await get(ref(firebaseDB, path));
        return snap.exists() ? snap.val() : null;
      },

      readAll: async (path) => {
        const snap = await get(ref(firebaseDB, path));
        return snap.exists() ? snap.val() : {};
      },

      patch: (path, data) => update(ref(firebaseDB, path), data),

      saveQuizResult: async (uid, score, total, tier) => {
        const percentage = Math.round((score / total) * 100);
        await window._db.pushNew('quiz_results', {
          uid: uid || null, score, total, percentage, tier
        });
        if (uid) {
          const best = await window._db.read(`users/${uid}/quizBestScore`);
          if (best === null || score > best) {
            await window._db.patch(`users/${uid}`, { quizBestScore: score });
          }
        }
      },

      saveSafetyPlan: async (uid, planData) => {
        if (!uid) return;
        await window._db.patch(`users/${uid}/safetyPlan`, {
          ...planData, savedAt: Date.now()
        });
      },

      likeStory: async (storyId) => {
        const current = await window._db.read(`stories/${storyId}/likes`);
        const next = (typeof current === 'number' ? current : 0) + 1;
        await set(ref(firebaseDB, `stories/${storyId}/likes`), next);
        return next;
      },

      submitStory: (tag, text, author, location, uid) =>
        window._db.pushNew('stories', {
          tag, text, author, location,
          uid: uid || null, likes: 0, approved: false
        })
    };

    // Hydrate pledge counter
    const pledgeSnap = await get(ref(firebaseDB, 'meta/pledgeCount'));
    if (pledgeSnap.exists()) {
      const count = Number(pledgeSnap.val());
      ['pledgeCounter', 'pledgeCounterBig'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = count.toLocaleString('en-IN');
      });
    }

    console.log('%c✅ UNSILENCED Firebase + Cloudinary Ready', 'color:#e8281e;font-weight:bold;font-size:14px');
  } catch (err) {
    console.warn('Firebase init failed — demo mode:', err.message);
    isRTDBReady = false;
    window._db  = null;
  }
}

// ── SAVE REPORT ───────────────────────────────────────────────
async function saveReport(path, data) {
  const uid     = window._auth?.firebaseAuth?.currentUser?.uid || null;
  const refCode = _generateRefCode(path);
  const payload = { ...data, status: 'received', uid, referenceId: refCode };
  if (!isRTDBReady || !window._db) return { id: refCode };
  try {
    const newRef = await window._db.pushNew(path, payload);
    if (uid) {
      await window._db.patch(`users/${uid}/reports/${newRef.key}`, {
        path, status: 'received', referenceId: refCode, createdAt: Date.now()
      });
      const count = await window._db.read(`users/${uid}/reportCount`);
      await window._db.patch(`users/${uid}`, { reportCount: (count || 0) + 1 });
    }
    return { id: refCode, key: newRef.key };
  } catch (err) {
    console.error('saveReport error:', err);
    return { id: refCode };
  }
}

function _generateRefCode(path) {
  const map = { evidence: 'EV', reports: 'RP', tips: 'TP' };
  return `${map[path] || 'REF'}-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function getReportStatus(refId) {
  if (!isRTDBReady || !window._db) return _getDemoStatus(refId);
  try {
    for (const path of ['evidence', 'reports', 'tips']) {
      const all   = await window._db.readAll(path);
      const match = Object.entries(all).find(([, v]) => v.referenceId === refId);
      if (match) return { found: true, path, id: match[0], ...match[1] };
    }
    return { found: false };
  } catch { return { found: false }; }
}

function _getDemoStatus(refId) {
  return {
    found: true, path: 'reports', referenceId: refId,
    status: 'under_review', createdAt: Date.now() - 3600000,
    incidentType: 'harassment', platform: 'instagram', isAnonymous: true
  };
}

// ── CLOUDINARY UPLOAD ─────────────────────────────────────────
//  Unsigned upload — POST to /v1_1/{cloud}/image/upload with upload_preset
//  Returns full object including publicId for building delivery URLs with cld.*
async function uploadToCloudinary(file, onProgress) {
  const isVideo = file.type.startsWith('video/');
  // Always use /auto/upload — Cloudinary detects image/video/raw automatically.
  // Using /image/upload for non-images returns HTTP 400 "Invalid image file".
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  const fd = new FormData();
  fd.append('file',          file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder',        UPLOAD_FOLDER);
  fd.append('tags',          'unsilenced,cyberbullying');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);

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
          publicId:     r.public_id,             // store this — used by cld.thumb / cld.full
          format:       r.format,
          bytes:        r.bytes,
          width:        r.width  || null,
          height:       r.height || null,
          resourceType: r.resource_type,         // 'image' | 'video' | 'raw'
          thumbnail:    isVideo
            ? cld.videoThumb(r.public_id, 200, 200)
            : cld.thumb(r.public_id, 200, 200),  // built with c_fill per SDK docs
          uploadedAt:   Date.now()
        });
      } else {
        let msg = `Upload failed (HTTP ${xhr.status})`;
        let raw = xhr.responseText;
        try {
          const parsed = JSON.parse(raw);
          msg = parsed.error?.message || msg;
          // Common causes:
          // "Upload preset not found" → preset name wrong or not created yet
          // "Invalid image file"      → use /auto/upload instead of /image/upload
          // "Must supply api_key"     → preset is Signed, not Unsigned
        } catch {}
        console.error('Cloudinary upload error:', msg, '| Response:', raw);
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.send(fd);
  });
}

// ── EVIDENCE GALLERY RENDERER ─────────────────────────────────
//  Accepts array of file objects (from Firebase evidence.files[])
//  Each object must have: { publicId, url, resourceType, format, bytes, thumbnail }
//  Works in both public user dashboard AND admin panel
function renderEvidenceGallery(filesArray, containerEl) {
  if (!containerEl || !filesArray || !filesArray.length) {
    if (containerEl) containerEl.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;padding:0.5rem">No files attached.</p>';
    return;
  }
  containerEl.innerHTML = '';

  filesArray.forEach(file => {
    if (!file) return;
    const wrap = document.createElement('div');
    wrap.className = 'evidence-gallery-item';

    if (file.resourceType === 'video') {
      wrap.innerHTML = `
        <video src="${file.url}" controls preload="metadata"
          style="width:100%;border-radius:8px;max-height:180px;background:#000;display:block"></video>
        <div class="eg-meta">${(file.format || 'VIDEO').toUpperCase()} · ${_formatBytes(file.bytes)}</div>`;
    } else {
      // Use publicId with cld.thumb for the thumbnail, cld.full for the link
      const thumbSrc = file.publicId ? cld.thumb(file.publicId, 280, 200) : (file.thumbnail || file.url);
      const fullSrc  = file.publicId ? cld.full(file.publicId) : file.url;
      wrap.innerHTML = `
        <a href="${fullSrc}" target="_blank" rel="noopener noreferrer">
          <img src="${thumbSrc}" alt="Evidence file" loading="lazy"
            style="width:100%;border-radius:8px;height:180px;object-fit:cover;display:block;cursor:zoom-in"
            onerror="this.style.display='none';this.parentElement.innerHTML='<div style=&quot;height:100px;display:flex;align-items:center;justify-content:center;font-size:2rem&quot;>📄</div>'"
          />
        </a>
        <div class="eg-meta">${(file.format || 'IMG').toUpperCase()} · ${_formatBytes(file.bytes)}</div>`;
    }
    containerEl.appendChild(wrap);
  });
}

function _formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)    return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// ── BOOT ──────────────────────────────────────────────────────
initFirebase();

window.cld                   = cld;
window.CLOUDINARY_CONFIG     = cld;
window.uploadToCloudinary    = uploadToCloudinary;
window.renderEvidenceGallery = renderEvidenceGallery;
window.saveReport            = saveReport;
window.getReportStatus       = getReportStatus;