/* ============================================================
   realce.js — Mejora visual para las pantallas existentes
   Grupo Erlo S.A. / Heavendly Digital

   Se agrega al final de una página, sin cambiar su lógica ni su
   diseño, y hace tres cosas:
     1. Pone el cielo animado (fx/cielo.js) detrás de la página y
        vuelve semitransparentes los fondos para que se vea.
     2. Reemplaza el logo de baja resolución por el vector nítido.
     3. Anima los números cuando cambian (cuentan hasta el valor nuevo).

   USO (antes de </body>)
     <script src="fx/realce.js" data-numeros=".kpi-val"></script>

   ATRIBUTOS OPCIONALES
     data-numeros  selector CSS de los números a animar
     data-dim      oscurecimiento del cielo, 0..1 (0.42 por defecto)
     data-opacidad opacidad de paneles y tarjetas, 0..1 (0.8 por defecto)
     data-astros   "1" para mostrar el disco del sol y la luna (ocultos por defecto,
                   porque detrás de tablas parecen una mancha)

   Para apagarlo en una TV sin tocar código: agregar ?realce=0 a la URL.
   Los parámetros de fx/cielo.js (?cielo=, ?calidad=, ?cielodebug=1) también funcionan.
   ============================================================ */
(function () {
  'use strict';
  if (/[?&]realce=0\b/.test(location.search)) return;

  var yo = document.currentScript;
  var base = yo.src.replace(/realce\.js(\?.*)?$/, '');
  var cfg = {
    numeros: yo.getAttribute('data-numeros') || '',
    dim: parseFloat(yo.getAttribute('data-dim') || '0.42'),
    opacidad: parseFloat(yo.getAttribute('data-opacidad') || '0.8'),
    astros: yo.getAttribute('data-astros') === '1'
  };

  // Logo anterior: JPEG de 200×100 incrustado en estación, recepción y supervisor
  var LOGO_PREFIJO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2Q';
  var LOGO_LARGO = 5419;
  var LOGO_SVG = base + 'erlo-logo.svg';

  function cargar(src, listo) {
    var s = document.createElement('script');
    s.src = src; s.onload = listo; s.onerror = listo;
    document.head.appendChild(s);
  }

  // ── 1. Fondos semitransparentes ──
  function rgba(color, a) {
    color = (color || '').trim();
    var m = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) {
      var h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
      var n = parseInt(h, 16);
      return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
    }
    m = color.match(/^rgba?\(([^)]+)\)$/);
    if (m) { var p = m[1].split(',').map(function (x) { return x.trim(); }); return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')'; }
    return null;
  }

  function fondos() {
    var cs = getComputedStyle(document.documentElement);
    var reglas = [];
    [['--bg', Math.min(0.92, cfg.opacidad + 0.1)], ['--surface', cfg.opacidad], ['--surface2', cfg.opacidad + 0.04], ['--surface3', cfg.opacidad + 0.06]]
      .forEach(function (v) {
        var c = rgba(cs.getPropertyValue(v[0]), Math.min(0.97, v[1]));
        if (c) reglas.push(v[0] + ':' + c);
      });
    var st = document.createElement('style');
    st.id = 'erlo-realce';
    st.textContent = ':root{' + reglas.join(';') + '}' +
      'html,body{background:transparent!important}';
    document.head.appendChild(st);
  }

  // ── 2. Logo en alta definición ──
  function logos(raiz) {
    var imgs = (raiz || document).querySelectorAll ? (raiz || document).querySelectorAll('img') : [];
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i], src = im.getAttribute('src') || '';
      var esViejo = (src.length === LOGO_LARGO && src.indexOf(LOGO_PREFIJO) === 0) || /(^|\/)erlo-logo\.png(\?|$)/.test(src);
      if (esViejo) {
        im.setAttribute('src', LOGO_SVG); im.setAttribute('data-realce', 'logo');
        // El JPEG anterior traía fondo blanco; el vector es transparente
        im.style.background = '#fff'; im.style.borderRadius = '6px'; im.style.padding = '2px';
      }
    }
  }

  // ── 3. Números que cuentan ──
  var NUM = /^(\D*?)(\d{1,3}(?:[   .,]\d{3})+|\d+)(\D*)$/;
  var previos = {};
  var inicio = Date.now();

  function clave(el, i) { return el.id ? '#' + el.id : cfg.numeros + '@' + i; }

  function formatear(v, sep) {
    var s = String(Math.round(v));
    return sep ? s.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : s;
  }

  function animarNumeros() {
    if (!cfg.numeros || !window.gsap) return;
    var els = document.querySelectorAll(cfg.numeros);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el._contando) continue;
      var txt = (el.textContent || '').trim();
      var m = txt.match(NUM);
      var k = clave(el, i);
      if (!m) { delete previos[k]; continue; }
      var valor = parseInt(m[2].replace(/\D/g, ''), 10);
      var sepM = m[2].match(/[   .,]/);
      var antes = previos[k];
      previos[k] = valor;
      if (antes === valor) continue;
      if (antes === undefined && Date.now() - inicio > 15000) continue; // elemento nuevo más tarde: sin animar
      animar(el, antes || 0, valor, m[1], m[3], sepM ? sepM[0] : '');
    }
  }

  function animar(el, de, a, pre, suf, sep) {
    var o = { v: de };
    el._contando = true;
    el.textContent = pre + formatear(de, sep) + suf;
    window.gsap.to(o, {
      v: a, duration: de === 0 ? 1.3 : 1.1, ease: 'power3.out',
      onUpdate: function () { el.textContent = pre + formatear(o.v, sep) + suf; },
      onComplete: function () { el.textContent = pre + formatear(a, sep) + suf; el._contando = false; }
    });
    if (de !== 0) {
      window.gsap.fromTo(el, { textShadow: '0 0 20px rgba(150,205,255,.9)' },
        { textShadow: '0 0 0 rgba(0,0,0,0)', duration: 1.6, ease: 'power2.out', clearProps: 'textShadow' });
    }
  }

  // ── Entrada inicial: un solo momento al cargar ──
  function entrada() {
    if (!window.gsap || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var hijos = [].filter.call(document.body.children, function (el) {
      if (/^(SCRIPT|STYLE|LINK|CANVAS)$/.test(el.tagName)) return false;
      var cs = getComputedStyle(el);
      return cs.position !== 'fixed' && cs.display !== 'none' && cs.visibility !== 'hidden';
    });
    window.gsap.fromTo(hijos, { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, clearProps: 'opacity,transform' });
  }

  function arrancar() {
    fondos();
    logos();
    if (window.ErloCielo) window.ErloCielo.init({ dim: cfg.dim, astros: cfg.astros });
    entrada();
    var pendiente = false;
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        for (var j = 0; j < muts[i].addedNodes.length; j++) {
          var n = muts[i].addedNodes[j];
          if (n.nodeType === 1) logos(n.tagName === 'IMG' ? n.parentNode : n);
        }
      }
      if (!pendiente) { pendiente = true; requestAnimationFrame(function () { pendiente = false; animarNumeros(); }); }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    animarNumeros();
  }

  function listo() {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
    else arrancar();
  }

  var sinGsap = !window.gsap;
  cargar(base + 'cielo.js', function () {
    if (sinGsap) cargar(base + 'vendor/gsap.min.js', listo); else listo();
  });
})();
