// app.js — RepairPro main controller
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
  if (name === 'coach') coachRenderThread();
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
  if (!confirm('Reset ALL RepairPro data?')) return;
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
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🚗</div><strong>No vehicles in the garage yet</strong>Add a customer vehicle above to start service history, scans, and quotes.</div>';
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
// #ASSUMPTION: @capacitor/camera is available when running in Capacitor wrapper
async function scanTapPhoto(slot) {
  if (scanPhotos[slot]) { scanClearPhoto(slot); return; }
  await _openNativeCamera(slot);
}

// Open rear camera via Capacitor Camera plugin (native Android camera app)
// Falls back to file picker on web/PWA
async function _openNativeCamera(slot) {
  if (window.Capacitor?.isNativePlatform()) {
    await _capCamera(slot, 'CAMERA');
  } else {
    // PWA fallback — getUserMedia with rear cam preference
    _openWebCamera(slot);
  }
}

async function _capCamera(slot, source) {
  try {
    const { Camera, CameraResultType, CameraSource, CameraDirection } = await import(
      'https://unpkg.com/@capacitor/camera/dist/esm/index.js'
    ).catch(() => window.CapacitorCamera || {});

    // Use Capacitor.Plugins which is injected by the native bridge
    const CamPlugin = window.Capacitor?.Plugins?.Camera;
    if (!CamPlugin) { _openWebCamera(slot); return; }

    const result = await CamPlugin.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: 'base64',          // get base64 directly
      source: source,                // 'CAMERA' or 'PHOTOS'
      direction: 'REAR',             // force rear camera
      presentationStyle: 'fullscreen',
      saveToGallery: false,
    });

    if (result?.base64String) {
      const dataUrl = 'data:image/jpeg;base64,' + result.base64String;
      setScanPhoto(slot, dataUrl);
    }
  } catch (e) {
    if (e?.message?.includes('cancelled') || e?.message?.includes('cancel')) return;
    // Permission denied or other error — fall back to file picker
    document.getElementById('photoFile' + slot).click();
  }
}

function _openWebCamera(slot) {
  if (!navigator.mediaDevices?.getUserMedia) {
    document.getElementById('photoFile' + slot).click();
    return;
  }
  navigator.mediaDevices.getUserMedia({
    video: { facingMode: { exact: 'environment' }, width: { ideal: 1280 } }, audio: false,
  }).catch(() =>
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
  ).then(stream => {
    scanStreams[slot] = stream;
    const vid = document.getElementById('photoVideo' + slot);
    vid.srcObject = stream; vid.style.display = 'block';
    document.getElementById('camCapture' + slot).style.display = 'block';
    document.getElementById('camGallery' + slot).style.display = 'block';
    document.getElementById('photoPlaceholder' + slot).style.display = 'none';
  }).catch(() => document.getElementById('photoFile' + slot).click());
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
  document.getElementById('camGallery' + slot).style.display = 'none';
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
  const zone = document.getElementById('photoZone' + slot);
  if (preview) { preview.src = dataUrl; preview.style.display = 'block'; }
  if (placeholder) placeholder.style.display = 'none';
  if (clearBtn) clearBtn.style.display = 'block';
  if (zone) zone.classList.add('has-photo');
  // Auto-identify the part from the captured photo
  if (typeof partIdentifier !== 'undefined') partIdentifier.identify(dataUrl);
}

function scanClearPhoto(slot) {
  scanPhotos[slot] = null;
  const preview = document.getElementById('photoPreview' + slot);
  const placeholder = document.getElementById('photoPlaceholder' + slot);
  const clearBtn = document.getElementById('photoClear' + slot);
  const zone = document.getElementById('photoZone' + slot);
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  if (placeholder) placeholder.style.display = 'flex';
  if (clearBtn) clearBtn.style.display = 'none';
  if (zone) zone.classList.remove('has-photo');
}

// ── Scan Pipeline (client-side via Claude API) ──
const SCAN_STEPS = ['intake', 'vision', 'parts', 'pricing', 'decision'];
const KEOKI_MSGS = {
  intake:   '<strong>Keoki</strong> on it 🔍<br>Prepping your vehicle profile…',
  vision:   '<strong>Keoki</strong> scanning 👁️<br>Claude Vision is reading the damage…',
  parts:    '<strong>Keoki</strong> parts check 🔩<br>Mapping damage to repair line items…',
  pricing:  '<strong>Keoki</strong> crunching 💰<br>Hawaii rate estimate: $110–150/hr…',
  decision: '<strong>Keoki</strong> QA review ✅<br>Confidence scoring + final check…',
  done:     '<strong>Keoki</strong> done! 🤙<br>Estimate ready — save it as a Job below.',
  error:    '<strong>Keoki</strong> hit a snag 😅<br>Check your API key or try again.',
  idle:     '<strong>Keoki</strong> here 🤙<br>Snap 1–2 photos of the damage. I\'ll run the full AI pipeline!',
};
function keokiSay(key) {
  const el = document.getElementById('keokiBubble');
  if (el) el.innerHTML = KEOKI_MSGS[key] || KEOKI_MSGS.idle;
}
function setScanStep(stepId) {
  const idx = SCAN_STEPS.indexOf(stepId);
  SCAN_STEPS.forEach((s, i) => {
    const el = document.getElementById('step-' + s);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (i < idx) el.classList.add('done');
    else if (i === idx) el.classList.add('active');
  });
  keokiSay(stepId);
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

      // Step 1: Vision — expert damage assessor with collision repair terminology
      setScanStep('vision');
      const vehicleDesc = `${year} ${make} ${model}`;
      const visionRaw = await ClaudeAPI.call(apiKey, {
        model: 'claude-sonnet-4-6', max_tokens: 800,
        system: `You are an expert automotive damage assessor with 20 years of collision repair experience. Analyze vehicle damage photos with clinical precision. Identify: (1) the exact damaged panel using standard collision repair terminology (front bumper cover, driver-side front fender, hood, door panel, mirror housing, headlight assembly, taillight assembly, windshield, quarter panel), (2) damage type: dent/crease/scratch/crack/tear/shatter/missing, (3) severity: minor/moderate/severe, (4) secondary damage on adjacent parts, (5) prior repair indicators. Never claim certainty when the photo is unclear. Use language like 'likely', 'possible', 'appears to be'. Return ONLY valid JSON.`,
        messages: [{ role: 'user', content: [...imageBlocks, {
          type: 'text',
          text: `Analyze the damage visible in ${photos.length > 1 ? 'these photos' : 'this photo'} of a ${vehicleDesc}.

Return ONLY this JSON:
{"primary_part":"<exact panel name in collision repair terminology>","damage_type":"<dent|crease|scratch|crack|tear|shatter|missing>","severity":"<minor|moderate|severe>","secondary_damage":["<part — damage type>"],"prior_repair_indicators":<true|false>,"photo_quality":"<good|fair|poor>","raw_description":"<2-3 sentence clinical description — use cautious language where clarity is limited>"}

Be precise. Use standard Mitchell/Audatex panel naming. Return ONLY JSON.`
        }]}],
      });
      const visionText = visionRaw.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '{}';
      const visionResult = JSON.parse(visionText.match(/\{[\s\S]*\}/)?.[0] || '{}');
      if (!visionResult.primary_part || !visionResult.damage_type) throw new Error('Vision analysis returned incomplete data');

      // Step 2: Parts — automotive parts specialist maps damage to line items
      setScanStep('parts');
      const partsRaw = await ClaudeAPI.call(apiKey, {
        model: 'claude-sonnet-4-6', max_tokens: 600,
        system: `You are an automotive parts specialist at a certified collision center. Map the damage description to specific repair line items. For each: part name, repair action (replace/repair/refinish/blend), parts source (OEM/aftermarket), quantity. Consider vehicle market segment for OEM vs aftermarket recommendation. Return ONLY valid JSON array.`,
        messages: [{ role: 'user', content: `Map the following collision damage to repair line items for a ${vehicleDesc}.

Damage assessment:
- Primary part: ${visionResult.primary_part}
- Damage type: ${visionResult.damage_type}
- Severity: ${visionResult.severity}
- Secondary damage: ${(visionResult.secondary_damage || []).join(', ') || 'none'}
- Prior repair indicators: ${visionResult.prior_repair_indicators ? 'yes' : 'no'}
- Description: ${visionResult.raw_description}

Return ONLY a JSON array:
[{"part_name":"<full part name>","repair_action":"<replace|repair|refinish|blend>","parts_source":"<OEM|aftermarket|n/a>","quantity":<number>,"notes":"<optional short note>"}]

Include all parts needing work. Consider: severe → replace; moderate → repair or replace; minor → repair or refinish. Luxury/late-model vehicles lean OEM. Return ONLY JSON array.` }],
      });
      const partsText = partsRaw.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '[]';
      const partsResult = JSON.parse(partsText.match(/\[[\s\S]*\]/)?.[0] || '[]');
      if (!Array.isArray(partsResult) || partsResult.length === 0) throw new Error('Parts mapping returned no items');

      // Step 3: Pricing — certified estimator with Hawaii rates
      setScanStep('pricing');
      const partsListText = partsResult.map((p, i) =>
        `${i + 1}. ${p.part_name} — ${p.repair_action} (${p.parts_source}, qty: ${p.quantity})${p.notes ? ' — ' + p.notes : ''}`
      ).join('\n');
      const pricingRaw = await ClaudeAPI.call(apiKey, {
        model: 'claude-sonnet-4-6', max_tokens: 700,
        system: `You are a certified automotive estimator. Generate repair cost estimates for the parts list. Provide low/mid/high ranges for: parts cost, labor (hours × rate $90–$150/hr Hawaii indie shops, default $110), paint materials. Base costs on vehicle year/make/model and damage severity. Return ONLY valid JSON.`,
        messages: [{ role: 'user', content: `Generate repair cost estimate for a ${vehicleDesc}.

Parts list:
${partsListText}

Return ONLY this JSON:
{"parts":{"low":<number>,"mid":<number>,"high":<number>},"labor":{"hours":<estimated total hours>,"rate":110,"low":<hours*90>,"mid":<hours*110>,"high":<hours*130>},"paint":{"low":<number>,"mid":<number>,"high":<number>},"total":{"low":<parts.low+labor.low+paint.low>,"mid":<parts.mid+labor.mid+paint.mid>,"high":<parts.high+labor.high+paint.high>},"line_items":[{"part_name":"<name>","parts_cost_mid":<number>,"labor_hours":<number>,"labor_cost_mid":<number>}]}

Ranges reflect shop/region variation. Return ONLY JSON.` }],
      });
      const pricingText = pricingRaw.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '{}';
      const pricingResult = JSON.parse(pricingText.match(/\{[\s\S]*\}/)?.[0] || '{}');
      if (!pricingResult.total?.mid) throw new Error('Pricing returned invalid totals');

      // Step 4: Decision — QA confidence score + human review flag
      setScanStep('decision');
      const decisionRaw = await ClaudeAPI.call(apiKey, {
        model: 'claude-sonnet-4-6', max_tokens: 500,
        system: `You are a senior QA manager at an insurance claims center. Review the full pipeline output. Score confidence 0-100. Set human_review_flag=true if confidence < 70, OR repair cost > $5000, OR photo quality is poor, OR prior repair indicators found. Write a one-sentence executive summary. Estimate realistic repair shop days. Return ONLY valid JSON.`,
        messages: [{ role: 'user', content: `Review this complete damage estimation pipeline output for a ${vehicleDesc}.

VISION: ${JSON.stringify(visionResult)}
PARTS: ${JSON.stringify(partsResult)}
PRICING: ${JSON.stringify(pricingResult)}

Evaluate consistency between agents, photo quality, severity alignment, pricing reasonableness, any red flags.

Return ONLY this JSON:
{"confidence_score":<0-100>,"human_review_flag":<true|false>,"review_reasons":["<reason if flagged>"],"executive_summary":"<one sentence: part, damage type, estimate range>","repair_days_min":<integer>,"repair_days_max":<integer>,"pipeline_warnings":["<inconsistencies>"],"disclaimer":"Preliminary estimate only. Visible damage assessed from photos. Hidden or mechanical damage requires physical inspection."}

Set human_review_flag=true if: confidence<70 OR total.high>5000 OR photo_quality=poor OR prior_repair_indicators=true. Return ONLY JSON.` }],
      });
      const decisionText = decisionRaw.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '{}';
      const decisionResult = JSON.parse(decisionText.match(/\{[\s\S]*\}/)?.[0] || '{}');
      // Local safety net for human review rules
      // #ASSUMPTION: Claude may miss edge cases — enforce programmatically
      if ((decisionResult.confidence_score || 0) < 70) decisionResult.human_review_flag = true;
      if ((pricingResult.total?.high || 0) > 5000) decisionResult.human_review_flag = true;
      if (visionResult.photo_quality === 'poor') decisionResult.human_review_flag = true;
      if (visionResult.prior_repair_indicators === true) decisionResult.human_review_flag = true;

      currentScanResult = { vision: visionResult, parts_map: partsResult, pricing: pricingResult, decision: decisionResult, vehicle };
    }

    renderScanResults(currentScanResult);
    document.getElementById('scanResults').classList.add('visible');
    keokiSay('done');

  } catch(e) {
    showError('scanError', e.status === 401 ? 'Invalid API key.' : `Scan failed: ${e.message}`);
    keokiSay('error');
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

— RepairPro · Pearl City, Hawaii
`;

  const blob = new Blob([report], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `repairpro-scan-${new Date().toISOString().slice(0,10)}.txt`;
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
  const shop = appSettings.shopName || 'RepairPro';
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
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><strong>No jobs saved yet</strong>Run a scan or create an estimate, then save it here to track shop status.</div>';
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
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💰</div><strong>No expenses logged yet</strong>Add shop costs here to keep parts, materials, and overhead visible.</div>';
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
  a.download = `repairpro-expenses-${new Date().toISOString().slice(0,10)}.csv`;
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

// ═══════════════════════════════════════
//  PART IDENTIFIER ZONE
// ═══════════════════════════════════════
// #ASSUMPTION: partIdentifier.js is loaded before app.js uses these fns
let _partIdStream = null;

async function partIdTapZone() {
  const preview = document.getElementById('partIdPreview');
  if (preview?.src && preview.style.display !== 'none') { partIdClear(); return; }

  if (navigator.mediaDevices?.getUserMedia) {
    try {
      _partIdStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false
      });
      const vid = document.getElementById('partIdVideo');
      vid.srcObject = _partIdStream;
      vid.style.display = 'block';
      document.getElementById('partIdPlaceholder').style.display = 'none';

      // Replace tap handler with capture
      const zone = document.getElementById('partIdZone');
      zone.onclick = partIdCapture;
      return;
    } catch(_) {}
  }
  document.getElementById('partIdFile').click();
}

function partIdCapture() {
  const vid = document.getElementById('partIdVideo');
  const canvas = document.getElementById('partIdCanvas');
  canvas.width = vid.videoWidth || 640;
  canvas.height = vid.videoHeight || 480;
  canvas.getContext('2d').drawImage(vid, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  _partIdStopCamera();
  _partIdSetPhoto(dataUrl);
  // Reset tap handler back
  document.getElementById('partIdZone').onclick = partIdTapZone;
}

function _partIdStopCamera() {
  if (_partIdStream) { _partIdStream.getTracks().forEach(t => t.stop()); _partIdStream = null; }
  const vid = document.getElementById('partIdVideo');
  if (vid) { vid.srcObject = null; vid.style.display = 'none'; }
}

function partIdFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => _partIdSetPhoto(ev.target.result);
  reader.readAsDataURL(file);
  event.target.value = '';
}

function _partIdSetPhoto(dataUrl) {
  const preview = document.getElementById('partIdPreview');
  const placeholder = document.getElementById('partIdPlaceholder');
  const clearBtn = document.getElementById('partIdClearBtn');
  if (preview) { preview.src = dataUrl; preview.style.display = 'block'; }
  if (placeholder) placeholder.style.display = 'none';
  if (clearBtn) clearBtn.style.display = 'block';
  if (typeof partIdentifier !== 'undefined') partIdentifier.identify(dataUrl);
}

function partIdClear() {
  _partIdStopCamera();
  const preview = document.getElementById('partIdPreview');
  const placeholder = document.getElementById('partIdPlaceholder');
  const clearBtn = document.getElementById('partIdClearBtn');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  if (placeholder) placeholder.style.display = 'flex';
  if (clearBtn) clearBtn.style.display = 'none';
  if (typeof partIdentifier !== 'undefined') partIdentifier.clearAll();
  document.getElementById('partIdZone').onclick = partIdTapZone;
}

function tick() { return new Promise(r => setTimeout(r, 60)); }

// ═══════════════════════════════════════
//  REPAIR COACH — AI diagnostic + price
//  Aloha from Pearl City! 🏝
// ═══════════════════════════════════════
// #ASSUMPTION: ClaudeAPI from api-client.js; falls back to demo if no key

const COACH_STORAGE = 'ariq_coach_history';
const COACH_SYSTEM = `You are a master ASE-certified automotive technician and repair cost advisor with 25 years of hands-on shop experience. You are coaching a vehicle owner to diagnose their problem and understand what it will cost to fix.

Your diagnostic coaching method — MANDATORY:
1. Ask ONE focused question at a time. Never ask multiple questions in one message.
2. Gather these details in order before giving a price: vehicle year/make/model → symptom description → when it started → severity/frequency → any warning lights → relevant history (recent repairs, mileage)
3. After 4-6 exchanges (once you have enough), deliver a PRICE ESTIMATE in this format:

**Most Likely Diagnosis:** [repair name]
**Confidence:** [High/Medium/Low]

**Price Breakdown:**
- Parts: $[low]–$[high]
- Labor: [X]–[Y] hrs @ $110–150/hr = $[low]–$[high]
- **Total: $[low]–$[high]** (indie shop, Hawaii)

**What to expect:** [2-3 sentences: what the repair involves, how urgent, DIY vs shop]

**⚠️ Could also be:** [1 alternative if applicable, with rough price difference]

Rules:
- Always ask about the vehicle first if not given
- Be direct about prices — give real ranges, not "it depends"
- Hawaii indie shop labor: $110–150/hr default
- If symptoms suggest multiple issues, address the most likely first
- Flag anything safety-critical immediately
- Keep non-price messages short: 1-2 sentences + the question`;

function coachGetHistory() {
  try { return JSON.parse(localStorage.getItem(COACH_STORAGE) || '[]'); } catch { return []; }
}
function coachSaveHistory(msgs) { localStorage.setItem(COACH_STORAGE, JSON.stringify(msgs)); }

function coachRenderThread() {
  const thread = document.getElementById('coachThread');
  if (!thread) return;
  const msgs = coachGetHistory();
  if (!msgs.length) {
    thread.innerHTML = `<div class="coach-msg assistant">
      <div class="coach-avatar">🔧</div>
      <div class="coach-bubble">Hey — I'm your RepairPro coach. Tell me what's going on with your vehicle and I'll ask a few quick questions, then give you a solid price range for the fix.</div>
    </div>`;
    return;
  }
  thread.innerHTML = msgs.map(m => `
    <div class="coach-msg ${m.role}">
      ${m.role === 'assistant' ? '<div class="coach-avatar">🔧</div>' : '<div class="coach-avatar">👤</div>'}
      <div class="coach-bubble">${esc(m.content).replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
    </div>
  `).join('');
  thread.scrollTop = thread.scrollHeight;
}

async function coachSend() {
  const input = document.getElementById('coachInput');
  const sendBtn = document.getElementById('coachSendBtn');
  const thread = document.getElementById('coachThread');
  const text = input?.value.trim();
  if (!text) return;

  const apiKey = appSettings.apiKey || localStorage.getItem('ariq_apikey') || '';
  if (!apiKey) {
    // demo nudge — still add user message then fake reply
    const msgs = coachGetHistory();
    msgs.push({ role: 'user', content: text });
    coachSaveHistory(msgs);
    if (input) input.value = '';
    coachRenderThread();
    // short demo reply
    setTimeout(() => {
      const dm = coachGetHistory();
      dm.push({ role: 'assistant', content: 'Add your Claude API key in Settings to activate the live coach. In demo mode I can\'t diagnose or price — but your real estimate tool is available in the Estimate tab.' });
      coachSaveHistory(dm);
      coachRenderThread();
    }, 600);
    return;
  }

  const msgs = coachGetHistory();
  msgs.push({ role: 'user', content: text });
  coachSaveHistory(msgs);
  if (input) input.value = '';
  coachRenderThread();

  // typing indicator
  const typingId = 'coachTyping_' + Date.now();
  if (thread) {
    thread.insertAdjacentHTML('beforeend', `
      <div class="coach-msg assistant" id="${typingId}">
        <div class="coach-avatar">🔧</div>
        <div class="coach-bubble"><div class="coach-typing"><span></span><span></span><span></span></div></div>
      </div>`);
    thread.scrollTop = thread.scrollHeight;
  }
  if (sendBtn) sendBtn.disabled = true;
  if (input) input.disabled = true;

  try {
    const apiMsgs = msgs.slice(-16).map(m => ({ role: m.role, content: m.content }));
    const res = await ClaudeAPI.call(apiKey, {
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: COACH_SYSTEM,
      messages: apiMsgs,
    });
    const reply = res.content?.[0]?.text || 'Something went wrong — try again.';
    document.getElementById(typingId)?.remove();
    msgs.push({ role: 'assistant', content: reply });
    coachSaveHistory(msgs);
    coachRenderThread();
  } catch (err) {
    document.getElementById(typingId)?.remove();
    const errMsg = err.status === 401
      ? 'Invalid API key — check Settings.'
      : err.circuitOpen
        ? 'Too many errors — wait a minute.'
        : `Coach error: ${err.message}`;
    msgs.push({ role: 'assistant', content: errMsg });
    coachSaveHistory(msgs);
    coachRenderThread();
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    if (input) { input.disabled = false; input.focus(); }
  }
}

function coachReset() {
  if (!confirm('Start a new diagnostic session?')) return;
  localStorage.removeItem(COACH_STORAGE);
  coachRenderThread();
}

// Wire Enter key for coach input
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('coachInput');
  inp?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); coachSend(); } });
  coachRenderThread();
});
