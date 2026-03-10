// ============================================================
//  UNSILENCED — Main App (Firebase Realtime DB integrated)
// ============================================================

// ── TOAST ────────────────────────────────────────────────────
function showToast(message, type, duration) {
  type     = type || 'success';
  duration = duration || 4000;
  let box = document.querySelector('.toast-container');
  if (!box) { box = document.createElement('div'); box.className = 'toast-container'; document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  t.innerHTML = '<span style="font-size:1.1rem;flex-shrink:0">' + (icons[type]||'ℹ') + '</span><span>' + message + '</span>';
  box.appendChild(t);
  setTimeout(() => t.remove(), duration + 400);
}

// ── NAV SCROLL ───────────────────────────────────────────────
const nav = document.getElementById('navbar');
window.addEventListener('scroll', () => nav && nav.classList.toggle('scrolled', window.scrollY > 50));

// ── SCROLL REVEAL ────────────────────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('up'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── BAR ANIMATION ────────────────────────────────────────────
setTimeout(() => { document.querySelectorAll('.vis-bar-fill').forEach(b => { b.style.width = b.dataset.width + '%'; }); }, 900);

// ── COUNTER ANIMATION ────────────────────────────────────────
function animateCount(id, target, dur) {
  dur = dur || 1600;
  const el = document.getElementById(id);
  if (!el) return;
  let s = 0; const step = target / (dur / 16);
  const t = setInterval(() => { s = Math.min(s + step, target); el.textContent = Math.floor(s); if (s >= target) clearInterval(t); }, 16);
}
const statsObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { animateCount('c1',59); animateCount('c2',7); animateCount('c3',70); animateCount('c4',88); statsObs.disconnect(); } });
}, { threshold: 0.4 });
const statsEl = document.getElementById('stats');
if (statsEl) statsObs.observe(statsEl);

// ── REPORT TABS ──────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.report-content').forEach(c => c.classList.remove('active'));
  const btn = document.querySelector('[onclick="switchTab(\''+tabName+'\')"]');
  if (btn) btn.classList.add('active');
  const panel = document.getElementById(tabName + '-tab');
  if (panel) panel.classList.add('active');
}

// ── FILE UPLOAD ──────────────────────────────────────────────
const uploadZone = document.getElementById('uploadZone');
const fileInput  = document.getElementById('fileInput');
let uploadedFiles = [];
let uploadedUrls  = [];

uploadZone?.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragging'); });
uploadZone?.addEventListener('dragleave', () => uploadZone.classList.remove('dragging'));
uploadZone?.addEventListener('drop', e => {
  e.preventDefault(); uploadZone.classList.remove('dragging');
  handleFiles(Array.from(e.dataTransfer.files));
});

function handleFileSelect(event) { handleFiles(Array.from(event.target.files)); }

function handleFiles(files) {
  files.forEach(file => {
    if (file.size > 10 * 1024 * 1024) { showToast('File too large — max 10MB.', 'error'); return; }
    uploadedFiles.push(file);
    const item = document.createElement('div');
    item.className = 'uploaded-file';
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img'); img.src = URL.createObjectURL(file); item.appendChild(img);
    } else { item.innerHTML = '<span>📄</span>'; }
    const nameEl = document.createElement('span');
    nameEl.textContent = file.name.length > 20 ? file.name.substring(0,20)+'...' : file.name;
    item.appendChild(nameEl);
    const pw = document.createElement('div'); pw.className = 'upload-progress-wrap';
    pw.innerHTML = '<div class="upload-progress-bar"><div class="upload-progress-fill"></div></div><div class="upload-progress-label">Uploading…</div>';
    item.appendChild(pw);
    const rb = document.createElement('button'); rb.className = 'remove-file'; rb.innerHTML = '×';
    rb.onclick = () => { uploadedFiles = uploadedFiles.filter(f => f !== file); item.remove(); };
    item.appendChild(rb);
    (document.getElementById('uploadedFiles') || document.querySelector('.uploaded-files-grid'))?.appendChild(item);
    uploadToCloudinary(file, pct => {
      const bar = item.querySelector('.upload-progress-fill');
      const lbl = item.querySelector('.upload-progress-label');
      if (bar) bar.style.width = pct + '%';
      if (lbl) lbl.textContent = pct < 100 ? 'Uploading… ' + pct + '%' : '✓ Uploaded';
    }).then(result => {
      uploadedUrls.push(result);
      const lbl = item.querySelector('.upload-progress-label');
      if (lbl) lbl.textContent = result.url.startsWith('demo://') ? '📦 Demo mode — file noted' : '✓ Stored securely';
    }).catch(() => {
      const lbl = item.querySelector('.upload-progress-label');
      if (lbl) lbl.textContent = '⚠ Upload failed — will note filename';
    });
  });
}

// ── FORM HELPERS ──────────────────────────────────────────────
function getLoggedInUID() {
  return window._auth?.firebaseAuth?.currentUser?.uid || null;
}
function getLoggedInName() {
  return window._auth?.firebaseAuth?.currentUser?.displayName || null;
}

// ── FORM: UPLOAD EVIDENCE ─────────────────────────────────────
document.getElementById('uploadForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('.submit-btn');
  btn.classList.add('loading'); btn.disabled = true;
  try {
    const result = await saveReport('evidence', {
      type: 'evidence',
      description: document.getElementById('uploadDesc').value,
      isAnonymous: document.getElementById('uploadAnon').checked,
      files: uploadedUrls,  // full Cloudinary objects: { url, publicId, thumbnail, format, bytes, resourceType }
      fileCount: uploadedFiles.length,
      uid: getLoggedInUID()
    });
    document.getElementById('uploadRefId').textContent = result.id;
    document.getElementById('uploadSuccess').classList.add('show');
    e.target.style.display = 'none';
    showToast('Evidence submitted! Reference ID: ' + result.id, 'success', 6000);
    uploadedFiles = []; uploadedUrls = [];
  } catch (err) {
    document.querySelector('#upload-tab .error-message')?.classList.add('show');
    showToast('Submission failed. Please try again.', 'error');
  } finally { btn.classList.remove('loading'); btn.disabled = false; }
});

// ── FORM: REPORT INCIDENT ─────────────────────────────────────
document.getElementById('reportForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('.submit-btn');
  btn.classList.add('loading'); btn.disabled = true;
  try {
    const result = await saveReport('reports', {
      type: 'incident_report',
      incidentType: document.getElementById('incidentType').value,
      platform: document.getElementById('platform').value,
      description: document.getElementById('reportDesc').value,
      contactEmail: document.getElementById('contactEmail')?.value || null,
      isAnonymous: document.getElementById('reportAnon').checked,
      uid: getLoggedInUID()
    });
    document.getElementById('reportRefId').textContent = result.id;
    document.getElementById('reportSuccess').classList.add('show');
    e.target.style.display = 'none';
    showToast('Report submitted! Reference ID: ' + result.id, 'success', 6000);
  } catch (err) {
    document.querySelector('#report-tab .error-message')?.classList.add('show');
    showToast('Submission failed. Please try again.', 'error');
  } finally { btn.classList.remove('loading'); btn.disabled = false; }
});

// ── FORM: ANONYMOUS TIP ───────────────────────────────────────
document.getElementById('tipForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('.submit-btn');
  btn.classList.add('loading'); btn.disabled = true;
  try {
    const result = await saveReport('tips', {
      type: 'anonymous_tip',
      description: document.getElementById('tipDesc').value,
      urgency: document.getElementById('urgency').value,
      isAnonymous: true,
      uid: null
    });
    document.getElementById('tipRefId').textContent = result.id;
    document.getElementById('tipSuccess').classList.add('show');
    e.target.style.display = 'none';
    showToast('Tip received! Reference ID: ' + result.id, 'success', 6000);
  } catch (err) {
    document.querySelector('#anonymous-tab .error-message')?.classList.add('show');
    showToast('Submission failed. Please try again.', 'error');
  } finally { btn.classList.remove('loading'); btn.disabled = false; }
});

// ── STATUS TRACKER ────────────────────────────────────────────
async function checkStatus() {
  const input = document.getElementById('statusRefInput');
  const refId = input?.value.trim();
  if (!refId) { showToast('Please enter a Reference ID.', 'error'); return; }
  const resultEl = document.getElementById('statusResult');
  resultEl.classList.remove('show');
  resultEl.innerHTML = '<p style="color:var(--muted);font-size:0.9rem;text-align:center;padding:1rem">🔍 Searching…</p>';
  resultEl.classList.add('show');
  const data = await getReportStatus(refId);
  if (!data.found) {
    resultEl.innerHTML = '<p style="color:var(--red);font-weight:700;margin-bottom:0.5rem">Reference ID not found.</p><p style="color:var(--muted);font-size:0.9rem">Double-check the ID. IDs are case-sensitive.</p>';
    return;
  }
  const statusMap = {
    received:     { label: 'Received',                 step: 1, color: 'var(--orange)' },
    under_review: { label: 'Under Review',             step: 2, color: 'var(--orange)' },
    escalated:    { label: 'Escalated to Authorities', step: 3, color: 'var(--red)'    },
    resolved:     { label: 'Resolved',                 step: 4, color: 'var(--green)'  }
  };
  const cur = statusMap[data.status] || statusMap['received'];
  const created = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    : 'Recently';
  const steps = [
    { label:'Report Received',          sub:'Submitted on ' + created },
    { label:'Under Review',             sub:'Our team is reviewing your report' },
    { label:'Escalated to Authorities', sub:'Referred to appropriate authorities' },
    { label:'Resolved',                 sub:'Action has been taken' }
  ];
  resultEl.innerHTML = '<div style="margin-bottom:1.2rem;padding-bottom:1rem;border-bottom:1px solid var(--border)">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem">' +
    '<span style="font-size:0.75rem;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Ref: ' + refId + '</span>' +
    '<span style="padding:0.3rem 0.9rem;background:' + cur.color + '22;color:' + cur.color + ';border-radius:100px;font-size:0.78rem;font-weight:800">' + cur.label + '</span>' +
    '</div></div>' +
    '<ul class="status-timeline">' +
    steps.map((s,i) =>
      '<li>' +
      '<div class="timeline-dot ' + (i < cur.step ? 'done' : i === cur.step-1 ? 'active' : '') + '"></div>' +
      '<div class="timeline-text">' +
      '<div class="timeline-title">' + s.label + '</div>' +
      '<div class="timeline-sub">' + (i < cur.step ? s.sub : i === cur.step-1 ? '⏳ '+s.sub : 'Pending') + '</div>' +
      '</div></li>'
    ).join('') + '</ul>';
}

// ── PLEDGE ────────────────────────────────────────────────────
let pledgeCount = 12847;
async function submitPledge() {
  const inp  = document.getElementById('pledgeName');
  const name = inp?.value.trim();
  if (!name) { inp.style.outline = '2px solid rgba(232,40,30,0.6)'; return; }

  // Save to RTDB
  if (window._db) {
    try {
      await window._db.pushNew('pledges', {
        name,
        uid: getLoggedInUID(),
        timestamp: Date.now()
      });
      // Increment counter
      const snap = await window._db.read('meta/pledgeCount');
      const newCount = (snap || 12847) + 1;
      await window._db.setPrimitive('meta/pledgeCount', newCount);
      pledgeCount = newCount;
    } catch(e) { pledgeCount++; }
  } else { pledgeCount++; }

  const _pEls = [document.getElementById('pledgeCounter'), document.getElementById('pledgeCounterBig')];
  _pEls.forEach(el => { if (el) el.textContent = pledgeCount.toLocaleString('en-IN'); });
  const chip = document.createElement('span');
  chip.className = 'pledge-chip';
  chip.textContent = name;
  chip.style.cssText = 'background:rgba(232,40,30,0.2);border-color:rgba(232,40,30,0.4);color:#ffb3b0;';
  document.getElementById('pledgeNames').appendChild(chip);
  document.getElementById('pledge-form-wrap').style.display = 'none';
  const thanks = document.getElementById('pledge-thanks');
  thanks.classList.add('show');
  document.getElementById('thanks-msg').innerHTML =
    '✓ Thank you, <strong style="color:white">' + name + '</strong>! Your voice is part of this movement.';
}
document.getElementById('pledgeName')?.addEventListener('keydown', e => { if (e.key==='Enter') submitPledge(); });

// ── FAQ ───────────────────────────────────────────────────────
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ── CHAT ──────────────────────────────────────────────────────
let chatOpen = false;
const chatWindow   = document.getElementById('chatWindow');
const chatBubble   = document.getElementById('chatBubble');
const chatMessages = document.getElementById('chatMessages');
const chatInput    = document.getElementById('chatInput');
const typingInd    = document.getElementById('typingIndicator');

function toggleChat() {
  chatOpen = !chatOpen;
  chatWindow?.classList.toggle('show', chatOpen);
  if (chatBubble) chatBubble.style.display = chatOpen ? 'none' : 'flex';
  if (chatOpen && chatInput) chatInput.focus();
}
function useQuickChip(text) { if (chatInput) chatInput.value = text; sendMessage(); }
function handleChatKeypress(e) { if (e.key === 'Enter') sendMessage(); }
function addChatMessage(text, isUser) {
  isUser = isUser || false;
  const now = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  const msg = document.createElement('div');
  msg.className = 'chat-message' + (isUser?' user':'');
  msg.innerHTML = '<div class="chat-avatar">' + (isUser?'👤':'🛡️') + '</div>' +
    '<div><div class="chat-message-content">' + text + '</div><div class="chat-message-time">' + now + '</div></div>';
  chatMessages?.appendChild(msg);
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
}
const SUPPORT_RESPONSES = [
  { keywords:['help','scared','afraid','don\'t know','what do i do'], response:"You're very brave for reaching out. If you're in immediate danger, call <strong>1930</strong> now. Would you like to start a report?" },
  { keywords:['report','evidence','screenshot','proof'], response:"You can upload screenshots anonymously using our <strong>Report Now</strong> form above. Your identity is fully protected." },
  { keywords:['parent','tell','adult','teacher','school'], response:"Telling a trusted adult is often the best first step. If you're not ready, call <strong>iCall: 9152987821</strong> — free and confidential." },
  { keywords:['suicide','kill','die','end it','can\'t go on','hopeless'], response:"I'm very concerned about you. Please call <strong>Vandrevala Foundation: 1860-2662-345</strong> or <strong>iCall: 9152987821</strong> right now. You matter. 💙" },
  { keywords:['block','platform','instagram','snapchat','tiktok','whatsapp','discord'], response:"Blocking is a great first step. Check our <strong>Platform Guide</strong> section below for exact steps on every app." },
  { keywords:['anonymous','private','identity','safe'], response:"All reports are completely anonymous by default. No IP address is stored. No account is required to report." },
  { keywords:['status','reference','id','check','update'], response:"Use your Reference ID in the <strong>Track Your Report</strong> section. Scroll down from the report form." }
];
function sendMessage() {
  const message = chatInput?.value.trim();
  if (!message) return;
  addChatMessage(message, true);
  chatInput.value = '';
  if (typingInd) { typingInd.classList.add('show'); if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight; }
  setTimeout(() => {
    if (typingInd) typingInd.classList.remove('show');
    const lower = message.toLowerCase();
    let response = null;
    for (const item of SUPPORT_RESPONSES) {
      if (item.keywords.some(k => lower.includes(k))) { response = item.response; break; }
    }
    if (!response) response = "I\'m here to support you. Ask me about <strong>reporting</strong>, <strong>resources</strong>, or <strong>what to do</strong>.";
    addChatMessage(response);
  }, 1200 + Math.random() * 600);
}