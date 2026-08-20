# Estructuras de Datos y Algoritmos — slides

Slides del curso **TC1031**, publicados con GitHub Pages:

**https://salvahin.github.io/data-structures-and-algorithms/**

Cada deck es un `index.html` autocontenido hecho con [reveal.js](https://revealjs.com/)
(cargado desde CDN) más dos archivos compartidos: `css/theme-curso.css` y
`js/curso-slides.js`.

## Contenido publicado

| Ruta | Deck |
|---|---|
| `sesion-02/` | S2 — Recursión |
| `sesion-03/` | S3 — Análisis de algoritmos iterativos |
| `sesion-04/` | S4 — Análisis de algoritmos recursivos |
| `taller-01-two-pointers/` | T1 — Patrones de LeetCode: two pointers |

El resto de las sesiones se publica conforme avanza el semestre. La serie de repaso
de C++ y POO aparece como pendiente en el índice.

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
