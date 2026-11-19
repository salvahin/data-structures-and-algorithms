/* ============================================================
   SIM-GRAFOS — representaciones de grafos paso a paso
   Requiere Reveal.js 5.x y curso-slides.js. Incluir después de
   curso-slides.js y llamar, tras CursoSlides.init(...):

       SimGrafos.init();

   Uso en HTML:

     <div class="sim-grafos" data-alg="existe" data-n="6"
          data-aristas="0-1,0-2,1-3,2-3,3-4,4-5"
          data-u="3" data-v="5"></div>

   data-alg:
     retratos  el mismo grafo como dibujo, matriz, lista de
               adyacencias y lista de arcos; una arista por paso
     arcos     lista de arcos con pesos (data-pesos): un registro,
               menorPeso, std::sort y los vecinos de data-u barriendo
               los E arcos
     existe    existeM contra existeL, línea por línea  (data-u, data-v)
     vecinos   vecinosM contra vecinosL, una vuelta por paso (data-u)
     densidad  memoria y costo de consulta de la matriz y de la lista
               conforme el grafo se vuelve más denso (V = 100)
   data-n: número de vértices (0..n−1). data-aristas: pares u-v en
   el orden en que se agregan; ese orden fija el de cada lista.

   Los pasos salen de ejecutar el código sobre el grafo: cambiar
   data-aristas o la consulta cambia el trazado. Un paso = un
   fragment del slide. El código (CODIGO, abajo) se genera desde la
   misma fuente que los bloques de código del deck.
   ============================================================ */

const SimGrafos = (() => {

  const CODIGO = {
      "matriz": "int n = 6;   // vértices 0..5\nstd::vector<int> fila(n, 0);\nstd::vector<std::vector<int>> M(n, fila);\n\nvoid agregarM(int u, int v) {\n    M[u][v] = 1;\n    M[v][u] = 1;   // omitir si es dirigido\n}",
      "lista": "std::vector<std::vector<int>> ady(n);\n\nvoid agregarL(int u, int v) {\n    ady[u].push_back(v);\n    // si el grafo es dirigido, se omite:\n    ady[v].push_back(u);\n}",
      "existe": "bool existeM(int u, int v) {\n    return M[u][v] == 1;\n}\nbool existeL(int u, int v) {\n    for (int w : ady[u]) {\n        if (w == v) return true;\n    }\n    return false;\n}",
      "vecinos": "void vecinosM(int u) {\n    for (int v = 0; v < n; v++) {\n        if (M[u][v] == 1) {\n            visita(v);\n        }\n    }\n}\nvoid vecinosL(int u) {\n    for (int v : ady[u]) {\n        visita(v);\n    }\n}",
      "arcos": "struct Arco {\n    int u;\n    int v;\n    int peso;\n};\nstd::vector<Arco> arcos;\n\nbool menorPeso(Arco a, Arco b) {\n    return a.peso < b.peso;\n}\n\n// Kruskal empieza ordenando todos los arcos\nstd::sort(arcos.begin(), arcos.end(),\n          menorPeso);"
  };

  function leerGrafo(ds) {
    const n = Number(ds.n || 6);
    const aristas = (ds.aristas || '').split(',').filter(Boolean).map(s => s.split('-').map(Number));
    const pesos = (ds.pesos || '').split(',').filter(Boolean).map(Number);
    return { n, aristas, pesos };
  }
  function construirEstructuras(g) {
    const M = Array.from({ length: g.n }, () => Array(g.n).fill(0));
    const ady = Array.from({ length: g.n }, () => []);
    g.aristas.forEach(([u, v]) => { M[u][v] = 1; M[v][u] = 1; ady[u].push(v); ady[v].push(u); });
    return { M, ady };
  }
  const copia = x => JSON.parse(JSON.stringify(x));

  /* Una foto guarda las estructuras y lo que se marca en ellas:
       celdas:   { "u,v": clase }        en la matriz
       entradas: { "u,j": clase }        j-ésimo vecino en ady[u]
       arcos:    { i: clase }            i-ésimo arco
       aristas:  { "u-v": clase }        en el dibujo
       fila:     u                       fila o lista que se recorre */
  function nuevaTraza(g, est) {
    const T = {
      g, M: est.M, ady: est.ady, arcos: est.arcos || [], F: [],
      paso(o) {
        T.F.push(Object.assign({
          M: copia(T.M), ady: copia(T.ady), arcos: copia(T.arcos),
          celdas: {}, entradas: {}, marcaArcos: {}, marcaAristas: {}, fila: null,
          chips: [], code: -1, test: '', say: '', predice: ''
        }, o));
      }
    };
    return T;
  }

  /* ---------- retratos: una arista por paso ---------- */
  function trazaRetratos(g) {
    const n = g.n;
    const T = nuevaTraza(g, { M: Array.from({ length: n }, () => Array(n).fill(0)), ady: Array.from({ length: n }, () => []), arcos: [] });
    let E = 0;
    const chips = () => [[`matriz: ${n * n} casillas`, ''], [`lista: ${2 * E} entradas`, 'ci'], [`arcos: ${E}`, 'cok']];
    T.paso({ chips: chips(), test: `n = ${n} vértices, 0 aristas`,
      say: `El mismo grafo se puede guardar de tres formas. La matriz ya ocupa sus ${n}×${n} casillas aunque no haya ninguna arista; las dos listas empiezan vacías.` });
    g.aristas.forEach(([u, v], i) => {
      T.M[u][v] = 1; T.M[v][u] = 1;
      T.ady[u].push(v); T.ady[v].push(u);
      T.arcos.push([u, v]);
      E++;
      T.paso({ chips: chips(), test: `agregar ${u}–${v}`,
        celdas: { [`${u},${v}`]: 'nuevo', [`${v},${u}`]: 'nuevo' },
        entradas: { [`${u},${T.ady[u].length - 1}`]: 'nuevo', [`${v},${T.ady[v].length - 1}`]: 'nuevo' },
        marcaArcos: { [i]: 'nuevo' }, marcaAristas: { [`${u}-${v}`]: 'nuevo' },
        say: i === 0
          ? `La arista ${u}–${v} no tiene dirección, así que la matriz marca dos casillas, M[${u}][${v}] y M[${v}][${u}], y la lista agrega a ${v} en la fila de ${u} y a ${u} en la de ${v}. La lista de arcos la guarda una sola vez.`
          : `La arista ${u}–${v}: dos casillas en la matriz, una entrada al final de ady[${u}] y otra al final de ady[${v}], y un arco más.` });
    });
    const unos = 2 * E;
    T.paso({ chips: chips(), test: `memoria: ${n * n} casillas · ${2 * E} entradas · ${E} arcos`,
      say: `La matriz guarda ${n * n} casillas y solo ${unos} tienen un 1. La lista de adyacencias guarda ${2 * E} entradas, porque cada arista aparece en las listas de sus dos extremos. La lista de arcos guarda ${E}.` });
    const [a, b] = g.aristas[Math.min(3, g.aristas.length - 1)];
    const ia = T.ady[a].indexOf(b), ib = T.ady[b].indexOf(a);
    T.paso({ chips: chips(), test: `la arista ${a}–${b} en los tres retratos`,
      celdas: { [`${a},${b}`]: 'nuevo', [`${b},${a}`]: 'nuevo' },
      entradas: { [`${a},${ia}`]: 'nuevo', [`${b},${ib}`]: 'nuevo' },
      marcaArcos: { [g.aristas.findIndex(([x, y]) => x === a && y === b)]: 'nuevo' }, marcaAristas: { [`${a}-${b}`]: 'nuevo' },
      say: `Una misma arista, la ${a}–${b}, ocupa dos casillas de la matriz, dos entradas de la lista de adyacencias y un arco. Cada representación facilita una pregunta distinta.` });
    return T.F;
  }

  /* ---------- existe: línea por línea ----------
     Líneas: 0 existeM · 1 return M[u][v] == 1 · 3 existeL · 4 for · 5 if w == v · 7 return false */
  function trazaExiste(g, u, v) {
    const est = construirEstructuras(g);
    const T = nuevaTraza(g, est);
    let lm = 0, ll = 0;
    const chips = () => [[`lecturas en la matriz: ${lm}`, 'ci'], [`lecturas en la lista: ${ll}`, 'cok']];
    T.paso({ chips: chips(), code: [0, 3], test: `¿existe la arista ${u}–${v}?`,
      say: `La misma pregunta, ¿están unidos el ${u} y el ${v}?, en las dos representaciones. Contamos cuántos datos lee cada una.`,
      predice: `¿cuántas lecturas necesita cada versión?` });
    lm = 1;
    const sm = est.M[u][v] === 1;
    T.paso({ chips: chips(), code: [0, 1], fila: u, celdas: { [`${u},${v}`]: 'lee' }, test: `M[${u}][${v}] = ${est.M[u][v]} → ${sm}`,
      say: `La matriz va directo a la casilla M[${u}][${v}]: una sola lectura, sin importar cuántos vecinos tenga el ${u}. Vale ${est.M[u][v]}, así que devuelve ${sm}.` });
    const vis = {};
    let res = false;
    for (let j = 0; j < est.ady[u].length; j++) {
      const w = est.ady[u][j];
      ll++;
      const igual = w === v;
      Object.keys(vis).forEach(k => { vis[k] = 'visto'; });
      vis[`${u},${j}`] = igual ? 'encontrado' : 'lee';
      T.paso({ chips: chips(), code: [4, 5], fila: u, entradas: Object.assign({}, vis), test: `w = ${w} · ¿${w} == ${v}? ${igual ? 'sí → return true' : 'no'}`,
        say: igual ? `El ${w} es el ${v}: la lista lo encontró en la lectura ${ll} y devuelve true.`
                   : `La lista revisa el siguiente vecino del ${u}: el ${w}. No es el ${v}; sigue buscando.` });
      if (igual) { res = true; break; }
    }
    if (!res) {
      Object.keys(vis).forEach(k => { vis[k] = 'visto'; });
      T.paso({ chips: chips(), code: 7, fila: u, entradas: Object.assign({}, vis), test: `return false`,
        say: `Se acabaron los vecinos del ${u} sin encontrar al ${v}: devuelve false después de ${ll} lecturas, una por cada vecino.` });
    }
    T.paso({ chips: chips(), code: -1, test: `matriz: ${lm} lectura · lista: ${ll} lecturas`,
      say: `La matriz respondió con 1 lectura: O(1). La lista necesitó ${ll}, tantas como vecinos revisó del ${u}: O(grado(${u})). En esta pregunta gana la matriz.` });
    return T.F;
  }

  /* ---------- vecinos: una vuelta del ciclo por paso ----------
     Líneas: 0 vecinosM · 1 for v · 2 if M == 1 · 3 visita · 7 vecinosL · 8 for · 9 visita */
  function trazaVecinos(g, u) {
    const est = construirEstructuras(g);
    const T = nuevaTraza(g, est);
    let lm = 0, ll = 0;
    const visitados = [];
    const chips = () => [[`lecturas en la matriz: ${lm}`, 'ci'], [`lecturas en la lista: ${ll}`, 'cok'], [`visita: ${visitados.join(', ') || '—'}`, '']];
    T.paso({ chips: chips(), code: [0, 7], test: `vecinos de ${u} · grado(${u}) = ${est.ady[u].length}`,
      say: `Ahora la pregunta que hacen los recorridos de grafos: ¿quiénes son los vecinos del ${u}? El ${u} tiene ${est.ady[u].length} vecinos de ${g.n} vértices posibles.`,
      predice: `¿cuántas casillas tiene que leer la matriz para encontrarlos?` });
    const celdas = {};
    for (let v = 0; v < g.n; v++) {
      lm++;
      Object.keys(celdas).forEach(k => { if (celdas[k] === 'lee') celdas[k] = 'visto'; if (celdas[k] === 'encontrado') celdas[k] = 'vecino'; });
      const es = est.M[u][v] === 1;
      celdas[`${u},${v}`] = es ? 'encontrado' : 'lee';
      if (es) visitados.push(v);
      T.paso({ chips: chips(), code: es ? [1, 2, 3] : [1, 2], fila: u, celdas: Object.assign({}, celdas), test: `v = ${v} · M[${u}][${v}] = ${est.M[u][v]}${es ? ' → visita(' + v + ')' : ''}`,
        say: es ? `M[${u}][${v}] vale 1: el ${v} es vecino y se visita.` : `M[${u}][${v}] vale 0: el ${v} no es vecino, pero la casilla se leyó de todos modos.` });
    }
    const vm = visitados.slice();
    visitados.length = 0;
    const ent = {};
    est.ady[u].forEach((w, j) => {
      ll++;
      Object.keys(ent).forEach(k => { ent[k] = 'vecino'; });
      ent[`${u},${j}`] = 'encontrado';
      visitados.push(w);
      T.paso({ chips: chips(), code: [8, 9], fila: u, entradas: Object.assign({}, ent), test: `v = ${w} → visita(${w})`,
        say: j === 0 ? `La lista de adyacencias tiene guardados exactamente los vecinos del ${u}. El primero es el ${w}.` : `Siguiente vecino: el ${w}.` });
    });
    T.paso({ chips: chips(), code: -1, test: `matriz: ${lm} lecturas · lista: ${ll} lecturas`,
      say: `Las dos visitan a los mismos vecinos (${vm.join(', ')}). La matriz leyó toda la fila, ${lm} casillas: O(V). La lista leyó ${ll}: O(grado(${u})). En esta pregunta gana la lista, y es la que hacen DFS y BFS millones de veces.` });
    return T.F;
  }

  /* ---------- densidad (V = 100) ---------- */
  function trazaDensidad() {
    const V = 100, max = V * (V - 1) / 2;
    const dens = [0.01, 0.03, 0.1, 0.25, 0.5, 1];
    const F = [];
    const fmt = x => x.toLocaleString('es-MX');
    dens.forEach((d, i) => {
      const E = Math.round(d * max);
      const lista = V + 2 * E, grado = 2 * E / V;
      const ceros = 100 - (2 * E) / (V * V) * 100;
      F.push({ d, E, V, lista, grado, code: -1,
        chips: [[`E = ${fmt(E)}`, ''], [`casillas en cero: ${ceros.toFixed(0)}%`, 'cj']],
        test: `densidad ${Math.round(d * 100)}% · grado promedio ${grado.toFixed(1)}`,
        say: i === 0
          ? `100 vértices y ${fmt(E)} aristas: un grafo disperso, como casi todos los reales. La matriz guarda ${fmt(V * V)} casillas y el ${ceros.toFixed(0)}% están en cero. La lista guarda ${fmt(lista)} entradas.`
          : d < 1
            ? `Con ${fmt(E)} aristas la lista crece a ${fmt(lista)} entradas y la matriz sigue en ${fmt(V * V)}. Consultar una arista en la lista ya puede costar unas ${grado.toFixed(0)} lecturas, tantas como vecinos tiene un vértice; en la matriz, 1.`
            : `Grafo completo: todos con todos. La lista ocupa ${fmt(lista)} entradas, casi lo mismo que la matriz, y consultar una arista le puede costar ${grado.toFixed(0)} lecturas. En un grafo denso la matriz no desperdicia memoria y consulta en O(1).`,
        predice: i === 0 ? `¿con qué densidad la lista ocuparía tanto como la matriz?` : '' });
    });
    return F;
  }

  /* ---------- arcos: registros completos, ordenar y buscar vecinos ----------
     Líneas: 0-4 struct Arco · 5 vector · 7-9 menorPeso · 11-13 std::sort
     Una foto de arcos guarda la lista en su orden actual: [u, v, peso, i0]
     (i0 = posición original) y marcas por posición. */
  function trazaArcos(g, x) {
    const F = [];
    let lista = g.aristas.map(([u, v], i) => [u, v, g.pesos[i], i]);
    const paso = o => F.push(Object.assign({ lista: copia(lista), filas: {}, aristas: {}, chips: [], code: -1, test: '', say: '', predice: '' }, o));
    const k = ([u, v]) => `${u}-${v}`;
    paso({ code: [0, 1, 2, 3, 4], test: `${lista.length} arcos de 3 enteros cada uno`,
      say: `Cada Arco es un registro con la arista completa: sus dos extremos y su peso. La lista de arcos es un vector de esos registros, en el orden en que se agregaron. No hay ningún índice por vértice.`,
      predice: `¿qué pregunta responde bien esta representación, y cuál responde mal?` });
    const [a, b] = lista;
    paso({ code: 5, filas: { 0: 'nuevo' }, aristas: { [k(a)]: 'nuevo' }, test: `arcos[0] = {${a[0]}, ${a[1]}, ${a[2]}}`,
      say: `arcos[0] es la arista ${a[0]}–${a[1]} con peso ${a[2]}. Todo lo que se sabe de ella está en esa casilla del vector.` });
    paso({ code: [7, 8, 9], filas: { 0: 'lee', 1: 'lee' }, aristas: { [k(a)]: 'nuevo', [k(b)]: 'nuevo' },
      test: `menorPeso(arcos[0], arcos[1]): ${a[2]} < ${b[2]} → ${a[2] < b[2]}`,
      say: `menorPeso compara dos arcos por su peso. Con arcos[0] y arcos[1] pregunta si ${a[2]} < ${b[2]}: ${a[2] < b[2] ? 'true, así que arcos[0] va antes' : `false, así que la arista ${b[0]}–${b[1]} debe ir antes`}. std::sort hace esa pregunta las veces que necesite.` });
    lista = lista.slice().sort((p, q) => p[2] - q[2]);
    const movidos = {};
    lista.forEach((r, i) => { if (r[3] !== i) movidos[i] = 'nuevo'; });
    paso({ code: [11, 12, 13], filas: movidos, test: `orden por peso: ${lista.map(r => r[2]).join(', ')}`,
      say: `std::sort reordena el vector con menorPeso. Ahora arcos[0] es la arista más ligera, ${lista[0][0]}–${lista[0][1]} con peso ${lista[0][2]}. Kruskal empieza justo así: toma los arcos de este vector en orden, del más ligero al más pesado.` });
    const vis = {}, vec = [];
    let lect = 0;
    lista.forEach((r, i) => {
      lect++;
      Object.keys(vis).forEach(j => { if (vis[j] === 'lee') vis[j] = 'visto'; });
      const toca = r[0] === x || r[1] === x;
      vis[i] = toca ? 'vecino' : 'lee';
      if (toca) vec.push(r[0] === x ? r[1] : r[0]);
      const ar = {};
      Object.keys(vis).forEach(j => { if (vis[j] === 'vecino') ar[k(lista[j])] = 'vecino'; });
      if (!toca) ar[k(r)] = 'lee';
      paso({ code: -1, filas: Object.assign({}, vis), aristas: ar, chips: [[`arcos revisados: ${lect} de ${lista.length}`, 'ci'], [`vecinos del ${x}: ${vec.length ? vec.join(', ') : '—'}`, 'cok']],
        test: `arcos[${i}] = {${r[0]}, ${r[1]}, ${r[2]}} · ¿toca al ${x}? ${toca ? 'sí' : 'no'}`,
        say: i === 0
          ? `Otra pregunta: ¿quiénes son los vecinos del ${x}? Aquí no hay una fila del ${x} a la cual ir, así que se revisa cada arco. arcos[0] ${toca ? `toca al ${x}` : `no toca al ${x}`}.`
          : toca ? `arcos[${i}] une al ${r[0]} con el ${r[1]}: el ${r[0] === x ? r[1] : r[0]} es vecino del ${x}.`
                 : `arcos[${i}] une al ${r[0]} con el ${r[1]}: no toca al ${x}.` });
    });
    Object.keys(vis).forEach(j => { if (vis[j] === 'lee') vis[j] = 'visto'; });
    const ar = {};
    Object.keys(vis).forEach(j => { if (vis[j] === 'vecino') ar[k(lista[j])] = 'vecino'; });
    paso({ code: -1, filas: Object.assign({}, vis), aristas: ar, chips: [[`arcos revisados: ${lect} de ${lista.length}`, 'ci'], [`vecinos del ${x}: ${vec.join(', ')}`, 'cok']],
      test: `${lista.length} lecturas para ${vec.length} vecinos`,
      say: `Para encontrar ${vec.length} vecinos hubo que leer los ${lista.length} arcos: O(E) por consulta. La lista de adyacencias lo resuelve en O(grado(${x})). La lista de arcos conviene cuando el algoritmo procesa aristas completas, como ordenarlas por peso.` });
    return F;
  }

  function trazar(alg, ds) {
    const g = leerGrafo(ds);
    switch (alg) {
      case 'retratos': return trazaRetratos(g);
      case 'existe': return trazaExiste(g, Number(ds.u), Number(ds.v));
      case 'vecinos': return trazaVecinos(g, Number(ds.u));
      case 'densidad': return trazaDensidad();
      case 'arcos': return trazaArcos(g, Number(ds.u));
    }
    throw new Error('sim-grafos: algoritmo desconocido ' + alg);
  }

  /* ---------- Dibujo ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, txt) => {
    const e = document.createElementNS(NS, tag);
    for (const a in attrs) e.setAttribute(a, attrs[a]);
    if (txt !== undefined) e.textContent = txt;
    return e;
  };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function pintarCodigo(linea) {
    const k = linea.indexOf('//');
    const codigo = k < 0 ? linea : linea.slice(0, k);
    const cm = k < 0 ? '' : `<span class="cm">${esc(linea.slice(k))}</span>`;
    return esc(codigo)
      .replace(/\b(int|bool|void|while|for|if|else|return|true|false|struct)\b/g, '\u0001$1\u0002')
      .replace(/\b(existeM|existeL|vecinosM|vecinosL|visita|agregarM|agregarL|push_back|menorPeso|sort|begin|end)\b(?=\()/g, '\u0003$1\u0002')
      .replace(/(?<![\w#])(-?\d+)\b/g, '\u0004$1\u0002')
      .replace(/\u0001/g, '<span class="kw">').replace(/\u0003/g, '<span class="fn">')
      .replace(/\u0004/g, '<span class="num">').replace(/\u0002/g, '</span>') + cm;
  }
  function barraNueva() {
    const barra = document.createElement('div');
    barra.className = 'sim-barra sg-barra';
    barra.innerHTML =
      '<span class="sim-chip"></span><span class="sim-chip"></span><span class="sim-chip"></span>' +
      '<span class="sim-test"></span>' +
      '<span class="sim-ctrl">' +
        '<button type="button" data-ir="-1" aria-label="Paso anterior">◀</button>' +
        '<span class="sim-cont"></span>' +
        '<button type="button" data-ir="1" aria-label="Paso siguiente">▶</button>' +
      '</span>';
    barra.querySelectorAll('button').forEach(btn => btn.addEventListener('click', ev => {
      ev.stopPropagation();
      if (typeof Reveal === 'undefined') return;
      if (Number(btn.dataset.ir) > 0) Reveal.nextFragment(); else Reveal.prevFragment();
    }));
    return barra;
  }
  function pintarBarra(barra, f, k, total) {
    [...barra.querySelectorAll('.sim-chip')].forEach((c, i) => {
      const v = f.chips && f.chips[i];
      c.hidden = !v;
      if (!v) return;
      c.textContent = v[0];
      c.className = 'sim-chip ' + (v[1] || '');
    });
    barra.querySelector('.sim-test').textContent = f.test;
    barra.querySelector('.sim-cont').textContent = `${k + 1} / ${total}`;
  }
  const dicho = f => f.say + (f.predice ? `<span class="predice"><b>Antes de avanzar:</b> ${f.predice}</span>` : '');

  // Matriz con encabezados. (x0, y0): esquina; c: tamaño de casilla.
  function dibujarMatriz(capa, f, n, x0, y0, c) {
    for (let i = 0; i < n; i++) {
      capa.appendChild(el('text', { x: x0 + (i + 1.5) * c, y: y0 + c * 0.68, class: 'sg-ind' }, i));
      capa.appendChild(el('text', { x: x0 + c * 0.5, y: y0 + (i + 1) * c + c * 0.68, class: 'sg-ind' + (f.fila === i ? ' acc' : '') }, i));
    }
    if (f.fila !== null) capa.appendChild(el('rect', { x: x0 + c, y: y0 + (f.fila + 1) * c, width: n * c, height: c, class: 'sg-fila' }));
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const m = f.celdas[`${i},${j}`] || '';
      const g = el('g', { class: 'sg-celda' + (m ? ' ' + m : '') + (f.M[i][j] ? ' uno' : '') });
      g.appendChild(el('rect', { x: x0 + (j + 1) * c + 1.5, y: y0 + (i + 1) * c + 1.5, width: c - 3, height: c - 3, rx: 4 }));
      g.appendChild(el('text', { x: x0 + (j + 1.5) * c, y: y0 + (i + 1) * c + c * 0.68, class: 'sg-val' }, f.M[i][j]));
      capa.appendChild(g);
    }
  }
  // Lista de adyacencias: una fila por vértice.
  function dibujarLista(capa, f, n, x0, y0, h, w) {
    for (let u = 0; u < n; u++) {
      const y = y0 + u * h;
      if (f.fila === u) capa.appendChild(el('rect', { x: x0 - 4, y: y + 1, width: 54 + Math.max(1, f.ady[u].length) * (w + 4) + 6, height: h - 2, class: 'sg-fila' }));
      capa.appendChild(el('text', { x: x0 + 14, y: y + h * 0.68, class: 'sg-ind' + (f.fila === u ? ' acc' : '') }, u));
      capa.appendChild(el('text', { x: x0 + 34, y: y + h * 0.68, class: 'sg-flecha-t' }, '→'));
      f.ady[u].forEach((v, j) => {
        const m = f.entradas[`${u},${j}`] || '';
        const g = el('g', { class: 'sg-entrada' + (m ? ' ' + m : '') });
        const x = x0 + 54 + j * (w + 4);
        g.appendChild(el('rect', { x, y: y + 3, width: w, height: h - 6, rx: 5 }));
        g.appendChild(el('text', { x: x + w / 2, y: y + h * 0.68, class: 'sg-val' }, v));
        capa.appendChild(g);
      });
    }
  }

  function construirRetratos(cont, F, g) {
    const W = 1100, H = 350;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sg-svg' });
    const capa = el('g', {});
    svg.appendChild(capa);
    cont.appendChild(svg);
    const abajo = document.createElement('div');
    abajo.className = 'sg-abajo';
    const dice = document.createElement('p');
    dice.className = 'sim-dice sg-dice';
    const barra = barraNueva();
    abajo.appendChild(dice); abajo.appendChild(barra);
    cont.appendChild(abajo);
    const n = g.n;
    // Dibujo en círculo
    const CX = 160, CY = 190, RR = 120;
    const pos = i => ({ x: CX + RR * Math.cos(-Math.PI / 2 + 2 * Math.PI * i / n), y: CY + RR * Math.sin(-Math.PI / 2 + 2 * Math.PI * i / n) });
    return function pintar(k) {
      k = Math.max(0, Math.min(k, F.length - 1));
      const f = F[k];
      capa.innerHTML = '';
      capa.appendChild(el('text', { x: CX, y: 28, class: 'sg-titulo' }, 'Dibujo'));
      capa.appendChild(el('text', { x: 520, y: 28, class: 'sg-titulo' }, 'Matriz de adyacencias'));
      capa.appendChild(el('text', { x: 900, y: 28, class: 'sg-titulo' }, 'Lista de adyacencias'));
      f.arcos.forEach(([u, v]) => {
        const a = pos(u), b = pos(v);
        const m = f.marcaAristas[`${u}-${v}`] || '';
        capa.appendChild(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'sg-arista' + (m ? ' ' + m : '') }));
      });
      for (let i = 0; i < n; i++) {
        const p = pos(i);
        const g2 = el('g', { class: 'sg-nodo' });
        g2.appendChild(el('circle', { cx: p.x, cy: p.y, r: 22 }));
        g2.appendChild(el('text', { x: p.x, y: p.y + 7, class: 'sg-dato' }, i));
        capa.appendChild(g2);
      }
      dibujarMatriz(capa, f, n, 380, 42, 40);
      dibujarLista(capa, f, n, 760, 46, 34, 34);
      // Lista de arcos
      capa.appendChild(el('text', { x: 760, y: 278, class: 'sg-titulo izq' }, 'Lista de arcos'));
      f.arcos.forEach(([u, v], i) => {
        const m = f.marcaArcos[i] || '';
        const g2 = el('g', { class: 'sg-entrada' + (m ? ' ' + m : '') });
        const x = 760 + i * 56;
        g2.appendChild(el('rect', { x, y: 292, width: 52, height: 34, rx: 5 }));
        g2.appendChild(el('text', { x: x + 26, y: 315, class: 'sg-val chico' }, `${u},${v}`));
        capa.appendChild(g2);
      });
      dice.innerHTML = dicho(f);
      pintarBarra(barra, f, k, F.length);
    };
  }

  function construirConsulta(cont, F, g, clave) {
    const cuerpo = document.createElement('div');
    cuerpo.className = 'sg-cuerpo';
    const izq = document.createElement('div');
    izq.className = 'sg-izq';
    const pre = document.createElement('pre');
    pre.className = 'sim-codigo sg-codigo';
    pre.innerHTML = CODIGO[clave].split('\n').map(l => `<div class="sim-linea">${pintarCodigo(l) || ' '}</div>`).join('');
    izq.appendChild(pre);
    const der = document.createElement('div');
    der.className = 'sg-der';
    const n = g.n, c = 34;
    const W = 500, H = (n + 1) * c + 34;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sg-svg' });
    const capa = el('g', {});
    svg.appendChild(capa);
    der.appendChild(svg);
    const dice = document.createElement('p');
    dice.className = 'sim-dice sg-dice';
    der.appendChild(dice);
    const barra = barraNueva();
    der.appendChild(barra);
    cuerpo.appendChild(izq); cuerpo.appendChild(der);
    cont.appendChild(cuerpo);
    const lineas = [...pre.querySelectorAll('.sim-linea')];
    return function pintar(k) {
      k = Math.max(0, Math.min(k, F.length - 1));
      const f = F[k];
      capa.innerHTML = '';
      capa.appendChild(el('text', { x: (n + 1) * c / 2, y: 20, class: 'sg-titulo' }, 'Matriz M'));
      capa.appendChild(el('text', { x: 270, y: 20, class: 'sg-titulo izq' }, 'Lista ady'));
      dibujarMatriz(capa, f, n, 0, 30, c);
      dibujarLista(capa, f, n, 262, 30 + c, c, 32);
      const act = Array.isArray(f.code) ? f.code : [f.code];
      lineas.forEach((l, i) => l.classList.toggle('on', act.includes(i)));
      dice.innerHTML = dicho(f);
      pintarBarra(barra, f, k, F.length);
    };
  }

  // Código a la izquierda; dibujo con pesos y tabla de arcos a la derecha.
  function construirArcos(cont, F, g) {
    const cuerpo = document.createElement('div');
    cuerpo.className = 'sg-cuerpo';
    const izq = document.createElement('div');
    izq.className = 'sg-izq';
    const pre = document.createElement('pre');
    pre.className = 'sim-codigo sg-codigo';
    pre.innerHTML = CODIGO.arcos.split('\n').map(l => `<div class="sim-linea">${pintarCodigo(l) || ' '}</div>`).join('');
    izq.appendChild(pre);
    const der = document.createElement('div');
    der.className = 'sg-der';
    const n = g.n, E = g.aristas.length, h = 36;
    const W = 500, H = Math.max(260, 44 + (E + 1) * h);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sg-svg' });
    const capa = el('g', {});
    svg.appendChild(capa);
    der.appendChild(svg);
    const dice = document.createElement('p');
    dice.className = 'sim-dice sg-dice';
    der.appendChild(dice);
    const barra = barraNueva();
    der.appendChild(barra);
    cuerpo.appendChild(izq); cuerpo.appendChild(der);
    cont.appendChild(cuerpo);
    const lineas = [...pre.querySelectorAll('.sim-linea')];
    const CX = 118, CY = 30 + (H - 30) / 2, RR = Math.min(96, (H - 80) / 2);
    const pos = i => ({ x: CX + RR * Math.cos(-Math.PI / 2 + 2 * Math.PI * i / n), y: CY + RR * Math.sin(-Math.PI / 2 + 2 * Math.PI * i / n) });
    const X0 = 262, cw = 54;
    return function pintar(k) {
      k = Math.max(0, Math.min(k, F.length - 1));
      const f = F[k];
      capa.innerHTML = '';
      capa.appendChild(el('text', { x: CX, y: 20, class: 'sg-titulo' }, 'Dibujo'));
      capa.appendChild(el('text', { x: X0, y: 20, class: 'sg-titulo izq' }, 'arcos'));
      // Dibujo con el peso a la mitad de cada arista
      f.lista.forEach(([u, v, p]) => {
        const a = pos(u), b = pos(v);
        const m = f.aristas[`${u}-${v}`] || '';
        capa.appendChild(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'sg-arista' + (m ? ' ' + m : '') }));
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const gp = el('g', { class: 'sg-peso' + (m ? ' ' + m : '') });
        gp.appendChild(el('rect', { x: mx - 12, y: my - 12, width: 24, height: 24, rx: 12 }));
        gp.appendChild(el('text', { x: mx, y: my + 5.5, class: 'sg-pval' }, p));
        capa.appendChild(gp);
      });
      for (let i = 0; i < n; i++) {
        const p = pos(i);
        const g2 = el('g', { class: 'sg-nodo' });
        g2.appendChild(el('circle', { cx: p.x, cy: p.y, r: 19 }));
        g2.appendChild(el('text', { x: p.x, y: p.y + 6.5, class: 'sg-dato' }, i));
        capa.appendChild(g2);
      }
      // Tabla: una fila por arco, columnas u, v, peso
      ['u', 'v', 'peso'].forEach((t, j) => capa.appendChild(el('text', { x: X0 + 40 + j * (cw + 4) + cw / 2, y: 50, class: 'sg-ind' }, t)));
      f.lista.forEach((r, i) => {
        const y = 60 + i * h;
        const m = f.filas[i] || '';
        capa.appendChild(el('text', { x: X0 + 14, y: y + h * 0.62, class: 'sg-ind' }, `[${i}]`));
        const g2 = el('g', { class: 'sg-entrada' + (m ? ' ' + m : '') });
        for (let j = 0; j < 3; j++) {
          const x = X0 + 40 + j * (cw + 4);
          g2.appendChild(el('rect', { x, y: y + 2, width: cw, height: h - 6, rx: 5 }));
          g2.appendChild(el('text', { x: x + cw / 2, y: y + h * 0.62, class: 'sg-val' }, r[j]));
        }
        capa.appendChild(g2);
      });
      const act = Array.isArray(f.code) ? f.code : [f.code];
      lineas.forEach((l, i) => l.classList.toggle('on', act.includes(i)));
      dice.innerHTML = dicho(f);
      pintarBarra(barra, f, k, F.length);
    };
  }

  function construirDensidad(cont, F) {
    const W = 1100, H = 300;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sg-svg' });
    const capa = el('g', {});
    svg.appendChild(capa);
    cont.appendChild(svg);
    const abajo = document.createElement('div');
    abajo.className = 'sg-abajo';
    const dice = document.createElement('p');
    dice.className = 'sim-dice sg-dice';
    const barra = barraNueva();
    abajo.appendChild(dice); abajo.appendChild(barra);
    cont.appendChild(abajo);
    const fmt = x => Math.round(x).toLocaleString('es-MX');
    // Dos grupos de barras horizontales: memoria y lecturas por consulta.
    const barras = (y0, titulo, filas, max) => {
      capa.appendChild(el('text', { x: 20, y: y0, class: 'sg-titulo izq' }, titulo));
      filas.forEach(([nombre, val, cls], i) => {
        const y = y0 + 16 + i * 44;
        capa.appendChild(el('text', { x: 20, y: y + 26, class: 'sg-etq' }, nombre));
        capa.appendChild(el('rect', { x: 200, y, width: 760, height: 34, rx: 6, class: 'sg-carril' }));
        capa.appendChild(el('rect', { x: 200, y, width: Math.max(3, 760 * val / max), height: 34, rx: 6, class: 'sg-barra-v ' + cls }));
        capa.appendChild(el('text', { x: 975, y: y + 26, class: 'sg-num' }, fmt(val)));
      });
    };
    return function pintar(k) {
      k = Math.max(0, Math.min(k, F.length - 1));
      const f = F[k];
      capa.innerHTML = '';
      barras(26, 'Memoria (casillas o entradas guardadas)', [['matriz', f.V * f.V, 'mat'], ['lista', f.lista, 'lis']], f.V * f.V);
      barras(176, '¿Existe (u, v)? Lecturas si u–v no existe (vértice de grado promedio)', [['matriz', 1, 'mat'], ['lista', f.grado, 'lis']], f.V);
      dice.innerHTML = dicho(f);
      pintarBarra(barra, f, k, F.length);
    };
  }

  function construir(cont) {
    const alg = cont.dataset.alg;
    const F = trazar(alg, cont.dataset);
    const g = leerGrafo(cont.dataset);
    cont.innerHTML = '';
    cont.classList.add('sg-' + alg);
    let pintar;
    if (alg === 'retratos') pintar = construirRetratos(cont, F, g);
    else if (alg === 'densidad') pintar = construirDensidad(cont, F);
    else if (alg === 'arcos') pintar = construirArcos(cont, F, g);
    else pintar = construirConsulta(cont, F, g, alg);
    const huecos = document.createElement('span');
    huecos.className = 'sim-fragments';
    for (let i = 1; i < F.length; i++) {
      const f = document.createElement('span');
      f.className = 'fragment';
      f.setAttribute('aria-hidden', 'true');
      huecos.appendChild(f);
    }
    cont.appendChild(huecos);
    cont._simPintar = pintar;
    cont._simTotal = F.length;
    pintar(0);
  }

  function sync() {
    const slide = Reveal.getCurrentSlide();
    if (!slide) return;
    slide.querySelectorAll('.sim-grafos').forEach(cont => {
      if (!cont._simPintar) return;
      const vistos = cont.querySelectorAll('.sim-fragments .fragment.visible').length;
      cont._simPintar(vistos);
      const b = cont.querySelectorAll('.sim-ctrl button');
      if (b[0]) b[0].disabled = vistos === 0;
      if (b[1]) b[1].disabled = vistos >= cont._simTotal - 1;
    });
  }

  function init() {
    const sims = document.querySelectorAll('.sim-grafos');
    if (!sims.length) return;
    sims.forEach(construir);
    if (typeof Reveal !== 'undefined') {
      if (Reveal.sync) Reveal.sync();
      ['fragmentshown', 'fragmenthidden', 'slidechanged', 'ready']
        .forEach(ev => Reveal.on(ev, () => setTimeout(sync, 0)));
      sync();
    }
  }

  return { init, _codigo: CODIGO, _trazar: (alg, ds) => trazar(alg, ds || {}) };
})();

if (typeof module !== 'undefined') module.exports = SimGrafos;
