const config = {
  url: 'https://fgomaujsdblpzxhnnqrg.supabase.co',
  key: 'sb_publishable_JOUqLZDnfGu_yCa6k6FVDQ_AYwpr72i'
};
const db = supabase.createClient(config.url, config.key);
const list = document.getElementById('links');
const login = document.getElementById('login');
const error = document.getElementById('error');
const status = document.getElementById('status');
const REMEMBER_MS = 90 * 24 * 60 * 60 * 1000;
const LOGIN_KEY = 'fullpage-last-password-login';
let signingIn = false;
let loadedUserId = null;

function rememberedLogin(userId) {
  try {
    const saved = JSON.parse(localStorage.getItem(LOGIN_KEY) || 'null');
    return saved?.userId === userId && Number.isFinite(saved.at) && saved.at <= Date.now() && Date.now() - saved.at < REMEMBER_MS;
  } catch { return false; }
}

async function checkAccess() {
  const { data: { session } } = await db.auth.getSession();
  if (!session || !rememberedLogin(session.user.id)) {
    loadedUserId = null;
    list.replaceChildren();
    if (session) await db.auth.signOut();
    if (!login.open) login.showModal();
    return;
  }
  if (login.open) login.close();
  if (loadedUserId !== session.user.id) {
    loadedUserId = session.user.id;
    await loadLinks();
  }
}

async function loadLinks() {
  status.textContent = 'Loading…';
  const { data, error: loadError } = await db.from('link_deck_links').select('title,url').order('title');
  if (loadError) { status.textContent = 'Could not load links'; error.textContent = loadError.message; return; }
  const nodes = data.map(item => {
    const a = document.createElement('a');
    a.textContent = item.title;
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  });
  list.replaceChildren(...nodes);
  status.textContent = '';
}

document.getElementById('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  error.textContent = '';
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  signingIn = true;
  try {
    const { data, error: authError } = await db.auth.signInWithPassword({ email, password });
    if (authError) { error.textContent = authError.message; return; }
    localStorage.setItem(LOGIN_KEY, JSON.stringify({ userId: data.user.id, at: Date.now() }));
    document.getElementById('password').value = '';
  } finally {
    signingIn = false;
    checkAccess();
  }
});

db.auth.onAuthStateChange((event) => {
  if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    setTimeout(() => { if (!signingIn) checkAccess(); }, 0);
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkAccess();
});
setInterval(checkAccess, 60 * 60 * 1000);
