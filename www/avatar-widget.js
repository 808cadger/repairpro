(function () {
  'use strict';
  // Aloha from Pearl City! 🌺 — Jedi chatbot widget

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
    return el ? el.content : document.title || 'this app';
  }

  function getOptions() {
    return [
      'Is this repair worth it?', 'DIY or take it in?',
      'What is right to repair?', 'Dealer vs indie shop?'
    ];
  }

  var GREETS = [
    'The Force is with you. How can I help?',
    'Ask me anything about auto repair.',
    'Ready to assist. What do you need?',
    'Got a repair question? Fire away.',
  ];
  var _gi = -1;
  function nextGreet() { var n; do { n = Math.floor(Math.random() * GREETS.length); } while (n === _gi); _gi = n; return GREETS[n]; }

  var CSS = [
    '.jd{position:fixed;bottom:80px;right:18px;z-index:99999;display:flex;flex-direction:column;align-items:flex-end;gap:10px;font-family:system-ui,sans-serif}',
    '.jd-bubble{background:#0a0e1a;border:1px solid #4fc3f7;border-radius:16px 16px 4px 16px;color:#e3f2fd;font-size:12px;line-height:1.55;max-width:230px;padding:10px 13px;word-break:break-word;box-shadow:0 4px 20px rgba(79,195,247,0.2);animation:jdPop 0.22s cubic-bezier(0.34,1.56,0.64,1)}',
    '.jd-bubble.hidden{display:none}',
    '.jd-bubble.error{border-color:#f44336;color:#ffcdd2}',
    '.jd-opts{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;max-width:260px;animation:jdFade 0.2s ease}',
    '.jd-opts.hidden{display:none}',
    '.jd-opt{background:#0a0e1a;border:1px solid rgba(79,195,247,0.45);border-radius:20px;color:#b3e5fc;font-size:10px;padding:5px 11px;cursor:pointer;white-space:nowrap;transition:background 0.15s}',
    '.jd-opt:hover{background:rgba(79,195,247,0.1)}',
    '.jd-row{display:flex;align-items:center;gap:7px;background:#0a0e1a;border:1px solid rgba(79,195,247,0.4);border-radius:24px;padding:6px 6px 6px 13px;width:230px;box-shadow:0 4px 16px rgba(79,195,247,0.15);animation:jdFade 0.2s ease}',
    '.jd-row.hidden{display:none}',
    '.jd-inp{flex:1;background:transparent;border:none;outline:none;color:#e3f2fd;font-size:11px;caret-color:#4fc3f7;min-width:0}',
    '.jd-inp::placeholder{color:rgba(179,229,252,0.35)}',
    '.jd-send{width:28px;height:28px;border-radius:50%;background:#4fc3f7;border:none;color:#0a0e1a;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '.jd-send:disabled{background:rgba(79,195,247,0.3);cursor:not-allowed}',
    '.jd-icon{width:48px;height:48px;border-radius:50%;background:#0a0e1a;border:1.5px solid #4fc3f7;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 16px rgba(79,195,247,0.35);transition:box-shadow 0.2s;flex-shrink:0;font-size:1.4rem}',
    '.jd-icon:hover{box-shadow:0 0 28px rgba(79,195,247,0.55)}',
    '.jd-icon.open{border-color:#4fc3f7;box-shadow:0 0 28px rgba(79,195,247,0.6);animation:none}',
    '.jd-dots{display:inline-flex;gap:3px}.jd-dots span{width:5px;height:5px;border-radius:50%;background:#4fc3f7;animation:jdBounce 1s ease-in-out infinite}.jd-dots span:nth-child(2){animation-delay:0.15s}.jd-dots span:nth-child(3){animation-delay:0.3s}',
    '@keyframes jdPop{0%{opacity:0;transform:scale(0.85) translateY(8px)}100%{opacity:1;transform:scale(1) translateY(0)}}',
    '@keyframes jdFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}',
    '@keyframes jdBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}',
    '@keyframes jdBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}.jd-icon{animation:jdBob 3s ease-in-out infinite}.jd-icon.open{animation:none}',
  ].join('');

  var DEMO = [
    'Demo mode — add your Claude API key in Settings for live AI answers.',
    'No API key detected. Head to Settings to enter your Claude key.',
  ];
  var _di = -1;
  function demoAnswer() { var n; do { n = Math.floor(Math.random() * DEMO.length); } while (n === _di); _di = n; return DEMO[n]; }

  function friendlyError(status, msg) {
    if (status === 401) return 'Invalid API key — update in Settings.';
    if (status === 429) return 'Too many requests — wait a moment.';
    if (status >= 500) return 'Claude is busy — try again shortly.';
    if (msg && msg.includes('timeout')) return 'Timed out — check connection.';
    return 'Something went wrong — try again.';
  }

  async function askStream(question, onChunk, onDone, onError) {
    var apiKey = getApiKey();
    if (!apiKey) { onDone(demoAnswer()); return; }
    if (question.length > 500) question = question.slice(0, 500);

    var sys = 'You are a helpful AI assistant in ' + getAppName() + '. Context: ' + (getCtx() || 'auto repair app')
      + '. Answer in 2-3 sentences. Be direct. Hawaii-based, right-to-repair aware.';

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 30000);

    try {
      var res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-calls': 'true'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5', max_tokens: 220, stream: true,
          system: sys, messages: [{ role: 'user', content: question }]
        })
      });
      clearTimeout(timer);
      if (!res.ok) { onError(friendlyError(res.status, '')); return; }
      if (!res.body) { onError('No response body'); return; }

      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var full = '', buf = '';

      while (true) {
        var result = await reader.read();
        if (result.done) break;
        buf += decoder.decode(result.value, { stream: true });
        var lines = buf.split('\n'); buf = lines.pop();
        for (var i = 0; i < lines.length; i++) {
          if (!lines[i].startsWith('data: ')) continue;
          var data = lines[i].slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            var parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              full += parsed.delta.text; onChunk(full);
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
      var s = document.createElement('style'); s.id = 'jd-css'; s.textContent = CSS; document.head.appendChild(s);
    }

    var wrap = document.createElement('div'); wrap.className = 'jd';
    var bubble = document.createElement('div'); bubble.className = 'jd-bubble hidden';
    var bubText = document.createElement('span'); bubble.appendChild(bubText);
    bubble.onclick = function () { bubble.classList.add('hidden'); bubble.classList.remove('error'); };

    var opts = document.createElement('div'); opts.className = 'jd-opts hidden';
    getOptions().forEach(function (label) {
      var chip = document.createElement('button'); chip.className = 'jd-opt';
      chip.textContent = label; chip.onclick = function () { submit(label); };
      opts.appendChild(chip);
    });

    var row = document.createElement('div'); row.className = 'jd-row hidden';
    var inp = document.createElement('input'); inp.className = 'jd-inp';
    inp.type = 'text'; inp.placeholder = 'Ask anything…'; inp.maxLength = 500;
    var send = document.createElement('button'); send.className = 'jd-send'; send.textContent = '↑';
    row.appendChild(inp); row.appendChild(send);

    var icon = document.createElement('div'); icon.className = 'jd-icon'; icon.textContent = '🤖';

    wrap.appendChild(bubble); wrap.appendChild(opts); wrap.appendChild(row); wrap.appendChild(icon);
    root.appendChild(wrap);

    var isOpen = false;
    icon.onclick = function () {
      isOpen = !isOpen;
      icon.classList.toggle('open', isOpen);
      opts.classList.toggle('hidden', !isOpen);
      row.classList.toggle('hidden', !isOpen);
      if (isOpen && bubble.classList.contains('hidden')) {
        bubble.classList.remove('hidden'); bubText.textContent = nextGreet();
      }
      if (isOpen) setTimeout(function () { inp.focus(); }, 50);
    };

    function setLoading(on) {
      send.disabled = on; inp.disabled = on;
      if (on) {
        bubble.classList.remove('hidden', 'error');
        bubble.innerHTML = '<div class="jd-dots"><span></span><span></span><span></span></div>';
      }
    }

    function submit(question) {
      question = (question || inp.value).trim();
      if (!question) return;
      inp.value = ''; setLoading(true);
      bubble.innerHTML = '';
      var span = document.createElement('span'); bubble.appendChild(span);
      askStream(question,
        function (full) { span.textContent = full; bubble.classList.remove('hidden'); },
        function (full) { span.textContent = full; bubble.classList.remove('hidden'); send.disabled = false; inp.disabled = false; },
        function (msg) {
          bubble.innerHTML = ''; var e = document.createElement('span'); e.textContent = msg;
          bubble.appendChild(e); bubble.classList.remove('hidden'); bubble.classList.add('error');
          send.disabled = false; inp.disabled = false;
        }
      );
    }

    send.onclick = function () { submit(inp.value); };
    inp.onkeydown = function (e) { if (e.key === 'Enter' && !send.disabled) submit(inp.value); };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
