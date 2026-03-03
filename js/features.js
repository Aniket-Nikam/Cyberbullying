// ============================================================
//  UNSILENCED — New Features JavaScript
// ============================================================

/* ── SOS EMERGENCY BANNER ─────────────────────────────────── */
function showSOSBanner() {
  document.getElementById('sos-banner').classList.add('show');
}
function hideSOSBanner() {
  document.getElementById('sos-banner').classList.remove('show');
  // Show again after 30s if user is still on crisis-related pages
}
function openSOSModal() {
  document.getElementById('sos-modal').classList.add('show');
}
function closeSOSModal() {
  document.getElementById('sos-modal').classList.remove('show');
}
// Show SOS banner when user scrolls to crisis section
const crisisSection = document.getElementById('crisis');
if (crisisSection) {
  const sosObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) showSOSBanner();
    });
  }, { threshold: 0.2 });
  sosObs.observe(crisisSection);
}

/* ── QUIZ ─────────────────────────────────────────────────── */
const QUIZ_QUESTIONS = [
  {
    q: "Which of the following is an example of cyberbullying?",
    options: [
      "Sending a friend a funny meme",
      "Repeatedly sending threatening messages to someone online",
      "Posting your own photo on Instagram",
      "Playing an online multiplayer game"
    ],
    correct: 1,
    feedback: {
      correct: "Correct! Repeatedly sending threatening or hurtful messages is a clear form of cyberbullying. It's intentional and harmful.",
      wrong: "Cyberbullying involves repeated, intentional harm. Threatening messages directed at someone is a textbook example."
    }
  },
  {
    q: "Someone created a fake profile using your photos to spread rumours. What type of cyberbullying is this?",
    options: ["Cyberstalking", "Exclusion", "Impersonation", "Flaming"],
    correct: 2,
    feedback: {
      correct: "Exactly! Impersonation — creating fake profiles using someone's identity — is illegal under the IT Act 2000 in India.",
      wrong: "This is Impersonation — creating a fake identity to harm someone. It's a criminal offence under Section 66C of the IT Act."
    }
  },
  {
    q: "Your classmate tells you they're being bullied in a group chat. What is the BEST first response?",
    options: [
      "Tell them to ignore it, it'll blow over",
      "Screenshot everything and report it together",
      "Join the group chat to see what's happening",
      "Tell everyone at school about it"
    ],
    correct: 1,
    feedback: {
      correct: "Right! Evidence is critical. Helping them document and report is the most effective first action you can take as a bystander.",
      wrong: "The best action is to help document evidence and report it through proper channels. Screenshots are crucial evidence."
    }
  },
  {
    q: "Which helpline number should you call for immediate cybercrime assistance in India?",
    options: ["100", "1930", "112", "9152987821"],
    correct: 1,
    feedback: {
      correct: "1930 is the National Cyber Crime Helpline — available 24/7 for immediate assistance with online crimes.",
      wrong: "The correct number is 1930 — India's dedicated Cyber Crime Helpline. Save it in your contacts."
    }
  },
  {
    q: "Which statement about cyberbullying is TRUE?",
    options: [
      "It only counts if it happens every day for months",
      "Blocking someone online ends all legal consequences for them",
      "A single severe incident of online harassment can qualify as cyberbullying",
      "Anonymous messages cannot be traced by authorities"
    ],
    correct: 2,
    feedback: {
      correct: "Correct! One serious incident — like threats, non-consensual sharing of photos, or doxxing — can qualify as cyberbullying and be prosecuted.",
      wrong: "False. A single severe incident like threatening messages or sharing private photos without consent can legally qualify as cyberbullying."
    }
  },
  {
    q: "What percentage of cyberbullying victims in India never tell an adult?",
    options: ["3 in 10", "5 in 10", "7 in 10", "9 in 10"],
    correct: 2,
    feedback: {
      correct: "Sadly, 7 out of 10 victims stay silent — often from shame or fear. That's why creating safe spaces to speak up matters so much.",
      wrong: "Research shows 7 in 10 victims never report it to an adult — a key reason initiatives like this one exist."
    }
  },
  {
    q: "If you witness cyberbullying happening to someone else, you are a…",
    options: ["Victim", "Bystander", "Perpetrator", "Moderator"],
    correct: 1,
    feedback: {
      correct: "Yes — a bystander. Bystanders have significant power to stop bullying by refusing to engage, reporting, and supporting the target.",
      wrong: "You are a Bystander — and bystanders have real power. Studies show even one person speaking up can stop bullying in over 50% of cases."
    }
  },
  {
    q: "Under which Indian law can cyberbullying involving threats be prosecuted?",
    options: [
      "Motor Vehicles Act",
      "IT Act 2000 + IPC Section 506",
      "Consumer Protection Act",
      "Right to Information Act"
    ],
    correct: 1,
    feedback: {
      correct: "Correct! The IT Act 2000 combined with IPC Section 506 (criminal intimidation) are the primary legal tools against cyberbullying in India.",
      wrong: "Cyberbullying in India can be prosecuted under the IT Act 2000 and IPC Section 506 (criminal intimidation)."
    }
  }
];

let quizState = { current: 0, score: 0, answered: false };

function initQuiz() {
  quizState = { current: 0, score: 0, answered: false };
  renderQuizQuestion();
  document.getElementById('quiz-inner').style.display = 'block';
  document.getElementById('quiz-results').classList.remove('show');
}

function renderQuizQuestion() {
  const q = QUIZ_QUESTIONS[quizState.current];
  const total = QUIZ_QUESTIONS.length;
  const pct = (quizState.current / total) * 100;

  document.getElementById('quiz-progress-fill').style.width = pct + '%';
  document.getElementById('quiz-step-label').textContent = `Question ${quizState.current + 1} of ${total}`;
  document.getElementById('quiz-score-label').textContent = `Score: ${quizState.score}/${total}`;
  document.getElementById('quiz-question-text').textContent = q.q;

  const optWrap = document.getElementById('quiz-options');
  optWrap.innerHTML = q.options.map((opt, i) =>
    `<button class="quiz-option" onclick="answerQuiz(${i})">${opt}</button>`
  ).join('');

  document.getElementById('quiz-feedback').classList.remove('show', 'good', 'bad');
  document.getElementById('quiz-feedback').textContent = '';
  document.getElementById('quiz-next-btn').classList.remove('show');
  quizState.answered = false;
}

function answerQuiz(idx) {
  if (quizState.answered) return;
  quizState.answered = true;

  const q = QUIZ_QUESTIONS[quizState.current];
  const opts = document.querySelectorAll('.quiz-option');

  opts.forEach(btn => btn.setAttribute('disabled', true));
  opts[idx].classList.add(idx === q.correct ? 'correct' : 'wrong');
  if (idx !== q.correct) opts[q.correct].classList.add('reveal-correct');

  const isCorrect = idx === q.correct;
  if (isCorrect) quizState.score++;

  const fb = document.getElementById('quiz-feedback');
  fb.textContent = isCorrect ? '✓ ' + q.feedback.correct : '✗ ' + q.feedback.wrong;
  fb.classList.add('show', isCorrect ? 'good' : 'bad');

  document.getElementById('quiz-next-btn').classList.add('show');
  document.getElementById('quiz-next-btn').textContent =
    quizState.current < QUIZ_QUESTIONS.length - 1 ? 'Next Question →' : 'See My Results →';
}

function nextQuizQuestion() {
  quizState.current++;
  if (quizState.current >= QUIZ_QUESTIONS.length) {
    showQuizResults();
  } else {
    renderQuizQuestion();
  }
}

function showQuizResults() {
  document.getElementById('quiz-inner').style.display = 'none';
  const score = quizState.score;
  const total = QUIZ_QUESTIONS.length;
  const pct = Math.round((score / total) * 100);

  let tier, tierColor, message;
  if (pct >= 85) {
    tier = 'Digital Safety Expert'; tierColor = 'var(--green)';
    message = 'Outstanding! You have a strong understanding of cyberbullying and how to respond. Share your knowledge — you could help someone who needs it.';
  } else if (pct >= 60) {
    tier = 'Safety Aware'; tierColor = 'var(--orange)';
    message = 'Good work! You understand the basics. Review the questions you missed to strengthen your knowledge and be more confident helping others.';
  } else {
    tier = 'Keep Learning'; tierColor = 'var(--red)';
    message = 'Don\'t worry — that\'s why this quiz exists. Read through the explanations and explore our resources section to build your knowledge.';
  }

  document.getElementById('quiz-results-score').textContent = `${score}/${total}`;
  document.getElementById('quiz-results-tier').textContent = tier;
  document.getElementById('quiz-results-tier').style.color = tierColor;
  document.getElementById('quiz-results-message').textContent = message;
  document.getElementById('quiz-progress-fill').style.width = '100%';
  document.getElementById('quiz-results').classList.add('show');
}

/* ── DIGITAL SAFETY SCORE ─────────────────────────────────── */
const SAFETY_CHECKS = [
  { id: 'sc1', text: 'I have two-factor authentication (2FA) enabled on my main accounts', pts: 15 },
  { id: 'sc2', text: 'My social media profiles are set to private or friends-only', pts: 15 },
  { id: 'sc3', text: 'I know how to block and report on every app I use regularly', pts: 10 },
  { id: 'sc4', text: 'I don\'t share my location publicly in posts or stories', pts: 10 },
  { id: 'sc5', text: 'I have a trusted adult I can tell if something goes wrong online', pts: 15 },
  { id: 'sc6', text: 'I know the cybercrime helpline number (1930)', pts: 5 },
  { id: 'sc7', text: 'I use different passwords for different apps/sites', pts: 10 },
  { id: 'sc8', text: 'I think before I post — I ask myself if I\'d be okay with a stranger seeing this', pts: 10 },
  { id: 'sc9', text: 'I never share personal information (address, school name) with strangers online', pts: 10 },
];

function updateSafetyScore() {
  let score = 0;
  SAFETY_CHECKS.forEach(c => {
    const el = document.getElementById(c.id);
    const item = el?.closest('.score-check-item');
    if (el?.checked) {
      score += c.pts;
      item?.classList.add('checked');
    } else {
      item?.classList.remove('checked');
    }
  });

  const fill = document.getElementById('score-fill');
  const numEl = document.getElementById('score-number');
  numEl.textContent = score;

  let color;
  if (score >= 75) color = 'var(--green)';
  else if (score >= 45) color = 'var(--orange)';
  else color = 'var(--red)';

  fill.style.width = score + '%';
  fill.style.background = color;
  numEl.style.color = color;

  // Show tips
  const tips = document.getElementById('score-tips');
  const tipList = document.getElementById('score-tip-list');
  const unchecked = SAFETY_CHECKS.filter(c => !document.getElementById(c.id)?.checked);

  if (score < 100) {
    tips.classList.add('show');
    tipList.innerHTML = unchecked.slice(0, 3).map(c =>
      `<div class="score-tip warn">⚠ <strong>Action needed:</strong> ${c.text}</div>`
    ).join('');
    if (score >= 75) {
      tipList.innerHTML = '<div class="score-tip ok">✓ Great job! You\'re practicing strong digital safety. Keep it up.</div>' + tipList.innerHTML;
    }
  } else {
    tipList.innerHTML = '<div class="score-tip ok">🎉 Perfect score! You\'re a digital safety champion. Share these tips with friends.</div>';
    tips.classList.add('show');
  }
}

/* ── PLATFORM GUIDE ───────────────────────────────────────── */
function switchPlatformTab(platform) {
  document.querySelectorAll('.platform-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.platform-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-platform="${platform}"]`).classList.add('active');
  document.getElementById(`platform-${platform}`).classList.add('active');
}

/* ── STORIES WALL ─────────────────────────────────────────── */
const COMMUNITY_STORIES = [
  { tag: 'Recovery', text: 'After months of harassment in our school group chat, I finally screenshotted everything and told my parents. The school took immediate action. I wish I\'d done it sooner.', author: 'R.K.', location: 'Pune, Maharashtra', likes: 47 },
  { tag: 'Bystander Win', text: 'I saw someone being mocked publicly on a gaming server. I reported the messages and left the server. Three other people followed. The toxic player was banned the next day.', author: 'A.S.', location: 'Chennai, Tamil Nadu', likes: 63 },
  { tag: 'Parent Perspective', text: 'My daughter was quiet for weeks. When she finally showed me the messages, I was horrified. We reported together. Now she leads her school\'s anti-bullying committee.', author: 'Parent', location: 'Hyderabad', likes: 91 },
  { tag: 'Survivor', text: 'A fake Instagram account was spreading lies about me. I documented everything, filed a complaint at cybercrime.gov.in, and the account was taken down in 72 hours. You have more power than you think.', author: 'N.V.', location: 'Bangalore, Karnataka', likes: 38 },
  { tag: 'Teacher', text: 'We started a digital safety class in our school. When we gave students a safe way to report, 11 ongoing bullying cases were flagged in the first week. Never underestimate silence.', author: 'M. Sharma, Teacher', location: 'Delhi', likes: 82 },
  { tag: 'Sibling Support', text: 'My younger brother was being targeted. I sat with him, helped him block and report, and then we told our parents together. He didn\'t have to face it alone.', author: 'D.M.', location: 'Ahmedabad, Gujarat', likes: 29 },
];

let storyLikes = COMMUNITY_STORIES.map(s => s.likes);

function renderStories() {
  const grid = document.getElementById('stories-grid');
  if (!grid) return;
  grid.innerHTML = COMMUNITY_STORIES.map((s, i) => `
    <div class="story-card reveal">
      <div class="story-tag">${s.tag}</div>
      <p class="story-text">${s.text}</p>
      <div class="story-meta">
        <div>
          <div class="story-author">${s.author}</div>
          <div class="story-location">📍 ${s.location}</div>
        </div>
        <button class="story-like" id="like-${i}" onclick="likeStory(${i})">
          ♥ <span id="like-count-${i}">${storyLikes[i]}</span>
        </button>
      </div>
    </div>
  `).join('');

  // Re-observe new elements
  document.querySelectorAll('#stories-grid .reveal').forEach(el => {
    el.classList.remove('up');
    revealObserver?.observe(el);
  });
}

function likeStory(i) {
  const btn = document.getElementById(`like-${i}`);
  if (btn.classList.contains('liked')) return;
  btn.classList.add('liked');
  storyLikes[i]++;
  document.getElementById(`like-count-${i}`).textContent = storyLikes[i];
}

// Submit a story
document.getElementById('storySubmitForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('storyName').value.trim() || 'Anonymous';
  const city = document.getElementById('storyCity').value.trim() || 'India';
  const tag = document.getElementById('storyTag').value;
  const text = document.getElementById('storyText').value.trim();
  if (!text || text.length < 30) {
    document.getElementById('storyError').style.display = 'block';
    return;
  }
  document.getElementById('storyError').style.display = 'none';

  // Add to local stories
  COMMUNITY_STORIES.unshift({ tag, text, author: name, location: city, likes: 0 });
  storyLikes.unshift(0);
  renderStories();

  // Reset & show thanks
  e.target.reset();
  document.getElementById('storyThanks').classList.add('show');
  setTimeout(() => document.getElementById('storyThanks').classList.remove('show'), 5000);
});

/* ── SAFETY PLAN BUILDER ──────────────────────────────────── */
let currentPlanStep = 0;
const PLAN_STEPS = ['trusted', 'evidence', 'contacts', 'coping', 'review'];
const planData = {};

function switchPlanStep(idx) {
  if (idx < 0 || idx >= PLAN_STEPS.length) return;

  // Mark previous as done
  if (idx > currentPlanStep) {
    document.querySelector(`[data-plan-step="${currentPlanStep}"]`)?.classList.add('done');
  }

  currentPlanStep = idx;
  document.querySelectorAll('.plan-step-tab').forEach((t, i) => {
    t.classList.remove('active');
    if (i === idx) t.classList.add('active');
  });
  document.querySelectorAll('.plan-step-panel').forEach((p, i) => {
    p.classList.remove('active');
    if (i === idx) p.classList.add('active');
  });

  if (idx === PLAN_STEPS.length - 1) buildPlanPreview();
}

function nextPlanStep() { switchPlanStep(currentPlanStep + 1); }
function prevPlanStep() { switchPlanStep(currentPlanStep - 1); }

function addTrustedContact() {
  const list = document.getElementById('trusted-contacts-list');
  const count = list.children.length + 1;
  const div = document.createElement('div');
  div.className = 'plan-contact';
  div.innerHTML = `
    <div><label class="plan-input-label">Name</label><input class="plan-input" placeholder="e.g. Mum" data-contact-name="${count}"/></div>
    <div><label class="plan-input-label">Phone / How to reach</label><input class="plan-input" placeholder="e.g. 98xxxxxxxx" data-contact-phone="${count}"/></div>
  `;
  list.appendChild(div);
}

function buildPlanPreview() {
  const name = document.getElementById('plan-name')?.value || '(Your name)';
  const trigger = document.getElementById('plan-trigger')?.value || '(Not filled)';
  const platform = document.getElementById('plan-platform')?.value || '(Not filled)';
  const evidence = document.getElementById('plan-evidence')?.value || '(Not filled)';
  const coping = document.getElementById('plan-coping')?.value || '(Not filled)';

  const contacts = [];
  document.querySelectorAll('[data-contact-name]').forEach((el, i) => {
    const phone = document.querySelector(`[data-contact-phone="${i+1}"]`)?.value;
    if (el.value) contacts.push(`${el.value}${phone ? ' — ' + phone : ''}`);
  });

  document.getElementById('plan-preview-content').innerHTML = `
    <div class="plan-preview-section"><div class="plan-preview-label">My Name</div><div class="plan-preview-value">${name}</div></div>
    <div class="plan-preview-section"><div class="plan-preview-label">Trigger / What's happening</div><div class="plan-preview-value">${trigger} on ${platform}</div></div>
    <div class="plan-preview-section"><div class="plan-preview-label">Evidence Plan</div><div class="plan-preview-value">${evidence}</div></div>
    <div class="plan-preview-section"><div class="plan-preview-label">My Trusted Contacts</div><div class="plan-preview-value">${contacts.length ? contacts.map(c=>`• ${c}`).join('<br>') : 'No contacts added yet'}</div></div>
    <div class="plan-preview-section"><div class="plan-preview-label">My Coping Strategies</div><div class="plan-preview-value">${coping}</div></div>
    <div class="plan-preview-section"><div class="plan-preview-label">Emergency Helplines</div><div class="plan-preview-value">• Cyber Crime: 1930<br>• iCall: 9152987821<br>• Vandrevala: 1860-2662-345</div></div>
  `;
}

function printSafetyPlan() {
  buildPlanPreview();
  const content = document.getElementById('plan-preview-content').innerHTML;
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html><head><title>My Safety Plan — UNSILENCED</title>
    <style>
      body{font-family:sans-serif;max-width:600px;margin:2rem auto;color:#2e2c28;line-height:1.6}
      h1{font-size:2rem;margin-bottom:0.5rem;color:#1a1814}
      .label{font-size:0.75rem;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#e8281e;margin:1.2rem 0 0.3rem}
      .value{font-size:0.95rem;border-left:3px solid #e4e1db;padding-left:0.8rem}
      .footer{margin-top:2rem;padding-top:1rem;border-top:1px solid #e4e1db;font-size:0.8rem;color:#8c8880}
      @media print{body{margin:1rem}}
    </style></head><body>
    <h1>🛡️ My Personal Safety Plan</h1>
    <p style="color:#8c8880;font-size:0.9rem">Created with UNSILENCED — confidential</p>
    ${content.replace(/class="plan-preview-label"/g,'class="label"').replace(/class="plan-preview-value"/g,'class="value"').replace(/class="plan-preview-section"/g,'style="margin-bottom:1rem"')}
    <div class="footer">Keep this document in a safe place. unsilenced.in | Emergency: 1930</div>
    </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

/* ── TOOLKIT TABS ─────────────────────────────────────────── */
function switchToolkitTab(tab) {
  document.querySelectorAll('.toolkit-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.toolkit-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-toolkit="${tab}"]`).classList.add('active');
  document.getElementById(`toolkit-${tab}`).classList.add('active');
}

// Simulated PDF download
function downloadResource(name) {
  showToast(`📄 Downloading "${name}"…`, 'info');
  setTimeout(() => showToast(`✓ "${name}" saved to Downloads`, 'success'), 1800);
}

/* ── INIT ALL FEATURES ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderStories();
  initQuiz();
  updateSafetyScore();

  // Init safety score checkboxes
  SAFETY_CHECKS.forEach(c => {
    document.getElementById(c.id)?.addEventListener('change', updateSafetyScore);
  });
});

// Close modals on backdrop click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.classList.remove('show');
    }
  });
});