/* ============================================================
   SIM-HASH — tablas hash: de la clave a la casilla, encadenamiento
   y direccionamiento abierto (lineal, cuadrático, doble hashing)
   Requiere Reveal.js 5.x y curso-slides.js. Incluir después de
   curso-slides.js y llamar, tras CursoSlides.init(...):

       SimHash.init();

   Uso en HTML:

     <div class="sim-hash" data-alg="concepto"></div>

   data-alg:
     concepto        tabla hash contra arreglo en orden de llegada:
                     insertar, buscar y la primera colisión
     encadenamiento  inserta y contiene con una lista por cubeta,
                     línea por línea (M = 7)
     lineal          inserta con sondeo lineal, línea por línea (M = 7)
     variantes       las mismas claves con sondeo lineal, cuadrático
                     y doble hashing, lado a lado (M = 11)

   Mismo esquema que sim-pilas-filas.js: los pasos salen de ejecutar
   las operaciones sobre un modelo y cada paso es un fragment del
   slide. El código de CODIGO (abajo) debe ser idéntico al de los
   bloques de código del deck.
   ============================================================ */

const SimHash = (() => {

  const CODIGO = {
    inserta: [
      'void inserta(int k) {',
      '    int i = k % M;',
      '    Nodo* nuevo = new Nodo(k);',
      '    nuevo->next = tabla[i];',
      '    tabla[i] = nuevo;',
      '}'
    ],
    contiene: [
      'bool contiene(int k) {',
      '    int i = k % M;',
      '    Nodo* p = tabla[i];',
      '    while (p != nullptr) {',
      '        if (p->dato == k)',
      '            return true;',
      '        p = p->next;',
      '    }',
      '    return false;',
      '}'
    ],
    lineal: [
      'void inserta(int k) {',
      '    int i = 0;',
      '    int pos = k % M;',
      '    while (tabla[pos] != VACIA) {',
      '        i++;',
      '        pos = (k % M + i) % M;',
      '    }',
      '    tabla[pos] = k;',
      '}'
    ]
  };

  const NS = 'http://www.w3.org/2000/svg';
  let uidSig = 0;

  const el = (tag, attrs, txt) => {
    const e = document.createElementNS(NS, tag);
    for (const a in attrs) e.setAttribute(a, attrs[a]);
    if (txt !== undefined) e.textContent = txt;
    return e;
  };
  const copia = o => JSON.parse(JSON.stringify(o));
  const casillas = k => k === 1 ? '1 casilla' : `${k} casillas`;

  function pintarCodigo(linea) {
    const esc = linea.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return esc
      .replace(/(\/\/.*)$/, '<span class="cm">$1</span>')
      .replace(/\b(int|void|bool|while|if|return|new|nullptr|true|false)\b/g, '<span class="kw">$1</span>')
      .replace(/\b(Nodo)\b/g, '<span class="fn">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
  }

  /* ==========================================================
     CONCEPTO: tabla hash contra arreglo en orden de llegada
     ========================================================== */
  function trazarConcepto() {
    const M = 7, F = [];
    const tabla = new Array(M).fill(null);
    const arr = new Array(M).fill(null);
    let n = 0;

    // marcas: { i: estado } para cada tira
    const add = (o, mT, mA) => F.push(Object.assign({
      tiras: [
        { tit: 'Tabla hash: k % 7', datos: tabla.slice(), marcas: mT || {}, ruta: [] },
        { tit: 'Arreglo normal', datos: arr.slice(), marcas: mA || {}, ruta: [] }
      ]
    }, o));

    add({ calc: '', test: '7 casillas vacías en las dos',
      say: `Las dos estructuras guardan enteros en 7 casillas. El arreglo de abajo pone cada clave en la siguiente casilla libre, como hasta ahora. La tabla de arriba calcula la casilla con la propia clave: el residuo de dividirla entre 7.` });

    const inserta = (k, extra) => {
      const c = k % M;
      tabla[c] = k; arr[n] = k;
      const mT = {}, mA = {};
      mT[c] = 'hl'; mA[n] = 'hl';
      n++;
      add(Object.assign({ calc: `${k} % 7 = ${c}      porque ${k} = ${Math.floor(k / M)} · 7 + ${c}`,
        test: `inserta(${k})  →  tabla: casilla ${c}  ·  arreglo: casilla ${n - 1}`,
        say: `${k} entre 7 da ${Math.floor(k / M)} y sobran ${c}. La tabla lo guarda en la casilla ${c}; el arreglo, en la ${n - 1}.` }, extra), mT, mA);
    };
    inserta(10, { say: `10 entre 7 da 1 y sobran 3, así que el 10 va a la casilla 3 de la tabla. El arreglo lo pone en la primera casilla libre, la 0.` });
    inserta(22);
    inserta(5, { say: `5 entre 7 da 0 y sobran 5: casilla 5. Una clave menor que 7 cae en la casilla con su mismo número.` });
    inserta(13, { predice: `para saber si el 13 está guardado, ¿cuántas casillas tiene que mirar cada estructura?` });

    // buscar 13
    {
      const mT = { 6: 'hl' }, mA = { 0: 'visto', 1: 'visto', 2: 'visto', 3: 'hl' };
      add({ calc: '13 % 7 = 6', chips: [['tabla: 1 casilla', 'cok'], ['arreglo: 4 casillas', 'cj']],
        test: 'contiene(13)  →  sí, en las dos',
        say: `La tabla calcula 13 % 7 = 6 y mira solo la casilla 6: ahí está. El arreglo no sabe dónde quedó el 13 y lo busca desde el principio, casilla por casilla, hasta la 3.` }, mT, mA);
    }
    // buscar 8, que no está
    {
      const mT = { 1: 'visto' }, mA = { 0: 'visto', 1: 'visto', 2: 'visto', 3: 'visto' };
      add({ calc: '8 % 7 = 1      en la casilla 1 está el 22', chips: [['tabla: 1 casilla', 'cok'], ['arreglo: 4 casillas', 'cj']],
        test: 'contiene(8)  →  no, en las dos',
        say: `Si el 8 estuviera guardado, estaría en la casilla 1. Ahí está el 22, así que el 8 no está. El arreglo tiene que mirar todas las claves para llegar a la misma respuesta. Con n claves, el arreglo mira hasta n casillas; la tabla, una.` }, mT, mA);
    }
    // la primera colisión
    {
      const mT = { 3: 'choque' };
      add({ calc: '31 % 7 = 3      la casilla 3 ya tiene al 10', chips: [['colisión', 'cj']],
        test: 'inserta(31)  →  casilla 3, ocupada',
        say: `31 entre 7 da 4 y sobran 3: le toca la casilla 3, donde ya está el 10. Dos claves distintas con la misma casilla forman una <b>colisión</b>. La tabla necesita una regla para decidir dónde guarda el 31 y dónde lo busca después.` }, mT, {});
    }
    return { frames: F, tipo: 'concepto' };
  }

  /* ==========================================================
     ENCADENAMIENTO: una lista simple por cubeta
     cub[i] es la lista de la cubeta i, del primer nodo al último
     ========================================================== */
  function trazarEncadenamiento() {
    const M = 7, F = [];
    const cub = Array.from({ length: M }, () => []);
    let i = null, p = null, nuevo = null, visitas = 0;
    // p: { c, k } nodo k de la cubeta c, o { c, nulo: true }
    // nuevo: { k, fase } fase 0 suelto, 1 con next, 2 enlazado

    const chips = () => {
      const c = [];
      c.push([`i = ${i === null ? '—' : i}`, 'ci']);
      if (p) c.push([`p = ${p.nulo ? 'nullptr' : 'el ' + cub[p.c][p.k]}`, 'cok']);
      else if (nuevo) c.push([`nuevo = el ${nuevo.k}`, 'cok']);
      if (visitas) c.push([`nodos visitados = ${visitas}`, 'cj']);
      return c;
    };
    const add = o => F.push(Object.assign({
      cub: copia(cub), i, p: p && copia(p), nuevo: nuevo && copia(nuevo), chips: chips()
    }, o));

    add({ fn: 'inserta', code: -1, test: 'tabla[7]: las 7 cubetas en nullptr',
      say: `Cada casilla de la tabla es la cabeza de una lista simple, como el <code>head</code> de la sesión 12. Todas empiezan en <code>nullptr</code>: hay 7 listas vacías. Las claves que caen en la misma casilla se guardan en la misma lista.` });

    // inserta paso a paso
    const insDetalle = (k, says) => {
      i = k % M;
      add({ fn: 'inserta', code: 1, test: `i = ${k} % 7 = ${i}`, say: says[0] });
      nuevo = { k, fase: 0 };
      add({ fn: 'inserta', code: 2, test: `nuevo = new Nodo(${k})`, say: says[1] });
      nuevo.fase = 1;
      add({ fn: 'inserta', code: 3, test: `nuevo->next = tabla[${i}]`, say: says[2] });
      nuevo.fase = 2;
      add({ fn: 'inserta', code: 4, test: `tabla[${i}] = nuevo`, say: says[3] });
      cub[i].unshift(k); nuevo = null;
    };
    const insRapido = (k, extra) => {
      i = k % M;
      cub[i].unshift(k);
      add(Object.assign({ fn: 'inserta', code: [1, 2, 3, 4], nuevoEn: { c: i },
        test: `inserta(${k}):  i = ${k} % 7 = ${i}`,
        say: `${k} va a la cubeta ${i} y queda al principio de su lista.` }, extra));
    };

    insDetalle(10, [
      `10 % 7 = 3: el 10 va a la cubeta 3.`,
      `Se crea el nodo con el 10. Su constructor deja <code>next</code> en <code>nullptr</code>, y todavía no está en ninguna lista.`,
      `El nodo nuevo apunta a lo que hoy es el primero de la cubeta 3. La cubeta está vacía, así que <code>next</code> queda en <code>nullptr</code>.`,
      `La cubeta 3 apunta al nodo nuevo. Ahora la lista de la cubeta 3 tiene un nodo.`
    ]);
    insRapido(22, { say: `22 % 7 = 1. Las cuatro líneas en un solo paso: el 22 queda solo en la cubeta 1.` });
    insDetalle(31, [
      `31 % 7 = 3, la cubeta del 10. Es la colisión del slide anterior.`,
      `Se crea el nodo con el 31, fuera de la tabla.`,
      `El 31 apunta al primer nodo de la cubeta 3, que es el 10. Hasta aquí la cubeta no ha cambiado.`,
      `La cubeta 3 apunta al 31, y el 31 al 10. El nodo nuevo entró al principio de la lista, como el <code>pushFront</code> de la sesión 12: no hubo que recorrer la lista y la inserción cuesta O(1).`
    ]);
    insRapido(17, { say: `17 % 7 = 3. Otra colisión en la cubeta 3: el 17 queda al principio y la lista mide 3.` });
    insRapido(5, { say: `5 % 7 = 5. La tabla guarda 5 claves en 7 cubetas, y 3 de ellas comparten la cubeta 3.`,
      predice: `para saber si el 10 está guardado, ¿cuántos nodos hay que visitar?` });

    // contiene(10), paso a paso
    const buscar = (k, detalle, cierre) => {
      i = k % M; visitas = 0; p = null;
      if (detalle) add({ fn: 'contiene', code: 1, test: `i = ${k} % 7 = ${i}`,
        say: `Si el ${k} está guardado, está en la lista de la cubeta ${i}. Las demás cubetas no se miran.` });
      p = cub[i].length ? { c: i, k: 0 } : { c: i, nulo: true };
      if (detalle) add({ fn: 'contiene', code: 2, test: `p = tabla[${i}]`,
        say: `<code>p</code> arranca en el primer nodo de la cubeta ${i}. Desde aquí es el recorrido de la sesión 12.` });
      for (;;) {
        if (p.nulo) {
          add({ fn: 'contiene', code: detalle ? [3, 8] : [1, 2, 3, 4, 6, 8],
            test: `p == nullptr  →  return false  ·  ${visitas} ${visitas === 1 ? 'nodo visitado' : 'nodos visitados'}`,
            say: cierre });
          break;
        }
        visitas++;
        const dato = cub[p.c][p.k];
        if (dato === k) {
          add({ fn: 'contiene', code: detalle ? [3, 4, 5] : [1, 2, 3, 4, 5, 6],
            test: `p->dato == ${k}  →  return true  ·  ${visitas} ${visitas === 1 ? 'nodo visitado' : 'nodos visitados'}`,
            say: cierre });
          break;
        }
        if (detalle) add({ fn: 'contiene', code: [3, 4], test: `p->dato = ${dato}  ≠  ${k}`,
          say: `El nodo de <code>p</code> tiene el ${dato}, que no es el ${k}.` });
        p = p.k + 1 < cub[p.c].length ? { c: p.c, k: p.k + 1 } : { c: p.c, nulo: true };
        if (detalle) add({ fn: 'contiene', code: 6, test: 'p = p->next',
          say: `<code>p</code> avanza al siguiente nodo de la misma lista.` });
      }
      p = null;
    };
    buscar(10, true, `El 10 está en el tercer nodo de su lista. Se visitaron 3 nodos porque 3 claves comparten la cubeta 3. El costo de buscar es el largo de una lista, sin importar cuántas claves haya en las otras cubetas.`);
    buscar(24, false, `24 % 7 = 3. Se recorre la lista completa de la cubeta 3, 3 nodos, y <code>p</code> llega a <code>nullptr</code>: el 24 no está. Una búsqueda que falla recorre la lista entera.`);
    buscar(8, false, `8 % 7 = 1. La lista de la cubeta 1 tiene un nodo, el 22, que no es el 8: se visitó 1 nodo y el 8 no está.`);
    i = null; visitas = 0;
    add({ fn: 'contiene', code: -1, test: '5 claves en 7 cubetas  ·  la lista más larga mide 3',
      say: `Mientras las listas sean cortas, insertar y buscar cuestan casi lo mismo que calcular <code>k % M</code>. Si muchas claves caen en la misma cubeta, buscar se vuelve recorrer una lista de n nodos.` });

    return { frames: F, tipo: 'cadenas', M };
  }

  /* ==========================================================
     DIRECCIONAMIENTO ABIERTO: un solo arreglo, sin nodos
     ========================================================== */
  const VACIA = null;
  const formula = {
    lineal: (k, i, M) => (k % M + i) % M,
    cuadratico: (k, i, M) => (k % M + i * i) % M,
    doble: (k, i, M) => (k % M + i * (7 - k % 7)) % M
  };
  const cuenta = {
    lineal: (k, i, M) => `(${k % M} + ${i}) % ${M} = ${formula.lineal(k, i, M)}`,
    cuadratico: (k, i, M) => `(${k % M} + ${i}·${i}) % ${M} = ${formula.cuadratico(k, i, M)}`,
    doble: (k, i, M) => `(${k % M} + ${i}·${7 - k % 7}) % ${M} = ${formula.doble(k, i, M)}`
  };
  // Inserta k y devuelve la ruta de casillas probadas.
  function sondea(tabla, k, tipo) {
    const M = tabla.length, ruta = [];
    let i = 0, pos = k % M;
    ruta.push(pos);
    while (tabla[pos] !== VACIA) {
      i++;
      pos = formula[tipo](k, i, M);
      ruta.push(pos);
    }
    tabla[pos] = k;
    return ruta;
  }

  /* ---------- sondeo lineal, línea por línea ---------- */
  function trazarLineal() {
    const M = 7, F = [];
    const tabla = new Array(M).fill(VACIA);
    let k = null, i = null, pos = null, ruta = [], total = 0;
    const chips = () => [
      [`k = ${k === null ? '—' : k}`, ''],
      [`i = ${i === null ? '—' : i}`, 'ci'],
      [`pos = ${pos === null ? '—' : pos}`, 'cok']];
    const marcas = (fin) => {
      const m = {};
      ruta.forEach((c, j) => { m[c] = j < ruta.length - 1 ? 'choque' : (fin ? 'hl' : 'actual'); });
      return m;
    };
    const add = (o, fin) => F.push(Object.assign({
      tira: { datos: tabla.slice(), marcas: marcas(fin), ruta: ruta.slice() },
      pos, chips: chips(), fn: 'lineal'
    }, o));

    add({ code: -1, test: 'tabla[7]: todas las casillas en VACIA',
      say: `Sin listas: cada casilla guarda una clave o la marca <code>VACIA</code>. Si la casilla de una clave está ocupada, la clave se guarda en otra casilla del mismo arreglo. El <b>sondeo lineal</b> prueba la casilla siguiente, y la siguiente, hasta encontrar una vacía.` });

    const ins = (clave, detalle, extra) => {
      extra = extra || {};
      k = clave; i = 0; pos = k % M; ruta = [pos];
      if (detalle) {
        add({ code: 1, test: 'i = 0', say: extra.s1 || `<code>i</code> cuenta cuántas casillas ocupadas se han brincado.` });
        add({ code: 2, test: `pos = ${k} % 7 = ${pos}`, say: extra.s2 || `La primera casilla que se prueba es la de siempre: ${k} % 7 = ${pos}.` });
      }
      while (tabla[pos] !== VACIA) {
        if (detalle) add({ code: 3, test: `tabla[${pos}] = ${tabla[pos]}  ≠  VACIA  →  sigue`,
          say: `La casilla ${pos} tiene al ${tabla[pos]}. Hay que probar otra.` });
        i++;
        pos = (k % M + i) % M;
        ruta.push(pos);
        if (detalle) add({ code: [4, 5], test: `i = ${i}  ·  pos = (${k % M} + ${i}) % 7 = ${pos}`,
          say: (k % M + i) >= M
            ? `${k % M} + ${i} = ${k % M + i}, y el residuo entre 7 da ${pos}: después de la última casilla se sigue en la primera, como en la fila circular.`
            : `Se prueba la casilla de junto, la ${pos}.` });
      }
      tabla[pos] = k;
      total += ruta.length;
      if (detalle) {
        add({ code: [3, 7], test: `tabla[${pos}] es VACIA  →  tabla[${pos}] = ${k}`,
          say: extra.sFin || `La casilla ${pos} está vacía: el ${k} se guarda ahí. Se probaron ${casillas(ruta.length)}.` }, true);
      } else {
        add({ code: [1, 2, 3, 4, 5, 7], test: `inserta(${k}):  ruta ${ruta.join(' → ')}  ·  ${casillas(ruta.length)}`,
          say: extra.say || `${k} % 7 = ${ruta[0]}. ${ruta.length > 1 ? `Se prueban ${ruta.join(', ')} y entra en la ${pos}.` : 'La casilla está vacía y entra ahí.'}`,
          predice: extra.predice }, true);
      }
    };

    ins(10, false, { say: `10 % 7 = 3 y la casilla 3 está vacía: el ciclo no da ninguna vuelta. Las líneas de una inserción sin choque, en un solo paso.` });
    ins(24, true, {
      s2: `24 % 7 = 3, la casilla del 10.`,
      sFin: `La casilla 4 estaba vacía y el 24 queda ahí, junto al 10. Se probaron 2 casillas.` });
    ins(17, false, { say: `17 % 7 = 3. Prueba la 3 (el 10) y la 4 (el 24), y entra en la 5. Las casillas 3, 4 y 5 ya forman un bloque ocupado.` });
    ins(5, false, { say: `5 % 7 = 5. A esta clave le tocaba la 5, que ocupó el 17 sin ser suya. Choca con el bloque y entra en la 6.`,
      predice: `con las casillas 3, 4, 5 y 6 ocupadas, ¿cuántas casillas prueba el 31? (31 % 7 = 3)` });
    ins(31, true, {
      s2: `31 % 7 = 3, el principio del bloque.`,
      sFin: `El 31 entra en la casilla 0 después de probar 5 casillas. Cada clave que cae en el bloque lo recorre hasta el final y lo alarga una casilla.` });
    k = null; i = null; pos = null; ruta = [];
    add({ code: -1, test: `5 claves, ${total} casillas probadas  ·  4 de las 5 claves empiezan en la casilla 3`,
      say: `Las casillas ocupadas y contiguas forman un <b>cúmulo</b>: cualquier clave que caiga en él lo recorre completo. Mientras más grande es el cúmulo, más claves caen en él y más rápido crece. Las otras dos variantes cambian la línea de <code>pos</code> para no probar siempre la casilla de junto.` });

    return { frames: F, tipo: 'abierta', M, codigo: 'lineal' };
  }

  /* ---------- tres variantes con las mismas claves ---------- */
  function trazarVariantes() {
    const M = 11, F = [];
    const tipos = [
      ['lineal', 'Lineal', 'pos = (k % M + i) % M'],
      ['cuadratico', 'Cuadrático', 'pos = (k % M + i * i) % M'],
      ['doble', 'Doble hashing', 'pos = (k % M + i * h2(k)) % M']
    ];
    const tablas = tipos.map(() => new Array(M).fill(VACIA));
    const totales = [0, 0, 0];
    const add = (rutas, o) => F.push(Object.assign({
      tiras: tipos.map(([t, tit, f], j) => {
        const m = {};
        (rutas[j] || []).forEach((c, q) => { m[c] = q < rutas[j].length - 1 ? 'choque' : 'hl'; });
        return { tit, f, datos: tablas[j].slice(), marcas: m, ruta: rutas[j] || [], total: totales[j],
          detalle: rutas[j] && rutas[j].length ? rutas[j].join(' → ') : '' };
      })
    }, o));

    add([], { test: 'M = 11 · h2(k) = 7 − k % 7 · claves: 3, 14, 25, 36, 4',
      say: `Las tres tablas reciben las mismas claves en el mismo orden. 3, 14, 25 y 36 dejan residuo 3 al dividirlas entre 11: las cuatro empiezan en la casilla 3. Solo cambia la línea que calcula la siguiente casilla.` });

    const claves = [3, 14, 25, 36, 4];
    const says = {
      3: `El 3 entra en la casilla 3 en las tres tablas: no hubo choque.`,
      14: `El 14 choca con el 3. Lineal y cuadrático prueban la 4 (con i = 1, sumar i y sumar i·i da lo mismo). Doble hashing salta 7 casillas, porque h2(14) = 7 − 0 = 7, y cae en la 10.`,
      25: `Lineal sigue a la de junto y llega a la 5. Cuadrático prueba 3 + 1 y luego 3 + 4 = 7. Doble hashing usa h2(25) = 3 y cae en la 6.`,
      36: `Lineal recorre 3, 4, 5 y 6. Cuadrático repite exactamente la ruta del 25, porque las dos claves empiezan en la 3. Doble hashing salta 6, h2(36) = 6, y entra al segundo intento.`,
      4: `Al 4 le toca la casilla 4. En lineal y en cuadrático ya la ocupó el 14, que venía de la 3; en lineal el 4 cruza todo el bloque hasta la 7. En doble hashing la 4 sigue libre.`
    };
    claves.forEach((k, q) => {
      const rutas = tipos.map(([t], j) => {
        const r = sondea(tablas[j], k, t);
        totales[j] += r.length;
        return r;
      });
      add(rutas, { test: `inserta(${k})  ·  ${k} % 11 = ${k % 11}  ·  h2(${k}) = ${7 - k % 7}`, say: says[k],
        predice: k === 25 ? `el 36 también empieza en la 3. ¿Qué ruta va a seguir en la tabla cuadrática?` : undefined });
    });

    add([], { test: `casillas probadas en total:  lineal ${totales[0]}  ·  cuadrático ${totales[1]}  ·  doble ${totales[2]}`,
      say: `Lineal formó un bloque de 5 casillas seguidas. Cuadrático lo rompió, pero las claves con la misma casilla inicial siguen todas la misma ruta. Doble hashing le da a cada clave su propio salto, y las rutas se separan desde el segundo intento.` });

    return { frames: F, tipo: 'variantes', M };
  }

  function trazar(alg) {
    return alg === 'concepto' ? trazarConcepto()
         : alg === 'encadenamiento' ? trazarEncadenamiento()
         : alg === 'lineal' ? trazarLineal()
         : trazarVariantes();
  }

  /* ==========================================================
     DIBUJO
     ========================================================== */

  // Tira de casillas con la ruta de sondeo dibujada como arcos encima.
  // g: { x0, y0, cw, ch, paso, val } geometría
  function dibujarTira(capa, t, g, uid) {
    const yC = g.y0;
    // arcos de la ruta
    for (let j = 1; j < t.ruta.length; j++) {
      const a = t.ruta[j - 1], b = t.ruta[j];
      const xa = g.x0 + a * g.paso + g.cw / 2, xb = g.x0 + b * g.paso + g.cw / 2;
      const d = Math.abs(b - a);
      const h = Math.min(g.arco, 12 + d * g.arco / 6);
      capa.appendChild(el('path', {
        d: `M ${xa} ${yC - 4} C ${xa} ${yC - 4 - h}, ${xb} ${yC - 4 - h}, ${xb} ${yC - 6}`,
        class: 'sh-arco', 'marker-end': `url(#${uid}-r)` }));
      capa.appendChild(el('text', { x: (xa + xb) / 2, y: yC - 8 - h * 0.75, class: 'sh-arco-n' }, `i=${j}`));
    }
    t.datos.forEach((v, i) => {
      const x = g.x0 + i * g.paso;
      const est = t.marcas[i] || (v === null ? '' : 'ocupada');
      const grupo = el('g', { class: 'pf-celda ' + est });
      grupo.appendChild(el('rect', { x, y: yC, width: g.cw, height: g.ch, rx: 7 }));
      if (v !== null) grupo.appendChild(el('text', { x: x + g.cw / 2, y: yC + g.ch / 2 + g.val * 0.36,
        class: 'pf-val', style: `font-size:${g.val}px` }, v));
      capa.appendChild(grupo);
      capa.appendChild(el('text', { x: x + g.cw / 2, y: yC + g.ch + g.idx + 2, class: 'pf-idx',
        style: `font-size:${g.idx}px` }, i));
    });
  }

  function dibujarConcepto(capa, f, uid) {
    const g = { x0: 330, cw: 84, ch: 60, paso: 98, val: 28, idx: 18, arco: 30 };
    f.tiras.forEach((t, j) => {
      const y0 = 20 + j * 112;
      capa.appendChild(el('text', { x: 0, y: y0 + 37, class: 'pf-tit' }, t.tit));
      dibujarTira(capa, t, Object.assign({ y0 }, g), uid);
    });
    if (f.calc) capa.appendChild(el('text', { x: 0, y: 270, class: 'sh-calc' }, f.calc));
  }

  function dibujarAbierta(capa, f, uid, M) {
    const g = { x0: 24, y0: 74, cw: 84, ch: 60, paso: 98, val: 28, idx: 18, arco: 52 };
    dibujarTira(capa, f.tira, g, uid);
    if (f.pos !== null && f.pos !== undefined) {
      const cx = g.x0 + f.pos * g.paso + g.cw / 2, y = g.y0 + g.ch + 30, w = 48;
      const tg = el('g', { class: 'sl-ptr pp' });
      tg.appendChild(el('rect', { x: cx - w / 2, y, width: w, height: 25, rx: 6 }));
      tg.appendChild(el('text', { x: cx, y: y + 18 }, 'pos'));
      capa.appendChild(tg);
    }
    // la marca VACIA en la leyenda
    capa.appendChild(el('text', { x: g.x0 + M * g.paso + 6, y: g.y0 + 26, class: 'sh-ley' }, 'casilla sin dato'));
    capa.appendChild(el('text', { x: g.x0 + M * g.paso + 6, y: g.y0 + 50, class: 'sh-ley' }, '= VACIA'));
  }

  function dibujarVariantes(capa, f, uid, M) {
    const g = { x0: 292, cw: 58, ch: 46, paso: 66, val: 22, idx: 15, arco: 34 };
    f.tiras.forEach((t, j) => {
      const y0 = 58 + j * 122;
      if (j > 0) capa.appendChild(el('line', { x1: 0, y1: y0 - 54, x2: 1180, y2: y0 - 54, class: 'pf-sep' }));
      capa.appendChild(el('text', { x: 0, y: y0 + 4, class: 'pf-tit' }, t.tit));
      capa.appendChild(el('text', { x: 0, y: y0 + 30, class: 'sh-formula' }, t.f));
      capa.appendChild(el('text', { x: 0, y: y0 + 54, class: 'sh-ruta' }, t.detalle ? 'ruta ' + t.detalle : ''));
      dibujarTira(capa, t, Object.assign({ y0 }, g), uid);
      capa.appendChild(el('text', { x: 1180, y: y0 + 30, class: 'pf-costo' }, `${t.total} probadas`));
    });
  }

  // Cubetas en fila; la lista de cada cubeta cuelga hacia abajo.
  const CX0 = 22, CPASO = 80, CW = 64, CY = 32, CH = 42, NY = 108, NH = 40, NPASO = 64;
  function dibujarCadenas(capa, f, uid, M) {
    const xCol = c => CX0 + c * CPASO;
    const yNodo = k => NY + k * NPASO;
    const xSuelto = CX0 + M * CPASO + 10;
    // el nodo nuevo antes de entrar a la lista se dibuja aparte, a la derecha
    const nuevoSuelto = !!f.nuevo;

    const punta = (x1, y1, x2, y2, cls, mk) => capa.appendChild(el('line',
      { x1, y1, x2, y2, class: cls, 'marker-end': `url(#${uid}-${mk})` }));
    const nulo = (x, y, cls) => capa.appendChild(el('line', { x1: x, y1: y + 14, x2: x + 16, y2: y - 4, class: 'sl-nulo' + (cls ? ' ' + cls : '') }));

    for (let c = 0; c < M; c++) {
      const x = xCol(c);
      const esI = f.i === c;
      capa.appendChild(el('text', { x: x + CW / 2, y: CY - 10, class: 'pf-idx' + (esI ? ' sh-idx-on' : '') }, c));
      const g = el('g', { class: 'sh-cubeta' + (esI ? ' on' : '') });
      g.appendChild(el('rect', { x, y: CY, width: CW, height: CH, rx: 7 }));
      capa.appendChild(g);
      const lista = f.cub[c];
      // a dónde apunta la cubeta
      let destino = lista.length ? 'lista' : null;
      if (nuevoSuelto && f.nuevo.fase === 2 && c === f.i) destino = 'nuevo';
      capa.appendChild(el('circle', { cx: x + CW / 2, cy: CY + CH / 2, r: 4.5, class: 'sh-dot' }));
      if (destino === 'lista') {
        punta(x + CW / 2, CY + CH / 2, x + CW / 2, NY - 3, 'sl-flecha', 'a');
      } else if (destino === 'nuevo') {
        punta(x + CW / 2, CY + CH / 2, xSuelto + 4, yNodo(0) + 6, 'sl-flecha nueva', 'b');
      } else {
        nulo(x + CW / 2 + 4, CY + CH / 2 - 4, '');
      }
      // nodos
      lista.forEach((dato, k) => {
        const y = yNodo(k);
        let est = '';
        if (f.p && !f.p.nulo && f.p.c === c && f.p.k === k) est = 'hl';
        if (f.nuevoEn && f.nuevoEn.c === c && k === 0) est = 'nuevo';
        dibujarNodo(capa, x, y, dato, est, k === lista.length - 1 ? 'nulo' : 'abajo', punta, nulo);
        if (f.p && !f.p.nulo && f.p.c === c && f.p.k === k) etiqueta(capa, x, y - 25, 'p', 'pn');
      });
      if (f.p && f.p.nulo && f.p.c === c) {
        const y = yNodo(lista.length) - 14;
        etiqueta(capa, x, y, 'p = nullptr', 'pn');
      }
    }
    if (nuevoSuelto) {
      const x = xSuelto, y = yNodo(0);
      // fase 0: next en nullptr (constructor); fase >= 1: next = primero de la cubeta
      const lista = f.cub[f.i];
      const apunta = f.nuevo.fase >= 1 && lista.length > 0;
      const sig = apunta ? 'ninguno' : (f.nuevo.fase === 1 ? 'nulo-nueva' : 'nulo');
      dibujarNodo(capa, x, y, f.nuevo.k, 'nuevo', sig, punta, nulo);
      if (apunta)
        punta(x + 52, y + NH / 2, xCol(f.i) + CW + 2, yNodo(0) + NH / 2,
          'sl-flecha' + (f.nuevo.fase === 1 ? ' nueva' : ''), f.nuevo.fase === 1 ? 'b' : 'a');
      etiqueta(capa, x, y - 25, 'nuevo', 'pp');
    }
  }
  // sig: 'abajo' (flecha al nodo de abajo), 'nulo', 'nulo-nueva' (recién asignado) o 'ninguno'
  function dibujarNodo(capa, x, y, dato, est, sig, punta, nulo) {
    const g = el('g', { class: 'sl-nodo' + (est ? ' ' + est : '') });
    g.appendChild(el('rect', { x, y, width: CW, height: NH, rx: 7, class: 'caja' }));
    g.appendChild(el('line', { x1: x + 40, y1: y, x2: x + 40, y2: y + NH, class: 'div' }));
    g.appendChild(el('text', { x: x + 20, y: y + NH / 2 + 8, class: 'dato', style: 'font-size:22px' }, dato));
    g.appendChild(el('circle', { cx: x + 52, cy: y + NH / 2, r: 4, class: 'raiz' }));
    capa.appendChild(g);
    if (sig === 'nulo') nulo(x + 44, y + NH / 2 - 4, '');
    else if (sig === 'nulo-nueva') nulo(x + 44, y + NH / 2 - 4, 'nueva');
    else if (sig === 'abajo') punta(x + 52, y + NH / 2, x + 52, y + NPASO - 3, 'sl-flecha', 'a');
  }
  function etiqueta(capa, x, y, nom, cls) {
    const w = 14 + nom.length * 9.5;
    const g = el('g', { class: 'sl-ptr sh-ptr ' + cls });
    g.appendChild(el('rect', { x, y, width: w, height: 22, rx: 5 }));
    g.appendChild(el('text', { x: x + w / 2, y: y + 16 }, nom));
    capa.appendChild(g);
  }

  /* ==========================================================
     CASCARÓN: SVG + barra + código/explicación + fragments
     ========================================================== */
  function construir(cont) {
    const alg = cont.dataset.alg || 'concepto';
    const run = trazar(alg);
    const uid = 'sh' + (++uidSig);
    const F = run.frames;
    cont.innerHTML = '';

    const medidas = {
      concepto: [1180, 284], cadenas: [664, 318], abierta: [1180, 200], variantes: [1180, 372]
    }[run.tipo];
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${medidas[0]} ${medidas[1]}`);
    svg.setAttribute('class', 'sh-svg sh-' + run.tipo);
    svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    const punta = (id, cls) =>
      `<marker id="${uid}-${id}" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto"><path d="M0,0 L13,6 L0,12 z" class="${cls}"/></marker>`;
    svg.innerHTML = '<defs>' + punta('a', 'sl-punta') + punta('b', 'sl-punta nueva') +
      punta('r', 'sh-punta-ruta') + '</defs><g class="sh-capa"></g>';
    const capa = svg.querySelector('.sh-capa');

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
    const chips = [...barra.querySelectorAll('.sim-chip')];

    const conCodigo = run.tipo === 'cadenas' || run.tipo === 'abierta';
    let pre = null, fnActual = null, lineas = [];
    if (conCodigo) {
      pre = document.createElement('pre');
      pre.className = 'sim-codigo sh-codigo';
    }
    const dice = document.createElement('p');
    dice.className = 'sim-dice sh-dice';

    if (run.tipo === 'cadenas') {
      // tabla a la izquierda, código a la derecha; abajo la barra y la explicación
      const fila = document.createElement('div');
      fila.className = 'sh-fila';
      fila.appendChild(svg);
      fila.appendChild(pre);
      cont.appendChild(fila);
      cont.appendChild(barra);
      cont.appendChild(dice);
    } else {
      cont.appendChild(svg);
      cont.appendChild(barra);
      const abajo = document.createElement('div');
      abajo.className = 'sim-abajo';
      if (pre) abajo.appendChild(pre);
      abajo.appendChild(dice);
      cont.appendChild(abajo);
    }

    const ponerCodigo = nombre => {
      if (!pre || nombre === fnActual) return;
      fnActual = nombre;
      pre.innerHTML = CODIGO[nombre].map(l => `<div class="sim-linea">${pintarCodigo(l)}</div>`).join('');
      lineas = [...pre.querySelectorAll('.sim-linea')];
    };
    if (run.codigo) ponerCodigo(run.codigo);
    if (run.tipo === 'cadenas') ponerCodigo('contiene');   // el más largo fija el alto

    const huecos = document.createElement('span');
    huecos.className = 'sim-fragments';
    for (let k = 1; k < F.length; k++) {
      const s = document.createElement('span');
      s.className = 'fragment';
      s.setAttribute('aria-hidden', 'true');
      huecos.appendChild(s);
    }
    cont.appendChild(huecos);

    function pintar(k) {
      const f = F[Math.max(0, Math.min(k, F.length - 1))];
      capa.innerHTML = '';
      if (run.tipo === 'concepto') dibujarConcepto(capa, f, uid);
      else if (run.tipo === 'cadenas') dibujarCadenas(capa, f, uid, run.M);
      else if (run.tipo === 'abierta') dibujarAbierta(capa, f, uid, run.M);
      else dibujarVariantes(capa, f, uid, run.M);

      chips.forEach((c, i) => {
        const v = f.chips && f.chips[i];
        c.hidden = !v;
        if (!v) return;
        c.textContent = v[0];
        c.className = 'sim-chip ' + (v[1] || '');
      });
      barra.querySelector('.sim-test').textContent = f.test || '';
      barra.querySelector('.sim-cont').textContent = `${k + 1} / ${F.length}`;
      dice.innerHTML = f.say + (f.predice ? `<span class="predice"><b>Antes de avanzar:</b> ${f.predice}</span>` : '');
      if (pre) {
        if (f.fn) ponerCodigo(f.fn);
        const act = Array.isArray(f.code) ? f.code : [f.code];
        lineas.forEach((l, i) => l.classList.toggle('on', act.includes(i)));
      }
    }

    barra.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', ev => {
        ev.stopPropagation();
        if (typeof Reveal === 'undefined') return;
        if (Number(b.dataset.ir) > 0) Reveal.nextFragment(); else Reveal.prevFragment();
      });
    });

    cont._simPintar = pintar;
    cont._simTotal = F.length;
    pintar(0);
  }

  function sync() {
    const slide = Reveal.getCurrentSlide();
    if (!slide) return;
    slide.querySelectorAll('.sim-hash').forEach(cont => {
      if (!cont._simPintar) return;
      const vistos = cont.querySelectorAll('.sim-fragments .fragment.visible').length;
      cont._simPintar(vistos);
      const b = cont.querySelectorAll('.sim-ctrl button');
      if (b[0]) b[0].disabled = vistos === 0;
      if (b[1]) b[1].disabled = vistos >= cont._simTotal - 1;
    });
  }

  function init() {
    const sims = document.querySelectorAll('.sim-hash');
    if (!sims.length) return;
    sims.forEach(construir);
    if (typeof Reveal !== 'undefined') {
      if (Reveal.sync) Reveal.sync();
      ['fragmentshown', 'fragmenthidden', 'slidechanged', 'ready']
        .forEach(ev => Reveal.on(ev, () => setTimeout(sync, 0)));
      sync();
    }
  }

  return { init, _trazar: trazar, _codigo: CODIGO };
})();

if (typeof module !== 'undefined') module.exports = SimHash;
