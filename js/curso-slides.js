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

  /* ----------------------------------------------------------
     Quickselect. La granularidad es distinta a propósito: aquí
     un paso es una RONDA completa, no una operación elemental.
     Los movimientos de i y j ya se vieron en los dos slides de
     partición; lo que esta animación tiene que hacer visible es
     qué mitad se descarta y cuánto arreglo queda vivo.

     El panel de abajo lleva la cuenta del trabajo por ronda, que
     es el argumento numérico de por qué el total es Θ(n).
     ---------------------------------------------------------- */
  function pasosQuickselect(orig, k) {
    const a = orig.slice(), n = a.length, F = [], filas = [];
    let lo = 0, hi = n - 1, total = 0;

    const add = o => F.push(Object.assign(
      { arr: a.slice(), kIdx: k, p: null, activo: [lo, hi], mark: [],
        code: -1, verHasta: null, test: '', say: '', zonas: null, chips: [] }, o));

    const rango = (l, h) => `a[${l}..${h}]`;

    add({ activo: [0, n - 1],
      chips: [['k = ' + k, 'ci'], ['rango ' + rango(0, n - 1), '']],
      test: `buscamos el ${k + 1}.º menor`,
      say: `Queremos el valor que ocuparía la casilla <b>${k}</b> si el arreglo estuviera ordenado. La casilla existe desde ahora; lo que no sabemos todavía es qué valor le toca.` });

    let ronda = 0;
    for (;;) {
      const tam = hi - lo + 1;
      total += tam;
      filas.push(`ronda ${ronda + 1}   ${(rango(lo, hi) + '        ').slice(0, 10)}  ${String(tam).padStart(2)} ${tam === 1 ? 'elemento' : 'elementos'}`);
      const fila = ronda;

      if (lo === hi) {
        add({ p: lo, activo: [lo, hi], mark: [[lo, 'f']], code: fila,
          chips: [['k = ' + k, 'ci'], ['rango ' + rango(lo, hi), '']],
          test: `lo == hi · el rango quedó en un elemento`,
          say: `El rango se encogió hasta una sola casilla, y esa casilla es la <b>${k}</b>. No hace falta particionar más: el valor que quedó ahí es la respuesta.` });
        break;
      }

      // Partición de Lomuto con el último como pivote, igual que el código.
      const pv = a[hi];
      let i = lo;
      for (let j = lo; j < hi; j++) if (a[j] < pv) { [a[i], a[j]] = [a[j], a[i]]; i++; }
      [a[i], a[hi]] = [a[hi], a[i]];
      const p = i;

      add({ p, activo: [lo, hi], mark: [[p, 'p']], code: fila,
        zonas: { corte: p - 1, pivote: p, izq: `< ${pv}`, der: `≥ ${pv}`, desde: lo, hasta: hi },
        chips: [['k = ' + k, 'ci'], ['rango ' + rango(lo, hi), ''], [`p = ${p}`, 'cok']],
        test: `particion(${rango(lo, hi)}) → p = ${p}`,
        say: `Una partición sobre ${tam} elementos deja al pivote <b>${pv}</b> en la casilla <b>${p}</b>, con los menores a su izquierda y los mayores a su derecha. Esa casilla ya es la definitiva para él.` });

      if (p === k) {
        add({ p, activo: [lo, hi], mark: [[p, 'f']], code: fila,
          chips: [['k = ' + k, 'ci'], [`p = ${p}`, 'cok']],
          test: `p == k · terminamos`,
          say: `El pivote cayó justo en la casilla que buscábamos. Como su posición ya es la definitiva, <b>a[${k}] = ${a[k]}</b> es la respuesta.` });
        break;
      }

      const izq = k < p;
      const nlo = izq ? lo : p + 1, nhi = izq ? p - 1 : hi;
      const descartados = izq ? (hi - p + 1) : (p - lo + 1);

      add({ p, activo: [nlo, nhi], mark: [[p, 'p']], code: fila,
        chips: [['k = ' + k, 'ci'], [`p = ${p}`, 'cok'], [`sigue ${rango(nlo, nhi)}`, '']],
        test: `¿k < p? · ¿${k} < ${p}?  ${izq ? 'sí' : 'no'}`,
        say: izq
          ? `La casilla ${k} quedó <b>a la izquierda</b> del pivote, así que el valor que buscamos está ahí. Los ${descartados} elementos del pivote en adelante se descartan y no se vuelven a tocar.`
          : `La casilla ${k} quedó <b>a la derecha</b> del pivote, así que el valor que buscamos está ahí. Los ${descartados} elementos hasta el pivote se descartan y no se vuelven a tocar.` });

      lo = nlo; hi = nhi; ronda++;
    }

    filas.push('─'.repeat(34));
    filas.push(`total     ${String(total).padStart(12)} elementos`);
    filas.push(`quicksort habría hecho ~${n} por nivel`);

    // El último frame enciende el renglón del total.
    const fin = F[F.length - 1];
    F.push(Object.assign({}, fin, {
      code: filas.length - 2, verHasta: filas.length - 1, mark: [[k, 'f']], zonas: null,
      chips: [['k = ' + k, 'ci'], [`respuesta ${a[k]}`, 'cok']],
      test: `return a[${k}] = ${a[k]}`,
      say: `Sumando las rondas se tocaron <b>${total} elementos</b> en total, no ${n} por nivel: cada ronda descartó una parte y ya no volvió por ella. Esa suma que se achica es la razón de que el costo promedio sea Θ(n) y no Θ(n log n).`
    }));

    return { frames: F, alg: 'quickselect', modo: 'seleccion', n, filas };
  }

  /* ----------------------------------------------------------
     Selection sort. Un paso por comparación, a propósito: lo que
     hay que ver es que el ciclo interno recorre la zona no
     ordenada COMPLETA siempre, encuentre o no algo que corregir.
     Esa es la razón de que Θ(n²) sea cota exacta en todos los
     casos, y no se aprecia con pasos gruesos.

     El panel de abajo separa comparaciones de intercambios, que
     es la asimetría del slide siguiente.
     ---------------------------------------------------------- */
  function pasosSeleccion(orig) {
    const a = orig.slice(), n = a.length, F = [], filas = [];
    let comps = 0, swaps = 0;

    const add = o => F.push(Object.assign(
      { arr: a.slice(), i: null, j: null, m: null, ordenado: 0, mark: [],
        code: -1, verHasta: null, test: '', say: '', zonas: null, chips: [] }, o));

    const inv = i => ({ desde: 0, hasta: n - 1, corte: i - 1, crudo: true,
                        izq: 'ya ordenado', der: 'sin ordenar' });

    add({ i: 0, ordenado: 0, zonas: inv(0),
      chips: [['i = 0', 'ci']],
      test: `n = ${n} · ${n - 1} pasadas`,
      say: `La zona ordenada empieza <b>vacía</b>. Cada pasada le agrega un elemento por la izquierda: busca el menor de lo que queda y lo trae a la frontera.` });

    for (let i = 0; i < n - 1; i++) {
      let m = i;
      const compsPasada = n - 1 - i;

      for (let j = i + 1; j < n; j++) {
        comps++;
        const menor = a[j] < a[m];
        const anterior = a[m];
        if (menor) m = j;
        // El renglón de esta pasada todavía no se enseña: diría si hubo
        // intercambio antes de que el alumno pueda saberlo.
        add({ i, j, m, ordenado: i, mark: [[j, 'j'], [m, 'p']], zonas: inv(i), code: i - 1,
          chips: [[`i = ${i}`, 'ci'], [`m = ${m}`, 'cok'], [`j = ${j}`, 'cj']],
          test: `¿a[${j}] < a[m]? · ¿${a[j]} < ${anterior}?  ${menor ? 'sí' : 'no'}`,
          say: (j === i + 1
                 ? `Arranca suponiendo que el menor es <b>a[${i}] = ${i === m ? a[i] : anterior}</b>, el primero de la zona sin ordenar. `
                 : '') +
               (menor
                 ? `El ${a[j]} es más chico que el candidato, así que <b>m se mueve a ${m}</b>. El recorrido no se detiene: falta ver el resto.`
                 : `El ${a[j]} no mejora al candidato, así que m se queda. <b>La comparación se hizo de todos modos</b>, y eso es lo que cuesta.`) });
      }

      const huboSwap = m !== i;
      const vi = a[i], vm = a[m];
      if (huboSwap) { [a[i], a[m]] = [a[m], a[i]]; swaps++; }

      filas.push(`pasada ${i + 1}  a[${i}..${n - 1}]   ${compsPasada} comp   ${huboSwap ? 'swap' : '—'}`);

      add({ i, j: null, m, ordenado: i + 1, mark: huboSwap ? [[i, 'sw'], [m, 'sw']] : [[i, 'f']],
        zonas: inv(i + 1), code: i,
        chips: [[`i = ${i}`, 'ci'], [`m = ${m}`, 'cok']],
        test: huboSwap ? `m != i → swap(a[${i}], a[${m}])` : `m == i → no hay intercambio`,
        say: huboSwap
          ? `El menor de la zona era el <b>${vm}</b>. Un solo intercambio lo trae a la casilla ${i} y manda el ${vi} a donde estaba: la zona ordenada creció a ${i + 1}.`
          : `El menor de la zona ya estaba en su lugar, así que <b>no se mueve nada</b>. Las ${compsPasada} comparaciones se hicieron igual — buscar cuesta aunque no haya nada que corregir.` });
    }

    const totalComps = n * (n - 1) / 2;
    filas.push('─'.repeat(33));
    filas.push(`total            ${totalComps} comp   ${swaps} swaps`);
    filas.push(`${totalComps} = n(n-1)/2, con cualquier entrada`);

    add({ i: n - 1, ordenado: n, mark: [], zonas: null,
      code: filas.length - 2, verHasta: filas.length - 1,
      chips: [['ordenado', 'cok']],
      test: `${totalComps} comparaciones · ${swaps} intercambios`,
      say: `Las <b>${totalComps} comparaciones</b> no dependieron de la entrada: el ciclo interno recorrió la zona no ordenada completa en cada pasada. Los intercambios sí, y fueron <b>${swaps}</b>. Buscar mucho y mover poco es el rasgo de este algoritmo.` });

    return { frames: F, alg: 'seleccion', modo: 'seleccion', n, filas };
  }

  /* El panel de trabajo de quickselect: solo se resaltan los números. */
  function pintarTexto(linea) {
    return linea
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
  }

  /* Coloreado mínimo del panel de código, al estilo github-dark. */
  function pintarCodigo(linea) {
    const esc = linea.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return esc
      .replace(/(\/\/.*)$/, '<span class="cm">$1</span>')
      .replace(/\b(int|while|do|for|if|else|return|true|new|delete|nullptr|size_t)\b/g, '<span class="kw">$1</span>')
      .replace(/\b(std::swap|Nodo)\b/g, '<span class="fn">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
  }

  /* ----------------------------------------------------------
     5. SIMULADOR DE LISTA ENLAZADA
     <div class="sim-particion sim-lista" data-alg="lista-insert"
          data-lista="10,20,40" data-x="30" data-pos="2"></div>
     data-alg: lista-insert · lista-insert-al-reves · lista-remove

     Igual que los de ordenamiento, los pasos salen de ejecutar la
     operación sobre un modelo de nodos y punteros; un paso es una
     línea de código. Cada flecha que cambió respecto al paso
     anterior se pinta en verde: eso es la "cirugía".
     ---------------------------------------------------------- */
  const LISTA_CODIGO = {
    'lista-insert': [
      'if (pos > count) return false;',
      'if (pos == 0) head = new Nodo{x, head};',
      'else { Nodo* prev = head;',
      '  for (size_t i = 0; i < pos - 1; ++i)',
      '    prev = prev->next;',
      '  prev->next = new Nodo{x, prev->next}; }',
      '++count;'
    ],
    'lista-insert-al-reves': [
      'Nodo* nuevo = new Nodo{x, nullptr};',
      'prev->next  = nuevo;',
      'nuevo->next = prev->next;'
    ],
    'lista-remove': [
      'if (head && head->dato == x) { … }',
      'for (Nodo* prev = head; prev; prev = prev->next)',
      '  if (prev->next && prev->next->dato == x) {',
      '    Nodo* victima = prev->next;',
      '    prev->next = victima->next;',
      '    delete victima;  --count;',
      '    return true; }'
    ]
  };

  function modeloLista(valores) {
    const nodos = {};
    valores.forEach((v, k) => {
      nodos['n' + k] = { dato: v, c: k, r: 0,
                         next: k + 1 < valores.length ? 'n' + (k + 1) : null, est: '' };
    });
    return { nodos, head: valores.length ? 'n0' : null, count: valores.length };
  }

  function fotoLista(M, extra) {
    const nodos = {};
    for (const id in M.nodos) nodos[id] = Object.assign({}, M.nodos[id]);
    return Object.assign({ nodos, code: -1, test: '', say: '', chips: [], ptrs: [] }, extra);
  }

  // Coloca en línea, de izquierda a derecha, los nodos alcanzables desde head.
  function enLinea(M) {
    let id = M.head, c = 0;
    const vistos = new Set();
    while (id && !vistos.has(id)) {
      vistos.add(id);
      Object.assign(M.nodos[id], { c: c++, r: 0 });
      id = M.nodos[id].next;
    }
  }

  function pasosListaInsert(vals, x, pos) {
    const M = modeloLista(vals), F = [];
    const chips = () => [[`count = ${M.count}`, ''], [`pos = ${pos}`, 'ci'], [`x = ${x}`, 'cok']];
    const antes = vals[pos - 1], despues = vals[pos];
    const add = o => F.push(fotoLista(M, Object.assign({ chips: chips() }, o)));

    add({ ptrs: [['head', M.head, 'ph']],
      test: `insert(${x}, ${pos})`,
      say: `La lista tiene ${M.count} nodos. Queremos que el <b>${x}</b> quede en la posición ${pos}` +
           (despues !== undefined ? `, entre el ${antes} y el ${despues}.` : `, al final, después del ${antes}.`) });

    add({ code: 0, ptrs: [['head', M.head, 'ph']],
      test: `¿pos > count? · ¿${pos} > ${M.count}?  no`,
      say: `La posición existe: se puede insertar desde la 0 hasta la ${M.count}, que es "después del último".` });

    add({ code: 1, ptrs: [['head', M.head, 'ph']],
      test: `¿pos == 0?  no`,
      say: `No es la cabeza, así que hay que caminar. El único nodo cuyo <code>next</code> va a cambiar es el que queda <b>antes</b> de la posición ${pos}, y a ése hay que llegar.` });

    let prev = M.head;
    add({ code: 2, ptrs: [['head', M.head, 'ph'], ['prev', prev, 'pp']],
      test: `prev = head`,
      say: `<code>prev</code> arranca en la cabeza, el ${M.nodos[prev].dato}.` });

    for (let i = 0; ; i++) {
      const sigue = i < pos - 1;
      add({ code: 3, ptrs: [['head', M.head, 'ph'], ['prev', prev, 'pp']],
        test: `i = ${i} · ¿${i} < ${pos - 1}?  ${sigue ? 'sí' : 'no'}`,
        say: sigue
          ? `Todavía no está en el nodo anterior a la posición ${pos}: avanza uno.`
          : `<code>prev</code> se detiene en el <b>${M.nodos[prev].dato}</b>, el nodo en la posición ${pos - 1}. Desde aquí se puede tocar su <code>next</code>, que es lo único que hay que cambiar.` });
      if (!sigue) break;
      prev = M.nodos[prev].next;
      add({ code: 4, ptrs: [['head', M.head, 'ph'], ['prev', prev, 'pp']],
        test: `prev = prev->next`,
        say: `<code>prev</code> se mueve al ${M.nodos[prev].dato}. Caminar es la única forma de llegar: la lista no tiene acceso por índice.` });
    }

    // Lado derecho primero: el nodo nuevo nace ya apuntando al sucesor.
    const nuevo = 'n' + vals.length;
    const cp = M.nodos[prev].c;
    M.nodos[nuevo] = { dato: x, c: cp + 0.5, r: 1, next: M.nodos[prev].next, est: 'nuevo' };
    add({ code: 5, ptrs: [['head', M.head, 'ph'], ['prev', prev, 'pp']],
      test: `new Nodo{${x}, prev->next}`,
      say: `Primero se evalúa el lado derecho: <code>new Nodo{x, prev->next}</code> crea el ${x} y su <code>next</code> <b>ya apunta al ${despues !== undefined ? despues : 'nullptr'}</b>. La lista todavía no cambió: nadie apunta al ${x}.` });

    M.nodos[prev].next = nuevo;
    add({ code: 5, ptrs: [['head', M.head, 'ph'], ['prev', prev, 'pp']],
      test: `prev->next = (el nodo nuevo)`,
      say: `Ahora sí, el <code>next</code> del ${M.nodos[prev].dato} pasa al ${x}. Como el ${x} ya sabía llegar ${despues !== undefined ? 'al ' + despues : 'al final'}, <b>no se perdió nada</b>. Ése es el orden que pide el comentario del código.` });

    M.count++;
    add({ code: 6, ptrs: [['head', M.head, 'ph'], ['prev', prev, 'pp']],
      test: `++count → ${M.count}`,
      say: `El contador sube a ${M.count}. Si se olvida esta línea, <code>size()</code> sigue en O(1) pero devuelve un número falso, y el invariante del contrato se rompe sin que nada truene.` });

    M.nodos[nuevo].est = '';
    enLinea(M);
    add({ code: -1, ptrs: [['head', M.head, 'ph']],
      test: 'lista: ' + (() => { const o = []; let id = M.head; while (id) { o.push(M.nodos[id].dato); id = M.nodos[id].next; } return o.join(' → '); })(),
      say: `Acomodada en línea. Se cambiaron <b>dos punteros</b> y no se movió ningún dato: enlazar cuesta O(1). Lo caro fue caminar hasta <code>prev</code>, que cuesta O(pos).` });

    return { frames: F, n: vals.length + 1 };
  }

  function pasosListaInsertAlReves(vals, x, pos) {
    const M = modeloLista(vals), F = [];
    const prev = 'n' + (pos - 1);
    const suc = M.nodos[prev].next;
    const add = o => F.push(fotoLista(M, Object.assign({ chips: [[`x = ${x}`, 'cok'], [`pos = ${pos}`, 'ci']] }, o)));

    add({ ptrs: [['head', M.head, 'ph'], ['prev', prev, 'pp']],
      test: `prev ya llegó al ${M.nodos[prev].dato}`,
      say: `Mismo punto de partida que antes: <code>prev</code> está en el ${M.nodos[prev].dato}. Ahora el enlace se hace en el orden contrario, que es como sale cuando se escribe sin pensar.` });

    const nuevo = 'n' + vals.length;
    M.nodos[nuevo] = { dato: x, c: M.nodos[prev].c + 0.5, r: 1, next: null, est: 'nuevo' };
    add({ code: 0, ptrs: [['head', M.head, 'ph'], ['prev', prev, 'pp'], ['nuevo', nuevo, 'pn']],
      test: `nuevo = new Nodo{${x}, nullptr}`,
      say: `Se crea el ${x} con su <code>next</code> vacío. Hasta aquí no hay daño: la lista está intacta.` });

    M.nodos[prev].next = nuevo;
    M.nodos[suc].est = 'perdido';
    add({ code: 1, ptrs: [['head', M.head, 'ph'], ['prev', prev, 'pp'], ['nuevo', nuevo, 'pn']],
      test: `prev->next = nuevo`,
      say: `El ${M.nodos[prev].dato} ya apunta al ${x}. Pero el único camino al <b>${M.nodos[suc].dato}</b> era <code>prev->next</code>, y se acaba de sobrescribir: nadie guarda su dirección.` });

    M.nodos[nuevo].next = M.nodos[prev].next;   // = nuevo
    add({ code: 2, ptrs: [['head', M.head, 'ph'], ['prev', prev, 'pp'], ['nuevo', nuevo, 'pn']],
      test: `nuevo->next = prev->next   // = nuevo`,
      say: `<code>prev->next</code> ya es el ${x}, así que el ${x} termina <b>apuntándose a sí mismo</b>. La línea que debía rescatar al ${M.nodos[suc].dato} llegó tarde.` });

    add({ code: -1, ptrs: [['head', M.head, 'ph']],
      test: `recorrer: ${vals.slice(0, pos).join(' → ')} → ${x} → ${x} → ${x} → …`,
      say: `Resultado: un <b>ciclo</b> y una <b>fuga</b>. Recorrer la lista no termina, y el ${M.nodos[suc].dato} —con todo lo que colgaba de él— ya no se puede liberar. Compila sin una sola advertencia.` });

    return { frames: F, n: vals.length + 1 };
  }

  function pasosListaRemove(vals, x) {
    const M = modeloLista(vals), F = [];
    const chips = () => [[`count = ${M.count}`, ''], [`x = ${x}`, 'cj']];
    const add = o => F.push(fotoLista(M, Object.assign({ chips: chips() }, o)));
    const H = () => ['head', M.head, 'ph'];

    add({ ptrs: [H()], test: `remove(${x})`,
      say: `Hay que quitar la primera aparición del <b>${x}</b> sin perder a nadie más y sin dejar memoria sin liberar.` });

    const d0 = M.nodos[M.head].dato;
    M.nodos[M.head].est = 'hl';
    add({ code: 0, ptrs: [H()],
      test: `¿head->dato == x? · ¿${d0} == ${x}?  ${d0 === x ? 'sí' : 'no'}`,
      say: `La cabeza se revisa aparte: si fuera ella, lo que cambia es <code>head</code>, no el <code>next</code> de ningún nodo. No es, así que sigue el caso general.` });
    M.nodos[M.head].est = '';

    let prev = M.head;
    add({ code: 1, ptrs: [H(), ['prev', prev, 'pp']],
      test: `prev = head`,
      say: `<code>prev</code> arranca en la cabeza. Se va a mirar siempre <b>un nodo adelante</b> de donde está parado.` });

    for (;;) {
      const sig = M.nodos[prev].next;
      const es = M.nodos[sig].dato === x;
      M.nodos[sig].est = 'hl';
      add({ code: 2, ptrs: [H(), ['prev', prev, 'pp']],
        test: `¿prev->next->dato == x? · ¿${M.nodos[sig].dato} == ${x}?  ${es ? 'sí' : 'no'}`,
        say: es
          ? `Lo encontró, y <code>prev</code> quedó <b>justo antes</b>. Por eso se compara el siguiente y no el propio: para sacar un nodo de la cadena hay que estar parado en el anterior.`
          : `Se compara el dato del <b>siguiente</b>, no el de <code>prev</code>. No es, así que avanza.` });
      M.nodos[sig].est = '';
      if (es) break;
      prev = sig;
      add({ code: 1, ptrs: [H(), ['prev', prev, 'pp']],
        test: `prev = prev->next`,
        say: `<code>prev</code> avanza al ${M.nodos[prev].dato}.` });
    }

    const vic = M.nodos[prev].next;
    add({ code: 3, ptrs: [H(), ['prev', prev, 'pp'], ['victima', vic, 'pv']],
      test: `victima = prev->next`,
      say: `Se guarda la dirección del ${x} en <code>victima</code>. Hace falta: en la línea siguiente <code>prev->next</code> se sobrescribe, y sin esta copia ya no habría forma de liberarlo.` });

    M.nodos[prev].next = M.nodos[vic].next;
    M.nodos[vic].r = 1;
    const sucDato = M.nodos[vic].next ? M.nodos[M.nodos[vic].next].dato : 'nullptr';
    add({ code: 4, ptrs: [H(), ['prev', prev, 'pp'], ['victima', vic, 'pv']],
      test: `prev->next = victima->next`,
      say: `El ${M.nodos[prev].dato} salta por encima del ${x} y apunta al ${sucDato}. El ${x} ya está <b>fuera de la cadena</b>, pero sigue existiendo en memoria: su <code>next</code> todavía apunta al ${sucDato}.` });

    M.nodos[vic].est = 'liberado';
    M.count--;
    add({ code: 5, ptrs: [H(), ['prev', prev, 'pp'], ['victima', vic, 'pv']],
      test: `delete victima · --count → ${M.count}`,
      say: `Se libera. <code>victima</code> <b>sigue guardando la dirección</b> de una memoria que ya no es tuya: es un puntero colgante. Aquí no causa daño porque la función regresa en la línea siguiente.` });

    delete M.nodos[vic];
    enLinea(M);
    add({ code: 6, ptrs: [H()],
      test: 'lista: ' + (() => { const o = []; let id = M.head; while (id) { o.push(M.nodos[id].dato); id = M.nodos[id].next; } return o.join(' → '); })(),
      say: `Re-enlazar primero, liberar después: con ese orden no se pierde ningún nodo ni queda memoria sin liberar. Si se invierte, <code>victima->next</code> se lee de memoria ya liberada.` });

    return { frames: F, n: vals.length };
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  let simListaUid = 0;

  function construirLista(cont) {
    const alg = cont.dataset.alg;
    const vals = (cont.dataset.lista || '10,20,40').split(',').map(s => Number(s.trim()));
    const x = Number(cont.dataset.x || 30);
    const pos = Number(cont.dataset.pos || 2);
    const run = alg === 'lista-remove' ? pasosListaRemove(vals, x)
              : alg === 'lista-insert-al-reves' ? pasosListaInsertAlReves(vals, x, pos)
              : pasosListaInsert(vals, x, pos);
    const uid = 'sl' + (++simListaUid);

    cont.innerHTML = '';

    // Geometría: nodo de 150 × 56 (dato | next), columnas cada 215.
    const W = 150, H = 56, PASO = 215, X0 = 24, Y = [62, 158];
    let maxC = 0;
    run.frames.forEach(f => { for (const id in f.nodos) maxC = Math.max(maxC, f.nodos[id].c); });
    const ancho = X0 + maxC * PASO + W + 30;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${ancho} 232`);
    svg.setAttribute('class', 'sl-svg');
    svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');
    svg.innerHTML =
      `<defs>
         <marker id="${uid}-a" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto"><path d="M0,0 L13,6 L0,12 z" class="sl-punta"/></marker>
         <marker id="${uid}-b" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto"><path d="M0,0 L13,6 L0,12 z" class="sl-punta nueva"/></marker>
         <marker id="${uid}-c" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto"><path d="M0,0 L13,6 L0,12 z" class="sl-punta muerta"/></marker>
       </defs><g class="sl-capa"></g>`;
    cont.appendChild(svg);
    const capa = svg.querySelector('.sl-capa');

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
    const pre = document.createElement('pre');
    pre.className = 'sim-codigo sl-codigo';
    pre.innerHTML = LISTA_CODIGO[alg].map(l => `<div class="sim-linea">${pintarCodigo(l)}</div>`).join('');
    abajo.appendChild(pre);
    const dice = document.createElement('p');
    dice.className = 'sim-dice';
    abajo.appendChild(dice);
    cont.appendChild(abajo);
    const lineas = [...pre.querySelectorAll('.sim-linea')];

    const huecos = document.createElement('span');
    huecos.className = 'sim-fragments';
    for (let k = 1; k < run.frames.length; k++) {
      const f = document.createElement('span');
      f.className = 'fragment';
      f.setAttribute('aria-hidden', 'true');
      huecos.appendChild(f);
    }
    cont.appendChild(huecos);

    const el = (tag, attrs, txt) => {
      const e = document.createElementNS(SVG_NS, tag);
      for (const a in attrs) e.setAttribute(a, attrs[a]);
      if (txt !== undefined) e.textContent = txt;
      return e;
    };
    const posDe = n => ({ x: X0 + n.c * PASO, y: Y[n.r] });

    function pintar(k) {
      const f = run.frames[Math.max(0, Math.min(k, run.frames.length - 1))];
      const previo = k > 0 ? run.frames[k - 1] : null;
      capa.innerHTML = '';

      // 1. Flechas (debajo de los nodos).
      for (const id in f.nodos) {
        const n = f.nodos[id], p = posDe(n);
        const sx = p.x + 125, sy = p.y + H / 2;
        const cambio = previo && (!previo.nodos[id] || previo.nodos[id].next !== n.next) && n.next !== null;
        if (n.next === null) {
          capa.appendChild(el('line', { x1: p.x + 108, y1: p.y + H - 8, x2: p.x + W - 8, y2: p.y + 8, class: 'sl-nulo' }));
          continue;
        }
        const t = f.nodos[n.next];
        if (!t) continue;
        const q = posDe(t);
        const muerta = n.est === 'liberado';
        const cls = 'sl-flecha' + (muerta ? ' muerta' : cambio ? ' nueva' : '');
        const mk = `url(#${uid}-${muerta ? 'c' : cambio ? 'b' : 'a'})`;
        if (n.next === id) {                       // se apunta a sí mismo: sale por la derecha y entra por arriba
          const d = `M ${sx} ${sy} C ${p.x + W + 70} ${sy}, ${p.x + W + 45} ${p.y - 42}, ${p.x + W - 22} ${p.y - 3}`;
          capa.appendChild(el('path', { d, class: cls, 'marker-end': mk }));
          continue;
        }
        let tx = q.x - 2, ty = q.y + H / 2;
        if (t.r !== n.r) {                         // cambia de renglón: entra por arriba o abajo
          tx = q.x + 30;
          ty = t.r > n.r ? q.y - 2 : q.y + H + 2;
        }
        capa.appendChild(el('line', { x1: sx, y1: sy, x2: tx, y2: ty, class: cls, 'marker-end': mk }));
      }

      // 2. Nodos.
      for (const id in f.nodos) {
        const n = f.nodos[id], p = posDe(n);
        const g = el('g', { class: 'sl-nodo' + (n.est ? ' ' + n.est : '') });
        g.appendChild(el('rect', { x: p.x, y: p.y, width: W, height: H, rx: 8, class: 'caja' }));
        g.appendChild(el('line', { x1: p.x + 100, y1: p.y, x2: p.x + 100, y2: p.y + H, class: 'div' }));
        g.appendChild(el('text', { x: p.x + 50, y: p.y + H / 2 + 9, class: 'dato' }, n.dato));
        g.appendChild(el('circle', { cx: p.x + 125, cy: p.y + H / 2, r: 4.5, class: 'raiz' }));
        const etq = n.est === 'liberado' ? 'liberado' : n.est === 'perdido' ? 'inalcanzable' : '';
        if (etq) g.appendChild(n.r === 0
          ? el('text', { x: p.x + W / 2, y: p.y - 10, class: 'sl-etq' }, etq)
          : el('text', { x: p.x + W + 14, y: p.y + H / 2 + 5, class: 'sl-etq izq' }, etq));
        capa.appendChild(g);
      }

      // 3. Punteros con nombre: encima del nodo en el renglón de arriba,
      //    a su izquierda en el de abajo.
      const porNodo = {};
      f.ptrs.forEach(([nom, id, cls]) => { if (id && f.nodos[id]) (porNodo[id] = porNodo[id] || []).push([nom, cls]); });
      for (const id in porNodo) {
        const n = f.nodos[id], p = posDe(n);
        let cursor = n.r === 0 ? p.x : p.x - 8;
        porNodo[id].forEach(([nom, cls]) => {
          const w = 16 + nom.length * 11;
          const bx = n.r === 0 ? cursor : cursor - w;
          const by = n.r === 0 ? p.y - 34 : p.y + H / 2 - 13;
          const g = el('g', { class: 'sl-ptr ' + cls });
          g.appendChild(el('rect', { x: bx, y: by, width: w, height: 26, rx: 6 }));
          g.appendChild(el('text', { x: bx + w / 2, y: by + 18 }, nom));
          capa.appendChild(g);
          cursor = n.r === 0 ? cursor + w + 6 : bx - 6;
        });
      }

      chips.forEach((c, idx) => {
        const v = f.chips[idx];
        c.hidden = !v;
        if (!v) return;
        c.textContent = v[0];
        c.className = 'sim-chip ' + (v[1] || '');
      });
      barra.querySelector('.sim-test').textContent = f.test;
      barra.querySelector('.sim-cont').textContent = `${k + 1} / ${run.frames.length}`;
      dice.innerHTML = f.say;
      lineas.forEach((l, idx) => l.classList.toggle('on', idx === f.code));
    }

    barra.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', ev => {
        ev.stopPropagation();
        if (typeof Reveal === 'undefined') return;
        if (Number(b.dataset.ir) > 0) Reveal.nextFragment(); else Reveal.prevFragment();
      });
    });

    cont._simPintar = pintar;
    cont._simTotal = run.frames.length;
    pintar(0);
  }

  /* ----------------------------------------------------------
     6. SIMULADORES DE MEMORIA
     <div class="sim-particion sim-mem" data-alg="mem-alias"></div>
     <div class="sim-particion sim-mem" data-alg="mem-mapa"></div>

     mem-alias: una fila de celdas del stack, con dirección y
       tamaño. Valor, puntero y referencia lado a lado: la copia
       tiene celda propia, el puntero tiene celda propia que guarda
       una dirección, la referencia NO agrega celda.
     mem-mapa: las cuatro regiones de un proceso (stack, heap,
       datos, código) mientras corre un programa de 11 líneas:
       frames que se apilan y desaparecen, bloques del heap que
       sobreviven a su función, una fuga y un puntero colgante.

     Las direcciones son ficticias pero verosímiles para x86-64
     Linux: el stack cerca de 0x7ffc…, el heap y las globales
     cerca de 0x5621…. Lo que importa es que se puedan comparar a
     ojo: el valor de un puntero y la dirección de su destino son
     el mismo texto.
     ---------------------------------------------------------- */

  // Cascarón común: barra de estado, panel de código, explicación y
  // un fragment por paso. Cada simulador decide dónde acomodarlos.
  function armarCascaron(cont, codigo, nPasos) {
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
    barra.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', ev => {
        ev.stopPropagation();
        if (typeof Reveal === 'undefined') return;
        if (Number(b.dataset.ir) > 0) Reveal.nextFragment(); else Reveal.prevFragment();
      });
    });
    const pre = document.createElement('pre');
    pre.className = 'sim-codigo';
    pre.innerHTML = codigo.map(l => `<div class="sim-linea">${pintarCodigo(l)}</div>`).join('');
    const dice = document.createElement('p');
    dice.className = 'sim-dice';
    const huecos = document.createElement('span');
    huecos.className = 'sim-fragments';
    for (let k = 1; k < nPasos; k++) {
      const f = document.createElement('span');
      f.className = 'fragment';
      f.setAttribute('aria-hidden', 'true');
      huecos.appendChild(f);
    }
    const chips = [...barra.querySelectorAll('.sim-chip')];
    const lineas = [...pre.querySelectorAll('.sim-linea')];
    const pintarComun = (f, k) => {
      chips.forEach((c, idx) => {
        const v = f.chips[idx];
        c.hidden = !v;
        if (!v) return;
        c.textContent = v[0];
        c.className = 'sim-chip ' + (v[1] || '');
      });
      barra.querySelector('.sim-test').textContent = f.test;
      barra.querySelector('.sim-cont').textContent = `${k + 1} / ${nPasos}`;
      // Predecir antes de ver: la pregunta se hace un paso ANTES de la respuesta.
      dice.innerHTML = f.say + (f.predice ? `<span class="predice"><b>Antes de avanzar:</b> ${f.predice}</span>` : '');
      lineas.forEach((l, idx) => l.classList.toggle('on', idx === f.code));
    };
    return { barra, pre, dice, huecos, pintarComun };
  }

  const svgEl = (tag, attrs, txt) => {
    const e = document.createElementNS(SVG_NS, tag);
    for (const a in attrs) e.setAttribute(a, attrs[a]);
    if (txt !== undefined) e.textContent = txt;
    return e;
  };

  /* ---------- 6a. Valor, puntero y referencia ---------- */
  const ALIAS_CODIGO = [
    'int  x = 10, y = 99;',
    'int  c = x;',
    'int* p = &x;',
    'int& r = x;',
    '*p = 20;',
    'r  = 30;',
    'p  = &y;',
    'r  = y;',
    '*p = 5;'
  ];

  function pasosAlias() {
    const DIR = { x: '0x7ffd…a0', y: '0x7ffd…a4', c: '0x7ffd…a8', p: '0x7ffd…b0' };
    const TAM = { x: 4, y: 4, c: 4, p: 8 };
    const M = { celdas: {}, alias: null, apunta: null };
    const F = [];
    const add = (o) => F.push(Object.assign({
      celdas: JSON.parse(JSON.stringify(M.celdas)), alias: M.alias, apunta: M.apunta,
      cambio: [], code: -1, test: '', say: '',
      // Se cuentan objetos, no bytes: si una referencia ocupa memoria lo decide
      // el compilador (g++ -O0 le guarda una dirección oculta; -O1 no), y el
      // programa no tiene forma de observarlo.
      chips: [[`${Object.keys(M.celdas).length} objetos`, ''],
              ...(M.alias ? [['sizeof(r) = 4', 'ci'], ['&r == &x', 'cok']] : [])]
    }, o));
    const pon = (k, v) => { M.celdas[k] = { v, dir: DIR[k], tam: TAM[k] }; };

    add({ test: 'el frame de main, vacío',
      say: `Cada variable local ocupa una <b>celda del stack</b>, con dirección y tamaño propios. Vamos a crear tres cosas que en el código se parecen mucho: una copia, un puntero y una referencia.` });

    pon('x', 10); pon('y', 99);
    add({ code: 0, cambio: ['x', 'y'], test: `&x = ${DIR.x} · &y = ${DIR.y}`,
      say: `Dos <code>int</code>, 4 bytes cada uno, en el frame de <code>main</code>. En esta corrida quedaron contiguos; el orden dentro del frame lo decide el compilador.` });

    pon('c', 10);
    add({ code: 1, cambio: ['c'], test: `c = x → se copia el 10`,
      say: `<code>c</code> recibe una <b>copia</b> del 10 en una celda nueva. Desde este momento <code>c</code> y <code>x</code> son independientes: cambiar una no toca a la otra.` });

    M.celdas.p = { v: DIR.x, dir: DIR.p, tam: 8 }; M.apunta = 'x';
    add({ code: 2, cambio: ['p'], test: `p = &x → p guarda ${DIR.x}`,
      say: `<code>p</code> es una variable como cualquier otra, con <b>su propia celda</b> en ${DIR.p}. Lo que guarda es un número: la dirección de <code>x</code>. Ocupa 8 bytes porque en una máquina de 64 bits toda dirección mide 8.`,
      predice: `la siguiente línea es <code>int&amp; r = x;</code>. ¿Aparece un objeto nuevo en la fila?` });

    M.alias = 'x';
    add({ code: 3, test: `&r == &x → ${DIR.x} == ${DIR.x}`,
      say: `<code>r</code> no aparece como objeto nuevo: su nombre se <b>pega a la celda de <code>x</code></b>. <code>&amp;r</code> da la dirección de <code>x</code> y <code>sizeof(r)</code> vale 4, el tamaño de <code>x</code>. Por dentro el compilador puede guardar una dirección oculta (g++ sin optimizar lo hace), pero el programa no puede verla ni cambiarla.` });

    M.celdas.x.v = 20;
    add({ code: 4, cambio: ['x'], test: `*p → sigue ${DIR.x} y escribe 20`,
      say: `<code>*p</code> lee la dirección guardada en <code>p</code>, va a esa celda y escribe ahí. Cambió <code>x</code>; <code>c</code> sigue en 10 porque era una copia.` });

    M.celdas.x.v = 30;
    add({ code: 5, cambio: ['x'], test: `r = 30 → escribe en la celda de x`,
      say: `Escribir en <code>r</code> es escribir en <code>x</code>, directo. No hay dirección que seguir: <code>r</code> y <code>x</code> nombran la misma celda.` });

    M.celdas.p.v = DIR.y; M.apunta = 'y';
    add({ code: 6, cambio: ['p'], test: `p = &y → p guarda ${DIR.y}`,
      say: `Un puntero <b>se puede reapuntar</b>: se sobrescribe el número guardado en su celda y la flecha cambia de destino. <code>x</code> no se entera.`,
      predice: `la siguiente línea es <code>r = y;</code>. ¿Cuál cambia: <code>r</code>, <code>x</code> o <code>y</code>?` });

    M.celdas.x.v = 99;
    add({ code: 7, cambio: ['x'], test: `r = y → copia 99 dentro de x`,
      say: `Esta línea <b>parece reapuntar</b> <code>r</code> hacia <code>y</code>, y hace otra cosa: copia el valor de <code>y</code> dentro de <code>x</code>. Una referencia queda ligada para siempre a la variable con la que se creó.` });

    M.celdas.y.v = 5;
    add({ code: 8, cambio: ['y'], test: `*p → sigue ${DIR.y} y escribe 5`,
      say: `<code>p</code> ya apunta a <code>y</code>, así que el 5 cae en <code>y</code>. <code>x</code> conserva el 99 que le copió la línea anterior.` });

    add({ code: -1, test: 'copia · puntero · referencia',
      say: `<b>c</b>: objeto propio con una copia del valor. <b>p</b>: objeto propio que guarda una dirección; se puede reapuntar y puede valer <code>nullptr</code>. <b>r</b>: otro nombre para <code>x</code>, ligado de por vida. Por dentro una referencia suele implementarse como una dirección que se sigue sola; lo que el lenguaje te quita es poder verla, reapuntarla o dejarla vacía.` });

    return F;
  }

  function construirAlias(cont) {
    const F = pasosAlias();
    const S = armarCascaron(cont, ALIAS_CODIGO, F.length);
    cont.innerHTML = '';

    const ORDEN = ['x', 'y', 'c', 'p'];
    const X = { x: 20, y: 222, c: 392, p: 582 };   // hueco tras x: ahí cabe la etiqueta del alias
    const ANCHO = { 4: 150, 8: 310 };
    const svg = svgEl('svg', { viewBox: '0 0 900 184', class: 'mm-svg mm-fila', preserveAspectRatio: 'xMinYMid meet' });
    const uid = 'mma' + (++simListaUid);
    svg.innerHTML = `<defs><marker id="${uid}" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto"><path d="M0,0 L13,6 L0,12 z" class="mm-punta"/></marker></defs><g></g>`;
    const capa = svg.querySelector('g');
    cont.appendChild(svg);
    cont.appendChild(S.barra);
    const abajo = document.createElement('div');
    abajo.className = 'sim-abajo';
    abajo.appendChild(S.pre); abajo.appendChild(S.dice);
    cont.appendChild(abajo);
    cont.appendChild(S.huecos);

    const Y = 54, H = 66;
    function pintar(k) {
      const f = F[Math.max(0, Math.min(k, F.length - 1))];
      capa.innerHTML = '';
      // Flecha del puntero: por debajo de las celdas, del centro de p al centro del destino.
      if (f.apunta && f.celdas.p) {
        const sx = X.p + ANCHO[8] / 2, tx = X[f.apunta] + ANCHO[4] / 2;
        const d = `M ${sx} ${Y + H} C ${sx} ${Y + H + 56}, ${tx} ${Y + H + 56}, ${tx} ${Y + H + 3}`;
        capa.appendChild(svgEl('path', { d, class: 'mm-flecha' + (f.cambio.includes('p') ? ' nueva' : ''), 'marker-end': `url(#${uid})` }));
      }
      ORDEN.forEach(n => {
        const c = f.celdas[n];
        const w = ANCHO[n === 'p' ? 8 : 4];
        if (!c) {                                  // celda aún no reservada
          capa.appendChild(svgEl('rect', { x: X[n], y: Y, width: w, height: H, rx: 8, class: 'mm-hueco' }));
          return;
        }
        const g = svgEl('g', { class: 'mm-celda' + (f.cambio.includes(n) ? ' cambio' : '') + (n === 'p' ? ' ptr' : '') });
        g.appendChild(svgEl('rect', { x: X[n], y: Y, width: w, height: H, rx: 8 }));
        g.appendChild(svgEl('text', { x: X[n] + w / 2, y: Y + 35, class: 'mm-valor' + (n === 'p' ? ' dir' : '') }, c.v));
        g.appendChild(svgEl('text', { x: X[n] + w / 2, y: Y + 56, class: 'mm-dir' }, c.dir));
        g.appendChild(svgEl('text', { x: X[n] + w - 8, y: Y + 17, class: 'mm-tam' }, `${c.tam} B`));
        capa.appendChild(g);
        // Etiquetas de nombre encima: el alias se pega junto al nombre original.
        const nombres = [[n, n === 'p' ? 'int*' : 'int', '']];
        if (f.alias === n) nombres.push(['r', 'int&', 'alias']);
        let cx = X[n];
        nombres.forEach(([nom, tipo, cls]) => {
          const t = `${tipo} ${nom}`;
          const tw = 20 + t.length * 11;
          const tg = svgEl('g', { class: 'mm-nombre ' + cls });
          tg.appendChild(svgEl('rect', { x: cx, y: Y - 36, width: tw, height: 28, rx: 6 }));
          tg.appendChild(svgEl('text', { x: cx + tw / 2, y: Y - 16 }, t));
          capa.appendChild(tg);
          cx += tw + 6;
        });
      });
      S.pintarComun(f, k);
    }
    cont._simPintar = pintar;
    cont._simTotal = F.length;
    pintar(0);
  }

  /* ---------- 6b. El mapa de memoria de un proceso ---------- */
  const MAPA_CODIGO = [
    'int total = 0;',
    'int* crear(int v) {',
    '  int* p = new int(v * 10);',
    '  return p; }',
    'int main() {',
    '  int n = 3;',
    '  int* a = crear(n);',
    '  total += *a;',
    '  crear(5);   // se ignora',
    '  delete a;',
    '  a = nullptr; }'
  ];

  function pasosMapa() {
    const F = [];
    const S = {
      pila: [], heap: [], total: 0, pc: null
    };
    const clon = () => JSON.parse(JSON.stringify(S));
    const vivos = () => S.heap.filter(b => b.est === '').length;
    const fugas = () => S.heap.filter(b => b.est === 'fuga').length;
    const add = o => F.push(Object.assign(clon(), {
      code: -1, test: '', say: '',
      chips: [[(n => `stack: ${n} ${n === 1 ? 'frame' : 'frames'}`)(S.pila.filter(fr => fr.est !== 'saliendo').length), 'ci'],
              [`heap: ${vivos()} ${vivos() === 1 ? 'vivo' : 'vivos'}`, 'cok'],
              [`fugas: ${fugas()}`, fugas() ? 'cj' : '']]
    }, o));
    const frame = fn => S.pila.find(fr => fr.fn === fn && fr.est !== 'saliendo');
    const varDe = (fn, n) => frame(fn).vars.find(v => v.n === n);

    add({ test: 'antes de main',
      say: `Antes de que <code>main</code> empiece, el sistema ya cargó dos regiones: el <b>código</b> de las funciones y la global <code>total</code>, que existe durante todo el programa. El stack y el heap están vacíos.` });

    S.pc = 'main';
    S.pila.push({ fn: 'main', est: '', vars: [
      { n: 'n', t: 'int',  v: '?', dir: '0x7ffc…5c' },
      { n: 'a', t: 'int*', v: '?', dir: '0x7ffc…50' }] });
    add({ code: 4, test: 'entra a main: se apila su frame',
      say: `Al entrar a <code>main</code> se apila su frame con espacio para <code>n</code> y <code>a</code>. Aún no tienen valor asignado: lo que haya en esas celdas es <b>basura</b> de antes.` });

    varDe('main', 'n').v = '3';
    add({ code: 5, test: 'n = 3',
      say: `<code>n</code> vale 3. Es una local: vive en el frame de <code>main</code> y desaparece con él.` });

    S.pc = 'crear';
    S.pila.push({ fn: 'crear', est: '', vars: [
      { n: 'v', t: 'int',  v: '3', dir: '0x7ffc…2c' },
      { n: 'p', t: 'int*', v: '?', dir: '0x7ffc…20' }] });
    add({ code: 1, test: 'crear(n) → v = 3, una copia',
      say: `La llamada apila un frame nuevo <b>debajo</b> del de <code>main</code>: el stack crece hacia direcciones menores (…2c es menor que …5c). <code>v</code> recibe una copia de <code>n</code>.` });

    S.heap.push({ id: 'b1', v: '30', dir: '0x5621…eb0', est: '' });
    varDe('crear', 'p').v = '0x5621…eb0'; varDe('crear', 'p').apunta = 'b1';
    add({ code: 2, test: 'new int(30) → 0x5621…eb0',
      say: `<code>new</code> reserva un <code>int</code> en el heap y devuelve su dirección, que se guarda en <code>p</code>. El 30 vive en el <b>heap</b>; <code>p</code>, que solo sabe dónde está, en el <b>stack</b>.`,
      predice: `cuando <code>crear</code> regrese, ¿qué le pasa a <code>p</code>? ¿Y al 30?` });

    S.pila[1].est = 'saliendo';
    varDe('main', 'a').v = '0x5621…eb0'; varDe('main', 'a').apunta = 'b1';
    S.pc = 'main';
    add({ code: 3, test: 'return p → a = 0x5621…eb0',
      say: `Al regresar, el frame de <code>crear</code> se destruye completo, <code>p</code> incluida. El bloque del heap <b>sobrevive</b> porque su vida no depende de ningún frame, y <code>a</code> recibió una copia de su dirección.` });
    S.pila.pop();

    S.total = 30;
    add({ code: 7, test: 'total += *a → total = 30',
      say: `<code>*a</code> sigue la dirección hasta el heap y lee el 30, que se suma a <code>total</code> en la región de datos: una línea, <b>tres regiones</b>.`,
      predice: `la siguiente línea llama <code>crear(5)</code> y no guarda el resultado. ¿Qué queda en el heap?` });

    S.pc = 'crear';
    S.pila.push({ fn: 'crear', est: '', vars: [
      { n: 'v', t: 'int',  v: '5',          dir: '0x7ffc…2c' },
      { n: 'p', t: 'int*', v: '0x5621…ed0', dir: '0x7ffc…20', apunta: 'b2' }] });
    S.heap.push({ id: 'b2', v: '50', dir: '0x5621…ed0', est: '' });
    add({ code: 2, test: 'crear(5) → new int(50) → 0x5621…ed0',
      say: `Segunda llamada: el frame de <code>crear</code> reaparece en las <b>mismas direcciones</b> que el anterior, y el heap entrega otro bloque. Solo <code>p</code> sabe dónde quedó el 50.` });

    S.pila[1].est = 'saliendo';
    S.heap[1].est = 'fuga';
    S.pc = 'main';
    add({ code: 8, test: 'el valor devuelto no se guarda',
      say: `Nadie guarda lo que devuelve <code>crear(5)</code>, y <code>p</code>, la única copia de la dirección, se fue con su frame: el bloque quedó <b>sin nadie que apunte a él</b>. Es una fuga.`,
      predice: `viene <code>delete a;</code>. ¿Cambia lo que guarda <code>a</code>?` });
    S.pila.pop();

    S.heap[0].est = 'liberado';
    add({ code: 9, test: 'delete a → el bloque vuelve al heap',
      say: `<code>delete</code> devuelve el bloque. <code>a</code> <b>no cambia</b>: sigue guardando 0x5621…eb0, una dirección que ya no es tuya. Leer <code>*a</code> aquí es <i>use-after-free</i>.` });

    varDe('main', 'a').v = 'nullptr'; delete varDe('main', 'a').apunta;
    add({ code: 10, test: 'a = nullptr',
      say: `Poner <code>a</code> en <code>nullptr</code> no libera nada. Deja a <code>a</code> en un estado que se puede preguntar con <code>if (a)</code>, y un segundo <code>delete a</code> ya no hace daño: borrar <code>nullptr</code> no hace nada.` });

    S.pila = []; S.pc = null;
    add({ code: -1, test: 'main regresa: el stack queda vacío',
      say: `Se desapila <code>main</code>. <code>total</code> y el bloque de la fuga siguen ahí hasta que el proceso termina; entonces el sistema operativo recupera toda su memoria. Por eso una fuga casi no se nota en una tarea que corre un segundo, y sí en un servidor que corre semanas.` });

    return F;
  }

  function construirMapa(cont) {
    const F = pasosMapa();
    const S = armarCascaron(cont, MAPA_CODIGO, F.length);
    cont.innerHTML = '';
    cont.classList.add('mm-mapa');

    const svg = svgEl('svg', { viewBox: '0 0 560 474', class: 'mm-svg', preserveAspectRatio: 'xMinYMin meet' });
    const uid = 'mmm' + (++simListaUid);
    svg.innerHTML =
      `<defs>
         <marker id="${uid}-a" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto"><path d="M0,0 L13,6 L0,12 z" class="mm-punta"/></marker>
         <marker id="${uid}-c" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto"><path d="M0,0 L13,6 L0,12 z" class="mm-punta colgante"/></marker>
       </defs><g></g>`;
    const capa = svg.querySelector('g');

    const izq = document.createElement('div');
    izq.className = 'mm-izq';
    izq.appendChild(svg);
    const der = document.createElement('div');
    der.className = 'mm-der';
    der.appendChild(S.pre);
    der.appendChild(S.dice);
    const cuerpo = document.createElement('div');
    cuerpo.className = 'mm-cuerpo';
    cuerpo.appendChild(izq); cuerpo.appendChild(der);
    cont.appendChild(cuerpo);
    cont.appendChild(S.barra);
    cont.appendChild(S.huecos);

    // Regiones, de direcciones altas (arriba) a bajas (abajo).
    const BX = 34, BW = 470;                    // caja de región; a la derecha queda el carril de flechas
    const REG = {
      stack: { y: 0,   h: 214, titulo: 'Stack', nota: 'crece hacia abajo ↓' },
      heap:  { y: 250, h: 104, titulo: 'Heap',  nota: 'crece hacia arriba ↑' },
      datos: { y: 362, h: 46,  titulo: 'Datos', nota: 'globales y static (.data, .bss)' },
      cod:   { y: 416, h: 56,  titulo: 'Código', nota: '.text, solo lectura' }
    };
    const FILA = 28, CAB = 22;

    function pintar(k) {
      const f = F[Math.max(0, Math.min(k, F.length - 1))];
      capa.innerHTML = '';

      // Eje de direcciones.
      capa.appendChild(svgEl('line', { x1: 12, y1: 8, x2: 12, y2: 466, class: 'mm-eje' }));
      capa.appendChild(svgEl('text', { x: 18, y: 10, class: 'mm-eje-txt', transform: 'rotate(90 18 10)' }, 'direcciones altas → bajas'));

      for (const r in REG) {
        const R = REG[r];
        capa.appendChild(svgEl('rect', { x: BX, y: R.y, width: BW, height: R.h, rx: 8, class: 'mm-region ' + r }));
        capa.appendChild(svgEl('text', { x: BX + 10, y: R.y + 17, class: 'mm-reg-titulo' }, R.titulo));
        capa.appendChild(svgEl('text', { x: BX + BW - 10, y: R.y + 17, class: 'mm-reg-nota' }, R.nota));
      }
      capa.appendChild(svgEl('text', { x: BX + 120, y: 234, class: 'mm-libre' }, '· · · espacio libre · · ·'));

      const posVar = {};                          // "fn.n" → coordenadas de su celda de valor
      // Frames del stack, apilados hacia abajo.
      let fy = REG.stack.y + 26;
      f.pila.forEach(fr => {
        const alto = CAB + fr.vars.length * FILA + 4;
        const g = svgEl('g', { class: 'mm-frame' + (fr.est ? ' ' + fr.est : '') });
        g.appendChild(svgEl('rect', { x: BX + 10, y: fy, width: BW - 20, height: alto, rx: 6 }));
        g.appendChild(svgEl('text', { x: BX + 20, y: fy + 16, class: 'mm-fn' }, `${fr.fn}()` + (fr.est === 'saliendo' ? '  — se destruye al regresar' : '')));
        fr.vars.forEach((v, i) => {
          const y = fy + CAB + i * FILA;
          g.appendChild(svgEl('text', { x: BX + 22, y: y + 19, class: 'mm-var' }, `${v.t} ${v.n}`));
          const basura = v.v === '?';
          g.appendChild(svgEl('text', { x: BX + 140, y: y + 19, class: 'mm-dir-txt izq' }, v.dir));
          g.appendChild(svgEl('rect', { x: BX + 270, y: y + 2, width: 170, height: FILA - 4, rx: 4, class: 'mm-val' + (basura ? ' basura' : '') }));
          g.appendChild(svgEl('text', { x: BX + 355, y: y + 19, class: 'mm-val-txt' + (basura ? ' basura' : '') }, basura ? 'basura' : v.v));
          posVar[`${fr.fn}.${v.n}.${fr.est}`] = { x: BX + 440, y: y + FILA / 2, v, est: fr.est };
        });
        capa.appendChild(g);
        fy += alto + 6;
      });

      // Bloques del heap, de izquierda a derecha.
      const posBloque = {};
      f.heap.forEach((b, i) => {
        const x = BX + 20 + i * 170, y = REG.heap.y + 30;
        const g = svgEl('g', { class: 'mm-bloque' + (b.est ? ' ' + b.est : '') });
        g.appendChild(svgEl('rect', { x, y, width: 150, height: 60, rx: 6 }));
        g.appendChild(svgEl('text', { x: x + 75, y: y + 28, class: 'mm-b-val' }, b.v));
        g.appendChild(svgEl('text', { x: x + 75, y: y + 50, class: 'mm-b-dir' }, b.dir));
        if (b.est) g.appendChild(svgEl('text', { x: x + 112, y: y - 6, class: 'mm-b-etq' }, b.est === 'fuga' ? 'fuga' : 'liberado'));
        capa.appendChild(g);
        posBloque[b.id] = { x: x + 36, y, est: b.est };   // la flecha entra por la izquierda; la etiqueta va a la derecha
      });

      // Punteros stack → heap por el carril derecho, cada uno en su propio carril.
      let carril = 0;
      Object.values(posVar).forEach(pv => {
        if (!pv.v.apunta || !posBloque[pv.v.apunta]) return;
        const B = posBloque[pv.v.apunta];
        const colg = B.est === 'liberado';
        const lx = BX + BW + 14 + carril * 14;
        const hy = REG.heap.y - 6 - carril * 8;       // dentro del espacio libre
        const d = `M ${pv.x} ${pv.y} H ${lx} V ${hy} H ${B.x} V ${B.y - 2}`;
        capa.appendChild(svgEl('path', { d, class: 'mm-flecha' + (colg ? ' colgante' : '') + (pv.est === 'saliendo' ? ' saliendo' : ''),
          'marker-end': `url(#${uid}-${colg ? 'c' : 'a'})` }));
        carril++;
      });

      // Región de datos: la global.
      const dy = REG.datos.y + 22;
      capa.appendChild(svgEl('text', { x: BX + 22, y: dy + 16, class: 'mm-var' }, 'int total'));
      capa.appendChild(svgEl('text', { x: BX + 140, y: dy + 16, class: 'mm-dir-txt izq' }, '0x5621…010'));
      capa.appendChild(svgEl('rect', { x: BX + 270, y: dy, width: 170, height: 22, rx: 4, class: 'mm-val' + (k > 0 && F[k - 1].total !== f.total ? ' cambio' : '') }));
      capa.appendChild(svgEl('text', { x: BX + 355, y: dy + 16, class: 'mm-val-txt' }, String(f.total)));

      // Región de código: las dos funciones y cuál se está ejecutando.
      [['main()', '0x5621…1a9'], ['crear()', '0x5621…189']].forEach(([fn, dir], i) => {
        const x = BX + 20 + i * 220, y = REG.cod.y + 24;
        const activo = f.pc && fn.startsWith(f.pc);
        const g = svgEl('g', { class: 'mm-fcod' + (activo ? ' activo' : '') });
        g.appendChild(svgEl('rect', { x, y, width: 200, height: 26, rx: 5 }));
        g.appendChild(svgEl('text', { x: x + 12, y: y + 18, class: 'mm-fcod-n' }, (activo ? '▶ ' : '') + fn));
        g.appendChild(svgEl('text', { x: x + 190, y: y + 18, class: 'mm-dir-txt' }, dir));
        capa.appendChild(g);
      });

      S.pintarComun(f, k);
    }
    cont._simPintar = pintar;
    cont._simTotal = F.length;
    pintar(0);
  }

  /* ---------- 6c. pushFront: puntero por valor contra Nodo*& ----------
     Corre las dos versiones sobre la MISMA memoria, una tras otra: la
     del checkpoint (por valor) deja una fuga y no cambia la lista; la
     corregida (por referencia) escribe en la celda head de main. La
     referencia se dibuja como lo que es por dentro: la dirección de
     esa celda. Así se ve por qué Nodo*& y Nodo** son la misma idea. */
  const PUSH_CODIGO = [
    'void pushFront(Nodo*  head, int v) {',
    '    head = new Nodo{v, head}; }',
    'void pushFront(Nodo*& head, int v) {',
    '    head = new Nodo{v, head}; }',
    'Nodo* head = new Nodo{20, nullptr};',
    'pushFront(head, 10);'
  ];

  function pasosPush() {
    const F = [];
    const S = { main: null, fr: null, nodos: {} };   // fr: frame de pushFront
    const lista = () => { const o = []; let id = S.main, g = 0; while (id && g++ < 9) { o.push(S.nodos[id].dato); id = S.nodos[id].next; } return o.join(' → ') || 'vacía'; };
    const add = (version, o) => F.push(Object.assign({
      main: S.main, fr: S.fr ? JSON.parse(JSON.stringify(S.fr)) : null,
      nodos: JSON.parse(JSON.stringify(S.nodos)),
      code: -1, test: '', say: '', cambio: [],
      chips: [version ? [version === 'A' ? 'A · por valor' : 'B · por referencia', version === 'A' ? 'cj' : 'cok'] : null,
              ['main ve: ' + lista(), 'ci']].filter(Boolean)
    }, o));

    S.nodos.n20 = { dato: 20, next: null, col: 2, fila: 0, est: '' };
    S.main = 'n20';
    add(null, { code: 4, cambio: ['main'], test: 'lista de un nodo',
      say: `<code>main</code> tiene una lista de un nodo: su variable <code>head</code>, en el stack, guarda la dirección del 20, en el heap. Queremos insertar el 10 al frente.` });

    // ---- Versión A: por valor ----
    S.fr = { modo: 'valor', head: 'n20', v: 10 };
    add('A', { code: 0, cambio: ['fr'], test: 'pushFront(head, 10) → se copia head',
      say: `El parámetro <code>Nodo* head</code> recibe una <b>copia</b> del valor: la misma dirección, en otra celda. Ahora hay dos punteros al 20, el de <code>main</code> y el de la función.` });

    S.nodos.n10a = { dato: 10, next: 'n20', col: 1, fila: 1, est: 'nuevo' };
    add('A', { code: 1, cambio: ['n10a'], test: 'new Nodo{10, head} → su next apunta al 20',
      say: `Se crea el 10 en el heap con su <code>next</code> apuntando al 20. Hasta aquí todo va bien.` });

    S.fr.head = 'n10a';
    add('A', { code: 1, cambio: ['fr'], test: 'head = (el nodo nuevo) → cambia la COPIA',
      say: `La asignación escribe en la celda del parámetro, que es la copia. El <code>head</code> de <code>main</code> <b>sigue apuntando al 20</b>.`,
      predice: `la función termina. ¿Qué le pasa al 10?` });

    S.fr = null; S.nodos.n10a.est = 'fuga';
    add('A', { code: -1, test: 'regresa: el frame desaparece',
      say: `Al regresar se destruye la copia, y con ella la única dirección del 10: queda <b>fugado</b>. Desde <code>main</code> la lista sigue siendo solo el 20. Por eso la respuesta correcta es <b>C</b>.` });

    // ---- Versión B: por referencia ----
    S.fr = { modo: 'ref', v: 10 };
    add('B', { code: 2, cambio: ['fr'], test: 'pushFront(head, 10) → head es la celda de main',
      say: `Con <code>Nodo*&amp;</code> el parámetro da acceso a la <b>celda <code>head</code> de <code>main</code></b>. Por dentro viaja la dirección de esa celda (0x7ffc…58): la misma idea que <code>Nodo**</code> en C, sin escribir asteriscos.` });

    S.nodos.n10b = { dato: 10, next: 'n20', col: 1, fila: 0, est: 'nuevo' };
    add('B', { code: 3, cambio: ['n10b'], test: 'new Nodo{10, head} → lee el head de main',
      say: `Leer <code>head</code> dentro de la función lee la celda de <code>main</code>, así que el 10 nuevo nace apuntando al 20.` });

    S.main = 'n10b';
    add('B', { code: 3, cambio: ['main'], test: 'head = (el nodo nuevo) → cambia el head de MAIN',
      say: `Ahora la asignación escribe <b>directo en la celda de <code>main</code></b>. No hay copia que se pierda.` });

    S.fr = null; S.nodos.n10b.est = '';
    add('B', { code: -1, test: 'regresa: el cambio sobrevive',
      say: `El frame desaparece y el cambio se queda: <code>main</code> ve <b>10 → 20</b>. El 10 rojo es la fuga que dejó la versión A: una llamada al principio que no hizo nada útil y además perdió memoria.` });

    return F;
  }

  function construirPush(cont) {
    const F = pasosPush();
    const S = armarCascaron(cont, PUSH_CODIGO, F.length);
    cont.innerHTML = '';

    const svg = svgEl('svg', { viewBox: '0 0 1100 226', class: 'mm-svg mm-push', preserveAspectRatio: 'xMinYMid meet' });
    const uid = 'mmp' + (++simListaUid);
    svg.innerHTML =
      `<defs>
         <marker id="${uid}-a" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto"><path d="M0,0 L13,6 L0,12 z" class="mm-punta"/></marker>
         <marker id="${uid}-n" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto"><path d="M0,0 L13,6 L0,12 z" class="mm-punta nueva"/></marker>
         <marker id="${uid}-k" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto"><path d="M0,0 L13,6 L0,12 z" class="mm-punta tinta"/></marker>
       </defs><g></g>`;
    const capa = svg.querySelector('g');
    cont.appendChild(svg);
    cont.appendChild(S.barra);
    const abajo = document.createElement('div');
    abajo.className = 'sim-abajo';
    abajo.appendChild(S.pre); abajo.appendChild(S.dice);
    cont.appendChild(abajo);
    cont.appendChild(S.huecos);

    // Stack a la izquierda, heap a la derecha.
    const ST = { x: 0, w: 470 }, HP = { x: 505, w: 595 };
    const NW = 150, NH = 54;
    const nodoXY = n => ({ x: HP.x + 30 + n.col * 190, y: n.fila === 0 ? 50 : 150 });

    function pintar(k) {
      const f = F[Math.max(0, Math.min(k, F.length - 1))];
      capa.innerHTML = '';
      capa.appendChild(svgEl('rect', { x: ST.x, y: 0, width: ST.w, height: 226, rx: 8, class: 'mm-region stack' }));
      capa.appendChild(svgEl('text', { x: ST.x + 12, y: 20, class: 'mm-reg-titulo' }, 'Stack'));
      capa.appendChild(svgEl('rect', { x: HP.x, y: 0, width: HP.w, height: 226, rx: 8, class: 'mm-region heap' }));
      capa.appendChild(svgEl('text', { x: HP.x + 12, y: 20, class: 'mm-reg-titulo' }, 'Heap'));

      const flechas = [];
      // Frame de main.
      const fila = (g, y, tipo, nombre, dir, valor, cambio) => {
        g.appendChild(svgEl('text', { x: 26, y: y + 19, class: 'mm-var' }, `${tipo} ${nombre}`));
        g.appendChild(svgEl('text', { x: 186, y: y + 19, class: 'mm-dir-txt izq' }, dir));
        g.appendChild(svgEl('rect', { x: 286, y: y + 2, width: 166, height: 24, rx: 4, class: 'mm-val' + (cambio ? ' cambio' : '') }));
        g.appendChild(svgEl('text', { x: 369, y: y + 19, class: 'mm-val-txt' }, valor));
      };
      const dirDe = id => ({ n20: '0x5621…eb0', n10a: '0x5621…ed0', n10b: '0x5621…ef0' })[id];
      let g = svgEl('g', { class: 'mm-frame' });
      g.appendChild(svgEl('rect', { x: 12, y: 32, width: 446, height: 56, rx: 6 }));
      g.appendChild(svgEl('text', { x: 22, y: 48, class: 'mm-fn' }, 'main()'));
      fila(g, 54, 'Nodo*', 'head', '0x7ffc…58', dirDe(f.main), f.cambio.includes('main'));
      capa.appendChild(g);
      const celdaMain = { x: 286, y: 68, w: 166 };
      flechas.push({ desde: [452, 68], a: f.main, cls: f.cambio.includes('main') ? 'nueva' : '' });

      if (f.fr) {
        const ref = f.fr.modo === 'ref';
        g = svgEl('g', { class: 'mm-frame' + (f.cambio.includes('fr') ? ' entra' : '') });
        g.appendChild(svgEl('rect', { x: 12, y: 104, width: 446, height: 86, rx: 6 }));
        g.appendChild(svgEl('text', { x: 22, y: 120, class: 'mm-fn' }, 'pushFront()'));
        if (ref) {
          // &head dentro de la función ES la dirección de la celda de main (g++ lo confirma).
          fila(g, 126, 'Nodo*&', 'head', '0x7ffc…58', '→ head de main', false);
        } else {
          fila(g, 126, 'Nodo*', 'head', '0x7ffc…18', dirDe(f.fr.head), f.cambio.includes('fr'));
          flechas.push({ desde: [452, 140], a: f.fr.head, cls: 'copia' });
        }
        fila(g, 156, 'int', 'v', '0x7ffc…14', String(f.fr.v), false);
        capa.appendChild(g);
        if (ref) {
          // La referencia: una flecha a la CELDA de main, no al heap.
          capa.appendChild(svgEl('path', {
            d: `M 286 140 C 240 140, 240 ${celdaMain.y + 4}, ${celdaMain.x - 2} ${celdaMain.y + 4}`,
            class: 'mm-flecha ref', 'marker-end': `url(#${uid}-a)` }));
        }
      }

      // Nodos del heap.
      for (const id in f.nodos) {
        const n = f.nodos[id], p = nodoXY(n);
        const gn = svgEl('g', { class: 'sl-nodo' + (n.est ? ' ' + n.est : '') });
        gn.appendChild(svgEl('rect', { x: p.x, y: p.y, width: NW, height: NH, rx: 8, class: 'caja' }));
        gn.appendChild(svgEl('line', { x1: p.x + 100, y1: p.y, x2: p.x + 100, y2: p.y + NH, class: 'div' }));
        gn.appendChild(svgEl('text', { x: p.x + 50, y: p.y + NH / 2 + 9, class: 'dato' }, n.dato));
        gn.appendChild(svgEl('circle', { cx: p.x + 125, cy: p.y + NH / 2, r: 4.5, class: 'raiz' }));
        gn.appendChild(svgEl('text', { x: p.x + NW / 2, y: p.y + NH + 17, class: 'mm-b-dir' }, dirDe(id)));
        if (n.est === 'fuga') gn.appendChild(svgEl('text', { x: p.x + NW + 10, y: p.y + NH / 2 + 5, class: 'sl-etq izq' }, 'fuga'));
        capa.appendChild(gn);
        if (n.next === null) {
          capa.appendChild(svgEl('line', { x1: p.x + 108, y1: p.y + NH - 8, x2: p.x + NW - 8, y2: p.y + 8, class: 'sl-nulo' }));
        } else {
          const t = nodoXY(f.nodos[n.next]);
          const tx = t.x - 2, ty = t.y + NH / 2 + (n.fila === f.nodos[n.next].fila ? 0 : (n.fila > f.nodos[n.next].fila ? 12 : -12));
          capa.appendChild(svgEl('line', { x1: p.x + 125, y1: p.y + NH / 2, x2: tx, y2: ty,
            class: 'sl-flecha' + (f.cambio.includes(id) ? ' nueva' : ''), 'marker-end': `url(#${uid}-${f.cambio.includes(id) ? 'n' : 'k'})` }));
        }
      }

      // Punteros del stack al heap.
      flechas.forEach(fl => {
        if (!fl.a || !f.nodos[fl.a]) return;
        const t = nodoXY(f.nodos[fl.a]);
        const [sx, sy] = fl.desde;
        const tx = t.x - 2, ty = t.y + NH / 2 - (fl.cls === 'copia' ? -8 : 8);
        // Hacia el nodo del fondo, la flecha de main pasa por arriba para no cruzar al nodo del frente.
        const arriba = fl.cls !== 'copia' && f.nodos[fl.a].col === 2;
        const d = arriba
          ? `M ${sx} ${sy} C ${sx + 140} 6, ${tx - 140} 6, ${tx} ${ty}`
          : `M ${sx} ${sy} C ${sx + 60} ${sy}, ${tx - 60} ${ty}, ${tx} ${ty}`;
        capa.appendChild(svgEl('path', { d, class: 'mm-flecha ' + fl.cls, 'marker-end': `url(#${uid}-${fl.cls === 'nueva' ? 'n' : 'a'})` }));
      });

      S.pintarComun(f, k);
    }
    cont._simPintar = pintar;
    cont._simTotal = F.length;
    pintar(0);
  }

  function construirSim(cont) {
    if (cont.dataset.alg === 'mem-push') return construirPush(cont);
    if (cont.dataset.alg === 'mem-alias') return construirAlias(cont);
    if (cont.dataset.alg === 'mem-mapa') return construirMapa(cont);
    if ((cont.dataset.alg || '').startsWith('lista-')) return construirLista(cont);
    const alg = ['lomuto', 'hoare', 'quickselect', 'seleccion'].includes(cont.dataset.alg)
      ? cont.dataset.alg : 'hoare';
    const arreglo = (cont.dataset.array || '7,8,5,2,1,6')
      .split(',').map(s => Number(s.trim())).filter(v => Number.isFinite(v));
    const run = alg === 'lomuto' ? pasosLomuto(arreglo)
              : alg === 'quickselect' ? pasosQuickselect(arreglo, Number(cont.dataset.k || 0))
              : alg === 'seleccion' ? pasosSeleccion(arreglo)
              : pasosHoare(arreglo);
    const n = run.n;
    // En quickselect los índices no salen del arreglo, así que no hacen falta
    // las casillas fantasma de los extremos.
    const seleccion = run.modo === 'seleccion';
    const cols = seleccion ? n : n + 2;

    cont.innerHTML = '';
    cont.style.setProperty('--sim-cols', cols);

    const cinta = document.createElement('div');
    cinta.className = 'sim-cinta';
    const celdas = [], columnas = [];
    for (let c = 0; c < cols; c++) {
      const idx = seleccion ? c : c - 1;       // −1 … n, o 0 … n−1
      const fantasma = idx < 0 || idx >= n;
      const col = document.createElement('div');
      col.className = 'sim-col' + (fantasma ? ' ghost' : '');
      const punteros =
        alg === 'quickselect' ? '<span class="pk">k</span><span class="pp">p</span>'
      : alg === 'seleccion'   ? '<span class="pi">i</span><span class="pp">m</span><span class="pj">j</span>'
      :                         '<span class="pi">i</span><span class="pj">j</span>';
      col.innerHTML =
        `<div class="sim-ptr">${punteros}</div>` +
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

    // En los dos simuladores de partición el panel es el código, con la línea
    // que corre resaltada. En quickselect es la cuenta del trabajo por ronda:
    // el código completo ya vive en el slide siguiente, y lo que aquí hace
    // falta ver es cuánto arreglo se descarta.
    const lineasPanel = seleccion ? run.filas : SIM_CODIGO[alg];
    const pre = document.createElement('pre');
    pre.className = 'sim-codigo' + (seleccion ? ' sim-trabajo' : '');
    pre.innerHTML = lineasPanel
      .map(l => `<div class="sim-linea">${seleccion ? pintarTexto(l) : pintarCodigo(l)}</div>`)
      .join('');
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
    // Se capturan una sola vez: cada paso les reescribe la clase, así que
    // buscarlas por clase en cada repintado dejaría de encontrarlas.
    const chips = [...barra.querySelectorAll('.sim-chip')];

    function pintar(k) {
      const f = run.frames[Math.max(0, Math.min(k, run.frames.length - 1))];

      for (let idx = -1; idx <= n; idx++) {
        const col = columnas[idx];
        if (!col) continue;
        col.className = 'sim-col' + (idx < 0 || idx >= n ? ' ghost' : '');
        if (idx >= 0 && idx < n) celdas[idx].textContent = f.arr[idx];
        // Fuera del rango vivo: descartado, ya no se vuelve a tocar.
        if (f.activo && idx >= 0 && idx < n && (idx < f.activo[0] || idx > f.activo[1])) {
          col.classList.add('mk-desc');
        }
        // Prefijo ya ordenado y definitivo (selection sort).
        if (f.ordenado && idx >= 0 && idx < f.ordenado) col.classList.add('mk-ord');
      }
      f.mark.forEach(([idx, tipo]) => {
        const col = columnas[idx];
        if (!col) return;
        col.classList.add({ i: 'mk-i', j: 'mk-j', sw: 'mk-sw', p: 'mk-p' }[tipo] || 'mk-f');
      });
      if (f.i != null && columnas[f.i]) columnas[f.i].classList.add('has-i');
      if (f.j != null && columnas[f.j]) columnas[f.j].classList.add('has-j');
      if (f.kIdx != null && columnas[f.kIdx]) columnas[f.kIdx].classList.add('has-k');
      if (f.p != null && columnas[f.p]) columnas[f.p].classList.add('has-p');
      if (f.m != null && columnas[f.m]) columnas[f.m].classList.add('has-p');

      zonas.innerHTML = '';
      if (f.zonas) {
        const z = f.zonas;
        const off = seleccion ? 1 : 2;        // +2 cuando hay casilla fantasma
        const tramo = (desde, hasta, texto, clase) => {
          if (hasta < desde) return;
          const d = document.createElement('div');
          d.className = 'sim-zona on' + (clase ? ' ' + clase : '');
          d.style.gridColumn = `${desde + off} / ${hasta + off + 1}`;
          d.textContent = texto;
          zonas.appendChild(d);
        };
        const desde = z.desde === undefined ? 0 : z.desde;
        const hasta = z.hasta === undefined ? n - 1 : z.hasta;
        if (z.crudo) {
          tramo(desde, z.corte, z.izq, 'ord');
          tramo(z.corte + 1, hasta, z.der, 'pend');
        } else if (z.pivote === undefined) {
          tramo(desde, z.corte, `a[lo..j] ${z.izq}`);
          tramo(z.corte + 1, hasta, `a[j+1..hi] ${z.der}`);
        } else {
          tramo(desde, z.corte, z.izq);
          tramo(z.pivote, z.pivote, 'p', 'piv');
          tramo(z.pivote + 1, hasta, z.der);
        }
      }

      if (f.chips && f.chips.length) {
        // Modo selección: el contenido y el color de cada chip los decide el paso.
        chips.forEach((el, idx) => {
          const c = f.chips[idx];
          el.hidden = !c;
          if (!c) return;
          el.textContent = c[0];
          el.className = 'sim-chip ' + (c[1] || '');
        });
      } else {
        const fijas = [['cp', `p = ${f.p}`],
                       ['ci', f.i == null ? 'i = —' : `i = ${f.i}`],
                       ['cj', f.j == null ? 'j = —' : `j = ${f.j}`]];
        chips.forEach((el, idx) => {
          el.hidden = false;
          el.className = 'sim-chip ' + fijas[idx][0];
          el.textContent = fijas[idx][1];
        });
      }
      $('.sim-test').textContent = f.test;
      $('.sim-cont').textContent = `${k + 1} / ${run.frames.length}`;
      dice.innerHTML = f.say;
      lineas.forEach((l, idx) => {
        l.classList.toggle('on', idx === f.code);
        // El panel de trabajo se va llenando ronda por ronda.
        if (!seleccion) return;
        const tope = f.verHasta != null ? f.verHasta : f.code;
        l.classList.toggle('oculta', tope < 0 || idx > tope);
      });
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

  /* ----------------------------------------------------------
     7. MODO OSCURO
     data-theme="dark" en <html>. Arranca en claro; la elección
     (botón abajo a la izquierda o tecla D) se guarda en
     localStorage y vale para todos los decks del sitio.
     Cada deck trae en <head> un script de una línea que aplica
     el tema antes de pintar; esto es el respaldo si falta.
     La impresión / PDF (?print-pdf) siempre sale en claro.
     ---------------------------------------------------------- */
  const THEME_KEY = 'curso-tema';
  const esImpresion = () => /print-pdf/i.test(window.location.search);

  function leerTema() {
    try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; }
    catch (e) { return 'light'; }
  }

  function aplicarTema(tema) {
    const root = document.documentElement;
    if (tema === 'dark' && !esImpresion()) root.dataset.theme = 'dark';
    else delete root.dataset.theme;
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      const oscuro = root.dataset.theme === 'dark';
      btn.setAttribute('aria-pressed', String(oscuro));
      btn.title = oscuro ? 'Modo claro (D)' : 'Modo oscuro (D)';
      btn.setAttribute('aria-label', btn.title);
    }
  }

  function alternarTema() {
    const nuevo = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, nuevo); } catch (e) { /* sin almacenamiento: solo esta página */ }
    aplicarTema(nuevo);
  }

  function initTema() {
    if (esImpresion()) { aplicarTema('light'); return; }
    if (!document.querySelector('.theme-toggle')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-toggle';
      btn.innerHTML =
        '<svg class="ic-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>' +
        '<svg class="ic-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/>' +
        '<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
      btn.addEventListener('click', e => { e.stopPropagation(); alternarTema(); btn.blur(); });
      document.body.appendChild(btn);
    }
    if (typeof Reveal !== 'undefined' && Reveal.addKeyBinding) {
      Reveal.addKeyBinding({ keyCode: 68, key: 'D', description: 'Modo oscuro / claro' }, alternarTema);
    }
    aplicarTema(leerTema());
  }

  aplicarTema(leerTema());   // al cargar el script, antes de init()

  /* ---------------------------------------------------------- */
  function init(glosario = {}) {
    GLOSARIO = glosario;
    initTema();
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
