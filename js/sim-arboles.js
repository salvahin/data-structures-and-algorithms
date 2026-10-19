/* ============================================================
   SIM-ARBOLES — ejecución paso a paso de operaciones sobre un BST
   Requiere Reveal.js 5.x y curso-slides.js. Incluir después de
   curso-slides.js y llamar, tras CursoSlides.init(...):

       SimArboles.init();

   Uso en HTML:

     <div class="sim-bst" data-alg="validar"
          data-arbol="40,20,60,10,50"></div>

   data-alg:   altura · ingenuo · validar · kesimo · lca · rango
   data-arbol: el árbol por niveles, con "null" para los huecos
               (la misma representación de LeetCode).
   data-k (kesimo), data-a y data-b (lca, rango).

   Los pasos no se escriben a mano: salen de ejecutar la operación
   sobre el árbol. Cambiar data-arbol o los parámetros cambia el
   trazado completo. Un paso = un fragment del slide.

   Granularidad: validar y lca avanzan una línea de código por paso;
   altura, ingenuo, kesimo y rango avanzan una llamada por paso,
   con la línea correspondiente resaltada.

   El código de cada operación (CODIGO, abajo) se genera desde la
   misma fuente que los bloques de código del deck: deben ser
   idénticos.
   ============================================================ */

const SimArboles = (() => {

  const CODIGO = {
      "altura": "int altura(Nodo* n) {\n    if (n == nullptr) return -1;\n    int hIzq = altura(n->izq);\n    int hDer = altura(n->der);\n    if (hIzq > hDer) return hIzq + 1;\n    return hDer + 1;\n}",
      "ingenuo": "bool esBSTIngenuo(Nodo* n) {\n    if (n == nullptr) return true;\n    Nodo* hi = n->izq;\n    Nodo* hd = n->der;\n    if (hi != nullptr && hi->dato >= n->dato)\n        return false;\n    if (hd != nullptr && hd->dato <= n->dato)\n        return false;\n    if (!esBSTIngenuo(hi)) return false;\n    return esBSTIngenuo(hd);\n}",
      "validar": "bool esBST(Nodo* n, Nodo* piso, Nodo* techo) {\n    if (n == nullptr) return true;\n    int x = n->dato;\n    if (piso != nullptr && x <= piso->dato)\n        return false;\n    if (techo != nullptr && x >= techo->dato)\n        return false;\n    if (!esBST(n->izq, piso, n)) return false;\n    return esBST(n->der, n, techo);\n}",
      "kesimo": "Nodo* kesimo(Nodo* n, int k, int& vistos) {\n    if (n == nullptr) return nullptr;\n    Nodo* izq = kesimo(n->izq, k, vistos);\n    if (izq != nullptr) return izq;\n    vistos = vistos + 1;\n    if (vistos == k) return n;\n    return kesimo(n->der, k, vistos);\n}",
      "lca": "Nodo* lca(Nodo* n, int a, int b) {\n    while (n != nullptr) {\n        int x = n->dato;\n        if (a < x && b < x)\n            n = n->izq;\n        else if (a > x && b > x)\n            n = n->der;\n        else\n            return n;\n    }\n    return nullptr;\n}",
      "rango": "void rango(Nodo* n, int a, int b,\n           std::vector<int>& salida) {\n    if (n == nullptr) return;\n    if (a < n->dato)\n        rango(n->izq, a, b, salida);\n    if (a <= n->dato && n->dato <= b)\n        salida.push_back(n->dato);\n    if (n->dato < b)\n        rango(n->der, a, b, salida);\n}"
  };

  /* ---------- Modelo del árbol ---------- */
  function leerArbol(txt) {
    const vals = txt.split(',').map(s => s.trim());
    const nodos = {};
    const ids = vals.map((v, i) => (v === 'null' || v === '') ? null : 'n' + i);
    // Por niveles, como LeetCode: los hijos se asignan en orden a los
    // nodos no nulos.
    let hijo = 1;
    ids.forEach((id, i) => {
      if (id === null) return;
      nodos[id] = { id, dato: Number(vals[i]), izq: null, der: null, x: 0, d: 0 };
    });
    ids.forEach(id => {
      if (id === null) return;
      if (hijo < ids.length) nodos[id].izq = ids[hijo];
      hijo++;
      if (hijo < ids.length) nodos[id].der = ids[hijo];
      hijo++;
    });
    const raiz = ids[0];
    // Posición: x por orden de recorrido inorden, y por profundidad.
    let i = 0;
    const colocar = (id, d) => {
      if (id === null) return;
      colocar(nodos[id].izq, d + 1);
      nodos[id].x = i++;
      nodos[id].d = d;
      colocar(nodos[id].der, d + 1);
    };
    colocar(raiz, 0);
    return { nodos, raiz, n: Object.keys(nodos).length };
  }

  const subarbol = (A, id) => {
    const out = [];
    const r = x => { if (x === null) return; out.push(x); r(A.nodos[x].izq); r(A.nodos[x].der); };
    r(id);
    return out;
  };

  /* ---------- Traza: estado acumulado y fotos por paso ----------
     est:  '' · listo · sale · error · podado · nunca  (lo fija el algoritmo)
           los nodos con llamada abierta se pintan como 'pila' y el de
           la llamada en curso como 'activo' al tomar la foto.
     etq:  etiqueta junto al nodo { t, cls }.
     pila: marcos { fn, info }, el último es la llamada en curso. */
  function nuevaTraza(A) {
    const est = {}, etq = {};
    for (const id in A.nodos) { est[id] = ''; etq[id] = null; }
    const T = {
      A, est, etq, pila: [], F: [], par: null, marcas: {}, chips: [],
      paso(o) {
        const e = Object.assign({}, est);
        T.pila.forEach((m, i) => {
          if (!m.nodo) return;
          if (e[m.nodo] === '' || e[m.nodo] === 'listo')
            e[m.nodo] = i === T.pila.length - 1 ? 'activo' : 'pila';
        });
        T.F.push(Object.assign({
          est: e,
          etq: JSON.parse(JSON.stringify(etq)),
          pila: T.pila.map(m => ({ fn: m.fn, info: m.info || '' })),
          par: T.par ? T.par.slice() : null,
          marcas: Object.assign({}, T.marcas),
          chips: T.chips.map(c => c.slice()),
          code: -1, test: '', say: '', predice: ''
        }, o));
      }
    };
    return T;
  }

  const D = (A, id) => A.nodos[id].dato;
  const dd = (A, id) => id === null ? 'nullptr' : String(D(A, id));

  /* ---------- altura: una llamada por paso ---------- */
  function trazaAltura(A) {
    const T = nuevaTraza(A);
    let resueltos = 0;
    const chips = () => { T.chips = [[`llamadas abiertas: ${T.pila.length}`, 'ci'], [`resueltos: ${resueltos} / ${A.n}`, 'cok']]; };
    chips();
    T.paso({ code: 0, test: `altura(${dd(A, A.raiz)})`,
      say: `Cada llamada recibe un nodo y devuelve la altura de su subárbol. <code>altura(nullptr)</code> devuelve −1, así que una hoja mide 0.` });

    const num = v => v < 0 ? '−1' : String(v);
    // Lo que cada marco sabe hasta ahora, recalculado antes de cada foto.
    const P = o => {
      T.pila.forEach(m => {
        if (m.hIzq === undefined) m.info = 'espera hIzq';
        else if (m.hDer === undefined) m.info = `hIzq = ${num(m.hIzq)} · espera hDer`;
        else m.info = `hIzq = ${num(m.hIzq)} · hDer = ${num(m.hDer)}`;
      });
      T.paso(o);
    };

    function rec(id, padre, lado) {
      const n = A.nodos[id];
      const m = { nodo: id, fn: `altura(${n.dato})` };
      T.pila.push(m);
      chips();
      const origen = padre === null ? '' : `<code>altura(${D(A, padre)})</code> pide la altura de su hijo ${lado === 'hIzq' ? 'izquierdo' : 'derecho'}. `;
      if (n.izq !== null) {
        P({ code: 2, test: `entra a altura(${n.dato})`,
          say: origen + `Entra <code>altura(${n.dato})</code>. Antes de saber su propia altura necesita la de su subárbol izquierdo, que empieza en el ${D(A, n.izq)}.` });
        m.hIzq = rec(n.izq, id, 'hIzq');
      } else {
        m.hIzq = -1;
      }
      if (n.der !== null) {
        if (n.izq === null) {
          P({ code: 3, test: `entra a altura(${n.dato}) · hIzq = −1`,
            say: origen + `Entra <code>altura(${n.dato})</code>. Su izquierdo es nullptr, así que hIzq = −1. Ahora pide la altura del derecho, el ${D(A, n.der)}.` });
        }
        m.hDer = rec(n.der, id, 'hDer');
      } else {
        m.hDer = -1;
      }
      const h = Math.max(m.hIzq, m.hDer) + 1;
      if (n.izq === null && n.der === null) {
        P({ code: [2, 3], test: `entra a altura(${n.dato}) · es hoja`,
          say: origen + `Entra <code>altura(${n.dato})</code>. Es hoja: sus dos hijos son nullptr, así que hIzq = −1 y hDer = −1.` });
      }
      // Regresa: la foto se toma con el marco todavía en la pila y el
      // valor ya guardado en el marco del padre.
      T.est[id] = 'listo';
      T.etq[id] = { t: `h=${h}`, cls: 'acc' };
      resueltos++;
      const up = T.pila[T.pila.length - 2];
      if (up) up[lado] = h;
      chips();
      P({ code: m.hIzq > m.hDer ? 4 : 5, test: `hIzq = ${num(m.hIzq)} · hDer = ${num(m.hDer)} · devuelve ${h}`,
        say: `<code>altura(${n.dato})</code> tiene hIzq = ${num(m.hIzq)} y hDer = ${num(m.hDer)}: devuelve el mayor más 1, que es <b>${h}</b>.` +
          (up ? ` <code>altura(${D(A, padre)})</code> lo guarda en ${lado}.` : '') });
      T.pila.pop();
      chips();
      return h;
    }
    const h = rec(A.raiz, null, null);
    T.chips = [[`altura = ${h}`, 'cok'], [`llamadas: ${A.n}`, 'ci']];
    T.paso({ code: -1, test: `altura(${dd(A, A.raiz)}) = ${h}`,
      say: `El árbol mide <b>${h}</b>. Cada nodo abrió exactamente una llamada y la cerró al saber la altura de sus dos hijos: O(n).` });
    return T.F;
  }

  /* ---------- check ingenuo: una llamada por paso ---------- */
  function trazaIngenuo(A) {
    const T = nuevaTraza(A);
    let llamadas = 0;
    T.chips = [['solo compara padre-hijo', 'cj']];
    T.paso({ code: 0, test: `esBSTIngenuo(${dd(A, A.raiz)})`,
      say: `Cada llamada compara su nodo con sus dos hijos y después repite lo mismo en cada subárbol.` });

    let resultado = true;
    function rec(id) {
      const n = A.nodos[id];
      const m = { nodo: id, fn: `esBSTIngenuo(${n.dato})`, info: '' };
      T.pila.push(m);
      llamadas++;
      const partes = [];
      let ok = true;
      if (n.izq !== null) {
        const b = D(A, n.izq) < n.dato;
        partes.push(`${D(A, n.izq)} &lt; ${n.dato} ${b ? '✓' : '✗'}`);
        T.marcas[n.izq] = b ? 'ok' : 'err';
        ok = ok && b;
      }
      if (n.der !== null) {
        const b = D(A, n.der) > n.dato;
        partes.push(`${D(A, n.der)} &gt; ${n.dato} ${b ? '✓' : '✗'}`);
        T.marcas[n.der] = b ? 'ok' : 'err';
        ok = ok && b;
      }
      T.etq[id] = { t: ok ? '✓' : '✗', cls: ok ? 'ok' : 'err' };
      m.info = partes.length ? (ok ? 'sus hijos pasan' : 'un hijo falla') : 'hoja';
      T.chips = [['solo compara padre-hijo', 'cj'], [`llamadas: ${llamadas}`, 'ci']];
      const t = partes.length ? partes.join(' · ') : 'hoja: no hay hijos que comparar';
      T.paso({ code: [4, 6], test: t.replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        say: partes.length
          ? `<code>esBSTIngenuo(${n.dato})</code> compara al ${n.dato} con sus hijos: ${partes.join(', ')}. ` + (ok ? 'Las dos comparaciones pasan; sigue con los subárboles.' : 'Falla una comparación: devuelve false.')
          : `<code>esBSTIngenuo(${n.dato})</code>: el ${n.dato} es hoja, no tiene con quién compararse. Sus dos llamadas con nullptr devuelven true.` });
      if (!ok) { resultado = false; T.pila.pop(); return false; }
      if (n.izq !== null && !rec(n.izq)) { T.pila.pop(); return false; }
      if (n.der !== null && !rec(n.der)) { T.pila.pop(); return false; }
      T.pila.pop();
      T.est[id] = 'listo';
      return true;
    }
    resultado = rec(A.raiz);

    // Inorden, para delatar el árbol.
    const ino = [];
    const r = id => { if (id === null) return; r(A.nodos[id].izq); ino.push(id); r(A.nodos[id].der); };
    r(A.raiz);
    const datos = ino.map(id => D(A, id));
    T.paso({ code: 9, test: `esBSTIngenuo(${dd(A, A.raiz)}) → ${resultado}`,
      say: resultado
        ? `Las ${llamadas} llamadas devuelven true: el check ingenuo <b>acepta</b> el árbol.`
        : `El check ingenuo rechaza el árbol.`,
      predice: resultado ? `el inorden de este árbol es ${datos.join(', ')}. ¿Es un BST?` : '' });

    if (resultado) {
      // Busca el primer par ancestro-descendiente que viola el orden.
      let par = null;
      const busca = (id, piso, techo) => {
        if (id === null || par) return;
        const x = D(A, id);
        if (techo !== null && x >= D(A, techo)) { par = [techo, id]; return; }
        if (piso !== null && x <= D(A, piso)) { par = [piso, id]; return; }
        busca(A.nodos[id].izq, piso, id);
        busca(A.nodos[id].der, id, techo);
      };
      busca(A.raiz, null, null);
      if (par) {
        T.par = par;
        T.est[par[1]] = 'error';
        T.etq[par[1]] = { t: '✗', cls: 'err' };
        const [anc, des] = par.map(id => D(A, id));
        const lado = des > anc ? 'izquierdo' : 'derecho';
        T.paso({ code: -1, test: `inorden: ${datos.join(', ')} · no está ordenado`,
          say: `No. El ${des} está en el subárbol ${lado} del ${anc} y es ${des > anc ? 'mayor' : 'menor'} que ${anc}. Ninguna llamada compara ese par: cada una mira solo a sus dos hijos.` });
      }
    }
    return T.F;
  }

  /* ---------- validar con cotas: una línea por paso ---------- */
  function trazaValidar(A) {
    const T = nuevaTraza(A);
    const cota = id => id === null ? 'nullptr' : D(A, id);
    const intervalo = (p, t) => `(${p === null ? '−∞' : D(A, p)}, ${t === null ? '+∞' : D(A, t)})`;
    T.chips = [['cotas heredadas', 'ci']];
    T.paso({ code: 0, test: `esBST(${dd(A, A.raiz)}, nullptr, nullptr)`,
      say: `Cada llamada recibe un <b>piso</b> y un <b>techo</b>: el nodo debe quedar estrictamente entre los dos. La llamada inicial no tiene cotas, así que los dos valen nullptr.` });

    let predicho = false;
    function rec(id, piso, techo, origen) {
      const n = A.nodos[id];
      const x = n.dato;
      const m = { nodo: id, fn: `esBST(${x}, ${cota(piso)}, ${cota(techo)})`, info: `debe estar en ${intervalo(piso, techo)}` };
      T.pila.push(m);
      T.etq[id] = { t: intervalo(piso, techo), cls: 'acc' };
      T.chips = [['cotas heredadas', 'ci'], [`intervalo de ${x}: ${intervalo(piso, techo)}`, '']];
      T.paso({ code: [1, 2], test: `n = ${x} · x = ${x}`,
        say: origen + `El ${x} no es nullptr. Su intervalo válido es ${intervalo(piso, techo)}.` });

      // piso
      if (piso === null) {
        T.paso({ code: 3, test: 'piso == nullptr → no hay cota inferior',
          say: `No hay piso: nadie arriba le exige al ${x} ser mayor que algo.` });
      } else {
        const falla = x <= D(A, piso);
        const viene = techo !== null && x >= D(A, techo) && !predicho;
        T.paso({ code: 3, test: `¿${x} <= ${D(A, piso)}?  ${falla ? 'sí' : 'no'}`,
          say: falla ? `El ${x} no supera a su piso, el ${D(A, piso)}.` : `El ${x} es mayor que su piso, el ${D(A, piso)}: pasa la cota inferior.`,
          predice: viene ? `el techo del ${x} es el ${D(A, techo)}. ¿Pasa la siguiente comparación?` : '' });
        if (viene) predicho = true;
        if (falla) {
          T.est[id] = 'error'; T.etq[id] = { t: intervalo(piso, techo), cls: 'err' }; T.par = [piso, id];
          T.paso({ code: 4, test: 'return false',
            say: `<b>El ${x} viola la cota que le impuso el ${D(A, piso)}</b>. Devuelve false.` });
          T.pila.pop();
          return false;
        }
      }
      // techo
      if (techo === null) {
        T.paso({ code: 5, test: 'techo == nullptr → no hay cota superior',
          say: `No hay techo: nadie arriba le exige al ${x} ser menor que algo.` });
      } else {
        const falla = x >= D(A, techo);
        T.paso({ code: 5, test: `¿${x} >= ${D(A, techo)}?  ${falla ? 'sí' : 'no'}`,
          say: falla
            ? `Sí: el ${x} no es menor que su techo, el ${D(A, techo)}. El techo lo impuso un ancestro, no su padre.`
            : `El ${x} es menor que su techo, el ${D(A, techo)}: pasa la cota superior.` });
        if (falla) {
          T.est[id] = 'error'; T.etq[id] = { t: intervalo(piso, techo), cls: 'err' }; T.par = [techo, id];
          T.paso({ code: 6, test: 'return false',
            say: `<b>El ${x} viola la cota que le impuso el ${D(A, techo)}</b>, dos o más niveles arriba. Devuelve false.` });
          T.pila.pop();
          return false;
        }
      }
      T.etq[id] = { t: intervalo(piso, techo), cls: 'ok' };

      // izquierda
      if (n.izq === null) {
        m.info = 'izquierdo: nullptr → true';
        T.paso({ code: 7, test: 'esBST(nullptr, …) → true',
          say: `El izquierdo es nullptr: esa llamada devuelve true en su primera línea.` });
      } else {
        m.info = `espera esBST(${D(A, n.izq)})`;
        const r = rec(n.izq, piso, id,
          `<code>esBST(${x})</code> llama al izquierdo: el ${D(A, n.izq)} hereda el piso ${cota(piso)} y su techo pasa a ser el ${x}. `);
        if (!r) {
          m.info = `esBST(${D(A, n.izq)}) devolvió false`;
          T.est[id] = 'listo';
          T.paso({ code: 7, test: `esBST(${D(A, n.izq)}) devolvió false → return false`,
            say: `De regreso en <code>esBST(${x})</code>: el izquierdo devolvió false, así que esta llamada devuelve false sin revisar la derecha.` });
          T.pila.pop();
          return false;
        }
        m.info = `esBST(${D(A, n.izq)}) devolvió true`;
        T.paso({ code: 7, test: `esBST(${D(A, n.izq)}) devolvió true`,
          say: `De regreso en <code>esBST(${x})</code>: el subárbol izquierdo es válido. Sigue con el derecho.` });
      }
      // derecha
      if (n.der === null) {
        T.est[id] = 'listo';
        T.paso({ code: 8, test: 'esBST(nullptr, …) → true · return true',
          say: `El derecho es nullptr y devuelve true, así que <code>esBST(${x})</code> devuelve true.` });
        T.pila.pop();
        return true;
      }
      m.info = `espera esBST(${D(A, n.der)})`;
      const r = rec(n.der, id, techo,
        `<code>esBST(${x})</code> llama al derecho: el ${D(A, n.der)} hereda el techo ${cota(techo)} y su piso pasa a ser el ${x}. `);
      T.est[id] = 'listo';
      m.info = `esBST(${D(A, n.der)}) devolvió ${r}`;
      T.paso({ code: 8, test: `return esBST(${D(A, n.der)}) → ${r}`,
        say: `De regreso en <code>esBST(${x})</code>: devuelve lo mismo que devolvió el derecho, ${r}.` });
      T.pila.pop();
      return r;
    }
    const r = rec(A.raiz, null, null, '');
    // Lo que no se revisó
    for (const id in A.nodos) if (T.etq[id] === null) { T.est[id] = 'nunca'; }
    T.chips = [[`resultado: ${r}`, r ? 'cok' : 'cj']];
    const sinRevisar = Object.keys(A.nodos).filter(id => T.est[id] === 'nunca').map(id => D(A, id));
    T.paso({ code: -1, test: `esBST(${dd(A, A.raiz)}, nullptr, nullptr) → ${r}`,
      say: r
        ? `El árbol es un BST: cada nodo quedó dentro del intervalo que le impusieron todos sus ancestros. Cada nodo se revisó una vez: O(n).`
        : `La llamada inicial devuelve <b>false</b>. El nodo rojo violó una cota heredada de un ancestro.` +
          (sinRevisar.length ? ` ${sinRevisar.length === 1 ? 'El ' + sinRevisar[0] + ' no se revisó' : 'Los nodos ' + sinRevisar.join(', ') + ' no se revisaron'}: el resultado ya estaba decidido.` : '') });
    return T.F;
  }

  /* ---------- k-ésimo: una llamada por paso ---------- */
  function trazaKesimo(A, k) {
    const T = nuevaTraza(A);
    let vistos = 0, llamadas = 0;
    const llamados = new Set();
    const chips = () => { T.chips = [[`k = ${k}`, 'ci'], [`vistos = ${vistos}`, 'cok'], [`llamadas: ${llamadas} / ${A.n}`, '']]; };
    chips();
    T.paso({ code: 0, test: `kesimo(${dd(A, A.raiz)}, ${k}, vistos = 0)`,
      say: `Buscamos el ${k}.º menor. El recorrido es inorden: cada nodo cuenta primero a los de su izquierda, después a sí mismo, después a los de su derecha. <code>vistos</code> es una referencia: todas las llamadas comparten el mismo contador.` });

    function rec(id, origen) {
      const n = A.nodos[id];
      const m = { nodo: id, fn: `kesimo(${n.dato})`, info: '' };
      T.pila.push(m);
      llamadas++;
      llamados.add(id);
      chips();
      let pre = origen;
      if (n.izq !== null) {
        m.info = `espera kesimo(${D(A, n.izq)})`;
        T.paso({ code: 2, test: `entra a kesimo(${n.dato})`,
          say: origen + `Entra <code>kesimo(${n.dato})</code>. Antes de contarse busca en su subárbol izquierdo, que empieza en el ${D(A, n.izq)}.` });
        const r = rec(n.izq, '');
        if (r !== null) {
          m.info = `izq = ${D(A, r)}`;
          T.paso({ code: 3, test: `izq = ${D(A, r)} → return izq`,
            say: `De regreso en <code>kesimo(${n.dato})</code>: el izquierdo ya encontró la respuesta, el ${D(A, r)}. La devuelve sin contarse y sin mirar su derecha.` });
          T.pila.pop();
          T.est[id] = 'listo';
          return r;
        }
        pre = `De regreso en <code>kesimo(${n.dato})</code>: el izquierdo devolvió nullptr. `;
      } else {
        pre = origen + `Entra <code>kesimo(${n.dato})</code>. Su izquierdo es nullptr. `;
      }
      vistos++;
      chips();
      T.etq[id] = { t: `#${vistos}`, cls: 'acc' };
      if (vistos === k) {
        T.est[id] = 'sale';
        T.etq[id] = { t: `#${vistos}`, cls: 'ok' };
        m.info = `vistos = ${vistos} == k`;
        T.paso({ code: [4, 5], test: `vistos = ${vistos} · ¿${vistos} == ${k}? sí → return n`,
          say: pre + `Se cuenta: <code>vistos</code> pasa a ${vistos}, que es k. <b>El ${n.dato} es el ${k}.º menor</b> y la llamada lo devuelve.` });
        T.pila.pop();
        return id;
      }
      if (n.der === null) {
        m.info = `vistos = ${vistos} · derecho nullptr`;
        T.paso({ code: [4, 5, 6], test: `vistos = ${vistos} · ¿${vistos} == ${k}? no · derecho nullptr`,
          say: pre + `Se cuenta: <code>vistos</code> pasa a ${vistos}, todavía no es ${k}. Su derecho es nullptr, así que devuelve nullptr.` });
        T.pila.pop();
        T.est[id] = 'listo';
        return null;
      }
      m.info = `vistos = ${vistos} · espera kesimo(${D(A, n.der)})`;
      T.paso({ code: [4, 5], test: `vistos = ${vistos} · ¿${vistos} == ${k}? no`,
        say: pre + `Se cuenta: <code>vistos</code> pasa a ${vistos}, todavía no es ${k}. Sigue con su subárbol derecho, el ${D(A, n.der)}.` });
      const r = rec(n.der, '');
      m.info = `derecho devolvió ${r === null ? 'nullptr' : D(A, r)}`;
      T.paso({ code: 6, test: `return kesimo(${D(A, n.der)}) → ${r === null ? 'nullptr' : D(A, r)}`,
        say: `De regreso en <code>kesimo(${n.dato})</code>: devuelve lo que devolvió su derecho, ${r === null ? 'nullptr' : 'el ' + D(A, r)}.` });
      T.pila.pop();
      T.est[id] = 'listo';
      return r;
    }
    const r = rec(A.raiz, '');
    const nunca = [];
    for (const id in A.nodos) if (!llamados.has(id)) { T.est[id] = 'nunca'; nunca.push(D(A, id)); }
    T.chips = [[`${k}.º menor = ${r === null ? '—' : D(A, r)}`, 'cok'], [`llamadas: ${llamadas} / ${A.n}`, 'ci']];
    T.paso({ code: -1, test: `kesimo → ${r === null ? 'nullptr' : D(A, r)}`,
      say: r === null
        ? `El árbol tiene menos de ${k} nodos: la respuesta es nullptr.`
        : `Respuesta: el <b>${D(A, r)}</b>. Hubo ${llamadas} llamadas con nodo de ${A.n}` +
          (nunca.length ? `; ${nunca.length === 1 ? 'el ' + nunca[0] + ' nunca se tocó' : 'los nodos ' + nunca.join(', ') + ' nunca se tocaron'}. El costo es bajar hasta el mínimo y contar k: O(h + k).` : '.') });
    return T.F;
  }

  /* ---------- LCA: una línea por paso ---------- */
  function trazaLca(A, a, b) {
    const T = nuevaTraza(A);
    for (const id in A.nodos) {
      if (D(A, id) === a) T.etq[id] = { t: 'a', cls: 'acc' };
      if (D(A, id) === b) T.etq[id] = { t: 'b', cls: 'acc' };
    }
    let n = A.raiz;
    const m = { nodo: n, fn: `lca(n, ${a}, ${b})`, info: `n = ${dd(A, n)}` };
    T.pila.push(m);
    const set = () => { m.nodo = n; m.info = `n = ${dd(A, n)}`; T.chips = [[`a = ${a}`, 'ci'], [`b = ${b}`, 'ci'], [`n = ${dd(A, n)}`, 'cok']]; };
    set();
    T.paso({ code: 0, test: `lca(${dd(A, n)}, ${a}, ${b})`,
      say: `Buscamos el ancestro común más bajo del ${a} y el ${b}. No hay recursión: un solo puntero <code>n</code> baja desde la raíz.` });
    while (true) {
      T.paso({ code: 1, test: `¿n != nullptr?  ${n !== null ? 'sí' : 'no'}`,
        say: n !== null ? `<code>n</code> apunta al ${D(A, n)}: entra al ciclo.` : `<code>n</code> es nullptr: alguna de las claves no estaba en el árbol.` });
      if (n === null) {
        T.paso({ code: 10, test: 'return nullptr', say: `Devuelve nullptr.` });
        break;
      }
      const x = D(A, n);
      T.paso({ code: 2, test: `x = ${x}`, say: `Se guarda el dato del nodo actual en <code>x</code> para compararlo con las dos claves.` });
      const izq = a < x && b < x;
      T.paso({ code: 3, test: `¿${a} < ${x} y ${b} < ${x}?  ${a < x ? 'sí' : 'no'} · ${b < x ? 'sí' : 'no'}`,
        say: izq ? `Las dos claves son menores que ${x}: las dos están en el subárbol izquierdo, y el ancestro común también.`
                 : `No las dos son menores que ${x}.` });
      if (izq) {
        T.est[n] = 'listo';
        n = A.nodos[n].izq;
        set();
        T.paso({ code: 4, test: `n = n->izq → ${dd(A, n)}`, say: `<code>n</code> baja a la izquierda, al ${dd(A, n)}.` });
        continue;
      }
      const der = a > x && b > x;
      T.paso({ code: 5, test: `¿${a} > ${x} y ${b} > ${x}?  ${a > x ? 'sí' : 'no'} · ${b > x ? 'sí' : 'no'}`,
        say: der ? `Las dos claves son mayores que ${x}: el ancestro común está a la derecha.`
                 : `Tampoco las dos son mayores que ${x}.` });
      if (der) {
        T.est[n] = 'listo';
        n = A.nodos[n].der;
        set();
        T.paso({ code: 6, test: `n = n->der → ${dd(A, n)}`, say: `<code>n</code> baja a la derecha, al ${dd(A, n)}.` });
        continue;
      }
      T.est[n] = 'sale';
      T.etq[n] = { t: T.etq[n] ? T.etq[n].t + ' · LCA' : 'LCA', cls: 'ok' };
      T.paso({ code: 8, test: `return n → ${x}`,
        say: (x === a || x === b)
          ? `Una de las claves es el propio ${x}: el ${x} es ancestro de la otra. <b>El LCA es el ${x}</b>.`
          : `Las claves quedan una a cada lado del ${x}: aquí se separan sus caminos. <b>El LCA es el ${x}</b>.` });
      break;
    }
    const pasados = Object.keys(A.nodos).filter(id => T.est[id] === 'listo' || T.est[id] === 'sale').length;
    T.paso({ code: -1, test: `lca → ${dd(A, n)}`,
      say: `Se visitaron ${pasados} nodos, un solo camino desde la raíz: O(h). Funciona porque el árbol es BST; en un árbol binario cualquiera no se sabe hacia dónde bajar.` });
    return T.F;
  }

  /* ---------- rango: una llamada por paso ---------- */
  function trazaRango(A, a, b) {
    const T = nuevaTraza(A);
    const salida = [];
    let visitados = 0;
    const chips = () => { T.chips = [[`[${a}, ${b}]`, 'ci'], [`visitados: ${visitados} / ${A.n}`, ''], [`salida: ${salida.join(' ') || '(vacía)'}`, 'cok']]; };
    chips();
    T.paso({ code: 0, test: `rango(${dd(A, A.raiz)}, ${a}, ${b}, salida)`,
      say: `Queremos las claves entre ${a} y ${b}, en orden. Cada llamada decide si vale la pena bajar a cada lado antes de bajar.` });
    const podar = id => subarbol(A, id).forEach(x => { T.est[x] = 'podado'; });

    function rec(id, origen) {
      const n = A.nodos[id], x = n.dato;
      const m = { nodo: id, fn: `rango(${x})`, info: '' };
      T.pila.push(m);
      visitados++;
      chips();
      let nota = '';
      // izquierda
      if (a < x) {
        if (n.izq !== null) {
          m.info = `espera rango(${D(A, n.izq)})`;
          T.paso({ code: [3, 4], test: `¿${a} < ${x}? sí → baja a la izquierda`,
            say: origen + `Entra <code>rango(${x})</code>. Como ${a} &lt; ${x}, puede haber claves del rango a su izquierda: baja al ${D(A, n.izq)}.` });
          rec(n.izq, '');
          nota = `De regreso en <code>rango(${x})</code>. `;
        } else {
          nota = origen + `Entra <code>rango(${x})</code>. ${a} &lt; ${x}, pero su izquierdo es nullptr y esa llamada regresa de inmediato. `;
        }
      } else {
        if (n.izq !== null) {
          podar(n.izq);
          m.info = 'izquierda podada';
          T.paso({ code: 3, test: `¿${a} < ${x}? no → poda la izquierda`,
            say: origen + `Entra <code>rango(${x})</code>. ${a} no es menor que ${x}: todo su subárbol izquierdo es menor que ${x} ≤ ${a}. <b>Se descarta sin visitarlo</b>.` });
          nota = '';
        } else {
          nota = origen + `Entra <code>rango(${x})</code>. ${a} no es menor que ${x} y además no tiene izquierdo. `;
        }
      }
      // el propio nodo
      const dentro = a <= x && x <= b;
      let texto = nota + (dentro ? `${a} ≤ ${x} ≤ ${b}: <b>el ${x} va a la salida</b>.` : `El ${x} no está en [${a}, ${b}].`);
      if (dentro) { salida.push(x); T.est[id] = 'sale'; T.etq[id] = { t: '✓', cls: 'ok' }; }
      m.info = dentro ? `${x} → salida` : `${x} fuera del rango`;
      chips();
      const code = dentro ? [5, 6, 7] : [5, 7];
      let test = `¿${a} ≤ ${x} ≤ ${b}? ${dentro ? 'sí' : 'no'} · ¿${x} < ${b}? ${x < b ? 'sí' : 'no'}`;
      if (x < b) {
        if (n.der !== null) {
          m.info = `espera rango(${D(A, n.der)})`;
          T.paso({ code, test, say: texto + ` Como ${x} &lt; ${b}, baja a la derecha, al ${D(A, n.der)}.` });
          rec(n.der, '');
        } else {
          T.paso({ code, test, say: texto + ` ${x} &lt; ${b}, pero su derecho es nullptr. Regresa.` });
        }
      } else {
        if (n.der !== null) {
          podar(n.der);
          m.info = 'derecha podada';
          T.paso({ code, test: test + ' → poda la derecha',
            say: texto + ` ${x} no es menor que ${b}: todo su subárbol derecho es mayor que ${x} ≥ ${b}. <b>Se descarta sin visitarlo</b>.` });
        } else {
          T.paso({ code, test, say: texto + ` No tiene derecho. Regresa.` });
        }
      }
      T.pila.pop();
      if (!dentro) T.est[id] = 'listo';
    }
    rec(A.raiz, '');
    T.chips = [[`[${a}, ${b}]`, 'ci'], [`visitados: ${visitados} / ${A.n}`, ''], [`salida: ${salida.join(' ') || '(vacía)'}`, 'cok']];
    const podados = Object.keys(A.nodos).filter(id => T.est[id] === 'podado').map(id => D(A, id));
    T.paso({ code: -1, test: `rango(${dd(A, A.raiz)}, ${a}, ${b}) terminó · salida: ${salida.join(', ')}`,
      say: `Se visitaron ${visitados} nodos para reportar ${salida.length}` +
        (podados.length ? `; ${podados.join(' y ')} nunca se tocaron` : '') +
        `. El costo son los k reportados más la frontera, a lo más dos caminos de raíz a hoja: O(k + h). La salida sale en orden porque el recorrido es un inorden con condiciones.` });
    return T.F;
  }

  function trazar(alg, A, ds) {
    switch (alg) {
      case 'altura':  return trazaAltura(A);
      case 'ingenuo': return trazaIngenuo(A);
      case 'validar': return trazaValidar(A);
      case 'kesimo':  return trazaKesimo(A, Number(ds.k || 1));
      case 'lca':     return trazaLca(A, Number(ds.a), Number(ds.b));
      case 'rango':   return trazaRango(A, Number(ds.a), Number(ds.b));
    }
    throw new Error('sim-bst: algoritmo desconocido ' + alg);
  }

  /* ---------- Dibujo ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, txt) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (txt !== undefined) e.textContent = txt;
    return e;
  };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function pintarCodigo(linea) {
    return esc(linea)
      .replace(/(\/\/.*)$/, '<span class="cm">$1</span>')
      .replace(/\b(int|bool|void|while|if|else|return|true|false|nullptr)\b/g, '<span class="kw">$1</span>')
      .replace(/\b(altura|esBSTIngenuo|esBST|kesimo|lca|rango|push_back)\b/g, '<span class="fn">$1</span>')
      .replace(/(?<![\w#])(-?\d+)\b/g, '<span class="num">$1</span>');
  }

  let uid = 0;

  function construir(cont) {
    const alg = cont.dataset.alg;
    const A = leerArbol(cont.dataset.arbol || '50,30,70,20,40,60,80');
    const F = trazar(alg, A, cont.dataset);
    const lineasCod = CODIGO[alg].split('\n');
    cont.innerHTML = '';

    // Geometría del árbol
    const W = 500, R = 23, PX = 34, TOP = 30, DY = 74;
    const maxX = Math.max(1, A.n - 1);
    const maxD = Math.max(...Object.values(A.nodos).map(n => n.d));
    const H = TOP + maxD * DY + R + 12;
    const pos = id => ({ x: PX + A.nodos[id].x * ((W - 2 * PX - 70) / maxX), y: TOP + A.nodos[id].d * DY });

    const cuerpo = document.createElement('div');
    cuerpo.className = 'sb-cuerpo';
    const izq = document.createElement('div');
    izq.className = 'sb-izq';
    const pre = document.createElement('pre');
    pre.className = 'sim-codigo sb-codigo';
    pre.innerHTML = lineasCod.map(l => `<div class="sim-linea">${pintarCodigo(l) || ' '}</div>`).join('');
    izq.appendChild(pre);
    const dice = document.createElement('p');
    dice.className = 'sim-dice sb-dice';
    izq.appendChild(dice);

    const der = document.createElement('div');
    der.className = 'sb-der';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sb-svg', preserveAspectRatio: 'xMidYMin meet' });
    const id0 = 'sb' + (++uid);
    svg.innerHTML = `<defs><marker id="${id0}-p" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="10" refX="10" refY="5" orient="auto"><path d="M0,0 L11,5 L0,10 z" class="sb-punta-err"/></marker></defs><g></g>`;
    const capa = svg.querySelector('g');
    der.appendChild(svg);
    const pila = document.createElement('div');
    pila.className = 'sb-pila';
    der.appendChild(pila);

    cuerpo.appendChild(izq);
    cuerpo.appendChild(der);
    cont.appendChild(cuerpo);

    const barra = document.createElement('div');
    barra.className = 'sim-barra';
    barra.innerHTML =
      '<span class="sim-chip"></span><span class="sim-chip"></span><span class="sim-chip"></span>' +
      '<span class="sim-test"></span>' +
      '<span class="sim-ctrl">' +
        '<button type="button" data-ir="-1" aria-label="Paso anterior">◀</button>' +
        '<span class="sim-cont"></span>' +
        '<button type="button" data-ir="1" aria-label="Paso siguiente">▶</button>' +
      '</span>';
    cont.appendChild(barra);
    barra.querySelectorAll('button').forEach(btn => btn.addEventListener('click', ev => {
      ev.stopPropagation();
      if (typeof Reveal === 'undefined') return;
      if (Number(btn.dataset.ir) > 0) Reveal.nextFragment(); else Reveal.prevFragment();
    }));
    const chips = [...barra.querySelectorAll('.sim-chip')];
    const lineas = [...pre.querySelectorAll('.sim-linea')];

    const huecos = document.createElement('span');
    huecos.className = 'sim-fragments';
    for (let k = 1; k < F.length; k++) {
      const f = document.createElement('span');
      f.className = 'fragment';
      f.setAttribute('aria-hidden', 'true');
      huecos.appendChild(f);
    }
    cont.appendChild(huecos);

    function pintar(k) {
      const f = F[Math.max(0, Math.min(k, F.length - 1))];
      capa.innerHTML = '';
      // Aristas
      for (const id in A.nodos) {
        const n = A.nodos[id], p = pos(id);
        [n.izq, n.der].forEach(h => {
          if (h === null) return;
          const q = pos(h);
          const eh = f.est[h], ep = f.est[id];
          let cls = 'sb-arista';
          if (eh === 'podado' || eh === 'nunca') cls += ' tenue';
          else if ((ep === 'pila' || ep === 'activo') && (eh === 'pila' || eh === 'activo')) cls += ' camino';
          if (f.marcas[h]) cls += ' ' + f.marcas[h];
          capa.appendChild(el('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, class: cls }));
        });
      }
      // Par en conflicto (ancestro, descendiente)
      if (f.par) {
        const p = pos(f.par[0]), q = pos(f.par[1]);
        const mx = (p.x + q.x) / 2 + 60, my = (p.y + q.y) / 2;
        capa.appendChild(el('path', { d: `M ${p.x + R * 0.8} ${p.y + R * 0.6} Q ${mx} ${my} ${q.x + R} ${q.y - 4}`,
          class: 'sb-par', 'marker-end': `url(#${id0}-p)` }));
        capa.appendChild(el('circle', { cx: p.x, cy: p.y, r: R + 8, class: 'sb-aro-err' }));
      }
      // Nodos
      for (const id in A.nodos) {
        const p = pos(id);
        const g = el('g', { class: 'sb-nodo' + (f.est[id] ? ' ' + f.est[id] : '') });
        g.appendChild(el('circle', { cx: p.x, cy: p.y, r: R }));
        g.appendChild(el('text', { x: p.x, y: p.y + 7, class: 'sb-dato' }, A.nodos[id].dato));
        const e = f.etq[id];
        if (e) g.appendChild(el('text', { x: p.x + R + 6, y: p.y + 6, class: 'sb-etq' + (e.cls ? ' ' + e.cls : '') }, e.t));
        capa.appendChild(g);
      }
      // Pila de llamadas: la más reciente abajo, como el stack de la sesión 11
      pila.innerHTML = '<div class="sb-pila-tit">Pila de llamadas</div>' +
        (f.pila.length
          ? f.pila.map((m, i) => `<div class="sb-marco${i === f.pila.length - 1 ? ' activo' : ''}"><span class="fn">${esc(m.fn)}</span>${m.info ? `<span class="info">${esc(m.info)}</span>` : ''}</div>`).join('')
          : '<div class="sb-marco vacio">(vacía)</div>');

      chips.forEach((c, i) => {
        const v = f.chips[i];
        c.hidden = !v;
        if (!v) return;
        c.textContent = v[0];
        c.className = 'sim-chip ' + (v[1] || '');
      });
      barra.querySelector('.sim-test').textContent = f.test;
      barra.querySelector('.sim-cont').textContent = `${k + 1} / ${F.length}`;
      dice.innerHTML = f.say + (f.predice ? `<span class="predice"><b>Antes de avanzar:</b> ${f.predice}</span>` : '');
      const act = Array.isArray(f.code) ? f.code : [f.code];
      lineas.forEach((l, i) => l.classList.toggle('on', act.includes(i)));
    }

    cont._simPintar = pintar;
    cont._simTotal = F.length;
    pintar(0);
  }

  function sync() {
    const slide = Reveal.getCurrentSlide();
    if (!slide) return;
    slide.querySelectorAll('.sim-bst').forEach(cont => {
      if (!cont._simPintar) return;
      const vistos = cont.querySelectorAll('.sim-fragments .fragment.visible').length;
      cont._simPintar(vistos);
      const b = cont.querySelectorAll('.sim-ctrl button');
      if (b[0]) b[0].disabled = vistos === 0;
      if (b[1]) b[1].disabled = vistos >= cont._simTotal - 1;
    });
  }

  function init() {
    const sims = document.querySelectorAll('.sim-bst');
    if (!sims.length) return;
    sims.forEach(construir);
    if (typeof Reveal !== 'undefined') {
      if (Reveal.sync) Reveal.sync();
      ['fragmentshown', 'fragmenthidden', 'slidechanged', 'ready']
        .forEach(ev => Reveal.on(ev, () => setTimeout(sync, 0)));
      sync();
    }
  }

  return { init, _trazar: (alg, arbol, ds) => trazar(alg, leerArbol(arbol), ds || {}), _codigo: CODIGO };
})();

if (typeof module !== 'undefined') module.exports = SimArboles;
