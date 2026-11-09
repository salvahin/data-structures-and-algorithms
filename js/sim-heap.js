/* ============================================================
   SIM-HEAP — heap binario paso a paso: el árbol y el arreglo a la vez
   Requiere Reveal.js 5.x y curso-slides.js. Incluir después de
   curso-slides.js y llamar, tras CursoSlides.init(...):

       SimHeap.init();

   Uso en HTML:

     <div class="sim-heap" data-alg="pop"
          data-datos="90,70,85,30,50,60,80"></div>

   data-alg:
     indices    árbol ↔ arreglo: hijos y padre de cada índice
     push       push(x) y subir, línea por línea      (data-x)
     pop        pop() y bajar, línea por línea
     construir  build-heap, una llamada a bajar por paso, con la
                tabla de intercambios por altura
     heapsort   Heap Sort, un paso por intercambio y otro por bajar
     topk       top-k con un min-heap portero, un elemento del
                stream por paso                      (data-k)
   data-datos: el arreglo inicial (para topk, el stream).

   Los pasos salen de ejecutar las operaciones sobre el arreglo:
   cambiar data-datos cambia el trazado completo. Un paso = un
   fragment del slide. Las aristas en rojo marcan, en cada paso,
   dónde se viola la propiedad de heap.

   El código (CODIGO, abajo) se genera desde la misma fuente que
   los bloques de código del deck: deben ser idénticos.
   ============================================================ */

const SimHeap = (() => {

  const CODIGO = {
      "clase": "class Heap {\n    std::vector<int> datos;\n    void subir(int i);\n    void bajar(int i, int n);\npublic:\n    void push(int x);\n    void pop();\n    int top() { return datos[0]; }\n    int size() { return datos.size(); }\n    void construir();\n    void heapSort();\n};",
      "push": "void Heap::push(int x) {\n    datos.push_back(x);\n    int n = datos.size();\n    subir(n - 1);\n}\nvoid Heap::subir(int i) {\n    if (i == 0) return;\n    int p = (i - 1) / 2;\n    if (datos[p] >= datos[i]) return;\n    std::swap(datos[p], datos[i]);\n    subir(p);\n}",
      "pop": "void Heap::pop() {\n    datos[0] = datos.back();\n    datos.pop_back();\n    bajar(0, datos.size());\n}\nvoid Heap::bajar(int i, int n) {\n    int mayor = i;\n    int izq = 2 * i + 1;\n    int der = 2 * i + 2;\n    if (izq < n && datos[izq] > datos[mayor])\n        mayor = izq;\n    if (der < n && datos[der] > datos[mayor])\n        mayor = der;\n    if (mayor == i) return;\n    std::swap(datos[i], datos[mayor]);\n    bajar(mayor, n);\n}",
      "construir": "void Heap::construir() {\n    int n = datos.size();\n    for (int i = n / 2 - 1; i >= 0; i--)\n        bajar(i, n);\n}",
      "heapsort": "void Heap::heapSort() {\n    construir();\n    int n = datos.size();\n    for (int fin = n - 1; fin > 0; fin--) {\n        std::swap(datos[0], datos[fin]);\n        bajar(0, fin);\n    }\n}",
      "topk": "// portero: min-heap de a lo más k elementos;\n// su raíz es el menor de los k mejores\nvoid topK(std::vector<int>& v, int k,\n          HeapMin& portero) {\n    for (int x : v) {\n        if (portero.size() < k) {\n            portero.push(x);\n        } else if (x > portero.top()) {\n            portero.pop();\n            portero.push(x);\n        }\n    }\n}",
      "min": "// HeapMin: igual que Heap, salvo tres\n// comparaciones. En subir:\n    if (datos[p] <= datos[i]) return;\n// En bajar (mayor pasa a llamarse menor):\n    if (izq < n && datos[izq] < datos[menor])\n        menor = izq;\n    if (der < n && datos[der] < datos[menor])\n        menor = der;"
  };

  /* ---------- Traza ----------
     Cada foto guarda el arreglo y lo que se marca en él.
     est:     índice → activo · comp · mayor · nuevo · listo · movido
     flecha:  [a, b] intercambio que ocurre en este paso
     fin:     las celdas desde fin en adelante ya no son parte del
              heap (zona ordenada de Heap Sort, celdas vacías) */
  function nuevaTraza(arr, opts) {
    const T = {
      arr: arr.slice(), cap: opts.cap || arr.length, modo: opts.modo || 'max',
      est: {}, flecha: null, fin: null, chips: [], calc: null, tabla: null,
      stream: null, sale: null, F: [],
      paso(o) {
        T.F.push(Object.assign({
          arr: T.arr.slice(), est: Object.assign({}, T.est), flecha: T.flecha ? T.flecha.map(x => x.slice()) : null,
          fin: T.fin === null ? T.arr.length : T.fin,
          chips: T.chips.map(c => c.slice()), calc: T.calc ? T.calc.map(c => Object.assign({}, c)) : null,
          tabla: T.tabla ? JSON.parse(JSON.stringify(T.tabla)) : null,
          stream: T.stream ? JSON.parse(JSON.stringify(T.stream)) : null,
          sale: T.sale,
          code: -1, test: '', say: '', predice: ''
        }, o));
      }
    };
    return T;
  }

  const P = i => Math.floor((i - 1) / 2);

  /* ---------- árbol ↔ arreglo ---------- */
  function trazaIndices(arr) {
    const T = nuevaTraza(arr, {});
    const n = arr.length;
    T.calc = [
      { t: `n = ${n}` },
      { t: 'izquierdo: 2i + 1' },
      { t: 'derecho: 2i + 2' },
      { t: 'padre: (i − 1) / 2' }
    ];
    T.paso({ test: `n = ${n}`,
      say: `Se numeran los nodos por niveles, de izquierda a derecha, empezando en 0. El nodo con número i se guarda en la celda i. Como el árbol es completo, no queda ninguna celda vacía.` });
    for (let i = 0; i < n; i++) {
      T.est = { [i]: 'activo' };
      const a = 2 * i + 1, b = 2 * i + 2;
      if (a < n) T.est[a] = 'comp';
      if (b < n) T.est[b] = 'comp';
      if (i > 0) T.est[P(i)] = 'mayor';
      T.calc = [
        { t: `i = ${i}`, cls: 'acc' },
        { t: `izquierdo: 2·${i} + 1 = ${a}` + (a < n ? '' : `  ≥ n`), cls: a < n ? 'hijo' : 'nada' },
        { t: `derecho: 2·${i} + 2 = ${b}` + (b < n ? '' : `  ≥ n`), cls: b < n ? 'hijo' : 'nada' },
        { t: i > 0 ? `padre: (${i} − 1) / 2 = ${P(i)}` : 'padre: la raíz no tiene', cls: i > 0 ? 'padre' : 'nada' }
      ];
      let say;
      if (i === 0) say = `La raíz está en la celda 0. Sus hijos están en las celdas 1 y 2.`;
      else if (a >= n) say = `El ${arr[i]} está en la celda ${i}. ${a} ya no es un índice válido (n = ${n}): es hoja. Su padre está en la celda ${P(i)}, porque la división es entera.`;
      else if (b >= n) say = `El ${arr[i]} está en la celda ${i}. Tiene hijo izquierdo en la celda ${a}; la celda ${b} no existe. Su padre está en la celda ${P(i)}.`;
      else say = `El ${arr[i]} está en la celda ${i}. Sus hijos están en las celdas ${a} y ${b}; su padre, en la ${P(i)}.`;
      T.paso({ test: `i = ${i} · hijos ${a < n ? a : '—'}${b < n ? ', ' + b : ''} · padre ${i > 0 ? P(i) : '—'}`, say });
    }
    const ult = Math.floor(n / 2) - 1;
    T.est = {};
    for (let i = 0; i <= ult; i++) T.est[i] = 'comp';
    T.calc = [
      { t: `n = ${n}` },
      { t: `último padre: n / 2 − 1 = ${ult}`, cls: 'acc' },
      { t: `de ${ult + 1} a ${n - 1}: hojas` }
    ];
    T.paso({ test: `celdas 0…${ult}: padres · ${ult + 1}…${n - 1}: hojas`,
      say: `Las celdas con hijos son las primeras ${ult + 1}: del 0 al ${ult} = n / 2 − 1. Todas las demás son hojas. Este dato se usa al construir un heap.` });
    return T.F;
  }

  /* ---------- push + subir, línea por línea ----------
     Líneas: 0 push · 1 push_back · 2 n = · 3 subir(n − 1) · 4 }
             5 subir · 6 if i == 0 · 7 p = · 8 if ≥ · 9 swap · 10 subir(p) */
  function trazaPush(arr, x) {
    const T = nuevaTraza(arr, { cap: arr.length + 1 });
    let swaps = 0;
    const chips = () => { T.chips = [[`n = ${T.arr.length}`, 'ci'], [`intercambios: ${swaps}`, 'cok']]; };
    chips();
    T.paso({ code: 0, test: `push(${x})`,
      say: `El arreglo ya es un max-heap. Vamos a insertar el ${x} sin romper la propiedad de heap.` });
    T.arr.push(x);
    const i0 = T.arr.length - 1;
    T.est = { [i0]: 'nuevo' };
    chips();
    T.paso({ code: 1, test: `datos.push_back(${x}) → celda ${i0}`,
      say: `El ${x} entra en la primera celda libre, la ${i0}. El árbol sigue completo, pero la arista roja indica que el ${x} puede ser mayor que su padre.` });
    const n = T.arr.length;
    T.paso({ code: 2, test: `n = ${n}`, say: `Ahora el heap tiene ${n} elementos.` });
    T.paso({ code: 3, test: `subir(${n - 1})`, say: `<code>subir</code> recibe el índice del recién llegado, ${n - 1}.` });
    let i = n - 1;
    while (true) {
      T.est = { [i]: 'activo' };
      T.flecha = null;
      T.paso({ code: 6, test: `subir(${i}) · ¿${i} == 0? ${i === 0 ? 'sí' : 'no'}`,
        say: i === 0 ? `El ${T.arr[i]} llegó a la raíz: ya no hay padre con quien comparar.` : `El ${T.arr[i]} está en la celda ${i}, no en la raíz: tiene padre.` });
      if (i === 0) { T.est = { 0: 'listo' }; break; }
      const p = P(i);
      T.est = { [i]: 'activo', [p]: 'comp' };
      T.paso({ code: 7, test: `p = (${i} − 1) / 2 = ${p}`, say: `Su padre está en la celda ${p}: el ${T.arr[p]}.`,
        predice: swaps === 0 ? `¿el ${T.arr[i]} tiene que subir?` : '' });
      const para = T.arr[p] >= T.arr[i];
      T.paso({ code: 8, test: `¿${T.arr[p]} >= ${T.arr[i]}? ${para ? 'sí → return' : 'no'}`,
        say: para ? `El padre ${T.arr[p]} es mayor o igual que el ${T.arr[i]}: la propiedad de heap ya se cumple y <code>subir</code> termina.`
                  : `El padre ${T.arr[p]} es menor que el ${T.arr[i]}: la propiedad de heap no se cumple en esta arista.` });
      if (para) { T.est = { [i]: 'listo' }; break; }
      T.flecha = [[p, i]];
      [T.arr[p], T.arr[i]] = [T.arr[i], T.arr[p]];
      swaps++;
      chips();
      T.est = { [p]: 'movido', [i]: 'movido' };
      T.paso({ code: 9, test: `swap(datos[${p}], datos[${i}])`,
        say: `Se intercambian: el ${T.arr[p]} sube a la celda ${p} y el ${T.arr[i]} baja a la ${i}. Se mueve en el árbol y en el arreglo a la vez.` });
      T.flecha = null;
      T.est = { [p]: 'activo' };
      T.paso({ code: 10, test: `subir(${p})`, say: `Se repite desde la celda ${p}, un nivel más arriba.` });
      i = p;
    }
    T.flecha = null;
    chips();
    const h = Math.floor(Math.log2(n));
    T.paso({ code: -1, test: `push(${x}) terminó · ${swaps} intercambio${swaps === 1 ? '' : 's'}`,
      say: `Listo: ${swaps} intercambio${swaps === 1 ? '' : 's'}. Cada intercambio sube un nivel, y el árbol tiene altura ${h}: a lo más ${h} intercambios, O(log n).` });
    return T.F;
  }

  /* ---------- pop + bajar, línea por línea ----------
     Líneas: 0 pop · 1 datos[0] = back · 2 pop_back · 3 bajar(0, size) · 4 }
             5 bajar · 6 mayor = i · 7 izq · 8 der · 9 if izq · 10 mayor = izq
             11 if der · 12 mayor = der · 13 if mayor == i · 14 swap · 15 bajar(mayor) */
  function trazaPop(arr) {
    const T = nuevaTraza(arr, {});
    let swaps = 0;
    const chips = () => { T.chips = [[`n = ${T.arr.length}`, 'ci'], [`intercambios: ${swaps}`, 'cok']]; };
    chips();
    T.est = { 0: 'activo' };
    T.paso({ code: 0, test: `pop() · top = ${T.arr[0]}`,
      say: `<code>pop</code> quita la raíz, el ${T.arr[0]}, que es el máximo. No se puede dejar un hueco arriba: el árbol tiene que seguir completo.` });
    const ult = T.arr.length - 1;
    T.sale = T.arr[0];
    T.est = { 0: 'nuevo', [ult]: 'comp' };
    T.flecha = [[ult, 0, 'copia']];
    T.arr[0] = T.arr[ult];
    T.paso({ code: 1, test: `datos[0] = datos.back() = ${T.arr[ult]}`,
      say: `El último elemento, el ${T.arr[ult]}, se copia a la raíz. El ${T.sale} sale del heap.` });
    T.flecha = null;
    T.arr.pop();
    chips();
    T.est = { 0: 'nuevo' };
    T.paso({ code: 2, test: `datos.pop_back() → n = ${T.arr.length}`,
      say: `Se elimina la última celda. La forma vuelve a ser un árbol completo, pero el ${T.arr[0]} quedó arriba y las aristas rojas marcan dónde se viola la propiedad de heap.` });
    const n = T.arr.length;
    T.paso({ code: 3, test: `bajar(0, ${n})`, say: `<code>bajar</code> lleva al ${T.arr[0]} hacia abajo hasta que sea mayor o igual que sus hijos.` });
    let i = 0, primera = true;
    while (true) {
      const a = 2 * i + 1, b = 2 * i + 2;
      let mayor = i;
      T.est = { [i]: 'activo' };
      T.paso({ code: 6, test: `bajar(${i}, ${n}) · mayor = ${i}`,
        say: `<code>mayor</code> empieza apuntando al propio nodo: el ${T.arr[i]} en la celda ${i}.` });
      T.paso({ code: [7, 8], test: `izq = ${a} · der = ${b}`,
        say: `Sus hijos estarían en las celdas ${a} y ${b}` + (a >= n ? `, pero ${a} ≥ n: no tiene hijos.` : b >= n ? `; la ${b} no existe.` : '.') });
      if (a < n) T.est[a] = 'comp';
      const ca = a < n && T.arr[a] > T.arr[mayor];
      const hayDer = b < n;
      T.paso({ code: 9, test: a < n ? `¿${a} < ${n} y ${T.arr[a]} > ${T.arr[mayor]}? ${ca ? 'sí' : 'no'}` : `¿${a} < ${n}? no`,
        say: a < n ? (ca ? `El hijo izquierdo, ${T.arr[a]}, es mayor que el ${T.arr[mayor]}.` : `El hijo izquierdo, ${T.arr[a]}, no es mayor que el ${T.arr[mayor]}.`) : `No hay hijo izquierdo.`,
        predice: primera && a < n && hayDer ? `¿con cuál de los dos hijos se debe intercambiar el ${T.arr[i]}?` : '' });
      primera = false;
      if (ca) {
        mayor = a;
        T.est[a] = 'mayor';
        T.paso({ code: 10, test: `mayor = ${a}`, say: `<code>mayor</code> pasa a la celda ${a}. Todavía falta revisar al derecho.` });
      }
      if (hayDer) T.est[b] = 'comp';
      if (a < n && !ca) T.est[a] = 'comp';
      const cb = hayDer && T.arr[b] > T.arr[mayor];
      T.paso({ code: 11, test: hayDer ? `¿${b} < ${n} y ${T.arr[b]} > ${T.arr[mayor]}? ${cb ? 'sí' : 'no'}` : `¿${b} < ${n}? no`,
        say: hayDer ? (cb ? `El hijo derecho, ${T.arr[b]}, es mayor que el ${T.arr[mayor]}${mayor !== i ? ', el mejor hasta ahora' : ''}.` : `El hijo derecho, ${T.arr[b]}, no es mayor que el ${T.arr[mayor]}.`) : `No hay hijo derecho.` });
      if (cb) {
        if (mayor !== i) T.est[mayor] = 'comp';
        mayor = b;
        T.est[b] = 'mayor';
        T.paso({ code: 12, test: `mayor = ${b}`,
          say: `<code>mayor</code> pasa a la celda ${b}. Comparar solo con el hijo izquierdo habría dejado al ${T.arr[b]} debajo de un número menor.` });
      }
      const fin = mayor === i;
      T.paso({ code: 13, test: `¿mayor == i? ${fin ? 'sí → return' : 'no'}`,
        say: fin ? `Ningún hijo es mayor que el ${T.arr[i]}: la propiedad de heap se cumple y <code>bajar</code> termina.`
                 : `El mayor de los tres es el ${T.arr[mayor]}, en la celda ${mayor}.` });
      if (fin) { T.est = { [i]: 'listo' }; break; }
      T.flecha = [[i, mayor]];
      [T.arr[i], T.arr[mayor]] = [T.arr[mayor], T.arr[i]];
      swaps++;
      chips();
      T.est = { [i]: 'movido', [mayor]: 'movido' };
      T.paso({ code: 14, test: `swap(datos[${i}], datos[${mayor}])`,
        say: `Se intercambian: el ${T.arr[i]} sube a la celda ${i} y el ${T.arr[mayor]} baja a la ${mayor}.` });
      T.flecha = null;
      T.est = { [mayor]: 'activo' };
      T.paso({ code: 15, test: `bajar(${mayor}, ${n})`, say: `Se repite desde la celda ${mayor}, un nivel más abajo.` });
      i = mayor;
    }
    T.flecha = null;
    chips();
    T.paso({ code: -1, test: `pop() terminó · salió el ${T.sale}`,
      say: `El nuevo máximo, ${T.arr[0]}, quedó en la raíz. Hubo ${swaps} intercambio${swaps === 1 ? '' : 's'}, uno por nivel como máximo: O(log n).` });
    return T.F;
  }

  // bajar sin fotos, devuelve el camino de intercambios
  function bajarSilencioso(a, i, n, modo) {
    const mejor = modo === 'min' ? (x, y) => x < y : (x, y) => x > y;
    const camino = [];
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let m = i;
      if (l < n && mejor(a[l], a[m])) m = l;
      if (r < n && mejor(a[r], a[m])) m = r;
      if (m === i) return camino;
      [a[i], a[m]] = [a[m], a[i]];
      camino.push([i, m]);
      i = m;
    }
  }
  function subirSilencioso(a, i, modo) {
    const mejor = modo === 'min' ? (x, y) => x < y : (x, y) => x > y;
    while (i > 0 && mejor(a[i], a[P(i)])) { [a[i], a[P(i)]] = [a[P(i)], a[i]]; i = P(i); }
  }
  const alturaDe = (i, n) => { let h = 0, c = 2 * i + 1; while (c < n) { h++; c = 2 * c + 1; } return h; };

  /* ---------- construir: una llamada a bajar por paso ---------- */
  function trazaConstruir(arr) {
    const T = nuevaTraza(arr, {});
    const n = arr.length;
    const H = alturaDe(0, n);
    const filas = [];
    for (let h = 0; h <= H; h++) filas.push({ h, nodos: 0, inter: 0 });
    for (let i = 0; i < n; i++) filas[alturaDe(i, n)].nodos++;
    T.tabla = filas;
    let total = 0;
    const chips = () => { T.chips = [[`intercambios: ${total}`, 'cok'], [`n = ${n}`, 'ci']]; };
    chips();
    T.paso({ code: 0, test: `construir() · n = ${n}`,
      say: `El arreglo está en cualquier orden: las aristas rojas son todas las violaciones. Las hojas ya son heaps de un elemento, así que se empieza por el último padre y se sube hasta la raíz.` });
    const ult = Math.floor(n / 2) - 1;
    T.paso({ code: [1, 2], test: `n = ${n} · i va de ${ult} a 0`,
      say: `El último padre está en la celda n / 2 − 1 = ${ult}. Las celdas de la ${ult + 1} a la ${n - 1} son hojas y no se tocan.` });
    for (let i = ult; i >= 0; i--) {
      const h = alturaDe(i, n);
      const antes = T.arr[i];
      const camino = bajarSilencioso(T.arr, i, n, 'max');
      total += camino.length;
      filas[h].inter += camino.length;
      chips();
      T.est = {};
      camino.forEach(([a, b]) => { T.est[a] = 'movido'; T.est[b] = 'movido'; });
      T.est[i] = camino.length ? 'movido' : 'activo';
      T.flecha = camino.length ? camino : null;
      T.paso({ code: 3, test: `bajar(${i}, ${n}) · altura ${h} · ${camino.length} intercambio${camino.length === 1 ? '' : 's'}`,
        say: camino.length
          ? `<code>bajar(${i}, ${n})</code>: el ${antes} baja ${camino.length} nivel${camino.length === 1 ? '' : 'es'}. Sus dos subárboles ya eran heaps; ahora el subárbol de la celda ${i} también lo es.`
          : `<code>bajar(${i}, ${n})</code>: el ${antes} ya es mayor o igual que sus hijos. No se mueve.` });
    }
    T.est = {};
    T.flecha = null;
    const cota = filas.reduce((s, f) => s + f.h * f.nodos, 0);
    T.paso({ code: -1, test: `heap listo · ${total} intercambios · cota ${cota} ≤ n = ${n}`,
      say: `Ya no hay aristas rojas. Cada nodo a altura h hace a lo más h intercambios, y casi todos los nodos están abajo: la suma de la columna "cota" es ${cota}, menor que n. Por eso build-heap es O(n).` });
    return T.F;
  }

  /* ---------- Heap Sort: un intercambio y un bajar por paso ---------- */
  function trazaHeapsort(arr) {
    const T = nuevaTraza(arr, {});
    const n = arr.length;
    T.fin = n;
    T.chips = [[`zona viva: ${n}`, 'ci'], ['ordenados: 0', 'cok']];
    T.paso({ code: 0, test: `heapSort() · n = ${n}`,
      say: `Ordena el arreglo de menor a mayor sin memoria extra. Primero lo convierte en max-heap.` });
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) bajarSilencioso(T.arr, i, n, 'max');
    T.paso({ code: [1, 2], test: `construir() → max-heap`,
      say: `Después de <code>construir()</code> el máximo, ${T.arr[0]}, está en la celda 0. Ya no hay aristas rojas.` });
    for (let fin = n - 1; fin > 0; fin--) {
      T.est = { 0: 'comp', [fin]: 'comp' };
      T.flecha = [[0, fin]];
      const max = T.arr[0];
      [T.arr[0], T.arr[fin]] = [T.arr[fin], T.arr[0]];
      T.fin = fin;
      T.est = { [fin]: 'listo', 0: 'nuevo' };
      T.chips = [[`zona viva: ${fin}`, 'ci'], [`ordenados: ${n - fin}`, 'cok']];
      T.paso({ code: [3, 4], test: `fin = ${fin} · swap(datos[0], datos[${fin}])`,
        say: `El máximo, ${max}, se intercambia con la celda ${fin} y queda en su lugar definitivo. La zona viva se reduce a las celdas 0…${fin - 1}.` });
      T.flecha = null;
      const antes = T.arr[0];
      const camino = bajarSilencioso(T.arr, 0, fin, 'max');
      T.est = { [fin]: 'listo' };
      camino.forEach(([a, b]) => { T.est[a] = 'movido'; T.est[b] = 'movido'; });
      T.flecha = camino.length ? camino : null;
      T.paso({ code: 5, test: `bajar(0, ${fin}) · ${camino.length} intercambio${camino.length === 1 ? '' : 's'}`,
        say: fin > 1 ? `<code>bajar(0, ${fin})</code> repara la zona viva: el ${antes} baja ${camino.length} nivel${camino.length === 1 ? '' : 'es'} y el siguiente máximo, ${T.arr[0]}, queda en la raíz.`
                     : `Queda un solo elemento en la zona viva: ya está en su lugar.` });
    }
    T.fin = 0;
    T.est = {};
    T.flecha = null;
    T.chips = [['zona viva: 0', 'ci'], [`ordenados: ${n}`, 'cok']];
    T.paso({ code: -1, test: `ordenado: ${T.arr.join(', ')}`,
      say: `El arreglo quedó ordenado de menor a mayor. Fueron n − 1 extracciones de O(log n) cada una: O(n log n), dentro del mismo arreglo.` });
    return T.F;
  }

  /* ---------- top-k: un elemento del stream por paso ----------
     Líneas: 4 for · 5 if size < k · 6 push · 7 else if x > top · 8 pop · 9 push */
  function trazaTopk(stream, k) {
    const T = nuevaTraza([], { cap: k, modo: 'min' });
    T.stream = { vals: stream.slice(), i: -1, est: stream.map(() => '') };
    let comps = 0, descartes = 0, reemplazos = 0;
    const chips = () => { T.chips = [[`k = ${k}`, 'ci'], [`descartados en la puerta: ${descartes}`, ''], [`reemplazos: ${reemplazos}`, 'cok']]; };
    chips();
    T.paso({ code: [2, 3], test: `topK(v, ${k}, portero) · n = ${stream.length}`,
      say: `Queremos los ${k} mayores. El portero es un <b>min-heap</b>: su raíz es el menor de los candidatos, el primero que hay que sacar si llega alguien mejor.` });
    stream.forEach((x, j) => {
      T.stream.i = j;
      T.flecha = null;
      if (T.arr.length < k) {
        T.arr.push(x);
        subirSilencioso(T.arr, T.arr.length - 1, 'min');
        T.stream.est[j] = 'entra';
        T.est = { [T.arr.indexOf(x)]: 'nuevo' };
        T.paso({ code: [4, 5, 6], test: `x = ${x} · size ${T.arr.length - 1} < ${k} → push`,
          say: `El portero todavía no tiene ${k} elementos: el ${x} entra sin comparar.` });
        return;
      }
      comps++;
      const top = T.arr[0];
      if (x > top) {
        T.arr[0] = T.arr[T.arr.length - 1];
        T.arr.pop();
        bajarSilencioso(T.arr, 0, T.arr.length, 'min');
        T.arr.push(x);
        subirSilencioso(T.arr, T.arr.length - 1, 'min');
        reemplazos++;
        chips();
        T.stream.est[j] = 'entra';
        T.stream.est[stream.findIndex((v, q) => v === top && T.stream.est[q] === 'entra' && q < j)] = 'expulsado';
        T.est = { [T.arr.indexOf(x)]: 'nuevo' };
        T.paso({ code: [7, 8, 9], test: `x = ${x} · ${x} > ${top} → pop + push`,
          say: `El ${x} supera al portero, ${top}: el ${top} sale y el ${x} entra. Cuesta O(log k). La nueva raíz es el ${T.arr[0]}.` });
      } else {
        descartes++;
        chips();
        T.stream.est[j] = 'descartado';
        T.est = { 0: 'comp' };
        T.paso({ code: 7, test: `x = ${x} · ¿${x} > ${top}? no → descartado`,
          say: `El ${x} no supera al portero, ${top}: no puede estar entre los ${k} mayores. Se descarta con una sola comparación.` });
      }
    });
    T.stream.i = -1;
    T.est = {};
    T.flecha = null;
    const mejores = T.arr.slice().sort((a, b) => b - a);
    T.paso({ code: -1, test: `los ${k} mayores: ${mejores.join(', ')}`,
      say: `El portero contiene los ${k} mayores (${mejores.join(', ')}), sin orden entre ellos. ${descartes} de ${stream.length} elementos se descartaron con una comparación. Costo: O(n log k), con memoria O(k).` });
    return T.F;
  }

  function trazar(alg, datos, ds) {
    switch (alg) {
      case 'indices':   return trazaIndices(datos);
      case 'push':      return trazaPush(datos, Number(ds.x));
      case 'pop':       return trazaPop(datos);
      case 'construir': return trazaConstruir(datos);
      case 'heapsort':  return trazaHeapsort(datos);
      case 'topk':      return trazaTopk(datos, Number(ds.k || 3));
    }
    throw new Error('sim-heap: algoritmo desconocido ' + alg);
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
    // El comentario se separa antes de resaltar para que las reglas
    // de palabras clave no toquen el HTML que se genera.
    const k = linea.indexOf('//');
    const codigo = k < 0 ? linea : linea.slice(0, k);
    const cm = k < 0 ? '' : `<span class="cm">${esc(linea.slice(k))}</span>`;
    return esc(codigo)
      .replace(/\b(int|bool|void|while|for|if|else|return|true|false|nullptr|class|public)\b/g, '\u0001$1\u0002')
      .replace(/\b(push|pop|subir|bajar|construir|heapSort|topK|swap|push_back|pop_back|back|size|top)\b(?=\()/g, '\u0003$1\u0002')
      .replace(/(?<![\w#])(-?\d+)\b/g, '\u0004$1\u0002')
      .replace(/\u0001/g, '<span class="kw">').replace(/\u0003/g, '<span class="fn">')
      .replace(/\u0004/g, '<span class="num">').replace(/\u0002/g, '</span>') + cm;
  }

  const CODIGO_DE = { push: 'push', pop: 'pop', construir: 'construir', heapsort: 'heapsort', topk: 'topk' };

  function construirSim(cont) {
    const alg = cont.dataset.alg;
    const datos = (cont.dataset.datos || '90,70,80,30,50,60').split(',').map(Number);
    const F = trazar(alg, datos, cont.dataset);
    const clave = CODIGO_DE[alg];
    const modo = alg === 'topk' ? 'min' : 'max';
    cont.innerHTML = '';
    cont.classList.add('sh-' + alg);

    // Geometría: el árbol completo por niveles, el arreglo debajo.
    const cap = Math.max(...F.map(f => f.arr.length), Number(cont.dataset.k || 0));
    const niveles = Math.max(1, Math.floor(Math.log2(Math.max(1, cap))) + 1);
    const W = 500, R = cap > 7 ? 19 : 22, TOP = 26, DY = niveles > 3 ? 58 : 66;
    const pos = i => {
      const d = Math.floor(Math.log2(i + 1));
      const j = i - (2 ** d - 1);
      return { x: (j + 0.5) * W / (2 ** d), y: TOP + d * DY };
    };
    const treeH = TOP + (niveles - 1) * DY + R + 18;
    const CW = Math.min(58, Math.floor((W - 10) / cap));
    const AX = (W - CW * cap) / 2;
    const AY = treeH + 6;
    const tieneStream = alg === 'topk';
    const SY = AY + 76;
    const H = tieneStream ? SY + 64 : AY + 66;

    const cuerpo = document.createElement('div');
    cuerpo.className = 'sh-cuerpo';
    const izq = document.createElement('div');
    izq.className = 'sh-izq';
    let lineas = [];
    let calc = null, tabla = null;
    if (clave) {
      const pre = document.createElement('pre');
      pre.className = 'sim-codigo sh-codigo';
      pre.innerHTML = CODIGO[clave].split('\n').map(l => `<div class="sim-linea">${pintarCodigo(l) || ' '}</div>`).join('');
      izq.appendChild(pre);
      lineas = [...pre.querySelectorAll('.sim-linea')];
    } else {
      calc = document.createElement('div');
      calc.className = 'sh-calc';
      izq.appendChild(calc);
    }
    if (alg === 'construir') {
      tabla = document.createElement('table');
      tabla.className = 'sh-tabla';
      izq.appendChild(tabla);
    }
    const der = document.createElement('div');
    der.className = 'sh-der';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sh-svg' });
    const uid = 'sh' + Math.random().toString(36).slice(2, 8);
    svg.innerHTML = `<defs><marker id="${uid}-m" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="10" refX="10" refY="5" orient="auto-start-reverse"><path d="M0,0 L11,5 L0,10 z" class="sh-punta"/></marker></defs><g></g>`;
    const capa = svg.querySelector('g');
    der.appendChild(svg);
    const dice = document.createElement('p');
    dice.className = 'sim-dice sh-dice';
    der.appendChild(dice);
    const barra = document.createElement('div');
    barra.className = 'sim-barra sh-barra';
    barra.innerHTML =
      '<span class="sim-chip"></span><span class="sim-chip"></span><span class="sim-chip"></span>' +
      '<span class="sim-test"></span>' +
      '<span class="sim-ctrl">' +
        '<button type="button" data-ir="-1" aria-label="Paso anterior">◀</button>' +
        '<span class="sim-cont"></span>' +
        '<button type="button" data-ir="1" aria-label="Paso siguiente">▶</button>' +
      '</span>';
    der.appendChild(barra);
    barra.querySelectorAll('button').forEach(btn => btn.addEventListener('click', ev => {
      ev.stopPropagation();
      if (typeof Reveal === 'undefined') return;
      if (Number(btn.dataset.ir) > 0) Reveal.nextFragment(); else Reveal.prevFragment();
    }));
    cuerpo.appendChild(izq);
    cuerpo.appendChild(der);
    cont.appendChild(cuerpo);
    const chips = [...barra.querySelectorAll('.sim-chip')];

    const huecos = document.createElement('span');
    huecos.className = 'sim-fragments';
    for (let k = 1; k < F.length; k++) {
      const f = document.createElement('span');
      f.className = 'fragment';
      f.setAttribute('aria-hidden', 'true');
      huecos.appendChild(f);
    }
    cont.appendChild(huecos);

    const viola = (a, p, c) => modo === 'min' ? a[p] > a[c] : a[p] < a[c];

    // Un intercambio lleva punta en los dos extremos; una copia, solo
    // en el destino.
    const puntas = doble => doble ? { 'marker-end': `url(#${uid}-m)`, 'marker-start': `url(#${uid}-m)` } : { 'marker-end': `url(#${uid}-m)` };
    function flecha(a, b, cls, doble) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
      const off = Math.max(22, L * 0.3), ox = dy / L * off, oy = -dx / L * off;
      capa.appendChild(el('path', Object.assign({ d: `M ${a.x} ${a.y} Q ${mx + ox} ${my + oy} ${b.x} ${b.y}`, class: cls }, puntas(doble))));
    }

    function pintar(k) {
      const f = F[Math.max(0, Math.min(k, F.length - 1))];
      capa.innerHTML = '';
      const n = f.arr.length;
      const vivo = i => i < f.fin;
      // Aristas
      for (let c = 1; c < n; c++) {
        const p = P(c), a = pos(p), b = pos(c);
        let cls = 'sh-arista';
        if (!vivo(c)) cls += ' tenue';
        else if (viola(f.arr, p, c)) cls += ' viola';
        capa.appendChild(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: cls }));
      }
      // Nodos del árbol
      for (let i = 0; i < n; i++) {
        const p = pos(i);
        const est = f.est[i] || '';
        const g = el('g', { class: 'sh-nodo' + (est ? ' ' + est : '') + (vivo(i) ? '' : ' fuera') });
        g.appendChild(el('circle', { cx: p.x, cy: p.y, r: R }));
        g.appendChild(el('text', { x: p.x, y: p.y + 7, class: 'sh-dato' }, f.arr[i]));
        g.appendChild(el('text', { x: p.x - R - 3, y: p.y - R + 6, class: 'sh-ind' }, i));
        capa.appendChild(g);
      }
      // Arreglo
      for (let i = 0; i < cap; i++) {
        const x = AX + i * CW;
        const est = f.est[i] || '';
        const hay = i < n;
        const g = el('g', { class: 'sh-celda' + (est && hay ? ' ' + est : '') + (hay ? (vivo(i) ? '' : ' fuera') : ' vacia') });
        g.appendChild(el('rect', { x: x + 2, y: AY, width: CW - 4, height: 40, rx: 6 }));
        if (hay) g.appendChild(el('text', { x: x + CW / 2, y: AY + 27, class: 'sh-dato' }, f.arr[i]));
        g.appendChild(el('text', { x: x + CW / 2, y: AY + 58, class: 'sh-ind-c' }, i));
        capa.appendChild(g);
      }
      if (f.fin < n && f.fin > 0) {
        const x = AX + f.fin * CW;
        capa.appendChild(el('line', { x1: x, y1: AY - 6, x2: x, y2: AY + 46, class: 'sh-corte' }));
      }
      // Intercambio del paso
      if (f.flecha) f.flecha.forEach(([a, b, tipo]) => {
        const doble = tipo !== 'copia';
        // en el árbol, la flecha sale y llega al borde de los nodos
        const pa = pos(a), pb = pos(b);
        const L = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1;
        const ux = (pb.x - pa.x) / L, uy = (pb.y - pa.y) / L;
        flecha({ x: pa.x + ux * (R + 3), y: pa.y + uy * (R + 3) }, { x: pb.x - ux * (R + 3), y: pb.y - uy * (R + 3) }, 'sh-flecha', doble);
        const ca = { x: AX + a * CW + CW / 2, y: AY - 2 }, cb = { x: AX + b * CW + CW / 2, y: AY - 2 };
        capa.appendChild(el('path', Object.assign({ d: `M ${ca.x} ${ca.y} Q ${(ca.x + cb.x) / 2} ${AY - 34} ${cb.x} ${cb.y}`, class: 'sh-flecha' }, puntas(doble))));
      });
      // Stream (top-k)
      if (f.stream) {
        const m = f.stream.vals.length, w = Math.min(40, Math.floor((W - 10) / m)), sx = (W - w * m) / 2;
        capa.appendChild(el('text', { x: sx, y: SY - 8, class: 'sh-ind-c izq' }, 'stream'));
        f.stream.vals.forEach((v, j) => {
          const e = f.stream.est[j] || '';
          const g = el('g', { class: 'sh-stream' + (e ? ' ' + e : '') + (j === f.stream.i ? ' actual' : '') });
          g.appendChild(el('rect', { x: sx + j * w + 1, y: SY, width: w - 2, height: 34, rx: 5 }));
          g.appendChild(el('text', { x: sx + j * w + w / 2, y: SY + 23, class: 'sh-dato chico' }, v));
          capa.appendChild(g);
        });
      }
      if (f.sale !== null && f.sale !== undefined) {
        capa.appendChild(el('text', { x: W - 4, y: 20, class: 'sh-sale' }, `salió: ${f.sale}`));
      }
      // Código
      const act = Array.isArray(f.code) ? f.code : [f.code];
      lineas.forEach((l, i) => l.classList.toggle('on', act.includes(i)));
      if (calc && f.calc) calc.innerHTML = f.calc.map(c => `<div class="sh-calc-l${c.cls ? ' ' + c.cls : ''}">${esc(c.t)}</div>`).join('');
      if (tabla && f.tabla) {
        const cota = f.tabla.reduce((s, r) => s + r.h * r.nodos, 0);
        const tot = f.tabla.reduce((s, r) => s + r.inter, 0);
        tabla.innerHTML = '<thead><tr><th>altura h</th><th>nodos</th><th>intercambios</th><th>cota h·nodos</th></tr></thead><tbody>' +
          f.tabla.map(r => `<tr><td>${r.h}</td><td>${r.nodos}</td><td>${r.inter}</td><td>${r.h * r.nodos}</td></tr>`).join('') +
          `<tr class="total"><td>total</td><td>${n}</td><td>${tot}</td><td>${cota}</td></tr></tbody>`;
      }
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
    }

    cont._simPintar = pintar;
    cont._simTotal = F.length;
    pintar(0);
  }

  function sync() {
    const slide = Reveal.getCurrentSlide();
    if (!slide) return;
    slide.querySelectorAll('.sim-heap').forEach(cont => {
      if (!cont._simPintar) return;
      const vistos = cont.querySelectorAll('.sim-fragments .fragment.visible').length;
      cont._simPintar(vistos);
      const b = cont.querySelectorAll('.sim-ctrl button');
      if (b[0]) b[0].disabled = vistos === 0;
      if (b[1]) b[1].disabled = vistos >= cont._simTotal - 1;
    });
  }

  function init() {
    const sims = document.querySelectorAll('.sim-heap');
    if (!sims.length) return;
    sims.forEach(construirSim);
    if (typeof Reveal !== 'undefined') {
      if (Reveal.sync) Reveal.sync();
      ['fragmentshown', 'fragmenthidden', 'slidechanged', 'ready']
        .forEach(ev => Reveal.on(ev, () => setTimeout(sync, 0)));
      sync();
    }
  }

  return { init, _trazar: (alg, datos, ds) => trazar(alg, String(datos).split(',').map(Number), ds || {}), _codigo: CODIGO };
})();

if (typeof module !== 'undefined') module.exports = SimHeap;
