const config = {
  url: 'https://fgomaujsdblpzxhnnqrg.supabase.co',
  key: 'sb_publishable_JOUqLZDnfGu_yCa6k6FVDQ_AYwpr72i'
};
const db = supabase.createClient(config.url, config.key);
const list = document.getElementById('links');
const login = document.getElementById('login');
const error = document.getElementById('error');
const status = document.getElementById('status');

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
  const { error: authError } = await db.auth.signInWithPassword({ email, password });
  if (authError) error.textContent = authError.message;
});

db.auth.onAuthStateChange((_event, session) => {
  setTimeout(() => {
    if (session) { if (login.open) login.close(); loadLinks(); }
    else { list.replaceChildren(); if (!login.open) login.showModal(); }
  }, 0);
});
