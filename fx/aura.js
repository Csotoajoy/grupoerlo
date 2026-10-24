// AURA · ambiente visual de Kurage OS (v4, 23/10/2026)
// La sede de Heavendly Digital no cambia nunca: el mismo vestíbulo (mostrador circular dorado, mármol blanco, ventanales).
// Lo que cambia es lo de afuera del vidrio y la luz. Tres ajustes independientes, guardados en cada equipo:
//   1. Ambiente: tiempo real (hora del sol en San José + clima de Open-Meteo) · según KPI (índice de salud) · fijo
//   2. Modo y tema: automático (oscuro de noche o con tormenta) / claro / oscuro · Heavenly Light, Midnight, Rose Executive,
//      Manufacturing Dark o personalizado (color principal, secundario y acento)
//   3. Transparencia de los paneles: ejecutivo (95 %), balanceado (70 %), inmersivo (50 %)
// Imágenes: estilo/aura/*.webp, renderizadas desde la misma foto base con herramientas/aura/render.py (solo cambia el cielo,
// el reflejo del piso y la luz). cielo-mascara.png marca el vidrio para las estrellas, la lluvia y los rayos.
// Para probar sin tocar el panel: ?cielo=noche|lluvia|tormenta… ?modo=oscuro ?tema=rosa ?vidrio=inmersivo ?hora=18.5
(function () {
  var d = document, html = d.documentElement;
  if (html.classList.contains('ce-con-cielo')) return;
  html.classList.add('ce-con-cielo', 'aura');
  // Configuración por atributos del <script>: data-base (carpeta de imágenes), data-oscurecer="0" (la página maneja su modo oscuro)
  var CFG = (d.currentScript && d.currentScript.dataset) || {};
  var BASE = CFG.base || '/estilo/aura/';
  html.style.setProperty('--aura-mascara', 'url("' + BASE + 'cielo-mascara.png")');
  var AMBIENTES = { dia: 'Día', amanecer: 'Amanecer', atardecer: 'Atardecer', crepusculo: 'Crepúsculo', noche: 'Noche', nublado: 'Nublado', lluvia: 'Lluvia', tormenta: 'Tormenta', neblina: 'Neblina' };
  var TEMAS = {
    heavenly: { n: 'Heavenly Light', d: 'Blanco, azul corporativo y dorado suave', c: ['#1F5FD1', '#123F92', '#B8892E'] },
    midnight: { n: 'Midnight', d: 'Negro, azul oscuro y plata', c: ['#5B8DEF', '#1B2A4A', '#AEB8C8'], oscuro: true },
    rosa: { n: 'Rose Executive', d: 'Rosa claro, blanco y oro rosado (el de la app de Zeidy)', c: ['#C2185B', '#8E1046', '#B76E79'] },
    industrial: { n: 'Manufacturing Dark', d: 'Gris industrial y azul acero', c: ['#4F7CAC', '#2C3E50', '#9AA5B1'], oscuro: true },
    custom: { n: 'Personalizado', d: 'Usted elige los tres colores', c: null }
  };
  var VIDRIOS = { ejecutivo: { n: 'Ejecutivo', d: 'El tablero domina', a: .95 }, balanceado: { n: 'Balanceado', d: 'Se ve el edificio', a: .7 }, inmersivo: { n: 'Inmersivo', d: 'Dentro de la sede', a: .5 } };
  var PRESETS = [
    { n: 'Tiempo real · Rose Executive · inmersivo 50 %', a: { ambiente: 'auto', modo: 'auto', tema: 'rosa', vidrio: 'inmersivo' } },
    { n: 'Según KPI · Midnight oscuro · 70 %', a: { ambiente: 'kpi', modo: 'oscuro', tema: 'midnight', vidrio: 'balanceado' } },
    { n: 'Tiempo real · Heavenly Light · 70 %', a: { ambiente: 'auto', modo: 'auto', tema: 'heavenly', vidrio: 'balanceado' } }
  ];
  var DEF = { ambiente: 'auto', modo: 'auto', tema: 'heavenly', vidrio: 'balanceado', efectos: true, custom: { pri: '#1F5FD1', sec: '#123F92', acento: '#B8892E' } };
  var Q = new URLSearchParams(location.search);
  function leer() { try { var j = JSON.parse(localStorage.getItem('aura_ajustes') || '{}'); return Object.assign({}, DEF, j, { custom: Object.assign({}, DEF.custom, j.custom || {}) }); } catch (e) { return Object.assign({}, DEF); } }
  function guardar() { try { localStorage.setItem('aura_ajustes', JSON.stringify(A)); } catch (e) { } }
  var A = leer();

  // ── Sol: salida y puesta reales en San José (NOAA simplificado, ±2 min) ──
  var LAT = 9.93, LON = -84.08, RAD = Math.PI / 180;
  function sol(f) {
    var ini = Date.UTC(f.getUTCFullYear(), 0, 0), n = Math.floor((f - ini) / 864e5), gm = 2 * Math.PI / 365 * (n - 1);
    var eq = 229.18 * (0.000075 + 0.001868 * Math.cos(gm) - 0.032077 * Math.sin(gm) - 0.014615 * Math.cos(2 * gm) - 0.040849 * Math.sin(2 * gm));
    var de = 0.006918 - 0.399912 * Math.cos(gm) + 0.070257 * Math.sin(gm) - 0.006758 * Math.cos(2 * gm) + 0.000907 * Math.sin(2 * gm) - 0.002697 * Math.cos(3 * gm) + 0.00148 * Math.sin(3 * gm);
    var ha = Math.acos(Math.cos(90.833 * RAD) / (Math.cos(LAT * RAD) * Math.cos(de)) - Math.tan(LAT * RAD) * Math.tan(de)) / RAD;
    return { sale: (720 - 4 * (LON + ha) - eq) / 60 - 6, pone: (720 - 4 * (LON - ha) - eq) / 60 - 6 };
  }
  function horaCR() { var q = parseFloat(Q.get('hora')); if (!isNaN(q)) return q; var a = new Date(Date.now() - 6 * 36e5); return a.getUTCHours() + a.getUTCMinutes() / 60; }
  var SOL = sol(new Date(Date.now() - 6 * 36e5));
  function faseSol() {
    var h = horaCR(), s = SOL.sale, p = SOL.pone;
    if (h < s - 0.75) return 'noche'; if (h < s + 0.9) return 'amanecer'; if (h < p - 1.1) return 'dia';
    if (h < p + 0.2) return 'atardecer'; if (h < p + 1.0) return 'crepusculo'; return 'noche';
  }
  // ── Clima real (Open-Meteo, sin llave; se guarda 15 min) ──
  var CLIMA = null;
  try { CLIMA = JSON.parse(localStorage.getItem('aura_clima') || 'null'); } catch (e) { }
  function climaDe(code, nubes) {
    if (code >= 95) return 'tormenta'; if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'lluvia';
    if (code === 45 || code === 48) return 'neblina'; if (code === 3 || nubes >= 85) return 'nublado'; return 'despejado';
  }
  function traerClima() {
    if (CLIMA && Date.now() - CLIMA.t < 15 * 6e4) return;
    fetch('https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LON + '&current=weather_code,cloud_cover,precipitation,is_day&timezone=America%2FCosta_Rica')
      .then(function (r) { return r.json(); }).then(function (j) {
        if (!j.current) return;
        CLIMA = { t: Date.now(), code: j.current.weather_code, nubes: j.current.cloud_cover, lluvia: j.current.precipitation, estado: climaDe(j.current.weather_code, j.current.cloud_cover) };
        try { localStorage.setItem('aura_clima', JSON.stringify(CLIMA)); } catch (e) { }
        aplicar();
      }).catch(function () { });
  }
  // ── KPI: el índice de salud lo deja /salud en este equipo ──
  function kpi() { try { var k = JSON.parse(localStorage.getItem('aura_kpi') || 'null'); return k && Date.now() - k.f < 7 * 864e5 ? k : null; } catch (e) { return null; } }

  // Qué se ve afuera: imagen + efecto
  function ambiente() {
    var f = (Q.get('cielo') || '').toLowerCase();
    var fase = faseSol(), noche = fase === 'noche' || fase === 'crepusculo';
    var r = { img: fase, efecto: '', fase: fase, por: 'Hora del sol' };
    if (AMBIENTES[f]) return fijo(f);
    if (A.ambiente === 'kpi') {
      var k = kpi();
      if (k) { var e = k.score >= 80 ? 'despejado' : k.score >= 60 ? 'nublado' : 'tormenta'; r = clima(r, e, noche); r.por = 'Índice de salud ' + Math.round(k.score) + (k.score >= 80 ? ' · saludable' : k.score >= 60 ? ' · atención' : ' · riesgo'); return r; }
      r.por = 'Sin índice de salud en este equipo (abra «Salud de la empresa» una vez): se usa la hora';
    } else if (A.ambiente === 'auto') {
      if (CLIMA) { r = clima(r, CLIMA.estado, noche); r.por = 'Clima en San José: ' + ({ despejado: 'despejado', nublado: 'nublado', lluvia: 'lluvia', tormenta: 'tormenta', neblina: 'neblina' }[CLIMA.estado]) + ' · ' + CLIMA.nubes + ' % de nubes'; }
    } else if (AMBIENTES[A.ambiente]) return fijo(A.ambiente);
    return r;
  }
  function fijo(k) { return { img: k, efecto: { lluvia: 'lluvia', tormenta: 'tormenta', neblina: 'neblina', noche: 'estrellas', crepusculo: 'estrellas' }[k] || '', fase: k, por: 'Fijo: ' + AMBIENTES[k] }; }
  function clima(r, e, noche) {
    if (e === 'despejado') { r.efecto = noche ? 'estrellas' : ''; return r; }
    if (e === 'nublado') { r.img = noche ? r.img : 'nublado'; r.efecto = ''; return r; }
    if (e === 'lluvia') { r.img = noche ? 'noche' : 'lluvia'; r.efecto = 'lluvia'; return r; }
    if (e === 'tormenta') { r.img = 'tormenta'; r.efecto = 'tormenta'; return r; }
    if (e === 'neblina') { r.img = noche ? r.img : 'neblina'; r.efecto = 'neblina'; return r; }
    return r;
  }

  // ── Capas ──
  var el = d.createElement('div');
  el.className = 'ce-cielo aura-fondo'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="aura-img aura-a"></div><div class="aura-img aura-b"></div><div class="aura-vidrio-fx aura-estrellas"></div>' +
    '<canvas class="aura-vidrio-fx aura-lluvia"></canvas><div class="aura-vidrio-fx aura-rayo"></div><div class="aura-niebla"></div><div class="aura-velo"></div>';
  var actualImg = '', capa = 0, R = null;

  function colorTema() {
    var t = TEMAS[A.tema] || TEMAS.heavenly, c = t.c || [A.custom.pri, A.custom.sec, A.custom.acento];
    return { pri: c[0], sec: c[1], acento: c[2] };
  }
  function hexRgb(h) { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function aplicar() {
    R = ambiente();
    var modoQ = (Q.get('modo') || '').toLowerCase(), temaQ = Q.get('tema'), vidQ = Q.get('vidrio');
    if (temaQ && TEMAS[temaQ]) A.tema = temaQ; if (vidQ && VIDRIOS[vidQ]) A.vidrio = vidQ;
    var modo = modoQ === 'oscuro' || modoQ === 'claro' ? modoQ : A.modo;
    var oscuro = modo === 'oscuro' || (modo === 'auto' && (/noche|crepusculo|tormenta/.test(R.img) || (TEMAS[A.tema] || {}).oscuro));
    html.setAttribute('data-modo', oscuro ? 'oscuro' : 'claro');
    html.setAttribute('data-tema', A.tema); html.setAttribute('data-vidrio', A.vidrio);
    html.setAttribute('data-cielo', R.fase === 'noche' || R.img === 'noche' ? 'noche' : R.fase);
    html.setAttribute('data-efecto', A.efectos ? R.efecto : '');
    var c = colorTema(), p = hexRgb(c.pri), ac = hexRgb(c.acento), s = html.style;
    s.setProperty('--aura-pri', c.pri); s.setProperty('--aura-sec', c.sec); s.setProperty('--aura-acento', c.acento);
    s.setProperty('--aura-pri-rgb', p.join(',')); s.setProperty('--aura-acento-rgb', ac.join(','));
    s.setProperty('--aura-alfa', (VIDRIOS[A.vidrio] || VIDRIOS.balanceado).a);
    if (R.img !== actualImg) cambiarImg(R.img);
    efectos(); if (CFG.oscurecer !== '0') oscurecer();
    if (panel) pintarPanel();
  }
  function cambiarImg(k) {
    actualImg = k; var img = new Image();
    img.onload = function () {
      var cs = el.querySelectorAll('.aura-img'), sig = cs[capa ^ 1], ant = cs[capa];
      sig.style.backgroundImage = 'url("' + img.src + '")'; sig.classList.add('visible'); ant.classList.remove('visible'); capa ^= 1;
      html.classList.add('ce-con-foto');
    };
    img.src = BASE + k + '.webp';
  }

  // ── Efectos sobre el vidrio (se apagan si el equipo pide menos movimiento o si la pestaña no se ve) ──
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv = null, cx = null, gotas = [], anim = 0, rayoT = 0;
  function efectos() {
    var e = html.getAttribute('data-efecto');
    cancelAnimationFrame(anim); anim = 0;
    if (!cv) { cv = el.querySelector('.aura-lluvia'); cx = cv.getContext('2d'); }
    cx.clearRect(0, 0, cv.width, cv.height);
    if ((e === 'lluvia' || e === 'tormenta') && !quieto) { gotas = []; anim = requestAnimationFrame(llover); }
    if (e === 'tormenta' && !quieto) { clearTimeout(rayoT); rayoT = setTimeout(rayo, 3000 + Math.random() * 6000); } else clearTimeout(rayoT);
  }
  function tam() { var w = innerWidth, h = innerHeight; if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } }
  var ult = 0;
  function llover(t) {
    anim = requestAnimationFrame(llover);
    if (d.hidden || t - ult < 33) return; ult = t; tam();
    var w = cv.width, h = cv.height, fuerte = html.getAttribute('data-efecto') === 'tormenta';
    while (gotas.length < (fuerte ? 260 : 150)) gotas.push({ x: Math.random() * w, y: Math.random() * -h, v: 9 + Math.random() * 9, l: 10 + Math.random() * 18 });
    cx.clearRect(0, 0, w, h); cx.strokeStyle = 'rgba(220,230,245,.42)'; cx.lineWidth = 1; cx.beginPath();
    for (var i = 0; i < gotas.length; i++) { var g = gotas[i]; cx.moveTo(g.x, g.y); cx.lineTo(g.x - g.l * .12, g.y + g.l); g.y += g.v; g.x -= g.v * .12; if (g.y > h) { g.y = -20; g.x = Math.random() * w; } }
    cx.stroke();
    // gotas detenidas en el vidrio
    cx.fillStyle = 'rgba(235,242,252,.28)';
    for (var k = 0; k < 40; k++) { var x = (k * 97.3 % 1) * w + ((k * 53) % w), y = ((k * 131) % h); cx.beginPath(); cx.arc(x % w, y, 1.4 + (k % 3), 0, 6.3); cx.fill(); }
  }
  function rayo() {
    var r = el.querySelector('.aura-rayo'); r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash');
    if (html.getAttribute('data-efecto') === 'tormenta') rayoT = setTimeout(rayo, 5000 + Math.random() * 11000);
  }

  // ── Modo oscuro para lo que cada tablero pintó con colores fijos (fondos blancos, texto azul marino) ──
  // Recorre la página y cambia en línea solo lo claro u oscuro de más; al volver a claro se quita todo.
  function rgba(s) { var m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; var p = m[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function lum(c) { return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255; }
  var marcados = [], obs = null, pend = 0;
  function oscurecer() {
    var osc = html.getAttribute('data-modo') === 'oscuro';
    marcados.forEach(function (e) { var o = e.__auraOrig || {}; ['background-color', 'background-image', 'color', 'fill', 'stroke', 'border-color'].forEach(function (k) { if (o[k]) e.style.setProperty(k, o[k][0], o[k][1]); else e.style.removeProperty(k); }); delete e.__auraOrig; delete e.dataset.auraOsc; });
    marcados = [];
    if (!osc || !d.body) { if (obs) { obs.disconnect(); obs = null; } return; }
    var pan = getComputedStyle(html).getPropertyValue('--aura-panel').trim() || '14,22,42';
    var todos = d.body.querySelectorAll('main *, nav *, dialog, dialog *, .tip, aside:not(.aura-panel) *');
    for (var i = 0; i < todos.length; i++) {
      var e = todos[i]; if (e.closest('.aura-panel,.aura-fondo')) continue;
      var cs = getComputedStyle(e), hecho = false;
      if (!e.__auraOrig) { var o = {}; ['background-color', 'background-image', 'color', 'fill', 'stroke', 'border-color'].forEach(function (k) { var v = e.style.getPropertyValue(k); if (v) o[k] = [v, e.style.getPropertyPriority(k)]; }); e.__auraOrig = o; }
      if (e instanceof SVGElement) {
        if (e.tagName === 'text') {
          var f = rgba(cs.fill); if (f && f.a > .3 && lum(f) < .3) { e.style.setProperty('fill', '#E3EAF6', 'important'); hecho = true; }
          var st = rgba(cs.stroke); if (st && st.a > .3 && lum(st) > .8) { e.style.setProperty('stroke', 'rgba(14,22,42,.9)', 'important'); hecho = true; }
        }
      } else {
        var b = rgba(cs.backgroundColor);
        if (b && b.a > .2 && lum(b) > .78) { e.style.setProperty('background-color', 'rgba(' + pan + ',' + Math.min(.9, Math.max(.35, b.a * .8)).toFixed(2) + ')', 'important'); e.style.setProperty('border-color', 'rgba(255,255,255,.12)', 'important'); hecho = true; }
        var gi = cs.backgroundImage; if (!hecho && gi && gi.indexOf('gradient') > -1 && gi.indexOf('url(') < 0) { var g0 = rgba(gi); if (g0 && g0.a > .2 && lum(g0) > .8) { e.style.setProperty('background-image', 'none', 'important'); e.style.setProperty('background-color', 'rgba(' + pan + ',.55)', 'important'); hecho = true; } }
        var t = rgba(cs.color);
        if (t && lum(t) < .32) { e.style.setProperty('color', lum(t) < .18 ? '#EEF3FB' : '#C9D4E6', 'important'); hecho = true; }
      }
      if (hecho) { e.dataset.auraOsc = '1'; marcados.push(e); }
    }
    if (!obs && window.MutationObserver) {
      obs = new MutationObserver(function (ms) { if (ms.every(function (m) { return m.target.closest && m.target.closest('.aura-panel'); })) return; clearTimeout(pend); pend = setTimeout(function () { obs && obs.disconnect(); obs = null; oscurecer(); }, 250); });
    }
    if (obs) obs.observe(d.body, { childList: true, subtree: true });
  }

  // ── Panel de ajustes ──
  var panel = null, boton = null;
  function crearPanel() {
    boton = d.createElement('button'); boton.type = 'button'; boton.className = 'aura-boton'; boton.title = 'Ambiente y colores'; boton.setAttribute('aria-label', 'Ambiente y colores');
    boton.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><span>Ambiente</span>';
    panel = d.createElement('aside'); panel.className = 'aura-panel'; panel.hidden = true; panel.setAttribute('aria-label', 'Ambiente y colores');
    boton.onclick = function () { panel.hidden = !panel.hidden; if (!panel.hidden) pintarPanel(); };
    d.body.appendChild(boton); d.body.appendChild(panel);
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') panel.hidden = true; });
  }
  function seg(nombre, opciones, valor) {
    return '<div class="aura-seg" data-k="' + nombre + '">' + opciones.map(function (o) { return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === valor) + '"' + (o[2] ? ' title="' + o[2] + '"' : '') + '>' + o[1] + '</button>'; }).join('') + '</div>';
  }
  function pintarPanel() {
    var c = colorTema();
    panel.innerHTML = '<div class="aura-cab"><b>Ambiente de AURA</b><button type="button" class="aura-x" aria-label="Cerrar">×</button></div>' +
      '<p class="aura-ahora">' + (AMBIENTES[R.img] || R.img) + (R.efecto && R.efecto !== 'estrellas' ? ' · ' + R.efecto : '') + ' · modo ' + html.getAttribute('data-modo') + '<br><small>' + R.por + ' · sol ' + hh(SOL.sale) + '–' + hh(SOL.pone) + '</small></p>' +
      '<h4>Afuera de las ventanas</h4>' + seg('ambiente', [['auto', 'Tiempo real', 'Hora del sol y clima de San José'], ['kpi', 'Según KPI', 'Saludable = soleado · atención = nublado · riesgo = tormenta']], A.ambiente) +
      '<div class="aura-mini">' + Object.keys(AMBIENTES).map(function (k) { return '<button type="button" data-fijo="' + k + '" aria-pressed="' + (A.ambiente === k) + '"><i style="background-image:url(' + BASE + k + '.webp)"></i>' + AMBIENTES[k] + '</button>'; }).join('') + '</div>' +
      '<h4>Modo</h4>' + seg('modo', [['auto', 'Automático', 'Oscuro de noche y con tormenta'], ['claro', 'Claro'], ['oscuro', 'Oscuro']], A.modo) +
      '<h4>Tema de colores</h4><div class="aura-temas">' + Object.keys(TEMAS).map(function (k) { var t = TEMAS[k], cc = t.c || [A.custom.pri, A.custom.sec, A.custom.acento]; return '<button type="button" data-tema="' + k + '" aria-pressed="' + (A.tema === k) + '"><span>' + cc.map(function (x) { return '<i style="background:' + x + '"></i>'; }).join('') + '</span><b>' + t.n + '</b><small>' + t.d + '</small></button>'; }).join('') + '</div>' +
      (A.tema === 'custom' ? '<div class="aura-colores"><label>Principal<input type="color" data-c="pri" value="' + c.pri + '"></label><label>Secundario<input type="color" data-c="sec" value="' + c.sec + '"></label><label>Acento<input type="color" data-c="acento" value="' + c.acento + '"></label></div>' : '') +
      '<h4>Transparencia de los paneles</h4>' + seg('vidrio', Object.keys(VIDRIOS).map(function (k) { return [k, VIDRIOS[k].n + ' ' + Math.round(VIDRIOS[k].a * 100) + ' %', VIDRIOS[k].d]; }), A.vidrio) +
      '<label class="aura-chk"><input type="checkbox" data-efectos ' + (A.efectos ? 'checked' : '') + '> Lluvia, rayos y estrellas en movimiento</label>' +
      '<h4>Combinaciones rápidas</h4><div class="aura-presets">' + PRESETS.map(function (p, i) { return '<button type="button" data-preset="' + i + '">' + p.n + '</button>'; }).join('') + '</div>' +
      '<h4>Edificio</h4><div class="aura-presets"><button type="button" aria-pressed="true">Heavendly Corporate</button><button type="button" disabled title="Falta la imagen base de esa personalidad">Innovation Center · pronto</button><button type="button" disabled>Manufacturing Command Center · pronto</button><button type="button" disabled>Sustainability Campus · pronto</button><button type="button" disabled>Executive Penthouse · pronto</button></div>' +
      '<p class="aura-nota">Se guarda en este equipo. Clima: Open-Meteo.</p>';
    panel.querySelector('.aura-x').onclick = function () { panel.hidden = true; };
    [].forEach.call(panel.querySelectorAll('.aura-seg'), function (s) { [].forEach.call(s.querySelectorAll('button'), function (b) { b.onclick = function () { A[s.dataset.k] = b.dataset.v; guardar(); aplicar(); if (A.ambiente === 'auto') traerClima(); }; }); });
    [].forEach.call(panel.querySelectorAll('[data-fijo]'), function (b) { b.onclick = function () { A.ambiente = b.dataset.fijo; guardar(); aplicar(); }; });
    [].forEach.call(panel.querySelectorAll('[data-tema]'), function (b) { b.onclick = function () { A.tema = b.dataset.tema; guardar(); aplicar(); }; });
    [].forEach.call(panel.querySelectorAll('[data-c]'), function (i) { i.oninput = function () { A.custom[i.dataset.c] = i.value; guardar(); aplicar(); }; });
    [].forEach.call(panel.querySelectorAll('[data-preset]'), function (b) { b.onclick = function () { Object.assign(A, PRESETS[+b.dataset.preset].a); guardar(); aplicar(); if (A.ambiente === 'auto') traerClima(); }; });
    var ef = panel.querySelector('[data-efectos]'); ef.onchange = function () { A.efectos = ef.checked; guardar(); aplicar(); };
  }
  function hh(x) { var h = Math.floor(x), m = Math.round((x - h) * 60); if (m === 60) { h++; m = 0; } return h + ':' + (m < 10 ? '0' : '') + m; }

  function montar() {
    d.body.insertBefore(el, d.body.firstChild);
    if (!/[?&]panel=0/.test(location.search)) crearPanel();
    aplicar(); if (A.ambiente === 'auto') traerClima();
    setInterval(function () { SOL = sol(new Date(Date.now() - 6 * 36e5)); if (A.ambiente === 'auto') traerClima(); aplicar(); }, 2 * 60 * 1000);
    addEventListener('storage', function (e) { if (e.key === 'aura_ajustes') { A = leer(); aplicar(); } });
  }
  // Se pone el modo antes de dibujar, para que no parpadee
  (function () { var f = faseSol(), m = A.modo === 'oscuro' || (A.modo === 'auto' && (f === 'noche' || f === 'crepusculo' || (TEMAS[A.tema] || {}).oscuro)); html.setAttribute('data-modo', m ? 'oscuro' : 'claro'); html.setAttribute('data-tema', A.tema); html.setAttribute('data-vidrio', A.vidrio); html.style.setProperty('--aura-alfa', (VIDRIOS[A.vidrio] || VIDRIOS.balanceado).a); html.setAttribute('data-cielo', f); })();
  window.KurageCielo = { sol: function () { return { sale: SOL.sale, pone: SOL.pone }; }, fase: function () { return R ? R.fase : faseSol(); }, ajustes: function () { return A; }, aplicar: aplicar };
  if (d.body) montar(); else d.addEventListener('DOMContentLoaded', montar);
})();
