// partIdentifier.js — RepairPro Part Identification via Claude Vision
// Aloha from Pearl City! One photo in, part name out.
// Adapted from autoiq — uses ClaudeAPI (repairpro api-client namespace)

// #ASSUMPTION: ClaudeAPI is loaded via api-client.js before this file
// #ASSUMPTION: appSettings.apiKey is set; demoMode active when apiKey is empty

const partIdentifier = (() => {
  'use strict'

  const DEMO_FIXTURE = {
    part_name:      'Brake Caliper',
    category:       'Braking System',
    confidence_pct: 94,
    description:    'Hydraulic disc brake caliper — single-piston floating design. Surface shows normal wear, no visible cracks.',
  }

  function _showToast(msg) {
    if (typeof showToast === 'function') showToast(msg)
    else console.warn('[partIdentifier]', msg)
  }

  function _showLoading() {
    const section = document.getElementById('partsIdentifiedSection')
    const list    = document.getElementById('partsIdentifiedList')
    if (!section || !list) return
    const spinner = document.createElement('div')
    spinner.id        = 'partsIdSpinner'
    spinner.innerHTML = '<span style="color:var(--muted);font-size:0.82rem">🔩 Identifying part…</span>'
    list.prepend(spinner)
    section.style.display = 'block'
  }

  function _clearLoading() {
    document.getElementById('partsIdSpinner')?.remove()
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function _renderPartCard(result) {
    _clearLoading()
    const section = document.getElementById('partsIdentifiedSection')
    const list    = document.getElementById('partsIdentifiedList')
    if (!section || !list) return
    document.getElementById('partsIdEmpty')?.remove()

    const isUnknown = !result.part_name || result.part_name === 'Unknown' || result.confidence_pct === 0

    const card = document.createElement('div')
    card.className = 'card'
    card.style.cssText = 'margin-bottom:0.6rem;padding:0.8rem 1rem'
    card.innerHTML = `
      <div style="font-weight:800;font-size:0.9rem;margin-bottom:0.3rem">${_esc(result.part_name || 'Unknown Part')}</div>
      <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:${result.description ? '0.4rem' : '0'}">
        ${result.category ? `<span style="font-size:0.72rem;background:rgba(249,115,22,0.12);color:#f97316;padding:0.18rem 0.55rem;border-radius:6px;font-weight:700">${_esc(result.category)}</span>` : ''}
        ${!isUnknown ? `<span style="font-size:0.72rem;color:var(--muted)">${result.confidence_pct}% match</span>` : ''}
      </div>
      ${result.description ? `<div style="font-size:0.8rem;color:var(--muted)">${_esc(result.description)}</div>` : ''}
    `
    list.prepend(card)
    section.style.display = 'block'
  }

  async function identify(base64DataUrl) {
    const apiKey = appSettings?.apiKey || localStorage.getItem('ariq_apikey') || ''
    const demoMode = !apiKey

    _showLoading()

    if (demoMode) {
      await new Promise(r => setTimeout(r, 900 + Math.random() * 600))
      _renderPartCard(DEMO_FIXTURE)
      return
    }

    const base64 = base64DataUrl.split(',')[1]
    if (!base64) { _clearLoading(); _showToast('Could not read image data'); return }

    const payload = {
      model:      'claude-opus-4-6-20251101',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: 'Identify this vehicle part. If not a recognizable vehicle part, return confidence_pct as 0 and part_name as "Unknown". Return ONLY valid JSON with these keys: part_name, category, confidence_pct (0-100 integer), description. No markdown, no explanation.' },
        ],
      }],
    }

    try {
      const res  = await ClaudeAPI.call(apiKey, payload, { maxRetries: 2, timeoutMs: 30000 })
      const text = res?.content?.[0]?.text?.trim() || ''
      const cleaned = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
      let result
      try {
        result = JSON.parse(cleaned)
      } catch (_) {
        result = { part_name: text.slice(0, 60) || 'Unknown', category: '', confidence_pct: 0, description: '' }
      }
      _renderPartCard(result)
    } catch (err) {
      _clearLoading()
      _showToast(err?.circuitOpen ? 'API unavailable' : err?.timeout ? 'Part ID timed out' : 'Part identification failed')
    }
  }

  function clearAll() {
    const list = document.getElementById('partsIdentifiedList')
    if (!list) return
    list.innerHTML = `<div id="partsIdEmpty" style="font-size:0.82rem;color:var(--muted);padding:0.5rem 0">🔩 Snap a photo to identify a part</div>`
  }

  return { identify, clearAll }
})()
