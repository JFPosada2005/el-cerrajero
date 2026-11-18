# El Cerrajero — Teoría aplicada a la aplicación

> Esta guía explica únicamente cómo se aplica la teoría en el juego: qué modelo formal usa cada nivel, cómo se representa, cómo se ejecuta y cómo decide el juez.
>
> **Referencias de código.** Cada sección indica el archivo y el símbolo donde vive la lógica (`ruta — símbolo`). Se usan nombres de funciones, exports y campos, no números de línea, porque los números cambian cuando el archivo se edita; el nombre es la referencia estable.

---

## 1. La idea que se repite en los cinco niveles

El jugador no escribe fórmulas ni tablas de estados: arma un mecanismo. Cada mecanismo es, formalmente, un modelo de computación.

- **Entrada:** una secuencia de símbolos (las llaves o los símbolos de la cinta).
- **Mecanismo:** un conjunto finito de estados (celdas o secciones) y transiciones (cables o púas).
- **Aceptar:** consumir toda la entrada y terminar en un estado de aceptación (el cerrojo).
- **Rechazar:** no poder avanzar (una transición ausente, que la interfaz llama **alarma**) o terminar en un estado que no es de aceptación.
- **Contraejemplo:** una entrada que el mecanismo del jugador clasifica distinto que la regla del cliente. Es la llave que el ladrón usa para demostrar el error.

Cada nivel tiene dos fases de armado (reparar y construir) y una de asalto:

1. **Reparar:** el mecanismo ya existe pero está incompleto o tiene una pieza mal configurada.
2. **Construir:** se arma el mecanismo desde cero con una regla nueva.
3. **Asaltar:** el juez compara el mecanismo contra la regla del cliente y devuelve el primer contraejemplo.

Dentro de la app, **Probar** no es el juez: ejecuta una sola entrada de ejemplo y muestra el recorrido (la celda actual, la pila o la cinta). **Asaltar** sí ejecuta el juez completo; si el mecanismo es correcto, el ladrón se rinde; si no, el ladrón muestra la llave que rompió el mecanismo.

**Dónde está en el código**

- `src/game/machines.js` — `toMachine` elige `toDFA`, `toNFA`, `toPDA` o `toTM` según el nivel.
- `src/game/blueprint.js` — `applyEdit` aplica las conexiones y los cortes de cables.
- `src/game/judge.js` — `judge` produce el veredicto.
- `src/game/thief.js` — `thiefReport` y `formatLine` convierten el veredicto en el texto del ladrón.
- `src/main.js` — `handleProbe` (Probar), `handleAssault` (Ensayo/Asalto) y `handlePinEdit` (púas del tambor).

### Panorama teórico

| Niveles | Modelo | Poder expresivo |
|---|---|---|
| 1 y 2 | Autómata finito determinista (AFD) | Lenguajes regulares |
| 3 | Autómata finito no determinista con épsilon (AFND-λ) | Los mismos lenguajes regulares, con otra forma de escribirlos |
| 4 | Autómata de pila (AP) | Lenguajes libres de contexto |
| 5 | Máquina de Turing (MT) | Computación general: ya no reconoce un lenguaje, calcula una función |

La progresión no es decorativa: cada nivel agrega una capacidad que el anterior no tiene. El AFD no puede contar sin límite; el AP sí, con una pila. El AP no puede calcular todo; la MT sí, con una cinta.

---

## 2. Nivel 1 — Autómata finito determinista

### 2.1 Modelo formal

Un AFD es una tupla:

```text
M = (Q, Σ, δ, q0, F)
```

- `Q`: estados finitos.
- `Σ`: alfabeto de entrada.
- `δ`: función de transición `Q × Σ → Q`.
- `q0`: estado inicial.
- `F`: estados de aceptación.

Es **determinista** porque para cada estado y cada símbolo hay como máximo un destino. Si no hay transición, el mecanismo se detiene: eso es la alarma.

### 2.2 Cómo se representa en la app

- Cada **celda** es un estado.
- El **cable** etiquetado con una llave es la transición: “si estoy en esta celda y llega esta llave, me muevo a esta otra”.
- La celda de **Entrada** es `q0`.
- La celda **Cerrojo** es el estado de aceptación.
- Un cable ausente no es un estado de error: es la ausencia de transición. La app lo muestra como **alarma** y el mecanismo rechaza.

El alfabeto del nivel es `{1, 2, 3, 4}`.

### 2.3 Las dos reglas

| Fase | Lenguaje que debe aceptar |
|---|---|
| Reparar | Exactamente la palabra `123` |
| Construir | Exactamente la palabra `314` |

“Exactamente” significa que también se rechazan los prefijos (`12`), las extensiones (`1234`) y cualquier palabra con otro orden o con símbolos repetidos.

### 2.4 Ejecución

El motor recorre la entrada símbolo por símbolo:

1. Empieza en la celda de entrada.
2. Para cada símbolo, busca el cable que sale de la celda actual con esa etiqueta.
3. Si no existe, termina en alarma y rechaza.
4. Si existe, se mueve a la celda destino.
5. Al terminar la entrada, acepta si la celda actual es el cerrojo; si no, rechaza.

Ejemplos del nivel 1:

- `123` → recorre Entrada → Celda 1 → Celda 2 → Cerrojo: acepta.
- `12` → termina en Celda 2, que no es cerrojo: rechaza.
- `1234` → después de `123` está en Cerrojo, y el Cerrojo no tiene cable para `4`: alarma.
- `2` → en la reparación inicial llega al Cerrojo por un cable de más: acepta, y eso es un error.

### 2.5 Cómo juzga el juez exacto

El juez de los niveles 1, 2 y 3 no prueba entradas al azar: **decide si dos mecanismos aceptan exactamente el mismo lenguaje**.

Para comparar dos AFD:

1. Completa ambos con un estado sumidero: toda transición que falta se manda al sumidero, que rechaza.
2. Construye el **producto** de los dos autómatas: un estado del producto es un par `(estado del cliente, estado del jugador)`.
3. Recorre el producto en anchura desde `(q0_cliente, q0_jugador)`.
4. Si en algún par uno acepta y el otro no, hay diferencia. La palabra que lleva a ese par es un **contraejemplo**.
5. Si se agotan todos los pares alcanzables sin diferencias, los dos autómatas son equivalentes.

El recorrido en anchura garantiza que el contraejemplo sea el **más corto**; entre las palabras de la misma longitud, se elige la primera según el orden del alfabeto del nivel (orden **shortlex**).

Por eso el juez exacto es una **prueba**, no una muestra: el producto es finito y se recorrió completo. La equivalencia de AFD es decidible.

### 2.6 Qué devuelve y cómo se lee

El resultado contiene:

- `correct`: si los lenguajes son iguales.
- `counterexample`: la palabra que los distingue, o `null`.
- `reason`: `intruder` o `lockout`.
- `expected` / `actual`: si el cliente y el jugador aceptan esa palabra.
- `method`: `exact`.

Los dos motivos:

- **`intruder`**: el jugador acepta una palabra que el cliente rechaza. El mecanismo es demasiado permisivo; el ladrón entra.
- **`lockout`**: el cliente acepta una palabra que el jugador rechaza. El mecanismo es demasiado estricto; el cliente se queda afuera.

Contraejemplos reales del nivel 1:

| Mecanismo | Contraejemplo | Motivo | Lectura |
|---|---|---|---|
| Reparación inicial | `2` | `intruder` | El cable de más deja entrar con `2`. |
| Construcción vacía | `314` | `lockout` | Sin cables, el cliente no puede abrir. |
| Mecanismo vacío contra la reparación | `123` | `lockout` | El cliente abre; el mecanismo no. |

**Dónde está en el código**

- Datos: `src/game/level1.js` — `phases.repair.target.machine`, `phases.build.target.machine`, `blueprint.wires`.
- Motor: `src/core/dfa.js` — `simulateDFA` (recorrido), `runDFA` (resultado con frames), `completeDFA` (sumidero), `acceptsDFA`.
- Juez: `src/game/judge.js` — rama `target.kind === 'machine'` de `judge`, `normalized`, `withAlphabet`; `src/core/dfa.js` — `areEquivalentDFA` y `shortestCounterexample`.
- Conversión: `src/game/machines.js` — `toDFA`.
- Interfaz: `src/ui/graphEditor.js` — `createGraphEditor`; `src/main.js` — `renderWorkshop`, `handleProbe`, `handleAssault`.

---

## 3. Nivel 2 — AFD con bucle

### 3.1 Qué agrega

El modelo sigue siendo un AFD. Lo nuevo es que el lenguaje es **infinito** y el mecanismo necesita **bucles**: cables que vuelven a la misma celda o a una celda anterior.

Un bucle no agrega memoria: un AFD sigue teniendo estados finitos. Lo que hace es permitir que el mecanismo **siga escuchando** sin cambiar de estado, o que vuelva a un estado anterior cuando la entrada invalida lo que había reconocido.

### 3.2 Las dos reglas

| Fase | Lenguaje que debe aceptar |
|---|---|
| Reparar | La cantidad de `1` es impar; los `2` no cambian nada |
| Construir | La palabra termina en `2 · 1` |

Alfabeto: `{1, 2}`.

### 3.3 Reparación: el bucle que falta

El mecanismo tiene dos celdas:

- **Cerrada** (inicial).
- **Abierta** (cerrojo).

La llave `1` alterna entre las dos: `Cerrada —1→ Abierta` y `Abierta —1→ Cerrada`. Así el estado recuerda la paridad de los `1`: Abierta significa “cantidad impar”.

La llave `2` no debería cambiar nada, así que cada celda necesita un bucle con `2`. En la reparación falta justo el de Abierta:

```text
Abierta —2→ Abierta
```

Sin ese bucle, la entrada `12` deja el mecanismo en Abierta y después no tiene transición para `2`: alarma. El cliente, en cambio, acepta `12` porque tiene un solo `1` (impar). El contraejemplo es `12`, con motivo `lockout`.

### 3.4 Construcción: aceptar por el final

La regla “termina en `2 · 1`” obliga a que el estado de aceptación también tenga transiciones de salida. Si el mecanismo ya aceptó y llega otra llave, el hecho de haber aceptado antes deja de importar: lo que cuenta es el final de la palabra.

La idea del mecanismo correcto:

- `s0` (Espera): estado inicial. Con `1` se queda en `s0`; con `2` pasa a `s1`.
- `s1` (Atenta): se vio un `2`. Con `1` pasa al cerrojo; con `2` se queda en `s1`.
- `s2` (Cerrojo): se vio `2 · 1`. Con `1` vuelve a `s0` (la palabra ya no termina en `2 · 1`); con `2` vuelve a `s1` (ahora termina en `2`).

Así, `21`, `221` y `1221` aceptan; `2`, `1`, `12` y `211` rechazan.

### 3.5 Cómo juzga

El juez es el mismo de nivel 1: producto de los dos AFD y búsqueda en anchura. Los bucles no rompen nada porque el producto sigue siendo finito: aunque el lenguaje tenga infinitas palabras, solo hay `|Q_cliente| × |Q_jugador|` pares de estados posibles.

La reparación inicial devuelve `12` (`lockout`). La construcción vacía falla en `21` (`lockout`), la palabra más corta que el cliente acepta.

**Dónde está en el código**

- Datos: `src/game/level2.js` — `phases.repair.target.machine`, `phases.build.target.machine`, `blueprint.wires`.
- Lazo y engranaje: `src/game/blueprint.js` — `applyEdit` (efecto `needs-gear` para los auto-lazos); `src/core/dfa.js` — `simulateDFA` trata el lazo como cualquier transición.
- Juez: el mismo de L1 (`judge` → `areEquivalentDFA`).
- Conversión: `src/game/machines.js` — `toDFA`.

---

## 4. Nivel 3 — Autómata finito no determinista con épsilon

### 4.1 Modelo formal

Un AFND permite que, para un estado y un símbolo, haya **varios destinos posibles**. Además, permite transiciones **épsilon** (`ε`): movimientos que no consumen ningún símbolo de la entrada.

```text
δ: Q × (Σ ∪ {ε}) → P(Q)
```

La aceptación es **existencial**: basta con que **algún camino** posible termine en un estado de aceptación. No hace falta que todos los caminos lo hagan; los caminos que mueren simplemente se descartan.

### 4.2 Cómo se representa en la app

- Un **bifurcador** permite que una celda tenga dos cables con la misma llave. Al leer esa llave, el mecanismo queda en dos celdas a la vez.
- Un **resorte** es una transición épsilon: une dos celdas sin consumir llave.
- La celda de **Espera** tiene bucles con las llaves para seguir escaneando la entrada mientras otro camino intenta reconocer el patrón.
- El **Cerrojo** también tiene bucles, para que los símbolos que vienen después del patrón no rompan la aceptación.

### 4.3 Las dos reglas

| Fase | Lenguaje que debe aceptar |
|---|---|
| Reparar | La palabra contiene la subsecuencia contigua `1 · 2 · 2` |
| Construir | La palabra contiene `1 · 2 · 2` o `2 · 1 · 1` |

Alfabeto: `{1, 2}`.

“Contiene” significa que el patrón puede estar en cualquier posición y puede haber símbolos antes o después. Por eso `122`, `1122` y `1221` aceptan; `12`, `22` y `1211` no.

### 4.4 Ejecución

El motor no mantiene un solo estado: mantiene un **conjunto de estados activos**.

1. Al inicio, calcula la **clausura épsilon** del estado inicial: todos los estados alcanzables por resortes, sin consumir entrada.
2. Para cada símbolo de la entrada, mueve **todos** los estados activos por ese símbolo y vuelve a calcular la clausura épsilon del resultado.
3. Si el conjunto queda vacío, no queda ningún camino posible: rechaza.
4. Al terminar la entrada, acepta si **algún** estado activo es de aceptación.

La clausura épsilon se calcula recorriendo los resortes hasta que no aparezcan estados nuevos, para tolerar ciclos sin colgarse.

### 4.5 Por qué el no determinismo ayuda

En el nivel 3, el mecanismo tiene que responder una pregunta del tipo “¿el patrón empieza acá o más adelante?”. El bifurcador permite mantener **las dos hipótesis al mismo tiempo**: un camino sigue esperando y el otro empieza a reconocer.

Formalmente, un AFND no acepta más lenguajes que un AFD: los lenguajes regulares son los mismos. Lo que cambia es la **forma de escribirlo**. El no determinismo permite expresar la búsqueda del patrón de manera más natural: una misma llave puede abrir dos hipótesis a la vez. Es una diferencia de notación y de comodidad, no de poder expresivo.

La transición épsilon es la que permite que el mecanismo “arranque” dos ramas sin gastar una llave: el resorte de entrada abre el camino de día y el de noche al mismo tiempo.

### 4.6 Cómo juzga

El juez exacto no puede comparar dos AFND directamente con el producto, porque un AFND puede tener varios destinos por símbolo. El procedimiento es:

1. Convertir cada AFND en un AFD equivalente mediante **construcción de subconjuntos**.
   - Un estado del AFD nuevo es un conjunto de estados del AFND.
   - El estado inicial es la clausura épsilon del inicial.
   - Para cada conjunto y cada símbolo, se mueven todos sus estados, se unen los destinos y se calcula la clausura épsilon.
   - Solo se crean los subconjuntos **alcanzables**; el subconjunto vacío no se crea, porque una transición ausente va a la alarma.
2. Comparar los dos AFD resultantes con el producto y la búsqueda en anchura del nivel 1.

El contraejemplo sigue siendo el más corto en orden shortlex. La equivalencia de AFND también es decidible, porque la construcción de subconjuntos produce un AFD finito.

Contraejemplos reales:

| Mecanismo | Contraejemplo | Motivo | Lectura |
|---|---|---|---|
| Reparación inicial | `1122` | `lockout` | Falta el bucle de Espera con `1`; el camino que debería seguir escaneando muere. |
| Construcción inicial | `211` | `lockout` | Falta la rama de noche; el patrón `211` no se reconoce. |

**Dónde está en el código**

- Datos: `src/game/level3.js` — `phases.repair.target.machine` y `phases.build.target.machine` (creados con `createNFA`), `blueprint.wires` con `spring: true`.
- Motor: `src/core/nfa.js` — `epsilonClosure`, `moveNFA`, `runNFA`, `nfaToDFA`.
- Conversión: `src/game/machines.js` — `toNFA` (compila el resorte a `EPSILON`, definido en `src/core/symbols.js`).
- Juez: `src/game/judge.js` — `normalized` (AFND → `nfaToDFA`) y la rama exacta de `judge`.
- Interfaz: `src/ui/graphEditor.js` — `createGraphEditor`; `src/main.js` — `handleProbe`.

---

## 5. Nivel 4 — Autómata de pila

### 5.1 Modelo formal

Un autómata de pila agrega una **pila** como memoria auxiliar:

```text
M = (Q, Σ, Γ, δ, q0, Z0, F)
```

- `Γ`: alfabeto de la pila.
- `Z0`: símbolo inicial de la pila (la base).
- `δ`: para cada estado, símbolo de entrada (o épsilon) y tope de pila, devuelve uno o más estados con una operación de pila.

La pila es **LIFO** (el último símbolo que entra es el primero que sale) y no tiene límite teórico. Eso es lo que permite contar sin un número fijo de estados.

### 5.2 Cómo se representa en la app

- La pila tiene una **base** `Z` y **fichas** `X`.
- Cada cable etiquetado con una llave define:
  - **Tope**: `any` (sirve cualquier tope), `base` o `chip`.
  - **Acción**: `push` (apilar una ficha), `pop` (desapilar) o `keep` (no tocar la pila).
- Un **resorte** es una transición épsilon: se dispara sin consumir llave.
- El **Cerrojo** es el estado de aceptación.

El tope `any` significa que la regla sirve tanto con la base como con una ficha. Así, un mismo cable puede funcionar tanto con la pila vacía como con fichas.

### 5.3 Las dos reglas

| Fase | Lenguaje que debe aceptar |
|---|---|
| Reparar | Sube y baja la misma cantidad de veces, sin bajar de más y sin quedar vacío |
| Construir | Primero varias `A`, después exactamente la misma cantidad de `B` |

Alfabeto: `{A, B}`, donde `A` es subir y `B` es bajar.

- La reparación acepta el lenguaje de paréntesis balanceados: `AB`, `AABB`, `AAABBB`, etc. Rechaza `A`, `B`, `AAB`, `ABB` y la palabra vacía.
- La construcción acepta `A^n B^n` para `n ≥ 1`: `AB`, `AABB`, `AAABBB`, etc. Rechaza `BA`, `AAB`, `ABB` y la palabra vacía.

### 5.4 Ejecución

El motor explora **configuraciones**. Una configuración es:

```text
(estado actual, símbolos consumidos, contenido de la pila)
```

La pila es una secuencia de símbolos; el tope es el último que se apiló.

1. Empieza en `(q0, 0, Z)`.
2. Para cada regla aplicable, genera una configuración hija:
   - verifica el estado de origen;
   - verifica el tope;
   - verifica el símbolo de entrada (o que sea épsilon);
   - aplica `push`, `pop` o `keep`;
   - avanza el estado y, si no era épsilon, avanza la posición de entrada.
3. Usa una cola y un conjunto de configuraciones visitadas para explorar todos los caminos sin repetir.
4. Acepta si encuentra una configuración con toda la entrada consumida y un estado de aceptación.
5. Si supera el límite de configuraciones o de pila, la corrida queda **truncada** y el resultado es `limit`.

Los límites de la app son 20.000 configuraciones y 64 símbolos de pila. No son parte de la teoría: son una protección para que una máquina con bucles épsilon no cuelgue la aplicación.

### 5.5 El resorte final y la condición de tope

En la reparación, el resorte que va de Trabajo a Cerrojo tiene tope `any`. Eso significa que se dispara **aunque queden fichas en la pila**. Con la entrada `A`, el mecanismo sube una ficha, el resorte lo deja pasar y acepta; el cliente, en cambio, rechaza `A` porque no bajó.

La reparación correcta es cambiar el tope del resorte a `base`: solo se dispara cuando la pila volvió a la base, es decir, cuando se subió y se bajó la misma cantidad.

En la construcción, la pila se usa así:

- `q0 —A/push→ q1`: empieza a cargar.
- `q1 —A/push→ q1`: sigue cargando.
- `q1 —B/pop→ q2`: empieza a descargar.
- `q2 —B/pop→ q2`: sigue descargando.
- `q2 —ε, tope base→ q3`: cuando la pila está vacía, abre.

Ese es el mecanismo clásico de `A^n B^n`: la pila guarda cuántas `A` se leyeron y las `B` las van desapilando.

### 5.6 Cómo juzga: juez acotado de lenguaje

La equivalencia de autómatas de pila es **indecidible**: no existe un algoritmo general que decida si dos AP aceptan el mismo lenguaje. Por eso el nivel 4 no usa el juez exacto.

En su lugar, el juez compara el mecanismo contra una **regla de referencia** (un oráculo) sobre un conjunto de palabras:

1. **Todas las palabras** hasta longitud 10 sobre el alfabeto: 2.047 palabras.
2. **Familias estructuradas** para `n = 1..16` (las dos variantes desde `n = 2`):
   - `A^n B^n`
   - `A^(n-1) B^n`
   - `A^n B^(n-1)`
3. **200 palabras aleatorias** de longitud 11 a 24, con una semilla fija para que el resultado sea reproducible.

Se eliminan duplicados, se ordenan en shortlex y se prueban una por una:

- Si el AP acepta y el oráculo rechaza → `intruder`.
- Si el oráculo acepta y el AP rechaza → `lockout`.
- Si el AP se queda sin límite en una palabra que el oráculo acepta → `jam`.
- Si el AP se queda sin límite en una palabra que el oráculo rechaza, se considera cerrado (un mecanismo trabado no abre) y se sigue.

El resultado incluye una **cobertura**: longitud exhaustiva, cantidad de palabras probadas, familias usadas y máximo de pasos observado.

Esto es **evidencia, no prueba**. Si el juez no encuentra diferencias, el mecanismo pasó todas las pruebas, pero no está demostrado que sea equivalente al oráculo. Es el límite honesto del nivel.

Contraejemplos reales:

| Mecanismo | Contraejemplo | Motivo | Lectura |
|---|---|---|---|
| Reparación inicial | `A` | `intruder` | El resorte con tope `any` abre con una ficha en la pila. |
| Construcción vacía | `AB` | `lockout` | Sin cables, el cliente no puede abrir. |

**Dónde está en el código**

- Datos: `src/game/level4.js` — `stack` (`base: 'Z'`, `chip: 'X'`), `phases.repair/build.blueprint.wires` con `stack: { top, action }`.
- Oráculos: `src/game/oracles.js` — `balancedTurns`, `anbn`, `ORACLES`.
- Motor: `src/core/pda.js` — `fireRule` (disparo de una regla), `runPDA` (BFS de configuraciones), `isBetter` (mejor camino para los frames).
- Conversión: `src/game/machines.js` — `toPDA`, `pushFor`.
- Juez: `src/game/judge.js` — `judgeLanguage`, `languageCoverage`; `src/core/order.js` — `enumerateWords`, `randomWords`, `shortlexCompare`.
- Interfaz: `src/main.js` — `renderStack`, `handleProbe`.

---

## 6. Nivel 5 — Máquina de Turing

### 6.1 Modelo formal

Una máquina de Turing tiene una **cinta infinita** en ambas direcciones, un **cabezal** que lee y escribe, y un control finito:

```text
δ: Q × Γ → Q × Γ × {L, R}
```

En cada paso:

1. Lee el símbolo bajo el cabezal.
2. Escribe un símbolo.
3. Mueve el cabezal a la izquierda o a la derecha.
4. Cambia de estado.

La máquina es determinista: para cada estado y símbolo hay como máximo una regla. Acepta si llega a un estado final; si no hay regla para lo que leyó, se detiene en **alarma**; si supera el límite de pasos, se detiene en **jam**.

### 6.2 Cómo se representa en la app

- Cada **sección** es un estado.
- Cada **púa** es una regla para un símbolo de la cinta. La púa define:
  - qué **escribe**;
  - hacia dónde **mueve** (`←` o `→`);
  - a qué **sección** pasa.
- Una púa vacía significa “no hay regla”: alarma.
- La sección **Listo** es final y no se puede editar: en este juego, los estados de aceptación no tienen reglas.
- La **cinta** muestra las celdas y marca el cabezal con `▲`.
- Los símbolos de la cinta son `0`, `1`, `+` y el blanco. El blanco se muestra vacío.

### 6.3 Reparación: sumar 1 en binario

La regla es la función `bin(x) → bin(x + 1)`.

El algoritmo es el acarreo de la suma binaria:

1. **Buscar el final:** avanzar a la derecha sobre `0` y `1` hasta el blanco.
2. **Llevar:** retroceder. Mientras se lea `1`, escribir `0` y seguir a la izquierda (el acarreo continúa). Cuando se lea `0` o el blanco, escribir `1`, moverse a la derecha y pasar a Listo.

Ejemplo: `1` → se lee `1`, se escribe `0`, se sigue a la izquierda; hay blanco, se escribe `1`; la cinta queda `10`.

El error de la reparación está en la púa de la sección **Llevar** que lee `1`: escribe `1` en lugar de `0`. Por eso `1` produce `11` en vez de `10`, y el juez devuelve `wrong-output`.

### 6.4 Construcción: sumar dos números

La regla es la función `bin(x) + bin(y) → bin(x + y)`, con los dos números separados por `+`.

El mecanismo reutiliza el contador de `+1` y agrega tres secciones:

- **Restar:** baja el segundo número en 1. Si lee `0`, lo cambia por `1` y sigue a la izquierda (pide prestado); si lee `1`, lo cambia por `0` y vuelve al signo `+`; si llega al `+`, lo borra y pasa a limpiar.
- **Volver al signo:** retrocede sobre el primer número hasta encontrar el `+` y sigue a la izquierda para entrar en Llevar.
- **Llevar:** suma 1 al primer número propagando el acarreo: los `1` se vuelven `0` y se sigue a la izquierda; el primer `0` o el blanco se vuelve `1`, y se vuelve a buscar el final del segundo número.
- **Limpiar:** borra lo que queda del segundo número; cuando llega al blanco, pasa a Listo. El `+` ya se borró al terminar la resta.

La idea computacional es: **restar 1 al segundo número y sumar 1 al primero**, repetir hasta que el segundo número sea cero, y después limpiar la cinta. Es una suma por conteo, pero con la cinta como memoria.

El mecanismo de referencia tiene 16 púas. Con la entrada `1111+1111` produce `11110` en 230 pasos.

### 6.5 Ejecución

La cinta es infinita; en la práctica solo importan las celdas que se escriben. El cabezal empieza en la posición 0.

En cada paso, en este orden:

1. Si la sección actual es final → acepta.
2. Lee el símbolo bajo el cabezal.
3. Si no hay púa para ese símbolo → alarma.
4. Si ya se alcanzó el límite de pasos → jam.
5. Aplica la púa: escribe, mueve el cabezal y cambia de sección.

La salida es la cinta desde la celda no blanca más a la izquierda hasta la más a la derecha, uniendo los huecos con el blanco. Los ceros a la izquierda se toleran; un `+` que quede en la cinta hace fallar la comparación.

Para **Probar**, el motor registra el recorrido paso a paso y muestra la cinta alrededor del cabezal.

### 6.6 Cómo juzga: juez acotado de función

El nivel 5 no reconoce un lenguaje: **calcula una función**. Por eso el juez compara salidas.

Las entradas se generan así:

- **Incremento:** todos los `bin(x)` para `0 ≤ x < 64`, más los casos de acarreo `2^k - 1` para `k = 1..10`. Quedan 68 entradas únicas.
- **Suma:** todos los pares `bin(x)+bin(y)` para `0 ≤ x, y < 16` (256 pares), más las cadenas de acarreo `(2^k - 1) + 1` para `k = 1..8` y `(2^k - 1) + (2^k - 1)` para `k = 1..5`. Quedan 261 entradas únicas.

Para cada entrada:

1. Se calcula el resultado esperado con aritmética normal.
2. Se ejecuta la máquina con un límite de 5.000 pasos.
3. Se comprueba, en este orden:
   - si llegó al límite → `jam`;
   - si se detuvo por alarma o por un símbolo inválido → `alarm`;
   - si la salida no es solo `0`/`1` o su valor numérico no coincide → `wrong-output`.

La comparación es numérica: `0010` y `10` valen lo mismo, porque los ceros a la izquierda se toleran. Un `+` que quede en la cinta no cumple el formato y falla.

El primer error se devuelve como contraejemplo, en orden shortlex sobre `0, 1, +`.

Esto también es **evidencia, no prueba**. Por el teorema de Rice, ninguna propiedad no trivial de lo que computa una máquina de Turing es decidible en general; la detención tampoco. Probar 68 o 261 entradas no demuestra que la máquina calcule la función para toda entrada posible. Es el límite honesto del nivel.

Contraejemplos reales:

| Mecanismo | Entrada | Resultado | Motivo | Lectura |
|---|---|---|---|---|
| Reparación inicial | `1` | `11` en vez de `10` | `wrong-output` | La púa de Llevar escribe un `1` de más. |
| Construcción inicial | `0+0` | se detiene | `alarm` | Falta la púa del `+` en Buscar el final. |
| Contador que no termina | `0` | 5.000 pasos | `jam` | El mecanismo se queda dando vueltas. |

**Dónde está en el código**

- Datos: `src/game/level5.js` — `phases.repair/build.sections`, `tape`, `blueprint.rules`, `target.id`.
- Motor: `src/core/tm.js` — `runTM` (paso a paso), `pushFrame` (frames), `tapeOutput` (salida), `acceptsTM`.
- Conversión: `src/game/machines.js` — `toTM`.
- Funciones de referencia: `src/game/functions.js` — `incrementInputs`, `incrementCompute`, `incrementMatches`, `sumInputs`, `sumCompute`, `sumMatches`, `FUNCTIONS`, `functionFor`.
- Juez: `src/game/judge.js` — `judgeFunction`, `functionCoverage`, `functionFamilies`.
- Interfaz: `src/ui/drumEditor.js` — `createDrumEditor`; `src/ui/tapePanel.js` — `createTapePanel`; `src/main.js` — `renderDrumWorkshop`, `probeTape`, `assaultTape`, `showTapeFrame`, `handlePinEdit`.

---

## 7. Los tres jueces, en conjunto

| | Juez exacto (niveles 1-3) | Juez acotado de lenguaje (nivel 4) | Juez acotado de función (nivel 5) |
|---|---|---|---|
| Qué compara | Dos AFD equivalentes | AP contra un oráculo booleano | MT contra una función de referencia |
| Cómo | Producto y búsqueda en anchura | Muestreo estructurado y aleatorio | Conjunto finito de entradas y comparación de salida |
| Qué garantiza | Equivalencia exacta | Evidencia sobre las palabras probadas | Evidencia sobre las entradas probadas |
| Contraejemplo | La palabra más corta en shortlex | La primera palabra que falla | La primera entrada que falla |
| Motivos | `intruder`, `lockout` | `intruder`, `lockout`, `jam` | `jam`, `alarm`, `wrong-output` |
| Cobertura | No aplica | Longitud exhaustiva, palabras, familias, pasos | Entradas, familias, pasos |

### 7.1 Los campos del veredicto

- **`correct`**: si el mecanismo pasó el juez.
- **`counterexample`**: la entrada que lo hizo fallar; `null` si pasó.
- **`reason`**: el tipo de fallo.
- **`expected`**: lo que esperaba el cliente (un booleano o una salida).
- **`actual`**: lo que hizo el mecanismo (un booleano, una salida o `null` si no terminó).
- **`method`**: `exact` o `bounded`.
- **`coverage`**: qué se probó; `null` en el juez exacto.

### 7.2 Qué significa cada motivo

| Motivo | Qué pasó | Qué está mal en el mecanismo |
|---|---|---|
| `intruder` | El mecanismo acepta una palabra que el cliente rechaza. | Es demasiado permisivo. |
| `lockout` | El cliente acepta una palabra que el mecanismo rechaza. | Es demasiado estricto. |
| `jam` | El mecanismo no terminó dentro del límite en una palabra que debería abrir. | Se cuelga o es demasiado lento. |
| `alarm` | La máquina de Turing no tiene púa para lo que leyó. | Le falta una regla. |
| `wrong-output` | La máquina de Turing terminó, pero con otra salida. | La regla es incorrecta. |

**Dónde está en el código**

| Juez | Archivos | Símbolos |
|---|---|---|
| Exacto | `src/game/judge.js`, `src/core/dfa.js`, `src/core/nfa.js` | `judge`, `normalized`, `withAlphabet`, `areEquivalentDFA`, `nfaToDFA` |
| Lenguaje | `src/game/judge.js`, `src/core/pda.js`, `src/game/oracles.js`, `src/core/order.js` | `judgeLanguage`, `languageCoverage`, `runPDA`, `ORACLES`, `enumerateWords`, `randomWords` |
| Función | `src/game/judge.js`, `src/core/tm.js`, `src/game/functions.js` | `judgeFunction`, `functionCoverage`, `functionFamilies`, `runTM`, `FUNCTIONS`, `functionFor` |

Los textos que ve el jugador se arman en `src/game/thief.js` — `thiefReport` y `formatLine`, con las líneas de cada nivel en `levelN.thief.lines`.

### 7.3 Una aclaración sobre la palabra “alarma”

En los niveles 1-4, “alarma” es el nombre visual de una transición ausente: el mecanismo se detiene y rechaza. En el nivel 5, `alarm` también es un **motivo del veredicto**: la máquina se detuvo porque no había púa para el símbolo leído. Son la misma idea —no hay regla— en dos lugares distintos.

### 7.4 Probar no es juzgar

- **Probar** ejecuta una sola entrada de ejemplo y muestra el camino. Sirve para entender el mecanismo, no para aprobarlo.
- El botón del juez se llama **Ensayo** durante la reparación y **Asalto** durante la construcción; los dos ejecutan el mismo juez.
- Si el juez encuentra un contraejemplo, el ladrón lo usa; el jugador puede corregir y volver a juzgar.
- El juez devuelve **el primer** contraejemplo, no todos. Corregir ese puede revelar otro más adelante.

---

## 8. Cómo se ejecuta cada modelo

| Modelo | Qué recuerda | Cómo avanza | Cuándo acepta |
|---|---|---|---|
| AFD | Un solo estado | Símbolo por símbolo | Al terminar, si está en un estado final |
| AFND-λ | Un conjunto de estados | Clausura épsilon y movimiento de todos los estados | Si algún estado activo es final |
| AP | Estado, posición y pila | Búsqueda en anchura de configuraciones | Si consumió toda la entrada y está en un estado final |
| MT | Sección, cinta y cabezal | Paso a paso, escribiendo y moviendo | Si llega a una sección final |

La diferencia clave:

- El AFD y el AFND **no tienen memoria auxiliar**; solo el estado actual o el conjunto de estados.
- El AP tiene una **pila**: memoria LIFO sin límite teórico.
- La MT tiene una **cinta**: memoria de lectura/escritura en ambas direcciones.

**Dónde está en el código**

| Modelo | Archivo | Símbolos |
|---|---|---|
| AFD | `src/core/dfa.js` | `simulateDFA`, `runDFA`, `completeDFA`, `areEquivalentDFA` |
| AFND-λ | `src/core/nfa.js` | `epsilonClosure`, `moveNFA`, `runNFA`, `nfaToDFA` |
| AP | `src/core/pda.js` | `fireRule`, `runPDA`, `acceptsPDA` |
| MT | `src/core/tm.js` | `runTM`, `pushFrame`, `tapeOutput`, `acceptsTM` |
| Orden y límites | `src/core/order.js`, `src/core/limits.js` | `shortlexCompare`, `enumerateWords`, `randomWords`; `DEFAULT_LIMITS`, `withLimits` |

---

## 9. Resumen por nivel

| Nivel | Modelo | Alfabeto | Regla de reparar | Regla de construir | Pieza nueva | Juez | Primer fallo típico |
|---|---|---|---|---|---|---|---|
| 1 | AFD | `1, 2, 3, 4` | Exactamente `123` | Exactamente `314` | Celda | Exacto | `2` (`intruder`) / `314` (`lockout`) |
| 2 | AFD con bucles | `1, 2` | Cantidad impar de `1` | Termina en `2 · 1` | Engranaje | Exacto | `12` (`lockout`) / `21` (`lockout`) |
| 3 | AFND-λ | `1, 2` | Contiene `122` | Contiene `122` o `211` | Bifurcador y resorte | Exacto | `1122` (`lockout`) / `211` (`lockout`) |
| 4 | AP | `A, B` | Balanceado, sin bajar de más | `A^n B^n`, `n ≥ 1` | Pila | Acotado | `A` (`intruder`) / `AB` (`lockout`) |
| 5 | MT | `0, 1, +` | Suma 1 en binario | Suma dos números binarios | Tambor y cinta | Acotado | `1 → 11` (`wrong-output`) / `0+0` (`alarm`) |

---

## 10. Glosario formal ↔ aplicación

| Término formal | En la aplicación |
|---|---|
| Estado | Celda (niveles 1-4) o sección (nivel 5) |
| Transición | Cable (niveles 1-4) o púa (nivel 5) |
| Estado inicial | Celda o sección de entrada |
| Estado de aceptación | Cerrojo o sección Listo |
| Transición ausente | Alarma: el mecanismo se detiene y rechaza |
| AFD | Celdas con un solo destino por llave |
| AFND | Bifurcador: dos destinos posibles para la misma llave |
| Épsilon | Resorte: movimiento sin consumir llave |
| Autómata de pila | Cables con tope y acción sobre la pila |
| Máquina de Turing | Tambor de secciones y púas, cinta y cabezal |
| Contraejemplo | La llave o entrada que el ladrón usa para abrir |
| Oráculo | La regla de referencia del cliente |
| Cobertura | Cuántas palabras o entradas se probaron y de qué familias |
| Shortlex | Orden por longitud y, a igual longitud, por orden del alfabeto |
