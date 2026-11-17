/* ============================================================
   SIM-SPLAY — árboles splay paso a paso
   Requiere Reveal.js 5.x y curso-slides.js. Incluir después de
   curso-slides.js y llamar, tras CursoSlides.init(...):

       SimSplay.init();

   Uso en HTML:

     <div class="sim-splay" data-alg="splay"
          data-arbol="60,20,null,null,40" data-k="40"></div>

   data-alg:
     rotacion  rotarDer línea por línea: los punteros cambian primero
               y el árbol se reacomoda al final             (data-arbol)
     splay     splay(r, k), un paso por decisión y uno por rotación,
               con la pila de llamadas                 (data-arbol, data-k)
     comparar  subir con rotaciones simples contra splay, sobre el
               mismo árbol y el mismo acceso           (data-arbol, data-k)
     patron    costo promedio por acceso de un árbol balanceado y de
               un splay, con accesos sesgados y uniformes
   data-arbol: el árbol por niveles, con "null" para los huecos.

   Los pasos salen de ejecutar las operaciones: cambiar data-arbol o
   data-k cambia el trazado. Un paso = un fragment del slide. Cuando
   el árbol cambia de forma, los nodos se desplazan a su nueva
   posición en lugar de aparecer de golpe.

   La simulación "splay" solo recorre splayIzq, que es la mitad que
   muestra el deck; splayDer es la práctica de la sesión. Si un árbol
   de ejemplo necesitara splayDer, la traza lanza un error.

   El código (CODIGO, abajo) se genera desde la misma fuente que los
   bloques de código del deck: deben ser idénticos.
   ============================================================ */

const SimSplay = (() => {

  const CODIGO = {
      "rotar": "Nodo* rotarDer(Nodo* y) {\n    Nodo* x = y->izq;\n    y->izq = x->der;\n    x->der = y;\n    return x;\n}\nNodo* rotarIzq(Nodo* x) {\n    Nodo* y = x->der;\n    x->der = y->izq;\n    y->izq = x;\n    return y;\n}",
      "splay": "Nodo* splay(Nodo* r, int k) {\n    if (r == nullptr) return r;\n    if (k < r->dato) return splayIzq(r, k);\n    if (k > r->dato) return splayDer(r, k);\n    return r;\n}\nNodo* splayIzq(Nodo* r, int k) {\n    Nodo* p = r->izq;\n    if (p == nullptr) return r;\n    if (k < p->dato) {\n        p->izq = splay(p->izq, k);\n        r = rotarDer(r);\n    } else if (k > p->dato) {\n        p->der = splay(p->der, k);\n        if (p->der != nullptr)\n            r->izq = rotarIzq(p);\n    }\n    if (r->izq == nullptr) return r;\n    return rotarDer(r);\n}",
      "operaciones": "bool contiene(Nodo*& raiz, int k) {\n    raiz = splay(raiz, k);\n    if (raiz == nullptr) return false;\n    return raiz->dato == k;\n}\nNodo* insertar(Nodo* raiz, int k) {\n    raiz = insertarBST(raiz, k);\n    return splay(raiz, k);\n}",
      "eliminar": "Nodo* eliminar(Nodo* raiz, int k) {\n    raiz = splay(raiz, k);\n    if (raiz == nullptr) return nullptr;\n    if (raiz->dato != k) return raiz;\n    Nodo* izq = raiz->izq;\n    Nodo* der = raiz->der;\n    delete raiz;\n    if (izq == nullptr) return der;\n    // k es mayor que todo izq: sube su máximo\n    izq = splay(izq, k);\n    izq->der = der;\n    return izq;\n}"
  };

  /* ---------- Modelo ---------- */
  function leerArbol(txt) {
    const vals = txt.split(',').map(s => s.trim());
    const ids = vals.map((v, i) => (v === 'null' || v === '') ? null : 'n' + i);
    const N = {};
    ids.forEach((id, i) => { if (id) N[id] = { id, dato: Number(vals[i]), izq: null, der: null }; });
    let h = 1;
    ids.forEach(id => {
      if (!id) return;
      if (h < ids.length) N[id].izq = ids[h]; h++;
      if (h < ids.length) N[id].der = ids[h]; h++;
    });
    return { N, raiz: ids[0] };
  }
  const copiaPtrs = N => { const o = {}; for (const id in N) o[id] = { izq: N[id].izq, der: N[id].der }; return o; };

  // Posición: x por orden inorden (la rotación nunca la cambia), y por profundidad.
  function acomodo(N, raiz) {
    const pos = {}, orden = [];
    const r = (id, d) => { if (!id) return; r(N[id].izq, d + 1); orden.push(id); pos[id] = { i: 0, d }; r(N[id].der, d + 1); };
    r(raiz, 0);
    orden.forEach((id, i) => { pos[id].i = i; });
    return pos;
  }
  const altura = (N, id) => id ? 1 + Math.max(altura(N, N[id].izq), altura(N, N[id].der)) : -1;
  const profundidad = (N, raiz, k) => { let d = 0, c = raiz; while (c && N[c].dato !== k) { c = k < N[c].dato ? N[c].izq : N[c].der; d++; } return c ? d : -1; };

  function rotDer(N, y) { const x = N[y].izq; N[y].izq = N[x].der; N[x].der = y; return x; }
  function rotIzq(N, x) { const y = N[x].der; N[x].der = N[y].izq; N[y].izq = x; return y; }

  // splay completo (las dos mitades), sin fotos
  function splaySil(N, r, k) {
    if (!r) return r;
    if (k < N[r].dato) {
      const p = N[r].izq;
      if (!p) return r;
      if (k < N[p].dato) { N[p].izq = splaySil(N, N[p].izq, k); r = rotDer(N, r); }
      else if (k > N[p].dato) { N[p].der = splaySil(N, N[p].der, k); if (N[p].der) N[r].izq = rotIzq(N, p); }
      return N[r].izq ? rotDer(N, r) : r;
    }
    if (k > N[r].dato) {
      const p = N[r].der;
      if (!p) return r;
      if (k > N[p].dato) { N[p].der = splaySil(N, N[p].der, k); r = rotIzq(N, r); }
      else if (k < N[p].dato) { N[p].izq = splaySil(N, N[p].izq, k); if (N[p].izq) N[r].der = rotDer(N, p); }
      return N[r].der ? rotIzq(N, r) : r;
    }
    return r;
  }

  /* ---------- Traza ---------- */
  function nuevaTraza(arb) {
    const T = {
      N: arb.N, raiz: arb.raiz, est: {}, tags: {}, pila: [], chips: [], raizEtq: null,
      pos: acomodo(arb.N, arb.raiz), F: [],
      // reacomodar: true → las posiciones se recalculan; false → se conservan
      paso(o, reacomodar = true) {
        if (reacomodar) T.pos = acomodo(T.N, T.raiz);
        T.F.push(Object.assign({
          ptrs: copiaPtrs(T.N), raiz: T.raiz, pos: JSON.parse(JSON.stringify(T.pos)),
          est: Object.assign({}, T.est), tags: Object.assign({}, T.tags), pila: T.pila.slice(),
          chips: T.chips.map(c => c.slice()), raizEtq: T.raizEtq,
          code: -1, test: '', say: '', predice: ''
        }, o));
      }
    };
    return T;
  }
  const D = (T, id) => T.N[id].dato;

  /* ---------- rotarDer, línea por línea ----------
     Líneas: 0 rotarDer · 1 x = y->izq · 2 y->izq = x->der · 3 x->der = y · 4 return x */
  function trazaRotacion(arb) {
    const T = nuevaTraza(arb);
    const y = T.raiz, x = T.N[y].izq, b = T.N[x].der;
    const ino = () => { const o = []; const r = id => { if (!id) return; r(T.N[id].izq); o.push(T.N[id].dato); r(T.N[id].der); }; r(T.raiz); return o.join(', '); };
    T.raizEtq = y;
    T.chips = [[`altura: ${altura(T.N, T.raiz)}`, 'ci'], [`inorden: ${ino()}`, '']];
    T.tags = { [y]: 'y' };
    T.est = { [y]: 'activo' };
    T.paso({ code: 0, test: `rotarDer(${D(T, y)})`,
      say: `La rotación a la derecha sube al hijo izquierdo del ${D(T, y)} y baja al ${D(T, y)} un nivel. Solo cambian dos punteros, y se debe conservar el inorden.` });
    T.tags[x] = 'x';
    T.est[x] = 'comp';
    T.paso({ code: 1, test: `x = y->izq = ${D(T, x)}`, say: `<code>x</code> apunta al ${D(T, x)}, el hijo izquierdo. Es el nodo que va a subir.` }, false);
    T.N[y].izq = b;
    T.est = { [y]: 'activo', [x]: 'comp' };
    if (b) T.est[b] = 'mayor';
    T.paso({ code: 2, test: `y->izq = x->der = ${b ? D(T, b) : 'nullptr'}`,
      say: b ? `El ${D(T, b)} (hijo derecho de x) pasa a ser el hijo izquierdo del ${D(T, y)}. Es mayor que ${D(T, x)} y menor que ${D(T, y)}, así que el orden se respeta. Por un momento, dos punteros llegan al ${D(T, b)}.`
             : `El hijo izquierdo del ${D(T, y)} pasa a ser nullptr.` }, false);
    T.N[x].der = y;
    T.paso({ code: 3, test: `x->der = y`,
      say: `Ahora el ${D(T, y)} cuelga a la derecha del ${D(T, x)}. Los punteros ya forman el árbol nuevo, aunque el dibujo todavía no se reacomoda.` }, false);
    T.raiz = x;
    T.raizEtq = x;
    T.est = { [x]: 'listo' };
    T.chips = [[`altura: ${altura(T.N, T.raiz)}`, 'ci'], [`inorden: ${ino()}`, '']];
    T.paso({ code: 4, test: `return x → ${D(T, x)}`,
      say: `La función devuelve al ${D(T, x)}: quien la llamó lo guarda como nueva raíz del subárbol. Los nodos solo se mueven en vertical, porque el inorden no cambia.` });
    T.tags = {};
    T.est = {};
    T.paso({ code: -1, test: `inorden: ${ino()}`,
      say: `Mismo inorden que antes y tres nodos tocados: la rotación es O(1). <code>rotarIzq</code> es el espejo y deshace a <code>rotarDer</code>.` });
    return T.F;
  }

  /* ---------- splay: un paso por decisión y uno por rotación ----------
     Líneas: 0 splay · 1 if null · 2 if k < → splayIzq · 3 if k > · 4 return r
             6 splayIzq · 7 p = · 8 if p null · 9 if k < p (zig-zig) · 10 p->izq = splay
             11 r = rotarDer(r) · 12 else if k > p (zig-zag) · 13 p->der = splay
             14 if p->der · 15 r->izq = rotarIzq(p) · 17 if r->izq null · 18 return rotarDer(r) */
  function trazaSplay(arb, k) {
    const T = nuevaTraza(arb);
    const prof0 = profundidad(T.N, T.raiz, k);
    let rotaciones = 0;
    const kid = Object.keys(T.N).find(id => T.N[id].dato === k);
    const chips = () => { T.chips = [[`k = ${k}`, 'ci'], [`rotaciones: ${rotaciones}`, 'cok'], [`altura: ${altura(T.N, T.raiz)}`, '']]; };
    chips();
    if (kid) T.est[kid] = 'buscado';
    T.paso({ code: 0, test: `splay(${D(T, T.raiz)}, ${k}) · el ${k} está a profundidad ${prof0}`,
      say: `Vamos a subir el ${k} a la raíz. La recursión baja de dos en dos niveles; las rotaciones ocurren al regresar, de abajo hacia arriba.` });

    // Reemplaza la raíz del subárbol que cuelga de "padre" (o la raíz del árbol)
    function enganchar(padre, lado, nuevo) { if (padre) T.N[padre][lado] = nuevo; else T.raiz = nuevo; }

    function S(r, padre, lado) {
      if (!r) return r;
      const x = T.N[r].dato;
      T.pila.push(`splay(${x})`);
      if (k === x) {
        T.est[r] = 'buscado';
        T.paso({ code: 4, test: `splay(${x}, ${k}) · k == r->dato → return r`,
          say: `El ${k} es la raíz de este subárbol: la llamada lo devuelve sin rotar. Ahora empiezan a regresar las llamadas de arriba.` });
        T.pila.pop();
        return r;
      }
      if (k > x) throw new Error('sim-splay: el ejemplo necesita splayDer');
      const p = T.N[r].izq;
      T.tags = { [r]: 'r' };
      if (p) T.tags[p] = 'p';
      if (!p) {
        T.paso({ code: [2, 7, 8], test: `splay(${x}, ${k}) · p == nullptr → return r`,
          say: `El ${k} no está: el ${x} no tiene hijo izquierdo. Se devuelve el ${x}, el último nodo visitado.` });
        T.pila.pop();
        return r;
      }
      const P = T.N[p].dato;
      let caso;
      if (k < P) caso = 'zig-zig'; else if (k > P) caso = 'zig-zag'; else caso = 'zig';
      const lineas = caso === 'zig-zig' ? [2, 7, 9] : caso === 'zig-zag' ? [2, 7, 12] : [2, 7, 17];
      const textos = {
        'zig-zig': `${k} &lt; ${x} y ${k} &lt; ${P}: el ${k} está a la izquierda de la izquierda. <b>Caso zig-zig.</b> Primero se lleva el ${k} a la raíz del subárbol del ${T.N[p].izq ? T.N[T.N[p].izq].dato : '—'}.`,
        'zig-zag': `${k} &lt; ${x} pero ${k} &gt; ${P}: el ${k} está a la derecha de la izquierda. <b>Caso zig-zag.</b> Primero se lleva el ${k} a la raíz del subárbol del ${T.N[p].der ? T.N[T.N[p].der].dato : '—'}.`,
        'zig': `El ${k} es el hijo izquierdo del ${x}: falta un solo nivel. <b>Caso zig</b>: basta una rotación.`
      };
      T.paso({ code: lineas, test: `splay(${x}, ${k}) · r = ${x}, p = ${P} · ${caso}`, say: textos[caso] });

      if (caso === 'zig-zig') {
        T.N[p].izq = S(T.N[p].izq, p, 'izq');
        T.tags = { [r]: 'r', [p]: 'p' };
        const xn = T.N[p].izq;
        if (xn) T.tags[xn] = 'x';
        const nr = rotDer(T.N, r);
        enganchar(padre, lado, nr);
        rotaciones++; chips();
        T.est = { [nr]: 'comp' };
        if (xn) T.est[xn] = 'buscado';
        T.paso({ code: [10, 11], test: `r = rotarDer(r) · rota el abuelo ${x}`,
          say: `De regreso en <code>splay(${x})</code>, el ${k} ya es hijo izquierdo del ${P}. <b>Primero se rota el abuelo</b>: el ${P} sube y el ${x} baja a su derecha.` });
        if (!T.N[nr].izq) { T.pila.pop(); return nr; }
        const nr2 = rotDer(T.N, nr);
        enganchar(padre, lado, nr2);
        rotaciones++; chips();
        T.est = { [nr2]: 'buscado' };
        T.tags = { [nr2]: 'x' };
        T.paso({ code: 18, test: `return rotarDer(r) · rota el padre ${P}`,
          say: `Luego se rota el padre: el ${k} sube por encima del ${P}. El ${k} subió dos niveles con un zig-zig.` });
        T.pila.pop();
        return nr2;
      }
      if (caso === 'zig-zag') {
        T.N[p].der = S(T.N[p].der, p, 'der');
        T.tags = { [r]: 'r', [p]: 'p' };
        const xn = T.N[p].der;
        if (xn) {
          T.tags[xn] = 'x';
          T.N[r].izq = rotIzq(T.N, p);
          rotaciones++; chips();
          T.est = { [xn]: 'buscado' };
          T.paso({ code: [13, 14, 15], test: `r->izq = rotarIzq(p) · rota el padre ${P}`,
            say: `De regreso en <code>splay(${x})</code>, el ${k} es hijo derecho del ${P}. Una rotación a la izquierda sobre el ${P} lo sube: ahora es hijo izquierdo del ${x}.` });
        }
        const nr = rotDer(T.N, r);
        enganchar(padre, lado, nr);
        rotaciones++; chips();
        T.est = { [nr]: 'buscado' };
        T.tags = { [nr]: 'x' };
        T.paso({ code: 18, test: `return rotarDer(r) · rota el abuelo ${x}`,
          say: `Una rotación a la derecha sobre el ${x} termina el zig-zag: el ${k} queda arriba, con el ${P} a su izquierda y el ${x} a su derecha.` });
        T.pila.pop();
        return nr;
      }
      // zig
      const nr = rotDer(T.N, r);
      enganchar(padre, lado, nr);
      rotaciones++; chips();
      T.est = { [nr]: 'buscado' };
      T.tags = { [nr]: 'x' };
      T.paso({ code: 18, test: `return rotarDer(r) · zig`,
        say: `Una sola rotación a la derecha sube el ${k} por encima del ${x}.` });
      T.pila.pop();
      return nr;
    }
    T.raiz = S(T.raiz, null, null);
    T.tags = {};
    T.est = { [T.raiz]: 'buscado' };
    chips();
    T.paso({ code: -1, test: `el ${k} está en la raíz · ${rotaciones} rotaciones`,
      say: `El ${k} pasó de profundidad ${prof0} a la raíz con ${rotaciones} rotaciones. El árbol pasó de altura ${alturaInicial} a ${altura(T.N, T.raiz)}, y el inorden no cambió.` });
    return T.F;
  }
  let alturaInicial = 0;

  /* ---------- rotaciones simples contra splay ---------- */
  function trazaComparar(txt, k) {
    const A = leerArbol(txt), B = leerArbol(txt);
    const hi = altura(A.N, A.raiz);
    // Ingenuo: rotar con el padre hasta llegar a la raíz. Se registra cada rotación.
    const pasosA = [];
    (function ingenuo() {
      while (true) {
        // camino de la raíz a k
        const camino = []; let c = A.raiz;
        while (c && A.N[c].dato !== k) { camino.push(c); c = k < A.N[c].dato ? A.N[c].izq : A.N[c].der; }
        if (!c || !camino.length) break;
        const p = camino[camino.length - 1], g = camino[camino.length - 2];
        const nuevo = A.N[p].izq === c ? rotDer(A.N, p) : rotIzq(A.N, p);
        if (!g) A.raiz = nuevo; else if (A.N[g].izq === p) A.N[g].izq = nuevo; else A.N[g].der = nuevo;
        pasosA.push({ ptrs: copiaPtrs(A.N), raiz: A.raiz });
      }
    })();
    // Splay: se agrupan las rotaciones de dos en dos desde abajo, como en la recursión.
    const pasosB = [];
    (function splayGrabado() {
      const N = B.N;
      const graba = () => pasosB.push({ ptrs: copiaPtrs(N), raiz: raizB });
      let raizB = B.raiz;
      function S(r, padre, lado) {
        if (!r || N[r].dato === k) return r;
        const p = N[r].izq; if (!p) return r;
        const set = v => { if (padre) N[padre][lado] = v; else raizB = v; };
        if (k < N[p].dato) {
          N[p].izq = S(N[p].izq, p, 'izq');
          r = rotDer(N, r); set(r); graba();
        } else if (k > N[p].dato) {
          N[p].der = S(N[p].der, p, 'der');
          if (N[p].der) { N[r].izq = rotIzq(N, p); set(r); graba(); }
        }
        if (!N[r].izq) return r;
        const nr = rotDer(N, r); set(nr); graba();
        return nr;
      }
      raizB = S(raizB, null, null);
      B.raiz = raizB;
    })();
    const F = [];
    const foto = (iA, iB, o) => {
      const a = iA < 0 ? null : pasosA[Math.min(iA, pasosA.length - 1)];
      const b = iB < 0 ? null : pasosB[Math.min(iB, pasosB.length - 1)];
      F.push(Object.assign({
        A: a || { ptrs: copiaPtrs(leerArbol(txt).N), raiz: leerArbol(txt).raiz },
        B: b || { ptrs: copiaPtrs(leerArbol(txt).N), raiz: leerArbol(txt).raiz },
        code: -1, test: '', say: '', predice: '', chips: []
      }, o));
    };
    const datos = leerArbol(txt);
    const alt = s => altura(Object.fromEntries(Object.entries(s.ptrs).map(([id, v]) => [id, { dato: datos.N[id].dato, izq: v.izq, der: v.der }])), s.raiz);
    foto(-1, -1, { test: `acceso a ${k} · altura inicial ${hi}`,
      chips: [[`altura: ${hi}`, ''], [`altura: ${hi}`, '']],
      say: `El mismo árbol, el mismo acceso al ${k}. A la izquierda, el ${k} sube rotando siempre con su padre. A la derecha, splay: en el zig-zig rota primero el abuelo.`,
      predice: `¿cuál de los dos árboles queda más bajo?` });
    const n = Math.max(pasosA.length, pasosB.length);
    for (let i = 0; i < n; i += 2) {
      const a = pasosA[Math.min(i + 1, pasosA.length - 1)], b = pasosB[Math.min(i + 1, pasosB.length - 1)];
      foto(i + 1, i + 1, { test: `${Math.min(i + 2, n)} de ${n} rotaciones`,
        chips: [[`altura: ${alt(a)}`, ''], [`altura: ${alt(b)}`, 'cok']],
        say: i === 0
          ? `Las dos primeras rotaciones suben el ${k} dos niveles en ambos lados. La diferencia está en qué arista se rota primero: a la derecha, la de arriba.`
          : `Otro par de rotaciones. A la izquierda, los nodos del camino siguen formando una cadena; a la derecha, se van repartiendo en dos ramas.` });
    }
    const fa = pasosA[pasosA.length - 1], fb = pasosB[pasosB.length - 1];
    const prom = st => { const N = {}; for (const id in st.ptrs) N[id] = { dato: datos.N[id].dato, izq: st.ptrs[id].izq, der: st.ptrs[id].der }; const p = Object.values(acomodo(N, st.raiz)); return (p.reduce((s, q) => s + q.d, 0) / p.length).toFixed(1); };
    const p0 = prom({ ptrs: copiaPtrs(datos.N), raiz: datos.raiz });
    foto(pasosA.length - 1, pasosB.length - 1, { test: `ingenuo: altura ${alt(fa)} · splay: altura ${alt(fb)}`,
      chips: [[`altura: ${alt(fa)}`, ''], [`altura: ${alt(fb)}`, 'cok']],
      say: `Las dos versiones dejan el ${k} en la raíz con ${n} rotaciones. Con rotaciones simples la altura sigue en ${alt(fa)} y la profundidad promedio de los nodos pasa de ${p0} a ${prom(fa)}. Con splay la altura baja a ${alt(fb)} y la profundidad promedio a ${prom(fb)}: el acceso caro dejó el árbol más bajo para los siguientes.` });
    return F;
  }

  /* ---------- patrón de acceso ---------- */
  function trazaPatron() {
    const n = 63, m = 600, cada = 60;
    let semilla = 20261112;
    const azar = () => { semilla |= 0; semilla = semilla + 0x6D2B79F5 | 0; let t = Math.imul(semilla ^ semilla >>> 15, 1 | semilla); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const balanceado = () => {
      const N = {}; let c = 0;
      const arma = (lo, hi) => { if (lo > hi) return null; const mid = (lo + hi) >> 1; const id = 'n' + (c++); N[id] = { dato: mid, izq: null, der: null }; N[id].izq = arma(lo, mid - 1); N[id].der = arma(mid + 1, hi); return id; };
      const raiz = arma(1, n);
      return { N, raiz };
    };
    // Las claves calientes: 6 de 63, repartidas, para que no estén todas juntas.
    const calientes = [5, 17, 26, 38, 49, 60];
    const sesgado = Array.from({ length: m }, () => azar() < 0.8 ? calientes[Math.floor(azar() * calientes.length)] : 1 + Math.floor(azar() * n));
    const uniforme = Array.from({ length: m }, () => 1 + Math.floor(azar() * n));
    const corre = (seq, usaSplay) => {
      const t = balanceado(); let raiz = t.raiz, total = 0; const serie = [];
      seq.forEach((k, j) => {
        total += profundidad(t.N, raiz, k) + 1;
        if (usaSplay) raiz = splaySil(t.N, raiz, k);
        if ((j + 1) % cada === 0) serie.push(total / (j + 1));
      });
      return serie;
    };
    const S = {
      balSes: corre(sesgado, false), splSes: corre(sesgado, true),
      balUni: corre(uniforme, false), splUni: corre(uniforme, true)
    };
    const F = [];
    const f2 = v => v.toFixed(1);
    const k = S.splSes.length;
    F.push({ serie: S, hasta: 0, ver: ['balSes'], code: -1, chips: [], test: `n = ${n} claves · ${m} accesos`,
      say: `Un árbol balanceado de ${n} claves (altura 5, como un AVL) y un splay que empieza con la misma forma. Cada acceso cuesta los nodos que visita. En el patrón <b>sesgado</b>, el 80% de los accesos va a 6 claves "calientes".` });
    for (let i = 1; i <= k; i++) {
      F.push({ serie: S, hasta: i, ver: ['balSes', 'splSes'], code: -1,
        chips: [[`balanceado: ${f2(S.balSes[i - 1])}`, ''], [`splay: ${f2(S.splSes[i - 1])}`, 'cok']],
        test: `${i * cada} accesos sesgados`,
        say: i === 1 ? `Al principio el splay paga por reorganizarse. Las claves calientes suben a la raíz y se quedan cerca de ella.`
             : `Costo promedio acumulado por acceso tras ${i * cada} accesos: balanceado ${f2(S.balSes[i - 1])}, splay ${f2(S.splSes[i - 1])}.`,
        predice: i === k ? `¿qué pasa si los accesos son uniformes?` : '' });
    }
    F.push({ serie: S, hasta: k, ver: ['balSes', 'splSes', 'balUni', 'splUni'], code: -1,
      chips: [[`balanceado: ${f2(S.balUni[k - 1])}`, ''], [`splay: ${f2(S.splUni[k - 1])}`, 'cj']],
      test: `${m} accesos uniformes`,
      say: `Con accesos uniformes no hay nada que aprender: el splay termina en ${f2(S.splUni[k - 1])} nodos por acceso contra ${f2(S.balUni[k - 1])} del balanceado, y además reescribe punteros en cada lectura. La estructura apuesta a que hay localidad; si no la hay, pierde.` });
    return F;
  }

  function trazar(alg, ds) {
    switch (alg) {
      case 'rotacion': return trazaRotacion(leerArbol(ds.arbol));
      case 'splay': { const a = leerArbol(ds.arbol); alturaInicial = altura(a.N, a.raiz); return trazaSplay(a, Number(ds.k)); }
      case 'comparar': return trazaComparar(ds.arbol, Number(ds.k));
      case 'patron': return trazaPatron();
    }
    throw new Error('sim-splay: algoritmo desconocido ' + alg);
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
      .replace(/\b(int|bool|void|while|for|if|else|return|true|false|nullptr|delete)\b/g, '\u0001$1\u0002')
      .replace(/\b(splay|splayIzq|splayDer|rotarDer|rotarIzq|contiene|insertar|insertarBST|eliminar)\b(?=\()/g, '\u0003$1\u0002')
      .replace(/(?<![\w#])(-?\d+)\b/g, '\u0004$1\u0002')
      .replace(/\u0001/g, '<span class="kw">').replace(/\u0003/g, '<span class="fn">')
      .replace(/\u0004/g, '<span class="num">').replace(/\u0002/g, '</span>') + cm;
  }

  const sinMovimiento = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function barraNueva() {
    const barra = document.createElement('div');
    barra.className = 'sim-barra sp-barra';
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

  /* Dibuja un árbol en "capa" a partir de punteros y posiciones. Las
     posiciones pueden venir interpoladas durante una animación. */
  function dibujarArbol(capa, datos, f, xy, opts) {
    capa.innerHTML = '';
    const R = opts.R;
    const ids = Object.keys(xy);
    // Aristas = punteros
    ids.forEach(id => {
      ['izq', 'der'].forEach(lado => {
        const h = f.ptrs[id][lado];
        if (!h || !xy[h]) return;
        const a = xy[id], b = xy[h];
        if (opts.flechas) {
          const L = Math.hypot(b.x - a.x, b.y - a.y) || 1, ux = (b.x - a.x) / L, uy = (b.y - a.y) / L;
          capa.appendChild(el('line', { x1: a.x + ux * R, y1: a.y + uy * R, x2: b.x - ux * (R + 4), y2: b.y - uy * (R + 4),
            class: 'sp-arista' + (opts.marcaHijo && opts.marcaHijo === h ? ' nueva' : ''), 'marker-end': `url(#${opts.uid}-m)` }));
        } else {
          capa.appendChild(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'sp-arista' }));
        }
      });
    });
    ids.forEach(id => {
      const p = xy[id];
      const g = el('g', { class: 'sp-nodo' + (f.est && f.est[id] ? ' ' + f.est[id] : '') });
      g.appendChild(el('circle', { cx: p.x, cy: p.y, r: R }));
      g.appendChild(el('text', { x: p.x, y: p.y + 7, class: 'sp-dato' }, datos[id].dato));
      if (f.tags && f.tags[id]) g.appendChild(el('text', { x: p.x - R - 4, y: p.y - R + 8, class: 'sp-tag' }, f.tags[id]));
      capa.appendChild(g);
    });
    if (f.raizEtq && xy[f.raizEtq]) {
      const p = xy[f.raizEtq];
      capa.appendChild(el('text', { x: p.x + R + 8, y: p.y - R + 2, class: 'sp-raiz' }, '← raíz'));
    }
  }

  function construirArbolSim(cont, alg, F, datos) {
    const conCodigo = alg === 'rotacion' || alg === 'splay';
    const clave = alg === 'rotacion' ? 'rotar' : 'splay';
    const cuerpo = document.createElement('div');
    cuerpo.className = 'sp-cuerpo';
    const izq = document.createElement('div');
    izq.className = 'sp-izq';
    const pre = document.createElement('pre');
    pre.className = 'sim-codigo sp-codigo';
    pre.innerHTML = CODIGO[clave].split('\n').map(l => `<div class="sim-linea">${pintarCodigo(l) || ' '}</div>`).join('');
    izq.appendChild(pre);
    const der = document.createElement('div');
    der.className = 'sp-der';
    // Geometría común a todos los pasos
    const nodos = Object.keys(datos);
    const maxD = Math.max(...F.map(f => Math.max(...Object.values(f.pos).map(p => p.d))));
    const W = 500, R = 22, PX = 40, TOP = 34;
    const DY = maxD > 4 ? 40 : 64;
    const H = TOP + maxD * DY + R + 14;
    const paso = (W - 2 * PX - 40) / Math.max(1, nodos.length - 1);
    const xy0 = f => { const o = {}; for (const id in f.pos) o[id] = { x: PX + f.pos[id].i * paso, y: TOP + f.pos[id].d * DY }; return o; };
    const uid = 'sp' + Math.random().toString(36).slice(2, 8);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sp-svg' });
    svg.innerHTML = `<defs><marker id="${uid}-m" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="10" refX="10" refY="5" orient="auto"><path d="M0,0 L11,5 L0,10 z" class="sp-punta"/></marker></defs><g></g>`;
    const capa = svg.querySelector('g');
    der.appendChild(svg);
    let pila = null;
    if (alg === 'splay') { pila = document.createElement('div'); pila.className = 'sp-pila'; der.appendChild(pila); }
    const dice = document.createElement('p');
    dice.className = 'sim-dice sp-dice';
    der.appendChild(dice);
    const barra = barraNueva();
    der.appendChild(barra);
    cuerpo.appendChild(izq); cuerpo.appendChild(der);
    cont.appendChild(cuerpo);
    const lineas = [...pre.querySelectorAll('.sim-linea')];

    let actual = null, anim = null, ultimo = -1;
    function pintar(k) {
      k = Math.max(0, Math.min(k, F.length - 1));
      const f = F[k];
      const meta = xy0(f);
      const opts = { R, uid, flechas: alg === 'rotacion' };
      if (anim) cancelAnimationFrame(anim);
      const desde = actual;
      if (desde && k === ultimo + 1 && !sinMovimiento()) {
        const t0 = performance.now(), dur = 520;
        const cuadro = t => {
          const u = Math.min(1, (t - t0) / dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          const xy = {};
          for (const id in meta) { const a = desde[id] || meta[id]; xy[id] = { x: a.x + (meta[id].x - a.x) * e, y: a.y + (meta[id].y - a.y) * e }; }
          dibujarArbol(capa, datos, f, xy, opts);
          if (u < 1) anim = requestAnimationFrame(cuadro);
        };
        anim = requestAnimationFrame(cuadro);
      } else {
        dibujarArbol(capa, datos, f, meta, opts);
      }
      actual = meta; ultimo = k;
      const act = Array.isArray(f.code) ? f.code : [f.code];
      lineas.forEach((l, i) => l.classList.toggle('on', act.includes(i)));
      if (pila) pila.innerHTML = '<span class="sp-pila-tit">Pila</span>' +
        (f.pila.length ? f.pila.map((p, i) => `<span class="sp-marco${i === f.pila.length - 1 ? ' activo' : ''}">${esc(p)}</span>`).join('<span class="sp-sep">›</span>') : '<span class="sp-marco vacio">(vacía)</span>');
      dice.innerHTML = dicho(f);
      pintarBarra(barra, f, k, F.length);
    }
    return pintar;
  }

  function construirComparar(cont, F, datos) {
    const W = 1100;
    const maxD = (() => { let m = 0; F.forEach(f => [f.A, f.B].forEach(s => { const N = {}; for (const id in s.ptrs) N[id] = { dato: datos[id].dato, izq: s.ptrs[id].izq, der: s.ptrs[id].der }; Object.values(acomodo(N, s.raiz)).forEach(p => { m = Math.max(m, p.d); }); })); return m; })();
    const R = 21, TOP = 56, DY = Math.min(52, Math.floor(250 / Math.max(1, maxD)));
    const H = TOP + maxD * DY + R + 10;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sp-svg ancho' });
    const capaA = el('g', {}), capaB = el('g', {}), rot = el('g', {});
    svg.appendChild(rot); svg.appendChild(capaA); svg.appendChild(capaB);
    rot.appendChild(el('text', { x: 270, y: 24, class: 'sp-titulo' }, 'rotaciones simples con el padre'));
    rot.appendChild(el('text', { x: 830, y: 24, class: 'sp-titulo acc' }, 'splay (zig-zig: abuelo primero)'));
    rot.appendChild(el('line', { x1: 550, y1: 10, x2: 550, y2: H - 4, class: 'sp-div' }));
    cont.appendChild(svg);
    const abajo = document.createElement('div');
    abajo.className = 'sp-abajo';
    const dice = document.createElement('p');
    dice.className = 'sim-dice sp-dice';
    const barra = barraNueva();
    abajo.appendChild(dice); abajo.appendChild(barra);
    cont.appendChild(abajo);
    const n = Object.keys(datos).length;
    const posDe = (s, x0) => {
      const N = {}; for (const id in s.ptrs) N[id] = { dato: datos[id].dato, izq: s.ptrs[id].izq, der: s.ptrs[id].der };
      const p = acomodo(N, s.raiz), xy = {};
      const paso = 440 / Math.max(1, n - 1);
      for (const id in p) xy[id] = { x: x0 + p[id].i * paso, y: TOP + p[id].d * DY };
      return xy;
    };
    return function pintar(k) {
      k = Math.max(0, Math.min(k, F.length - 1));
      const f = F[k];
      dibujarArbol(capaA, datos, { ptrs: f.A.ptrs }, posDe(f.A, 50), { R });
      dibujarArbol(capaB, datos, { ptrs: f.B.ptrs }, posDe(f.B, 610), { R });
      dice.innerHTML = dicho(f);
      pintarBarra(barra, Object.assign({}, f, { chips: [[`izquierda · ${f.chips[0][0]}`, f.chips[0][1]], [`derecha · ${f.chips[1][0]}`, f.chips[1][1]]] }), k, F.length);
    };
  }

  function construirPatron(cont, F) {
    const W = 1100, H = 330, X0 = 80, X1 = 760, Y0 = 290, Y1 = 30;
    const S = F[0].serie, k = S.splSes.length;
    const ymax = Math.ceil(Math.max(...Object.values(S).flat()) + 0.5);
    const X = i => X0 + (X1 - X0) * (i + 1) / k;
    const Y = v => Y0 - (Y0 - Y1) * v / ymax;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sp-svg ancho' });
    const fijo = el('g', {}), capa = el('g', {});
    svg.appendChild(fijo); svg.appendChild(capa);
    fijo.appendChild(el('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, class: 'sp-eje' }));
    fijo.appendChild(el('line', { x1: X0, y1: Y0, x2: X0, y2: Y1, class: 'sp-eje' }));
    for (let v = 0; v <= ymax; v += 2) {
      fijo.appendChild(el('line', { x1: X0, y1: Y(v), x2: X1, y2: Y(v), class: 'sp-rejilla' }));
      fijo.appendChild(el('text', { x: X0 - 10, y: Y(v) + 6, class: 'sp-marca der' }, v));
    }
    for (let i = 1; i < k; i += 2) fijo.appendChild(el('text', { x: X(i), y: Y0 + 26, class: 'sp-marca' }, (i + 1) * 60));
    fijo.appendChild(el('text', { x: X0 - 60, y: Y1 - 10, class: 'sp-marca izq' }, 'nodos visitados por acceso (promedio)'));
    const estilo = { balSes: 'bal', splSes: 'spl', balUni: 'bal uni', splUni: 'spl uni' };
    const nombre = { balSes: 'balanceado, sesgado', splSes: 'splay, sesgado', balUni: 'balanceado, uniforme', splUni: 'splay, uniforme' };
    cont.appendChild(svg);
    const abajo = document.createElement('div');
    abajo.className = 'sp-abajo';
    const dice = document.createElement('p');
    dice.className = 'sim-dice sp-dice';
    const barra = barraNueva();
    abajo.appendChild(dice); abajo.appendChild(barra);
    cont.appendChild(abajo);
    return function pintar(j) {
      j = Math.max(0, Math.min(j, F.length - 1));
      const f = F[j];
      capa.innerHTML = '';
      let ly = Y1 + 40;
      f.ver.forEach(s => {
        const hasta = s === 'balSes' && f.hasta === 0 ? k : f.hasta;
        if (hasta < 1) return;
        const pts = S[s].slice(0, hasta).map((v, i) => `${X(i)},${Y(v)}`).join(' ');
        capa.appendChild(el('polyline', { points: pts, class: 'sp-serie ' + estilo[s] }));
        const v = S[s][hasta - 1];
        capa.appendChild(el('circle', { cx: X(hasta - 1), cy: Y(v), r: 5, class: 'sp-punto ' + estilo[s] }));
        capa.appendChild(el('line', { x1: 800, y1: ly, x2: 846, y2: ly, class: 'sp-serie ' + estilo[s] }));
        capa.appendChild(el('text', { x: 858, y: ly + 6, class: 'sp-ley' }, nombre[s]));
        ly += 34;
      });
      dice.innerHTML = dicho(f);
      pintarBarra(barra, f, j, F.length);
    };
  }

  function construir(cont) {
    const alg = cont.dataset.alg;
    const F = trazar(alg, cont.dataset);
    cont.innerHTML = '';
    cont.classList.add('sp-' + alg);
    let pintar;
    if (alg === 'patron') pintar = construirPatron(cont, F);
    else if (alg === 'comparar') pintar = construirComparar(cont, F, leerArbol(cont.dataset.arbol).N);
    else pintar = construirArbolSim(cont, alg, F, leerArbol(cont.dataset.arbol).N);
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
    slide.querySelectorAll('.sim-splay').forEach(cont => {
      if (!cont._simPintar) return;
      const vistos = cont.querySelectorAll('.sim-fragments .fragment.visible').length;
      cont._simPintar(vistos);
      const b = cont.querySelectorAll('.sim-ctrl button');
      if (b[0]) b[0].disabled = vistos === 0;
      if (b[1]) b[1].disabled = vistos >= cont._simTotal - 1;
    });
  }

  function init() {
    const sims = document.querySelectorAll('.sim-splay');
    if (!sims.length) return;
    sims.forEach(construir);
    if (typeof Reveal !== 'undefined') {
      if (Reveal.sync) Reveal.sync();
      ['fragmentshown', 'fragmenthidden', 'slidechanged', 'ready']
        .forEach(ev => Reveal.on(ev, () => setTimeout(sync, 0)));
      sync();
    }
  }

  return {
    init, _codigo: CODIGO,
    _trazar: (alg, ds) => trazar(alg, ds || {}),
    _splay: (txt, k) => { const a = leerArbol(txt); const r = splaySil(a.N, a.raiz, k); const o = []; const q = [r]; while (q.length) { const id = q.shift(); if (!id) { o.push('null'); continue; } o.push(a.N[id].dato); q.push(a.N[id].izq, a.N[id].der); } while (o[o.length - 1] === 'null') o.pop(); return o.join(','); }
  };
})();

if (typeof module !== 'undefined') module.exports = SimSplay;
