
/* ======================= CONFIG (vem do painel) ======================= */
const SITE = window.SITE || {};
const WHATS = SITE.whatsapp || "";
const C = SITE.cores || {};
const col = (v, d) => parseInt(String(v || d).replace('#',''), 16);
// tema claro (teste): index.html?tema=claro
const LIGHT = document.documentElement.classList.contains('tema-claro');
const LC = (dark, light) => LIGHT ? light : dark;
const LB = LC('111,174,255','0,82,194'); // azul-claro dos canvases
// navbar branca: logo com as partes brancas em preto
if (LIGHT) document.querySelectorAll('header.nav .logo img').forEach(img => img.src = 'assets/img/logo-escura.png');
// menu: marca o link da seção visível
(() => {
  const links = [...document.querySelectorAll('nav.menu a[href^="#"]:not(.btn)')];
  const secs = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const mark = () => {
    const y = innerHeight * .35; let cur = secs[0];
    secs.forEach(s => { if (s.getBoundingClientRect().top <= y) cur = s; });
    links.forEach(a => a.classList.toggle('ativo', cur && a.getAttribute('href') === '#' + cur.id));
  };
  addEventListener('scroll', mark, {passive:true}); mark();
})();

/* ======================= PLANOS: efeito 3D ======================= */
if (matchMedia('(hover:hover)').matches) document.querySelectorAll('.plan').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect(), x = (e.clientX-r.left)/r.width, y = (e.clientY-r.top)/r.height;
    card.style.transform = `rotateY(${(x-.5)*14}deg) rotateX(${(.5-y)*12}deg) translateY(-6px)`;
    card.style.setProperty('--mx', x*100+'%'); card.style.setProperty('--my', y*100+'%');
  });
  card.addEventListener('mouseleave', () => card.style.transform = '');
});

/* ======================= UI ======================= */
const yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
const burger = document.getElementById('burger');
if (burger) burger.addEventListener('click', () => document.body.classList.toggle('menu-open'));
document.querySelectorAll('#menu a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

// GSAP + Lenis quando disponíveis (e sem "reduzir movimento"); senão, revelação simples por IntersectionObserver
const HAS_GSAP = !!(window.gsap && window.ScrollTrigger) && !matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!HAS_GSAP) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }), {threshold:.15});
  document.querySelectorAll('.reveal').forEach((el,i) => { el.style.transitionDelay = (i%4)*80+'ms'; io.observe(el); });
}

const lead = document.getElementById('leadForm');
if (lead) lead.addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const txt = `*Pré-cadastro pelo site - ${encodeURIComponent(SITE.nome || 'TG Telecom')}*%0A`+
    `Nome: ${encodeURIComponent(f.get('nome'))}%0AWhatsApp: ${encodeURIComponent(f.get('fone'))}%0A`+
    `Plano: ${encodeURIComponent(f.get('plano'))}%0AEndereço: ${encodeURIComponent(f.get('endereco'))}%0A`+
    `Obs: ${encodeURIComponent(f.get('obs')||'-')}`;
  window.open(`https://api.whatsapp.com/send?phone=${WHATS}&text=${txt}`, '_blank');
});

/* ======================= HERO: FASES DE TEXTO ======================= */
const hero = document.getElementById('inicio');
const phases = [...document.querySelectorAll('.phase')];
const bars = [...document.querySelectorAll('.progress b')];
const hint = document.getElementById('hint') || {style:{}};
let target = 0, prog = 0;
function heroProgress(){
  if (!hero) return 0;
  const r = hero.getBoundingClientRect();
  const total = hero.offsetHeight - innerHeight;
  return Math.min(1, Math.max(0, -r.top / total));
}
function onScroll(){
  target = heroProgress();
  document.body.classList.toggle('scrolled', scrollY > 40);
}
addEventListener('scroll', onScroll, {passive:true}); onScroll();

function updateCopy(p){
  phases.forEach((ph,i) => {
    const a = +ph.dataset.from, b = +ph.dataset.to, fade = .07;
    const c01 = v => Math.min(1, Math.max(0, v));
    const fin = i===0 ? 1 : c01((p-a)/fade);
    const fout = i===phases.length-1 ? 1 : c01((b-p)/fade);
    const o = fin * fout;
    const local = (p - a) / (b - a);
    ph.style.opacity = o;
    ph.style.transform = `translateY(calc(-50% + ${(local-.5)*-60}px)) scale(${.96+o*.04})`;
    ph.classList.toggle('active', o > .5);
  });
  bars.forEach((b,i) => b.style.setProperty('--f', Math.min(1, Math.max(0, (p - i/3)*3))));
  hint.style.opacity = p > .03 ? 0 : 1;
}

/* ======================= HERO: CENA 3D (Three.js) ======================= */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mouse = {x:0,y:0,tx:0,ty:0};
addEventListener('pointermove', e => { mouse.tx = e.clientX/innerWidth-.5; mouse.ty = e.clientY/innerHeight-.5; });

function initScene(){
  if (!window.THREE || !hero || SITE.animacao3d === false) return null;
  const canvas = document.getElementById('scene');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true}); } catch(e){ return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(LIGHT ? 0xffffff : col(C.fundo,'#030b18'), .018);
  const BLEND = LIGHT ? THREE.NormalBlending : THREE.AdditiveBlending;
  const camera = new THREE.PerspectiveCamera(55, 1, .1, 400);

  const GREEN = new THREE.Color(col(C.verde,'#10B033')), BLUE = new THREE.Color(col(C.azul,'#1466ff')), CYAN = new THREE.Color(col(C.azul_claro,'#38b6ff'));
  const mobile = innerWidth < 700;

  // textura de brilho (sprite)
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.25,'rgba(255,255,255,.7)'); gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c);
  })();

  /* ---- GLOBO COM MAPA-MÚNDI (começa no Brasil, Pernambuco em destaque) ---- */
  const globe = new THREE.Group(); scene.add(globe);
  const R = 5;
  const GD = window.GLOBE_DATA || null;
  const D2R = Math.PI/180;
  const ll2v = (lat, lon, r = R) => new THREE.Vector3(r*Math.cos(lat*D2R)*Math.sin(lon*D2R), r*Math.sin(lat*D2R), r*Math.cos(lat*D2R)*Math.cos(lon*D2R));
  const LIME = new THREE.Color(col(C.verde_claro,'#3EE26A'));
  const WHITE = new THREE.Color(0xffffff);
  if (LIGHT) { GREEN.set('#2F74D6'); BLUE.set('#9CC0F0'); CYAN.set('#0044A0'); LIME.set('#0052C2'); WHITE.set('#002A66'); }
  const nodes = [];
  function pointsLayer(flat, colorFn, size, opacity = 1){
    const n = flat.length/2, pos = new Float32Array(n*3), cols = new Float32Array(n*3);
    for (let i=0;i<n;i++){
      const v = ll2v(flat[i*2], flat[i*2+1]); pos.set([v.x,v.y,v.z], i*3);
      const c = colorFn(flat[i*2], flat[i*2+1]); cols.set([c.r,c.g,c.b], i*3);
      if (i % 7 === 0) nodes.push(v);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos,3));
    g.setAttribute('color', new THREE.BufferAttribute(cols,3));
    const m = new THREE.PointsMaterial({size, map:glowTex, vertexColors:true, transparent:true, opacity, depthWrite:false, blending:BLEND});
    const pts = new THREE.Points(g, m); globe.add(pts); return m;
  }
  const mats = [];
  let peMat = null, peLine = null, recifeV = null, peLabel = null, recifePulse = null;
  if (GD) {
    // continentes (azul → ciano conforme a latitude)
    mats.push(pointsLayer(GD.land, lat => BLUE.clone().lerp(GREEN, (lat+60)/140), .085, .9));
    // Brasil em verde
    mats.push(pointsLayer(GD.br, () => CYAN, .1, 1));
    // Pernambuco em destaque
    peMat = pointsLayer(GD.pe, () => WHITE, .13, 1); mats.push(peMat);
    const ol = []; for (let i=0;i<GD.peOutline.length;i+=2) ol.push(ll2v(GD.peOutline[i], GD.peOutline[i+1], R*1.004));
    peLine = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ol), new THREE.LineBasicMaterial({color:LIGHT ? 0x002A66 : 0xffffff, transparent:true, opacity:.9}));
    globe.add(peLine);
    recifeV = ll2v(GD.recife[0], GD.recife[1], R*1.01);
    recifePulse = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex, color:LIME, transparent:true, depthWrite:false, blending:BLEND}));
    recifePulse.position.copy(recifeV); globe.add(recifePulse);
    // rótulo "PERNAMBUCO"
    const lc = document.createElement('canvas'); lc.width = 512; lc.height = 128;
    const lg = lc.getContext('2d');
    lg.font = '700 54px Inter, sans-serif'; lg.textAlign = 'center'; lg.textBaseline = 'middle';
    lg.shadowColor = LC('rgba(0,0,0,.8)','rgba(255,255,255,.95)'); lg.shadowBlur = 12; lg.fillStyle = LC('#ffffff','#002A66');
    lg.fillText(String(SITE.regiao || 'PERNAMBUCO').toUpperCase(), 256, 64);
    peLabel = new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(lc), transparent:true, depthWrite:false}));
    peLabel.scale.set(2.2, .55, 1);
    peLabel.position.copy(ll2v(-6.2, -37.8, R*1.14)); globe.add(peLabel);
  } else {
    // sem dados do mapa: esfera de pontos simples
    const N = mobile ? 900 : 1800, flat = [];
    for (let i=0;i<N;i++){ const y = 1-(i/(N-1))*2, th = Math.PI*(3-Math.sqrt(5))*i; flat.push(Math.asin(y)/D2R, ((th/D2R)%360)-180); }
    mats.push(pointsLayer(flat, lat => GREEN.clone().lerp(CYAN, (lat+90)/180), .09));
  }
  const gMat = { set opacity(v){ mats.forEach(m => m.opacity = v); } };

  // oceano (esfera escura que esconde o lado de trás do mapa)
  const core = new THREE.Mesh(new THREE.SphereGeometry(R*.985, 64, 64), new THREE.MeshBasicMaterial({color:LIGHT ? 0xF4F8FF : 0x001535, transparent:true, opacity:LIGHT ? .94 : .9}));
  core.renderOrder = -1; globe.add(core);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex, color:col(C.azul,'#1466ff'), transparent:true, opacity:LIGHT ? .14 : .35, depthWrite:false, blending:BLEND}));
  halo.scale.set(R*3.4, R*3.4, 1); globe.add(halo);
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R*1.002, 3)),
    new THREE.LineBasicMaterial({color:col(C.azul,'#1466ff'), transparent:true, opacity:.07, blending:BLEND}));
  globe.add(wire);

  // arcos: metade sai de Recife para o mundo
  const arcs = [], ARCS = mobile ? 22 : 40;
  for (let i=0;i<ARCS;i++){
    const a = (recifeV && i % 2 === 0) ? recifeV : nodes[(Math.random()*nodes.length)|0];
    const b = nodes[(Math.random()*nodes.length)|0];
    const dist = a.distanceTo(b); if (dist < 2) { i--; continue; }
    const mid = a.clone().add(b).multiplyScalar(.5).normalize().multiplyScalar(R + dist*.42);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const col2 = a === recifeV ? LIME : (Math.random() > .5 ? GREEN : CYAN);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(50)),
      new THREE.LineBasicMaterial({color:col2, transparent:true, opacity:.45, blending:BLEND}));
    globe.add(line);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex, color:col2, transparent:true, depthWrite:false, blending:BLEND}));
    s.scale.setScalar(.4); globe.add(s);
    arcs.push({curve, s, t:Math.random(), v:.18+Math.random()*.3});
  }
  // posição inicial: Brasil de frente (centro aproximado do Nordeste/Brasil)
  const LON0 = 27*D2R, LAT0 = -10*D2R;

  // órbita/anel
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R*1.45, .015, 8, 200), new THREE.MeshBasicMaterial({color:col(C.verde,'#10B033'), transparent:true, opacity:.6}));
  ring.rotation.x = Math.PI/2.3; globe.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(R*1.7, .01, 8, 200), new THREE.MeshBasicMaterial({color:col(C.azul_claro,'#38b6ff'), transparent:true, opacity:.35}));
  ring2.rotation.x = Math.PI/1.8; ring2.rotation.y = .4; globe.add(ring2);

  /* ---- TÚNEL DE FIBRA ÓPTICA ---- */
  const tunnel = new THREE.Group(); scene.add(tunnel);
  const FIB = mobile ? 70 : 140, fibers = [];
  const Z0 = -20, Z1 = -190;
  for (let i=0;i<FIB;i++){
    const ang = Math.random()*Math.PI*2, rad = 2.2 + Math.random()*6;
    const wob = Math.random()*Math.PI*2, pts = [];
    for (let k=0;k<=24;k++){
      const z = Z0 + (Z1-Z0)*k/24;
      const a2 = ang + Math.sin(k*.35+wob)*.35;
      pts.push(new THREE.Vector3(Math.cos(a2)*rad, Math.sin(a2)*rad, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const col = i%3===0 ? GREEN : (i%3===1 ? CYAN : BLUE);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(120)),
      new THREE.LineBasicMaterial({color:col, transparent:true, opacity:.35, blending:BLEND}));
    tunnel.add(line);
    for (let j=0;j<2;j++){
      const s = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex, color:col, transparent:true, depthWrite:false, blending:BLEND}));
      s.scale.set(.5,.5,1); tunnel.add(s);
      fibers.push({curve, s, t:Math.random(), v:.05+Math.random()*.08});
    }
  }
  // anéis do túnel
  for (let i=0;i<18;i++){
    const r = new THREE.Mesh(new THREE.TorusGeometry(9, .02, 6, 120), new THREE.MeshBasicMaterial({color: i%2?col(C.verde,'#10B033'):col(C.azul,'#1466ff'), transparent:true, opacity:.25}));
    r.position.z = Z0 - i*10; tunnel.add(r);
  }

  /* ---- POEIRA ESTELAR ---- */
  const S = mobile ? 1200 : 2600, sp = new Float32Array(S*3);
  for (let i=0;i<S;i++){ sp[i*3]=(Math.random()-.5)*160; sp[i*3+1]=(Math.random()-.5)*100; sp[i*3+2]=20-Math.random()*240; }
  const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(sp,3));
  const stars = new THREE.Points(sGeo, new THREE.PointsMaterial({size:.12, color:LIGHT ? 0x7FA8E6 : 0x9fc4ff, map:glowTex, transparent:true, opacity:LIGHT ? .55 : .7, depthWrite:false, blending:BLEND}));
  scene.add(stars);

  /* ---- ÍCONES PEQUENOS VOANDO (marca + serviços) ---- */
  const flyers = [];
  const ICN = SITE.icones || {};
  const names = Object.keys(ICN);
  function tileTexture(name){
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    const rr = (x,y,w,h,r) => { g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); };
    rr(8,8,S-16,S-16,30); g.fillStyle = LC('rgba(255,255,255,.08)','rgba(234,242,255,.95)'); g.fill();
    g.lineWidth = 2.5; g.strokeStyle = 'rgba(' + [CYAN.r,CYAN.g,CYAN.b].map(v => v*255|0).join(',') + ',.55)'; g.stroke();
    const tex = new THREE.CanvasTexture(c);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="${LC('#ffffff','#0044A0')}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICN[name]}</svg>`;
    const img = new Image();
    img.onload = () => { g.drawImage(img, S/2-32, S/2-32, 64, 64); tex.needsUpdate = true; };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return tex;
  }
  const texs = names.map(tileTexture);
  let logoTex = null;
  if (SITE.iconeMarca) { const ld = new THREE.TextureLoader(); ld.setCrossOrigin('anonymous'); logoTex = ld.load(SITE.iconeMarca); if ('encoding' in logoTex) logoTex.encoding = THREE.sRGBEncoding; }
  else if (SITE.sigla) {
    // sem imagem de ícone: azulejo discreto com a sigla, no mesmo estilo dos ícones de serviço
    const S2 = 256, c = document.createElement('canvas'); c.width = c.height = S2;
    const g = c.getContext('2d');
    const rr = (x,y,w,h,r) => { g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); };
    rr(16,16,S2-32,S2-32,60); g.fillStyle = LC('rgba(255,255,255,.08)','rgba(234,242,255,.95)'); g.fill();
    g.lineWidth = 5; g.strokeStyle = LC('rgba(111,174,255,.6)','rgba(0,68,153,.5)'); g.stroke();
    g.font = '600 92px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = LC('#ffffff','#0044A0'); g.fillText(SITE.sigla, S2/2, S2/2 + 4);
    logoTex = new THREE.CanvasTexture(c);
  }
  const planeGeo = new THREE.PlaneGeometry(1, 1);
  const COUNT = mobile ? 18 : 32;
  for (let i=0; i<COUNT; i++){
    // a cada 3 ícones, 1 é o ícone da marca
    const isLogo = logoTex && (i % 3 === 0 || !texs.length);
    if (!isLogo && !texs.length) continue;
    const mat = new THREE.MeshBasicMaterial({map: isLogo ? logoTex : texs[i % texs.length], transparent:true, depthWrite:false, side:THREE.DoubleSide, opacity:0});
    const m = new THREE.Mesh(planeGeo, mat); scene.add(m);
    const pos = new THREE.Vector3((Math.random()-.5)*22, (Math.random()-.5)*12, 10 - Math.random()*110);
    m.position.copy(pos);
    flyers.push({ m, isLogo,
      size: isLogo ? .75 + Math.random()*.3 : .7 + Math.random()*.35,
      v: new THREE.Vector3((Math.random()-.5)*1.2, (Math.random()-.5)*.6, (Math.random()-.5)*.6),
      ph: Math.random()*Math.PI*2, sp: .3 + Math.random()*.5, spin: (Math.random()-.5)*.8 });
  }

  function resize(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  const ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
  const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const clock = new THREE.Clock();
  const desk = () => innerWidth > 860;

  return function render(p){
    const dt = Math.min(clock.getDelta(), .05), time = clock.elapsedTime;
    mouse.x += (mouse.tx-mouse.x)*.05; mouse.y += (mouse.ty-mouse.y)*.05;

    // Fase 1 (0 → .3): globo à direita, gira; câmera aproxima
    // Fase 2 (.3 → .6): globo passa e câmera mergulha no túnel de fibra
    // Fase 3 (.6 → 1): velocidade máxima dentro do túnel
    const p1 = ease(clamp(p/.32)), p2 = ease(clamp((p-.25)/.4)), p3 = clamp((p-.6)/.4);

    // começa centralizado e um pouco acima (o texto fica na parte de baixo da tela)
    const gx = desk() ? lerp(0, -1.5, p1) : 0;
    const gy = desk() ? lerp(1.5, 0, p1) : lerp(2.6, 0, p1);
    globe.position.set(gx, gy, lerp(0, 6, p2));
    // balança devagar mantendo o Brasil à vista; a rolagem gira o mundo
    globe.rotation.y = LON0 + Math.sin(time*.18)*.22 - p*Math.PI*1.1 + mouse.x*.12;
    globe.rotation.x = LAT0 + p1*.25 + mouse.y*.12;
    globe.rotation.z = p1*-.3;
    const gs = desk() ? lerp(innerHeight < 820 ? .66 : .76, 1.25, p1) : lerp(.6, 1.25, p1); globe.scale.setScalar(gs);

    camera.position.x = lerp(0, 0, p2) + mouse.x*1.4;
    camera.position.y = lerp(0, 0, p2) - mouse.y*1.0;
    camera.position.z = lerp(15, -40, p2) - p3*60;
    camera.lookAt(mouse.x*2, -mouse.y*1.5, camera.position.z - 20);
    camera.rotation.z = p2*.5 + time*.02*p3;
    camera.fov = lerp(55, 72, p3); camera.updateProjectionMatrix();

    // globo some ao entrar no túnel
    const gOp = 1 - clamp((p-.35)/.15);
    globe.visible = gOp > .01;
    gMat.opacity = gOp; core.material.opacity = .9*gOp; halo.material.opacity = .35*gOp;
    if (peLine) {
      const pl = .6 + Math.sin(time*3)*.4;
      peLine.material.opacity = (.55 + .45*pl)*gOp;
      peMat.size = .12 + pl*.04;
      recifePulse.scale.setScalar(.5 + ((time*.9)%1)*1.4);
      recifePulse.material.opacity = (1 - (time*.9)%1)*gOp;
      peLabel.material.opacity = gOp;
    }

    arcs.forEach(a => { a.t = (a.t + dt*a.v) % 1; a.s.position.copy(a.curve.getPoint(a.t)); a.s.material.opacity = gOp; });
    const boost = 1 + p3*6 + p2*2;
    fibers.forEach(f => { f.t = (f.t + dt*f.v*boost*(reduce?.2:1)) % 1; f.s.position.copy(f.curve.getPoint(1-f.t)); });
    tunnel.rotation.z = time*.05;
    tunnel.children.forEach(o => { if (o.material && o.type==='Line') o.material.opacity = .15 + p2*.35; });
    stars.rotation.z = time*.01;

    // ícones pequenos voando pela tela: discretos, com parallax natural da rolagem
    flyers.forEach(f => {
      const m = f.m;
      m.position.addScaledVector(f.v, dt*(reduce ? .2 : 1));
      // mantém os ícones num corredor em volta do caminho da câmera
      const cz = camera.position.z;
      if (m.position.x > 12) m.position.x = -12; else if (m.position.x < -12) m.position.x = 12;
      if (m.position.y > 7) m.position.y = -7; else if (m.position.y < -7) m.position.y = 7;
      if (m.position.z > cz + 4) m.position.z -= 120;           // passou pela câmera: volta lá na frente
      if (m.position.z < cz - 125) m.position.z += 120;
      const dz = cz - m.position.z;
      // aparecem ao longe, somem perto da câmera (nunca ficam grandes na tela)
      const op = Math.min(1, Math.max(0, (dz-4)/5)) * Math.min(1, Math.max(0, (100-dz)/45));
      m.material.opacity = op * (f.isLogo ? .75 : .6);
      m.visible = m.material.opacity > .01;
      m.quaternion.copy(camera.quaternion);
      m.rotateZ(Math.sin(time*f.sp + f.ph)*(f.isLogo ? .15 : .25) + (f.isLogo ? 0 : time*f.spin*.2));
      m.rotateY(Math.sin(time*f.sp*.8 + f.ph)*(f.isLogo ? .3 : .5));
      const pulse = 1 + Math.sin(time*1.5 + f.ph)*.05;
      m.scale.setScalar(f.size*pulse);
    });

    renderer.render(scene, camera);
  };
}

const render3d = initScene();
if (render3d) document.querySelector('.hero-fallback').style.opacity = .6;
const fb = document.querySelector('.hero-fallback');

let lastT = performance.now();
function loop(now = performance.now()){
  const dt = Math.min((now - lastT) / 1000, .25); lastT = now;
  prog += (target - prog) * (reduce ? 1 : 1 - Math.exp(-dt * 5));
  updateCopy(prog);
  if (render3d && hero) {
    const r = hero.getBoundingClientRect();
    if (r.bottom > 0) render3d(prog);
  }
  requestAnimationFrame(loop);
}
loop();

/* ======================= SOBRE: MINI CENA (rede de pontos 2D) ======================= */
(function(){
  const c = document.getElementById('aboutCanvas'); if (!c) return; const g = c.getContext('2d');
  let W, H, pts = [];
  function size(){ const r = c.getBoundingClientRect(); W = c.width = r.width*devicePixelRatio; H = c.height = r.height*devicePixelRatio;
    pts = Array.from({length:70}, () => ({x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*.6, vy:(Math.random()-.5)*.6})); }
  size(); addEventListener('resize', size);
  (function draw(){
    g.clearRect(0,0,W,H);
    const d = 140*devicePixelRatio;
    pts.forEach(p => { p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>W)p.vx*=-1; if(p.y<0||p.y>H)p.vy*=-1; });
    for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++){
      const a=pts[i], b=pts[j], dd=Math.hypot(a.x-b.x,a.y-b.y);
      if (dd<d){ g.strokeStyle=`rgba(${(i+j)%2?LB:'31,111,214'},${1-dd/d})`; g.lineWidth=1*devicePixelRatio; g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); g.stroke(); }
    }
    pts.forEach((p,i) => { g.fillStyle = i%2?'#6FAEFF':'#1F6FD6'; g.beginPath(); g.arc(p.x,p.y,2.4*devicePixelRatio,0,7); g.fill(); });
    requestAnimationFrame(draw);
  })();
})();

/* ======================= CONTATO: GLOBO EM LINHAS (canvas 2D) ======================= */
(function(){
  const c = document.getElementById('contactGlobe'); if (!c) return;
  const g = c.getContext('2d'), GD = window.GLOBE_DATA || null, D = Math.PI/180;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toRad = flat => { const o = new Float32Array(flat.length); for (let i=0;i<flat.length;i++) o[i] = flat[i]*D; return o; };
  const land = GD ? toRad(GD.land) : null, br = GD ? toRad(GD.br) : null, pe = GD ? toRad(GD.pe) : null;
  const home = GD ? [GD.recife[0]*D, GD.recife[1]*D] : null;
  const PHI0 = -22*D, sP = Math.sin(PHI0), cP = Math.cos(PHI0);   // inclina para o Brasil aparecer na metade de cima
  let W, R, cx, cy, dpr, lam0 = -48*D, visible = true, running = false, last = 0;

  function size(){ dpr = Math.min(devicePixelRatio || 1, 2); const w = c.clientWidth || 400; c.width = c.height = Math.round(w*dpr); W = c.width; R = W*.47; cx = cy = W/2; }
  size(); addEventListener('resize', size);
  const start = () => { if (!running){ running = true; last = 0; requestAnimationFrame(draw); } };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(c);

  // projeção ortográfica: devolve [x, y, z] (z > 0 = lado da frente)
  function proj(lat, lon){
    const l = lon - lam0, cl = Math.cos(lat);
    return [cx + R*cl*Math.sin(l), cy - R*(cP*Math.sin(lat) - sP*cl*Math.cos(l)), sP*Math.sin(lat) + cP*cl*Math.cos(l)];
  }
  function line(pts){ // desenha só os trechos visíveis
    g.beginPath(); let on = false;
    for (const [la, lo] of pts){ const p = proj(la, lo); if (p[2] > 0){ on ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); on = true; } else on = false; }
    g.stroke();
  }
  function dots(arr, color, r, minA){
    g.fillStyle = color;
    for (let i=0;i<arr.length;i+=2){ const p = proj(arr[i], arr[i+1]); if (p[2] <= 0) continue; g.globalAlpha = minA + (1-minA)*p[2]; g.fillRect(p[0]-r, p[1]-r, r*2, r*2); }
    g.globalAlpha = 1;
  }
  function draw(t = 0){
    if (!visible){ running = false; return; }
    if (!still) lam0 -= Math.min(t - last || 16, 50) * .000045; last = t;
    g.clearRect(0, 0, W, W);
    // contorno
    g.lineWidth = 1.2*dpr; g.strokeStyle = LC('rgba(255,255,255,.38)','rgba(0,68,153,.45)');
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI*2); g.stroke();
    // meridianos e paralelos
    g.lineWidth = 1*dpr; g.strokeStyle = LC('rgba(255,255,255,.09)','rgba(0,68,153,.12)');
    for (let lo=-180; lo<180; lo+=20){ const pts=[]; for (let la=-90; la<=90; la+=3) pts.push([la*D, lo*D]); line(pts); }
    for (let la=-60; la<=60; la+=20){ const pts=[]; for (let lo=-180; lo<=180; lo+=3) pts.push([la*D, lo*D]); line(pts); }
    if (land){
      const r = .9*dpr;
      dots(land, LC('#ffffff','#4F86D6'), r, .12);
      dots(br, LC('#6FAEFF','#0052C2'), r*1.15, .35);
      dots(pe, LC('#ffffff','#002A66'), r*1.4, .6);
      const p = proj(home[0], home[1]);
      if (p[2] > 0){ const k = (t/1600) % 1; g.strokeStyle = `rgba(${LB},${1-k})`; g.lineWidth = 1.5*dpr; g.beginPath(); g.arc(p[0], p[1], (4 + k*16)*dpr, 0, Math.PI*2); g.stroke(); }
    }
    if (!still) requestAnimationFrame(draw); else running = false;
  }
  start();
})();

/* ======================= COBERTURA: MAPA EM PONTOS (canvas 2D) ======================= */
(function(){
  const c = document.getElementById('coverMap'), GD = window.GLOBE_DATA;
  const form = document.getElementById('coverForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const end = new FormData(form).get('endereco');
    const msg = `Olá! Gostaria de consultar a cobertura da ${SITE.nome || 'TG Telecom'} no endereço: ${end}`;
    window.open(`https://api.whatsapp.com/send?phone=${WHATS}&text=${encodeURIComponent(msg)}`, '_blank');
  });
  if (!c || !GD) return;
  const g = c.getContext('2d'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const K = Math.cos(15*Math.PI/180);                     // correção de escala da longitude
  const STEP = .55, home = GD.recife, poly = GD.peOutline;
  const inPoly = (la, lo) => { let ins = false;
    for (let i=0, j=poly.length-2; i<poly.length; j=i, i+=2){
      const ai = poly[i], oi = poly[i+1], aj = poly[j], oj = poly[j+1];
      if ((oi > lo) !== (oj > lo) && la < (aj-ai)*(lo-oi)/(oj-oi) + ai) ins = !ins;
    } return ins; };
  // malha fina dentro do Brasil (a partir dos pontos de 1° do mapa) + Pernambuco pelo contorno real
  const cells = [];
  for (let la = 5.2; la >= -33.8; la -= STEP) for (let lo = -73.8; lo <= -34.6; lo += STEP){
    const pe = inPoly(la, lo); let near = pe;
    for (let i=0; !near && i<GD.br.length; i+=2){ const dl = GD.br[i]-la, dn = (GD.br[i+1]-lo)*K; if (dl*dl + dn*dn < .62) near = true; }
    if (near) cells.push({la, lo, pe, d: Math.hypot(la-home[0], (lo-home[1])*K)});
  }
  let W, H, dpr, sc, ox, oy, visible = true, running = false;
  function size(){
    dpr = Math.min(devicePixelRatio || 1, 2); W = c.width = c.clientWidth*dpr; H = c.height = c.clientHeight*dpr;
    const narrow = c.clientWidth < 560;
    sc = Math.min(W/(40*K), H/40) * (narrow ? .84 : .92);   // Brasil ~40° x 40°
    ox = W/2 - (narrow ? -52 : -54.2)*K*sc; oy = H/2 + (-14.3)*sc;   // centraliza o Brasil (no celular, puxa p/ esquerda)
  }
  const px = (la, lo) => [ox + lo*K*sc, oy - la*sc];
  size(); addEventListener('resize', size);
  const start = () => { if (!running){ running = true; requestAnimationFrame(draw); } };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(c);
  function draw(t = 0){
    if (!visible){ running = false; return; }
    g.clearRect(0, 0, W, H);
    const r = still ? -9 : (t/1000*4.5) % 26, fade = 1 - r/26, s = 1.3*dpr;
    for (const p of cells){
      const [x, y] = px(p.la, p.lo), wave = Math.max(0, 1 - Math.abs(p.d - r)/1.6) * fade;
      if (p.pe){ g.fillStyle = `rgba(${LB},${.75 + wave*.25})`; g.fillRect(x-s*1.25, y-s*1.25, s*2.5, s*2.5); }
      else { g.fillStyle = wave > .02 ? `rgba(${LB},${.24 + wave*.6})` : LC('rgba(255,255,255,.24)','rgba(0,68,153,.18)'); g.fillRect(x-s, y-s, s*2, s*2); }
    }
    // ponto da cidade + anéis
    const [hx, hy] = px(home[0], home[1]), k = still ? .4 : (t/1800) % 1;
    for (const q of [k, (k+.5)%1]){ g.strokeStyle = `rgba(${LB},${(1-q)*.8})`; g.lineWidth = 1.2*dpr; g.beginPath(); g.arc(hx, hy, (6 + q*34)*dpr, 0, Math.PI*2); g.stroke(); }
    g.fillStyle = LC('#fff','#002A66'); g.beginPath(); g.arc(hx, hy, 3.5*dpr, 0, Math.PI*2); g.fill();
    // rótulo
    const label = `${SITE.cidade || 'Recife'} · ${SITE.uf || 'PE'}`;
    g.font = `500 ${11.5*dpr}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    const tw = g.measureText(label).width, bx = hx - tw - 34*dpr, by = hy - 40*dpr;
    g.strokeStyle = LC('rgba(255,255,255,.25)','rgba(0,68,153,.35)'); g.lineWidth = 1*dpr; g.beginPath(); g.moveTo(hx - 4*dpr, hy - 4*dpr); g.lineTo(bx + tw + 20*dpr, by + 11*dpr); g.stroke();
    g.fillStyle = LC('rgba(0,18,46,.85)','#0052C2'); g.fillRect(bx, by, tw + 20*dpr, 22*dpr);
    g.strokeRect(bx, by, tw + 20*dpr, 22*dpr);
    g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(label, bx + 10*dpr, by + 11*dpr);
    if (!still) requestAnimationFrame(draw); else running = false;
  }
  start();
})();


/* ======================= GSAP: ROLAGEM SUAVE (Lenis) + ANIMAÇÕES (ScrollTrigger) ======================= */
if (HAS_GSAP) {
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('gsap-on');

  // rolagem suave
  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    // links internos (#planos, #contato...) com rolagem suave
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const el = document.querySelector(id); if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: id === '#inicio' ? 0 : -70, duration: 1.4 });
    }));
  }

  // cabeçalhos de seção: selo, título e texto entram em sequência
  const heads = gsap.utils.toArray('.sec-head.reveal, .bento-head.reveal');
  heads.forEach(h => {
    h.classList.add('in');
    gsap.from(h.children, { y: 36, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: .12,
      scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
  });

  // cards e blocos: sobem em lote, com stagger
  const rest = gsap.utils.toArray('.reveal').filter(el => !heads.includes(el));
  gsap.set(rest, { y: 50, autoAlpha: 0 });
  ScrollTrigger.batch(rest, { start: 'top 88%', once: true, onEnter: batch => {
    batch.forEach(el => el.classList.add('in'));
    gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: .1, overwrite: true, clearProps: 'transform' });
  }});

  // preços contam até o valor
  gsap.utils.toArray('[data-count]').forEach(el => {
    const o = { n: 0 }, v = +el.dataset.count;
    el.textContent = '0';
    gsap.to(o, { n: v, duration: 1.4, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.n); },
      scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });

  // globo do contato sobe ao rolar (parallax)
  const cgG = document.querySelector('.cg-globe');
  if (cgG) gsap.fromTo(cgG, { y: 70 }, { y: 0, ease: 'none', scrollTrigger: { trigger: cgG, start: 'top bottom', end: 'bottom 75%', scrub: true } });

  // faixa de diferenciais: ícones giram de leve ao entrar
  gsap.from('.strip .ic', { rotate: -90, scale: .6, duration: .9, ease: 'back.out(1.8)', stagger: .1,
    scrollTrigger: { trigger: '.strip', start: 'top 90%', once: true } });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
}
