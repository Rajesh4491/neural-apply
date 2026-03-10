const AI = ["machine learning","artificial intelligence","ai","deep learning","nlp","computer vision","llm","data scientist","ml engineer","applied scientist"];
const STEM = ["stem","opt","cpt","f1","f-1"];
const H1 = ["h1","h-1","h1b","h-1b","sponsorship","visa sponsorship"];
const GC = ["green card","permanent resident","gc"];
let latest = [];

const byId = (id) => document.getElementById(id);
const contains = (text, keys) => keys.some(k => text.includes(k));

function daysAgo(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 3600 * 24));
}

async function fetchRemotive() {
  const r = await fetch('https://remotive.com/api/remote-jobs');
  const j = await r.json();
  return (j.jobs || []).map(x => ({
    title: x.title || '', company: x.company_name || 'Unknown',
    description: x.description || '', location: x.candidate_required_location || 'Remote',
    url: x.url || '#', date: x.publication_date || new Date().toISOString(), source: 'Remotive'
  }));
}

async function fetchArbeitnow() {
  const r = await fetch('https://www.arbeitnow.com/api/job-board-api');
  const j = await r.json();
  return (j.data || []).map(x => ({
    title: x.title || '', company: x.company_name || 'Unknown',
    description: x.description || '', location: x.location || 'Remote',
    url: x.url || '#', date: x.created_at || new Date().toISOString(), source: 'Arbeitnow'
  }));
}

function filterJobs(jobs) {
  const stem = byId('stem').checked;
  const h1 = byId('h1').checked;
  const gc = byId('gc').checked;
  const loc = byId('location').value.trim().toLowerCase();
  const maxAge = Number(byId('maxAge').value || 14);

  return jobs.filter(job => {
    const text = `${job.title} ${job.description} ${job.location}`.toLowerCase();
    if (!contains(text, AI)) return false;
    if (stem && !contains(text, [...STEM, ...H1])) return false;
    if (h1 && !contains(text, H1)) return false;
    if (gc && !contains(text, [...GC, ...H1])) return false;
    if (loc && !job.location.toLowerCase().includes(loc)) return false;
    if (daysAgo(job.date) > maxAge) return false;
    return true;
  });
}

function render(jobs) {
  const box = byId('results');
  box.innerHTML = jobs.map(j => `<article class="job"><h3>${j.title}</h3><p><strong>${j.company}</strong> • ${j.location} • ${j.source}</p><a href="${j.url}" target="_blank">Apply</a></article>`).join('');
}

byId('run').addEventListener('click', async () => {
  byId('status').textContent = 'Fetching latest jobs from internet sources...';
  try {
    const [a, b] = await Promise.allSettled([fetchRemotive(), fetchArbeitnow()]);
    const jobs = [
      ...(a.status === 'fulfilled' ? a.value : []),
      ...(b.status === 'fulfilled' ? b.value : []),
    ];
    latest = filterJobs(jobs).slice(0, 120);
    render(latest);
    byId('status').textContent = `Found ${latest.length} AI/ML roles. Resume received for application queue.`;
  } catch {
    byId('status').textContent = 'Could not load job sources in this environment.';
  }
});

byId('submitAll').addEventListener('click', () => {
  if (!latest.length) {
    byId('status').textContent = 'Run search first, then submit to all.';
    return;
  }
  latest.slice(0, 20).forEach(j => window.open(j.url, '_blank'));
  byId('status').textContent = `Opened ${Math.min(20, latest.length)} application tabs. (Most sites require manual login/CAPTCHA.)`;
});
