// ===== PROXY BASE =====
const API = (endpoint, params = {}) => {
  const qs = new URLSearchParams({ endpoint, ...params }).toString();
  return `/api/proxy?${qs}`;
};

// ===== CARD TOGGLE =====
function toggleCard(id) {
  document.getElementById(id).classList.toggle('open');
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== UI HELPERS =====
function setLoading(id) {
  document.getElementById(id).innerHTML =
    '<div class="loading"><span class="loading-spinner"></span><span>Memproses...</span></div>';
}

function setError(id, msg) {
  document.getElementById(id).innerHTML = `<div class="error-msg">❌ ${msg}</div>`;
}

function onFileSelected(input, labelId) {
  if (input.files[0]) document.getElementById(labelId).textContent = '✅ ' + input.files[0].name;
}

// ===== RENDER LINKS =====
function renderLinks(id, links) {
  if (!links || links.length === 0) { setError(id, 'Tidak ada hasil ditemukan.'); return; }
  document.getElementById(id).innerHTML = links
    .map((l, i) => `<a class="result-link" href="${l.url}" target="_blank" download>⬇ Download ${l.label || 'File ' + (i+1)}</a>`)
    .join('');
}

// ===== EXTRACT LINKS =====
function extractLinks(data, type) {
  const links = [];
  const seen = new Set();

  function add(url, label) {
    if (url && typeof url === 'string' && url.startsWith('http') && !seen.has(url)) {
      seen.add(url);
      links.push({ url, label: label || type.toUpperCase() });
    }
  }

  // Try nested layers first, then root
  const layers = [data.result, data.data, data.results, data].filter(Boolean);

  for (const obj of layers) {
    if (typeof obj === 'string') { add(obj, type.toUpperCase()); break; }
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => {
        const u = item?.url || item?.download || item?.link || item?.src || (typeof item === 'string' ? item : null);
        add(u, item?.quality || item?.type || `${type} ${i+1}`);
      });
      if (links.length) break;
      continue;
    }
    if (typeof obj === 'object') {
      ['url','download','link','src','audio','video','mp3','mp4','hd','sd','image','photo'].forEach(key => {
        if (typeof obj[key] === 'string') add(obj[key], key.toUpperCase());
        if (Array.isArray(obj[key])) obj[key].forEach((u,i) => add(typeof u==='string'?u:u?.url||u?.link, `${key} ${i+1}`));
      });
      if (obj.medias?.length) obj.medias.forEach((m,i) => add(m?.url||m?.link, m?.quality||`Media ${i+1}`));
      if (links.length) break;
    }
  }
  return links;
}

// ===== DOWNLOADER =====
async function downloadMP4() {
  const url = document.getElementById('mp4-url').value.trim();
  if (!url) return showToast('Masukkan link dulu!');
  setLoading('mp4-result');
  try {
    const res = await fetch(API('aio', { url }));
    const data = await res.json();
    if (!data || data.status === false) throw new Error(data?.message || 'Gagal');
    renderLinks('mp4-result', extractLinks(data, 'mp4'));
  } catch(e) { setError('mp4-result', e.message); }
}

async function downloadMP3() {
  const url = document.getElementById('mp3-url').value.trim();
  if (!url) return showToast('Masukkan link dulu!');
  setLoading('mp3-result');
  try {
    const res = await fetch(API('aio', { url }));
    const data = await res.json();
    if (!data || data.status === false) throw new Error(data?.message || 'Gagal');
    renderLinks('mp3-result', extractLinks(data, 'mp3'));
  } catch(e) { setError('mp3-result', e.message); }
}

async function downloadHDPhoto() {
  const url = document.getElementById('hdphoto-url').value.trim();
  if (!url) return showToast('Masukkan link dulu!');
  setLoading('hdphoto-result');
  try {
    const res = await fetch(API('hdv4', { url }));
    const data = await res.json();
    if (!data || data.status === false) throw new Error(data?.message || 'Gagal');
    renderLinks('hdphoto-result', extractLinks(data, 'photo'));
  } catch(e) { setError('hdphoto-result', e.message); }
}

async function downloadHDVideo() {
  const url = document.getElementById('hdvideo-url').value.trim();
  if (!url) return showToast('Masukkan link dulu!');
  const fps = document.querySelector('input[name="fps"]:checked').value;
  setLoading('hdvideo-result');
  try {
    const res = await fetch(API('hdv4', { url, fps }));
    const data = await res.json();
    if (!data || data.status === false) throw new Error(data?.message || 'Gagal');
    renderLinks('hdvideo-result', extractLinks(data, 'video'));
  } catch(e) { setError('hdvideo-result', e.message); }
}

// ===== REMOVE BACKGROUND =====
async function removeBackground(input) {
  const file = input.files[0];
  if (!file) return;
  setLoading('rmbg-result');
  try {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('https://api2.pixelcut.app/image/matte/v1', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: formData
    });
    const data = await res.json();
    const imgUrl = data?.result_url || data?.url || data?.image;
    if (!imgUrl) throw new Error('Tidak ada hasil');
    document.getElementById('rmbg-result').innerHTML =
      `<img class="result-img" src="${imgUrl}" alt="Result" />
       <a class="result-link" href="${imgUrl}" target="_blank" download>⬇ Download Hasil</a>`;
  } catch(e) { setError('rmbg-result', e.message || 'Gagal remove background'); }
}

// ===== TIKTOK STALK =====
async function tiktokStalk() {
  const user = document.getElementById('ttstalk-user').value.trim().replace('@','');
  if (!user) return showToast('Masukkan username TikTok!');
  setLoading('ttstalk-result');
  try {
    const res = await fetch(API('tiktokstalk', { username: user }));
    const data = await res.json();
    if (!data || data.status === false) throw new Error(data?.message || 'Gagal');
    const d = data.result || data.data || data;
    const avatar = d.avatar || d.profilePic || d.avatarThumb || '';
    const name = d.nickname || d.name || user;
    const nick = d.uniqueId || d.username || user;
    document.getElementById('ttstalk-result').innerHTML = `
      <div class="result-card">
        <div class="stalk-header">
          ${avatar ? `<img class="result-avatar" src="${avatar}" onerror="this.style.display='none'" />` : ''}
          <div class="stalk-info">
            <div class="name">${name}</div>
            <div class="nick">@${nick}</div>
          </div>
        </div>
        ${[
          ['Followers', fmt(d.followerCount||d.followers||0)],
          ['Following', fmt(d.followingCount||d.following||0)],
          ['Total Likes', fmt(d.heartCount||d.likes||d.heart||0)],
          ['Total Video', fmt(d.videoCount||d.videos||0)],
          ['Verified', d.verified ? '✅ Ya' : '✗ Tidak'],
          ['Bio', d.signature||d.bio||'-'],
        ].map(([l,v]) => `<div class="row"><span class="label">${l}</span><span class="value">${v}</span></div>`).join('')}
      </div>`;
  } catch(e) { setError('ttstalk-result', e.message || 'Gagal stalk'); }
}

function fmt(n) {
  n = parseInt(n) || 0;
  if (n >= 1e9) return (n/1e9).toFixed(1)+'B';
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return n.toString();
}

// ===== AI IMAGE =====
let currentStyle = 'anime', currentFiguraVer = 'v1';

const styleEndpoints = {
  anime: 'toanime', chibi: 'tochibi',
  figura: { v1:'tofigura', v2:'tofigurav2', v3:'tofigurav3' },
  blonde: 'toblonde', hitam: 'tohitam', putih: 'toputih',
};

function selectStyle(el, style) {
  document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentStyle = style;
  const fv = document.getElementById('figura-ver');
  if (fv) fv.style.display = style === 'figura' ? 'flex' : 'none';
  const fi = document.getElementById('ai-file');
  if (fi) fi.value = '';
  const lbl = document.getElementById('ai-label');
  if (lbl) lbl.textContent = '📁 Tap untuk pilih gambar';
  const res = document.getElementById('ai-result');
  if (res) res.innerHTML = '';
}

function selectFiguraVer(el, ver) {
  document.querySelectorAll('.ver-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentFiguraVer = ver;
}

async function transformImage(input) {
  const file = input.files[0];
  if (!file) return;
  setLoading('ai-result');
  const ep = currentStyle === 'figura' ? styleEndpoints.figura[currentFiguraVer] : styleEndpoints[currentStyle];
  try {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`/api/proxy?endpoint=${ep}`, { method: 'POST', body: formData });
    const data = await res.json();
    if (!data || data.status === false) throw new Error(data?.message || 'Gagal');
    const imgUrl = data?.result?.url || data?.result || data?.url || data?.image || data?.data?.url;
    if (!imgUrl) throw new Error('Tidak ada hasil gambar');
    document.getElementById('ai-result').innerHTML =
      `<img class="result-img" src="${imgUrl}" alt="Result" />
       <a class="result-link" href="${imgUrl}" target="_blank" download>⬇ Download Hasil</a>`;
  } catch(e) { setError('ai-result', e.message || 'Gagal transform'); }
}

// ===== IQC GENERATOR =====
async function generateIQC() {
  const name = document.getElementById('iqc-name').value.trim();
  if (!name) return showToast('Masukkan nama dulu!');
  setLoading('iqc-result');
  try {
    const res = await fetch(API('iqcv2', { name }));
    const data = await res.json();
    if (!data || data.status === false) throw new Error(data?.message || 'Gagal');
    const imgUrl = data?.result?.url || data?.result || data?.url || data?.image || data?.data;
    if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
      document.getElementById('iqc-result').innerHTML =
        `<img class="result-img" src="${imgUrl}" alt="IQ Card" />
         <a class="result-link" href="${imgUrl}" target="_blank" download>⬇ Download IQ Card</a>`;
    } else {
      const iq = data?.result?.iq || data?.iq || data?.score || '???';
      document.getElementById('iqc-result').innerHTML =
        `<div class="result-card">
           <div class="row"><span class="label">Nama</span><span class="value">${name}</span></div>
           <div class="row"><span class="label">IQ Score</span><span class="value">${iq}</span></div>
         </div>`;
    }
  } catch(e) { setError('iqc-result', e.message || 'Gagal generate IQ Card'); }
}

// ===== TTS =====
async function generateTTS() {
  const text = document.getElementById('tts-text').value.trim();
  const lang = document.getElementById('tts-lang').value.trim() || 'id';
  if (!text) return showToast('Masukkan teks dulu!');
  setLoading('tts-result');
  try {
    const res = await fetch(API('tts-lengkap', { text, lang }));
    const data = await res.json();
    if (!data || data.status === false) throw new Error(data?.message || 'Gagal');
    const audioUrl = data?.result?.url || data?.result || data?.url || data?.audio || data?.data;
    if (audioUrl && typeof audioUrl === 'string' && audioUrl.startsWith('http')) {
      document.getElementById('tts-result').innerHTML =
        `<audio class="result-audio" controls src="${audioUrl}"></audio>
         <a class="result-link" href="${audioUrl}" target="_blank" download>⬇ Download Audio</a>`;
    } else {
      throw new Error('Tidak ada audio ditemukan');
    }
  } catch(e) { setError('tts-result', e.message || 'Gagal generate TTS'); }
}
