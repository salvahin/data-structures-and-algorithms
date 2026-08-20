# Repaso de C++ y POO

Ejercicios de la serie de auto-estudio previa a Estructuras de Datos y Algoritmos.
Una carpeta por sesión, un commit por sesión.

## Cómo compilar cualquier ejercicio

```bash
cd r13-memoria
g++ -std=c++17 -Wall -Wextra -g *.cpp -o programa
./programa
```

En Windows con MinGW, el ejecutable lleva `.exe` y se corre con `programa.exe`.

Para buscar fugas de memoria y accesos inválidos:

```bash
g++ -std=c++17 -g -fsanitize=address *.cpp -o programa
./programa
```

## Estructura

| Carpeta | Sesión |
|---|---|
| `r00-compilacion/` | R0 · ¿Qué pasa realmente cuando compilo? |
| `r01-vscode/` | R1 · VS Code: compilar sin salir del editor |
| `r02-tipos/` | R2 · Anatomía de un programa y tipos básicos |
| `r03-entrada-salida/` | R3 · Entrada y salida |
| `r04-control-flujo/` | R4 · Control de flujo |
| `r05-funciones/` | R5 · Funciones |
| `r06-depurador/` | R6 · El depurador de VS Code en serio |
| `r07-string/` | R7 · std::string y espacios de nombres |
| `r08-punteros/` | R8 · Arreglos, punteros y referencias |
| `r09-clases/` | R9 · De struct a class |
| `r10-constructores/` | R10 · Constructores, destructor y this |
| `r11-multiarchivo/` | R11 · Separación .h/.cpp y Makefile |
| `r12-errores/` | R12 · Anatomía de un error de compilación |
| `r13-memoria/` | R13 · Memoria dinámica y regla de tres |
| `r14-operadores/` | R14 · Sobrecarga de operadores |
| `r15-herencia/` | R15 · Herencia |
| `r16-polimorfismo/` | R16 · Polimorfismo |
| `r17-plantillas/` | R17 · Plantillas |
| `r18-vector/` | R18 · std::vector a fondo |
| `r19-stl/` | R19 · Panorama de la STL |

Los archivos objeto y los ejecutables no se versionan: los produce el compilador
y están listados en `.gitignore`.
