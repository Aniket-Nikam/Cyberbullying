// ============================================================
//  UNSILENCED — Authentication (Firebase Auth + Realtime DB)
// ============================================================

let authUser        = null;
let authUserProfile = null;
let firebaseAuth    = null;
let signupStep      = 1;
let selectedRole    = '';
let selectedAge     = '';

// ── INIT AUTH ────────────────────────────────────────────────
async function initAuth() {
  try {
    const { getAuth, onAuthStateChanged } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
    );
    const { getApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    firebaseAuth = getAuth(getApp());
    window._auth = { firebaseAuth };

    onAuthStateChanged(firebaseAuth, async (user) => {
      authUser = user;
      if (user) {
        await loadUserProfile(user.uid);
        renderNavLoggedIn(user);
        if (!user.emailVerified) showVerifyBanner();
        else hideVerifyBanner();
      } else {
        authUserProfile = null;
        renderNavGuest();
        hideVerifyBanner();
      }
    });
    console.log("Auth ready");
  } catch (err) {
    console.warn("Auth init failed:", err.message);
  }
}

// ── USER PROFILE (Realtime DB) ───────────────────────────────
async function loadUserProfile(uid) {
  if (!window._db) return;
  try {
    const val = await window._db.read("users/" + uid);
    if (val) authUserProfile = val;
  } catch(e) {}
}

async function createUserProfile(uid, data) {
  if (!window._db) return;
  await window._db.write("users/" + uid, {
    ...data, uid, createdAt: Date.now(), reportCount: 0
  });
}

// ── MODAL OPEN/CLOSE ─────────────────────────────────────────
function openAuthModal(mode) {
  mode = mode || 'login';
  document.getElementById('auth-overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
  if (mode === 'signup') showSignupView();
  else showLoginView();
}

function closeAuthModal() {
  document.getElementById('auth-overlay').classList.remove('show');
  document.body.style.overflow = '';
  resetAuthForms();
}

function resetAuthForms() {
  ['signup-email','signup-password','signup-confirm',
   'signup-name','signup-city','login-email','login-password','forgot-email']
    .forEach(id => { const el = document.getElementById(id); if (el) { el.value=''; el.classList.remove('valid','invalid'); } });
  selectedRole = ''; selectedAge = '';
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.age-option').forEach(c => c.classList.remove('selected'));
  signupStep = 1;
  updateSignupSteps();
  const s1 = document.getElementById('signup-step-1');
  const s2 = document.getElementById('signup-step-2');
  if (s1) s1.style.display = 'block';
  if (s2) s2.style.display = 'none';
  document.getElementById('auth-success').classList.remove('show');
  ['signup-alert','signup-alert-2','login-alert','forgot-alert'].forEach(hideAuthAlert);
  const sw = document.getElementById('strength-wrap');
  if (sw) { sw.className = 'password-strength'; }
}

function showLoginView() {
  document.getElementById('auth-login-panel').style.display  = 'block';
  document.getElementById('auth-signup-panel').style.display = 'none';
  document.getElementById('auth-forgot-panel').style.display = 'none';
  document.getElementById('auth-success').classList.remove('show');
}
function showSignupView() {
  document.getElementById('auth-login-panel').style.display  = 'none';
  document.getElementById('auth-signup-panel').style.display = 'block';
  document.getElementById('auth-forgot-panel').style.display = 'none';
  document.getElementById('auth-success').classList.remove('show');
}
function showForgotView() {
  document.getElementById('auth-login-panel').style.display  = 'none';
  document.getElementById('auth-signup-panel').style.display = 'none';
  document.getElementById('auth-forgot-panel').style.display = 'block';
}

// ── SIGNUP STEPS ─────────────────────────────────────────────
function updateSignupSteps() {
  document.querySelectorAll('.auth-step-dot').forEach((d, i) => {
    d.classList.toggle('active', i + 1 === signupStep);
    d.classList.toggle('done',   i + 1 < signupStep);
    d.textContent = i + 1 < signupStep ? '✓' : i + 1;
  });
  document.querySelectorAll('.auth-step-line').forEach((l, i) =>
    l.classList.toggle('done', i + 1 < signupStep));
  document.querySelectorAll('.auth-step-label-item').forEach((l, i) => {
    l.classList.toggle('active', i + 1 === signupStep);
    l.classList.toggle('done',   i + 1 < signupStep);
  });
}

function signupNextStep() {
  const email   = document.getElementById('signup-email').value.trim();
  const pass    = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;
  if (!email || !isValidEmail(email))  { showAuthAlert('signup-alert','error','Please enter a valid email.'); return; }
  if (pass.length < 8)                 { showAuthAlert('signup-alert','error','Password must be at least 8 characters.'); return; }
  if (pass !== confirm)                { showAuthAlert('signup-alert','error','Passwords do not match.'); return; }
  hideAuthAlert('signup-alert');
  signupStep = 2;
  updateSignupSteps();
  document.getElementById('signup-step-1').style.display = 'none';
  document.getElementById('signup-step-2').style.display = 'block';
}

function signupPrevStep() {
  signupStep = 1;
  updateSignupSteps();
  document.getElementById('signup-step-1').style.display = 'block';
  document.getElementById('signup-step-2').style.display = 'none';
}

function selectRole(role, el) {
  selectedRole = role;
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}
function selectAge(age, el) {
  selectedAge = age;
  document.querySelectorAll('.age-option').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

function updatePasswordStrength(val) {
  const wrap  = document.getElementById('strength-wrap');
  const fill  = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  if (!wrap) return;
  if (!val) { wrap.className = 'password-strength'; fill.style.width='0'; label.textContent=''; return; }
  const strong = val.length>=10 && /[A-Z]/.test(val) && /[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val);
  const medium = val.length>=8  && (/[A-Z]/.test(val) || /[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val));
  const tier   = strong ? 'strong' : medium ? 'medium' : 'weak';
  wrap.className  = 'password-strength strength-' + tier;
  label.textContent = tier==='strong' ? '✓ Strong password' : tier==='medium' ? 'Medium — could be stronger' : 'Weak — add numbers & symbols';
}

// ── HELPERS ──────────────────────────────────────────────────
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function showAuthAlert(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'auth-alert ' + type + ' show';
  el.innerHTML = '<span>' + (type==='error'?'⚠':type==='success'?'✓':'ℹ') + '</span><span>' + msg + '</span>';
}
function hideAuthAlert(id) { document.getElementById(id) && document.getElementById(id).classList.remove('show'); }

function setAuthLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

function friendlyError(code) {
  const m = {
    'auth/email-already-in-use':   'An account with this email already exists. Try logging in.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/weak-password':          'Password too weak. Use at least 8 characters.',
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/too-many-requests':      'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-credential':     'Incorrect email or password.'
  };
  return m[code] || 'Something went wrong. Please try again.';
}

// ── SIGN UP ───────────────────────────────────────────────────
async function submitSignup() {
  const name  = document.getElementById('signup-name').value.trim();
  const city  = document.getElementById('signup-city').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass  = document.getElementById('signup-password').value;
  if (!name)         { showAuthAlert('signup-alert-2','error','Please enter your name.'); return; }
  if (!selectedRole) { showAuthAlert('signup-alert-2','error','Please select your role.'); return; }
  if (!selectedAge)  { showAuthAlert('signup-alert-2','error','Please select your age group.'); return; }
  if (!document.getElementById('signup-terms').checked) { showAuthAlert('signup-alert-2','error','Please agree to the Terms of Use.'); return; }
  setAuthLoading('signup-submit-btn', true);
  hideAuthAlert('signup-alert-2');
  try {
    const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } =
      await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    await sendEmailVerification(cred.user);
    await createUserProfile(cred.user.uid, {
      name, email, city: city||null, role: selectedRole, ageGroup: selectedAge
    });
    document.getElementById('auth-signup-panel').style.display = 'none';
    document.getElementById('auth-success-name').textContent   = name.split(' ')[0];
    document.getElementById('auth-success').classList.add('show');
    showToast('Account created! Check your inbox for a verification email.', 'success');
  } catch (err) {
    showAuthAlert('signup-alert-2','error', friendlyError(err.code));
  } finally {
    setAuthLoading('signup-submit-btn', false);
  }
}

// ── LOGIN ─────────────────────────────────────────────────────
async function submitLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  if (!email || !isValidEmail(email)) { showAuthAlert('login-alert','error','Please enter a valid email.'); return; }
  if (!pass)                          { showAuthAlert('login-alert','error','Please enter your password.'); return; }
  setAuthLoading('login-submit-btn', true);
  hideAuthAlert('login-alert');
  try {
    const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    await signInWithEmailAndPassword(firebaseAuth, email, pass);
    closeAuthModal();
    showToast('Welcome back! You are signed in.', 'success');
  } catch (err) {
    showAuthAlert('login-alert','error', friendlyError(err.code));
  } finally {
    setAuthLoading('login-submit-btn', false);
  }
}

// ── FORGOT PASSWORD ───────────────────────────────────────────
async function submitForgotPassword() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email || !isValidEmail(email)) { showAuthAlert('forgot-alert','error','Please enter a valid email.'); return; }
  setAuthLoading('forgot-submit-btn', true);
  hideAuthAlert('forgot-alert');
  try {
    const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    await sendPasswordResetEmail(firebaseAuth, email);
    showAuthAlert('forgot-alert','success','Reset link sent to ' + email + '. Check your inbox.');
    document.getElementById('forgot-email').value = '';
  } catch (err) {
    showAuthAlert('forgot-alert','error', friendlyError(err.code));
  } finally {
    setAuthLoading('forgot-submit-btn', false);
  }
}

// ── SIGN OUT ──────────────────────────────────────────────────
async function signOut() {
  try {
    const { signOut: fbOut } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    await fbOut(firebaseAuth);
    showToast('You have been signed out.', 'info');
    window.location.reload();
  } catch { showToast('Sign out failed. Please try again.', 'error'); }
}

// ── NAV STATE ─────────────────────────────────────────────────
function renderNavLoggedIn(user) {
  const gEl = document.getElementById('nav-guest');
  const uEl = document.getElementById('nav-user');
  if (!gEl || !uEl) return;
  const name     = user.displayName || user.email.split('@')[0];
  const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  gEl.style.display = 'none';
  uEl.style.display = 'flex';
  uEl.innerHTML =
    '<a class="nav-avatar-circle" href="dashboard/index.html" title="My Dashboard">' + initials + '</a>' +
    '<a class="nav-user-name" href="dashboard/index.html">' + name.split(' ')[0] + '</a>' +
    '<button class="nav-signout-btn" onclick="signOut()">Sign out</button>';
}
function renderNavGuest() {
  const gEl = document.getElementById('nav-guest');
  const uEl = document.getElementById('nav-user');
  if (!gEl || !uEl) return;
  gEl.style.display = 'flex';
  uEl.style.display = 'none';
}

// ── VERIFY BANNER ─────────────────────────────────────────────
function showVerifyBanner() { document.getElementById('verify-banner')?.classList.add('show'); }
function hideVerifyBanner() { document.getElementById('verify-banner')?.classList.remove('show'); }
async function resendVerification() {
  if (!authUser) return;
  try {
    const { sendEmailVerification } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    await sendEmailVerification(authUser);
    showToast('Verification email sent! Check your inbox.', 'success');
  } catch { showToast('Could not send. Try again in a minute.', 'error'); }
}

// ── PASSWORD TOGGLE ───────────────────────────────────────────
function togglePasswordVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type  = isHidden ? 'text' : 'password';
  btnEl.textContent = isHidden ? '🙈' : '👁';
}

// ── EVENTS ───────────────────────────────────────────────────
document.getElementById('auth-overlay')?.addEventListener('click', function(e) {
  if (e.target === this) closeAuthModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAuthModal();
  if (e.key === 'Enter' && document.getElementById('auth-overlay')?.classList.contains('show')) {
    const lp = document.getElementById('auth-login-panel');
    const fp = document.getElementById('auth-forgot-panel');
    if (lp && lp.style.display !== 'none') submitLogin();
    else if (fp && fp.style.display !== 'none') submitForgotPassword();
  }
});

window.addEventListener('load', () => setTimeout(initAuth, 800));