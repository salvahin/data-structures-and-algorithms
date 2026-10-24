/* ============================================================
   SIM-PILAS-FILAS — pila y fila sobre una lista simple o un arreglo
   Requiere Reveal.js 5.x y curso-slides.js. Incluir después de
   curso-slides.js y llamar, tras CursoSlides.init(...):

       SimPilasFilas.init();

   Uso en HTML:

     <div class="sim-pf" data-alg="pila-lados"></div>

   data-alg:
     pila-lados       dos carriles: tope en head frente a tope en tail
     fila-lados       dos carriles: se sale por head frente a se sale por tail
     pop-back         quitar el último de una lista simple, línea por línea
     arreglo-ingenuo  fila en arreglo sin vuelta: correr a todos o solo avanzar frente
     circular         fila circular sobre un arreglo de 8, con el anillo al lado

   Como en los demás simuladores del curso, los pasos salen de
   ejecutar las operaciones sobre un modelo; un paso = un fragment
   del slide. El código de pop-back y circular (CODIGO, abajo) debe
   ser idéntico al de los bloques de código del deck.
   ============================================================ */

const SimPilasFilas = (() => {

  const CODIGO = {
    'pop-back': [
      'T popBack() {         // al menos 2 nodos',
      '    Nodo* prev = head;',
      '    while (prev->next != tail)',
      '        prev = prev->next;',
      '    T x = tail->dato;',
      '    delete tail;',
      '    tail = prev;',
      '    tail->next = nullptr;',
      '    return x;',
      '}'
    ],
    enqueue: [
      'void enqueue(T x) {   // pre: n < 8',
      '    int fin = (frente + n) % 8;',
      '    datos[fin] = x;',
      '    n++;',
      '}'
    ],
    dequeue: [
      'T dequeue() {         // pre: n > 0',
      '    T x = datos[frente];',
      '    frente = (frente + 1) % 8;',
      '    n--;',
      '    return x;',
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

  function pintarCodigo(linea) {
    const esc = linea.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return esc
      .replace(/(\/\/.*)$/, '<span class="cm">$1</span>')
      .replace(/\b(int|void|while|if|return|delete|nullptr)\b/g, '<span class="kw">$1</span>')
      .replace(/\b(Nodo)\b/g, '<span class="fn">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
  }

  /* ==========================================================
     MODELO: carriles de lista simple
     Un carril tiene nodos con columna fija (los nodos no se
     mueven), punteros con nombre, una línea de código y un costo.
     ========================================================== */
  function carril(tit, clases) {
    return { tit, nodos: {}, ptrs: {}, clases, costo: null, linea: '' };
  }
  function nodo(L, id, dato, c, next, est) {
    L.nodos[id] = { dato, c, next: next || null, est: est || '', flecha: '' };
  }
  function limpiar(L) {
    for (const id in L.nodos) if (L.nodos[id].est === 'liberado') delete L.nodos[id];
    for (const id in L.nodos) { L.nodos[id].est = ''; L.nodos[id].flecha = ''; }
  }
  const saltos = k => k === 1 ? '1 salto' : `${k} saltos`;

  /* ---------- Pila: tope en head (A) o en tail (B) ---------- */
  function trazarPilaLados() {
    const F = [];
    const A = carril('A · tope = head de la lista', { tope: 'pp' });
    const B = carril('B · tope = tail de la lista', { head: 'ph', tope: 'pp', prev: 'pn' });
    // Entraron 10, 20, 30. En A el último en entrar quedó primero.
    nodo(A, 'a30', 30, 1, 'a20'); nodo(A, 'a20', 20, 2, 'a10'); nodo(A, 'a10', 10, 3, null);
    A.ptrs = { tope: 'a30' };
    nodo(B, 'b10', 10, 0, 'b20'); nodo(B, 'b20', 20, 1, 'b30'); nodo(B, 'b30', 30, 2, null);
    B.ptrs = { head: 'b10', tope: 'b30' };
    let n = 3;
    const add = o => F.push(Object.assign({ carriles: [copia(A), copia(B)],
      chips: [[`n = ${n}`, '']] }, o));

    A.linea = 'Pila: solo guarda tope';
    B.linea = 'Pila: guarda head y tope';
    add({ test: 'la misma pila: entraron 10, 20 y 30',
      say: `Dos maneras de guardar la misma pila en una lista simple. En <b>A</b> el tope es el primer nodo de la lista; en <b>B</b> es el último, y la lista guarda también <code>head</code>. En las dos, el 30 es el de arriba.`,
      predice: '¿cuál de las dos hace más trabajo en <code>push</code>? ¿Y en <code>pop</code>?' });

    // push(40)
    nodo(A, 'a40', 40, 0, 'a30', 'nuevo'); A.nodos.a40.flecha = 'nueva'; A.ptrs.tope = 'a40';
    nodo(B, 'b40', 40, 3, null, 'nuevo'); B.nodos.b30.next = 'b40'; B.nodos.b30.flecha = 'nueva'; B.ptrs.tope = 'b40';
    n = 4;
    A.linea = 'nuevo->next = tope;   tope = nuevo;';
    B.linea = 'tope->next = nuevo;   tope = nuevo;';
    A.costo = { t: '0 saltos · O(1)', cls: 'ok' };
    B.costo = { t: '0 saltos · O(1)', cls: 'ok' };
    add({ test: 'push(40)',
      say: `<code>push</code> cuesta lo mismo en las dos. En A el 40 se enlaza antes del tope; en B se enlaza después, y como B tiene un puntero al último no hace falta recorrer. Cambian dos punteros y no se visita ningún nodo.` });

    // pop() — A termina en un paso; B empieza a buscar al penúltimo.
    limpiar(A); limpiar(B);
    A.nodos.a40.est = 'liberado'; A.ptrs.tope = 'a30';
    A.linea = 'victima = tope;   tope = tope->next;   delete victima;';
    A.costo = { t: '0 saltos · O(1)', cls: 'ok' };
    B.ptrs.prev = 'b10';
    B.linea = 'prev = head;';
    B.costo = { t: '0 saltos', cls: '' };
    add({ test: 'pop()',
      say: `En A, <code>pop</code> es el de la sesión 12: <code>tope</code> pasa a su <code>next</code> y se libera el 40. En B hay que quitar el 40 y dejar <code>tope</code> en el 30, pero el 40 no sabe quién está antes que él. En una lista simple cada nodo solo conoce a su siguiente. B tiene que buscar al penúltimo empezando en <code>head</code>.` });

    B.nodos.b20.est = '';
    B.ptrs.prev = 'b20';
    B.linea = 'prev = prev->next;     // el next del 20 no es tope: sigue';
    B.costo = { t: saltos(1), cls: 'err' };
    add({ test: 'pop() · B busca al penúltimo',
      say: `A ya terminó. B avanza <code>prev</code> un nodo y vuelve a preguntar si el siguiente de <code>prev</code> es el tope.` });

    B.ptrs.prev = 'b30';
    B.linea = 'prev = prev->next;     // el next del 30 es tope: se detiene';
    B.costo = { t: saltos(2), cls: 'err' };
    add({ test: 'pop() · B encontró al penúltimo',
      say: `El 30 es el penúltimo: su <code>next</code> es el tope. Para llegar aquí, B visitó todos los nodos menos el último.` });

    B.nodos.b40.est = 'liberado';
    B.ptrs.tope = 'b30'; delete B.ptrs.prev;
    B.nodos.b30.next = null; B.nodos.b30.flecha = 'nueva';
    n = 3;
    B.linea = 'delete tope;   tope = prev;   tope->next = nullptr;';
    B.costo = { t: `${saltos(2)} · O(n)`, cls: 'err' };
    add({ test: 'pop() → 40 en las dos',
      say: `Las dos devolvieron el 40. A no recorrió nada. B dio 2 saltos con 4 nodos; con <b>n</b> nodos da <b>n − 2</b>, así que su <code>pop</code> cuesta O(n).` });

    limpiar(A); limpiar(B);
    A.linea = 'push O(1)   ·   pop O(1)';
    B.linea = 'push O(1)   ·   pop O(n)';
    A.costo = { t: 'pop: 0 saltos con cualquier n', cls: 'ok' };
    B.costo = { t: 'pop: n − 2 saltos', cls: 'err' };
    add({ test: 'con n = 1 000 000:  A da 0 saltos por pop, B da 999 998',
      say: `La diferencia está en una sola operación. Guardar además un puntero al penúltimo tampoco alcanza, porque después de cada <code>pop</code> habría que encontrar al nuevo penúltimo caminando otra vez. Por eso la clase <code>Pila</code> pone el tope en la cabeza.` });

    return { frames: F, tipo: 'carriles' };
  }

  /* ---------- Fila: se sale por head (A) o por tail (B) ---------- */
  function trazarFilaLados() {
    const F = [];
    const A = carril('A · frente = head, final = tail', { frente: 'pp', final: 'ph', prev: 'pn' });
    const B = carril('B · final = head, frente = tail', { frente: 'pp', final: 'ph', prev: 'pn' });
    // Entraron 10, 20, 30, en ese orden.
    nodo(A, 'a10', 10, 0, 'a20'); nodo(A, 'a20', 20, 1, 'a30'); nodo(A, 'a30', 30, 2, null);
    A.ptrs = { frente: 'a10', final: 'a30' };
    nodo(B, 'b30', 30, 1, 'b20'); nodo(B, 'b20', 20, 2, 'b10'); nodo(B, 'b10', 10, 3, null);
    B.ptrs = { final: 'b30', frente: 'b10' };
    let n = 3;
    const add = o => F.push(Object.assign({ carriles: [copia(A), copia(B)],
      chips: [[`n = ${n}`, '']] }, o));

    A.linea = 'se entra por tail, se sale por head';
    B.linea = 'se entra por head, se sale por tail';
    add({ test: 'la misma fila: llegaron 10, 20 y 30',
      say: `Llegaron 10, 20 y 30, en ese orden, así que el 10 es el siguiente en salir. En <b>A</b> el 10 está en <code>head</code>, como en la clase <code>Fila</code>. En <b>B</b> los que llegan se enlazan por <code>head</code>, y el 10 quedó en <code>tail</code>.`,
      predice: '¿en cuál de las dos cuesta más <code>dequeue</code>?' });

    // enqueue(40)
    nodo(A, 'a40', 40, 3, null, 'nuevo'); A.nodos.a30.next = 'a40'; A.nodos.a30.flecha = 'nueva'; A.ptrs.final = 'a40';
    nodo(B, 'b40', 40, 0, 'b30', 'nuevo'); B.nodos.b40.flecha = 'nueva'; B.ptrs.final = 'b40';
    n = 4;
    A.linea = 'final->next = nuevo;   final = nuevo;';
    B.linea = 'nuevo->next = final;   final = nuevo;';
    A.costo = { t: '0 saltos · O(1)', cls: 'ok' };
    B.costo = { t: '0 saltos · O(1)', cls: 'ok' };
    add({ test: 'enqueue(40)',
      say: `Formarse cuesta O(1) en las dos: agregar en cualquiera de los dos extremos de la lista es cambiar dos punteros, siempre que haya un puntero a ese extremo.` });

    // dequeue()
    limpiar(A); limpiar(B);
    A.nodos.a10.est = 'liberado'; A.ptrs.frente = 'a20';
    A.linea = 'victima = frente;   frente = frente->next;   delete victima;';
    A.costo = { t: '0 saltos · O(1)', cls: 'ok' };
    B.ptrs.prev = 'b40';
    B.linea = 'prev = final;';
    B.costo = { t: '0 saltos', cls: '' };
    add({ test: 'dequeue()',
      say: `En A sale el 10 desde la cabeza: <code>frente</code> pasa a su <code>next</code>. En B el 10 está al final de la lista, y para quitarlo hay que dejar <code>frente</code> en el 20. El 10 no sabe quién está antes que él, así que B busca al penúltimo desde <code>head</code>, que en B es <code>final</code>.` });

    B.ptrs.prev = 'b30';
    B.linea = 'prev = prev->next;     // el next del 30 no es frente: sigue';
    B.costo = { t: saltos(1), cls: 'err' };
    add({ test: 'dequeue() · B busca al penúltimo',
      say: `A ya atendió al 10. B sigue caminando.` });

    B.ptrs.prev = 'b20';
    B.linea = 'prev = prev->next;     // el next del 20 es frente: se detiene';
    B.costo = { t: saltos(2), cls: 'err' };
    add({ test: 'dequeue() · B encontró al penúltimo',
      say: `El 20 es el penúltimo. Es el mismo recorrido que hizo la pila B: quitar el último nodo de una lista simple obliga a encontrar al anterior.` });

    B.nodos.b10.est = 'liberado';
    B.ptrs.frente = 'b20'; delete B.ptrs.prev;
    B.nodos.b20.next = null; B.nodos.b20.flecha = 'nueva';
    n = 3;
    B.linea = 'delete frente;   frente = prev;   frente->next = nullptr;';
    B.costo = { t: `${saltos(2)} · O(n)`, cls: 'err' };
    add({ test: 'dequeue() → 10 en las dos',
      say: `Las dos atendieron al 10, así que las dos respetan FIFO. A lo hizo sin recorrer; B recorrió la fila completa, y con <b>n</b> elementos cada <code>dequeue</code> le cuesta <b>n − 2</b> saltos.` });

    limpiar(A); limpiar(B);
    A.linea = 'enqueue O(1)   ·   dequeue O(1)';
    B.linea = 'enqueue O(1)   ·   dequeue O(n)';
    A.costo = { t: 'dequeue: 0 saltos con cualquier n', cls: 'ok' };
    B.costo = { t: 'dequeue: n − 2 saltos', cls: 'err' };
    add({ test: 'atender a n personas:  A da 0 saltos en total, B da del orden de n²/2',
      say: `La clase <code>Fila</code> es la A: se entra por el extremo donde solo hay que agregar y se sale por la cabeza, donde quitar es O(1). Si se invierte el sentido, el orden de salida es el mismo pero cada salida recorre la lista.` });

    return { frames: F, tipo: 'carriles' };
  }

  /* ---------- popBack, línea por línea ---------- */
  function trazarPopBack() {
    const F = [];
    const L = carril('', { head: 'ph', tail: 'ph', prev: 'pn' });
    const vals = [10, 20, 30, 40, 50];
    vals.forEach((v, k) => nodo(L, 'n' + v, v, k, k + 1 < vals.length ? 'n' + vals[k + 1] : null));
    L.ptrs = { head: 'n10', tail: 'n50' };
    let pasos = 0, x = null;
    const chips = () => [
      [`prev = ${L.ptrs.prev ? 'el ' + L.nodos[L.ptrs.prev].dato : '—'}`, 'cok'],
      [`saltos = ${pasos}`, pasos ? 'cj' : ''],
      [`x = ${x === null ? '—' : x}`, 'ci']];
    const add = o => F.push(Object.assign({ carriles: [copia(L)], chips: chips() }, o));
    const quitarHl = () => { for (const id in L.nodos) if (L.nodos[id].est === 'hl') L.nodos[id].est = ''; };

    add({ code: -1, test: 'popBack() sobre una lista de 5 nodos',
      say: `Es la operación que hicieron la pila B y la fila B: quitar el último nodo. <code>tail</code> dice dónde está el 50, pero al quitarlo el <code>next</code> del 40 tiene que quedar en <code>nullptr</code> y <code>tail</code> tiene que pasar al 40. Hace falta llegar al 40.`,
      predice: '¿cuántas veces se va a ejecutar <code>prev = prev->next</code>?' });

    L.ptrs.prev = 'n10';
    add({ code: 1, test: 'prev = head',
      say: `<code>prev</code> arranca en la cabeza. Es la única entrada a la lista: desde el 50 no hay forma de ir hacia atrás.` });

    for (;;) {
      const sig = L.nodos[L.ptrs.prev].next;
      const sigue = sig !== L.ptrs.tail;
      L.nodos[sig].est = 'hl';
      add({ code: 2, test: `¿prev->next != tail?  el ${L.nodos[sig].dato} ${sigue ? '≠' : '='} tail  →  ${sigue ? 'sí' : 'no'}`,
        say: sigue
          ? `El siguiente de <code>prev</code> es el ${L.nodos[sig].dato}, que no es el último. <code>prev</code> todavía no es el penúltimo.`
          : `El siguiente de <code>prev</code> es el 50, el último: el ciclo termina con <code>prev</code> en el <b>penúltimo</b>, el ${L.nodos[L.ptrs.prev].dato}.` });
      quitarHl();
      if (!sigue) break;
      L.ptrs.prev = sig; pasos++;
      add({ code: 3, test: 'prev = prev->next',
        say: `<code>prev</code> salta al ${L.nodos[sig].dato}. Lleva ${saltos(pasos)}.` });
    }

    x = L.nodos[L.ptrs.tail].dato;
    add({ code: 4, test: `x = tail->dato  →  ${x}`,
      say: `Se guarda el dato antes de liberar el nodo. Desde aquí, cada línea es O(1).` });

    const vic = L.ptrs.tail, pen = L.ptrs.prev;
    L.nodos[vic].est = 'liberado';
    L.nodos[pen].flecha = 'colgante';
    add({ code: 5, test: 'delete tail',
      say: `Se libera el 50. El <code>next</code> del 40 y el propio <code>tail</code> siguen guardando esa dirección, que ya no es válida. Las dos líneas siguientes los corrigen.` });

    L.ptrs.tail = pen;
    add({ code: 6, test: 'tail = prev',
      say: `<code>tail</code> pasa al 40, que ahora es el último.` });

    L.nodos[pen].next = null; L.nodos[pen].flecha = 'nueva';
    add({ code: 7, test: 'tail->next = nullptr',
      say: `El 40 deja de apuntar a la memoria liberada. Si se olvida esta línea, el siguiente recorrido de la lista lee un nodo que ya no existe.` });

    delete L.nodos[vic];
    L.nodos[pen].flecha = '';
    delete L.ptrs.prev;
    add({ code: 8, test: `return ${x}  ·  ${saltos(pasos)} con 5 nodos`,
      say: `Con 5 nodos fueron 3 saltos; con <b>n</b> nodos son <b>n − 2</b>. Las líneas que quitan el nodo son O(1). La que crece con n es la búsqueda de <code>prev</code>, y existe porque el último nodo no guarda la dirección de su anterior.` });

    return { frames: F, tipo: 'carriles', codigo: 'pop-back' };
  }

  /* ==========================================================
     MODELO: tiras de arreglo
     ========================================================== */
  const CAP = 8;

  /* ---------- Sin vuelta: correr a todos o solo avanzar frente ---------- */
  function trazarIngenuo() {
    const F = [];
    // Opción 1: frente siempre en 0, dequeue recorre a los demás.
    const uno = { datos: ['A', 'B', 'C', 'D', 'E', null, null, null], n: 5, total: 0 };
    // Opción 2: dequeue solo avanza frente; fin nunca regresa.
    const dos = { datos: ['A', 'B', 'C', 'D', 'E', null, null, null], frente: 0, fin: 5 };

    const tiraUno = (marcas, costo, extra) => {
      const celdas = uno.datos.map((v, i) => ({ v, est: v === null ? '' : 'ocupada' }));
      (marcas || []).forEach(([i, est]) => { celdas[i].est = est; });
      return Object.assign({ tit: 'Opción 1 · dequeue corre a todos una casilla',
        celdas, tags: [['frente', 0, 'pp', 0], ['fin', uno.n, 'ph', 0]], costo }, extra);
    };
    const tiraDos = (marcas, costo, extra) => {
      const celdas = dos.datos.map((v, i) => ({
        v, est: i < dos.frente ? 'libre' : (v === null ? '' : 'ocupada') }));
      (marcas || []).forEach(([i, est]) => { celdas[i].est = est; });
      return Object.assign({ tit: 'Opción 2 · dequeue solo avanza frente',
        celdas, tags: [['frente', dos.frente, 'pp', 0], ['fin', dos.fin, 'ph', 0]], costo }, extra);
    };
    const add = (t1, t2, o) => F.push(Object.assign({ tiras: [t1, t2] }, o));

    add(tiraUno(null, null), tiraDos(null, null), {
      chips: [['capacidad = 8', '']], test: 'las dos guardan A B C D E',
      say: `Sin nodos, la fila vive en un arreglo. <code>frente</code> marca al primero y <code>fin</code> la primera casilla libre, donde entra el siguiente. Hay dos ideas directas para <code>dequeue</code>.` });

    // dequeue: A
    let movs = 0;
    const deq1 = () => {
      const m = [];
      for (let i = 1; i < uno.n; i++) { uno.datos[i - 1] = uno.datos[i]; m.push([i - 1, 'mov']); movs++; }
      uno.datos[uno.n - 1] = null; uno.n--;
      uno.total += m.length;
      return m;
    };
    let m = deq1();
    dos.frente++;
    add(tiraUno(m, { t: `dequeue: ${m.length} movimientos`, cls: 'err', t2: `total: ${uno.total}` }),
        tiraDos([[0, 'libre']], { t: 'dequeue: 1 paso', cls: 'ok', t2: 'casilla 0 sin usar' }), {
      chips: [['dequeue() → A', 'ci']], test: 'sale A',
      say: `Opción 1: sale A y B, C, D, E se recorren una casilla a la izquierda. Son <b>${m.length}</b> movimientos, n − 1. Opción 2: solo cambia <code>frente</code>; la casilla 0 se queda vacía detrás de él.` });

    m = deq1();
    dos.frente++;
    add(tiraUno(m, { t: `dequeue: ${m.length} movimientos`, cls: 'err', t2: `total: ${uno.total}` }),
        tiraDos(null, { t: 'dequeue: 1 paso', cls: 'ok', t2: '2 casillas sin usar' }), {
      chips: [['dequeue() → B', 'ci']], test: 'sale B',
      say: `Cada salida de la opción 1 mueve a todos los que quedan: es O(n). La opción 2 es O(1), pero las casillas que deja atrás <code>frente</code> no se vuelven a usar.` });

    ['F', 'G', 'H'].forEach((x, k) => {
      uno.datos[uno.n] = x; const i1 = uno.n; uno.n++;
      dos.datos[dos.fin] = x; const i2 = dos.fin; dos.fin++;
      add(tiraUno([[i1, 'hl']], { t: 'enqueue: 1 paso', cls: 'ok', t2: `total: ${uno.total}` }),
          tiraDos([[i2, 'hl']], { t: 'enqueue: 1 paso', cls: 'ok', t2: dos.fin === CAP ? 'fin llegó a 8' : '2 casillas sin usar' }), {
        chips: [[`enqueue(${x})`, 'cok']], test: `entra ${x} en datos[fin] y fin avanza`,
        say: k < 2
          ? `<code>enqueue</code> escribe en <code>datos[fin]</code> y avanza <code>fin</code>. Es O(1) en las dos opciones.`
          : `En la opción 2, <code>fin</code> llegó a 8: el final del arreglo. Hay 5 elementos y 8 casillas.` });
    });

    // enqueue(I): la opción 2 se sale del arreglo.
    uno.datos[uno.n] = 'I'; const i1 = uno.n; uno.n++;
    add(tiraUno([[i1, 'hl']], { t: 'enqueue: 1 paso', cls: 'ok', t2: `total: ${uno.total}` }),
        tiraDos(null, { t: 'datos[8] no existe', cls: 'err', t2: 'y hay 2 casillas libres' }, { fuera: 'I' }), {
      chips: [['enqueue(I)', 'cok']], test: 'opción 2: fin = 8, fuera del arreglo',
      say: `La opción 1 lo acomoda sin problema. La opción 2 tendría que escribir en <code>datos[8]</code>, fuera del arreglo, aunque las casillas 0 y 1 están libres. Se declara llena con espacio desocupado.` });

    add(tiraUno(null, { t: 'dequeue O(n)', cls: 'err', t2: 'cada salida mueve a todos' }),
        tiraDos(null, { t: 'dequeue O(1)', cls: 'ok', t2: 'desperdicia el principio' }, { fuera: 'I' }), {
      chips: [['capacidad = 8', '']], test: 'la fila circular: avanzar índices y reutilizar el principio',
      say: `La fila circular toma lo bueno de la opción 2: solo avanzan los índices, así que cada operación es O(1). Cuando un índice pasa de la casilla 7, regresa a la 0, y las casillas que dejó <code>frente</code> se vuelven a usar.` });

    return { frames: F, tipo: 'tiras' };
  }

  /* ---------- Fila circular, casilla por casilla ---------- */
  function trazarCircular() {
    const F = [];
    const datos = new Array(CAP).fill(null);
    let frente = 0, n = 0;
    const fila = () => { const o = []; for (let k = 0; k < n; k++) o.push(datos[(frente + k) % CAP]); return o; };
    const chips = () => [[`frente = ${frente}`, 'ci'], [`n = ${n}`, ''],
                         [`fila: ${n ? fila().join(' ') : '(vacía)'}`, 'cok']];
    const add = o => F.push(Object.assign({
      datos: datos.slice(), frente, n, fin: null, hl: null, arco: false, chips: chips()
    }, o));

    add({ fn: 'enqueue', code: -1, test: 'datos[8], frente = 0, n = 0',
      say: `Un arreglo de 8 casillas. La clase guarda dos enteros: <code>frente</code>, la casilla del primero, y <code>n</code>, cuántos hay. <code>enqueue</code> calcula en cada llamada la casilla donde entra el siguiente.` });

    // enqueue paso a paso, o en un solo paso con las tres líneas encendidas.
    const enq = (x, detalle, extra) => {
      const suma = frente + n, fin = suma % CAP, vuelta = suma >= CAP;
      const cuenta = suma >= CAP ? `fin = (${frente} + ${n}) % 8 = ${suma} % 8 = ${fin}` : `fin = (${frente} + ${n}) % 8 = ${fin}`;
      extra = extra || {};
      if (detalle) {
        add({ fn: 'enqueue', code: 1, fin, arco: vuelta, test: cuenta,
          say: extra.say1 || `<code>fin</code> es la casilla que está <b>n</b> lugares después de <code>frente</code>. Con la fila vacía, es la misma casilla que <code>frente</code>.` });
        datos[fin] = x;
        add({ fn: 'enqueue', code: 2, fin, hl: fin, arco: vuelta, test: `datos[${fin}] = ${x}`,
          say: extra.say2 || `Se escribe ${x} en la casilla ${fin}. Nada más se mueve.` });
        n++;
        add({ fn: 'enqueue', code: 3, fin, hl: fin, arco: vuelta, test: `n++  →  n = ${n}`,
          say: extra.say3 || `<code>n</code> sube a ${n}. <code>frente</code> se queda donde estaba porque el primero de la fila es el mismo.` });
      } else {
        datos[fin] = x; n++;
        add({ fn: 'enqueue', code: [1, 2, 3], fin, hl: fin, arco: vuelta,
          test: `enqueue(${x}):  ${cuenta}  ·  datos[${fin}] = ${x}`,
          say: extra.say || `${x} entra en la casilla ${fin}.`, predice: extra.predice });
      }
    };
    const deq = (detalle, extra) => {
      extra = extra || {};
      const x = datos[frente], viejo = frente, suma = frente + 1, nuevo = suma % CAP, vuelta = suma >= CAP;
      const cuenta = `frente = (${viejo} + 1) % 8 = ${nuevo}`;
      if (detalle) {
        add({ fn: 'dequeue', code: 1, hl: viejo, test: `x = datos[${viejo}]  →  ${x}`,
          say: `Se lee el dato del frente, la casilla ${viejo}.` });
        frente = nuevo;
        add({ fn: 'dequeue', code: 2, arco: vuelta, test: cuenta,
          say: `<code>frente</code> avanza una casilla. ${x} sigue escrito en la casilla ${viejo}, pero ya quedó fuera de la fila: la fila empieza en <code>frente</code> y abarca <code>n</code> casillas.` });
        n--;
        add({ fn: 'dequeue', code: 3, test: `n--  →  n = ${n}`,
          say: `<code>n</code> baja a ${n}. La casilla ${viejo} cuenta como libre aunque conserve la ${x}: la próxima escritura la va a pisar.` });
        add({ fn: 'dequeue', code: 4, test: `return ${x}`,
          say: `Sale ${x}. Cambiaron dos enteros; ningún dato se movió ni se borró.` });
      } else {
        frente = nuevo; n--;
        add({ fn: 'dequeue', code: [1, 2, 3, 4], arco: vuelta,
          test: `dequeue() → ${x}:  ${cuenta}`,
          say: extra.say || `Sale ${x} y <code>frente</code> avanza a la casilla ${nuevo}.` });
      }
    };

    enq('A', true);
    enq('B', false, { say: `B entra en la casilla 1: n lugares después de <code>frente</code>. Ahora las tres líneas en un solo paso.` });
    enq('C', false);
    enq('D', false);
    enq('E', false, { say: `La fila ocupa las casillas 0 a 4, en orden. Hasta aquí parece un arreglo normal.` });
    deq(true);
    deq(false);
    deq(false, { say: `Sale C. Las casillas 0, 1 y 2 quedaron libres, antes de <code>frente</code>. En la opción 2 ya no se volverían a usar.` });
    enq('F', false);
    enq('G', false);
    enq('H', false, { say: `H entra en la casilla 7, la última del arreglo.`,
      predice: `con <code>frente = 3</code> y <code>n = 5</code>, ¿en qué casilla entra el siguiente?` });
    enq('I', true, {
      say1: `3 + 5 = 8, y la casilla 8 no existe. El residuo de dividir entre 8 da <b>0</b>: el índice dio la vuelta y cae en la primera casilla.`,
      say2: `I se escribe en la casilla 0, encima de la A que había quedado ahí. Esa casilla estaba libre.`,
      say3: `<code>n</code> sube a 6. La fila es D E F G H I: empieza en la casilla 3, llega a la 7 y continúa en la 0.` });
    enq('J', false);
    enq('K', false, { say: `K entra en la casilla 2. Las 8 casillas están ocupadas: n = 8.` });
    add({ fn: 'enqueue', code: 0, fin: (frente + n) % CAP, test: 'llena: (3 + 8) % 8 = 3 = frente',
      say: `Con la fila llena, la cuenta de <code>fin</code> da 3, la casilla de <code>frente</code>. Con la fila vacía también da <code>frente</code>. Por eso la clase guarda <code>n</code>: dos índices solos no distinguen vacía de llena. La precondición <code>n &lt; 8</code> de <code>enqueue</code> evita escribir encima de D.` });
    deq(false);
    deq(false);
    deq(false);
    deq(false, { say: `Sale G y <code>frente</code> llega a la casilla 7.` });
    deq(false, { say: `(7 + 1) % 8 = 0: <code>frente</code> también da la vuelta. La fila es I J K, en las casillas 0, 1 y 2.` });
    add({ fn: 'dequeue', code: -1, test: `11 enqueue y 8 dequeue, ningún dato movido`,
      say: `Cada operación cambió una casilla y uno o dos enteros: todas son O(1). Los datos no se mueven; los índices recorren el arreglo y el <code>% 8</code> los regresa al principio.` });

    return { frames: F, tipo: 'circular' };
  }

  function trazar(alg) {
    return alg === 'pila-lados' ? trazarPilaLados()
         : alg === 'fila-lados' ? trazarFilaLados()
         : alg === 'pop-back' ? trazarPopBack()
         : alg === 'arreglo-ingenuo' ? trazarIngenuo()
         : trazarCircular();
  }

  /* ==========================================================
     DIBUJO
     ========================================================== */

  // Carriles de lista: nodo 130 × 50 (dato | next), columnas cada 175.
  const NW = 130, NH = 50, NPASO = 175, NX0 = 24;

  function dibujarCarriles(capa, f, uid, conTitulo) {
    const ALTO = conTitulo ? 172 : 0;
    f.carriles.forEach((L, i) => {
      const y0 = i * ALTO;
      const yTag = conTitulo ? y0 + 36 : 4;
      const yN = yTag + 32;
      if (i > 0) capa.appendChild(el('line', { x1: 0, y1: y0 - 10, x2: 1180, y2: y0 - 10, class: 'pf-sep' }));
      if (conTitulo) {
        capa.appendChild(el('text', { x: NX0, y: y0 + 22, class: 'pf-tit' }, L.tit));
        if (L.costo) capa.appendChild(el('text', { x: 1160, y: y0 + 22, class: 'pf-costo ' + (L.costo.cls || '') }, L.costo.t));
      }
      const pos = n => ({ x: NX0 + n.c * NPASO, y: yN });
      // flechas
      for (const id in L.nodos) {
        const n = L.nodos[id];
        if (!n.next || !L.nodos[n.next]) continue;
        const p = pos(n), q = pos(L.nodos[n.next]);
        const tipo = n.est === 'liberado' ? 'muerta' : n.flecha;
        const cls = tipo === 'colgante' ? 'pf-colgante' : 'sl-flecha' + (tipo ? ' ' + tipo : '');
        const mk = tipo === 'colgante' ? 'e' : tipo === 'muerta' ? 'c' : tipo === 'nueva' ? 'b' : 'a';
        capa.appendChild(el('line', { x1: p.x + 107, y1: p.y + NH / 2, x2: q.x - 2, y2: q.y + NH / 2,
          class: cls, 'marker-end': `url(#${uid}-${mk})` }));
      }
      // nodos
      for (const id in L.nodos) {
        const n = L.nodos[id], p = pos(n);
        const g = el('g', { class: 'sl-nodo' + (n.est ? ' ' + n.est : '') });
        g.appendChild(el('rect', { x: p.x, y: p.y, width: NW, height: NH, rx: 8, class: 'caja' }));
        g.appendChild(el('line', { x1: p.x + 85, y1: p.y, x2: p.x + 85, y2: p.y + NH, class: 'div' }));
        g.appendChild(el('text', { x: p.x + 42, y: p.y + NH / 2 + 9, class: 'dato' }, n.dato));
        g.appendChild(el('circle', { cx: p.x + 107, cy: p.y + NH / 2, r: 4.5, class: 'raiz' }));
        if (n.next === null)
          g.appendChild(el('line', { x1: p.x + 92, y1: p.y + NH - 7, x2: p.x + NW - 7, y2: p.y + 7,
            class: 'sl-nulo' + (n.flecha === 'nueva' ? ' nueva' : '') }));
        if (n.est === 'liberado') {
          const tapado = Object.values(L.ptrs).includes(id);
          g.appendChild(el('text', { x: p.x + NW / 2, y: tapado ? p.y + NH + 20 : p.y - 10, class: 'sl-etq' }, 'liberado'));
        }
        capa.appendChild(g);
      }
      // punteros con nombre, encima del nodo
      const porNodo = {};
      for (const nom in L.ptrs) {
        const id = L.ptrs[nom];
        if (id && L.nodos[id]) (porNodo[id] = porNodo[id] || []).push(nom);
      }
      for (const id in porNodo) {
        let cursor = pos(L.nodos[id]).x;
        porNodo[id].forEach(nom => {
          const w = 16 + nom.length * 10.5;
          const g = el('g', { class: 'sl-ptr ' + (L.clases[nom] || 'ph') });
          g.appendChild(el('rect', { x: cursor, y: yTag, width: w, height: 25, rx: 6 }));
          g.appendChild(el('text', { x: cursor + w / 2, y: yTag + 18 }, nom));
          capa.appendChild(g);
          cursor += w + 6;
        });
      }
      if (conTitulo && L.linea)
        capa.appendChild(el('text', { x: NX0, y: yN + NH + 34, class: 'pf-linea' }, L.linea));
    });
  }

  // Tiras de arreglo: casilla de 84, paso de 92.
  const CW = 84, CPASO = 92, CX0 = 24;

  function dibujarTira(capa, t, y0, uid) {
    const yIdx = y0 + 46, yC = y0 + 56, CH = 60;
    capa.appendChild(el('text', { x: CX0, y: y0 + 20, class: 'pf-tit' }, t.tit));
    t.celdas.forEach((c, i) => {
      const x = CX0 + i * CPASO;
      capa.appendChild(el('text', { x: x + CW / 2, y: yIdx, class: 'pf-idx' }, i));
      const g = el('g', { class: 'pf-celda' + (c.est ? ' ' + c.est : '') });
      g.appendChild(el('rect', { x, y: yC, width: CW, height: CH, rx: 8 }));
      if (c.v !== null) g.appendChild(el('text', { x: x + CW / 2, y: yC + CH / 2 + 9, class: 'pf-val' }, c.v));
      if (c.est === 'mov') g.appendChild(el('text', { x: x + 12, y: yC + 20, class: 'pf-mini err' }, '←'));
      capa.appendChild(g);
    });
    if (t.fuera) {
      const x = CX0 + CAP * CPASO;
      const g = el('g', { class: 'pf-celda fuera' });
      g.appendChild(el('rect', { x, y: yC, width: CW, height: CH, rx: 8 }));
      g.appendChild(el('text', { x: x + CW / 2, y: yC + CH / 2 + 9, class: 'pf-val' }, t.fuera));
      capa.appendChild(g);
      capa.appendChild(el('text', { x: x + CW / 2, y: yIdx, class: 'pf-idx err' }, '8?'));
    }
    (t.tags || []).forEach(([nom, idx, cls, fila]) => {
      const w = 16 + nom.length * 10.5;
      const cx = CX0 + Math.min(idx, CAP) * CPASO + CW / 2;
      const y = yC + CH + 8 + fila * 30;
      const g = el('g', { class: 'sl-ptr ' + cls });
      g.appendChild(el('rect', { x: cx - w / 2, y, width: w, height: 25, rx: 6 }));
      g.appendChild(el('text', { x: cx, y: y + 18 }, nom));
      capa.appendChild(g);
    });
    if (t.costo) {
      const x = CX0 + CAP * CPASO + CW + 20;
      capa.appendChild(el('text', { x, y: yC + 26, class: 'pf-costo izq ' + (t.costo.cls || '') }, t.costo.t));
      if (t.costo.t2) capa.appendChild(el('text', { x, y: yC + 54, class: 'pf-costo2' }, t.costo.t2));
    }
  }

  function estadoCircular(f) {
    const celdas = f.datos.map(v => ({ v, est: v === null ? '' : 'basura', ord: 0 }));
    for (let k = 0; k < f.n; k++) {
      const i = (f.frente + k) % CAP;
      celdas[i].est = 'ocupada'; celdas[i].ord = k + 1;
    }
    if (f.hl !== null) celdas[f.hl].est += ' hl';
    return celdas;
  }

  function dibujarCircular(capa, f, uid) {
    const celdas = estadoCircular(f);
    const yIdx = 58, yC = 68, CH = 66;
    // arco de la vuelta: de la casilla 7 a la 0, por arriba
    const x7 = CX0 + 7 * CPASO + CW / 2, x0 = CX0 + CW / 2;
    capa.appendChild(el('path', {
      d: `M ${x7} ${yIdx - 22} C ${x7} 4, ${x0} 4, ${x0} ${yIdx - 22}`,
      class: 'pf-arco' + (f.arco ? ' on' : ''), 'marker-end': `url(#${uid}-${f.arco ? 'v' : 't'})` }));
    capa.appendChild(el('text', { x: (x7 + x0) / 2, y: 34, class: 'pf-arco-txt' + (f.arco ? ' on' : '') },
      'después de la 7 sigue la 0:  % 8'));

    celdas.forEach((c, i) => {
      const x = CX0 + i * CPASO;
      capa.appendChild(el('text', { x: x + CW / 2, y: yIdx, class: 'pf-idx' }, i));
      const g = el('g', { class: 'pf-celda ' + c.est });
      g.appendChild(el('rect', { x, y: yC, width: CW, height: CH, rx: 8 }));
      if (c.v !== null) g.appendChild(el('text', { x: x + CW / 2, y: yC + CH / 2 + 10, class: 'pf-val' }, c.v));
      if (c.ord) g.appendChild(el('text', { x: x + 8, y: yC + 17, class: 'pf-mini' }, c.ord + '°'));
      capa.appendChild(g);
    });
    // tramo ocupado por la fila, debajo de las casillas
    const yB = yC + CH + 76;
    if (f.n > 0) {
      const fin = f.frente + f.n - 1;
      const tramos = fin < CAP ? [[f.frente, fin]] : [[f.frente, CAP - 1], [0, fin - CAP]];
      tramos.forEach(([a, b], k) => {
        const xa = CX0 + a * CPASO + 10, xb = CX0 + b * CPASO + CW - 10;
        const corta = k === 0 && tramos.length === 2;
        capa.appendChild(el('line', { x1: xa, y1: yB, x2: corta ? CX0 + 7 * CPASO + CW + 4 : xb, y2: yB,
          class: 'pf-banda', 'marker-end': corta ? `url(#${uid}-v)` : '' }));
        if (k === 1) capa.appendChild(el('line', { x1: CX0 - 6, y1: yB, x2: xb, y2: yB, class: 'pf-banda' }));
      });
      capa.appendChild(el('text', { x: CX0 + f.frente * CPASO + 10, y: yB + 24, class: 'pf-banda-txt' },
        tramos.length === 2 ? 'la fila: de frente hasta la 7, y sigue en la 0' : 'la fila'));
    }
    // punteros
    const tags = [['frente', f.frente, 'pp', 0]];
    if (f.fin !== null) tags.push(['fin', f.fin, 'pn', 1]);
    tags.forEach(([nom, idx, cls, fila]) => {
      const w = 16 + nom.length * 10.5;
      const cx = CX0 + idx * CPASO + CW / 2;
      const y = yC + CH + 8 + fila * 30;
      const g = el('g', { class: 'sl-ptr ' + cls });
      g.appendChild(el('rect', { x: cx - w / 2, y, width: w, height: 25, rx: 6 }));
      g.appendChild(el('text', { x: cx, y: y + 18 }, nom));
      capa.appendChild(g);
    });

    // anillo: la misma memoria vista como círculo
    const CX = 992, CY = 138, R = 88, S = 46;
    capa.appendChild(el('circle', { cx: CX, cy: CY, r: R, class: 'pf-anillo' }));
    celdas.forEach((c, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / CAP;
      const cs = Math.cos(a), sn = Math.sin(a);
      const x = CX + R * cs, y = CY + R * sn;
      const g = el('g', { class: 'pf-celda ' + c.est + (i === f.frente ? ' es-frente' : '') + (i === f.fin ? ' es-fin' : '') });
      g.appendChild(el('rect', { x: x - S / 2, y: y - S / 2, width: S, height: S, rx: 6 }));
      if (c.v !== null) g.appendChild(el('text', { x, y: y + 7, class: 'pf-val chica' }, c.v));
      capa.appendChild(g);
      capa.appendChild(el('text', { x: CX + (R - 42) * cs, y: CY + (R - 42) * sn + 5, class: 'pf-idx chica' }, i));
      if (i === f.frente || i === f.fin) {
        const lado = Math.abs(cs) < 0.2 ? 0 : Math.sign(cs);
        const rr = lado === 0 ? R + 34 : R + 36;
        const nom = i === f.frente && i === f.fin ? 'frente · fin' : i === f.frente ? 'frente' : 'fin';
        capa.appendChild(el('text', { x: CX + rr * cs, y: CY + rr * sn + (sn > 0.2 ? 12 : sn < -0.2 ? 0 : 5),
          class: 'pf-anillo-etq ' + (i === f.frente ? 'acc' : 'ok'),
          'text-anchor': lado > 0 ? 'start' : lado < 0 ? 'end' : 'middle' }, nom));
      }
    });
  }

  /* ==========================================================
     CASCARÓN: SVG + barra + código/explicación + fragments
     ========================================================== */
  function construir(cont) {
    const alg = cont.dataset.alg || 'circular';
    const run = trazar(alg);
    const uid = 'pf' + (++uidSig);
    const F = run.frames;
    cont.innerHTML = '';

    const alto = run.tipo === 'carriles' ? (F[0].carriles.length > 1 ? 330 : 112)
               : run.tipo === 'tiras' ? 318 : 284;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 1180 ${alto}`);
    svg.setAttribute('class', 'pf-svg');
    svg.style.height = alto * 0.94 + 'px';
    svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');
    const punta = (id, cls) =>
      `<marker id="${uid}-${id}" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto"><path d="M0,0 L13,6 L0,12 z" class="${cls}"/></marker>`;
    svg.innerHTML = '<defs>' + punta('a', 'sl-punta') + punta('b', 'sl-punta nueva') +
      punta('c', 'sl-punta muerta') + punta('e', 'pf-punta-err') +
      punta('t', 'pf-punta-tenue') + punta('v', 'pf-punta-acc') + '</defs><g class="pf-capa"></g>';
    cont.appendChild(svg);
    const capa = svg.querySelector('.pf-capa');

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
    const chips = [...barra.querySelectorAll('.sim-chip')];

    const abajo = document.createElement('div');
    abajo.className = 'sim-abajo';
    const conCodigo = run.codigo || run.tipo === 'circular';
    let pre = null, fnActual = null, lineas = [];
    if (conCodigo) {
      pre = document.createElement('pre');
      pre.className = 'sim-codigo pf-codigo';
      abajo.appendChild(pre);
    }
    const dice = document.createElement('p');
    dice.className = 'sim-dice' + (conCodigo ? '' : ' pf-dice-ancho');
    abajo.appendChild(dice);
    cont.appendChild(abajo);

    const ponerCodigo = nombre => {
      if (!pre || nombre === fnActual) return;
      fnActual = nombre;
      pre.innerHTML = CODIGO[nombre].map(l => `<div class="sim-linea">${pintarCodigo(l)}</div>`).join('');
      lineas = [...pre.querySelectorAll('.sim-linea')];
    };
    if (run.codigo) ponerCodigo(run.codigo);

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
      if (run.tipo === 'carriles') dibujarCarriles(capa, f, uid, f.carriles.length > 1);
      else if (run.tipo === 'tiras') f.tiras.forEach((t, i) => dibujarTira(capa, t, i * 168, uid));
      else dibujarCircular(capa, f, uid);

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
    slide.querySelectorAll('.sim-pf').forEach(cont => {
      if (!cont._simPintar) return;
      const vistos = cont.querySelectorAll('.sim-fragments .fragment.visible').length;
      cont._simPintar(vistos);
      const b = cont.querySelectorAll('.sim-ctrl button');
      if (b[0]) b[0].disabled = vistos === 0;
      if (b[1]) b[1].disabled = vistos >= cont._simTotal - 1;
    });
  }

  function init() {
    const sims = document.querySelectorAll('.sim-pf');
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

if (typeof module !== 'undefined') module.exports = SimPilasFilas;
