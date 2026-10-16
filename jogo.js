import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { BLOCOS, VALENCIA, ACEITA } from './moleculas.js';

// ===== DADOS =====
const CORES = { H: 0xffffff, C: 0x909090, N: 0x3050f8, O: 0xff0d0d, S: 0xffcc33, F: 0x90e050, Cl: 0x1ff01f, Br: 0xa62929, I: 0x940094 };
const corCss = el => '#' + CORES[el].toString(16).padStart(6, '0');
const RAIO = { H: .32, C: .45, N: .45, O: .45, S: .55, F: .42, Cl: .55, Br: .6, I: .66 };
const NOME_EL = { H: 'Hidrogênio', C: 'Carbono', N: 'Nitrogênio', O: 'Oxigênio', S: 'Enxofre', F: 'Flúor', Cl: 'Cloro', Br: 'Bromo', I: 'Iodo' };
const TEXTO_ESCURO = ['H', 'S', 'F', 'Cl'];

const TUTORIAL_MOL = BLOCOS[0].mols[0];

const PASSOS = [
    { titulo: 'Bem-vindo!', texto: 'Aqui você monta moléculas em <b>3D</b> ligando átomos. Cada átomo faz um número certo de ligações: é a <b>valência</b>. A molécula fica pronta quando <b>nenhuma valência sobra livre</b>.' },
    { titulo: 'A bancada 3D', foco: '#caixa', texto: 'Estes são os átomos da <b>água (H₂O)</b>. As <b>bolinhas amarelas</b> são os conectores: o O tem 2 e cada H tem 1. <b>Arraste o fundo</b> para girar e use os botões <b>+ / −</b> para dar zoom.' },
    { titulo: 'Faça uma ligação', foco: '#caixa', pronto: () => estado.lig.length >= 1, texto: '<b>Clique num H</b> (ele fica brilhando) e depois <b>clique no O</b>. Pronto, uma ligação!' },
    { titulo: 'Complete a água', foco: '#caixa', pronto: () => estado.ganhou, texto: 'Agora ligue o <b>outro H ao O</b> para não sobrar nenhum conector livre.' },
    { titulo: 'Dados da PubChem', foco: '#painel', confete: true, texto: 'Montou! Aqui aparecem os dados reais da molécula vindos da <b>PubChem</b>: nome IUPAC, massa molar e a estrutura.' },
    { titulo: 'Desfaça uma ligação', foco: '#caixa', pronto: () => estado.lig.length < 2, texto: 'Errou uma ligação? <b>Clique em cima da ligação</b> (o bastão entre dois átomos) para desfazê-la. Tente agora com uma das ligações da água.' },
    { titulo: 'Dicas finais', texto: `Para <b>ligação dupla ou tripla</b>, ligue os mesmos dois átomos de novo; clicar numa ligação dupla tira uma de cada vez. São <b>${BLOCOS.length} blocos</b> e cada um é <b>infinito</b>: monte quantas moléculas quiser!` },
];

// ===== QUÍMICA =====
function contarAtomos(formula) {
    const c = {};
    for (const [, el, n] of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) c[el] = (c[el] || 0) + (+n || 1);
    return c;
}
const sub = f => f.replace(/\d+/g, n => [...n].map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join(''));
const ligacoesDe = i => estado.lig.filter(l => l.a === i || l.b === i);
const livre = i => VALENCIA[estado.at[i].el] - ligacoesDe(i).reduce((s, l) => s + l.ordem, 0);

function conectado() {
    const visto = new Set([0]), fila = [0];
    while (fila.length) {
        const i = fila.pop();
        for (const l of ligacoesDe(i)) {
            const q = l.a === i ? l.b : l.a;
            if (!visto.has(q)) { visto.add(q); fila.push(q); }
        }
    }
    return visto.size === estado.at.length;
}

// 'incompleta' | 'separada' | 'isomero' | 'ok'
function avaliar() {
    if (estado.at.some((_, i) => livre(i) > 0)) return 'incompleta';
    if (!conectado()) return 'separada';
    const r = estado.mol.regra;
    return r && !r[0](estado.at, estado.lig) ? 'isomero' : 'ok';
}

// ===== ESTADO / UTIL =====
const $ = id => document.getElementById(id);
const icones = () => window.lucide?.createIcons();
const estado = { modo: 'tutorial', passo: 0, mol: null, at: [], lig: [], sel: null, ganhou: false, bloco: 0, idx: 0 };
const ler = k => { try { return JSON.parse(localStorage.getItem(k)) ?? {}; } catch { return {}; } };
const salvar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function confete() {
    for (let i = 0; i < 70; i++) {
        const c = document.createElement('div');
        c.className = 'confete';
        c.style.cssText = `left:${Math.random() * 100}vw;background:hsl(${Math.random() * 360},90%,60%);animation-duration:${1.5 + Math.random() * 2}s`;
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 4000);
    }
}

// ===== CENA 3D =====
const caixa = $('caixa');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
caixa.appendChild(renderer.domElement);
const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
camera.position.set(0, 0, 13);
const controles = new OrbitControls(camera, renderer.domElement);
controles.enableDamping = true;
controles.enablePan = false;
controles.enableZoom = false; // a rodinha rola a página; zoom pelos botões + / −
cena.add(new THREE.AmbientLight(0xffffff, .6));
const luz = new THREE.DirectionalLight(0xffffff, 1.6);
luz.position.set(5, 8, 10);
cena.add(luz);
const grupo = new THREE.Group();
cena.add(grupo);

const geoEsfera = new THREE.SphereGeometry(1, 32, 24);
const geoCilindro = new THREE.CylinderGeometry(1, 1, 1, 12);
const matLig = new THREE.MeshStandardMaterial({ color: 0xc4b5fd, roughness: .4 });
const matConector = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: .5 });
const matInvisivel = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

// rótulo com o símbolo, sempre visível por cima da esfera
const texturas = {};
function rotulo(el) {
    if (!texturas[el]) {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d');
        g.font = 'bold 72px Space Grotesk, sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 8; g.strokeStyle = '#000a'; g.strokeText(el, 64, 68);
        g.fillStyle = '#fff'; g.fillText(el, 64, 68);
        texturas[el] = new THREE.CanvasTexture(c);
    }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturas[el], depthTest: false }));
    s.renderOrder = 10;
    s.scale.setScalar(.6);
    return s;
}

// recria os objetos quando a estrutura muda; as posições são atualizadas a cada quadro
let objs = { atomos: [], ligacoes: [], conectores: [] };
function montarCena() {
    grupo.clear();
    objs = { atomos: [], ligacoes: [], conectores: [] };
    estado.at.forEach((a, i) => {
        const m = new THREE.Mesh(geoEsfera, new THREE.MeshStandardMaterial({
            color: CORES[a.el], roughness: .35, emissive: estado.sel === i ? 0xfacc15 : 0, emissiveIntensity: .6 }));
        m.scale.setScalar(RAIO[a.el]);
        m.userData.atomo = i;
        const r = rotulo(a.el);
        grupo.add(m, r);
        objs.atomos.push({ m, r });
        for (let k = 0; k < livre(i); k++) {
            const c = new THREE.Mesh(geoEsfera, matConector);
            c.scale.setScalar(.11);
            grupo.add(c);
            objs.conectores.push({ c, i, k });
        }
    });
    estado.lig.forEach((l, k) => {
        const cil = [];
        for (let o = 0; o < l.ordem; o++) { const c = new THREE.Mesh(geoCilindro, matLig); grupo.add(c); cil.push(c); }
        const alvo = new THREE.Mesh(geoCilindro, matInvisivel); // área de clique mais grossa
        alvo.userData.lig = k;
        grupo.add(alvo);
        objs.ligacoes.push({ l, cil, alvo });
    });
}

// ===== FÍSICA SIMPLES =====
// molas nas ligações + repulsão entre átomos: as moléculas tomam forma 3D sozinhas
const tmp = new THREE.Vector3(), CIMA = new THREE.Vector3(0, 1, 0);
function passoFisica() {
    const at = estado.at;
    for (const l of estado.lig) {
        const A = at[l.a], B = at[l.b];
        const alvo = (RAIO[A.el] + RAIO[B.el]) * 1.6 - (l.ordem - 1) * .12;
        tmp.subVectors(B.p, A.p);
        const d = tmp.length() || .01;
        tmp.multiplyScalar((d - alvo) / d * .08);
        A.v.add(tmp); B.v.sub(tmp);
    }
    for (let i = 0; i < at.length; i++) for (let j = i + 1; j < at.length; j++) {
        tmp.subVectors(at[j].p, at[i].p);
        const d2 = Math.max(tmp.lengthSq(), .05);
        tmp.multiplyScalar(.04 / (d2 * Math.sqrt(d2)));
        at[i].v.sub(tmp); at[j].v.add(tmp);
    }
    const centro = new THREE.Vector3();
    at.forEach(a => centro.add(a.p));
    centro.divideScalar(at.length || 1);
    for (const a of at) {
        a.v.addScaledVector(a.p, -.004); // puxa de leve para o centro: ninguém sai da tela
        a.v.multiplyScalar(.82);
        if (a.v.length() > .3) a.v.setLength(.3);
        a.p.add(a.v).sub(centro);
    }
}

// direções dos conectores livres: as mais afastadas das ligações existentes
const DIRECOES = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
    .map(v => new THREE.Vector3(...v).normalize());
function direcoesLivres(i) {
    const usadas = ligacoesDe(i).map(l => new THREE.Vector3().subVectors(estado.at[l.a === i ? l.b : l.a].p, estado.at[i].p).normalize());
    const escolhidas = [];
    for (let k = 0; k < livre(i); k++) {
        let melhor = DIRECOES[0], nota = -Infinity;
        for (const d of DIRECOES) {
            const n = -Math.max(-1, ...[...usadas, ...escolhidas].map(u => u.dot(d)));
            if (n > nota) { nota = n; melhor = d; }
        }
        escolhidas.push(melhor);
    }
    return escolhidas;
}

function cilindro(c, A, B, raio, off) {
    tmp.subVectors(B, A);
    const d = tmp.length();
    c.position.addVectors(A, B).multiplyScalar(.5).add(off);
    c.quaternion.setFromUnitVectors(CIMA, tmp.normalize());
    c.scale.set(raio, d, raio);
}

function atualizarCena() {
    const at = estado.at;
    objs.atomos.forEach(({ m, r }, i) => {
        m.position.copy(at[i].p);
        r.position.copy(at[i].p);
    });
    const porAtomo = {};
    for (const { c, i, k } of objs.conectores) {
        porAtomo[i] ??= direcoesLivres(i);
        c.position.copy(at[i].p).addScaledVector(porAtomo[i][k], RAIO[at[i].el] + .12);
    }
    for (const { l, cil, alvo } of objs.ligacoes) {
        const A = at[l.a].p, B = at[l.b].p;
        // ligações duplas/triplas lado a lado, perpendiculares à visão
        const lado = new THREE.Vector3().subVectors(B, A).cross(camera.position).normalize();
        cil.forEach((c, o) => cilindro(c, A, B, .07, lado.clone().multiplyScalar((o - (cil.length - 1) / 2) * .2)));
        cilindro(alvo, A, B, .25, new THREE.Vector3());
    }
}

function redimensionar() {
    const w = caixa.clientWidth, h = caixa.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}
new ResizeObserver(redimensionar).observe(caixa);
function zoom(f) {
    const d = THREE.MathUtils.clamp(camera.position.length() * f, 4, 40);
    camera.position.setLength(d);
}

renderer.setAnimationLoop(() => {
    if (!estado.at.length) return;
    passoFisica();
    atualizarCena();
    controles.update();
    renderer.render(cena, camera);
});

// ===== CLIQUE (girar = arrastar, ligar = clicar) =====
const raio = new THREE.Raycaster();
let inicio = null;
renderer.domElement.addEventListener('pointerdown', e => { inicio = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', e => {
    if (!inicio || Math.hypot(e.clientX - inicio[0], e.clientY - inicio[1]) > 6 || (estado.ganhou && estado.modo !== 'tutorial')) return;
    const r = renderer.domElement.getBoundingClientRect();
    raio.setFromCamera({ x: (e.clientX - r.left) / r.width * 2 - 1, y: -(e.clientY - r.top) / r.height * 2 + 1 }, camera);
    const hit = raio.intersectObjects(grupo.children).find(h => 'atomo' in h.object.userData || 'lig' in h.object.userData);
    clicar(hit?.object.userData ?? {});
});

function clicar({ atomo, lig }) {
    if (atomo !== undefined) {
        if (estado.sel === null) estado.sel = livre(atomo) > 0 ? atomo : null;
        else if (estado.sel === atomo) estado.sel = null;
        else { ligar(estado.sel, atomo); estado.sel = null; }
    } else if (lig !== undefined) {
        const l = estado.lig[lig];
        if (--l.ordem === 0) estado.lig.splice(lig, 1);
        estado.sel = null;
    } else estado.sel = null;
    mudou();
}

function ligar(i, j) {
    if (livre(i) < 1 || livre(j) < 1) return;
    const l = estado.lig.find(l => (l.a === i && l.b === j) || (l.a === j && l.b === i));
    if (!l) estado.lig.push({ a: i, b: j, ordem: 1 });
    else if (l.ordem < 3) l.ordem++;
}

// ===== MONTAGEM =====
function carregarMolecula(mol) {
    Object.assign(estado, { mol, lig: [], sel: null, ganhou: false });
    const els = Object.entries(contarAtomos(mol.f)).flatMap(([el, n]) => Array(n).fill(el));
    // espalha os átomos numa espiral de Fibonacci: nenhum fica escondido atrás de outro
    const raioEsfera = 1.2 + els.length * .25;
    estado.at = els.sort(() => Math.random() - .5).map((el, i, arr) => {
        const y = 1 - 2 * (i + .5) / arr.length, rr = Math.sqrt(1 - y * y), t = i * 2.39996;
        return { el, p: new THREE.Vector3(Math.cos(t) * rr, y, Math.sin(t) * rr * .5).multiplyScalar(raioEsfera), v: new THREE.Vector3() };
    });
    controles.reset();
    camera.position.set(0, 0, 9 + els.length * .35);
    montarCena();
    painel();
}

function mudou() {
    montarCena();
    const r = avaliar();
    if (r === 'ok' && !estado.ganhou) { estado.ganhou = true; confete(); contarMontada(); }
    painel(r);
    if (estado.modo === 'tutorial') {
        const p = estado.passo;
        if (PASSOS[p].pronto?.()) setTimeout(() => estado.modo === 'tutorial' && estado.passo === p && mostrarPasso(p + 1), 700);
    }
}

function contarMontada() {
    if (estado.modo !== 'jogo') return;
    const f = ler('moleculas-montadas');
    f[estado.bloco] = (f[estado.bloco] ?? 0) + 1;
    salvar('moleculas-montadas', f);
}

// ===== PAINEL LATERAL =====
const pubchemCache = {};
async function buscarPubChem(mol) {
    if (!(mol.en in pubchemCache)) {
        try {
            const r = await fetch('/api/molecule/' + encodeURIComponent(mol.en));
            pubchemCache[mol.en] = r.ok ? await r.json() : null;
        } catch { pubchemCache[mol.en] = null; }
    }
    return pubchemCache[mol.en];
}

const MSG = {
    incompleta: ['text-gray-500', 'circle-dashed', 'Ainda há conectores livres.'],
    separada: ['text-orange-600', 'unlink', 'Todas as valências fecharam, mas a molécula está em pedaços.'],
    isomero: ['text-orange-600', 'shuffle', ''],
    ok: ['text-green-600', 'circle-check', 'Molécula completa!'],
};

function painel(r = avaliar()) {
    const m = estado.mol, cont = contarAtomos(m.f);
    const [cor, ic, txt] = MSG[r];
    // por elemento: quantos conectores ainda estão livres
    const livres = {};
    estado.at.forEach((a, i) => livres[a.el] = (livres[a.el] ?? 0) + livre(i));
    $('painel').innerHTML = `
        <div class="rounded-2xl border border-purple-200 bg-purple-50 p-4">
            <div class="text-xs font-semibold text-purple-500">MONTE A MOLÉCULA</div>
            <div class="font-game text-2xl font-bold text-purple-700">${m.nome}</div>
            <div class="font-mono text-lg text-gray-600">${sub(m.f)}</div>
        </div>
        <div class="rounded-2xl border border-gray-200 p-4 space-y-1.5">
            <div class="text-xs font-semibold text-gray-500 mb-1"><i data-lucide="atom"></i> ÁTOMOS</div>
            ${Object.keys(cont).map(el => `<div class="flex items-center gap-2 text-sm">
                <span class="w-6 h-6 rounded-full grid place-items-center text-xs font-bold border" style="background:${corCss(el)};color:${TEXTO_ESCURO.includes(el) ? '#111' : '#fff'}">${el}</span>
                <span>${cont[el]}× ${NOME_EL[el]} <span class="text-gray-400">(${VALENCIA[el]} lig.)</span></span>
                <span class="ml-auto font-mono text-xs ${livres[el] ? 'text-amber-500' : 'text-green-600'}">${livres[el] ? livres[el] + ' livre' + (livres[el] > 1 ? 's' : '') : '<i data-lucide="check"></i>'}</span></div>`).join('')}
        </div>
        <div class="text-sm font-semibold ${cor}"><i data-lucide="${ic}"></i> ${r === 'isomero' ? m.regra[1] : txt}</div>
        <div id="pubchem"></div>`;
    icones();
    if (r === 'ok') mostrarPubChem(m);
    botaoProxima(r);
}

async function mostrarPubChem(m) {
    $('pubchem').innerHTML = `<div class="text-xs text-gray-400 animate-pulse">Consultando PubChem...</div>`;
    const d = await buscarPubChem(m);
    if (estado.mol !== m || !$('pubchem')) return;
    $('pubchem').innerHTML = d ? `
        <div class="rounded-2xl border border-blue-200 bg-blue-50 p-4 pop text-sm space-y-1">
            <div class="text-xs font-semibold text-blue-500"><i data-lucide="database"></i> PUBCHEM · CID ${d.cid}</div>
            <div class="h-40 bg-white rounded-xl overflow-hidden"><img src="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${d.cid}/PNG?image_size=large" alt="Estrutura de ${m.nome}" class="w-full h-full object-contain scale-[1.6] mix-blend-multiply"></div>
            <div><b>IUPAC:</b> ${d.iupac ?? '-'}</div>
            <div><b>Massa molar:</b> <span class="font-mono">${d.massa.toFixed(2)} g/mol</span></div>
            <div><b>SMILES:</b> <span class="font-mono break-all">${d.smiles ?? '-'}</span></div>
            <a href="https://pubchem.ncbi.nlm.nih.gov/compound/${d.cid}" target="_blank" class="text-blue-600 hover:underline"><i data-lucide="external-link"></i> Ver na PubChem</a>
        </div>` : `<div class="text-xs text-gray-400"><i data-lucide="wifi-off"></i> Não foi possível consultar a PubChem (rode pelo server.py com internet).</div>`;
    icones();
}

function botaoProxima(r) {
    const slot = $('slotProxima');
    if (estado.modo !== 'jogo' || !slot) return;
    slot.innerHTML = r === 'ok' ? `<button data-acao="proxima" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-xl text-sm font-semibold btn-3d pop">
            Próxima molécula <i data-lucide="arrow-right"></i></button>` : '';
    icones();
}

// ===== FLUXO: tutorial -> blocos -> jogo (infinito) =====
function telas(nivel) {
    $('telaNivel').hidden = !nivel;
    $('bancada').hidden = nivel;
    if (!nivel) requestAnimationFrame(redimensionar);
}

function abrirTutorial() {
    estado.modo = 'tutorial';
    telas(false);
    $('barraTopo').innerHTML = `<span class="font-game px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm"><i data-lucide="book-open"></i> Tutorial</span>`;
    carregarMolecula(TUTORIAL_MOL);
    mostrarPasso(0);
}

function mostrarPasso(n) {
    estado.passo = n;
    const p = PASSOS[n];
    document.querySelectorAll('.foco').forEach(e => e.classList.remove('foco'));
    if (p.foco) document.querySelectorAll(p.foco).forEach(e => e.classList.add('foco'));
    if (p.confete) confete();
    $('veu').hidden = $('falas').hidden = false;
    const ultimo = n === PASSOS.length - 1;
    $('falas').innerHTML = `
        <div class="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border-2 border-purple-300 p-4 flex gap-3 items-start pop">
            <img src="arly.png" alt="Arly" class="w-16 h-16 object-contain flutuar shrink-0">
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-purple-700">${p.titulo}</h3>
                    <span class="text-xs text-gray-400 font-mono">${n + 1}/${PASSOS.length}</span>
                    <button data-acao="pular" class="ml-auto text-sm text-gray-400 hover:text-gray-600 hover:underline">Pular tutorial <i data-lucide="skip-forward"></i></button>
                </div>
                <p class="text-sm text-gray-600">${p.texto}</p>
                ${p.pronto ? `<p class="text-xs text-purple-500 mt-2"><i data-lucide="mouse-pointer-click"></i> Faça a ação para continuar</p>` : `
                <div class="flex justify-end mt-3">
                    <button data-acao="${ultimo ? 'pular' : 'proximo'}" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold btn-3d">
                        ${ultimo ? 'Começar' : 'Próximo'} <i data-lucide="arrow-right"></i></button>
                </div>`}
            </div>
        </div>`;
    icones();
    // aluno já fez a ação deste passo (ex.: ligou os dois H de uma vez)
    if (p.pronto?.()) setTimeout(() => estado.passo === n && mostrarPasso(n + 1), 700);
}

function fecharTutorial() {
    document.querySelectorAll('.foco').forEach(e => e.classList.remove('foco'));
    $('veu').hidden = $('falas').hidden = true;
    salvar('moleculas-tutorial', { visto: true });
    abrirNiveis();
}

function abrirNiveis() {
    estado.modo = 'niveis';
    telas(true);
    const feitos = ler('moleculas-montadas');
    $('telaNivel').innerHTML = `
        <img src="arly.png" alt="Arly" class="w-24 h-24 mx-auto object-contain flutuar">
        <h2 class="text-2xl md:text-3xl font-bold text-purple-700 mt-2">Escolha um bloco</h2>
        <p class="text-sm text-gray-500 mb-6">Ligue os átomos até não sobrar nenhuma valência livre. Cada bloco é infinito!</p>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${BLOCOS.map((b, i) => `
            <button data-acao="bloco" data-i="${i}" class="cartao-nivel bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-2xl p-5 transition">
                <i data-lucide="${b.icone}" class="text-purple-600" style="width:2rem;height:2rem"></i>
                <div class="text-xs text-purple-400 font-semibold mt-2">BLOCO ${i + 1}</div>
                <div class="font-bold text-purple-700">${b.nome}</div>
                <div class="text-xs text-gray-500 mt-1 font-mono"><i data-lucide="infinity"></i> ${feitos[i] ?? 0} montadas</div>
            </button>`).join('')}
        </div>`;
    icones();
}

// baralho: só repete uma molécula depois de sair todas do bloco; a 1ª rodada vai da mais fácil à mais difícil
const baralhos = {};
const tamanho = m => Object.values(contarAtomos(m.f)).reduce((s, n) => s + n, 0);
function proximaDoBloco(b) {
    if (!baralhos[b]?.length) {
        const mols = [...BLOCOS[b].mols];
        if (baralhos[b]) mols.sort(() => Math.random() - .5);
        else mols.sort((x, y) => tamanho(x) - tamanho(y));
        if (mols[0] === estado.mol && mols.length > 1) mols.push(mols.shift());
        baralhos[b] = mols;
    }
    return baralhos[b].shift();
}

function jogarBloco(b, idx = 0) {
    Object.assign(estado, { modo: 'jogo', bloco: b, idx });
    telas(false);
    const B = BLOCOS[b];
    $('barraTopo').innerHTML = `
        <span class="font-game px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm"><i data-lucide="${B.icone}"></i> ${B.nome}</span>
        <span class="text-sm text-gray-500 font-mono">Molécula ${idx + 1} <i data-lucide="infinity"></i></span>
        <span id="slotProxima" class="ml-auto"></span>
        <button data-acao="reiniciar" class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-xl text-sm font-semibold btn-3d-cinza"><i data-lucide="rotate-ccw"></i> Reiniciar</button>`;
    carregarMolecula(proximaDoBloco(b));
    icones();
}

const ACOES = {
    tutorial: abrirTutorial,
    pular: fecharTutorial,
    proximo: () => mostrarPasso(estado.passo + 1),
    niveis: () => { if (estado.modo === 'tutorial') fecharTutorial(); else abrirNiveis(); },
    bloco: el => jogarBloco(+el.dataset.i),
    reiniciar: () => carregarMolecula(estado.mol),
    proxima: () => jogarBloco(estado.bloco, estado.idx + 1),
    zoomMais: () => zoom(.85),
    zoomMenos: () => zoom(1.18),
};
document.addEventListener('click', e => {
    const b = e.target.closest('[data-acao]');
    if (b) ACOES[b.dataset.acao](b);
});

// autoteste: toda fórmula usa só elementos conhecidos e tem soma de valências par (senão não fecha)
for (const b of BLOCOS) for (const m of b.mols) {
    const c = contarAtomos(m.f), soma = Object.entries(c).reduce((s, [el, n]) => s + VALENCIA[el] * n, 0);
    console.assert(Object.keys(c).every(el => VALENCIA[el]) && soma % 2 === 0, 'molécula impossível: ' + m.f);
}
BLOCOS.forEach((b, i) => b.mols.forEach(m =>
    console.assert(ACEITA[i](contarAtomos(m.f), m.f, m), `${m.nome} está no bloco errado: ${b.nome}`)));

if (ler('moleculas-tutorial').visto) abrirNiveis(); else abrirTutorial();
