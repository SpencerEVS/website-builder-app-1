export const fontLoader = {
    name: 'Font Loader',
    description: 'Load custom fonts — paste base64, set a name, click Load',
    defaultSize: { width: 1200, height: 800 },
    defaultPosition: { x: 0, y: 0 },
    code: `<script>
// Compute colors from global_style variables
const getColor = (key, fallback) => window.globalVariables?.[key] || fallback;
const colors = {
  c1: getColor('global_style_1', '#1e1e2e'),
  c2: getColor('global_style_2', '#cdd6f4'),
  c3: getColor('global_style_3', '#2a2a3e'),
  c5: getColor('global_style_5', '#28a745'),
  c6: getColor('global_style_6', '#a6adc8'),
  c7: getColor('global_style_7', '#cba6f7'),
  c8: getColor('global_style_8', '#313244'),
  c9: getColor('global_style_9', '#45475a'),
  c10: getColor('global_style_10', '#181825'),
  c11: getColor('global_style_11', '#218838'),
  c12: getColor('global_style_12', '#f38ba8'),
};

// Create dynamic style tag with computed colors
const styleEl = document.createElement('style');
styleEl.textContent = \`
  * { box-sizing: border-box; }
  body { margin: 0; padding: 16px; background: \${colors.c1}; color: \${colors.c2}; font-family: sans-serif; font-size: 13px; }
  .note { background: \${colors.c3}; border-left: 3px solid \${colors.c5}; padding: 8px 12px; border-radius: 4px; font-size: 12px; color: \${colors.c6}; margin-bottom: 14px; }
  .note strong { color: \${colors.c5}; }
  h3 { font-size: 14px; color: \${colors.c7}; margin: 0 0 12px 0; }
  label { display: block; font-size: 11px; color: \${colors.c6}; margin-bottom: 3px; margin-top: 8px; }
  input[type=text] { width: 100%; padding: 5px 8px; font-size: 13px; background: \${colors.c8}; color: \${colors.c2}; border: 1px solid \${colors.c9}; border-radius: 4px; outline: none; }
  textarea { width: 100%; padding: 5px 8px; font-size: 11px; background: \${colors.c10}; color: \${colors.c6}; border: 1px solid \${colors.c9}; border-radius: 4px; outline: none; font-family: monospace; resize: vertical; }
  .load-btn { margin-top: 10px; padding: 7px 14px; font-size: 13px; background: \${colors.c5}; color: #ffffff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; }
  .load-btn:hover { background: \${colors.c11}; }
  #status { margin-top: 7px; font-size: 12px; font-weight: bold; min-height: 18px; padding: 6px 10px; border-radius: 4px; background: \${colors.c3}; }
  #status:empty { background: transparent; padding: 0; }
  #status.ok { color: \${colors.c5}; }
  #status.err { color: \${colors.c12}; }
  hr { border: none; border-top: 1px solid \${colors.c8}; margin: 14px 0; }
  #preview-input { width: 100%; padding: 5px 8px; font-size: 13px; background: \${colors.c10}; color: \${colors.c2}; border: 1px solid \${colors.c9}; border-radius: 4px; outline: none; margin-bottom: 10px; }
  #font-list { display: flex; flex-direction: column; gap: 8px; }
  .font-row { background: \${colors.c8}; border-radius: 4px; padding: 8px 10px; }
  .font-row-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .font-name-label { font-size: 10px; color: \${colors.c6}; letter-spacing: 0.05em; text-transform: uppercase; }
  .font-sample { font-size: 22px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .remove-btn { font-size: 11px; background: transparent; border: 1px solid \${colors.c9}; color: \${colors.c12}; border-radius: 3px; cursor: pointer; padding: 1px 6px; }
\`;
document.head.appendChild(styleEl);
</script>

<div class="note"><strong>Tip:</strong> Once your fonts are loaded, this window can be safely removed — fonts persist in the background until the page is refreshed.</div>
<h3>Font Loader</h3>
<label for="fn">Font Name</label>
<input id="fn" type="text" placeholder="e.g. My Font" />
<label for="fb">Base64 Data (paste raw base64 OR full data URI)</label>
<textarea id="fb" rows="4" placeholder="AAEF... or data:font/ttf;base64,AAEF..."></textarea>
<button class="load-btn" id="load-btn">Load Font</button>
<div id="status"></div>
<hr>
<input id="preview-input" type="text" placeholder="Preview text…" value="The quick brown fox 0123456789" />
<div id="font-list"></div>

<script>
(function() {
  var injected = {};

  function detectMime(b64) {
    try {
      var d = atob(b64.substring(0, 12));
      if (d.charCodeAt(0) === 0 && d.charCodeAt(1) === 1) return 'font/ttf';
      if (d.substring(0, 4) === 'OTTO') return 'font/otf';
      if (d.substring(0, 4) === 'wOFF') return 'font/woff';
      if (d.substring(0, 4) === 'wOF2') return 'font/woff2';
      if (d.substring(0, 4) === 'true') return 'font/ttf';
    } catch(e) {}
    return 'font/ttf';
  }

  function makeDataUri(raw) {
    raw = raw.trim().replace(/[\\r\\n\\s]/g, '');
    if (raw.indexOf('data:') === 0) return raw;
    return 'data:' + detectMime(raw) + ';base64,' + raw;
  }

  function injectStyle(name, uri) {
    if (injected[name]) return;
    var el = document.getElementById('_gf_styles');
    if (!el) { el = document.createElement('style'); el.id = '_gf_styles'; document.head.appendChild(el); }
    el.textContent += '@font-face { font-family: "' + name + '"; src: url("' + uri + '"); }\\n';
    injected[name] = true;
  }

  document.getElementById('load-btn').addEventListener('click', function() {
    var name = document.getElementById('fn').value.trim();
    var raw  = document.getElementById('fb').value.trim();
    var st   = document.getElementById('status');
    if (!name) { st.textContent = '✗ Enter a font name.'; st.className = 'err'; return; }
    if (!raw)  { st.textContent = '✗ Paste font base64 data.'; st.className = 'err'; return; }
    try {
      var uri = makeDataUri(raw);
      window.parent.globalFonts = window.parent.globalFonts || {};
      window.parent.globalFonts[name] = uri;
      st.textContent = '✓ "' + name + '" loaded — use font-family: "' + name + '" in any window';
      st.className = 'ok';
      renderList();
    } catch(e) {
      st.textContent = '✗ Error: ' + e.message;
      st.className = 'err';
    }
    try { injectFontsEverywhere(); } catch(eInj) {}
  });

  function renderList() {
    var gf = (window.parent && window.parent.globalFonts) ? window.parent.globalFonts : {};
    var names = Object.keys(gf).filter(function(n) { return gf[n] && gf[n].indexOf('data:') === 0; });
    var list = document.getElementById('font-list');
    var text = document.getElementById('preview-input').value || 'AaBbCc 0123456789';
    names.forEach(function(n) { injectStyle(n, gf[n]); });
    list.innerHTML = '';
    if (!names.length) {
      list.innerHTML = '<div style="color:#585b70;font-size:12px;margin-top:6px;">No fonts loaded yet.</div>';
      return;
    }
    names.forEach(function(name) {
      var row = document.createElement('div');
      row.className = 'font-row';
      row.innerHTML =
        '<div class="font-row-header">' +
          '<span class="font-name-label">' + name + '</span>' +
          '<button class="remove-btn" data-f="' + name + '">✕</button>' +
        '</div>' +
        '<div class="font-sample" style="font-family:\\'' + name + '\\'">' + text + '</div>';
      list.appendChild(row);
    });
    Array.from(list.querySelectorAll('.remove-btn')).forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (window.parent.globalFonts) delete window.parent.globalFonts[btn.getAttribute('data-f')];
        renderList();
        try { injectFontsEverywhere(); } catch(eInj) {}
      });
    });
  }

  // Inject font CSS directly into all open builder iframes and the parent document head
  // This avoids changing srcDoc (which would reload the iframes)
  function injectFontsEverywhere() {
    var allF = (window.parent && window.parent.globalFonts) ? window.parent.globalFonts : {};
    var css = Object.keys(allF).map(function(fn) {
      return '@font-face { font-family: "' + fn + '"; src: url("' + allF[fn] + '"); }';
    }).join('\\n');
    // 1. Inject into parent document.head for JS-type windows rendered in main DOM
    try {
      var pDoc = window.parent.document;
      var pStyle = pDoc.getElementById('__builderFonts');
      if (!pStyle) { pStyle = pDoc.createElement('style'); pStyle.id = '__builderFonts'; pDoc.head.appendChild(pStyle); }
      pStyle.textContent = css;
    } catch(e) {}
    // 2. Inject into every iframe on the parent page (HTML-type windows)
    try {
      var frames = window.parent.document.querySelectorAll('iframe');
      for (var i = 0; i < frames.length; i++) {
        try {
          var fdoc = frames[i].contentDocument;
          if (!fdoc || !fdoc.head) continue;
          var fStyle = fdoc.getElementById('__globalFonts');
          if (!fStyle) { fStyle = fdoc.createElement('style'); fStyle.id = '__globalFonts'; fdoc.head.appendChild(fStyle); }
          fStyle.textContent = css;
        } catch(fe) {}
      }
    } catch(e2) {}
  }

  document.getElementById('preview-input').addEventListener('input', renderList);
  renderList();
  setInterval(renderList, 1000);
})();
</script>`
};
