// app.js — AutoRepairIQ Pro main controller
// Aloha from Pearl City! 🌺

// ═══════════════════════════════════════
//  SETTINGS & STATE
// ═══════════════════════════════════════
let appSettings = { shopName: '', shopPhone: '', hourlyRate: 110, apiKey: '' };
let currentEstimate = null;
let scanPhotos = [null, null];
let scanStreams = [null, null];
let currentScanResult = null;

// ═══════════════════════════════════════
//  VEHICLE DATA (make → model lookup)
// ═══════════════════════════════════════
const vehicleModels = {
  Toyota:    ['Camry','Corolla','RAV4','Tacoma','Highlander','4Runner'],
  Honda:     ['Civic','Accord','CR-V','Pilot','Odyssey','Ridgeline'],
  Ford:      ['F-150','Mustang','Explorer','Escape','Ranger','Edge'],
  Chevrolet: ['Silverado','Malibu','Equinox','Tahoe','Colorado','Traverse'],
  BMW:       ['3 Series','5 Series','X3','X5','7 Series'],
  Nissan:    ['Altima','Rogue','Sentra','Frontier','Pathfinder'],
  Subaru:    ['Outback','Forester','Impreza','Crosstrek','Legacy'],
  Hyundai:   ['Elantra','Tucson','Santa Fe','Sonata','Palisade'],
  Kia:       ['Sorento','Sportage','Forte','Telluride','Carnival'],
  Dodge:     ['Ram 1500','Charger','Challenger','Durango','Journey'],
  Jeep:      ['Wrangler','Grand Cherokee','Cherokee','Compass','Gladiator'],
  GMC:       ['Sierra','Terrain','Acadia','Yukon','Canyon'],
};

// ═══════════════════════════════════════
//  REPAIR LOOKUP DATA
// ═══════════════════════════════════════
// #ASSUMPTION: indie parts range = shop cost; labor in hours
const repairs = {
  Engine: {
    'Oil Change':         { indie:[25,55],   labor:[0.3,0.7] },
    'Spark Plugs':        { indie:[40,120],  labor:[1,2.5] },
    'Timing Belt':        { indie:[120,220], labor:[4,6] },
    'Timing Chain':       { indie:[200,400], labor:[6,10] },
    'Head Gasket':        { indie:[350,700], labor:[8,14] },
    'Valve Cover Gasket': { indie:[40,90],   labor:[1,2] },
    'Serpentine Belt':    { indie:[25,60],   labor:[0.5,1] },
    'Water Pump':         { indie:[80,180],  labor:[2,4] },
    'Thermostat':         { indie:[20,55],   labor:[0.5,1.5] },
  },
  Brakes: {
    'Pad Replacement (Front)':  { indie:[50,120],  labor:[1,1.5] },
    'Pad Replacement (Rear)':   { indie:[50,120],  labor:[1,1.5] },
    'Rotor Replacement (Front)':{ indie:[80,180],  labor:[1.5,2.5] },
    'Rotor Replacement (Rear)': { indie:[80,180],  labor:[1.5,2.5] },
    'Full Brake Job (4-wheel)': { indie:[200,450], labor:[3,5] },
    'Caliper Replacement':      { indie:[80,200],  labor:[1.5,3] },
    'Brake Flush':              { indie:[20,40],   labor:[0.5,1] },
    'ABS Sensor':               { indie:[60,150],  labor:[1,2] },
  },
  Transmission: {
    'Fluid Change':    { indie:[30,65],    labor:[0.5,1] },
    'Filter Change':   { indie:[35,80],    labor:[1,1.5] },
    'Full Rebuild':    { indie:[1200,2800],labor:[15,25] },
    'Shift Solenoid':  { indie:[60,180],   labor:[2,4] },
    'Torque Converter':{ indie:[150,400],  labor:[5,8] },
  },
  Suspension: {
    'Strut Replacement (pair)': { indie:[150,350], labor:[2.5,4.5] },
    'Shock Absorbers (pair)':   { indie:[100,250], labor:[1.5,3] },
    'Sway Bar Links':           { indie:[30,70],   labor:[0.5,1.5] },
    'Control Arm':              { indie:[80,220],  labor:[2,3.5] },
    'Ball Joint':               { indie:[60,150],  labor:[1.5,3] },
    'Tie Rod End':              { indie:[50,120],  labor:[1,2] },
    'Wheel Bearing':            { indie:[80,220],  labor:[2,3.5] },
    'Alignment':                { indie:[0,0],     labor:[0.7,1.2] },
  },
  Electrical: {
    'Battery Replacement': { indie:[80,200],  labor:[0.3,0.7] },
    'Alternator':          { indie:[120,350], labor:[1.5,3] },
    'Starter Motor':       { indie:[100,280], labor:[1,2.5] },
    'Ignition Coil':       { indie:[40,120],  labor:[0.5,1.5] },
    'Oxygen Sensor':       { indie:[30,80],   labor:[0.5,1.5] },
    'MAF Sensor':          { indie:[50,180],  labor:[0.5,1] },
  },
  'AC/Heating': {
    'Recharge (Freon)':    { indie:[30,70],   labor:[0.5,1] },
    'Compressor Replace':  { indie:[200,600], labor:[3,5] },
    'Condenser Replace':   { indie:[150,350], labor:[2,4] },
    'Heater Core':         { indie:[80,200],  labor:[5,9] },
    'Cabin Air Filter':    { indie:[15,40],   labor:[0.2,0.5] },
  },
  Exhaust: {
    'Muffler Replace':         { indie:[60,180],  labor:[1,2] },
    'Catalytic Converter':     { indie:[250,900], labor:[2,4] },
    'O2 Sensor':               { indie:[30,80],   labor:[0.5,1.5] },
    'Flex Pipe / Resonator':   { indie:[80,200],  labor:[1.5,2.5] },
    'Exhaust Manifold Gasket': { indie:[30,80],   labor:[2,4] },
  },
  Tires: {
    'Single Tire (labor only)': { indie:[0,0],   labor:[0.3,0.5] },
    'Full Set (4) labor only':  { indie:[0,0],   labor:[1,1.5] },
    'Alignment':                { indie:[0,0],   labor:[0.7,1.2] },
    'TPMS Sensor':              { indie:[40,90], labor:[0.5,1] },
  },
  'Oil/Fluids': {
    'Oil Change (conventional)': { indie:[20,35], labor:[0.3,0.7] },
    'Oil Change (synthetic)':    { indie:[45,80], labor:[0.3,0.7] },
    'Coolant Flush':             { indie:[20,45], labor:[0.5,1] },
    'Brake Fluid Flush':         { indie:[15,35], labor:[0.5,1] },
    'Power Steering Flush':      { indie:[20,40], labor:[0.5,1] },
    'Differential Fluid':        { indie:[30,60], labor:[0.5,1] },
  },
};

// ═══════════════════════════════════════
//  INIT
// ═══════════════════════════════════════
(function boot() {
  loadSettings();
  populateYearDropdowns();
  wireModelDropdowns();
  wireCategoryDropdown();
  renderGarage();
  renderJobs();
  renderExpenses();

  if ('serviceWorker' in navigator && !window.Capacitor) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
  }
})();

// ═══════════════════════════════════════
//  TAB NAVIGATION
// ═══════════════════════════════════════
function openTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  if (name === 'jobs') renderJobs();
  if (name === 'finance') renderExpenses();
}

// ═══════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('ariq_settings') || '{}');
    appSettings = { ...appSettings, ...s };
    const el = (id) => document.getElementById(id);
    if (el('sShopName'))   el('sShopName').value   = appSettings.shopName || '';
    if (el('sShopPhone'))  el('sShopPhone').value  = appSettings.shopPhone || '';
    if (el('sHourlyRate')) el('sHourlyRate').value  = appSettings.hourlyRate || 110;
    if (el('sApiKey'))     el('sApiKey').value      = appSettings.apiKey || '';
    updateHeaderShopName();
  } catch(e) {}
}

function saveSettings() {
  appSettings.shopName   = esc(document.getElementById('sShopName').value.trim());
  appSettings.shopPhone  = esc(document.getElementById('sShopPhone').value.trim());
  appSettings.hourlyRate = Math.max(50, Math.min(300, parseFloat(document.getElementById('sHourlyRate').value) || 110));
  appSettings.apiKey     = document.getElementById('sApiKey').value.trim();
  localStorage.setItem('ariq_settings', JSON.stringify(appSettings));
  if (appSettings.apiKey) localStorage.setItem('ariq_apikey', appSettings.apiKey);
  updateHeaderShopName();
  alert('Settings saved!');
}

function updateHeaderShopName() {
  const el = document.getElementById('headerShopName');
  if (el) el.textContent = appSettings.shopName || 'AI Auto Repair Hub';
}

function resetApp() {
  if (!confirm('Reset ALL AutoRepairIQ Pro data?')) return;
  Object.keys(localStorage).filter(k => k.startsWith('ariq_')).forEach(k => localStorage.removeItem(k));
  location.reload();
}

// ═══════════════════════════════════════
//  DROPDOWNS
// ═══════════════════════════════════════
function populateYearDropdowns() {
  ['gYear', 'estYear'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    for (let y = 2026; y >= 2005; y--) {
      const o = document.createElement('option'); o.value = y; o.textContent = y; sel.appendChild(o);
    }
  });
}

function wireModelDropdowns() {
  const pairs = [['gMake', 'gModel'], ['estMake', 'estModel']];
  pairs.forEach(([makeId, modelId]) => {
    const makeSel = document.getElementById(makeId);
    if (!makeSel) return;
    makeSel.addEventListener('change', function() {
      const modelSel = document.getElementById(modelId);
      modelSel.innerHTML = '<option value="">— Select Model —</option>';
      (vehicleModels[this.value] || []).forEach(m => {
        const o = document.createElement('option'); o.textContent = m; modelSel.appendChild(o);
      });
    });
  });
}

function wireCategoryDropdown() {
  const catSel = document.getElementById('estCategory');
  if (!catSel) return;
  catSel.addEventListener('change', function() {
    const repSel = document.getElementById('estRepair');
    repSel.innerHTML = '<option value="">— Select Repair —</option>';
    Object.keys(repairs[this.value] || {}).forEach(r => {
      const o = document.createElement('option'); o.textContent = r; repSel.appendChild(o);
    });
  });
}

// ═══════════════════════════════════════
//  GARAGE (Vehicles)
// ═══════════════════════════════════════
function addVehicle() {
  const year = document.getElementById('gYear').value;
  const make = document.getElementById('gMake').value;
  const model = document.getElementById('gModel').value;
  const mileage = document.getElementById('gMileage').value.trim();
  const vin = document.getElementById('gVin').value.trim();

  if (!year || !make || !model) { alert('Select year, make, and model.'); return; }

  const vehicles = JSON.parse(localStorage.getItem('ariq_vehicles') || '[]');
  vehicles.unshift({ id: Date.now(), year, make, model, mileage, vin, logs: [] });
  localStorage.setItem('ariq_vehicles', JSON.stringify(vehicles));

  document.getElementById('gYear').value = '';
  document.getElementById('gMake').value = '';
  document.getElementById('gModel').innerHTML = '<option value="">— Select Make —</option>';
  document.getElementById('gMileage').value = '';
  document.getElementById('gVin').value = '';

  renderGarage();
}

function renderGarage() {
  const vehicles = JSON.parse(localStorage.getItem('ariq_vehicles') || '[]');
  const list = document.getElementById('vehiclesList');
  if (!list) return;

  if (!vehicles.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🚗</div>No vehicles yet. Add one above to start tracking.</div>';
    return;
  }

  list.innerHTML = vehicles.map((v, i) => {
    const desc = `${v.year} ${v.make} ${v.model}`;
    const logs = v.logs || [];
    const lastLog = logs[0];
    return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <h3 style="margin-bottom:0.2rem">${esc(desc)}</h3>
          ${v.mileage ? `<div style="font-size:0.78rem;color:var(--muted)">${esc(v.mileage)} mi</div>` : ''}
          ${v.vin ? `<div style="font-size:0.72rem;color:var(--muted);font-family:monospace">VIN: ${esc(v.vin)}</div>` : ''}
        </div>
        <button style="background:none;border:none;color:var(--red);cursor:pointer;font-size:0.9rem" onclick="deleteVehicle(${i})" title="Remove">✕</button>
      </div>
      ${lastLog ? `<div style="font-size:0.78rem;color:var(--muted);margin-top:0.5rem">Last service: ${esc(lastLog.type)} (${esc(lastLog.date)})</div>` : ''}
      <div class="btn-row" style="margin-top:0.6rem">
        <button class="btn-ghost" onclick="addMaintenanceLog(${i})">+ Log Service</button>
        <button class="btn-ghost" onclick="scanFromGarage(${i})">📸 Scan Damage</button>
      </div>
    </div>`;
  }).join('');
}

function deleteVehicle(idx) {
  if (!confirm('Remove this vehicle?')) return;
  const vehicles = JSON.parse(localStorage.getItem('ariq_vehicles') || '[]');
  vehicles.splice(idx, 1);
  localStorage.setItem('ariq_vehicles', JSON.stringify(vehicles));
  renderGarage();
}

function addMaintenanceLog(vIdx) {
  const type = prompt('Service type (e.g. Oil Change, Brake Pads, Tire Rotation):');
  if (!type) return;
  const cost = prompt('Cost ($):') || '0';

  const vehicles = JSON.parse(localStorage.getItem('ariq_vehicles') || '[]');
  if (!vehicles[vIdx]) return;
  if (!vehicles[vIdx].logs) vehicles[vIdx].logs = [];
  vehicles[vIdx].logs.unshift({
    type: type.trim(),
    cost: parseFloat(cost) || 0,
    date: new Date().toLocaleDateString(),
  });
  localStorage.setItem('ariq_vehicles', JSON.stringify(vehicles));
  renderGarage();
}

function scanFromGarage(vIdx) {
  const vehicles = JSON.parse(localStorage.getItem('ariq_vehicles') || '[]');
  const v = vehicles[vIdx];
  if (!v) return;
  document.getElementById('scanYear').value = v.year || '';
  document.getElementById('scanMake').value = v.make || '';
  document.getElementById('scanModel').value = v.model || '';
  openTab('scan');
}

// ═══════════════════════════════════════
//  SCAN (Photo Pipeline)
// ═══════════════════════════════════════
function scanTapPhoto(slot) {
  if (scanPhotos[slot]) { scanClearPhoto(slot); return; }
  if (navigator.mediaDevices?.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false
    }).then(stream => {
      scanStreams[slot] = stream;
      const vid = document.getElementById('photoVideo' + slot);
      vid.srcObject = stream; vid.style.display = 'block';
      document.getElementById('camCapture' + slot).style.display = 'block';
      document.getElementById('photoPlaceholder' + slot).style.display = 'none';
    }).catch(() => document.getElementById('photoFile' + slot).click());
  } else {
    document.getElementById('photoFile' + slot).click();
  }
}

function scanCapture(slot) {
  const vid = document.getElementById('photoVideo' + slot);
  const canvas = document.getElementById('photoCanvas' + slot);
  canvas.width = vid.videoWidth || 640;
  canvas.height = vid.videoHeight || 480;
  canvas.getContext('2d').drawImage(vid, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  scanStopCamera(slot);
  setScanPhoto(slot, dataUrl);
}

function scanStopCamera(slot) {
  if (scanStreams[slot]) {
    scanStreams[slot].getTracks().forEach(t => t.stop());
    scanStreams[slot] = null;
  }
  const vid = document.getElementById('photoVideo' + slot);
  if (vid) { vid.srcObject = null; vid.style.display = 'none'; }
  document.getElementById('camCapture' + slot).style.display = 'none';
  document.getElementById('photoPlaceholder' + slot).style.display = 'flex';
}

function scanFileChange(event, slot) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => setScanPhoto(slot, ev.target.result);
  reader.readAsDataURL(file);
  event.target.value = '';
}

function setScanPhoto(slot, dataUrl) {
  scanPhotos[slot] = dataUrl;
  const preview = document.getElementById('photoPreview' + slot);
  const placeholder = document.getElementById('photoPlaceholder' + slot);
  const clearBtn = document.getElementById('photoClear' + slot);
  if (preview) { preview.src = dataUrl; preview.style.display = 'block'; }
  if (placeholder) placeholder.style.display = 'none';
  if (clearBtn) clearBtn.style.display = 'block';
}

function scanClearPhoto(slot) {
  scanPhotos[slot] = null;
  const preview = document.getElementById('photoPreview' + slot);
  const placeholder = document.getElementById('photoPlaceholder' + slot);
  const clearBtn = document.getElementById('photoClear' + slot);
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  if (placeholder) placeholder.style.display = 'flex';
  if (clearBtn) clearBtn.style.display = 'none';
}

// ── Scan Pipeline (client-side via Claude API) ──
const SCAN_STEPS = ['intake', 'vision', 'parts', 'pricing', 'decision'];
function setScanStep(stepId) {
  const idx = SCAN_STEPS.indexOf(stepId);
  SCAN_STEPS.forEach((s, i) => {
    const el = document.getElementById('step-' + s);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (i < idx) el.classList.add('done');
    else if (i === idx) el.classList.add('active');
  });
}

async function runScanPipeline() {
  const photos = scanPhotos.filter(Boolean);
  if (!photos.length) { showError('scanError', 'Add at least one photo.'); return; }

  const year = document.getElementById('scanYear').value.trim();
  const make = document.getElementById('scanMake').value.trim();
  const model = document.getElementById('scanModel').value.trim();
  if (!year || !make || !model) { showError('scanError', 'Enter vehicle year, make, and model.'); return; }

  const apiKey = appSettings.apiKey || localStorage.getItem('ariq_apikey') || '';
  const demoMode = !apiKey;

  clearError('scanError');
  document.getElementById('scanResults').classList.remove('visible');
  const btn = document.getElementById('scanAnalyzeBtn');
  btn.disabled = true; btn.textContent = '🔍 Analyzing…';

  const vehicle = { year, make, model };

  try {
    if (demoMode) {
      // Demo pipeline
      for (const s of SCAN_STEPS) {
        setScanStep(s);
        await new Promise(r => setTimeout(r, 500 + Math.random() * 200));
      }
      currentScanResult = getDemoScanResult();
    } else {
      // Real pipeline — client-side Claude calls
      setScanStep('intake');
      await tick();

      // Build image content blocks
      const imageBlocks = photos.map(dataUrl => {
        const [meta, data] = dataUrl.split(',');
        const mediaType = meta.match(/image\/(jpeg|png|webp)/)?.[0] || 'image/jpeg';
        return { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
      });

      // Step 1: Vision
      setScanStep('vision');
      const visionRaw = await ClaudeAPI.call(apiKey, {
        model: 'claude-sonnet-4-6', max_tokens: 800,
        system: 'You are an expert automotive damage assessor. Identify damaged panel, damage type, severity. Return ONLY valid JSON.',
        messages: [{ role: 'user', content: [...imageBlocks, {
          type: 'text',
          text: `Analyze damage on this ${year} ${make} ${model}. Return JSON: {"primary_part":"","damage_type":"","severity":"minor|moderate|severe","secondary_damage":[],"photo_quality":"good|fair|poor","raw_description":""}`
        }]}],
      });
      const visionText = visionRaw.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '{}';
      const visionResult = JSON.parse(visionText.match(/\{[\s\S]*\}/)?.[0] || '{}');

      // Step 2: Parts
      setScanStep('parts');
      const partsRaw = await ClaudeAPI.call(apiKey, {
        model: 'claude-sonnet-4-6', max_tokens: 600,
        system: 'Map damage to repair line items. Return ONLY JSON array.',
        messages: [{ role: 'user', content: `${year} ${make} ${model}. Damage: ${visionResult.primary_part} — ${visionResult.damage_type} (${visionResult.severity}). Return JSON array: [{"part_name":"","repair_action":"replace|repair|refinish","parts_source":"OEM|aftermarket","quantity":1}]` }],
      });
      const partsText = partsRaw.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '[]';
      const partsResult = JSON.parse(partsText.match(/\[[\s\S]*\]/)?.[0] || '[]');

      // Step 3: Pricing
      setScanStep('pricing');
      const pricingRaw = await ClaudeAPI.call(apiKey, {
        model: 'claude-sonnet-4-6', max_tokens: 700,
        system: 'Certified auto estimator. Hawaii rates $110-150/hr. Return ONLY valid JSON.',
        messages: [{ role: 'user', content: `Cost estimate for ${year} ${make} ${model}.\nParts: ${JSON.stringify(partsResult)}\nReturn JSON: {"parts":{"low":N,"mid":N,"high":N},"labor":{"hours":N,"rate":110,"low":N,"mid":N,"high":N},"paint":{"low":N,"mid":N,"high":N},"total":{"low":N,"mid":N,"high":N}}` }],
      });
      const pricingText = pricingRaw.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '{}';
      const pricingResult = JSON.parse(pricingText.match(/\{[\s\S]*\}/)?.[0] || '{}');

      // Step 4: Decision
      setScanStep('decision');
      const decisionRaw = await ClaudeAPI.call(apiKey, {
        model: 'claude-sonnet-4-6', max_tokens: 500,
        system: 'Senior QA manager. Score confidence 0-100. Return ONLY JSON.',
        messages: [{ role: 'user', content: `Review: Vision=${JSON.stringify(visionResult)}, Parts=${JSON.stringify(partsResult)}, Pricing=${JSON.stringify(pricingResult)}. Return JSON: {"confidence_score":N,"human_review_flag":bool,"executive_summary":"","disclaimer":"Preliminary estimate."}` }],
      });
      const decisionText = decisionRaw.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '{}';
      const decisionResult = JSON.parse(decisionText.match(/\{[\s\S]*\}/)?.[0] || '{}');

      currentScanResult = { vision: visionResult, parts_map: partsResult, pricing: pricingResult, decision: decisionResult, vehicle };
    }

    renderScanResults(currentScanResult);
    document.getElementById('scanResults').classList.add('visible');

  } catch(e) {
    showError('scanError', e.status === 401 ? 'Invalid API key.' : `Scan failed: ${e.message}`);
  } finally {
    btn.disabled = false; btn.textContent = '🔍 Analyze Damage';
  }
}

function getDemoScanResult() {
  return {
    vision: { primary_part: 'driver-side front fender', damage_type: 'dent', severity: 'moderate', secondary_damage: ['door edge scratch'], photo_quality: 'good', raw_description: 'Visible 8-inch dent on fender with paint cracking.' },
    parts_map: [
      { part_name: 'Front Fender Panel — Driver', repair_action: 'replace', parts_source: 'aftermarket', quantity: 1 },
      { part_name: 'Driver Door Outer Panel', repair_action: 'refinish', parts_source: 'n/a', quantity: 1 },
    ],
    pricing: { parts: { low: 280, mid: 340, high: 420 }, labor: { hours: 4.5, rate: 110, low: 440, mid: 495, high: 560 }, paint: { low: 180, mid: 220, high: 280 }, total: { low: 900, mid: 1055, high: 1260 } },
    decision: { confidence_score: 82, human_review_flag: false, executive_summary: 'Moderate fender replacement + door refinish. $900–$1,260.', disclaimer: 'Preliminary estimate only.' },
    vehicle: { year: document.getElementById('scanYear').value, make: document.getElementById('scanMake').value, model: document.getElementById('scanModel').value },
  };
}

function renderScanResults(result) {
  const v = result.vision || {};
  const p = result.pricing || {};
  const d = result.decision || {};
  const fmt = n => '$' + Number(n || 0).toLocaleString();

  document.getElementById('scanResultTitle').textContent = v.primary_part || 'Damage Assessment';
  const sevEl = document.getElementById('scanSeverity');
  sevEl.textContent = v.severity || '—';
  sevEl.className = 'severity-badge sev-' + (v.severity || 'unknown');

  document.getElementById('scanSummary').textContent = d.executive_summary || v.raw_description || '';
  document.getElementById('scanCostParts').textContent = p.parts ? `${fmt(p.parts.low)}–${fmt(p.parts.high)}` : '—';
  document.getElementById('scanCostLabor').textContent = p.labor ? `${fmt(p.labor.low)}–${fmt(p.labor.high)}` : '—';
  document.getElementById('scanCostTotal').textContent = p.total ? `${fmt(p.total.low)}–${fmt(p.total.high)}` : '—';
  document.getElementById('scanConfidence').textContent = d.confidence_score ? `Confidence: ${d.confidence_score}/100${d.human_review_flag ? ' — Human Review Recommended' : ''}` : '';

  const partsWrap = document.getElementById('scanPartsListWrap');
  const parts = result.parts_map || [];
  partsWrap.innerHTML = parts.map(pt => `
    <div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid rgba(30,45,74,0.3);font-size:0.84rem">
      <span>${esc(pt.part_name)}</span>
      <span style="color:var(--accent);font-weight:700;font-size:0.78rem">${esc(pt.repair_action)}</span>
    </div>`).join('');
}

function saveScanAsJob() {
  if (!currentScanResult) return;
  const p = currentScanResult.pricing || {};
  const v = currentScanResult.vehicle || {};
  const jobs = JSON.parse(localStorage.getItem('ariq_jobs') || '[]');
  jobs.unshift({
    id: Date.now(),
    clientName: 'Scan',
    year: v.year, make: v.make, model: v.model,
    repairName: currentScanResult.vision?.primary_part || 'Damage Repair',
    totalMin: p.total?.low || 0,
    totalMax: p.total?.high || 0,
    status: 'estimate',
    date: new Date().toLocaleDateString(),
    source: 'scan',
  });
  localStorage.setItem('ariq_jobs', JSON.stringify(jobs.slice(0, 50)));
  alert('Saved to Jobs!');
}

function exportScanReport() {
  if (!currentScanResult) return;
  const r = currentScanResult;
  const v = r.vehicle || {};
  const p = r.pricing || {};
  const d = r.decision || {};
  const vis = r.vision || {};
  const ts = new Date().toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' });

  const report = `AUTOREPAIRIQ PRO — DAMAGE ASSESSMENT
Generated: ${ts} (Hawaii Time)
${'─'.repeat(44)}
VEHICLE: ${v.year} ${v.make} ${v.model}
DAMAGE: ${vis.primary_part} — ${vis.damage_type} (${vis.severity})
${vis.raw_description || ''}

COST ESTIMATE
  Parts: $${p.parts?.low || 0} – $${p.parts?.high || 0}
  Labor: $${p.labor?.low || 0} – $${p.labor?.high || 0}
  Total: $${p.total?.low || 0} – $${p.total?.high || 0}

Confidence: ${d.confidence_score || '—'}/100
${d.disclaimer || 'Preliminary estimate only.'}

— AutoRepairIQ Pro · Pearl City, Hawaii
`;

  const blob = new Blob([report], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `autorepairiq-scan-${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}

// ═══════════════════════════════════════
//  ESTIMATE (AI + Lookup)
// ═══════════════════════════════════════
async function runAiEstimate() {
  const desc = document.getElementById('estJobDesc').value.trim();
  const year = document.getElementById('estYear').value;
  const make = document.getElementById('estMake').value;
  const model = document.getElementById('estModel').value;

  if (!desc) { showError('estimateError', 'Describe the job first.'); return; }

  const apiKey = appSettings.apiKey || localStorage.getItem('ariq_apikey') || '';
  if (!apiKey) { showError('estimateError', 'Add your Claude API key in Settings for AI estimates.'); return; }

  clearError('estimateError');
  const btn = document.getElementById('aiEstimateBtn');
  btn.disabled = true; btn.textContent = '✦ Generating…';

  const vehicleStr = [year, make, model].filter(Boolean).join(' ') || 'vehicle unspecified';
  const rate = appSettings.hourlyRate || 110;

  try {
    const data = await ClaudeAPI.call(apiKey, {
      model: 'claude-sonnet-4-6', max_tokens: 600,
      system: 'You are RepairIQ, an AI for auto repair shops. Return ONLY valid JSON.',
      messages: [{ role: 'user', content: `Shop rate: $${rate}/hr. Vehicle: ${vehicleStr}. Job: "${desc}"\nReturn JSON: {"repair_name":"<title>","labor_hours_min":N,"labor_hours_max":N,"parts_cost_min":N,"parts_cost_max":N,"notes":"<1-2 sentences>"}` }],
    });

    const raw = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '{}';
    const result = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}');

    const laborMin = Math.round(result.labor_hours_min * rate);
    const laborMax = Math.round(result.labor_hours_max * rate);

    currentEstimate = {
      clientName: document.getElementById('estClientName').value.trim() || 'Walk-in',
      year, make, model,
      repairName: result.repair_name || desc.slice(0, 60),
      laborHrsMin: result.labor_hours_min, laborHrsMax: result.labor_hours_max,
      partsMin: result.parts_cost_min, partsMax: result.parts_cost_max,
      laborMin, laborMax,
      totalMin: laborMin + result.parts_cost_min,
      totalMax: laborMax + result.parts_cost_max,
      notes: result.notes || '', source: 'ai',
      date: new Date().toLocaleDateString(),
    };

    document.getElementById('estAiSummary').innerHTML = result.notes
      ? `<div class="ai-summary"><div class="ai-indicator">✦ AI Note</div>${esc(result.notes)}</div>` : '';
    renderEstimateResults();
  } catch(e) {
    showError('estimateError', e.status === 401 ? 'Invalid API key.' : `AI failed: ${e.message}`);
  } finally {
    btn.disabled = false; btn.textContent = '✦ Generate AI Estimate →';
  }
}

function runLookupEstimate() {
  const category = document.getElementById('estCategory').value;
  const repair = document.getElementById('estRepair').value;
  if (!category || !repair) { showError('estimateError', 'Select category and repair.'); return; }

  clearError('estimateError');
  const data = repairs[category]?.[repair];
  if (!data) { showError('estimateError', 'Repair not found.'); return; }

  const year = document.getElementById('estYear').value;
  const make = document.getElementById('estMake').value;
  const model = document.getElementById('estModel').value;
  const rate = appSettings.hourlyRate || 110;
  const laborMin = Math.round(data.labor[0] * rate);
  const laborMax = Math.round(data.labor[1] * rate);

  document.getElementById('estAiSummary').innerHTML = '';
  currentEstimate = {
    clientName: document.getElementById('estClientName').value.trim() || 'Walk-in',
    year, make, model,
    repairName: repair,
    laborHrsMin: data.labor[0], laborHrsMax: data.labor[1],
    partsMin: data.indie[0], partsMax: data.indie[1],
    laborMin, laborMax,
    totalMin: laborMin + data.indie[0], totalMax: laborMax + data.indie[1],
    notes: '', source: 'lookup',
    date: new Date().toLocaleDateString(),
  };
  renderEstimateResults();
}

function renderEstimateResults() {
  const e = currentEstimate;
  const fmt = n => '$' + n.toLocaleString();
  const vehicleStr = [e.year, e.make, e.model].filter(Boolean).join(' ');

  document.getElementById('estResultTitle').textContent = e.repairName + (vehicleStr ? ' — ' + vehicleStr : '');
  document.getElementById('estCostLabor').textContent = e.laborMin === e.laborMax ? fmt(e.laborMin) : `${fmt(e.laborMin)}–${fmt(e.laborMax)}`;
  document.getElementById('estCostParts').textContent = e.partsMin === 0 && e.partsMax === 0 ? 'N/A' : `${fmt(e.partsMin)}–${fmt(e.partsMax)}`;
  document.getElementById('estCostTotal').textContent = `${fmt(e.totalMin)}–${fmt(e.totalMax)}`;
  document.getElementById('estLaborNote').innerHTML = `⏱ Labor: <strong>${e.laborHrsMin}–${e.laborHrsMax} hrs</strong> · Rate: <strong>$${appSettings.hourlyRate || 110}/hr</strong>`;
  document.getElementById('estResultsPanel').classList.add('visible');
}

function saveEstimateAsJob() {
  if (!currentEstimate) return;
  const jobs = JSON.parse(localStorage.getItem('ariq_jobs') || '[]');
  jobs.unshift({ id: Date.now(), ...currentEstimate, status: 'estimate' });
  localStorage.setItem('ariq_jobs', JSON.stringify(jobs.slice(0, 50)));
  alert('Job saved!');
}

function shareEstimateQuote() {
  if (!currentEstimate) return;
  const e = currentEstimate;
  const fmt = n => '$' + n.toLocaleString();
  const shop = appSettings.shopName || 'AutoRepairIQ Pro';
  const vehicle = [e.year, e.make, e.model].filter(Boolean).join(' ') || 'Vehicle';
  const text = `REPAIR ESTIMATE — ${shop}\nClient: ${e.clientName}\nVehicle: ${vehicle}\nJob: ${e.repairName}\nTotal: ${fmt(e.totalMin)}–${fmt(e.totalMax)}\n${e.date}`;

  if (navigator.share) {
    navigator.share({ title: 'Repair Estimate', text });
  } else {
    navigator.clipboard?.writeText(text).then(() => alert('Quote copied!'));
  }
}

// ═══════════════════════════════════════
//  JOBS
// ═══════════════════════════════════════
const statusLabels = { estimate: 'Estimate', 'in-progress': 'In Progress', done: 'Done', invoiced: 'Invoiced' };
const statusNext = { estimate: 'in-progress', 'in-progress': 'done', done: 'invoiced', invoiced: 'estimate' };
const statusClass = { estimate: 's-estimate', 'in-progress': 's-in-progress', done: 's-done', invoiced: 's-invoiced' };

function renderJobs() {
  const jobs = JSON.parse(localStorage.getItem('ariq_jobs') || '[]');
  const list = document.getElementById('jobsList');
  if (!list) return;

  if (!jobs.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div>No jobs yet. Run an estimate and save it.</div>';
    return;
  }

  const fmt = n => '$' + n.toLocaleString();
  list.innerHTML = jobs.map((j, i) => {
    const vehicle = [j.year, j.make, j.model].filter(Boolean).join(' ') || 'Unknown';
    return `
    <div class="job-card">
      <div class="job-card-top">
        <div>
          <div class="job-client">${esc(j.clientName)}</div>
          <div class="job-vehicle">${esc(vehicle)}</div>
          <div class="job-repair">${esc(j.repairName)}</div>
        </div>
        <div class="job-total">${fmt(j.totalMin)}–${fmt(j.totalMax)}</div>
      </div>
      <div class="job-footer">
        <span class="job-date">${esc(j.date)}</span>
        <button class="status-btn ${statusClass[j.status]}" onclick="cycleJobStatus(${i})">${statusLabels[j.status]}</button>
        <button style="background:none;border:none;color:var(--red);cursor:pointer;font-size:0.85rem" onclick="deleteJob(${i})">✕</button>
      </div>
    </div>`;
  }).join('');
}

function cycleJobStatus(idx) {
  const jobs = JSON.parse(localStorage.getItem('ariq_jobs') || '[]');
  if (!jobs[idx]) return;
  jobs[idx].status = statusNext[jobs[idx].status] || 'estimate';
  localStorage.setItem('ariq_jobs', JSON.stringify(jobs));
  renderJobs();
}

function deleteJob(idx) {
  const jobs = JSON.parse(localStorage.getItem('ariq_jobs') || '[]');
  jobs.splice(idx, 1);
  localStorage.setItem('ariq_jobs', JSON.stringify(jobs));
  renderJobs();
}

// ═══════════════════════════════════════
//  FINANCE
// ═══════════════════════════════════════
function addExpense() {
  const category = document.getElementById('expCategory').value;
  const amount = parseFloat(document.getElementById('expAmount').value) || 0;
  const desc = document.getElementById('expDesc').value.trim();

  if (amount <= 0) { alert('Enter a valid amount.'); return; }

  const expenses = JSON.parse(localStorage.getItem('ariq_expenses') || '[]');
  expenses.unshift({
    id: Date.now(), category, amount, description: desc,
    date: new Date().toLocaleDateString(), invoiced: false,
  });
  localStorage.setItem('ariq_expenses', JSON.stringify(expenses));

  document.getElementById('expAmount').value = '';
  document.getElementById('expDesc').value = '';
  renderExpenses();
}

function renderExpenses() {
  const expenses = JSON.parse(localStorage.getItem('ariq_expenses') || '[]');
  const list = document.getElementById('expensesList');
  const totalEl = document.getElementById('financeTotal');
  if (!list) return;

  if (!expenses.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💰</div>No expenses yet.</div>';
    if (totalEl) totalEl.textContent = '$0';
    return;
  }

  const fmt = n => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2 });
  let total = 0;
  list.innerHTML = expenses.slice(0, 50).map((e, i) => {
    total += e.amount;
    return `
    <div class="expense-row">
      <div>
        <div>${esc(e.description || e.category)}</div>
        <div class="expense-cat">${esc(e.category)} · ${esc(e.date)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem">
        <span class="expense-amount">${fmt(e.amount)}</span>
        <button style="background:none;border:none;color:var(--red);cursor:pointer;font-size:0.8rem" onclick="deleteExpense(${i})">✕</button>
      </div>
    </div>`;
  }).join('');

  if (totalEl) totalEl.textContent = fmt(total);
}

function deleteExpense(idx) {
  const expenses = JSON.parse(localStorage.getItem('ariq_expenses') || '[]');
  expenses.splice(idx, 1);
  localStorage.setItem('ariq_expenses', JSON.stringify(expenses));
  renderExpenses();
}

function clearExpenses() {
  if (!confirm('Clear all expenses?')) return;
  localStorage.removeItem('ariq_expenses');
  renderExpenses();
}

function exportExpensesCSV() {
  const expenses = JSON.parse(localStorage.getItem('ariq_expenses') || '[]');
  if (!expenses.length) { alert('No expenses to export.'); return; }

  let csv = 'Date,Category,Description,Amount,Invoiced\n';
  expenses.forEach(e => {
    csv += `"${e.date}","${e.category}","${(e.description || '').replace(/"/g, '""')}","${e.amount.toFixed(2)}","${e.invoiced ? 'Yes' : 'No'}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `autorepairiq-expenses-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}

// ═══════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('visible'); }
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('visible');
}

function tick() { return new Promise(r => setTimeout(r, 60)); }
