/* ============================================================
   cielo.js — Fondo de cielo animado en tiempo real (WebGL)
   Grupo Erlo S.A. / Heavendly Digital

   El cielo se dibuja con un shader a la resolución nativa de la
   pantalla (hasta 4K), por eso no se pixela como una foto.
   Sigue la hora real de Costa Rica: amanecer, día, atardecer y
   noche con estrellas y luna.

   USO
     <script src="fx/cielo.js"></script>
     <script>ErloCielo.init({ dim: 0.35 });</script>

   OPCIONES (todas opcionales)
     hora:    'auto' | número 0-24 | 'amanecer' | 'dia' | 'atardecer' | 'noche'
     dim:     0..1  oscurece el cielo para que el texto se lea (0.35 por defecto)
     fps:     cuadros por segundo máximos (30 por defecto)
     calidad: 'auto' | 'alta' | 'media' | 'baja'
     nubes:   0..1  cantidad de nubes (0.65 por defecto)
     astros:  true/false  dibuja el disco del sol y la luna (true por defecto)

   PARÁMETROS EN LA URL (para probar en la TV sin tocar código)
     ?cielo=noche   ?calidad=media   ?fps=24   ?nubes=0.7   ?cielodebug=1
   ============================================================ */
(function (global) {
  'use strict';

  // ── Paleta por hora del día ───────────────────────────────
  // z = cénit, h = horizonte, s = sol, cl = nube iluminada, cs = sombra de nube
  // st = estrellas (0-1), mo = luna (0-1)
  var KEYS = [
    { t: 0.0,  z: '#02040d', h: '#0b1630', s: '#000000', cl: '#202a46', cs: '#060912', st: 1.0, mo: 1.0 },
    { t: 5.0,  z: '#03060f', h: '#101c38', s: '#000000', cl: '#222c48', cs: '#070a14', st: 1.0, mo: 0.9 },
    { t: 5.8,  z: '#121c45', h: '#c76a5a', s: '#ff8a50', cl: '#e09080', cs: '#2c2440', st: 0.45, mo: 0.1 },
    { t: 6.4,  z: '#24407e', h: '#f5a46e', s: '#ffb066', cl: '#ffc8a0', cs: '#5d5070', st: 0.1, mo: 0.0 },
    { t: 7.6,  z: '#2b67b4', h: '#f2cfa8', s: '#ffe0b0', cl: '#fff2e2', cs: '#8a91ad', st: 0.0, mo: 0.0 },
    { t: 10.0, z: '#1c5cc0', h: '#a9cff0', s: '#fff6e2', cl: '#ffffff', cs: '#97a7c2', st: 0.0, mo: 0.0 },
    { t: 15.0, z: '#1d5ab8', h: '#b3d2ee', s: '#fff2d8', cl: '#ffffff', cs: '#93a2bd', st: 0.0, mo: 0.0 },
    { t: 16.9, z: '#2a57a6', h: '#f1c089', s: '#ffd49a', cl: '#ffe4c4', cs: '#7d7f9e', st: 0.0, mo: 0.0 },
    { t: 17.7, z: '#202a62', h: '#ff8551', s: '#ff7a3c', cl: '#ffa070', cs: '#4a2f50', st: 0.05, mo: 0.0 },
    { t: 18.3, z: '#111a42', h: '#a5486a', s: '#ff5a40', cl: '#c06a7a', cs: '#24203e', st: 0.3, mo: 0.2 },
    { t: 19.2, z: '#060b22', h: '#2a2650', s: '#000000', cl: '#3a3460', cs: '#0d0e22', st: 0.8, mo: 0.8 },
    { t: 20.5, z: '#03050f', h: '#0d1834', s: '#000000', cl: '#222c48', cs: '#070a14', st: 1.0, mo: 1.0 },
    { t: 24.0, z: '#02040d', h: '#0b1630', s: '#000000', cl: '#202a46', cs: '#060912', st: 1.0, mo: 1.0 }
  ];
  var NOMBRES = { amanecer: 6.3, dia: 11.5, 'día': 11.5, atardecer: 17.8, noche: 22 };

  function hex(c) { var n = parseInt(c.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function lerp3(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; }
  function smooth(k) { return k * k * (3 - 2 * k); }

  function paleta(hora) {
    hora = ((hora % 24) + 24) % 24;
    var i = 0;
    while (i < KEYS.length - 2 && KEYS[i + 1].t <= hora) i++;
    var a = KEYS[i], b = KEYS[i + 1];
    var k = smooth((hora - a.t) / (b.t - a.t));
    // Sol: sale ~6:00, se pone ~18:00 (Costa Rica, casi constante todo el año)
    var dia = (hora - 5.9) / 12.2;
    var sol = [lerp(0.1, 0.9, dia), Math.sin(Math.PI * Math.min(Math.max(dia, 0), 1)) * 0.98 - 0.04];
    return {
      z: lerp3(hex(a.z), hex(b.z), k), h: lerp3(hex(a.h), hex(b.h), k), s: lerp3(hex(a.s), hex(b.s), k),
      cl: lerp3(hex(a.cl), hex(b.cl), k), cs: lerp3(hex(a.cs), hex(b.cs), k),
      st: lerp(a.st, b.st, k), mo: lerp(a.mo, b.mo, k), sol: sol
    };
  }

  // ── Shaders (WebGL 1 para máxima compatibilidad con TVs) ──
  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

  var FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 uRes;uniform float uT;uniform float uDim;uniform float uOct;uniform float uCover;',
    'uniform vec3 uZ;uniform vec3 uH;uniform vec3 uS;uniform vec3 uCL;uniform vec3 uCS;',
    'uniform vec2 uSol;uniform float uSt;uniform float uMo;uniform float uAstro;',
    'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float vn(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*f*(f*(f*6.-15.)+10.);',
    '  return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}',
    'const mat2 R=mat2(1.6,1.2,-1.2,1.6);',
    'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<8;i++){if(float(i)>=uOct)break;s+=a*vn(p);p=R*p;a*=.5;}return s;}',
    'float fbm3(vec2 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*vn(p);p=R*p;a*=.5;}return s;}',
    // Ruido "billow" (algodonoso) para el detalle de los bordes de nube
    'float bil(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){if(float(i)>=uOct-2.)break;s+=a*abs(vn(p)*2.-1.);p=R*p;a*=.5;}return s;}',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;vec2 p=vec2(uv.x*asp,uv.y);',
    '  float y=uv.y;float px=1./uRes.y;',
    // Degradado del cielo con dispersión atmosférica suave
    '  vec3 col=mix(uH,uZ,pow(smoothstep(-.05,1.,y),.62));',
    '  col+=uH*.18*exp(-y*7.);',
    // Sol y halo
    '  vec2 sp=vec2(uSol.x*asp,uSol.y);float d=length(p-sp);float sv=smoothstep(-.12,.05,uSol.y);',
    '  float alto=smoothstep(.25,.8,uSol.y);col+=uS*sv*(.2*exp(-d*2.2)+mix(.5,.32,alto)*exp(-d*9.)+.25*exp(-d*40.)+uAstro*mix(1.4,.55,alto)*smoothstep(.032,.032-2.*px,d));',
    // Estrellas: 3 capas, nítidas a cualquier resolución, con color y centelleo
    '  if(uSt>.01){',
    '    for(int L=0;L<3;L++){float sc=L==0?42.:(L==1?85.:160.);vec2 g=p*sc;vec2 id=floor(g);vec2 f=fract(g)-.5;',
    '      float r=h21(id+float(L)*17.3);float th=L==0?.982:(L==1?.972:.962);',
    '      if(r>th){vec2 o=vec2(h21(id+3.1),h21(id+7.7))-.5;float sd=length(f-o*.6)/sc;',
    '        float m=(r-th)/(1.-th);float tw=.6+.4*sin(uT*(.8+m*3.)+r*80.);',
    '        float core=smoothstep(px*(1.2+m*1.6),0.,sd);float glow=exp(-sd/(px*(1.6+m*4.)))*.3*smoothstep(.48/sc,.25/sc,sd);',
    '        vec3 sc3=mix(vec3(.75,.85,1.),vec3(1.,.88,.72),h21(id+11.));',
    '        col+=uSt*uSt*tw*(core+glow)*(.3+.9*m)*sc3*smoothstep(.06,.5,y);}}',
    '  }',
    // Luna con oscurecimiento de borde y mares
    '  vec2 mp=vec2(.8*asp,.8);vec2 mq=(p-mp)/.03;float mr=length(mq);',
    '  float moonDisc=smoothstep(1.,1.-2.5*px/.03,mr);',
    '  float maria=smoothstep(.45,.75,fbm3(mq*1.3+3.))*.28+smoothstep(.55,.8,vn(mq*4.))*.08;',
    '  vec3 moonCol=vec3(.93,.95,1.)*(.72+.28*sqrt(max(0.,1.-mr*mr)))*(1.-maria);',
    '  col=mix(col,moonCol,moonDisc*uMo*uAstro);',
    '  col+=uMo*vec3(.35,.45,.7)*(.14*exp(-length(p-mp)*7.)+.05*exp(-length(p-mp)*2.))*(1.-moonDisc);',
    // Nubes: plano en perspectiva + deformación de dominio + erosión de bordes
    '  float dep=1./(y+.3);vec2 cp=vec2((p.x-asp*.5)*dep,dep*1.7);',
    '  vec2 w=vec2(uT*.006,uT*.0012);',
    '  vec2 wq=vec2(fbm3(cp*.6+w*.5),fbm3(cp*.6+vec2(5.2,1.3)-w*.3));',
    '  vec2 cq=cp*1.1+wq*1.25+w;',
    '  float base=fbm(cq);',
    '  float det=bil(cq*3.3+w*3.);',
    '  float den=base-(1.-base)*det*.42;',
    '  vec2 ld=normalize(vec2(sp.x-p.x,max(sp.y-p.y,-.25))+1e-4);',
    '  float den2=fbm(cq+ld*.05)-(1.-base)*det*.42;',
    '  float edge=mix(.06,.11,smoothstep(.0,.5,y));',
    '  float cov=smoothstep(uCover,uCover+edge,den);',
    '  float thick=smoothstep(uCover,uCover+.4,den);',
    '  float lit=clamp(.5+(den-den2)*9.,0.,1.);',
    '  vec3 cc=mix(uCS,uCL,lit);',
    '  cc*=1.-.28*thick*(1.-lit);', // bases más densas y oscuras
    '  cc=mix(cc,uZ*.6+uCL*.4,.12*(1.-thick));', // luz ambiente del cielo
    '  cc+=uS*sv*.7*exp(-d*3.)*(1.-thick*.8);', // borde plateado cerca del sol
    '  cc=mix(cc,uH,.38*smoothstep(.42,0.,y));', // bruma en el horizonte
    '  cov*=smoothstep(-.02,.28,y);',
    '  col=mix(col,cc,cov*.96);',
    // Legibilidad: oscurecer y viñeta
    '  float vig=1.-.32*pow(length((uv-.5)*vec2(1.,.85))*1.25,2.2);',
    '  col*=(1.-uDim)*vig;',
    '  col=mix(col,col*vec3(.82,.88,1.05),uDim*.5);',
    // Tramado para eliminar el bandeo en degradados (clave en TVs grandes)
    '  col+=(h21(gl_FragCoord.xy+fract(uT*.37)*91.)-.5)/255.;',
    '  gl_FragColor=vec4(clamp(col,0.,1.),1.);',
    '}'
  ].join('\n');

  var st = null;

  function leerURL() {
    var q = {};
    try { new URLSearchParams(location.search).forEach(function (v, k) { q[k] = v; }); } catch (e) {}
    return q;
  }

  function horaCR() {
    // Hora de Costa Rica (UTC-6) sin importar la zona configurada en la TV
    var d = new Date();
    var utc = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
    return (utc - 6 + 24) % 24;
  }

  function horaObjetivo() {
    var h = st.opt.hora;
    if (typeof h === 'number') return h;
    if (NOMBRES[h] !== undefined) return NOMBRES[h];
    var n = parseFloat(h);
    if (!isNaN(n)) return n;
    return horaCR();
  }

  function compilar(gl, tipo, src) {
    var s = gl.createShader(tipo);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function crearGL() {
    var gl = st.canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false,
      premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' })
      || st.canvas.getContext('experimental-webgl');
    if (!gl) return false;
    var pr = gl.createProgram();
    gl.attachShader(pr, compilar(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(pr, compilar(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var u = {};
    ['uRes', 'uT', 'uDim', 'uOct', 'uCover', 'uZ', 'uH', 'uS', 'uCL', 'uCS', 'uSol', 'uSt', 'uMo', 'uAstro']
      .forEach(function (n) { u[n] = gl.getUniformLocation(pr, n); });
    st.gl = gl; st.u = u;
    return true;
  }

  // Niveles de calidad: escala de resolución (sobre los píxeles físicos) y octavas de detalle
  var NIVELES = [
    { escala: 1.0,  oct: 8 },  // nativa / 4K
    { escala: 1.0,  oct: 7 },
    { escala: 0.8,  oct: 6 },
    { escala: 0.66, oct: 5 },
    { escala: 0.5,  oct: 5 },
    { escala: 0.4,  oct: 4 }
  ];
  var MAX_PIXELES = 3840 * 2160;

  function ajustarTamano() {
    var c = st.canvas, dpr = global.devicePixelRatio || 1;
    var cssW = c.clientWidth || global.innerWidth, cssH = c.clientHeight || global.innerHeight;
    var esc = NIVELES[st.nivel].escala * dpr;
    var w = Math.round(cssW * esc), h = Math.round(cssH * esc);
    var f = Math.sqrt(MAX_PIXELES / Math.max(1, w * h));
    if (f < 1) { w = Math.round(w * f); h = Math.round(h * f); }
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  }

  function fallbackCSS() {
    var p = paleta(horaObjetivo());
    function css(v, k) { return 'rgb(' + v.map(function (x) { return Math.round(x * 255 * k); }).join(',') + ')'; }
    var k = 1 - st.opt.dim;
    st.canvas.style.background = 'linear-gradient(to top,' + css(p.h, k) + ',' + css(p.z, k) + ')';
  }

  function dibujar(ahora) {
    var gl = st.gl, u = st.u, p = paleta(horaObjetivo());
    ajustarTamano();
    gl.viewport(0, 0, st.canvas.width, st.canvas.height);
    gl.uniform2f(u.uRes, st.canvas.width, st.canvas.height);
    gl.uniform1f(u.uT, (ahora - st.t0) / 1000 + st.semilla);
    gl.uniform1f(u.uDim, st.opt.dim);
    gl.uniform1f(u.uOct, NIVELES[st.nivel].oct);
    gl.uniform1f(u.uCover, lerp(0.66, 0.36, st.opt.nubes));
    gl.uniform3fv(u.uZ, p.z); gl.uniform3fv(u.uH, p.h); gl.uniform3fv(u.uS, p.s);
    gl.uniform3fv(u.uCL, p.cl); gl.uniform3fv(u.uCS, p.cs);
    gl.uniform2f(u.uSol, p.sol[0], p.sol[1]);
    gl.uniform1f(u.uSt, p.st); gl.uniform1f(u.uMo, p.mo);
    gl.uniform1f(u.uAstro, st.opt.astros ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // Calidad adaptativa: si la pantalla no sostiene los fps, baja un nivel; si sobra, sube
  function evaluar(dt) {
    if (st.opt.calidad !== 'auto') return;
    st.muestras.push(dt);
    if (st.muestras.length < 45) return;
    st.muestras.sort(function (a, b) { return a - b; });
    var med = st.muestras[Math.floor(st.muestras.length / 2)];
    st.muestras = [];
    var objetivo = 1000 / st.opt.fps;
    if (med > objetivo * 1.35 && st.nivel < NIVELES.length - 1) { st.nivel++; st.estable = 0; }
    else if (med < objetivo * 1.05) {
      st.estable++;
      if (st.estable >= 4 && st.nivel > st.nivelMin) { st.nivel--; st.estable = 0; }
    }
  }

  function bucle(ahora) {
    st.raf = global.requestAnimationFrame(bucle);
    if (document.hidden) return;
    var intervalo = st.reducido ? 2000 : 1000 / st.opt.fps;
    if (ahora - st.ultimo < intervalo - 2) return;
    if (st.ultimo) evaluar(ahora - st.ultimo);
    st.ultimo = ahora;
    try { dibujar(ahora); } catch (e) { console.warn('cielo.js:', e); }
    if (st.debug) {
      st.cuadros++;
      if (ahora - st.tDebug > 1000) {
        st.debug.textContent = st.canvas.width + '×' + st.canvas.height + ' · nivel ' + st.nivel +
          ' · ' + st.cuadros + ' fps · ' + horaObjetivo().toFixed(2) + 'h';
        st.cuadros = 0; st.tDebug = ahora;
      }
    }
  }

  function init(opciones) {
    if (st) return api;
    var q = leerURL();
    var o = opciones || {};
    var opt = {
      hora: q.cielo || o.hora || 'auto',
      dim: q.dim !== undefined ? +q.dim : (o.dim !== undefined ? o.dim : 0.35),
      fps: +(q.fps || o.fps || 30),
      calidad: q.calidad || o.calidad || 'auto',
      nubes: q.nubes !== undefined ? +q.nubes : (o.nubes !== undefined ? o.nubes : 0.65),
      astros: q.astros !== undefined ? q.astros !== '0' : o.astros !== false
    };
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;display:block;pointer-events:none';
    // Va en <html> y no en <body>: así no lo afecta un zoom o transform aplicado al body
    document.documentElement.insertBefore(canvas, document.body);

    var nivelMin = { alta: 0, media: 2, baja: 4 }[opt.calidad];
    st = {
      canvas: canvas, opt: opt, t0: performance.now(), semilla: Math.random() * 500,
      nivel: nivelMin !== undefined ? nivelMin : 1, nivelMin: nivelMin !== undefined ? nivelMin : 0,
      muestras: [], estable: 0, ultimo: 0, cuadros: 0, tDebug: 0,
      reducido: global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
    if (q.cielodebug) {
      st.debug = document.createElement('div');
      st.debug.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;font:12px monospace;color:#fff;background:rgba(0,0,0,.55);padding:4px 8px;border-radius:4px';
      document.body.appendChild(st.debug);
    }

    var ok = false;
    try { ok = crearGL(); } catch (e) { console.warn('cielo.js: WebGL no disponible', e); }
    if (!ok) { fallbackCSS(); setInterval(fallbackCSS, 60000); return api; }

    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); global.cancelAnimationFrame(st.raf); });
    canvas.addEventListener('webglcontextrestored', function () { try { crearGL(); st.raf = global.requestAnimationFrame(bucle); } catch (e) {} });
    st.raf = global.requestAnimationFrame(bucle);
    return api;
  }

  var api = {
    init: init,
    paleta: paleta,
    info: function () { return st && { ancho: st.canvas.width, alto: st.canvas.height, nivel: st.nivel, hora: horaObjetivo() }; },
    setHora: function (h) { if (st) st.opt.hora = h; },
    setDim: function (d) { if (st) st.opt.dim = d; }
  };
  global.ErloCielo = api;
})(window);
