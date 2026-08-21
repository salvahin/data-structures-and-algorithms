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
  }

  return { init };
})();
