/* ============================================================
   ESCRIBE-CODIGO — el código se escribe línea por línea, y junto a
   cada paso aparece la decisión que lo justifica.
   Requiere Reveal.js 5.x. Incluir después de curso-slides.js y
   llamar, tras CursoSlides.init(...):

       EscribeCodigo.init();

   Uso en HTML (el texto de las líneas va escapado: &lt; &gt; &amp;):

     <div class="escribe">
       <div class="ce-codigo">
         <div class="ce-linea" data-paso="1">int buscar(int key) {</div>
         <div class="ce-linea" data-paso="2">    int pos = key % M;</div>
         <div class="ce-linea" data-paso="1">}</div>
       </div>
       <div class="ce-porque">
         <div class="ce-nota" data-paso="0">Texto antes de escribir nada.</div>
         <div class="ce-nota" data-paso="1"><b>La firma.</b> Por qué …</div>
         <div class="ce-nota" data-paso="2">…</div>
       </div>
     </div>

   - Cada paso es un fragment del slide. En el paso k se ven las
     líneas con data-paso ≤ k; las del paso k se escriben con un
     efecto de máquina de escribir y quedan resaltadas.
   - El panel de la derecha muestra la nota del paso actual.
   - Las líneas que todavía no aparecen ocupan su lugar, así que el
     bloque no cambia de tamaño mientras se escribe.
   - data-titulo en .escribe pone una barra con el nombre del archivo.
   - data-paso-on="3,5" en una línea la resalta también en esos pasos
     (útil para volver a señalar una línea ya escrita).
   ============================================================ */

const EscribeCodigo = (() => {

  const escapar = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const KW = /\b(int|long|void|bool|const|while|for|if|else|return|auto|class|public|private|struct|new|true|false|nullptr)\b/g;
  const TIPOS = /\b(vector|string|unordered_map|unordered_set|map|set|pair|sort)\b/g;

  // Resaltado mínimo con las mismas clases que los simuladores (.kw .fn .num .cm).
  function pintar(texto) {
    let codigo = texto, comentario = '';
    const i = texto.indexOf('//');
    if (i >= 0) { codigo = texto.slice(0, i); comentario = texto.slice(i); }
    let h = escapar(codigo)
      .replace(KW, '\u0001$1\u0002')
      .replace(TIPOS, '\u0003$1\u0002')
      .replace(/(?<![\w])(\d+)(?![\w])/g, '\u0004$1\u0002');
    h = h.replace(/\u0001/g, '<span class="kw">').replace(/\u0003/g, '<span class="fn">')
         .replace(/\u0004/g, '<span class="num">').replace(/\u0002/g, '</span>');
    if (comentario) h += '<span class="cm">' + escapar(comentario) + '</span>';
    return h;
  }

  const sinMovimiento = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function construir(cont) {
    const lineas = [...cont.querySelectorAll('.ce-linea')];
    const notas = [...cont.querySelectorAll('.ce-nota')];
    lineas.forEach(l => {
      const txt = l.textContent;
      l.dataset.largo = txt.length;
      l.innerHTML = '<span class="ce-txt">' + (pintar(txt) || ' ') + '</span>';
      l._on = (l.dataset.pasoOn || '').split(',').filter(Boolean).map(Number);
    });
    const pasoDe = el => Number(el.dataset.paso || 0);
    const total = Math.max(0, ...lineas.map(pasoDe), ...notas.map(pasoDe));

    // Barra superior opcional
    if (cont.dataset.titulo) {
      const cod = cont.querySelector('.ce-codigo');
      cod.setAttribute('data-titulo', cont.dataset.titulo);
    }

    // Contador de pasos dentro del panel de notas
    const porque = cont.querySelector('.ce-porque');
    const cuenta = document.createElement('div');
    cuenta.className = 'ce-cuenta';
    if (porque) porque.prepend(cuenta);

    // Resumen de las decisiones ya tomadas: el texto en negritas de cada nota.
    const resumen = document.createElement('ul');
    resumen.className = 'ce-resumen';
    const items = [];
    notas.forEach(n => {
      const b = n.querySelector('b');
      if (!b || pasoDe(n) === 0) return;
      const li = document.createElement('li');
      li.textContent = b.textContent.replace(/[.:]\s*$/, '');
      li.dataset.paso = pasoDe(n);
      resumen.appendChild(li);
      items.push(li);
    });
    if (porque && items.length) porque.appendChild(resumen);

    const huecos = document.createElement('span');
    huecos.className = 'ce-fragments';
    for (let k = 0; k < total; k++) {
      const f = document.createElement('span');
      f.className = 'fragment';
      f.setAttribute('aria-hidden', 'true');
      huecos.appendChild(f);
    }
    cont.appendChild(huecos);

    let actual = -1;
    function mostrar(k, animar) {
      let orden = 0;
      lineas.forEach(l => {
        const p = pasoDe(l);
        const visible = p <= k;
        l.classList.toggle('ce-oculta', !visible);
        l.classList.toggle('on', p === k || l._on.includes(k));
        const escribir = animar && p === k && !sinMovimiento();
        l.classList.remove('ce-escribe');
        if (escribir) {
          const n = Number(l.dataset.largo) || 1;
          const dur = Math.min(1.2, 0.18 + n * 0.022);
          l.style.setProperty('--ce-dur', dur + 's');
          l.style.setProperty('--ce-pasos', Math.max(4, n));
          l.style.setProperty('--ce-retraso', (orden * 0.28) + 's');
          void l.offsetWidth;
          l.classList.add('ce-escribe');
          orden++;
        }
      });
      // la nota del paso k, o la última anterior si ese paso no tiene
      let mejor = null;
      notas.forEach(n => { const p = pasoDe(n); if (p <= k && (!mejor || p >= pasoDe(mejor))) mejor = n; });
      notas.forEach(n => n.classList.toggle('ce-activa', n === mejor));
      cuenta.textContent = k === 0 ? 'Antes de escribir' : `Paso ${k} de ${total}`;
      items.forEach(li => li.classList.toggle('ce-hecho', Number(li.dataset.paso) < k));
      resumen.classList.toggle('ce-vacio', !items.some(li => Number(li.dataset.paso) < k));
      actual = k;
    }
    cont._cePintar = mostrar;
    cont._ceActual = () => actual;
    mostrar(0, false);
  }

  let ultimo = null;
  function sync() {
    const slide = Reveal.getCurrentSlide();
    if (!slide) return;
    const nuevo = slide !== ultimo;
    ultimo = slide;
    slide.querySelectorAll('.escribe').forEach(cont => {
      if (!cont._cePintar) return;
      const k = cont.querySelectorAll('.ce-fragments .fragment.visible').length;
      const antes = cont._ceActual();
      if (k !== antes || nuevo) cont._cePintar(k, !nuevo && k === antes + 1);
    });
  }

  function init() {
    const todos = document.querySelectorAll('.escribe');
    if (!todos.length) return;
    todos.forEach(construir);
    if (typeof Reveal !== 'undefined') {
      if (Reveal.sync) Reveal.sync();
      ['fragmentshown', 'fragmenthidden', 'slidechanged', 'ready']
        .forEach(ev => Reveal.on(ev, () => setTimeout(sync, 0)));
      sync();
    }
  }

  return { init, _pintar: pintar };
})();

if (typeof module !== 'undefined') module.exports = EscribeCodigo;
