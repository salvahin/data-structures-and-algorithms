# Estructuras de Datos y Algoritmos — slides

Slides del curso, publicados con GitHub Pages:

**https://salvahin.github.io/data-structures-and-algorithms/**

Cada deck es un `index.html` autocontenido hecho con [reveal.js](https://revealjs.com/)
(cargado desde CDN) más dos archivos compartidos: `css/theme-curso.css` y
`js/curso-slides.js`.

## Contenido publicado

### Sesiones del curso

| Ruta | Deck |
|---|---|
| `sesion-02/` | S2 — Recursión |
| `sesion-03/` | S3 — Análisis de algoritmos iterativos |
| `sesion-04/` | S4 — Análisis de algoritmos recursivos |
| `taller-01-two-pointers/` | T1 — Patrones de LeetCode: two pointers |

El resto de las sesiones se publica conforme avanza el semestre.

### Serie de repaso de C++ y POO

Veintidós decks de auto-estudio previos al curso, más el diagnóstico que dice
cuáles saltarse:

| Ruta | Contenido |
|---|---|
| `repaso/` | Índice de la serie |
| `repaso/plantilla/` | Archivos para arrancar el repositorio de ejercicios |
| `repaso-diagnostico/` | Diagnóstico de 15 reactivos |
| `repaso-v00/` … `repaso-v19/` | R0–R19 — C++, POO, plantillas y STL |
| `repaso-g01/`, `repaso-g02/` | G1–G2 — git y GitHub |

**Pendiente:** el índice de la serie y el cierre de R19 enlazan a `../sesion-01/`,
que todavía no está publicada. Los dos enlaces dan 404 hasta que suba la sesión 1.

## Publicar un deck nuevo

Los decks se editan en el proyecto local (`../slides/`), no aquí. Para subir uno:

```bash
./publish.sh sesion-05
```

Eso copia la carpeta desde `../slides/`, junto con `css/` y `js/`. Después hay que
agregar la entrada a mano en `index.html` y hacer commit:

```bash
git add -A && git commit -m "Publica sesión 5" && git push
```
