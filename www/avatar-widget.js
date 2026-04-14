(function () {
  'use strict';

  function getApiKey() {
    try {
      var s = JSON.parse(localStorage.getItem('ariq_settings') || '{}');
      if (s.apiKey) return s.apiKey;
      var keys = Object.keys(localStorage);
      for (var i = 0; i < keys.length; i++) {
        var v = localStorage.getItem(keys[i]);
        if (v && v.startsWith('sk-ant-')) return v;
      }
    } catch (e) {}
    return '';
  }

  function getCtx() {
    var el = document.getElementById('sw-avatar');
    if (el && el.dataset.context) return el.dataset.context;
    var m = document.querySelector('meta[name="description"]');
    return m ? m.content : '';
  }

  function getAppName() {
    var el = document.querySelector('meta[name="application-name"]');
    return el ? el.content : (document.title || 'AutoRepairIQ Pro');
  }

  function getOptions() {
    return [
      'Is this repair worth doing?',
      'Dealer or indie shop?',
      'What should I charge?',
      'What parts should I source?'
    ];
  }

  var GREETS = [
    'Need a quick answer on a repair, quote, or parts decision?',
    'Ask about shop pricing, repair strategy, or right-to-repair.',
    'I can help with damage scans, labor calls, and customer quotes.',
    'Tell me what the vehicle is doing and I will keep it concise.'
  ];
  var greetIndex = -1;
  function nextGreet() {
    var n;
    do { n = Math.floor(Math.random() * GREETS.length); } while (n === greetIndex);
    greetIndex = n;
    return GREETS[n];
  }

  var CSS = [
    '.jd{position:fixed;bottom:80px;right:18px;z-index:99999;display:flex;flex-direction:column;align-items:flex-end;gap:10px;font-family:Inter,system-ui,sans-serif}',
    '.jd-bubble{background:#101521;border:1px solid rgba(249,115,22,0.35);border-radius:16px 16px 4px 16px;color:#eef0f8;font-size:12px;line-height:1.55;max-width:242px;padding:10px 13px;word-break:break-word;box-shadow:0 8px 24px rgba(0,0,0,0.28);animation:jdPop .22s cubic-bezier(.34,1.56,.64,1)}',
    '.jd-bubble.hidden{display:none}',
    '.jd-bubble.error{border-color:#f87171;color:#ffd6d6}',
    '.jd-opts{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;max-width:264px;animation:jdFade .2s ease}',
    '.jd-opts.hidden{display:none}',
    '.jd-opt{background:#151b2a;border:1px solid rgba(56,189,248,0.22);border-radius:20px;color:#d5def0;font-size:10px;padding:5px 11px;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s}',
    '.jd-opt:hover{background:rgba(249,115,22,0.12);border-color:rgba(249,115,22,0.3)}',
    '.jd-row{display:flex;align-items:center;gap:7px;background:#101521;border:1px solid rgba(56,189,248,0.18);border-radius:24px;padding:6px 6px 6px 13px;width:236px;box-shadow:0 6px 18px rgba(0,0,0,0.22);animation:jdFade .2s ease}',
    '.jd-row.hidden{display:none}',
    '.jd-inp{flex:1;background:transparent;border:none;outline:none;color:#eef0f8;font-size:11px;caret-color:#f97316;min-width:0}',
    '.jd-inp::placeholder{color:rgba(213,222,240,0.35)}',
    '.jd-send{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#f97316,#f59e0b);border:none;color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '.jd-send:disabled{background:rgba(249,115,22,0.28);cursor:not-allowed}',
    '.jd-icon{width:48px;height:48px;border-radius:50%;background:linear-gradient(180deg,#151b2a,#101521);border:1.5px solid rgba(249,115,22,0.35);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 18px rgba(249,115,22,0.18);transition:box-shadow .2s;flex-shrink:0;font-size:1.25rem}',
    '.jd-icon:hover{box-shadow:0 0 26px rgba(249,115,22,0.3)}',
    '.jd-icon.open{box-shadow:0 0 28px rgba(249,115,22,0.35);animation:none}',
    '.jd-dots{display:inline-flex;gap:3px}.jd-dots span{width:5px;height:5px;border-radius:50%;background:#f97316;animation:jdBounce 1s ease-in-out infinite}.jd-dots span:nth-child(2){animation-delay:.15s}.jd-dots span:nth-child(3){animation-delay:.3s}',
    '@keyframes jdPop{0%{opacity:0;transform:scale(.85) translateY(8px)}100%{opacity:1;transform:scale(1) translateY(0)}}',
    '@keyframes jdFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}',
    '@keyframes jdBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}',
    '@keyframes jdBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}.jd-icon{animation:jdBob 3s ease-in-out infinite}.jd-icon.open{animation:none}'
  ].join('');

  var DEMO = [
    'Demo mode is active. Add your Claude API key in Settings for live shop answers.',
    'No API key detected. Open Settings to enter your Claude key.',
  ];
  var demoIndex = -1;
  function demoAnswer() {
    var n;
    do { n = Math.floor(Math.random() * DEMO.length); } while (n === demoIndex);
    demoIndex = n;
    return DEMO[n];
  }

  function friendlyError(status, msg) {
    if (status === 401) return 'Invalid API key. Update it in Settings.';
    if (status === 429) return 'Too many requests. Wait a moment and try again.';
    if (status >= 500) return 'Claude is busy. Try again shortly.';
    if (msg && msg.includes('timeout')) return 'Timed out. Check your connection.';
    return 'Something went wrong. Try again.';
  }

  async function askStream(question, onChunk, onDone, onError) {
    var apiKey = getApiKey();
    if (!apiKey) { onDone(demoAnswer()); return; }
    if (question.length > 500) question = question.slice(0, 500);

    var sys = 'You are a concise shop assistant inside ' + getAppName() + '. Context: ' + (getCtx() || 'auto repair app')
      + '. Answer in 2-3 sentences. Be direct. Be right-to-repair aware and practical for an independent shop.';

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 30000);

    try {
      var res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-calls': 'true'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 220,
          stream: true,
          system: sys,
          messages: [{ role: 'user', content: question }]
        })
      });
      clearTimeout(timer);
      if (!res.ok) { onError(friendlyError(res.status, '')); return; }
      if (!res.body) { onError('No response body'); return; }

      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var full = '';
      var buf = '';

      while (true) {
        var result = await reader.read();
        if (result.done) break;
        buf += decoder.decode(result.value, { stream: true });
        var lines = buf.split('\n');
        buf = lines.pop();
        for (var i = 0; i < lines.length; i++) {
          if (!lines[i].startsWith('data: ')) continue;
          var data = lines[i].slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            var parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta && parsed.delta.type === 'text_delta') {
              full += parsed.delta.text;
              onChunk(full);
            }
          } catch (e) {}
        }
      }
      onDone(full || 'No answer.');
    } catch (e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') { onError(friendlyError(0, 'timeout')); return; }
      onError(friendlyError(0, 'network'));
    }
  }

  function build() {
    var root = document.getElementById('sw-avatar');
    if (!root) return;
    if (!document.getElementById('jd-css')) {
      var s = document.createElement('style');
      s.id = 'jd-css';
      s.textContent = CSS;
      document.head.appendChild(s);
    }

    var wrap = document.createElement('div'); wrap.className = 'jd';
    var bubble = document.createElement('div'); bubble.className = 'jd-bubble hidden';
    var bubText = document.createElement('span'); bubble.appendChild(bubText);
    bubble.onclick = function () { bubble.classList.add('hidden'); bubble.classList.remove('error'); };

    var opts = document.createElement('div'); opts.className = 'jd-opts hidden';
    getOptions().forEach(function (label) {
      var chip = document.createElement('button'); chip.className = 'jd-opt';
      chip.textContent = label;
      chip.onclick = function () { submit(label); };
      opts.appendChild(chip);
    });

    var row = document.createElement('div'); row.className = 'jd-row hidden';
    var inp = document.createElement('input'); inp.className = 'jd-inp';
    inp.type = 'text'; inp.placeholder = 'Ask the shop assistant…'; inp.maxLength = 500;
    var send = document.createElement('button'); send.className = 'jd-send'; send.textContent = '↑';
    row.appendChild(inp); row.appendChild(send);

    var icon = document.createElement('div'); icon.className = 'jd-icon'; icon.textContent = '🔧';
    wrap.appendChild(bubble); wrap.appendChild(opts); wrap.appendChild(row); wrap.appendChild(icon);
    root.appendChild(wrap);

    var isOpen = false;
    icon.onclick = function () {
      isOpen = !isOpen;
      icon.classList.toggle('open', isOpen);
      opts.classList.toggle('hidden', !isOpen);
      row.classList.toggle('hidden', !isOpen);
      if (isOpen && bubble.classList.contains('hidden')) {
        bubble.classList.remove('hidden');
        bubble.classList.remove('error');
        bubText.textContent = nextGreet();
      }
      if (isOpen) setTimeout(function () { inp.focus(); }, 50);
    };

    function setLoading(on) {
      send.disabled = on;
      inp.disabled = on;
      if (on) {
        bubble.classList.remove('hidden', 'error');
        bubble.innerHTML = '<div class="jd-dots"><span></span><span></span><span></span></div>';
      }
    }

    function submit(question) {
      question = (question || inp.value).trim();
      if (!question) return;
      inp.value = '';
      setLoading(true);
      bubble.innerHTML = '';
      var span = document.createElement('span');
      bubble.appendChild(span);
      askStream(
        question,
        function (full) { span.textContent = full; bubble.classList.remove('hidden'); },
        function (full) { span.textContent = full; bubble.classList.remove('hidden'); send.disabled = false; inp.disabled = false; },
        function (msg) {
          bubble.innerHTML = '';
          var e = document.createElement('span');
          e.textContent = msg;
          bubble.appendChild(e);
          bubble.classList.remove('hidden');
          bubble.classList.add('error');
          send.disabled = false;
          inp.disabled = false;
        }
      );
    }

    send.onclick = function () { submit(inp.value); };
    inp.onkeydown = function (e) { if (e.key === 'Enter' && !send.disabled) submit(inp.value); };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
