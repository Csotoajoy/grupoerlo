/* ============================================================
   motion.js — Animaciones de datos para las pantallas de planta
   Grupo Erlo S.A. / Heavendly Digital

   Usa GSAP (fx/vendor/gsap.min.js) si está cargado; si no, las
   funciones igual actualizan el contenido, sin animación.

   ErloFX.contar(el, valor)        número que cuenta hasta su valor nuevo
   ErloFX.entrar(elementos)        entrada escalonada (primera carga)
   ErloFX.destello(el, color)      brillo breve cuando un dato cambia
   ErloFX.barra(el, pct)           barra de progreso que se llena
   ErloFX.desplazar(cont, interior) desplazamiento automático vertical (listas largas en TV)
   ============================================================ */
(function (global) {
  'use strict';
  var G = function () { return global.gsap; };
  var reducido = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = function (n) { return Math.round(n).toLocaleString('es-CR'); };

  function contar(el, valor, opt) {
    if (!el) return;
    opt = opt || {};
    var formato = opt.formato || fmt;
    var nuevo = Number(valor);
    if (isNaN(nuevo)) { el.textContent = valor == null ? '—' : valor; el.dataset.v = ''; return; }
    var previo = el.dataset.v === undefined || el.dataset.v === '' ? 0 : Number(el.dataset.v);
    el.dataset.v = nuevo;
    if (!G() || reducido || previo === nuevo) { el.textContent = formato(nuevo); return; }
    var o = { v: previo };
    G().to(o, { v: nuevo, duration: opt.duracion || 1.4, ease: 'power3.out',
      onUpdate: function () { el.textContent = formato(o.v); } });
    if (el.dataset.v !== '' && previo !== 0) destello(el);
  }

  function entrar(elementos, opt) {
    opt = opt || {};
    if (!G() || reducido) return;
    G().fromTo(elementos,
      { opacity: 0, y: opt.y == null ? 28 : opt.y },
      { opacity: 1, y: 0, duration: opt.duracion || 0.9,
        ease: 'expo.out', stagger: opt.escalonado == null ? 0.07 : opt.escalonado, delay: opt.retraso || 0,
        clearProps: 'transform' });
  }

  function destello(el, color) {
    if (!el || !G() || reducido) return;
    G().fromTo(el, { textShadow: '0 0 22px ' + (color || 'rgba(140,200,255,.95)') },
      { textShadow: '0 0 0px rgba(0,0,0,0)', duration: 1.6, ease: 'power2.out', clearProps: 'textShadow' });
  }

  function barra(el, pct) {
    if (!el) return;
    pct = Math.max(0, Math.min(100, pct || 0));
    if (!G() || reducido) { el.style.width = pct + '%'; return; }
    G().to(el, { width: pct + '%', duration: 1.6, ease: 'power3.inOut' });
  }

  // Desplazamiento lento y continuo de una lista cuando no cabe en pantalla
  function desplazar(contenedor, interior) {
    if (!contenedor || !interior || !G()) return;
    if (interior._tl) { interior._tl.kill(); G().set(interior, { y: 0 }); }
    var exceso = interior.scrollHeight - contenedor.clientHeight;
    if (exceso <= 4 || reducido) return;
    var dur = Math.max(8, exceso / 22);
    interior._tl = G().timeline({ repeat: -1, repeatDelay: 2, delay: 4 })
      .to(interior, { y: -exceso, duration: dur, ease: 'none' })
      .to(interior, { y: 0, duration: 1.2, ease: 'power2.inOut', delay: 4 });
  }

  global.ErloFX = { contar: contar, entrar: entrar, destello: destello, barra: barra, desplazar: desplazar, formato: fmt };
})(window);
