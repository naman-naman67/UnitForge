const RARITY_DATA = [
  ['Common', '#94a3b8'],
  ['Uncommon', '#10b981'],
  ['Rare', '#38bdf8'],
  ['Epic', '#a855f7'],
  ['Legendary', '#f59e0b'],
  ['Mythic', '#ec4899'],
  ['Secret', '#f43f5e'],
  ['Exclusive', '#fb923c']
];

const STAT_DEFS = [
  ['Damage', 'damage', 'any', 'per hit'],
  ['Cooldown', 'cooldown', 'any', 'seconds'],
  ['Range', 'range', 'any', 'studs / units'],
  ['Upgrade Cost', 'upgradeCost', 'any', 'currency']
];

const STORAGE_KEY = 'unitforge_units';

function createDefaultUnit() {
  return {
    id: null,
    name: '',
    rarity: 'Common',
    description: '',
    placementCost: 500,
    image: '',
    levels: [
      { damage: 100, cooldown: 1, range: 15, upgradeCost: 250 }
    ]
  };
}

let unit = createDefaultUnit();
let currentLevel = 0;

const $ = (id) => document.getElementById(id);

let toastTimer = null;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function calcDps(level) {
  const dmg = Number(level.damage) || 0;
  const cd = Number(level.cooldown);
  return cd > 0 ? dmg / cd : 0;
}

function fmt(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? n.toLocaleString('en-US') : Number(n.toFixed(2)).toLocaleString('en-US');
}

function fmtRaw(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : Number(n.toFixed(2)).toString();
}

function calcTotalInvestment(levelIndex) {
  let total = Number(unit.placementCost) || 0;
  for (let i = 0; i <= levelIndex && i < unit.levels.length; i++) {
    if (i > 0) {
      total += Number(unit.levels[i].upgradeCost) || 0;
    }
  }
  return total;
}

function getRarityColor(rarityName) {
  return RARITY_DATA.find((r) => r[0] === rarityName)?.[1] || '#94a3b8';
}

function renderRarities() {
  $('rarities').innerHTML = RARITY_DATA.map(([name, color]) => `
    <button
      type="button"
      class="rarity-chip ${unit.rarity === name ? 'active' : ''}"
      data-rarity="${name}"
      style="--rarity:${color}"
      aria-pressed="${unit.rarity === name}"
    >${name}</button>
  `).join('');

  document.querySelectorAll('[data-rarity]').forEach((btn) => {
    btn.addEventListener('click', () => {
      unit.rarity = btn.dataset.rarity;
      renderRarities();
      renderPreview();
    });
  });
}

function renderLevels() {
  $('levelTabs').innerHTML = unit.levels.map((_, i) => `
    <button
      type="button"
      class="level-tab ${i === currentLevel ? 'active' : ''}"
      data-level="${i}"
      role="tab"
      aria-selected="${i === currentLevel}"
    >Level ${i + 1}</button>
  `).join('');

  document.querySelectorAll('[data-level]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentLevel = Number(btn.dataset.level);
      renderLevels();
      renderStats();
      renderPreview();
    });
  });

  const count = unit.levels.length;
  $('levelCount').textContent = `${count} level${count === 1 ? '' : 's'} configured`;
}

function renderStats() {
  const lvl = unit.levels[currentLevel];
  $('statRows').innerHTML =
    STAT_DEFS.map(([label, key, step, unitLabel]) => `
      <tr>
        <td>${label}</td>
        <td>
          <input
            aria-label="${label}"
            type="number"
            min="0"
            step="${step}"
            value="${lvl[key] ?? 0}"
            data-stat="${key}"
          >
        </td>
        <td class="muted">${key === 'upgradeCost' && currentLevel === 0 ? 'to next / base' : unitLabel}</td>
      </tr>
    `).join('') +
    `
      <tr class="dps-row">
        <td>Calculated DPS</td>
        <td><span class="dps-highlight" id="dpsValue">${fmt(calcDps(lvl))}</span></td>
        <td class="muted">damage / sec</td>
      </tr>
    `;

  document.querySelectorAll('[data-stat]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.stat;
      lvl[key] = input.value === '' ? '' : Number(input.value);
      $('dpsValue').textContent = fmt(calcDps(lvl));
      renderPreview();
    });
  });
}

function renderPreview() {
  const lvl = unit.levels[currentLevel] || unit.levels[0];
  const color = getRarityColor(unit.rarity);

  $('previewName').textContent = unit.name.trim() || 'Your Unit';

  const badge = $('previewRarity');
  badge.textContent = unit.rarity.toUpperCase();
  badge.style.color = color;
  badge.style.backgroundColor = `${color}22`;
  badge.style.borderColor = `${color}55`;

  const card = $('previewCard');
  card.style.borderColor = `${color}66`;
  card.style.boxShadow = `0 20px 45px rgba(0,0,0,0.45), 0 0 28px ${color}1f`;

  $('previewDescription').textContent =
    unit.description.trim() || 'Your unit description will appear here.';

  const statsList = [
    ['Damage', lvl.damage === '' ? '—' : fmt(lvl.damage), false],
    ['Cooldown', lvl.cooldown === '' ? '—' : `${fmtRaw(lvl.cooldown)}s`, false],
    ['DPS', fmt(calcDps(lvl)), true],
    ['Range', lvl.range === '' ? '—' : fmt(lvl.range), false],
    ['Placement Cost', unit.placementCost === '' ? '—' : fmt(unit.placementCost), false],
    ['Upgrade Cost', lvl.upgradeCost === '' ? '—' : fmt(lvl.upgradeCost), false]
  ];

  $('previewStats').innerHTML = statsList.map(([label, val, highlight]) => `
    <div class="stat-box ${highlight ? 'accent-teal' : ''}">
      <span>${label}</span>
      <strong>${val}</strong>
    </div>
  `).join('');

  $('previewLevel').textContent = `LEVEL ${currentLevel + 1} OF ${unit.levels.length}`;
  $('previewTotalCost').textContent = `TOTAL INVESTED: ${fmt(calcTotalInvestment(currentLevel))}`;

  if (unit.image) {
    $('previewImage').innerHTML = `<img src="${unit.image}" alt="Unit artwork">`;
    $('clearImage').classList.remove('hidden');
  } else {
    $('previewImage').innerHTML = `
      <div class="placeholder-art">
        <span>✦</span>
        <small>NO ARTWORK UPLOADED</small>
      </div>
    `;
    $('clearImage').classList.add('hidden');
  }
}

function syncIdentity() {
  unit.name = $('unitName').value;
  unit.description = $('description').value;
  const rawCost = $('placementCost').value;
  unit.placementCost = rawCost === '' ? '' : Number(rawCost);
  $('descCount').textContent = `${unit.description.length} / 140`;
  renderPreview();
}

$('unitName').addEventListener('input', syncIdentity);
$('description').addEventListener('input', syncIdentity);
$('placementCost').addEventListener('input', syncIdentity);

/* Image Upload & Compression (keeps LocalStorage healthy) */
function processImageFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('Please choose a valid image file.');
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    toast('Please use an image smaller than 8 MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 900;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Preserve transparency for PNG/WEBP, otherwise compress to JPEG
      const outputType = file.type === 'image/png' || file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
      unit.image = canvas.toDataURL(outputType, 0.86);
      renderPreview();
      toast('Artwork updated');
    };
    img.onerror = () => {
      unit.image = reader.result;
      renderPreview();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

$('imageInput').addEventListener('change', (e) => {
  processImageFile(e.target.files[0]);
});

const uploadZone = $('uploadZone');
['dragenter', 'dragover'].forEach((evt) => {
  uploadZone.addEventListener(evt, (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
});
['dragleave', 'drop'].forEach((evt) => {
  uploadZone.addEventListener(evt, (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
  });
});
uploadZone.addEventListener('drop', (e) => {
  const file = e.dataTransfer?.files?.[0];
  if (file) processImageFile(file);
});

$('clearImage').addEventListener('click', () => {
  unit.image = '';
  $('imageInput').value = '';
  renderPreview();
  toast('Artwork removed');
});

/* Level Management */
$('addLevel').addEventListener('click', () => {
  const prev = unit.levels[unit.levels.length - 1];
  unit.levels.push({
    damage: Math.round((Number(prev.damage) || 0) * 1.25),
    cooldown: Number(prev.cooldown) || 1,
    range: Number(prev.range) || 15,
    upgradeCost: Math.round((Number(prev.upgradeCost) || 100) * 1.5)
  });
  currentLevel = unit.levels.length - 1;
  renderLevels();
  renderStats();
  renderPreview();
});

$('removeLevel').addEventListener('click', () => {
  if (unit.levels.length === 1) {
    toast('A unit must have at least one level.');
    return;
  }
  unit.levels.splice(currentLevel, 1);
  currentLevel = Math.min(currentLevel, unit.levels.length - 1);
  renderLevels();
  renderStats();
  renderPreview();
  toast('Level removed');
});

/* LocalStorage Persistence */
function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeSaved(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function renderSaved() {
  const items = readSaved();
  if (!items.length) {
    $('savedList').innerHTML = '<p class="empty-state">No saved units yet. Build a unit and click <strong>Save Unit</strong>.</p>';
    return;
  }

  $('savedList').innerHTML = items.map((item) => {
    const color = getRarityColor(item.rarity);
    const thumb = item.image
      ? `<img src="${item.image}" alt="">`
      : '<span>✦</span>';

    return `
      <div class="saved-item">
        <div class="saved-info">
          <div class="saved-thumb" style="border-color:${color}66">${thumb}</div>
          <div class="saved-meta">
            <strong>${escapeHtml(item.name || 'Untitled Unit')}</strong>
            <small><span style="color:${color};font-weight:700">${escapeHtml(item.rarity)}</span> · ${item.levels.length} lvl${item.levels.length === 1 ? '' : 's'} · Cost ${fmt(item.placementCost ?? 0)}</small>
          </div>
        </div>
        <div class="btn-group">
          <button type="button" class="btn btn-secondary btn-sm" data-load="${item.id}">Load</button>
          <button type="button" class="btn btn-danger btn-sm" data-delete="${item.id}">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('[data-load]').forEach((btn) => {
    btn.addEventListener('click', () => loadUnit(btn.dataset.load));
  });

  document.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const filtered = readSaved().filter((x) => x.id !== btn.dataset.delete);
      writeSaved(filtered);
      renderSaved();
      toast('Unit deleted');
    });
  });
}

$('saveUnit').addEventListener('click', () => {
  syncIdentity();
  const items = readSaved();
  if (!unit.id) {
    unit.id = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  }
  const snapshot = JSON.parse(JSON.stringify(unit));
  const idx = items.findIndex((x) => x.id === unit.id);
  if (idx >= 0) {
    items[idx] = snapshot;
  } else {
    items.unshift(snapshot);
  }

  if (!writeSaved(items)) {
    toast('Browser storage full. Try removing or shrinking artwork.');
    return;
  }
  renderSaved();
  toast('Unit saved to browser collection');
});

function loadUnit(id) {
  const found = readSaved().find((x) => x.id === id);
  if (!found) return;

  unit = JSON.parse(JSON.stringify(found));
  unit.placementCost ??= 0;
  unit.levels.forEach((l) => {
    l.upgradeCost ??= 0;
  });

  currentLevel = 0;
  $('unitName').value = unit.name;
  $('description').value = unit.description;
  $('placementCost').value = unit.placementCost;
  $('imageInput').value = '';
  $('descCount').textContent = `${unit.description.length} / 140`;

  renderRarities();
  renderLevels();
  renderStats();
  renderPreview();
  toast(`Loaded "${unit.name || 'Untitled Unit'}"`);
}

$('newUnit').addEventListener('click', () => {
  unit = createDefaultUnit();
  currentLevel = 0;
  $('unitName').value = '';
  $('description').value = '';
  $('placementCost').value = '500';
  $('imageInput').value = '';
  $('descCount').textContent = '0 / 140';

  renderRarities();
  renderLevels();
  renderStats();
  renderPreview();
  toast('Started a fresh unit');
});

/* Copy Statistics */
$('copyStats').addEventListener('click', () => {
  const lines = [
    `${unit.name.trim() || 'Untitled Unit'} [${unit.rarity}]`,
    `Placement Cost: ${fmtRaw(unit.placementCost ?? 0)}`,
    ...(unit.description.trim() ? [`Description: ${unit.description.trim()}`] : []),
    ...unit.levels.map((l, i) =>
      `Level ${i + 1}: Damage ${fmtRaw(l.damage)} | Cooldown ${fmtRaw(l.cooldown)}s | DPS ${fmtRaw(calcDps(l))} | Range ${fmtRaw(l.range)} | Upgrade Cost ${fmtRaw(l.upgradeCost ?? 0)}`
    )
  ];

  const text = lines.join('\n');
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => toast('Unit stats copied to clipboard'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
});

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    toast('Unit stats copied to clipboard');
  } catch {
    toast('Unable to access clipboard');
  }
  document.body.removeChild(ta);
}

/* Download PNG Card (Dark Theme with Purple & Teal Accents) */
$('downloadCard').addEventListener('click', async () => {
  const lvl = unit.levels[currentLevel];
  const color = getRarityColor(unit.rarity);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 900;
  canvas.height = 1220;

  // Outer dark background
  ctx.fillStyle = '#0b0e14';
  ctx.fillRect(0, 0, 900, 1220);

  // Card body
  ctx.fillStyle = '#161c2a';
  roundRect(ctx, 36, 36, 828, 1148, 28);
  ctx.fill();

  // Rarity-tinted border
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  roundRect(ctx, 36, 36, 828, 1148, 28);
  ctx.stroke();

  // Artwork area
  if (unit.image) {
    try {
      const img = new Image();
      img.src = unit.image;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });
      const scale = Math.max(828 / img.width, 440 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.save();
      roundRect(ctx, 36, 36, 828, 440, 26);
      ctx.clip();
      ctx.drawImage(img, 36 + (828 - w) / 2, 36 + (440 - h) / 2, w, h);
      ctx.restore();
    } catch {
      drawPlaceholder(ctx);
    }
  } else {
    drawPlaceholder(ctx);
  }

  // Divider line below image
  ctx.strokeStyle = '#263047';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(36, 476);
  ctx.lineTo(864, 476);
  ctx.stroke();

  // Unit Name
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 48px Inter, Arial, sans-serif';
  wrapText(ctx, unit.name.trim() || 'Your Unit', 76, 550, 748, 56, 2);

  // Rarity Pill
  const badgeText = unit.rarity.toUpperCase();
  ctx.font = 'bold 20px Inter, Arial, sans-serif';
  const badgeWidth = Math.max(150, ctx.measureText(badgeText).width + 48);
  ctx.fillStyle = `${color}28`;
  roundRect(ctx, 76, 608, badgeWidth, 44, 22);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, 76, 608, badgeWidth, 44, 22);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.fillText(badgeText, 100, 637);

  // Description
  ctx.fillStyle = '#94a3b8';
  ctx.font = '24px Inter, Arial, sans-serif';
  wrapText(ctx, unit.description.trim() || 'Custom unit forged in UnitForge.', 76, 705, 748, 34, 2);

  // 6 Stat Boxes (2 columns x 3 rows)
  const stats = [
    ['DAMAGE', fmt(lvl.damage), false],
    ['COOLDOWN', `${fmtRaw(lvl.cooldown)}s`, false],
    ['DPS', fmt(calcDps(lvl)), true],
    ['RANGE', fmt(lvl.range), false],
    ['PLACEMENT COST', fmt(unit.placementCost ?? 0), false],
    ['UPGRADE COST', fmt(lvl.upgradeCost ?? 0), false]
  ];

  stats.forEach(([label, val, isTeal], i) => {
    const x = 76 + (i % 2) * 384;
    const y = 785 + Math.floor(i / 2) * 108;

    ctx.fillStyle = '#0e131d';
    roundRect(ctx, x, y, 364, 88, 14);
    ctx.fill();

    ctx.strokeStyle = isTeal ? '#14b8a6' : '#263047';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, 364, 88, 14);
    ctx.stroke();

    ctx.fillStyle = '#8b9bb4';
    ctx.font = 'bold 16px Inter, Arial, sans-serif';
    ctx.fillText(label, x + 20, y + 30);

    ctx.fillStyle = isTeal ? '#14b8a6' : '#f1f5f9';
    ctx.font = 'bold 30px "JetBrains Mono", monospace, Arial';
    ctx.fillText(String(val), x + 20, y + 68);
  });

  // Footer Stamp
  ctx.fillStyle = '#8b9bb4';
  ctx.font = 'bold 18px "JetBrains Mono", monospace, Arial';
  ctx.textAlign = 'center';
  ctx.fillText(
    `LEVEL ${currentLevel + 1} OF ${unit.levels.length}  ·  TOTAL COST ${fmt(calcTotalInvestment(currentLevel))}  ·  UNITFORGE`,
    450,
    1152
  );
  ctx.textAlign = 'left';

  const link = document.createElement('a');
  const safeName = unit.name.trim().replace(/[^a-z0-9-_]+/gi, '_') || 'unit';
  link.download = `${safeName}_lvl${currentLevel + 1}_card.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  toast('Unit card downloaded as PNG');
});

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawPlaceholder(ctx) {
  const grad = ctx.createLinearGradient(36, 36, 864, 476);
  grad.addColorStop(0, '#1c1936');
  grad.addColorStop(1, '#10262b');
  ctx.fillStyle = grad;
  roundRect(ctx, 36, 36, 828, 440, 26);
  ctx.fill();

  ctx.fillStyle = '#8b5cf6';
  ctx.font = '104px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('✦', 450, 290);
  ctx.textAlign = 'left';
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  let line = '';
  let lines = 0;
  for (const word of String(text).split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
      if (++lines >= maxLines) return;
    } else {
      line = test;
    }
  }
  if (line && lines < maxLines) {
    ctx.fillText(line, x, y);
  }
}

/* Initialize App */
renderRarities();
renderLevels();
renderStats();
renderPreview();
renderSaved();