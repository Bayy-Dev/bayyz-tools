// ===== NAV =====
document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    pill.classList.add('active');
    document.getElementById(pill.dataset.target).classList.add('active');
  });
});

// ===== CARD TOGGLE =====
function toggleCard(id) {
  const card = document.getElementById(id);
  card.classList.toggle('open');
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== LOADING =====
function setLoading(id) {
  document.getElementById(id).innerHTML = '<div class="loading"><span class="loading-text">Memproses</span><span class="loading-spinner"></span></div>';
}

function setError(id, msg) {
  document.getElementById(id).innerHTML = `<div class="error-msg">❌ ${msg}</div>`;
}

// ===== FILE SELECTED FEEDBACK =====
function onFileSelected(input, labelId) {
  const file = input.files[0];
  if (file) {
    document.getElementById(labelId).textContent = '✅ ' + file.name;
  }
}

// ===== HELPER: render download links =====
function renderLinks(id, links) {
  if (!links || links.length === 0) {
    setError(id, 'Tidak ada hasil ditemukan.');
    return;
  }
  const html = links.map((l, i) =>
    `<a class="result-link" href="${l.url}" target="_blank" download>⬇ Download ${l.label || ('File ' + (i+1))}</a>`
  ).join('');
  document.getElementById(id).innerHTML = html;
}

// ===== MP4 DOWNLOADER =====
async function downloadMP4() {
  const url = document.getElementById('mp4-url').value.trim();
  if (!url) { showToast('Masukkan link dulu ya!'); return; }
  setLoading('mp4-result');
  try {
    const res = await fetch(`https://api-faa.my.id/faa/aio?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (!data || data.status === false) throw new Error(data?.message || 'Gagal');
    const links = extractLinks(data, 'mp4');
    renderLinks('mp4-result', links);
  } catch(e) {
    setError('mp4-result', e.message || 'Terjadi kesalahan');
  }
}

// ===== MP3 DOWNLOADER =====
async function downloadMP3() {
  const url = document.getElementById('mp3-url').value.trim();
  if (!url) { showToast('Masukkan link dulu ya!'); return; }
  setLoading('mp3-result');
  try {
    const res = await fetch(`https://api-faa.my.id/faa/aio?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (!data || data.status === false) throw new Error(data?.message || 'Gagal');
    const links = extractLinks(data, 'mp3');
    renderLinks('mp3-result', links);
  } catch(e) {
    setError('mp3-result', e.message || 'Terjadi kesalahan');
  }
}

// ===== HD PHOTO =====
async function downloadHDPhoto() {
  const url = document.getElementById('hdphoto-url').value.trim();
  if (!url) { showToast('Masukkan link dulu ya!'); return; }
  setLoading('hdphoto-result');
  try {
    const res = await fetch(`https://api-faa.my.id/faa/hdv4?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (!data || data.status === false) throw new Error(data?.message || 'Gagal');
    const links = extractLinks(data, 'photo');
    renderLinks('hdphoto-result', links);
  } catch(e) {
    setError('hdphoto-result', e.message || 'Terjadi kesalahan');
  }
}

// ===== HD VIDEO =====
async function downloadHDVideo() {
  const url = document.getElementById('hdvideo-url').value.trim();
  if (!url) { showToast('Masukkan link dulu ya!'); return; }
  const fps = document.querySelector('input[name="fps"]:checked').value;
  setLoading('hdvideo-result');
  try {
    const res = await fetch(`https://api-faa.my.id/faa/hdv4?url=${encodeURIComponent(url)}&fps=${fps}`);
    const data = await res.json();
    if (!data || data.status === false) throw new Error(data?.message || 'Gagal');
    const links = extractLinks(data, 'video');
    renderLinks('hdvideo-result', links);
  } catch(e) {
    setError('hdvideo-result', e.message || 'Terjadi kesalahan');
  }
}

// ===== EXTRACT LINKS HELPER =====
function extractLinks(data, type) {
  const links = [];
  const seen = new Set();

  function addLink(url, label) {
    if (url && typeof url === 'string' && url.startsWith('http') && !seen.has(url)) {
      seen.add(url);
      links.push({ url, label });
    }
  }

  // Only check result/data layer — not root data to avoid duplicates
  const sources = [data.result, data.data, data.results, data].filter(Boolean);

  for (const obj of sources) {
    if (typeof obj === 'string') {
      addLink(obj, type.toUpperCase());
      continue;
    }
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => {
        const u = item?.url || item?.download || item?.link || item?.src || (typeof item === 'string' ? item : null);
        addLink(u, item?.quality || item?.type || `${type} ${i+1}`);
      });
      if (links.length > 0) break; // stop if array already gave results
      continue;
    }
    if (typeof obj === 'object') {
      ['url','download','link','src','audio','video','mp3','mp4','hd','sd','image','photo'].forEach(key => {
        if (typeof obj[key] === 'string') addLink(obj[key], key.toUpperCase());
        if (Array.isArray(obj[key])) {
          obj[key].forEach((u, i) => {
            const uu = typeof u === 'string' ? u : u?.url || u?.link;
            addLink(uu, `${key} ${i+1}`);
          });
        }
      });
      if (obj.medias && Array.isArray(obj.medias)) {
        obj.medias.forEach((m, i) => addLink(m?.url || m?.link, m?.quality || `Media ${i+1}`));
      }
      if (links.length > 0) break;
    }
  }

  return links;
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
  } catch(e) {
    setError('rmbg-result', e.message || 'Gagal remove background');
  }
}

// ===== TIKTOK STALK =====
async function tiktokStalk() {
  const user = document.getElementById('ttstalk-user').value.trim().replace('@','');
  if (!user) { showToast('Masukkan username TikTok!'); return; }
  setLoading('ttstalk-result');
  try {
    const res = await fetch(`https://api-faa.my.id/faa/tiktokstalk?username=${encodeURIComponent(user)}`);
    const data = await res.json();
    if (!data || data.status === false) throw new Error(data?.message || 'Gagal');
    const d = data.result || data.data || data;
    const avatar = d.avatar || d.profilePic || d.avatarThumb || '';
    const name = d.nickname || d.name || d.username || user;
    const nick = d.uniqueId || d.username || user;
    const followers = fmt(d.followerCount || d.followers || 0);
    const following = fmt(d.followingCount || d.following || 0);
    const likes = fmt(d.heartCount || d.likes || d.heart || 0);
    const videos = fmt(d.videoCount || d.videos || 0);
    const bio = d.signature || d.bio || '-';
    const verified = d.verified ? '✅ Terverifikasi' : '—';

    document.getElementById('ttstalk-result').innerHTML = `
      <div class="result-card">
        <div class="stalk-header">
          ${avatar ? `<img class="result-avatar" src="${avatar}" alt="avatar" onerror="this.style.display='none'" />` : ''}
          <div class="stalk-info">
            <div class="name">${name}</div>
            <div class="nick">@${nick}</div>
          </div>
        </div>
        <div class="row"><span class="label">Followers</span><span class="value">${followers}</span></div>
        <div class="row"><span class="label">Following</span><span class="value">${following}</span></div>
        <div class="row"><span class="label">Total Likes</span><span class="value">${likes}</span></div>
        <div class="row"><span class="label">Total Video</span><span class="value">${videos}</span></div>
        <div class="row"><span class="label">Verified</span><span class="value">${verified}</span></div>
        <div class="row"><span class="label">Bio</span><span class="value">${bio}</span></div>
      </div>`;
  } catch(e) {
    setError('ttstalk-result', e.message || 'Gagal stalk akun');
  }
}

function fmt(n) {
  if (!n) return '0';
  n = parseInt(n);
  if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return n.toString();
}

// ===== AI IMAGE =====
let currentStyle = 'anime';
let currentFiguraVer = 'v1';

const styleEndpoints = {
  anime:  'https://api-faa.my.id/faa/toanime',
  chibi:  'https://api-faa.my.id/faa/tochibi',
  figura: { v1: 'https://api-faa.my.id/faa/tofigura', v2: 'https://api-faa.my.id/faa/tofigurav2', v3: 'https://api-faa.my.id/faa/tofigurav3' },
  blonde: 'https://api-faa.my.id/faa/toblonde',
  hitam:  'https://api-faa.my.id/faa/tohitam',
  putih:  'https://api-faa.my.id/faa/toputih',
};

function selectStyle(el, style) {
  document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentStyle = style;
  document.getElementById('figura-ver').style.display = style === 'figura' ? 'flex' : 'none';
  document.getElementById('ai-file').value = '';
  document.getElementById('ai-label').textContent = '📁 Tap untuk pilih gambar';
  document.getElementById('ai-result').innerHTML = '';
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

  let endpoint;
  if (currentStyle === 'figura') {
    endpoint = styleEndpoints.figura[currentFiguraVer];
  } else {
    endpoint = styleEndpoints[currentStyle];
  }

  try {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(endpoint, { method: 'POST', body: formData });
    const data = await res.json();
    if (!data || data.status === false) throw new Error(data?.message || 'Gagal');
    const imgUrl = data?.result?.url || data?.result || data?.url || data?.image || data?.data?.url;
    if (!imgUrl) throw new Error('Tidak ada hasil gambar');
    document.getElementById('ai-result').innerHTML =
      `<img class="result-img" src="${imgUrl}" alt="Result" />
       <a class="result-link" href="${imgUrl}" target="_blank" download>⬇ Download Hasil</a>`;
  } catch(e) {
    setError('ai-result', e.message || 'Gagal transform gambar');
  }
}

// ===== IQC GENERATOR =====
async function generateIQC() {
  const name = document.getElementById('iqc-name').value.trim();
  if (!name) { showToast('Masukkan nama dulu!'); return; }
  setLoading('iqc-result');
  try {
    const res = await fetch(`https://api-faa.my.id/faa/iqcv2?name=${encodeURIComponent(name)}`);
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
  } catch(e) {
    setError('iqc-result', e.message || 'Gagal generate IQ Card');
  }
}

// ===== TTS (FIXED: tts-lengkap bukan tts-legkap) =====
async function generateTTS() {
  const text = document.getElementById('tts-text').value.trim();
  const lang = document.getElementById('tts-lang').value.trim() || 'id';
  if (!text) { showToast('Masukkan teks dulu!'); return; }
  setLoading('tts-result');
  try {
    const res = await fetch(`https://api-faa.my.id/faa/tts-lengkap?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`);
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
  } catch(e) {
    setError('tts-result', e.message || 'Gagal generate TTS');
  }
}
