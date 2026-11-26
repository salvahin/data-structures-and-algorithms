/* ============================================================
   SIM-AVANZADOS — bipartito, puntos de articulación y union-find
   Requiere Reveal.js 5.x, curso-slides.js y los estilos de
   sim-recorridos.css (dibujo de grafos y casillas) más
   sim-avanzados.css. Incluir después de curso-slides.js y llamar,
   tras CursoSlides.init(...):

       SimAvanzados.init();

   Uso en HTML:

     <div class="sim-avanzados" data-alg="colorear" data-n="6"
          data-aristas="0-1,0-2,1-3,2-4,3-5,4-5"
          data-capas="0|1,2|3,4|5" data-inicio="0"></div>

   data-alg:
     colorear     coloreado a dos tonos con BFS, línea por línea
     dfsLow       DFS con disc y low para puntos de articulación
     uf           union-find con unión por tamaño y compresión de
                  caminos; data-ops="0-1,2-3,f7" (u-v = unir, fX = find)
   data-aristas: pares u-v (no dirigido), en el orden en que se
   agregan; ese orden fija el de cada lista ady[u].
   data-capas: vértices por renglón del dibujo, de arriba abajo;
   «_» deja un hueco.

   Los pasos salen de ejecutar el código: cambiar data-aristas o
   data-ops cambia el trazado. Un paso = un fragment del slide. El
   código (CODIGO, abajo) se genera desde la misma fuente que los
   bloques de código del deck.
   ============================================================ */

const SimAvanzados = (() => {

  const CODIGO = {
      "colorear": "bool colorear(int s) {\n    color[s] = 0;\n    std::queue<int> fila;\n    fila.push(s);\n    while (!fila.empty()) {\n        int u = fila.front();\n        fila.pop();\n        for (int v : ady[u]) {\n            if (color[v] == -1) {\n                if (color[u] == 0) {\n                    color[v] = 1;\n                } else {\n                    color[v] = 0;\n                }\n                fila.push(v);\n            } else if (color[v] == color[u]) {\n                return false;\n            }\n        }\n    }\n    return true;\n}",
      "esBipartito": "bool esBipartito() {\n    color.assign(n, -1);\n    for (int s = 0; s < n; s++) {\n        if (color[s] == -1) {\n            bool ok = colorear(s);\n            if (!ok) {\n                return false;\n            }\n        }\n    }\n    return true;\n}",
      "dfsLow": "void dfsLow(int u, int padre) {\n    t = t + 1;\n    disc[u] = t;\n    low[u] = t;\n    int hijos = 0;\n    for (int v : ady[u]) {\n        if (disc[v] == 0) {\n            hijos = hijos + 1;\n            dfsLow(v, u);\n            low[u] = std::min(low[u], low[v]);\n            if (padre != -1 && low[v] >= disc[u]) {\n                corte[u] = true;\n            }\n        } else if (v != padre) {\n            low[u] = std::min(low[u], disc[v]);\n        }\n    }\n    if (padre == -1 && hijos > 1) {\n        corte[u] = true;\n    }\n}",
      "articulaciones": "void articulaciones() {\n    t = 0;\n    disc.assign(n, 0);\n    low.assign(n, 0);\n    corte.assign(n, false);\n    for (int s = 0; s < n; s++) {\n        if (disc[s] == 0) {\n            dfsLow(s, -1);\n        }\n    }\n}",
      "init": "void init(int n) {\n    padre.resize(n);\n    tam.assign(n, 1);\n    for (int i = 0; i < n; i++) {\n        padre[i] = i;\n    }\n}",
      "uf": "int find(int x) {\n    if (padre[x] == x) {\n        return x;\n    }\n    int raiz = find(padre[x]);\n    padre[x] = raiz;\n    return raiz;\n}\nvoid unir(int a, int b) {\n    int ra = find(a);\n    int rb = find(b);\n    if (ra == rb) {\n        return;\n    }\n    if (tam[ra] < tam[rb]) {\n        padre[ra] = rb;\n        tam[rb] = tam[rb] + tam[ra];\n    } else {\n        padre[rb] = ra;\n        tam[ra] = tam[ra] + tam[rb];\n    }\n}"
  };

  function leerGrafo(ds) {
    const n = Number(ds.n || 6);
    const txt = ds.aristas || '';
    const aristas = txt.split(',').filter(Boolean).map(s => s.split('-').map(Number));
    const ady = Array.from({ length: n }, () => []);
    aristas.forEach(([u, v]) => { ady[u].push(v); ady[v].push(u); });
    const capas = ds.capas ? ds.capas.split('|').map(c => c.split(',').map(x => x === '_' ? null : Number(x)))
                           : [Array.from({ length: n }, (_, i) => i)];
    return { n, aristas, dirigido: false, ady, capas, inicio: Number(ds.inicio || 0) };
  }
  const clave = (g, u, v) => `${Math.min(u, v)}-${Math.max(u, v)}`;
  const lista = xs => xs.length ? xs.join(', ') : '—';
  const y_ = xs => xs.length < 2 ? lista(xs) : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1];
  const losV = (xs, may) => { const s = xs.length === 1 ? `el ${xs[0]}` : `los vértices ${y_(xs)}`; return may ? s[0].toUpperCase() + s.slice(1) : s; };

  function nuevaFoto(o) {
    return Object.assign({ nodos: {}, badges: {}, aristas: {}, pila: null, filas: [],
      chips: [], code: -1, test: '', say: '', predice: '' }, o);
  }

  /* ---------- colorear: BFS a dos tonos ----------
     Líneas: 1-3 inicio · 4 while · 5 front · 6 pop · 7 for · 8 if -1 · 9 color · 10 push
             11 else if igual · 12 return false · 16 return true */
  function trazaColorear(g) {
    const n = g.n, s = g.inicio;
    const color = Array(n).fill(-1), fila = [], desde = Array(n).fill(-1);
    const F = [];
    let aristas = {}, foco = -1, nuevo = -1;
    const nodos = () => {
      const o = {};
      color.forEach((c, v) => { if (c >= 0) o[v] = 'c' + c; });
      if (foco >= 0) o[foco] = (o[foco] || '') + ' foco';
      return o;
    };
    const foto = o => F.push(nuevaFoto(Object.assign({
      nodos: nodos(), aristas: Object.assign({}, aristas),
      filas: [
        { titulo: 'color', indices: true, celdas: color.map((c, i) => [String(c), (c >= 0 ? 'c' + c : 'f') + (i === nuevo ? ' nuevo' : '')]) },
        { titulo: 'fila', celdas: fila.map((v, i) => [String(v), i === 0 ? 'frente' : '']), contenedor: true }
      ],
      chips: [[`color 0: ${lista(color.map((c, v) => c === 0 ? v : -1).filter(v => v >= 0))}`, 'ci'],
              [`color 1: ${lista(color.map((c, v) => c === 1 ? v : -1).filter(v => v >= 0))}`, '']]
    }, o)));
    color[s] = 0; fila.push(s); nuevo = s;
    foto({ code: [0, 1, 2, 3], test: `color[${s}] = 0 · fila = [${s}]`,
      say: `color empieza en -1 para todos: sin colorear. El ${s} toma el color 0 y entra a la fila. Cada vecino recibirá el color contrario al de quien lo descubre.`,
      predice: `¿alcanzan dos colores para este grafo?` });
    nuevo = -1;
    let primera = true;
    while (fila.length) {
      const u = fila.shift();
      foco = u;
      foto({ code: [4, 5, 6], test: `u = ${u} · color[${u}] = ${color[u]}`,
        say: primera ? `Sale el ${u} de la fila. Ahora se revisan sus vecinos.` : `Sale el ${u}, que tiene color ${color[u]}.` });
      primera = false;
      for (const v of g.ady[u]) {
        const k = clave(g, u, v), antes = aristas[k];
        if (color[v] === -1) {
          color[v] = 1 - color[u]; fila.push(v); desde[v] = u; nuevo = v;
          aristas[k] = 'revisa';
          foto({ code: color[u] === 0 ? [7, 8, 9, 10, 14] : [7, 8, 9, 11, 12, 14], test: `color[${u}] es ${color[u]} → color[${v}] = ${color[v]}`,
            say: `El ${v} no tiene color. Toma el contrario al del ${u}, el ${color[v]}, y entra a la fila.` });
          aristas[k] = 'arbol'; nuevo = -1;
        } else if (color[v] !== color[u]) {
          aristas[k] = 'revisa';
          foto({ code: [7, 8, 15], test: `v = ${v} · color ${color[v]} ≠ ${color[u]}`,
            say: `El ${v} ya tiene color ${color[v]}, distinto al del ${u}. Esta arista une dos colores distintos, como debe ser.` });
          if (antes) aristas[k] = antes; else delete aristas[k];
        } else {
          aristas[k] = 'conflicto';
          const ciclo = cicloImpar(u, v, desde, s);
          foto({ code: [7, 8, 15, 16], test: `v = ${v} · color ${color[v]} = ${color[u]} → return false`,
            say: `El ${v} tiene el mismo color que el ${u}, el ${color[u]}, y están unidos por una arista. No hay forma de corregirlo: colorear devuelve false.` });
          foco = -1;
          ciclo.aristas.forEach(([a, b]) => { aristas[clave(g, a, b)] = 'ciclo'; });
          const fin = nuevaFoto(Object.assign({}, F[F.length - 1], {
            nodos: Object.assign(nodos(), Object.fromEntries(ciclo.vertices.map(x => [x, 'c' + color[x] + ' choque']))),
            aristas: Object.assign({}, aristas), code: -1,
            test: `ciclo ${ciclo.vertices.join('–')}–${ciclo.vertices[0]} · ${ciclo.vertices.length} aristas`,
            say: `El conflicto delata un ciclo impar: ${ciclo.vertices.join('–')}–${ciclo.vertices[0]}, de ${ciclo.vertices.length} aristas. Al recorrerlo, los colores alternan y la última arista une dos vértices del mismo color. Por eso el grafo no es bipartito, sin importar el vértice inicial.` }));
          F.push(fin);
          return F;
        }
      }
    }
    foco = -1;
    const A = color.map((c, v) => c === 0 ? v : -1).filter(v => v >= 0), B = color.map((c, v) => c === 1 ? v : -1).filter(v => v >= 0);
    foto({ code: 20, test: `return true · {${A.join(', ')}} y {${B.join(', ')}}`,
      say: `La fila se vació y ninguna arista une dos vértices del mismo color. El grafo es bipartito, con los bandos {${A.join(', ')}} y {${B.join(', ')}}: toda arista cruza de un bando al otro.` });
    return F;
  }
  // Ciclo impar a partir del árbol BFS: camino u → ancestro común ← v.
  function cicloImpar(u, v, desde) {
    const sube = x => { const c = [x]; while (desde[x] >= 0) { x = desde[x]; c.push(x); } return c; };
    const cu = sube(u), cv = sube(v);
    const comun = cu.find(x => cv.includes(x));
    const iu = cu.slice(0, cu.indexOf(comun) + 1), iv = cv.slice(0, cv.indexOf(comun)).reverse();
    const vertices = iu.concat(iv);
    const ar = [];
    for (let i = 0; i < vertices.length; i++) ar.push([vertices[i], vertices[(i + 1) % vertices.length]]);
    return { vertices, aristas: ar };
  }

  /* ---------- dfsLow: puntos de articulación ----------
     Líneas: 1-4 turno, disc, low, hijos · 5 for · 6 if disc 0 · 7 hijos · 8 llamada
             9 low = min(low, low[v]) · 10-11 corte · 13 else if · 14 low = min(low, disc[v]) · 17-18 raíz */
  function trazaDfsLow(g) {
    const n = g.n, s = g.inicio;
    const disc = Array(n).fill(0), low = Array(n).fill(0), corte = Array(n).fill(false);
    const llamadas = [], estado = {}, aristas = {};
    const F = [];
    let t = 0, nuevoD = -1, nuevoL = -1;
    const foto = o => {
      const nodos = {};
      for (let v = 0; v < n; v++) if (estado[v]) nodos[v] = estado[v] + (corte[v] ? ' corte' : '');
      F.push(nuevaFoto(Object.assign({
        nodos, aristas: Object.assign({}, aristas),
        pila: { titulo: 'pila de llamadas', items: llamadas.map((u, i) => [`dfsLow(${u})`, i === llamadas.length - 1 ? 'actual' : '']) },
        filas: [
          { titulo: 'disc', indices: true, celdas: disc.map((d, i) => [String(d), (d ? '' : 'f') + (i === nuevoD ? ' nuevo' : '')]) },
          { titulo: 'low', celdas: low.map((d, i) => [String(d), (d ? '' : 'f') + (i === nuevoL ? ' nuevo' : '')]) }
        ],
        chips: [[`t = ${t}`, 'ci'], [`corte: ${lista(corte.map((c, v) => c ? v : -1).filter(v => v >= 0))}`, 'cj']]
      }, o)));
      nuevoD = -1; nuevoL = -1;
    };
    foto({ code: 0, test: `dfsLow(${s}, -1)`,
      say: `disc[u] es el turno en que DFS descubre a u. low[u] es el turno más antiguo al que el subárbol de u puede regresar usando una arista que no es del árbol. Los dos arreglos empiezan en 0.`,
      predice: `¿qué vértices, si se quitan, desconectan el grafo?` });
    let primeraEntrada = true, primerRetro = true;
    function dfsLow(u, padre) {
      t = t + 1; disc[u] = t; low[u] = t; nuevoD = u; nuevoL = u;
      llamadas.push(u);
      if (padre >= 0) estado[padre] = 'activo';
      estado[u] = 'actual';
      foto({ code: [1, 2, 3, 4], test: `t = ${t} · disc[${u}] = low[${u}] = ${t}`,
        say: primeraEntrada
          ? `dfsLow(${u}) descubre al ${u} en el turno ${t}. Por ahora, lo más antiguo que alcanza es él mismo: low[${u}] = ${t}.`
          : `Entra dfsLow(${u}): el ${u} se descubre en el turno ${t}, y low[${u}] empieza igual.` });
      primeraEntrada = false;
      let hijos = 0;
      for (const v of g.ady[u]) {
        const k = clave(g, u, v);
        if (disc[v] === 0) {
          hijos = hijos + 1;
          aristas[k] = 'revisa';
          foto({ code: [5, 6, 7, 8], test: `v = ${v} · disc[${v}] = 0 → dfsLow(${v}, ${u})`,
            say: `El ${v} no se ha descubierto: será hijo del ${u} en el árbol DFS.` });
          aristas[k] = 'arbol';
          dfsLow(v, u);
          llamadas.pop();
          estado[v] = 'terminado'; estado[u] = 'actual';
          const antes = low[u];
          low[u] = Math.min(low[u], low[v]);
          if (low[u] !== antes) nuevoL = u;
          const raiz = padre === -1;
          const corta = !raiz && low[v] >= disc[u];
          if (corta) corte[u] = true;
          const cambio = low[u] !== antes ? `low[${u}] baja a ${low[u]}. ` : '';
          foto({ code: corta ? [9, 10, 11] : [9, 10],
            test: raiz
              ? `low[${u}] = min(${antes}, ${low[v]}) = ${low[u]} · padre == -1: la regla no aplica`
              : `low[${u}] = min(${antes}, ${low[v]}) = ${low[u]} · low[${v}] = ${low[v]} ${corta ? '≥' : '<'} disc[${u}] = ${disc[u]}`,
            say: raiz
              ? `dfsLow(${v}) terminó. ${cambio}El ${u} es la raíz (padre == -1), así que la regla de low no se le aplica: a la raíz nadie la descubrió antes, y la condición se cumpliría siempre. Se decide al final, con sus hijos.`
              : corta
                ? `dfsLow(${v}) terminó. ${cambio}El subárbol del ${v} no regresa más arriba del ${u} (low[${v}] = ${low[v]} ≥ disc[${u}] = ${disc[u]}). Si se quita el ${u}, ese subárbol queda aislado: el ${u} es punto de articulación.`
                : `dfsLow(${v}) terminó. ${cambio}El subárbol del ${v} regresa hasta el turno ${low[v]}, antes que el ${u}, por una arista de retroceso. Aunque se quite el ${u}, sigue conectado.` });
        } else if (v === padre) {
          const antes = aristas[k];
          aristas[k] = 'revisa';
          foto({ code: [5, 6, 13], test: `v = ${v} es el padre: se salta`,
            say: `El ${v} es el padre del ${u}. Esa arista es la del árbol y no cuenta como retroceso.` });
          aristas[k] = antes;
        } else {
          const antes = low[u];
          low[u] = Math.min(low[u], disc[v]);
          if (low[u] !== antes) nuevoL = u;
          const previa = aristas[k];
          if (previa !== 'arbol') aristas[k] = 'retro';
          foto({ code: [5, 6, 13, 14], test: `low[${u}] = min(${antes}, disc[${v}] = ${disc[v]}) = ${low[u]}`,
            say: (primerRetro
              ? `El ${v} ya se descubrió, en el turno ${disc[v]}, y no es el padre: esta es una arista de retroceso. `
              : `El ${v} ya se descubrió (turno ${disc[v]}) y no es el padre: arista de retroceso. `)
              + (low[u] < antes ? `Por ella el ${u} puede regresar al turno ${disc[v]}: low[${u}] baja a ${low[u]}.` : `low[${u}] ya era ${antes}; no cambia.`) });
          primerRetro = false;
        }
      }
      if (padre === -1) {
        if (hijos > 1) corte[u] = true;
        foto({ code: hijos > 1 ? [17, 18] : [17], test: `padre == -1 · hijos = ${hijos}` + (hijos > 1 ? ` → corte[${u}] = true` : ''),
          say: hijos > 1
            ? `La raíz tiene ${hijos} hijos en el árbol DFS: entre ellos no hay aristas, así que quitarla los separa. corte[${u}] = true.`
            : `La raíz tiene un solo hijo en el árbol DFS. Quitarla no separa a nadie, así que corte[${u}] se queda en false.` });
      }
    }
    dfsLow(s, -1);
    llamadas.pop();
    estado[s] = 'terminado';
    const cortes = corte.map((c, v) => c ? v : -1).filter(v => v >= 0);
    const puentes = [];
    g.aristas.forEach(([a, b]) => {
      const [p, h] = disc[a] < disc[b] ? [a, b] : [b, a];
      if (aristas[clave(g, a, b)] === 'arbol' && low[h] > disc[p]) { puentes.push(`${p}–${h}`); aristas[clave(g, a, b)] = 'puente'; }
    });
    foto({ code: -1, test: `corte: ${lista(cortes)} · puentes: ${lista(puentes)}`,
      say: (cortes.length
        ? `${cortes.length === 1 ? 'El punto de articulación es el' : 'Los puntos de articulación son'} ${y_(cortes)}: quitar ${cortes.length === 1 ? 'ese vértice' : 'cualquiera de ellos'} deja vértices sin camino al resto. `
        : `No hay puntos de articulación: ningún vértice, por sí solo, desconecta el grafo. `)
        + (puentes.length ? `${puentes.length === 1 ? 'La arista' : 'Las aristas'} ${y_(puentes)} ${puentes.length === 1 ? 'es puente: cumple' : 'son puentes: cumplen'} la misma regla en versión estricta, low[v] > disc[u].` : '') });
    return F;
  }

  /* ---------- union-find ----------
     Líneas: 0 find · 1-2 raíz · 4 raiz = find · 5 padre[x] = raiz · 6 return · 8 unir
             9 ra = find · 10 rb = find · 11-12 ra == rb · 14 if tam · 15-16 ra bajo rb · 17-19 rb bajo ra */
  function trazaUf(ds) {
    const n = Number(ds.n || 8);
    const ops = (ds.ops || '').split(',').filter(Boolean);
    const padre = Array.from({ length: n }, (_, i) => i), tam = Array(n).fill(1);
    const F = [];
    let foco = [], marcas = {}, nuevoP = -1, nuevoT = -1, nodosExtra = {};
    const raices = () => padre.map((p, i) => p === i ? i : -1).filter(i => i >= 0);
    const altura = () => Math.max(...padre.map((_, i) => { let h = 0, x = i; while (padre[x] !== x) { x = padre[x]; h++; } return h; }));
    const foto = o => {
      const nodos = {};
      for (let v = 0; v < n; v++) nodos[v] = padre[v] === v ? 'rep' : '';
      foco.forEach(v => { nodos[v] = (nodos[v] + ' foco').trim(); });
      Object.assign(nodos, nodosExtra);
      F.push(nuevaFoto(Object.assign({
        padre: padre.slice(), nodos, aristas: Object.assign({}, marcas),
        filas: [
          { titulo: 'padre', indices: true, celdas: padre.map((p, i) => [String(p), (p === i ? 'si' : '') + (i === nuevoP ? ' nuevo' : '')]) },
          { titulo: 'tam', celdas: tam.map((t, i) => [String(t), (padre[i] === i ? '' : 'f') + (i === nuevoT ? ' nuevo' : '')]) }
        ],
        chips: [[`conjuntos: ${raices().length}`, 'ci'], [`altura máxima: ${altura()}`, 'cok']]
      }, o)));
      nuevoP = -1; nuevoT = -1;
    };
    foto({ code: -1, test: `init(${n})`,
      say: `init(${n}) deja a cada vértice como su propio padre: ${n} conjuntos de tamaño 1. Una flecha va de un vértice a su padre, y el que es su propio padre es el representante del conjunto.`,
      predice: `después de unir los ${n} vértices, ¿qué tan alto puede quedar el árbol?` });
    const camino = x => { const c = [x]; while (padre[x] !== x) { x = padre[x]; c.push(x); } return c; };
    // find con compresión: 1 paso si no hay nada que comprimir, 2 si sí.
    function find(x, lineas) {
      const c = camino(x), r = c[c.length - 1];
      if (c.length <= 2) return { r, trivial: true, c };
      foco = [x];
      marcas = {};
      for (let i = 0; i + 1 < c.length; i++) marcas[`${c[i]}>${c[i + 1]}`] = 'sube';
      foto({ code: [0, 1, 4].concat(lineas), test: `find(${x}): ${c.join(' → ')}`,
        say: `find(${x}) sube de padre en padre: ${c.join(' → ')}. El ${r} es su propio padre, así que es el representante.` });
      const cambiados = c.slice(0, -2);
      cambiados.forEach(v => { padre[v] = r; });
      marcas = {};
      cambiados.forEach(v => { marcas[`${v}>${r}`] = 'nuevo'; });
      nuevoP = cambiados[0];
      foto({ code: [4, 5, 6].concat(lineas), test: `compresión: padre[${cambiados.join('] = padre[')}] = ${r}`,
        say: `Al regresar de la recursión, ${cambiados.length === 1 ? `el ${cambiados[0]} queda apuntando` : `los vértices ${y_(cambiados)} quedan apuntando`} directo al ${r}. La próxima vez, find(${x}) llega en un paso.` });
      marcas = {};
      return { r, trivial: false, c };
    }
    let primeraUnion = true;
    ops.forEach(op => {
      if (op[0] === 'f') {
        const x = Number(op.slice(1));
        const res = find(x, []);
        if (res.trivial) {
          foco = [x];
          foto({ code: res.c.length === 1 ? [0, 1, 2] : [0, 1, 4, 5, 6], test: `find(${x}) = ${res.r}`, say: `find(${x}) llega al representante, el ${res.r}, en ${res.c.length - 1} paso${res.c.length === 2 ? '' : 's'}.` });
        }
        foco = [];
        return;
      }
      const [a0, b0] = op.split('-').map(Number);
      const ca = camino(a0), cb = camino(b0);
      let ra, rb;
      if (ca.length <= 2 && cb.length <= 2) {
        ra = ca[ca.length - 1]; rb = cb[cb.length - 1];
        foco = [a0, b0];
        foto({ code: [8, 9, 10], test: `unir(${a0}, ${b0}) · find(${a0}) = ${ra} · find(${b0}) = ${rb}`,
          say: primeraUnion
            ? `unir(${a0}, ${b0}) busca primero los representantes de los dos: el ${ra} y el ${rb}.`
            : `unir(${a0}, ${b0}): los representantes son el ${ra} y el ${rb}.` });
      } else {
        ra = find(a0, [8, 9]).r;
        rb = find(b0, [8, 10]).r;
        foco = [a0, b0];
      }
      primeraUnion = false;
      if (ra === rb) {
        foto({ code: [11, 12], test: `ra == rb → return`, say: `Los dos tienen el mismo representante: ya estaban en el mismo conjunto y no hay nada que unir.` });
        foco = [];
        return;
      }
      let A = ra, B = rb;
      const iguales = tam[A] === tam[B];
      const invertido = tam[A] < tam[B];
      if (invertido) { A = rb; B = ra; }
      padre[B] = A; tam[A] = tam[A] + tam[B];
      nuevoP = B; nuevoT = A;
      foco = [];
      marcas = { [`${B}>${A}`]: 'nuevo' };
      foto({ code: invertido ? [14, 15, 16] : [14, 17, 18, 19], test: `padre[${B}] = ${A} · tam[${A}] = ${tam[A]}`,
        say: iguales
          ? `Los dos conjuntos tienen tamaño ${tam[A] / 2}. Con tamaños iguales, el representante del segundo cuelga del primero: padre[${B}] = ${A}, y el conjunto del ${A} crece a ${tam[A]}.`
          : `El conjunto del ${B} tiene ${tam[B]} ${tam[B] === 1 ? 'vértice' : 'vértices'} y el del ${A} tiene ${tam[A] - tam[B]}. El chico cuelga del grande: padre[${B}] = ${A}. Así la altura crece lo menos posible.` });
      marcas = {};
    });
    foto({ code: -1, test: `${raices().length} conjunto${raices().length === 1 ? '' : 's'} · altura máxima ${altura()}`,
      say: `${raices().length === 1 ? `Los ${n} vértices quedaron en un solo conjunto` : `Quedaron ${raices().length} conjuntos`}, y el camino más largo hasta un representante tiene ${altura()} ${altura() === 1 ? 'arista' : 'aristas'}. La unión por tamaño evita árboles altos y la compresión los aplana cada vez que alguien los recorre.` });
    return F;
  }

  function trazar(alg, ds) {
    switch (alg) {
      case 'colorear': return trazaColorear(leerGrafo(ds));
      case 'dfsLow': return trazaDfsLow(leerGrafo(ds));
      case 'uf': return trazaUf(ds);
    }
    throw new Error('sim-avanzados: algoritmo desconocido ' + alg);
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
      .replace(/\b(int|bool|void|while|for|if|else|return|true|false)\b/g, '\u0001$1\u0002')
      .replace(/\b(colorear|dfsLow|find|unir|swap|min|push|pop|front|empty|assign)\b(?=\()/g, '\u0003$1\u0002')
      .replace(/(?<![\w#])(-?\d+)\b/g, '\u0004$1\u0002')
      .replace(/\u0001/g, '<span class="kw">').replace(/\u0003/g, '<span class="fn">')
      .replace(/\u0004/g, '<span class="num">').replace(/\u0002/g, '</span>') + cm;
  }
  function barraNueva() {
    const barra = document.createElement('div');
    barra.className = 'sim-barra sr-barra';
    barra.innerHTML =
      '<span class="sim-chip"></span><span class="sim-chip"></span>' +
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

  let uid = 0;
  const R = 21;
  // Flechas: un marcador por estado de arista, con id único por simulación.
  function definirFlechas(svg, id) {
    const defs = el('defs', {});
    ['base', 'sube', 'nuevo'].forEach(c => {
      const m = el('marker', { id: `${id}-${c}`, markerWidth: 10, markerHeight: 10, refX: 8, refY: 4, orient: 'auto', markerUnits: 'userSpaceOnUse' });
      m.appendChild(el('path', { d: 'M0,0 L9,4 L0,8 z', class: 'sr-punta ' + c }));
      defs.appendChild(m);
    });
    svg.appendChild(defs);
  }
  // No dirigido: cada capa es un renglón. Dirigido: cada capa es una
  // columna y las flechas corren de izquierda a derecha.
  function posiciones(g, x0, y0, W, H) {
    const pos = [];
    const L = g.capas.length;
    if (g.dirigido) {
      const dx = L > 1 ? (W - 2 * R - 30) / (L - 1) : 0;
      g.capas.forEach((capa, c) => capa.forEach((v, i) => {
        if (v !== null) pos[v] = { x: x0 + R + 4 + c * dx, y: y0 + (i + 0.5) * H / capa.length, c };
      }));
      return pos;
    }
    const dy = L > 1 ? (H - 2 * R) / (L - 1) : 0;
    g.capas.forEach((capa, r) => capa.forEach((v, i) => {
      pos[v] = { x: x0 + (i + 0.5) * W / capa.length, y: y0 + R + r * dy };
    }));
    return pos;
  }
  function dibujarGrafo(capa, f, g, x0, y0, W, H, id) {
    const pos = posiciones(g, x0, y0, W, H);
    g.aristas.forEach(([u, v]) => {
      const m = f.aristas[clave(g, u, v)] || '';
      const a = pos[u], b = pos[v];
      const attrs = { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'sr-arista' + (m ? ' ' + m : '') };
      if (g.dirigido && b.c <= a.c) {
        // Flecha de regreso: arco por arriba para no cruzar los vértices
        const cy = Math.min(a.y, b.y) - 95, mx = (a.x + b.x) / 2;
        const ang1 = Math.atan2(cy - a.y, mx - a.x), ang2 = Math.atan2(b.y - cy, b.x - mx);
        const sx = a.x + Math.cos(ang1) * R, sy = a.y + Math.sin(ang1) * R;
        const ex = b.x - Math.cos(ang2) * (R + 3), ey = b.y - Math.sin(ang2) * (R + 3);
        capa.appendChild(el('path', { d: `M ${sx} ${sy} Q ${mx} ${cy} ${ex} ${ey}`, class: 'sr-arista curva' + (m ? ' ' + m : ''), 'marker-end': `url(#${id}-${m || 'base'})` }));
        return;
      }
      if (g.dirigido) {
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
        attrs.x1 = a.x + dx / L * R; attrs.y1 = a.y + dy / L * R;
        attrs.x2 = b.x - dx / L * (R + 3); attrs.y2 = b.y - dy / L * (R + 3);
        attrs['marker-end'] = `url(#${id}-${m || 'base'})`;
      }
      capa.appendChild(el('line', attrs));
    });
    for (let v = 0; v < g.n; v++) {
      const p = pos[v];
      const gg = el('g', { class: 'sr-nodo' + (f.nodos[v] ? ' ' + f.nodos[v] : '') });
      if (/\b(foco|choque|corte)\b/.test(f.nodos[v] || '')) gg.appendChild(el('circle', { cx: p.x, cy: p.y, r: R + 7, class: 'sa-halo' }));
      gg.appendChild(el('circle', { cx: p.x, cy: p.y, r: R }));
      gg.appendChild(el('text', { x: p.x, y: p.y + 7, class: 'sr-dato' }, v));
      capa.appendChild(gg);
      const b = f.badges[v];
      if (b) {
        const bg = el('g', { class: 'sr-badge' + (b[1] ? ' ' + b[1] : '') });
        bg.appendChild(el('rect', { x: p.x + R - 6, y: p.y - R - 12, width: 26, height: 22, rx: 11 }));
        bg.appendChild(el('text', { x: p.x + R + 7, y: p.y - R + 4, class: 'sr-bval' }, b[0]));
        capa.appendChild(bg);
      }
    }
  }
  // Renglón de casillas: un arreglo (con índices arriba) o un contenedor.
  const CW = 40, CH = 34;
  function altoFila(fila) { return fila.indices ? 64 : 46; }
  function dibujarFila(capa, fila, x0, y) {
    const yc = y + (fila.indices ? 18 : 2);
    capa.appendChild(el('text', { x: x0, y: yc + CH * 0.7, class: 'sr-etq' }, fila.titulo));
    const xc = x0 + 98;
    fila.celdas.forEach(([t, cls], i) => {
      const x = xc + i * (CW + 4);
      if (fila.indices) capa.appendChild(el('text', { x: x + CW / 2, y: y + 12, class: 'sr-ind' }, i));
      const gg = el('g', { class: 'sr-celda' + (cls ? ' ' + cls : '') });
      gg.appendChild(el('rect', { x, y: yc, width: CW, height: CH, rx: 5 }));
      gg.appendChild(el('text', { x: x + CW / 2, y: yc + CH * 0.7, class: 'sr-val' }, t));
      capa.appendChild(gg);
    });
    if (fila.contenedor && !fila.celdas.length) {
      capa.appendChild(el('rect', { x: xc, y: yc, width: 3 * CW, height: CH, rx: 5, class: 'sr-vacia' }));
      capa.appendChild(el('text', { x: xc + 1.5 * CW, y: yc + CH * 0.7, class: 'sr-vacia-t' }, 'vacía'));
    }
  }
  // Pila vertical: el fondo abajo, el tope arriba.
  function dibujarPila(capa, pila, x, yBase, w) {
    capa.appendChild(el('text', { x: x + w / 2, y: 22, class: 'sr-titulo' }, pila.titulo));
    capa.appendChild(el('line', { x1: x - 6, y1: yBase + 3, x2: x + w + 6, y2: yBase + 3, class: 'sr-piso' }));
    pila.items.forEach(([t, cls], i) => {
      const y = yBase - (i + 1) * (CH + 4);
      const gg = el('g', { class: 'sr-celda' + (cls ? ' ' + cls : '') });
      gg.appendChild(el('rect', { x, y, width: w, height: CH, rx: 5 }));
      gg.appendChild(el('text', { x: x + w / 2, y: y + CH * 0.7, class: 'sr-val' }, t));
      capa.appendChild(gg);
      if (i === pila.items.length - 1) capa.appendChild(el('text', { x: x + w + 8, y: y + CH * 0.7, class: 'sr-tope' }, '← top'));
    });
    if (!pila.items.length) capa.appendChild(el('text', { x: x + w / 2, y: yBase - 12, class: 'sr-vacia-t' }, 'vacía'));
  }

  // Bosque del union-find: cada árbol bajo su representante, flechas
  // del hijo al padre.
  function dibujarBosque(capa, f, x0, y0, W, H, id) {
    const n = f.padre.length;
    const hijos = Array.from({ length: n }, () => []);
    f.padre.forEach((p, i) => { if (p !== i) hijos[p].push(i); });
    const ancho = v => Math.max(1, hijos[v].reduce((a, h) => a + ancho(h), 0));
    const raices = f.padre.map((p, i) => p === i ? i : -1).filter(i => i >= 0);
    const U = raices.reduce((a, r) => a + ancho(r), 0);
    const u = Math.min(64, W / U);
    const dy = 56;
    const pos = [];
    const colocar = (v, x, d) => {
      const w = ancho(v);
      pos[v] = { x: x + w * u / 2, y: y0 + R + d * dy };
      let xx = x;
      hijos[v].forEach(h => { colocar(h, xx, d + 1); xx += ancho(h) * u; });
    };
    let x = x0 + (W - U * u) / 2;
    raices.forEach(r => { colocar(r, x, 0); x += ancho(r) * u; });
    for (let v = 0; v < n; v++) {
      const p = f.padre[v];
      if (p === v) continue;
      const a = pos[v], b = pos[p];
      const m = f.aristas[`${v}>${p}`] || '';
      const dx = b.x - a.x, dyy = b.y - a.y, L = Math.hypot(dx, dyy);
      capa.appendChild(el('line', { x1: a.x + dx / L * R, y1: a.y + dyy / L * R, x2: b.x - dx / L * (R + 3), y2: b.y - dyy / L * (R + 3),
        class: 'sr-arista sa-padre' + (m ? ' ' + m : ''), 'marker-end': `url(#${id}-${m || 'base'})` }));
    }
    // Flechas del camino que ya no existen tras la compresión no se dibujan;
    // las marcas "sube" se pintan sobre las flechas actuales.
    for (let v = 0; v < n; v++) {
      const p = pos[v];
      const gg = el('g', { class: 'sr-nodo' + (f.nodos[v] ? ' ' + f.nodos[v] : '') });
      if (/\bfoco\b/.test(f.nodos[v] || '')) gg.appendChild(el('circle', { cx: p.x, cy: p.y, r: R + 7, class: 'sa-halo' }));
      gg.appendChild(el('circle', { cx: p.x, cy: p.y, r: R }));
      gg.appendChild(el('text', { x: p.x, y: p.y + 7, class: 'sr-dato' }, v));
      capa.appendChild(gg);
    }
  }

  // Código a la izquierda; dibujo, estructuras, explicación y barra a la derecha.
  function construirCodigo(cont, F, g, alg) {
    const cuerpo = document.createElement('div');
    cuerpo.className = 'sr-cuerpo';
    const izq = document.createElement('div');
    izq.className = 'sr-izq';
    const pre = document.createElement('pre');
    pre.className = 'sim-codigo sr-codigo';
    pre.innerHTML = CODIGO[alg].split('\n').map(l => `<div class="sim-linea">${pintarCodigo(l) || ' '}</div>`).join('');
    izq.appendChild(pre);
    const der = document.createElement('div');
    der.className = 'sr-der';
    const conPila = !!F[0].pila;
    const W = 500, GH = conPila ? 210 : 190;
    const altoFilas = F[0].filas.reduce((a, fl) => a + altoFila(fl), 0);
    const H = GH + 14 + altoFilas;
    const id = 'sa' + (++uid);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sr-svg' });
    definirFlechas(svg, id);
    const capa = el('g', {});
    svg.appendChild(capa);
    der.appendChild(svg);
    const dice = document.createElement('p');
    dice.className = 'sim-dice sr-dice';
    der.appendChild(dice);
    const barra = barraNueva();
    der.appendChild(barra);
    cuerpo.appendChild(izq); cuerpo.appendChild(der);
    cont.appendChild(cuerpo);
    const lineas = [...pre.querySelectorAll('.sim-linea')];
    const GW = conPila ? 322 : W;
    return function pintar(k) {
      k = Math.max(0, Math.min(k, F.length - 1));
      const f = F[k];
      capa.innerHTML = '';
      if (f.padre) dibujarBosque(capa, f, 0, 10, W, GH - 10, id);
      else dibujarGrafo(capa, f, g, 0, 8, GW, GH - 8, id);
      if (f.pila) dibujarPila(capa, f.pila, 330, GH, 110);
      let y = GH + 14;
      f.filas.forEach(fl => { dibujarFila(capa, fl, 0, y); y += altoFila(fl); });
      const act = Array.isArray(f.code) ? f.code : [f.code];
      lineas.forEach((l, i) => l.classList.toggle('on', act.includes(i)));
      dice.innerHTML = dicho(f);
      pintarBarra(barra, f, k, F.length);
    };
  }

  function construir(cont) {
    const alg = cont.dataset.alg;
    const F = trazar(alg, cont.dataset);
    const g = alg === 'uf' ? null : leerGrafo(cont.dataset);
    cont.innerHTML = '';
    // Reutiliza la maqueta y los estilos de sim-recorridos.css
    cont.classList.add('sim-recorridos', 'sa-' + alg);
    const pintar = construirCodigo(cont, F, g, alg);
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
    slide.querySelectorAll('.sim-avanzados').forEach(cont => {
      if (!cont._simPintar) return;
      const vistos = cont.querySelectorAll('.sim-fragments .fragment.visible').length;
      cont._simPintar(vistos);
      const b = cont.querySelectorAll('.sim-ctrl button');
      if (b[0]) b[0].disabled = vistos === 0;
      if (b[1]) b[1].disabled = vistos >= cont._simTotal - 1;
    });
  }

  function init() {
    const sims = document.querySelectorAll('.sim-avanzados');
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

if (typeof module !== 'undefined') module.exports = SimAvanzados;
