/* ============================================================
   SIM-RECORRIDOS — DFS, BFS y orden topológico paso a paso
   Requiere Reveal.js 5.x y curso-slides.js. Incluir después de
   curso-slides.js y llamar, tras CursoSlides.init(...):

       SimRecorridos.init();

   Uso en HTML:

     <div class="sim-recorridos" data-alg="bfs" data-n="6"
          data-aristas="0-1,0-2,1-3,1-4,2-5,4-5"
          data-capas="0|1,2|3,4,5" data-inicio="0"></div>

   data-alg:
     dfs       DFS recursivo, línea por línea, con la pila de llamadas
     dfsIter   DFS con std::stack, una vuelta del while por paso
     bfs       BFS con dist y la fila, línea por línea
     gemelos   el mismo recorrido con std::queue y con std::stack,
               lado a lado; una vuelta del while por paso
     kahn      algoritmo de Kahn con grados de entrada y fila de listos
     dfsTopo   orden topológico por DFS: estados NUEVO, ABIERTO y CERRADO,
               lista de terminados y detección de ciclos (grafo dirigido)
   data-aristas: pares u-v (no dirigido) o u>v (dirigido), en el
   orden en que se agregan; ese orden fija el de cada lista ady[u].
   data-capas: vértices por renglón del dibujo, de arriba abajo; en un
   grafo dirigido, por columna, de izquierda a derecha. «_» deja un hueco.

   Los pasos salen de ejecutar el código sobre el grafo: cambiar
   data-aristas o data-inicio cambia el trazado. Un paso = un
   fragment del slide. El código (CODIGO, abajo) se genera desde la
   misma fuente que los bloques de código del deck.
   ============================================================ */

const SimRecorridos = (() => {

  const CODIGO = {
      "dfs": "void dfs(int u) {\n    visitado[u] = true;\n    visita(u);\n    for (int v : ady[u]) {\n        if (!visitado[v]) {\n            dfs(v);\n        }\n    }\n}",
      "dfsIter": "void dfsIter(int inicio) {\n    std::stack<int> pila;\n    pila.push(inicio);\n    while (!pila.empty()) {\n        int u = pila.top();\n        pila.pop();\n        if (!visitado[u]) {\n            visitado[u] = true;\n            visita(u);\n            for (int v : ady[u]) {\n                if (!visitado[v]) {\n                    pila.push(v);\n                }\n            }\n        }\n    }\n}",
      "bfs": "std::vector<int> bfs(int inicio) {\n    std::vector<int> dist(n, -1);\n    std::queue<int> fila;\n    dist[inicio] = 0;\n    fila.push(inicio);\n    while (!fila.empty()) {\n        int u = fila.front();\n        fila.pop();\n        for (int v : ady[u]) {\n            if (dist[v] == -1) {\n                dist[v] = dist[u] + 1;\n                fila.push(v);\n            }\n        }\n    }\n    return dist;\n}",
      "grados": "std::vector<int> gradosEntrada() {\n    std::vector<int> ge(n, 0);\n    for (int u = 0; u < n; u++) {\n        for (int v : ady[u]) {\n            ge[v] = ge[v] + 1;\n        }\n    }\n    return ge;\n}",
      "kahn": "std::vector<int> kahn() {\n    std::vector<int> ge = gradosEntrada();\n    std::queue<int> listos;\n    for (int u = 0; u < n; u++) {\n        if (ge[u] == 0) {\n            listos.push(u);\n        }\n    }\n    std::vector<int> orden;\n    while (!listos.empty()) {\n        int u = listos.front();\n        listos.pop();\n        orden.push_back(u);\n        for (int v : ady[u]) {\n            ge[v] = ge[v] - 1;\n            if (ge[v] == 0) {\n                listos.push(v);\n            }\n        }\n    }\n    return orden;\n}",
      "dfsTopo": "void dfsTopo(int u) {\n    estado[u] = ABIERTO;\n    for (int v : ady[u]) {\n        if (estado[v] == NUEVO) {\n            dfsTopo(v);\n        } else if (estado[v] == ABIERTO) {\n            hayCiclo = true;\n        }\n    }\n    estado[u] = CERRADO;\n    terminados.push_back(u);\n}"
  };

  function leerGrafo(ds) {
    const n = Number(ds.n || 6);
    const txt = ds.aristas || '';
    const dirigido = txt.includes('>');
    const aristas = txt.split(',').filter(Boolean).map(s => s.split(/[->]/).map(Number));
    const ady = Array.from({ length: n }, () => []);
    aristas.forEach(([u, v]) => { ady[u].push(v); if (!dirigido) ady[v].push(u); });
    const capas = ds.capas ? ds.capas.split('|').map(c => c.split(',').map(x => x === '_' ? null : Number(x)))
                           : [Array.from({ length: n }, (_, i) => i)];
    return { n, aristas, dirigido, ady, capas, inicio: Number(ds.inicio || 0) };
  }
  const clave = (g, u, v) => g.dirigido ? `${u}>${v}` : `${Math.min(u, v)}-${Math.max(u, v)}`;
  const lista = xs => xs.length ? xs.join(', ') : '—';
  const y_ = xs => xs.length < 2 ? lista(xs) : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1];
  // «el 4» o «los vértices 1, 2 y 3», con mayúscula opcional
  const losV = (xs, may) => { const s = xs.length === 1 ? `el ${xs[0]}` : `los vértices ${y_(xs)}`; return may ? s[0].toUpperCase() + s.slice(1) : s; };

  /* Una foto guarda lo que se dibuja:
       nodos:   { v: clase }               estado de cada vértice
       badges:  { v: [texto, clase] }      etiqueta junto al vértice
       aristas: { clave: clase }
       pila:    { titulo, items: [[texto, clase]] }   de abajo arriba
       filas:   [{ titulo, celdas: [[texto, clase]], indices }] */
  function nuevaFoto(o) {
    return Object.assign({ nodos: {}, badges: {}, aristas: {}, pila: null, filas: [],
      chips: [], code: -1, test: '', say: '', predice: '' }, o);
  }

  /* ---------- DFS recursivo ----------
     Líneas: 0 firma · 1 visitado = true · 2 visita · 3 for · 4 if · 5 dfs(v) · 8 } */
  function trazaDfs(g) {
    const n = g.n, s = g.inicio;
    const vis = Array(n).fill(false), orden = [], llamadas = [], prof = Array(n).fill(-1);
    const nodos = {}, aristas = {};
    const F = [];
    let nuevo = -1;
    const foto = o => F.push(nuevaFoto(Object.assign({
      nodos: Object.assign({}, nodos), aristas: Object.assign({}, aristas),
      pila: { titulo: 'pila de llamadas', items: llamadas.map((u, i) => [`dfs(${u})`, i === llamadas.length - 1 ? 'actual' : '']) },
      filas: [{ titulo: 'visitado', indices: true, celdas: vis.map((b, i) => [b ? 'T' : 'F', (b ? 'si' : 'f') + (i === nuevo ? ' nuevo' : '')]) }],
      chips: [[`orden: ${lista(orden)}`, 'ci'], [`llamadas abiertas: ${llamadas.length}`, 'cok']]
    }, o)));
    foto({ code: 0, test: `dfs(${s})`,
      say: `Se llama dfs(${s}). Cada llamada tiene su propio u, y las que se quedan esperando forman la pila de llamadas del programa. visitado empieza en false (F) para todos.`,
      predice: `¿en qué orden visitará DFS los ${n} vértices?` });
    let primeraVuelta = true;
    function dfs(u, padre) {
      vis[u] = true; orden.push(u); llamadas.push(u); prof[u] = llamadas.length - 1;
      nodos[u] = 'actual'; nuevo = u;
      foto({ code: [1, 2], test: `visitado[${u}] = true · visita(${u})`,
        say: u === s
          ? `dfs(${u}) marca al ${u} como visitado antes de revisar a sus vecinos. Así, si un ciclo lo trae de vuelta, el if lo detiene.`
          : `Entra dfs(${u}): marca al ${u} y lo visita.` });
      nuevo = -1;
      for (const v of g.ady[u]) {
        const k = clave(g, u, v), antes = aristas[k];
        aristas[k] = 'revisa';
        if (vis[v]) {
          foto({ code: [3, 4], test: `v = ${v} · visitado[${v}] es true`,
            say: v === padre
              ? `El ${v} es de donde llegó el ${u}. Ya está visitado y se salta.`
              : `El ${v} ya está visitado y no es de donde llegó el ${u}, así que esta arista cierra un ciclo. La marca evita volver a entrar.` });
          if (antes) aristas[k] = antes; else delete aristas[k];
        } else {
          foto({ code: [3, 4, 5], test: `v = ${v} · visitado[${v}] es false → dfs(${v})`,
            say: primeraVuelta
              ? `El ${v} no está visitado. dfs(${u}) se queda esperando a la mitad de su for y llama a dfs(${v}); el control baja un nivel.`
              : `El ${v} no está visitado: dfs(${u}) llama a dfs(${v}).` });
          primeraVuelta = false;
          aristas[k] = 'arbol';
          nodos[u] = 'activo';
          dfs(v, u);
          nodos[u] = 'actual';
        }
      }
      llamadas.pop();
      nodos[u] = 'terminado';
      if (padre >= 0) nodos[padre] = 'actual';
      foto({ code: 8, test: `dfs(${u}) termina`,
        say: padre >= 0
          ? `Ya no quedan vecinos del ${u} por revisar. dfs(${u}) termina y el control regresa a dfs(${padre}), que sigue con su siguiente vecino.`
          : `dfs(${u}) termina y con ella el recorrido: la pila de llamadas quedó vacía.` });
    }
    dfs(s, -1);
    // Un vecino directo del inicio al que DFS llegó por un camino largo
    const lejos = g.ady[s].filter(v => prof[v] > 1).sort((a, b) => prof[b] - prof[a])[0];
    F.push(nuevaFoto(Object.assign({}, F[F.length - 1], { code: -1, test: `orden de visita: ${lista(orden)}`,
      say: lejos !== undefined
        ? `DFS visitó ${y_(orden)}. Llegó al ${lejos} por un camino de ${prof[lejos]} aristas, aunque el ${lejos} es vecino directo del ${s}. DFS alcanza todo lo que está conectado, pero no mide distancias.`
        : `DFS visitó ${y_(orden)}: se hunde por un camino hasta el fondo y solo entonces retrocede.` })));
    return F;
  }

  function ordenRecursivo(g) {
    const vis = Array(g.n).fill(false), orden = [];
    const dfs = u => { vis[u] = true; orden.push(u); g.ady[u].forEach(v => { if (!vis[v]) dfs(v); }); };
    dfs(g.inicio);
    return orden;
  }

  /* ---------- DFS iterativo ----------
     Líneas: 1-2 pila y push · 3 while · 4 top · 5 pop · 6 if · 7 marca · 8 visita · 9-11 for/if/push */
  function trazaDfsIter(g) {
    const n = g.n, s = g.inicio;
    const vis = Array(n).fill(false), orden = [], pila = [s];
    const nodos = { [s]: 'pendiente' }, F = [];
    let aristas = {}, nuevo = -1;
    const foto = o => {
      const cuenta = {};
      pila.forEach(v => { cuenta[v] = (cuenta[v] || 0) + 1; });
      F.push(nuevaFoto(Object.assign({
        nodos: Object.assign({}, nodos), aristas: Object.assign({}, aristas),
        pila: { titulo: 'pila', items: pila.map(v => [String(v), vis[v] || cuenta[v] > 1 ? 'dup' : '']) },
        filas: [{ titulo: 'visitado', indices: true, celdas: vis.map((b, i) => [b ? 'T' : 'F', (b ? 'si' : 'f') + (i === nuevo ? ' nuevo' : '')]) }],
        chips: [[`orden: ${lista(orden)}`, 'ci'], [`en la pila: ${pila.length}`, 'cok']]
      }, o)));
    };
    foto({ code: [1, 2], test: `pila = [${s}]`,
      say: `Aquí no hay recursión: los pendientes van en un std::stack que el programa maneja a mano. Empieza con el vértice ${s}.`,
      predice: `¿saldrá el mismo orden que en la versión recursiva?` });
    let primera = true;
    while (pila.length) {
      const u = pila.pop();
      nodos[u] = 'actual';
      if (vis[u]) {
        foto({ code: [3, 4, 5, 6], test: `u = ${u} · visitado[${u}] es true`,
          say: `Sale el ${u}, pero ya está visitado: entró a la pila dos veces, desde dos vecinos distintos, antes de procesarse. El if lo descarta.` });
        nodos[u] = 'visitado';
        continue;
      }
      foto({ code: [3, 4, 5, 6], test: `u = ${u} · visitado[${u}] es false`,
        say: primera ? `top() lee el ${u} y pop() lo quita. Todavía no está visitado, así que se procesa.`
                     : `Sale el ${u}, el último que entró. No está visitado.` });
      primera = false;
      vis[u] = true; orden.push(u); nuevo = u;
      const apilados = [], repetidos = [];
      for (const v of g.ady[u]) if (!vis[v]) {
        if (pila.includes(v)) repetidos.push(v);
        pila.push(v); apilados.push(v);
        aristas[clave(g, u, v)] = 'revisa';
        if (nodos[v] !== 'actual') nodos[v] = 'pendiente';
      }
      let say = apilados.length
        ? (apilados.length === 1
          ? `Se marca y se visita el ${u}. Su único vecino sin visitar, el ${apilados[0]}, entra a la pila y será el próximo en salir.`
          : `Se marca y se visita el ${u}. Sus vecinos sin visitar, ${y_(apilados)}, entran a la pila en ese orden; el último en entrar será el próximo en salir.`)
        : `Se marca y se visita el ${u}. Todos sus vecinos ya están visitados, así que no apila nada.`;
      if (repetidos.length) {
        say += ` ${losV(repetidos, true)} ya ${repetidos.length === 1 ? 'estaba' : 'estaban'} en la pila y ${repetidos.length === 1 ? 'entra' : 'entran'} otra vez: push no revisa duplicados.`;
      }
      foto({ code: [7, 8, 9, 10, 11], test: `visita(${u}) · push: ${lista(apilados)}`, say });
      aristas = {}; nuevo = -1;
      nodos[u] = 'visitado';
    }
    const rec = ordenRecursivo(g);
    foto({ code: 3, test: `pila vacía · orden: ${lista(orden)}`,
      say: rec.join() !== orden.join()
        ? `La pila quedó vacía. El orden, ${y_(orden)}, no es el de la versión recursiva (${lista(rec)}): la pila saca primero al último vecino que entró. Los dos son recorridos en profundidad válidos.`
        : `La pila quedó vacía. El orden, ${y_(orden)}, coincide con el de la versión recursiva en este grafo.` });
    return F;
  }

  /* ---------- BFS ----------
     Líneas: 1-4 inicio · 5 while · 6 front · 7 pop · 8 for · 9 if · 10 dist · 11 push · 15 return */
  function trazaBfs(g) {
    const n = g.n, s = g.inicio;
    const dist = Array(n).fill(-1), fila = [];
    const nodos = {}, F = [];
    let aristas = {}, nuevo = -1;
    const foto = o => F.push(nuevaFoto(Object.assign({
      nodos: Object.assign({}, nodos), aristas: Object.assign({}, aristas),
      badges: Object.fromEntries(dist.map((d, i) => [i, d >= 0 ? [String(d), i === nuevo ? 'nuevo' : ''] : null]).filter(x => x[1])),
      filas: [
        { titulo: 'dist', indices: true, celdas: dist.map((d, i) => [String(d), (d >= 0 ? 'si' : 'f') + (i === nuevo ? ' nuevo' : '')]) },
        { titulo: 'fila', celdas: fila.map((v, i) => [String(v), i === 0 ? 'frente' : '']), contenedor: 'fila' }
      ],
      chips: [[`en la fila: ${fila.length}`, 'ci']]
    }, o)));
    dist[s] = 0; fila.push(s); nodos[s] = 'pendiente'; nuevo = s;
    foto({ code: [1, 2, 3, 4], test: `dist[${s}] = 0 · fila = [${s}]`,
      say: `dist empieza en -1 para todos, y -1 significa «no descubierto». El origen queda a distancia 0 y es el primero en la fila.`,
      predice: `¿en qué orden saldrán los vértices de la fila?` });
    nuevo = -1;
    let primera = true;
    while (fila.length) {
      const u = fila.shift();
      nodos[u] = 'actual';
      foto({ code: [5, 6, 7], test: `u = ${u} · dist[${u}] = ${dist[u]}`,
        say: primera ? `front() lee al ${u}, el que lleva más tiempo en la fila, y pop() lo quita.`
                     : `Sale el ${u}, el que lleva más tiempo en la fila. Está a distancia ${dist[u]} del origen.` });
      primera = false;
      for (const v of g.ady[u]) {
        const k = clave(g, u, v), antes = aristas[k];
        aristas[k] = 'revisa';
        if (dist[v] !== -1) {
          foto({ code: [8, 9], test: `v = ${v} · dist[${v}] = ${dist[v]}`,
            say: `El ${v} ya tiene distancia ${dist[v]}: alguien lo descubrió antes, por un camino igual de corto o más. No se toca.` });
          if (antes) aristas[k] = antes; else delete aristas[k];
        } else {
          dist[v] = dist[u] + 1; fila.push(v); nodos[v] = 'pendiente'; nuevo = v;
          foto({ code: [8, 9, 10, 11], test: `dist[${v}] = dist[${u}] + 1 = ${dist[v]}`,
            say: `El ${v} no estaba descubierto. Queda a un paso más que el ${u}, a distancia ${dist[v]}, y entra al final de la fila.` });
          aristas[k] = 'arbol'; nuevo = -1;
        }
      }
      nodos[u] = 'visitado';
    }
    const niveles = [];
    dist.forEach((d, v) => { if (d >= 0) (niveles[d] = niveles[d] || []).push(v); });
    foto({ code: 15, test: `dist = [${dist.join(', ')}]`,
      say: `La fila sacó los vértices por niveles: ${niveles.map((l, d) => `${y_(l)} a distancia ${d}`).join('; ')}. Cada dist[v] es el menor número de aristas entre el ${s} y v.` });
    return F;
  }

  /* ---------- gemelos: la misma vuelta con fila y con pila ---------- */
  function recorridoFrontera(g, conPila) {
    const n = g.n, s = g.inicio;
    const dist = Array(n).fill(-1), cont = [s], orden = [];
    dist[s] = 0;
    const pasos = [{ dist: dist.slice(), cont: cont.slice(), orden: [], u: -1, nuevos: [], desde: Array(n).fill(-1) }];
    const desde = Array(n).fill(-1);
    while (cont.length) {
      const u = conPila ? cont.pop() : cont.shift();
      orden.push(u);
      const nuevos = [];
      for (const v of g.ady[u]) if (dist[v] === -1) {
        dist[v] = dist[u] + 1; cont.push(v); nuevos.push(v); desde[v] = u;
      }
      pasos.push({ dist: dist.slice(), cont: cont.slice(), orden: orden.slice(), u, nuevos, desde: desde.slice() });
    }
    return pasos;
  }
  function trazaGemelos(g) {
    const A = recorridoFrontera(g, false), B = recorridoFrontera(g, true);
    const total = Math.max(A.length, B.length);
    const lado = (P, k, malos) => {
      const p = P[Math.min(k, P.length - 1)];
      const nodos = {}, aristas = {}, badges = {};
      p.orden.forEach(v => { nodos[v] = 'visitado'; });
      p.cont.forEach(v => { nodos[v] = 'pendiente'; });
      if (k < P.length && p.u >= 0) nodos[p.u] = 'actual';
      p.desde.forEach((u, v) => { if (u >= 0) aristas[clave(g, u, v)] = 'arbol'; });
      if (k < P.length) p.nuevos.forEach(v => { aristas[clave(g, p.u, v)] = 'revisa'; });
      p.dist.forEach((d, v) => { if (d >= 0) badges[v] = [String(d), malos.includes(v) ? 'err' : (k < P.length && p.nuevos.includes(v) ? 'nuevo' : '')]; });
      return { nodos, aristas, badges, cont: p.cont, orden: p.orden, u: k < P.length ? p.u : -1, nuevos: k < P.length ? p.nuevos : [] };
    };
    const fin = A[A.length - 1].dist, finB = B[B.length - 1].dist;
    const malos = finB.map((d, v) => d !== fin[v] ? v : -1).filter(v => v >= 0);
    const F = [];
    for (let k = 0; k <= total; k++) {
      const ultimo = k === total;
      const a = lado(A, k, []), b = lado(B, k, ultimo ? malos : []);
      const f = nuevaFoto({ izq: a, der: b, code: -1 });
      if (k === 0) {
        f.test = `dist[${g.inicio}] = 0 en los dos`;
        f.say = `Mismo código de BFS en los dos lados. A la izquierda la frontera es una std::queue; a la derecha, una std::stack, con top() en lugar de front(). Cada paso es una vuelta del while.`;
        f.predice = `¿saldrán las mismas distancias en los dos lados?`;
      } else if (!ultimo) {
        const t = (p, nom) => p.u < 0 ? `${nom}: ya terminó` : `${nom} saca ${p.u}` + (p.nuevos.length ? `, descubre ${lista(p.nuevos)}` : '');
        f.test = `${t(a, 'fila')} · ${t(b, 'pila')}`;
        const pa = A[Math.min(k, A.length - 1)], pb = B[Math.min(k, B.length - 1)];
        const err = pb.nuevos.filter(v => fin[v] !== pb.dist[v]);
        f.say = err.length
          ? `La pila saca al ${pb.u}, que entró al último, y descubre al ${y_(err)} desde ahí con distancia ${pb.dist[err[0]]}. Por la fila, el ${err[0]} queda a distancia ${fin[err[0]]}. Como cada vértice se descubre una sola vez, ese valor ya no se corrige.`
          : k === 1
            ? `Las dos sacan al ${g.inicio} y descubren a sus vecinos con distancia 1. Hasta aquí no hay diferencia.`
            : `La fila saca al ${pa.u}, el que lleva más tiempo esperando. La pila saca al ${pb.u}, el último que entró.`;
      } else {
        f.test = malos.length ? `fila: dist[${malos[0]}] = ${fin[malos[0]]} · pila: dist[${malos[0]}] = ${finB[malos[0]]}` : 'mismas distancias';
        f.say = malos.length
          ? `Con la fila, dist = [${fin.join(', ')}]. Con la pila, dist = [${finB.join(', ')}]. Las dos recorren todo el grafo, pero solo la fila procesa por niveles y garantiza la distancia mínima. El contenedor decide el recorrido.`
          : `En este grafo las distancias coinciden, pero el orden de visita no: la fila procesa por niveles y la pila se hunde.`;
      }
      F.push(f);
    }
    return F;
  }

  /* ---------- Kahn ----------
     Líneas: 1 ge · 2-6 listos iniciales · 9 while · 10 front · 11 pop · 12 orden · 13 for · 14 ge-1 · 15-16 if/push · 20 return */
  function trazaKahn(g) {
    const n = g.n;
    const ge = Array(n).fill(0);
    g.aristas.forEach(([, v]) => { ge[v]++; });
    const listos = [], orden = [], nodos = {}, aristas = {}, F = [];
    let nuevo = -1;
    const foto = o => F.push(nuevaFoto(Object.assign({
      nodos: Object.assign({}, nodos), aristas: Object.assign({}, aristas),
      badges: Object.fromEntries(ge.map((d, i) => [i, [String(d), (i === nuevo ? 'nuevo' : '') + (orden.includes(i) ? ' hecho' : '')]])),
      filas: [
        { titulo: 'ge', indices: true, celdas: ge.map((d, i) => [String(d), (d === 0 ? 'si' : '') + (i === nuevo ? ' nuevo' : '')]) },
        { titulo: 'listos', celdas: listos.map((v, i) => [String(v), i === 0 ? 'frente' : '']), contenedor: 'fila' },
        { titulo: 'orden', celdas: orden.map(v => [String(v), '']) }
      ],
      chips: [[`en el orden: ${orden.length} de ${n}`, 'ci']]
    }, o)));
    foto({ code: 1, test: `ge = [${ge.join(', ')}]`,
      say: `gradosEntrada() cuenta cuántas flechas llegan a cada vértice; la etiqueta junto a cada vértice es su ge. Un vértice con ge = 0 no depende de nadie.`,
      predice: `¿qué vértices pueden ir primero?` });
    const ceros = [];
    for (let u = 0; u < n; u++) if (ge[u] === 0) { listos.push(u); ceros.push(u); nodos[u] = 'pendiente'; }
    foto({ code: [2, 3, 4, 5], test: `listos = [${listos.join(', ')}]`,
      say: ceros.length ? `${losV(ceros, true)} ${ceros.length === 1 ? 'tiene' : 'tienen'} ge = 0 y ${ceros.length === 1 ? 'entra' : 'entran'} a la fila de listos.` : `Ningún vértice tiene ge = 0: todos esperan a alguien y la fila de listos queda vacía.` });
    while (listos.length) {
      const u = listos.shift();
      orden.push(u); nodos[u] = 'actual';
      const sal = g.ady[u];
      foto({ code: [9, 10, 11, 12], test: `u = ${u} · orden = [${orden.join(', ')}]`,
        say: `Sale el ${u} de la fila de listos y se agrega al orden.` + (sal.length ? ` Ahora se cumplen sus flechas de salida.` : ` No tiene flechas de salida.`) });
      for (const v of sal) {
        const antes = ge[v];
        ge[v] = ge[v] - 1;
        aristas[clave(g, u, v)] = 'revisa';
        if (ge[v] === 0) { listos.push(v); nodos[v] = 'pendiente'; }
        nuevo = v;
        foto({ code: ge[v] === 0 ? [13, 14, 15, 16] : [13, 14, 15], test: `ge[${v}]: ${antes} → ${ge[v]}` + (ge[v] === 0 ? ' → listos' : ''),
          say: ge[v] === 0
            ? `La flecha ${u}→${v} ya se cumplió: ge[${v}] baja a 0. El ${v} ya no espera a nadie y entra a la fila de listos.`
            : `La flecha ${u}→${v} ya se cumplió: ge[${v}] baja a ${ge[v]}. El ${v} todavía espera ${ge[v] === 1 ? 'otra flecha' : ge[v] + ' flechas'}.` });
        aristas[clave(g, u, v)] = 'hecha';
        nuevo = -1;
      }
      nodos[u] = 'visitado';
    }
    const atorados = [];
    for (let v = 0; v < n; v++) if (!orden.includes(v)) { atorados.push(v); nodos[v] = 'atorado'; }
    g.aristas.forEach(([u, v]) => { if (atorados.includes(u) && atorados.includes(v)) aristas[clave(g, u, v)] = 'ciclo'; });
    foto({ code: 20, test: `orden = [${orden.join(', ')}] · ${orden.length} de ${n}`,
      say: atorados.length
        ? `La fila de listos se vació con ${orden.length} de ${n} vértices en el orden. ${losV(atorados, true)} se quedaron con ge mayor que 0: cada uno espera una flecha de otro de ellos, en un ciclo. orden.size() < n delata el ciclo.`
        : `El orden tiene los ${n} vértices y toda flecha va de un vértice a otro que aparece después: es un orden topológico.` });
    return F;
  }

  /* ---------- Orden topológico por DFS ----------
     Líneas: 0 firma · 1 ABIERTO · 2 for · 3 if NUEVO · 4 dfsTopo(v) · 5 else if ABIERTO
             · 6 hayCiclo · 9 CERRADO · 10 push_back */
  function ordenKahn(g) {
    const ge = Array(g.n).fill(0);
    g.aristas.forEach(([, v]) => { ge[v]++; });
    const fila = [], orden = [];
    for (let u = 0; u < g.n; u++) if (ge[u] === 0) fila.push(u);
    while (fila.length) {
      const u = fila.shift(); orden.push(u);
      g.ady[u].forEach(v => { ge[v]--; if (ge[v] === 0) fila.push(v); });
    }
    return orden;
  }
  function trazaDfsTopo(g) {
    const n = g.n;
    const NUEVO = 0, ABIERTO = 1, CERRADO = 2;
    const est = Array(n).fill(NUEVO), llamadas = [], term = [];
    const nodos = {}, aristas = {}, F = [];
    let nuevo = -1, hayCiclo = false, invertido = null;
    const letra = ['N', 'A', 'C'];
    const foto = o => F.push(nuevaFoto(Object.assign({
      nodos: Object.assign({}, nodos), aristas: Object.assign({}, aristas),
      pila: { titulo: 'pila de llamadas', items: llamadas.map((u, i) => [`dfsTopo(${u})`, i === llamadas.length - 1 ? 'actual' : '']) },
      filas: [
        { titulo: 'estado', indices: true, celdas: est.map((e, i) => [letra[e], (e === NUEVO ? 'f' : e === ABIERTO ? 'actual' : 'si') + (i === nuevo ? ' nuevo' : '')]) },
        invertido
          ? { titulo: 'invertida', celdas: invertido.map(v => [String(v), 'si']) }
          : { titulo: 'terminados', celdas: term.map((v, i) => [String(v), i === term.length - 1 && v === nuevo ? 'nuevo' : '']), contenedor: true }
      ],
      chips: [[`terminados: ${term.length} de ${n}`, 'ci'], hayCiclo ? ['hayCiclo = true', 'cj'] : [`llamadas abiertas: ${llamadas.length}`, 'cok']]
    }, o)));
    foto({ code: -1, test: `estado = [${est.map(e => letra[e]).join(', ')}]`,
      say: `Todos empiezan en NUEVO (N). ABIERTO (A) quiere decir que la llamada del vértice sigue en la pila; CERRADO (C), que ya terminó. Un for recorre los vértices 0, 1, 2… y lanza dfsTopo desde cada uno que siga NUEVO.`,
      predice: `¿qué vértice terminará primero?` });
    let primerCierre = true;
    function dfsTopo(u) {
      est[u] = ABIERTO; llamadas.push(u); nodos[u] = 'actual'; nuevo = u;
      if (llamadas.length > 1) nodos[llamadas[llamadas.length - 2]] = 'activo';
      foto({ code: [0, 1], test: `estado[${u}] = ABIERTO`,
        say: llamadas.length === 1
          ? `El for lanza dfsTopo(${u}). Su llamada queda abierta mientras explora todo lo que depende del ${u}.`
          : `Entra dfsTopo(${u}) y el ${u} queda ABIERTO.` });
      nuevo = -1;
      for (const v of g.ady[u]) {
        const k = clave(g, u, v), antes = aristas[k];
        aristas[k] = 'revisa';
        if (est[v] === NUEVO) {
          foto({ code: [2, 3, 4], test: `v = ${v} · estado[${v}] es NUEVO → dfsTopo(${v})`,
            say: `La flecha ${u}→${v} lleva a un vértice NUEVO. dfsTopo(${u}) se queda esperando y llama a dfsTopo(${v}).` });
          aristas[k] = 'arbol';
          nodos[u] = 'activo';
          dfsTopo(v);
          nodos[u] = 'actual';
        } else if (est[v] === CERRADO) {
          foto({ code: [2, 3, 5], test: `v = ${v} · estado[${v}] es CERRADO`,
            say: `El ${v} ya está CERRADO: él y todo lo que se alcanza desde él ya están en terminados. No hay nada que hacer.` });
          if (antes) aristas[k] = antes; else delete aristas[k];
        } else {
          hayCiclo = true;
          const desde = llamadas.indexOf(v);
          const camino = llamadas.slice(desde);
          for (let i = 0; i + 1 < camino.length; i++) aristas[clave(g, camino[i], camino[i + 1])] = 'ciclo';
          aristas[k] = 'ciclo';
          foto({ code: [2, 3, 5, 6], test: `v = ${v} · estado[${v}] es ABIERTO → hayCiclo = true`,
            say: `El ${v} está ABIERTO: su llamada sigue en la pila, debajo de la del ${u}. Hay un camino ${camino.join('→')} y la flecha ${u}→${v} lo cierra. Es un ciclo.` });
        }
      }
      est[u] = CERRADO; llamadas.pop(); term.push(u); nodos[u] = 'terminado'; nuevo = u;
      if (llamadas.length) nodos[llamadas[llamadas.length - 1]] = 'actual';
      foto({ code: [9, 10], test: `estado[${u}] = CERRADO · terminados.push_back(${u})`,
        say: primerCierre && !g.ady[u].length
          ? `El ${u} no tiene flechas de salida: ningún vértice tiene que ir después de él. Queda CERRADO y es el primero en terminados.`
          : primerCierre
            ? `Se revisaron todas las flechas del ${u}. Queda CERRADO y es el primero en terminados.`
            : `Se revisaron todas las flechas del ${u}. Queda CERRADO y entra a terminados. Los vértices que tienen que ir después del ${u} ya están en la lista.` });
      primerCierre = false; nuevo = -1;
    }
    for (let u = 0; u < n; u++) {
      if (est[u] !== NUEVO) continue;
      if (term.length) {
        const cerrados = term.slice().sort((a, b) => a - b).filter(v => v < u);
        foto({ code: -1, test: `el for llega al ${u}`,
          say: (cerrados.length ? `${losV(cerrados, true)} ya ${cerrados.length === 1 ? 'está CERRADO' : 'están CERRADOS'}, así que el for ${cerrados.length === 1 ? 'lo salta' : 'los salta'}. ` : '')
            + `El ${u} sigue NUEVO: nadie lo alcanzó desde los recorridos anteriores.` });
      }
      dfsTopo(u);
    }
    invertido = term.slice().reverse();
    const pos = []; invertido.forEach((v, i) => { pos[v] = i; });
    const malas = g.aristas.filter(([a, b]) => pos[a] > pos[b]).map(([a, b]) => `${a}→${b}`);
    const kahn = ordenKahn(g);
    foto({ code: -1, test: `invertida = [${invertido.join(', ')}]`,
      say: hayCiclo
        ? `hayCiclo es true. La lista invertida, ${lista(invertido)}, no es un orden topológico: la flecha ${y_(malas)} apunta hacia atrás. Con un ciclo ningún orden puede respetar todas las flechas.`
        : `Al invertir terminados queda ${lista(invertido)}. Toda flecha va hacia la derecha en esa lista: es un orden topológico.`
          + (kahn.join() !== invertido.join() ? ` Kahn dio ${lista(kahn)}, otro orden igual de válido.` : '') });
    return F;
  }

  function trazar(alg, ds) {
    const g = leerGrafo(ds);
    switch (alg) {
      case 'dfs': return trazaDfs(g);
      case 'dfsIter': return trazaDfsIter(g);
      case 'bfs': return trazaBfs(g);
      case 'gemelos': return trazaGemelos(g);
      case 'kahn': return trazaKahn(g);
      case 'dfsTopo': return trazaDfsTopo(g);
    }
    throw new Error('sim-recorridos: algoritmo desconocido ' + alg);
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
      .replace(/\b(dfs|dfsIter|dfsTopo|bfs|kahn|gradosEntrada|visita|push|pop|top|front|empty|push_back)\b(?=\()/g, '\u0003$1\u0002')
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
    ['base', 'revisa', 'arbol', 'hecha', 'ciclo'].forEach(c => {
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
    const W = 500, GH = conPila ? 210 : g.dirigido ? 176 : 190;
    const altoFilas = F[0].filas.reduce((a, fl) => a + altoFila(fl), 0);
    const H = GH + 14 + altoFilas;
    const id = 'sr' + (++uid);
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
    const GW = conPila ? 330 : W;
    return function pintar(k) {
      k = Math.max(0, Math.min(k, F.length - 1));
      const f = F[k];
      capa.innerHTML = '';
      dibujarGrafo(capa, f, g, 0, g.dirigido ? 50 : 8, GW, GH - (g.dirigido ? 50 : 8), id);
      if (f.pila) dibujarPila(capa, f.pila, 334, GH, 106);
      let y = GH + 14;
      f.filas.forEach(fl => { dibujarFila(capa, fl, 0, y); y += altoFila(fl); });
      const act = Array.isArray(f.code) ? f.code : [f.code];
      lineas.forEach((l, i) => l.classList.toggle('on', act.includes(i)));
      dice.innerHTML = dicho(f);
      pintarBarra(barra, f, k, F.length);
    };
  }

  function construirGemelos(cont, F, g) {
    const W = 1100, GH = 200, H = GH + 14 + 46 + 46;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sr-svg' });
    const capa = el('g', {});
    svg.appendChild(capa);
    cont.appendChild(svg);
    const abajo = document.createElement('div');
    abajo.className = 'sr-abajo';
    const dice = document.createElement('p');
    dice.className = 'sim-dice sr-dice';
    const barra = barraNueva();
    abajo.appendChild(dice); abajo.appendChild(barra);
    cont.appendChild(abajo);
    const panel = (lado, x0, titulo, nombre) => {
      capa.appendChild(el('rect', { x: x0, y: 0, width: 530, height: H, rx: 14, class: 'sr-panel' }));
      capa.appendChild(el('text', { x: x0 + 18, y: 30, class: 'sr-titulo izq' }, titulo));
      dibujarGrafo(capa, lado, g, x0 + 150, 12, 360, GH - 18, '');
      dibujarFila(capa, { titulo: nombre, celdas: lado.cont.map((v, i) => [String(v), (nombre === 'fila' ? i === 0 : i === lado.cont.length - 1) ? 'frente' : '']), contenedor: true }, x0 + 18, GH + 8);
      dibujarFila(capa, { titulo: 'orden', celdas: lado.orden.map(v => [String(v), '']) }, x0 + 18, GH + 54);
    };
    return function pintar(k) {
      k = Math.max(0, Math.min(k, F.length - 1));
      const f = F[k];
      capa.innerHTML = '';
      panel(f.izq, 0, 'std::queue', 'fila');
      panel(f.der, 570, 'std::stack', 'pila');
      dice.innerHTML = dicho(f);
      pintarBarra(barra, f, k, F.length);
    };
  }

  function construir(cont) {
    const alg = cont.dataset.alg;
    const F = trazar(alg, cont.dataset);
    const g = leerGrafo(cont.dataset);
    cont.innerHTML = '';
    cont.classList.add('sr-' + alg);
    const pintar = alg === 'gemelos' ? construirGemelos(cont, F, g) : construirCodigo(cont, F, g, alg);
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
    slide.querySelectorAll('.sim-recorridos').forEach(cont => {
      if (!cont._simPintar) return;
      const vistos = cont.querySelectorAll('.sim-fragments .fragment.visible').length;
      cont._simPintar(vistos);
      const b = cont.querySelectorAll('.sim-ctrl button');
      if (b[0]) b[0].disabled = vistos === 0;
      if (b[1]) b[1].disabled = vistos >= cont._simTotal - 1;
    });
  }

  function init() {
    const sims = document.querySelectorAll('.sim-recorridos');
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

if (typeof module !== 'undefined') module.exports = SimRecorridos;
