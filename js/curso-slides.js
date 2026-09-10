/* ============================================================
   CURSO-SLIDES — Componentes interactivos para los decks
   Requiere Reveal.js 5.x ya cargado. Incluir después de reveal.js
   y llamar CursoSlides.init(glosario) tras Reveal.initialize().
   ============================================================ */

const CursoSlides = (() => {

  /* ----------------------------------------------------------
     0. ECUACIONES (KaTeX)
     Escribe \( ... \) en línea y \[ ... \] en bloque dentro de
     cualquier slide. KaTeX se descarga del CDN solo si el deck
     contiene ecuaciones, así que los decks sin matemáticas no
     pagan la carga. Los bloques <pre>/<code> quedan intactos.
     ---------------------------------------------------------- */
  const KATEX_V = '0.16.11';
  const KATEX_CDN = `https://cdn.jsdelivr.net/npm/katex@${KATEX_V}/dist`;

  const MATH_OPTS = {
    delimiters: [
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false }
    ],
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
    throwOnError: false
  };

  function loadCss(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(src));
      document.head.appendChild(s);
    });
  }

  // Renderiza las ecuaciones de un contenedor. Sin KaTeX cargado no hace nada.
  function renderMath(el) {
    if (el && window.renderMathInElement) renderMathInElement(el, MATH_OPTS);
  }

  function initMath() {
    const root = document.querySelector('.reveal .slides');
    if (!root || !/\\\(|\\\[/.test(root.textContent)) return;

    loadCss(`${KATEX_CDN}/katex.min.css`);
    loadScript(`${KATEX_CDN}/katex.min.js`)
      .then(() => loadScript(`${KATEX_CDN}/contrib/auto-render.min.js`))
      .then(() => {
        renderMath(root);
        if (window.Reveal) Reveal.layout();
      })
      .catch(() => console.warn('KaTeX no se pudo cargar: las ecuaciones quedan como texto.'));
  }

  /* ----------------------------------------------------------
     1. GLOSARIO — términos clicables
     Uso en HTML:  <span class="term" data-term="tda">TDA</span>
     El glosario se pasa a init():
       { tda: { titulo: "...", def: "Texto. Admite <code>html</code>." } }
     ---------------------------------------------------------- */
  let GLOSARIO = {};

  function openTerm(key) {
    const entry = GLOSARIO[key];
    if (!entry) return;

    // Pausar el teclado de Reveal mientras el modal está abierto
    // (evita que Esc/flechas naveguen el deck por debajo del modal)
    if (window.Reveal) Reveal.configure({ keyboard: false });

    const overlay = document.createElement('div');
    overlay.className = 'glossary-overlay';
    overlay.innerHTML = `
      <div class="glossary-card" role="dialog" aria-modal="true">
        <h4>${entry.titulo}</h4>
        <div>${entry.def}</div>
        <button class="glossary-close">Cerrar</button>
      </div>`;
    document.body.appendChild(overlay);
    renderMath(overlay);   // las definiciones también admiten \( … \)

    const close = () => {
      overlay.remove();
      if (window.Reveal) Reveal.configure({ keyboard: true });
    };
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('.glossary-close').addEventListener('click', close);
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        document.removeEventListener('keydown', esc, true);
      }
    }, true);
  }

  function initGlossary() {
    document.querySelectorAll('.term[data-term]').forEach(el => {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener('click', e => { e.stopPropagation(); openTerm(el.dataset.term); });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTerm(el.dataset.term); }
      });
    });
  }

  /* ----------------------------------------------------------
     2. QUIZ — pregunta con 3 opciones y explicación
     Uso en HTML:
       <div class="quiz" data-correct="b">
         <p class="quiz-question">¿...?</p>
         <button class="quiz-option" data-opt="a">Opción A</button>
         <button class="quiz-option" data-opt="b">Opción B</button>
         <button class="quiz-option" data-opt="c">Opción C</button>
         <div class="quiz-explain">Por qué B es correcta…</div>
       </div>
     ---------------------------------------------------------- */
  const RESPUESTAS = [];   // registro de quizzes con data-tema (diagnóstico)

  function initQuizzes() {
    document.querySelectorAll('.quiz').forEach(quiz => {
      const correct = quiz.dataset.correct;
      const options = quiz.querySelectorAll('.quiz-option');

      if (quiz.dataset.tema) RESPUESTAS.push({ quiz, acertado: null });

      // Prefijo de letra en cada opción
      options.forEach(btn => {
        if (!btn.querySelector('.opt-letter')) {
          const tag = document.createElement('span');
          tag.className = 'opt-letter';
          tag.textContent = btn.dataset.opt.toUpperCase();
          btn.prepend(tag);
        }
        btn.addEventListener('click', () => {
          if (quiz.classList.contains('answered')) return;
          quiz.classList.add('answered');
          options.forEach(o => {
            o.disabled = true;
            if (o.dataset.opt === correct) o.classList.add('is-correct');
          });
          if (btn.dataset.opt !== correct) btn.classList.add('is-wrong');

          const reg = RESPUESTAS.find(r => r.quiz === quiz);
          if (reg) {
            reg.acertado = (btn.dataset.opt === correct);
            // Repintar de inmediato: en la vista de scroll de móvil el evento
            // slidechanged no se dispara y el panel se quedaría desactualizado.
            if (PANEL) pintarPanel(PANEL);
          }
        });
      });
    });
  }

  /* ----------------------------------------------------------
     2b. SOLUCIÓN OCULTA — para ejercicios de auto-estudio
     Uso en HTML:
       <div class="solucion" data-label="Ver mi predicción">
         …código, explicación, lo que sea…
       </div>
     El contenido queda oculto tras un botón. Sin data-label
     el botón dice "Ver solución".
     ---------------------------------------------------------- */
  function initSoluciones() {
    document.querySelectorAll('.solucion').forEach(box => {
      if (box.querySelector(':scope > .solucion-toggle')) return;

      const body = document.createElement('div');
      body.className = 'solucion-body';
      while (box.firstChild) body.appendChild(box.firstChild);

      const btn = document.createElement('button');
      btn.className = 'solucion-toggle';
      btn.type = 'button';
      const label = box.dataset.label || 'Ver solución';
      btn.textContent = label;
      btn.setAttribute('aria-expanded', 'false');

      box.appendChild(btn);
      box.appendChild(body);

      // Marca "▾ sigue" mientras quede contenido por debajo del área visible
      const marcarSobrante = () => {
        const sobra = body.scrollHeight - body.clientHeight - body.scrollTop > 4;
        box.classList.toggle('hay-mas', sobra);
      };
      body.addEventListener('scroll', marcarSobrante);

      btn.addEventListener('click', () => {
        const abierto = box.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(abierto));
        btn.textContent = abierto ? 'Ocultar' : label;
        if (abierto) {
          ajustarAlturaSolucion(box, body);
          body.scrollTop = 0;
          marcarSobrante();
        } else {
          box.classList.remove('hay-mas');
        }
        if (window.Reveal) Reveal.layout();
      });
    });
  }

  /* Calcula cuánto espacio le queda a la solución dentro del lienzo de 720px.
     Se mide con la caja todavía cerrada: lo que sobra es lo que puede crecer.
     Si algo sale fuera de rango se deja el valor por omisión del CSS. */
  const LIENZO = 720;

  function ajustarAlturaSolucion(box, body) {
    const slide = box.closest('section');
    if (!slide) return;
    box.style.removeProperty('--solucion-max');

    const previo = box.classList.contains('open');
    box.classList.remove('open');
    const usado = slide.scrollHeight;          // altura del slide sin la solución
    if (previo) box.classList.add('open');

    const disponible = LIENZO - usado - 28;    // 28px de respiro inferior
    if (disponible > 140 && disponible < 620) {
      box.style.setProperty('--solucion-max', Math.floor(disponible) + 'px');
    }
  }

  /* ----------------------------------------------------------
     2c. CHECKLIST DE SALIDA — autoevaluación por deck
     Uso en HTML:
       <ul class="checklist" data-deck="v00">
         <li>Compilar tres archivos desde la terminal <span class="cl-ref">slide 6</span></li>
       </ul>
     El avance se guarda en el navegador del estudiante. Si el
     almacenamiento no está disponible, sigue funcionando en memoria.
     ---------------------------------------------------------- */
  function storage() {
    try {
      const k = '__probe__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return localStorage;
    } catch (e) { return null; }
  }

  function initChecklists() {
    const store = storage();

    document.querySelectorAll('.checklist').forEach(lista => {
      const clave = 'repaso:' + (lista.dataset.deck || 'sin-nombre');
      let hechos = [];
      try { hechos = JSON.parse((store && store.getItem(clave)) || '[]'); } catch (e) { hechos = []; }

      const items = [...lista.querySelectorAll(':scope > li')];
      items.forEach((li, i) => {
        li.setAttribute('role', 'checkbox');
        li.setAttribute('tabindex', '0');
        if (hechos.includes(i)) li.classList.add('done');
        li.setAttribute('aria-checked', String(li.classList.contains('done')));

        const toggle = () => {
          li.classList.toggle('done');
          li.setAttribute('aria-checked', String(li.classList.contains('done')));
          const marcados = items.map((el, j) => el.classList.contains('done') ? j : -1).filter(j => j >= 0);
          if (store) { try { store.setItem(clave, JSON.stringify(marcados)); } catch (e) {} }
        };

        li.addEventListener('click', toggle);
        li.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
      });
    });
  }

  /* ----------------------------------------------------------
     2d. PANEL DE RESULTADO — solo para el deck de diagnóstico
     Cada quiz que deba contar lleva data-tema y data-sesion:
       <div class="quiz" data-correct="b" data-tema="Punteros" data-sesion="v08">
     y el slide final incluye:
       <div class="score-panel" data-base="repaso-"></div>
     El panel se recalcula cada vez que se entra a ese slide.
     ---------------------------------------------------------- */
  function pintarPanel(panel) {
    const total = RESPUESTAS.length;
    const aciertos = RESPUESTAS.filter(r => r.acertado === true).length;
    const pendientes = RESPUESTAS.filter(r => r.acertado === null).length;
    const fallados = RESPUESTAS.filter(r => r.acertado === false);
    const base = panel.dataset.base || '../repaso-';

    let msg;
    if (pendientes === total) msg = 'Todavía no has contestado ningún reactivo. Regresa a los slides anteriores.';
    else if (aciertos >= 13) msg = 'Puedes ir directo a las sesiones de los temas que fallaste y empezar el curso.';
    else if (aciertos >= 9) msg = 'Lee las sesiones de los temas que fallaste; el resto puedes hojearlo en modo repaso rápido.';
    else msg = 'Conviene leer la serie completa, en orden. Calcula entre 6 y 8 horas repartidas en dos semanas.';

    const enlaces = fallados.map(r => {
      const v = r.quiz.dataset.sesion;
      const tema = r.quiz.dataset.tema;
      // El atributo guarda la carpeta (v13); la etiqueta visible de la serie es R13.
      const etiqueta = v ? 'R' + String(Number(v.slice(1))) : '';
      return v
        ? `<li><a href="${base}${v}/">${etiqueta} · ${tema}</a></li>`
        : `<li>${tema}</li>`;
    }).join('');

    panel.innerHTML = `
      <div class="score-num">${aciertos} / ${total}</div>
      <p class="score-msg">${msg}</p>
      ${fallados.length ? `<p><strong>Lee estas sesiones:</strong></p><ul>${enlaces}</ul>` : ''}
      ${pendientes ? `<p class="score-pend">${pendientes} reactivo(s) sin contestar.</p>` : ''}
    `;
  }

  let PANEL = null;

  function initScorePanel() {
    const panel = document.querySelector('.score-panel');
    if (!panel) return;
    PANEL = panel;
    if (window.Reveal) {
      const slide = panel.closest('section');
      Reveal.on('slidechanged', e => { if (e.currentSlide === slide) pintarPanel(panel); });
    }
    pintarPanel(panel);
  }

  /* ----------------------------------------------------------
     3. ANIMACIONES POR PASOS EN SVG
     En un slide, los elementos SVG con class="anim-step" y
     data-step="N" se encienden cuando el fragment N está visible
     (los pasos se sincronizan con los fragments del slide).
     Un mismo data-step en varios elementos los enciende juntos.
     data-step-off="M" opcional: se apaga al llegar al paso M.
     ---------------------------------------------------------- */
  function syncSvgSteps() {
    const slide = Reveal.getCurrentSlide();
    if (!slide) return;
    const shown = slide.querySelectorAll('.fragment.visible').length;
    slide.querySelectorAll('.anim-step').forEach(el => {
      const on = Number(el.dataset.step) <= shown;
      const off = el.dataset.stepOff !== undefined && Number(el.dataset.stepOff) <= shown;
      el.classList.toggle('on', on && !off);
    });
  }

  function initSvgAnim() {
    ['fragmentshown', 'fragmenthidden', 'slidechanged', 'ready']
      .forEach(ev => Reveal.on(ev, () => setTimeout(syncSvgSteps, 0)));
    syncSvgSteps();
  }

  /* ----------------------------------------------------------
     4. SIMULADOR DE PARTICIÓN — Lomuto y Hoare

     <div class="sim-particion" data-alg="hoare" data-array="7,8,5,2,1,6"></div>

     Los pasos no se escriben a mano: se obtienen ejecutando el
     algoritmo e instrumentando cada operación elemental (un
     ++i, un --j, una comparación, un intercambio). Cambiar
     data-array cambia el trazado completo, código incluido.

     Un paso = un fragment del slide, así que la barra
     espaciadora avanza la simulación igual que cualquier otro
     slide. Los botones llaman a Reveal para no desincronizarse.
     ---------------------------------------------------------- */

  const SIM_CODIGO = {
    lomuto: [
      'int p = a[hi];',
      'int i = lo;',
      'for (int j = lo; j < hi; ++j)',
      '    if (a[j] < p) {',
      '        std::swap(a[i], a[j]);  ++i;',
      '    }',
      'std::swap(a[i], a[hi]);',
      'return i;'
    ],
    hoare: [
      'int p = a[lo + (hi - lo) / 2];',
      'int i = lo - 1, j = hi + 1;',
      'while (true) {',
      '    do { ++i; } while (a[i] < p);',
      '    do { --j; } while (a[j] > p);',
      '    if (i >= j) return j;',
      '    std::swap(a[i], a[j]);',
      '}'
    ]
  };

  function pasosHoare(orig) {
    const a = orig.slice(), lo = 0, hi = a.length - 1, F = [];
    const mid = lo + ((hi - lo) >> 1);
    const p = a[mid];
    let i = lo - 1, j = hi + 1;
    const add = o => F.push(Object.assign(
      { arr: a.slice(), i, j, p, mark: [], cls: '', code: 0, test: '', say: '', zonas: null }, o));

    add({ i: null, j: null, code: 0, mark: [[mid, 'p']],
      test: `p = a[${mid}] = ${p}`,
      say: `El pivote es el elemento central. <b>p guarda el valor ${p}</b>; si esa casilla se intercambia más adelante, p sigue valiendo ${p}.` });

    add({ code: 1,
      test: `i = ${i} · j = ${j}`,
      say: `Los dos índices arrancan <b>fuera del arreglo</b>, en las casillas punteadas. El primer <code>++i</code> y el primer <code>--j</code> los meten dentro, así que ninguno se salta el elemento del extremo.` });

    for (;;) {
      for (;;) {                                   // do { ++i; } while (a[i] < p);
        i++;
        const sigue = a[i] < p;
        add({ code: 3, mark: [[i, 'i']],
          test: `++i → i = ${i} · a[${i}] = ${a[i]} · ¿${a[i]} < ${p}?  ${sigue ? 'sí' : 'no'}`,
          say: sigue
            ? `El ${a[i]} ya es menor que el pivote, o sea que está del lado que le toca. <b>i avanza otra casilla</b> sin tocar nada.`
            : `El ${a[i]} está en la mitad izquierda y no es menor que el pivote. <b>i se detiene aquí</b> y espera a que j encuentre con quién intercambiarlo.` });
        if (!sigue) break;
      }
      for (;;) {                                   // do { --j; } while (a[j] > p);
        j--;
        const sigue = a[j] > p;
        add({ code: 4, mark: [[j, 'j']],
          test: `--j → j = ${j} · a[${j}] = ${a[j]} · ¿${a[j]} > ${p}?  ${sigue ? 'sí' : 'no'}`,
          say: sigue
            ? `El ${a[j]} es mayor que el pivote y ya está en la mitad derecha. <b>j baja otra casilla</b> sin tocar nada: este movimiento es el que se pierde de vista cuando los pasos se juntan.`
            : `El ${a[j]} está en la mitad derecha y no es mayor que el pivote. <b>j se detiene</b>: ya hay dos elementos mal colocados, uno en i y otro en j.` });
        if (!sigue) break;
      }

      const cruzados = i >= j;
      add({ code: 5, mark: [[i, 'i'], [j, 'j']],
        test: `if (i >= j) · ¿${i} >= ${j}?  ${cruzados ? 'sí' : 'no'}`,
        say: cruzados
          ? `Los índices se alcanzaron, así que <b>ya no queda arreglo sin revisar</b> entre ellos y la partición termina.`
          : `Todavía queda arreglo entre los dos índices, así que el par que encontraron está mal colocado y hay que intercambiarlo.` });

      if (cruzados) {
        add({ code: 5, mark: [], zonas: { corte: j, izq: `≤ ${p}`, der: `≥ ${p}` },
          test: `return j = ${j}`,
          say: `Hoare devuelve la frontera <b>j = ${j}</b>. El ${p} quedó dentro de la zona izquierda sin llegar a su posición final, y por eso la recursión va sobre <code>(lo, j)</code> y <code>(j+1, hi)</code>, con j incluido en la primera mitad.` });
        break;
      }

      const vi = a[i], vj = a[j];
      [a[i], a[j]] = [a[j], a[i]];
      add({ code: 6, mark: [[i, 'sw'], [j, 'sw']],
        test: `std::swap(a[${i}], a[${j}])`,
        say: `El ${vi} se va a la derecha y el ${vj} a la izquierda: <b>un intercambio acomoda a los dos</b>. El ciclo vuelve a empezar desde donde se quedaron los índices, sin revisar de nuevo lo que ya pasaron.` });
    }
    return { frames: F, alg: 'hoare', n: a.length };
  }

  function pasosLomuto(orig) {
    const a = orig.slice(), lo = 0, hi = a.length - 1, F = [];
    const p = a[hi];
    let i = lo, j = null;
    const add = o => F.push(Object.assign(
      { arr: a.slice(), i, j, p, mark: [], cls: '', code: 0, test: '', say: '', zonas: null }, o));

    add({ i: null, j: null, code: 0, mark: [[hi, 'p']],
      test: `p = a[hi] = ${p}`,
      say: `El pivote es el último elemento y <b>se queda quieto hasta el final</b>. Los demás se acomodan a su alrededor mientras j recorre el arreglo.` });

    add({ j: null, code: 1, mark: [[i, 'i']],
      test: `i = ${i}`,
      say: `<b>i marca dónde termina la zona de los menores</b>, que ahora está vacía. Cada vez que aparezca un elemento menor que el pivote, i avanzará una casilla.` });

    for (j = lo; j < hi; j++) {
      const menor = a[j] < p;
      add({ code: 3, mark: [[j, 'j']],
        test: `j = ${j} · a[${j}] = ${a[j]} · ¿${a[j]} < ${p}?  ${menor ? 'sí' : 'no'}`,
        say: menor
          ? `El ${a[j]} es menor que el pivote, así que <b>le toca entrar a la zona de menores</b>, que hoy termina en i = ${i}.`
          : `El ${a[j]} se queda donde está. <b>j avanza e i no se mueve</b>, y el hueco que crece entre los dos guarda a los que ya se sabe que son mayores o iguales al pivote.` });
      if (menor) {
        const vi = a[i], vj = a[j], antes = i;
        [a[i], a[j]] = [a[j], a[i]];
        i++;
        add({ code: 4, mark: [[antes, 'sw'], [j, 'sw']],
          test: `std::swap(a[${antes}], a[${j}]) · ++i → i = ${i}`,
          say: antes === j
            ? `i y j apuntan a la misma casilla, así que el intercambio no mueve nada. Lo que cambia es <b>i, que avanza a ${i}</b>: la zona de menores creció una casilla.`
            : `El ${vj} entra a la zona de menores y el ${vi}, que sobraba ahí, sale a cambio. <b>i avanza a ${i}</b>.` });
      }
    }

    j = hi;
    add({ code: 2, mark: [],
      test: `j = ${hi} = hi · el ciclo termina`,
      say: `j llegó al pivote, o sea que <b>ya se revisó todo el arreglo</b>. La zona de menores ocupa de la casilla ${lo} a la ${i - 1}, y el pivote sigue al final sin colocar.` });

    [a[i], a[hi]] = [a[hi], a[i]];
    add({ code: 6, mark: [[i, 'sw'], [hi, 'sw']],
      test: `std::swap(a[${i}], a[${hi}])`,
      say: `El pivote se intercambia con el primer elemento de la zona de mayores y <b>cae justo en la frontera</b>, que es la posición que le corresponde en el arreglo ya ordenado.` });

    add({ code: 7, mark: [], zonas: { corte: i - 1, pivote: i, izq: `< ${p}`, der: `≥ ${p}` },
      test: `return i = ${i}`,
      say: `Lomuto devuelve <b>i = ${i}</b>, la posición definitiva del pivote. El ${p} ya no vuelve a moverse, así que la recursión lo excluye: <code>(lo, ${i - 1})</code> y <code>(${i + 1}, hi)</code>.` });

    return { frames: F, alg: 'lomuto', n: a.length };
  }

  /* Coloreado mínimo del panel de código, al estilo github-dark. */
  function pintarCodigo(linea) {
    const esc = linea.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return esc
      .replace(/(\/\/.*)$/, '<span class="cm">$1</span>')
      .replace(/\b(int|while|do|for|if|return|true)\b/g, '<span class="kw">$1</span>')
      .replace(/\b(std::swap)\b/g, '<span class="fn">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
  }

  function construirSim(cont) {
    const alg = cont.dataset.alg === 'lomuto' ? 'lomuto' : 'hoare';
    const arreglo = (cont.dataset.array || '7,8,5,2,1,6')
      .split(',').map(s => Number(s.trim())).filter(v => Number.isFinite(v));
    const run = alg === 'lomuto' ? pasosLomuto(arreglo) : pasosHoare(arreglo);
    const n = run.n, cols = n + 2;

    cont.innerHTML = '';
    cont.style.setProperty('--sim-cols', cols);

    // Cinta: casilla fantasma, las n casillas reales, casilla fantasma.
    const cinta = document.createElement('div');
    cinta.className = 'sim-cinta';
    const celdas = [], columnas = [];
    for (let c = 0; c < cols; c++) {
      const idx = c - 1;                       // −1 … n
      const fantasma = idx < 0 || idx >= n;
      const col = document.createElement('div');
      col.className = 'sim-col' + (fantasma ? ' ghost' : '');
      col.innerHTML =
        '<div class="sim-ptr"><span class="pi">i</span><span class="pj">j</span></div>' +
        '<div class="sim-celda"></div>' +
        `<div class="sim-idx">${idx < 0 ? '−1' : idx}</div>`;
      cinta.appendChild(col);
      columnas[idx] = col;
      celdas[idx] = col.querySelector('.sim-celda');
    }
    cont.appendChild(cinta);

    const zonas = document.createElement('div');
    zonas.className = 'sim-zonas';
    cont.appendChild(zonas);

    const barra = document.createElement('div');
    barra.className = 'sim-barra';
    barra.innerHTML =
      '<span class="sim-chip cp"></span><span class="sim-chip ci"></span><span class="sim-chip cj"></span>' +
      '<span class="sim-test"></span>' +
      '<span class="sim-ctrl">' +
        '<button type="button" data-ir="-1" aria-label="Paso anterior">◀</button>' +
        '<span class="sim-cont"></span>' +
        '<button type="button" data-ir="1" aria-label="Paso siguiente">▶</button>' +
      '</span>';
    cont.appendChild(barra);

    // Parte baja: el código a la izquierda, la explicación del paso a la
    // derecha. Van juntos porque se leen juntos — la línea que corre y lo
    // que esa línea acaba de hacer.
    const abajo = document.createElement('div');
    abajo.className = 'sim-abajo';

    const pre = document.createElement('pre');
    pre.className = 'sim-codigo';
    pre.innerHTML = SIM_CODIGO[alg]
      .map(l => `<div class="sim-linea">${pintarCodigo(l)}</div>`).join('');
    abajo.appendChild(pre);

    const dice = document.createElement('p');
    dice.className = 'sim-dice';
    abajo.appendChild(dice);

    cont.appendChild(abajo);
    const lineas = [...pre.querySelectorAll('.sim-linea')];

    // Un fragment vacío por paso, después del primero: el paso 0
    // es el estado inicial y ya se ve al entrar al slide.
    const huecos = document.createElement('span');
    huecos.className = 'sim-fragments';
    for (let k = 1; k < run.frames.length; k++) {
      const f = document.createElement('span');
      f.className = 'fragment';
      f.setAttribute('aria-hidden', 'true');
      huecos.appendChild(f);
    }
    cont.appendChild(huecos);

    const $ = sel => barra.querySelector(sel);

    function pintar(k) {
      const f = run.frames[Math.max(0, Math.min(k, run.frames.length - 1))];

      for (let idx = -1; idx <= n; idx++) {
        const col = columnas[idx];
        col.className = 'sim-col' + (idx < 0 || idx >= n ? ' ghost' : '');
        if (idx >= 0 && idx < n) celdas[idx].textContent = f.arr[idx];
      }
      f.mark.forEach(([idx, tipo]) => {
        const col = columnas[idx];
        if (!col) return;
        col.classList.add({ i: 'mk-i', j: 'mk-j', sw: 'mk-sw', p: 'mk-p' }[tipo] || 'mk-f');
      });
      if (f.i !== null && columnas[f.i]) columnas[f.i].classList.add('has-i');
      if (f.j !== null && columnas[f.j]) columnas[f.j].classList.add('has-j');

      zonas.innerHTML = '';
      if (f.zonas) {
        const z = f.zonas;
        const tramo = (desde, hasta, texto, clase) => {
          if (hasta < desde) return;
          const d = document.createElement('div');
          d.className = 'sim-zona on' + (clase ? ' ' + clase : '');
          d.style.gridColumn = `${desde + 2} / ${hasta + 3}`;   // +2: la casilla fantasma
          d.textContent = texto;
          zonas.appendChild(d);
        };
        if (z.pivote === undefined) {
          tramo(0, z.corte, `a[lo..j] ${z.izq}`);
          tramo(z.corte + 1, n - 1, `a[j+1..hi] ${z.der}`);
        } else {
          tramo(0, z.corte, z.izq);
          tramo(z.pivote, z.pivote, 'p', 'piv');
          tramo(z.pivote + 1, n - 1, z.der);
        }
      }

      $('.cp').textContent = `p = ${f.p}`;
      $('.ci').textContent = f.i === null ? 'i = —' : `i = ${f.i}`;
      $('.cj').textContent = f.j === null ? 'j = —' : `j = ${f.j}`;
      $('.sim-test').textContent = f.test;
      $('.sim-cont').textContent = `${k + 1} / ${run.frames.length}`;
      dice.innerHTML = f.say;
      lineas.forEach((l, idx) => l.classList.toggle('on', idx === f.code));
    }

    barra.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', ev => {
        ev.stopPropagation();
        const d = Number(b.dataset.ir);
        if (typeof Reveal === 'undefined') return;
        if (d > 0) Reveal.nextFragment(); else Reveal.prevFragment();
      });
    });

    cont._simPintar = pintar;
    cont._simTotal = run.frames.length;
    pintar(0);
  }

  /* Sincroniza cada simulador visible con los fragments mostrados. */
  function syncSims() {
    const slide = Reveal.getCurrentSlide();
    if (!slide) return;
    slide.querySelectorAll('.sim-particion').forEach(cont => {
      if (!cont._simPintar) return;
      const vistos = cont.querySelectorAll('.sim-fragments .fragment.visible').length;
      cont._simPintar(vistos);
      const btns = cont.querySelectorAll('.sim-ctrl button');
      if (btns[0]) btns[0].disabled = vistos === 0;
      if (btns[1]) btns[1].disabled = vistos >= cont._simTotal - 1;
    });
  }

  function initParticion() {
    const sims = document.querySelectorAll('.sim-particion');
    if (!sims.length) return;
    sims.forEach(construirSim);
    if (typeof Reveal !== 'undefined' && Reveal.sync) Reveal.sync();
    ['fragmentshown', 'fragmenthidden', 'slidechanged', 'ready']
      .forEach(ev => Reveal.on(ev, () => setTimeout(syncSims, 0)));
    syncSims();
  }

  /* ---------------------------------------------------------- */
  function init(glosario = {}) {
    GLOSARIO = glosario;
    initMath();
    initGlossary();
    initQuizzes();
    initSoluciones();
    initChecklists();
    initScorePanel();
    initSvgAnim();
    initParticion();
  }

  return { init };
})();
