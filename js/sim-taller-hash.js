/* ============================================================
   SIM-TALLER-HASH — ejecución paso a paso de los tres problemas del
   Taller 2: LC 706 Design HashMap, LC 49 Group Anagrams y
   LC 560 Subarray Sum Equals K.
   Requiere Reveal.js 5.x, curso-slides.js y, para los estilos de
   casillas y barra, sim-hash.css. Incluir después de curso-slides.js:

       SimTallerHash.init();

   Uso en HTML:

     <div class="sim-hash sim-taller" data-alg="hashmap"></div>

   data-alg:
     hashmap     MyHashMap con sondeo lineal y lápidas (M = 7)
     anagramas   agrupar ["eat","tea","tan","ate","nat","bat"]
     prefijos    contar subarreglos de [1, 2, -2, 2, 1] que suman 3

   Un paso = un fragment del slide. El código de CODIGO es idéntico
   al que se escribe en los slides anteriores a cada animación.
   ============================================================ */

const SimTallerHash = (() => {

  const CODIGO = {
    buscar: [
      'int buscar(int key) {',
      '    int pos = key % M;',
      '    while (claves[pos] != VACIA) {',
      '        if (claves[pos] == key)',
      '            return pos;',
      '        pos = (pos + 1) % M;',
      '    }',
      '    return -1;',
      '}'
    ],
    put: [
      'void put(int key, int value) {',
      '    int pos = buscar(key);',
      '    if (pos != -1) {',
      '        valores[pos] = value;',
      '        return;',
      '    }',
      '    pos = key % M;',
      '    while (claves[pos] != VACIA &&',
      '           claves[pos] != BORRADA)',
      '        pos = (pos + 1) % M;',
      '    claves[pos] = key;',
      '    valores[pos] = value;',
      '}'
    ],
    get: [
      'int get(int key) {',
      '    int pos = buscar(key);',
      '    if (pos == -1)',
      '        return -1;',
      '    return valores[pos];',
      '}'
    ],
    remove: [
      'void remove(int key) {',
      '    int pos = buscar(key);',
      '    if (pos != -1)',
      '        claves[pos] = BORRADA;',
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
  const escapar = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function pintarCodigo(linea) {
    let cod = linea, cm = '';
    const i = linea.indexOf('//');
    if (i >= 0) { cod = linea.slice(0, i); cm = linea.slice(i); }
    let h = escapar(cod)
      .replace(/\b(int|void|while|if|return|true|false)\b/g, '\u0001$1\u0002')
      .replace(/(?<![\w])(\d+)(?![\w])/g, '\u0003$1\u0002');
    h = h.replace(/\u0001/g, '<span class="kw">').replace(/\u0003/g, '<span class="num">').replace(/\u0002/g, '</span>');
    return h + (cm ? '<span class="cm">' + escapar(cm) + '</span>' : '');
  }

  /* ==========================================================
     LC 706 · MyHashMap con lápidas
     ========================================================== */
  function trazarHashmap() {
    const M = 7, VACIA = -1, BORRADA = -2, F = [];
    const claves = new Array(M).fill(VACIA), valores = new Array(M).fill(null);
    const add = o => F.push(Object.assign({
      claves: claves.slice(), valores: valores.slice(), ruta: [], marcas: {}
    }, o));
    // ruta de buscar: casillas hasta encontrar key o una VACIA
    const rutaBuscar = (k, tabla) => {
      const r = []; let pos = k % M;
      while (tabla[pos] !== VACIA) { r.push(pos); if (tabla[pos] === k) return { r, pos }; pos = (pos + 1) % M; }
      r.push(pos); return { r, pos: -1 };
    };
    const rutaLibre = k => {
      const r = []; let pos = k % M;
      while (claves[pos] !== VACIA && claves[pos] !== BORRADA) { r.push(pos); pos = (pos + 1) % M; }
      r.push(pos); return { r, pos };
    };
    const marcasRuta = (r, fin, est) => {
      const m = {}; r.forEach((c, j) => { m[c] = j < r.length - 1 ? 'choque' : est; }); return m;
    };

    add({ fn: 'put', code: -1, chips: [['M = 7', ''], ['VACIA = -1', ''], ['BORRADA = -2', '']],
      test: 'claves[7] en VACIA',
      say: `Dos arreglos paralelos: <code>claves</code> y <code>valores</code>. La casilla <code>i</code> guarda una pareja. Aquí M vale 7 para que se vea completa; en la solución vale 20011, y el código es el mismo.` });

    const insertar = (k, v, extra) => {
      const b = rutaBuscar(k, claves);
      const l = rutaLibre(k);
      claves[l.pos] = k; valores[l.pos] = v;
      add(Object.assign({ fn: 'put', code: [1, 6, 7, 8, 9, 10, 11], ruta: l.r, marcas: marcasRuta(l.r, l.pos, 'hl'),
        chips: [[`key = ${k}`, ''], [`value = ${v}`, ''], [`pos = ${l.pos}`, 'cok']],
        test: `put(${k}, ${v}):  ${k} % 7 = ${k % M}  ·  ruta ${l.r.join(' → ')}`,
        say: '' }, extra));
    };
    insertar(10, 1, { say: `<code>put(10, 1)</code>. Primero <code>buscar</code>: 10 % 7 = 3 y la casilla 3 está vacía, así que el 10 no está guardado. El segundo ciclo busca la primera casilla libre desde la 3, que es la misma 3, y ahí quedan la clave y el valor.` });
    insertar(17, 2, { say: `<code>put(17, 2)</code>. 17 % 7 también es 3. La casilla 3 está ocupada por el 10, así que el ciclo avanza a la 4 y ahí guarda el 17.` });
    insertar(24, 3, { say: `<code>put(24, 3)</code>. Otra vez la casilla 3: prueba la 3 y la 4, ocupadas, y guarda el 24 en la 5.`,
      predice: `ahora se llama <code>put(17, 20)</code>. ¿Dónde queda el 20?` });

    // put(17, 20): actualización
    {
      const b = rutaBuscar(17, claves);
      valores[b.pos] = 20;
      add({ fn: 'put', code: [1, 2, 3, 4], ruta: b.r, marcas: marcasRuta(b.r, b.pos, 'hl'),
        chips: [['key = 17', ''], ['value = 20', ''], [`pos = ${b.pos}`, 'cok']],
        test: 'put(17, 20):  buscar lo encuentra en la casilla 4  →  se actualiza',
        say: `<code>buscar(17)</code> prueba la 3 y lo encuentra en la 4. Como <code>pos</code> no es −1, se cambia el valor y la función termina. Por eso <code>put</code> busca antes de insertar: sin esa búsqueda, el 17 quedaría guardado dos veces.` });
    }
    // get(24)
    {
      const b = rutaBuscar(24, claves);
      add({ fn: 'get', code: [1, 2, 4], ruta: b.r, marcas: marcasRuta(b.r, b.pos, 'hl'),
        chips: [['key = 24', ''], [`pos = ${b.pos}`, 'cok'], ['regresa 3', 'ci']],
        test: 'get(24):  ruta 3 → 4 → 5  →  regresa 3',
        say: `<code>get(24)</code> sigue la misma ruta que siguió <code>put</code>: 3, 4 y 5. En la 5 encuentra la clave y regresa su valor, 3.` });
    }
    // remove(17)
    {
      const b = rutaBuscar(17, claves);
      claves[b.pos] = BORRADA;
      add({ fn: 'remove', code: [1, 2, 3], ruta: b.r, marcas: Object.assign(marcasRuta(b.r, b.pos, ''), { [b.pos]: 'borrada' }),
        chips: [['key = 17', ''], [`pos = ${b.pos}`, 'cok']],
        test: 'remove(17):  claves[4] = BORRADA',
        say: `<code>remove(17)</code> encuentra el 17 en la casilla 4 y escribe ahí <code>BORRADA</code>, la lápida. El valor viejo se queda, pero ya nadie lo va a leer.`,
        predice: `¿<code>get(24)</code> sigue encontrando al 24, que está detrás de la lápida?` });
    }
    // get(24) con lápida
    {
      const b = rutaBuscar(24, claves);
      add({ fn: 'buscar', code: [1, 2, 3, 5], ruta: b.r, marcas: Object.assign(marcasRuta(b.r, b.pos, 'hl'), { 4: 'borrada' }),
        chips: [['key = 24', ''], [`pos = ${b.pos}`, 'cok'], ['get regresa 3', 'ci']],
        test: 'get(24):  la casilla 4 es BORRADA, no VACIA  →  sigue hasta la 5',
        say: `Sí. El <code>while</code> de <code>buscar</code> solo se detiene en una casilla <code>VACIA</code>. La lápida no es <code>VACIA</code>, así que el ciclo pasa por ella y encuentra al 24 en la 5.` });
    }
    // hipotético: sin lápida
    {
      const falsa = claves.slice(); falsa[4] = VACIA;
      const b = rutaBuscar(24, falsa);
      add({ claves: falsa, fn: 'buscar', code: [1, 2, 7], ruta: b.r, marcas: { 3: 'choque', 4: 'fantasma' },
        chips: [['hipotético', 'cj'], ['get regresaría -1', 'cj']],
        test: 'si remove escribiera VACIA:  get(24) se detiene en la 4',
        say: `Comparemos con lo que pasaría si <code>remove</code> dejara la casilla en <code>VACIA</code>. <code>buscar(24)</code> se detendría en la 4 y respondería que el 24 no está, aunque sigue en la 5. Por eso hace falta un tercer valor.` });
    }
    // put(31, 5): buscar recorre hasta la vacía
    {
      const b = rutaBuscar(31, claves);
      add({ fn: 'buscar', code: [1, 2, 3, 5, 7], ruta: b.r, marcas: Object.assign(marcasRuta(b.r, -1, 'actual'), { 4: 'borrada' }),
        chips: [['key = 31', ''], ['buscar regresa -1', 'cj']],
        test: `put(31, 5):  buscar recorre ${b.r.join(' → ')} y llega a una VACIA`,
        say: `<code>put(31, 5)</code>. 31 % 7 = 3. Para saber si el 31 ya está, <code>buscar</code> no puede detenerse en la lápida: el 31 podría estar más adelante. Recorre 3, 4, 5 y 6, y en la 6, vacía, concluye que no está.` });
      const l = rutaLibre(31);
      claves[l.pos] = 31; valores[l.pos] = 5;
      add({ fn: 'put', code: [6, 7, 8, 9, 10, 11], ruta: l.r, marcas: marcasRuta(l.r, l.pos, 'hl'),
        chips: [['key = 31', ''], ['value = 5', ''], [`pos = ${l.pos}`, 'cok']],
        test: `put(31, 5):  primera casilla libre desde la 3  →  la ${l.pos}, la lápida`,
        say: `El segundo ciclo de <code>put</code> sí acepta las lápidas como casillas libres. Empieza en la 3, que está ocupada, y se detiene en la 4: el 31 reutiliza el lugar que dejó el 17.` });
    }
    add({ fn: 'put', code: -1, ruta: [], marcas: {}, chips: [['4 claves en 7 casillas', '']],
      test: 'buscar se detiene en VACIA; el ciclo de put se detiene en VACIA o BORRADA',
      say: `Esa es la única diferencia entre los dos ciclos, y es la que hace funcionar el borrado. <code>buscar</code> pasa de largo las lápidas porque la clave podría estar detrás. El ciclo de <code>put</code> las reutiliza porque solo necesita un lugar libre.` });
    return { frames: F, tipo: 'hashmap', M };
  }

  /* ==========================================================
     LC 49 · Group Anagrams
     ========================================================== */
  function trazarAnagramas() {
    const palabras = ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'];
    const F = [];
    const grupos = [];  // [{clave, lista}] en orden de creación
    const add = o => F.push(Object.assign({ grupos: JSON.parse(JSON.stringify(grupos)) }, o));
    add({ i: -1, test: 'grupos vacío', lineas: [],
      say: `Seis palabras y un mapa vacío. El mapa va de la clave de un grupo a la lista de palabras que tienen esa clave. Todavía no hay ningún grupo.` });

    palabras.forEach((p, i) => {
      const clave = p.split('').sort().join('');
      let g = grupos.find(x => x.clave === clave);
      const nuevo = !g;
      if (i === 0) {
        add({ i, test: `palabra = "${p}"`, lineas: [[`string palabra = strs[${i}];`, `"${p}"`], [`string clave = palabra;`, `"${p}"`]],
          say: `Primera vuelta: <code>palabra</code> es "${p}". La clave empieza como una copia de la palabra.` });
        add({ i, test: `sort(clave)  →  "${clave}"`, lineas: [[`string palabra = strs[${i}];`, `"${p}"`], [`string clave = palabra;`, `"${p}"`], ['sort(clave.begin(), clave.end());', `"${clave}"`]],
          say: `<code>sort</code> ordena las letras de la clave: "${p}" se vuelve "${clave}". La palabra no cambia, porque <code>clave</code> es una copia.` });
      }
      if (nuevo) { g = { clave, lista: [] }; grupos.push(g); }
      g.lista.push(p);
      const says = {
        0: `<code>grupos["${clave}"]</code> todavía no existe. El operador <code>[]</code> del mapa la crea con una lista vacía, y <code>push_back</code> agrega "${p}".`,
        1: `"tea" ordenada también es "aet". El mapa ya tiene esa clave, así que "tea" se agrega a la misma lista que "eat".`,
        2: `"tan" ordenada es "ant", una clave nueva: se crea un segundo grupo.`,
        3: `"ate" da "aet" otra vez y entra al primer grupo, que ya tiene tres palabras.`,
        4: `"nat" da "ant" y se junta con "tan".`,
        5: `"bat" da "abt", una clave que nadie más tiene: queda sola en su grupo.`
      };
      add({ i, hl: clave, nuevo, test: `grupos["${clave}"].push_back("${p}")`,
        lineas: [[`string palabra = strs[${i}];`, `"${p}"`], ['sort(clave.begin(), clave.end());', `"${clave}"`], [`grupos[clave].push_back(palabra);`, nuevo ? 'clave nueva' : `${g.lista.length} en el grupo`]],
        say: says[i],
        predice: i === 2 ? `¿a qué grupo va "ate"?` : undefined });
    });
    add({ i: 6, test: `resultado: ${grupos.length} grupos`, lineas: [['for (auto par : grupos)', 'par.second'], ['resultado.push_back(par.second);', `${grupos.length} listas`]],
      say: `Al final se recorre el mapa y cada lista, <code>par.second</code>, se agrega al resultado. Hubo una sola pasada por las palabras, y cada una se ordenó una vez.` });
    return { frames: F, tipo: 'anagramas', palabras };
  }

  /* ==========================================================
     LC 560 · Subarray Sum Equals K
     ========================================================== */
  function trazarPrefijos() {
    const nums = [1, 2, -2, 2, 1], k = 3, F = [];
    const vistos = [[0, 1]];   // [suma, veces] en orden de aparición
    let suma = 0, cuenta = 0;
    const prefijos = [0];
    const get = s => { const e = vistos.find(x => x[0] === s); return e ? e[1] : 0; };
    const add = o => F.push(Object.assign({
      vistos: JSON.parse(JSON.stringify(vistos)), suma, cuenta, prefijos: prefijos.slice(), nums, k
    }, o));
    add({ i: -1, linea: 'vistos[0] = 1;', test: 'k = 3  ·  vistos = { 0: 1 }',
      chips: [['suma = 0', ''], ['cuenta = 0', '']], hlMapa: 0,
      say: `Antes del ciclo, el mapa ya guarda la suma 0 una vez: es la suma del prefijo vacío, antes del primer elemento. Sin esa entrada, los subarreglos que empiezan en la posición 0 no se contarían.` });

    nums.forEach((x, i) => {
      suma += x;
      prefijos.push(suma);
      const buscado = suma - k;
      const veces = get(buscado);
      cuenta += veces;
      // subarreglos que terminan en i: empiezan después de cada j con prefijo == buscado
      const rangos = [];
      prefijos.slice(0, i + 1).forEach((s, j) => { if (s === buscado) rangos.push([j, i]); });
      const says = {
        0: `Llega el 1: <code>suma</code> vale 1. Un subarreglo que termine aquí y sume 3 necesita un prefijo anterior de 1 − 3 = −2. El mapa no tiene −2: no hay ninguno.`,
        1: `Llega el 2: <code>suma</code> vale 3 y se busca 3 − 3 = 0. El 0 está una vez, el prefijo vacío: el subarreglo [1, 2], de la posición 0 a la 1, suma 3.`,
        2: `Llega el −2: <code>suma</code> baja a 1 y se busca −2. No está. Con negativos la suma puede bajar, y por eso aquí no sirve una ventana de dos punteros.`,
        3: `Llega el 2: <code>suma</code> vuelve a 3 y se busca 0, que está una vez: el subarreglo [1, 2, −2, 2], de la 0 a la 3, también suma 3.`,
        4: `Llega el 1: <code>suma</code> vale 4 y se busca 1. El 1 está <b>dos veces</b> en el mapa, después del índice 0 y después del índice 2. Son dos subarreglos que terminan aquí: [2, −2, 2, 1] y [2, 1]. <code>cuenta</code> sube en 2 de una vez.`
      };
      add({ i, fase: 'consulta', linea: `int buscado = suma - k;   // ${suma} - 3 = ${buscado}`, buscado, rangos,
        test: `buscado = ${buscado}  →  vistos[${buscado}] = ${veces}  ·  cuenta += ${veces}`,
        chips: [[`suma = ${suma}`, ''], [`buscado = ${buscado}`, 'ci'], [`cuenta = ${cuenta}`, veces ? 'cok' : '']],
        hlMapa: veces ? buscado : null, faltaMapa: veces ? null : buscado,
        say: says[i], predice: i === 3 ? `en el siguiente paso la suma es 4 y se busca 1. ¿Cuántas veces está el 1 en el mapa?` : undefined });
      const e = vistos.find(v => v[0] === suma);
      if (e) e[1]++; else vistos.push([suma, 1]);
      const saysG = {
        0: `Ahora sí se guarda la suma actual: <code>vistos[1]</code> pasa a 1. Se guarda después de consultar, para que un subarreglo nunca termine antes de empezar.`,
        1: `<code>vistos[3]</code> pasa a 1.`,
        2: `<code>vistos[1]</code> pasa a 2: la suma 1 ya había aparecido. Ese 2 es el que se va a usar dos pasos más adelante.`,
        3: `<code>vistos[3]</code> pasa a 2.`,
        4: `<code>vistos[4]</code> pasa a 1, y el ciclo termina.`
      };
      add({ i, fase: 'guarda', linea: `vistos[suma] = vistos[suma] + 1;   // vistos[${suma}] = ${get(suma)}`, hlMapa: suma, guardado: true,
        test: `vistos[${suma}] = ${get(suma)}`,
        chips: [[`suma = ${suma}`, ''], [`cuenta = ${cuenta}`, '']],
        say: saysG[i] });
    });
    add({ i: 5, linea: 'return cuenta;   // 4', test: `cuenta = ${cuenta}  ·  una sola pasada`,
      chips: [[`cuenta = ${cuenta}`, 'cok']], hlMapa: null,
      say: `Resultado: 4 subarreglos. Cada elemento hizo una consulta y una escritura en el mapa, así que el costo es orden n en promedio, en lugar del orden n al cuadrado de probar cada inicio y cada fin.` });
    return { frames: F, tipo: 'prefijos' };
  }

  function trazar(alg) {
    return alg === 'hashmap' ? trazarHashmap() : alg === 'anagramas' ? trazarAnagramas() : trazarPrefijos();
  }

  /* ==========================================================
     DIBUJO
     ========================================================== */
  function dibujarHashmap(capa, f, uid, M) {
    const x0 = 4, cw = 78, ch = 82, paso = 86, y0 = 80;
    // ruta
    for (let j = 1; j < f.ruta.length; j++) {
      const a = f.ruta[j - 1], b = f.ruta[j];
      const xa = x0 + a * paso + cw / 2, xb = x0 + b * paso + cw / 2;
      const h = Math.min(56, 18 + Math.abs(b - a) * 9);
      capa.appendChild(el('path', { d: `M ${xa} ${y0 - 4} C ${xa} ${y0 - 4 - h}, ${xb} ${y0 - 4 - h}, ${xb} ${y0 - 6}`,
        class: 'sh-arco', 'marker-end': `url(#${uid}-r)` }));
    }
    for (let i = 0; i < M; i++) {
      const x = x0 + i * paso, c = f.claves[i];
      let est = f.marcas[i] || (c >= 0 ? 'ocupada' : '');
      if (c === -2 && !f.marcas[i]) est = 'borrada';
      const g = el('g', { class: 'pf-celda ' + est });
      g.appendChild(el('rect', { x, y: y0, width: cw, height: ch, rx: 8 }));
      if (c >= 0) {
        g.appendChild(el('text', { x: x + cw / 2, y: y0 + 38, class: 'pf-val' }, c));
        g.appendChild(el('text', { x: x + cw / 2, y: y0 + 66, class: 'st-valor' }, 'valor ' + f.valores[i]));
      } else if (c === -2) {
        g.appendChild(el('text', { x: x + cw / 2, y: y0 + 38, class: 'st-lapida' }, 'BORRADA'));
        g.appendChild(el('text', { x: x + cw / 2, y: y0 + 66, class: 'st-valor tenue' }, '(17)'));
      } else if (est === 'fantasma') {
        g.appendChild(el('text', { x: x + cw / 2, y: y0 + 46, class: 'st-lapida err' }, 'VACIA?'));
      } else {
        g.appendChild(el('text', { x: x + cw / 2, y: y0 + 48, class: 'st-vacia' }, 'VACIA'));
      }
      capa.appendChild(g);
      capa.appendChild(el('text', { x: x + cw / 2, y: y0 + ch + 22, class: 'pf-idx' }, i));
    }
  }

  function dibujarAnagramas(capa, f, palabras) {
    // palabras
    capa.appendChild(el('text', { x: 0, y: 26, class: 'pf-tit' }, 'strs'));
    palabras.forEach((p, i) => {
      const y = 44 + i * 44;
      const est = i === f.i ? 'hl' : i < f.i ? 'usada' : '';
      const g = el('g', { class: 'st-chip ' + est });
      g.appendChild(el('rect', { x: 0, y, width: 92, height: 36, rx: 7 }));
      g.appendChild(el('text', { x: 46, y: y + 25 }, `"${p}"`));
      capa.appendChild(g);
    });
    // cálculo
    capa.appendChild(el('text', { x: 130, y: 26, class: 'pf-tit' }, 'esta vuelta'));
    (f.lineas || []).forEach(([cod, val], j) => {
      const y = 62 + j * 52;
      capa.appendChild(el('text', { x: 130, y, class: 'st-cod' }, cod));
      capa.appendChild(el('text', { x: 130, y: y + 24, class: 'st-res' }, '→ ' + val));
    });
    // mapa
    const xm = 650;
    capa.appendChild(el('text', { x: xm, y: 26, class: 'pf-tit' }, 'grupos  (clave → lista)'));
    f.grupos.forEach((g, j) => {
      const y = 44 + j * 58;
      const on = g.clave === f.hl;
      const k = el('g', { class: 'st-clave' + (on ? ' on' : '') + (on && f.nuevo ? ' nueva' : '') });
      k.appendChild(el('rect', { x: xm, y, width: 104, height: 42, rx: 8 }));
      k.appendChild(el('text', { x: xm + 52, y: y + 28 }, `"${g.clave}"`));
      capa.appendChild(k);
      capa.appendChild(el('text', { x: xm + 116, y: y + 28, class: 'st-flecha' }, '→'));
      g.lista.forEach((p, q) => {
        const x = xm + 146 + q * 98;
        const ultimo = on && q === g.lista.length - 1;
        const c = el('g', { class: 'st-chip ' + (ultimo ? 'hl' : 'en-grupo') });
        c.appendChild(el('rect', { x, y: y + 3, width: 88, height: 36, rx: 7 }));
        c.appendChild(el('text', { x: x + 44, y: y + 28 }, `"${p}"`));
        capa.appendChild(c);
      });
    });
  }

  function dibujarPrefijos(capa, f, uid) {
    const x0 = 150, cw = 96, paso = 112, yA = 64, h = 58;
    capa.appendChild(el('text', { x: 0, y: yA + 38, class: 'pf-tit' }, 'nums'));
    // rangos encontrados (corchetes sobre el arreglo)
    (f.rangos || []).forEach(([j, i], q) => {
      const xa = x0 + j * paso + 4, xb = x0 + i * paso + cw - 4, y = yA - 16 - q * 16;
      capa.appendChild(el('path', { d: `M ${xa} ${y + 10} L ${xa} ${y} L ${xb} ${y} L ${xb} ${y + 10}`, class: 'st-rango' }));
    });
    f.nums.forEach((v, i) => {
      const x = x0 + i * paso;
      const est = i === f.i ? 'hl' : i < f.i ? 'ocupada' : '';
      const enRango = (f.rangos || []).some(([a, b]) => i >= a && i <= b);
      const g = el('g', { class: 'pf-celda ' + (enRango ? 'rango' : est) });
      g.appendChild(el('rect', { x, y: yA, width: cw, height: h, rx: 8 }));
      g.appendChild(el('text', { x: x + cw / 2, y: yA + 39, class: 'pf-val' }, v));
      capa.appendChild(g);
      capa.appendChild(el('text', { x: x + cw / 2, y: yA + h + 20, class: 'pf-idx' }, i));
    });
    // sumas prefijas, debajo, en las "fronteras"
    const yP = yA + h + 62;
    capa.appendChild(el('text', { x: 0, y: yP + 6, class: 'pf-tit' }, 'prefijos'));
    f.prefijos.forEach((s, j) => {
      const x = x0 + j * paso - 8;
      const actual = j === f.prefijos.length - 1 && f.i >= 0 && f.i < 5;
      capa.appendChild(el('text', { x, y: yP + 6, class: 'st-pref' + (actual ? ' on' : '') }, s));
    });
    // mapa vistos
    const xm = 790, ym = 30;
    capa.appendChild(el('text', { x: xm, y: ym, class: 'pf-tit' }, 'vistos  (suma → veces)'));
    f.vistos.forEach(([s, n], j) => {
      const y = ym + 16 + j * 46;
      const on = s === f.hlMapa;
      const g = el('g', { class: 'st-clave' + (on ? (f.guardado ? ' nueva' : ' on') : '') });
      g.appendChild(el('rect', { x: xm, y, width: 90, height: 38, rx: 8 }));
      g.appendChild(el('text', { x: xm + 45, y: y + 26 }, s));
      capa.appendChild(g);
      capa.appendChild(el('text', { x: xm + 104, y: y + 26, class: 'st-flecha' }, '→'));
      capa.appendChild(el('text', { x: xm + 136, y: y + 27, class: 'st-veces' + (on ? ' on' : '') }, n));
    });
    if (f.faltaMapa !== null && f.faltaMapa !== undefined) {
      const y = ym + 16 + f.vistos.length * 46;
      capa.appendChild(el('text', { x: xm, y: y + 26, class: 'st-falta' }, `${f.faltaMapa}: no está`));
    }
    // línea que se ejecuta
    capa.appendChild(el('text', { x: 0, y: 300, class: 'st-cod grande' }, f.linea || ''));
  }

  /* ==========================================================
     CASCARÓN
     ========================================================== */
  function construir(cont) {
    const run = trazar(cont.dataset.alg);
    const uid = 'st' + (++uidSig);
    const F = run.frames;
    cont.innerHTML = '';
    const med = { hashmap: [610, 196], anagramas: [1180, 316], prefijos: [1180, 316] }[run.tipo];
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${med[0]} ${med[1]}`);
    svg.setAttribute('class', 'sh-svg st-' + run.tipo);
    svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    svg.innerHTML = `<defs><marker id="${uid}-r" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto"><path d="M0,0 L13,6 L0,12 z" class="sh-punta-ruta"/></marker></defs><g class="sh-capa"></g>`;
    const capa = svg.querySelector('.sh-capa');

    const barra = document.createElement('div');
    barra.className = 'sim-barra';
    barra.innerHTML = '<span class="sim-chip"></span><span class="sim-chip"></span><span class="sim-chip"></span>' +
      '<span class="sim-test"></span><span class="sim-ctrl">' +
      '<button type="button" data-ir="-1" aria-label="Paso anterior">◀</button><span class="sim-cont"></span>' +
      '<button type="button" data-ir="1" aria-label="Paso siguiente">▶</button></span>';
    const chips = [...barra.querySelectorAll('.sim-chip')];

    const dice = document.createElement('p');
    dice.className = 'sim-dice sh-dice';
    let pre = null, fnActual = null, lineas = [];
    if (run.tipo === 'hashmap') {
      // tabla, barra y explicación a la izquierda; el código a la derecha
      const lado = document.createElement('div');
      lado.className = 'st-lado';
      const izq = document.createElement('div');
      izq.className = 'st-izq';
      izq.appendChild(svg);
      izq.appendChild(barra);
      izq.appendChild(dice);
      pre = document.createElement('pre');
      pre.className = 'sim-codigo sh-codigo st-codigo';
      lado.appendChild(izq);
      lado.appendChild(pre);
      cont.appendChild(lado);
    } else {
      cont.appendChild(svg);
      cont.appendChild(barra);
      cont.appendChild(dice);
      dice.classList.add('st-dice-ancho');
    }
    const ponerCodigo = nombre => {
      if (!pre || nombre === fnActual) return;
      fnActual = nombre;
      pre.innerHTML = CODIGO[nombre].map(l => `<div class="sim-linea">${pintarCodigo(l)}</div>`).join('');
      lineas = [...pre.querySelectorAll('.sim-linea')];
    };

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
      if (run.tipo === 'hashmap') dibujarHashmap(capa, f, uid, run.M);
      else if (run.tipo === 'anagramas') dibujarAnagramas(capa, f, run.palabras);
      else dibujarPrefijos(capa, f, uid);
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
        ponerCodigo(f.fn);
        const act = Array.isArray(f.code) ? f.code : [f.code];
        lineas.forEach((l, i) => l.classList.toggle('on', act.includes(i)));
      }
    }
    barra.querySelectorAll('button').forEach(b => b.addEventListener('click', ev => {
      ev.stopPropagation();
      if (typeof Reveal === 'undefined') return;
      if (Number(b.dataset.ir) > 0) Reveal.nextFragment(); else Reveal.prevFragment();
    }));
    cont._simPintar = pintar;
    cont._simTotal = F.length;
    pintar(0);
  }

  function sync() {
    const slide = Reveal.getCurrentSlide();
    if (!slide) return;
    slide.querySelectorAll('.sim-taller').forEach(cont => {
      if (!cont._simPintar) return;
      const vistos = cont.querySelectorAll('.sim-fragments .fragment.visible').length;
      cont._simPintar(vistos);
      const b = cont.querySelectorAll('.sim-ctrl button');
      if (b[0]) b[0].disabled = vistos === 0;
      if (b[1]) b[1].disabled = vistos >= cont._simTotal - 1;
    });
  }

  function init() {
    const sims = document.querySelectorAll('.sim-taller');
    if (!sims.length) return;
    sims.forEach(construir);
    if (typeof Reveal !== 'undefined') {
      if (Reveal.sync) Reveal.sync();
      ['fragmentshown', 'fragmenthidden', 'slidechanged', 'ready'].forEach(ev => Reveal.on(ev, () => setTimeout(sync, 0)));
      sync();
    }
  }

  return { init, _trazar: trazar, _codigo: CODIGO };
})();

if (typeof module !== 'undefined') module.exports = SimTallerHash;
