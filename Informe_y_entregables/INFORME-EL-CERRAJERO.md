# INFORME-EL-CERRAJERO — fuente editable del artículo IEEE

> Fuente del artículo final del proyecto *El Cerrajero* (curso Lenguajes de Programación).
> El `.docx` se genera a partir de este contenido sobre la plantilla
> `Informe_y_entregables/conference-template-letter.docx`.
> Placeholders pendientes al final del archivo.

---

# El Cerrajero: un videojuego serio para construir y verificar lenguajes formales y autómatas

**Autores:** Juan Felipe Posada Daza — código 160004831 — jfposada@unillanos.edu.co; Cristian Mateo Torres Villamil — código 160004840 — cmtorres@unillanos.edu.co.
**Filiación:** Programa de Ingeniería de Sistemas, Universidad de los Llanos, Villavicencio, Colombia.
**Docente:** Diana Marcela Cardona Román.

## Resumen

El Cerrajero es un videojuego serio de rompecabezas sobre lenguajes formales y autómatas, desarrollado en JavaScript sin dependencias para el curso de Lenguajes de Programación. El jugador encarna a un cerrajero que repara mecanismos de seguridad que son, formalmente, un autómata finito determinista, un autómata finito no determinista, un autómata de pila y una máquina de Turing. El juego incluye cinco niveles con dos rompecabezas cada uno, cuatro motores formales verificados, un juez exacto de equivalencia para los tres primeros niveles y jueces acotados y honestos para los dos últimos, además de una interfaz diegética e inmersiva donde cada acción es un objeto del taller. La verificación alcanza 506 pruebas en 35 archivos, todas en verde, y cinco niveles jugables de principio a fin.

## Palabras clave

Juegos serios; lenguajes formales; autómatas finitos; autómata de pila; máquina de Turing; verificación de equivalencia; desarrollo dirigido por pruebas.

## I. Introducción

En el curso de Lenguajes de Programación, la teoría de autómatas suele enseñarse con lápiz y papel: el estudiante escribe tablas de transición o diagramas y comprueba a mano si una palabra es aceptada. Ese procedimiento es tedioso y propenso a errores, porque verificar a mano cada palabra resulta impracticable y los errores de diseño pasan inadvertidos hasta la calificación.

La literatura sobre juegos serios sostiene este problema: una revisión sistemática de la evidencia empírica encontró que jugar videojuegos está vinculado con la adquisición de conocimiento, la comprensión de contenidos y resultados afectivos y motivacionales, con la adquisición de conocimiento como el resultado más frecuente [1]. En la misma línea, las herramientas interactivas de visualización para lenguajes formales, como JFLAP, permiten a los estudiantes experimentar con los conceptos y recibir retroalimentación inmediata al aplicarlos [2]. Sin embargo, esas herramientas son laboratorios de experimentación, no juegos: no ofrecen progresión, narrativa ni un veredicto integrado a una partida.

Frente a esta brecha se formuló la siguiente pregunta de investigación: ¿cómo lograr que los estudiantes de un curso de Lenguajes de Programación construyan y verifiquen modelos formales —autómatas finitos deterministas y no deterministas, autómatas de pila y máquinas de Turing— de forma interactiva, con retroalimentación inmediata y exacta, y sin exponer la notación académica? El objetivo general del proyecto fue diseñar, implementar y verificar un videojuego serio en el que cada mecanismo de seguridad es un modelo formal, cada intento recibe un contraejemplo concreto y la interfaz nunca muestra vocabulario académico. Los objetivos específicos fueron: (1) implementar cuatro motores formales puros con simulación y traza; (2) implementar un juez exacto de equivalencia para los modelos decidibles y jueces acotados y honestos para los indecidibles; (3) construir cinco niveles jugables con dos rompecabezas cada uno; y (4) verificar el sistema con una suite de pruebas automatizadas y con verificación en navegador real.

## II. Marco teórico

### A. Alfabeto, cadena y lenguaje

Un alfabeto es un conjunto finito no vacío de símbolos y una cadena es una secuencia finita de símbolos de un alfabeto; un lenguaje es un conjunto de cadenas sobre un alfabeto [3]. En El Cerrajero, el alfabeto de cada nivel son sus llaves —carretes de cable numerados del 1 al 4 en el primer nivel, llaves 1 y 2 en el segundo y el tercero, fichas de subida y bajada en el cuarto, y símbolos binarios en el quinto—, cada cadena es una llave o una cinta de prueba, y cada regla del cliente define un lenguaje que el mecanismo del jugador debe reconocer o una función que debe computar.

### B. Autómata finito determinista

Un autómata finito determinista (AFD) es una quina ordenada de estados finitos, alfabeto, función de transición, estado inicial y estados de aceptación; es determinista porque para cada estado y cada símbolo existe como máximo un destino, y acepta una cadena si al consumirla por completo termina en un estado de aceptación [3]. Los niveles 1 y 2 del juego son AFD: el primero reconoce lenguajes finitos de una sola palabra y el segundo lenguajes infinitos regulares mediante bucles, lo que demuestra que los estados finitos no impiden reconocer lenguajes infinitos [3].

### C. Autómata finito no determinista y épsilon

Un autómata finito no determinista (AFND) permite varios destinos para el mismo par estado-símbolo, y con transiciones épsilon permite moverse sin consumir entrada; la aceptación es existencial, pues basta con que algún camino termine en aceptación [3]. Todo AFND equivale a un AFD mediante la construcción de subconjuntos, de modo que el no determinismo no agrega poder expresivo, solo comodidad de notación [3]. El nivel 3 del juego es un AFND con épsilon: el bifurcador abre dos caminos con la misma llave y el resorte es la transición épsilon.

### D. Autómata de pila

Un autómata de pila (AP) agrega una pila sin límite teórico como memoria auxiliar y reconoce los lenguajes independientes del contexto, como el lenguaje de paréntesis balanceados o el lenguaje de potencias iguales, que ningún autómata finito puede reconocer [3]. La equivalencia entre autómatas de pila es indecidible, por lo que no existe un algoritmo general que decida si dos de ellos aceptan el mismo lenguaje [4]. El nivel 4 del juego es un AP: la pila de fichas es la memoria, y el juez no promete equivalencia sino evidencia acotada, como se explica en la Sección IV.

### E. Máquina de Turing y computación

Una máquina de Turing (MT) dispone de una cinta infinita en ambas direcciones y un cabezal que lee y escribe; acepta al llegar a un estado final y computa funciones al dejar un resultado escrito en la cinta [3]. Propiedades no triviales de lo que computa una máquina de Turing son indecidibles, y el problema de la detención también lo es [4]. El nivel 5 del juego es una MT determinista: el tambor de púas es la función de transición, cada púa es una regla y cada púa vacía es una detención sin regla. Por estos resultados, el juez del quinto nivel compara salidas sobre un conjunto finito de entradas y declara evidencia, no prueba.

### F. Simulación y equivalencia

Simular un modelo es ejecutarlo sobre una entrada y observar si acepta; decidir equivalencia es determinar si dos modelos aceptan el mismo lenguaje. Para autómatas finitos, la equivalencia es decidible mediante el producto de ambas máquinas y la búsqueda en anchura, que además produce el contraejemplo más corto [3]. El juez exacto del juego implementa exactamente ese procedimiento y ordena los contraejemplos en orden shortlex, es decir, por longitud y luego lexicográficamente según el orden del alfabeto del nivel.

## III. Metodología de desarrollo de software

### A. Proceso por rebanadas verticales

El desarrollo siguió un proceso incremental organizado por rebanadas verticales de riesgo, en lugar de un proceso en cascada con fases rígidas, porque el equipo era de dos personas, el dominio era nuevo y el riesgo mayor estaba en la jugabilidad de cada nivel y no en la infraestructura. Esta decisión sigue la práctica recomendada de adaptar el proceso al contexto y de entregar incrementos funcionales tempranos en lugar de congelar requisitos irreales [5]. La secuencia real, verificable en el historial del repositorio, fue: (1) motor AFD con validación, simulación, minimización y equivalencia; (2) primer nivel jugable con taller, juez y ladrón; (3) niveles 2 a 5, cada uno con su motor, sus datos, su juez y su interfaz; (4) auditoría del mockup visual y plan de remasterización; (5) remasterización visual por unidades con superficies disjuntas, contratos de escena y verificación en navegador real; y (6) fase diegética e inmersiva, que eliminó la barra de acciones y el panel de objetivo para convertir cada control en un objeto del taller, con contratos de escena y de ranuras y verificación por capturas.

### B. Desarrollo dirigido por pruebas

Cada motor y cada regla se desarrolló con desarrollo dirigido por pruebas: primero la prueba que fija el comportamiento esperado, después la implementación mínima y finalmente la refactorización con la suite en verde, siguiendo el ciclo rojo-verde-refactorización [6]. Las pruebas se ejecutan con el corredor nativo de Node, sin dependencias externas, y hoy alcanzan 506 pruebas en 35 archivos, todas en verde. La suite es además la red de seguridad del congelamiento de la lógica: durante la remasterización visual, ningún cambio de presentación podía alterar la lógica sin que una prueba lo delatara.

### C. Contratos, revisión y verificación en navegador

La lógica del juego se congeló por contrato y la remasterización solo pudo tocar la capa visual, con autorizaciones explícitas del propietario para reescribir la presentación de las vistas y para pasar los pasos de la corrida a la interfaz, sin modificar motores, jueces ni datos. El trabajo se coordinó con documentos de traspaso entre unidades y contratos de escena, de ranuras y de visuales: cada escena expone ranuras para el mecanismo, los carretes y el estado, y cada prop accionable declara su acción sin contener lógica. La verificación se realizó en navegador real sin intervención manual, con captura de evidencia a 1440 y 390 píxeles de ancho, lo que confirmó la ausencia de desplazamiento de página en escritorio y de desplazamiento horizontal en móvil.

### D. Herramientas y trazabilidad

El sistema se implementó en JavaScript con módulos ECMAScript y gráficos vectoriales, sin marcos de trabajo ni dependencias de ejecución. El control de versiones con Git registra la línea de tiempo completa, desde el motor AFD inicial hasta la integración de los recursos gráficos finales, y cada prueba automatizada fija un comportamiento verificable del código. Los recursos se declaran en un manifiesto versionado con su licencia y su estado, y los créditos con atribución exigible se documentan aparte.

## IV. Resultados

### A. El juego: cinco niveles, diez rompecabezas

Cada nivel es un contrato con un cliente que expresa la regla en palabras llanas, y cada nivel tiene dos rompecabezas: reparar, que funciona como tutorial de la pieza nueva, y construir, que es el desafío. La Tabla I resume los cinco niveles. El contrato muestra la situación y la regla, y la pista explica cómo interactuar: el primer nivel enseña lo básico y cada nivel siguiente explica solo lo nuevo. El flujo de cada rompecabezas es probar una llave de ejemplo con su recorrido resaltado, someter el mecanismo al ensayo durante la reparación o al asalto durante la construcción, y recibir el veredicto del ladrón: si el mecanismo es correcto, el ladrón se rinde; si no, muestra la llave concreta que rompió el mecanismo y su recorrido se repite en pantalla. No existe derrota permanente: un asalto fallido devuelve al taller con el veredicto visible.

TABLA I. Niveles del juego: modelo, regla y pieza nueva.

| Nivel y escenario | Modelo | Reparar: regla | Construir: regla | Pieza nueva |
|---|---|---|---|---|
| 1. Banco del Llano | AFD | Exactamente 123 | Exactamente 314 | La celda como memoria |
| 2. Hotel Mirador | AFD con bucles | Cantidad impar de unos | Termina en 2 y 1 | El engranaje (bucle) |
| 3. Museo del Llano | AFND con épsilon | Contiene 122 | Contiene 122 o 211 | Bifurcador y resorte |
| 4. Teatro Municipal | AP | Giros balanceados | Potencias iguales de A y B | La pila de fichas |
| 5. Banco Central | MT | Suma 1 en binario | Suma de dos binarios | Tambor, cinta y cabezal |

### B. Arquitectura del software

El sistema se organiza en tres capas con dependencias en un solo sentido. La capa de motores contiene los cuatro motores formales puros, sin acceso al documento ni al almacenamiento. La capa de juego contiene los datos de los cinco niveles, la validación del esquema, el adaptador de plano a máquina, los jueces, los oráculos, las funciones de referencia y el ladrón, sin acceso al documento. La capa de interfaz contiene solo renderizado con SVG y DOM, sin decidir corrección ni equivalencia. Un módulo de orquestación compone las pantallas, despacha eventos y persiste el progreso. Cada edición del jugador devuelve un plano nuevo con un efecto declarado, y la interfaz solo adopta el plano si el efecto no está bloqueado. Cada escena diegética expone ranuras para el mecanismo, los carretes y la línea de estado; el fondo cubre la pantalla completa, el encabezado flota sobre la escena y el tablero escala automáticamente al área ocupada por las celdas del nivel.

### C. Motores y jueces

Los cuatro motores comparten el mismo contrato: validar, crear una copia normalizada, ejecutar con resultado y traza, y responder si aceptan. El motor AFD incluye completado con sumidero, minimización por refinamiento de particiones y equivalencia por producto con contraejemplo mínimo. El motor AFND incluye clausura épsilon con tolerancia a ciclos y construcción de subconjuntos sin crear el subconjunto vacío. El motor de pila explora configuraciones en anchura con límites de 20 000 configuraciones y 64 símbolos de pila, y conserva el camino aceptador o el que más entrada leyó. El motor de Turing usa una cinta dispersa infinita en ambas direcciones, ventana de siete casillas para la traza y tope de 5 000 pasos por corrida.

El juez despacha según el objetivo: equivalencia exacta para los niveles 1 a 3, lenguaje acotado para el nivel 4 y función acotada para el nivel 5. El juez exacto normaliza ambas máquinas al orden de llaves del nivel, aplica el producto con búsqueda en anchura y clasifica el primer desacuerdo como intruso o bloqueo. El juez de lenguaje prueba las 2 047 palabras de longitud hasta 10, las familias estructuradas hasta n igual a 16 y 200 palabras aleatorias con semilla fija, y trata el agotamiento de límites como atasco solo si el objetivo acepta. El juez de función prueba 68 entradas de incremento y 261 de suma, incluidas cadenas de acarreo, y compara salidas por valor numérico. La Tabla II resume los tres jueces.

TABLA II. Los tres jueces del juego.

| Aspecto | Juez exacto (niveles 1 a 3) | Juez de lenguaje (nivel 4) | Juez de función (nivel 5) |
|---|---|---|---|
| Qué compara | Dos máquinas | Máquina contra oráculo | Máquina contra función |
| Garantía | Equivalencia total | Evidencia acotada | Evidencia acotada |
| Motivos | Intruso, bloqueo | Intruso, bloqueo, atasco | Atasco, alarma, salida errónea |
| Cobertura | No aplica | 2 000 palabras o más | 256 pares o más |

El video demostrativo del sistema se encuentra en el siguiente hipervínculo: [Enlace al video — PENDIENTE](https://example.com/video-pendiente).

### D. Sistema de diseño y accesibilidad

El sistema de diseño sigue una dirección de precisión sobria con latón, nogal y papel, tipografías propias autoalojadas con sus licencias, objetivos táctiles de 44 píxeles, contraste de nivel AA según las Pautas de Accesibilidad al Contenido Web en su versión 2.2 [7], respuesta entre 320 y 1 440 píxeles de ancho, respeto a la preferencia de movimiento reducido y lectura por lector de pantalla mediante regiones vivas. La escena es diegética e inmersiva: no hay panel de objetivo ni barra de acciones; cada acción es un objeto del taller —el contrato, la pista y la bitácora son papeles que se abren, la campana pide el ensayo, la tijera corta y los carretes se tocan sobre la mesa—, y la bitácora final del quinto nivel es una boleta de depósito. El audio responde a cada evento con catorce efectos con licencias documentadas. La interfaz nunca muestra vocabulario académico: la validación del esquema de niveles rechaza términos formales en el texto visible.

### E. Métricas y calidad

La verificación automatizada alcanza 506 pruebas en 35 archivos, todas en verde, ejecutadas con el corredor nativo sin dependencias. Los cinco niveles son jugables de principio a fin con diez rompecabezas, cuatro motores y tres jueces. Los recursos finales ocupan aproximadamente 1,8 MB en 63 archivos y cubren 59 de 65 espacios del manifiesto, con fondos en formato WebP de 2048 por 1152, iconos vectoriales, papeles abiertos en los modales, la boleta del quinto nivel y catorce efectos de sonido con licencias documentadas. Estas medidas corresponden a las características de adecuación funcional, usabilidad y eficiencia del modelo de calidad de producto, que define nueve características para especificar y evaluar la calidad del software [8].

## V. Discusión

La decisión central del proyecto fue distinguir entre lo decidible y lo indecidible y ser honesto con el jugador en ambos casos: donde la equivalencia es decidible, el juez ofrece una prueba completa con el contraejemplo más corto; donde es indecidible, el juez ofrece evidencia acotada con cobertura informada y nunca promete una prueba. Esta honestidad es también pedagógica, porque muestra los límites reales de la computación en lugar de ocultarlos. Como amenaza a la validez, el proyecto aún no incluye un estudio con estudiantes en el aula, de modo que la mejora del aprendizaje está respaldada por la literatura [1] y no por medición propia; queda como trabajo futuro. Tampoco se implementaron la música por nivel ni los retratos del ladrón, que permanecen como espacios pendientes del manifiesto sin bloquear la jugabilidad.

## VI. Conclusiones

Se logró un videojuego serio completo y verificado: cinco niveles jugables, cuatro motores formales, un juez exacto y dos jueces acotados, con 506 pruebas en verde y verificación en navegador real. Se aprendió que cada concepto formal admite una traducción mecánica directa —el bucle es seguir escuchando, el bifurcador es el no determinismo, el resorte es la transición épsilon, la pila es la memoria y el tambor es la función de transición— y que un contrato de congelamiento con pruebas como red de seguridad permite remasterizar sin romper la lógica. Las limitaciones son la ausencia de evaluación con estudiantes y de recursos secundarios pendientes. El trabajo futuro incluye el estudio en el aula, la música por nivel, los retratos del ladrón y el minimapa para pantallas pequeñas.

## Referencias

[1] T. M. Connolly, E. A. Boyle, E. MacArthur, T. Hainey y J. M. Boyle, «A systematic literature review of empirical evidence on computer games and serious games», Comput. Educ., vol. 59, n.º 2, pp. 661–686, sep. 2012. DOI: 10.1016/j.compedu.2012.03.004. [En línea]. Disponible: https://doi.org/10.1016/j.compedu.2012.03.004
[2] S. H. Rodger y T. W. Finley, JFLAP: An Interactive Formal Languages and Automata Package. Sudbury, MA, EE. UU.: Jones & Bartlett, 2006. ISBN 978-0-7637-3834-1. [En línea]. Disponible: https://www.jflap.org/jflapbook/
[3] J. E. Hopcroft, R. Motwani y J. D. Ullman, Introduction to Automata Theory, Languages, and Computation, 3.ª ed. Boston, MA, EE. UU.: Addison-Wesley, 2006. ISBN 978-0-321-45536-9. [En línea]. Disponible: https://www.pearson.com/en-us/subject-catalog/p/introduction-to-automata-theory-languages-and-computation/P200000003517/9780321455369
[4] M. Sipser, Introduction to the Theory of Computation, 3.ª ed. Boston, MA, EE. UU.: Cengage Learning, 2012. ISBN 978-1-133-18779-0. [En línea]. Disponible: https://math.mit.edu/~sipser/book.html
[5] I. Sommerville, Software Engineering, 10.ª ed. Boston, MA, EE. UU.: Pearson, 2015. ISBN 978-0-13-394303-0. [En línea]. Disponible: https://www.pearson.com/en-us/subject-catalog/p/software-engineering/P200000003258/9780133943030
[6] K. Beck, Test-Driven Development: By Example. Boston, MA, EE. UU.: Addison-Wesley, 2002. ISBN 978-0-321-14653-3. [En línea]. Disponible: https://www.informit.com/store/test-driven-development-by-example-9780321146533
[7] W3C, «Web Content Accessibility Guidelines (WCAG) 2.2», Recomendación del W3C, oct. 2023. [En línea]. Disponible: https://www.w3.org/TR/WCAG22/
[8] ISO/IEC 25010:2023, Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Product quality model, ISO, Ginebra, Suiza, nov. 2023. [En línea]. Disponible: https://www.iso.org/standard/78176.html

---

## Lista de placeholders pendientes

1. **Video demostrativo:** hipervínculo con texto `[Enlace al video — PENDIENTE]` y URL `https://example.com/video-pendiente`. En el `.docx` debe ser un hyperlink real, no texto plano. Es el único pendiente.

## Datos confirmados (ya aplicados en el artículo)

- **Autores:** `Juan Felipe Posada Daza` (código `160004831`, `jfposada@unillanos.edu.co`) y `Cristian Mateo Torres Villamil` (código `160004840`, `cmtorres@unillanos.edu.co`).
- **Institución:** Programa de `Ingeniería de Sistemas`, `Universidad de los Llanos`, Villavicencio, Colombia.
- **Docente:** `Diana Marcela Cardona Román`.

## Checklist de cobertura de la rúbrica

Criterio «Informe: contenido y rigor» (detalles relevantes, información precisa, lenguaje técnico del área, componentes esenciales):

- Detalle y precisión con cifras verificadas en el repo: Secciones IV-C y IV-E (506/506, 35 archivos, 2 047 palabras, 256 pares, 59/65 espacios, ≈1,8 MB en 63 archivos, 14 SFX).
- Lenguaje técnico del área: Sección II (alfabeto, cadena, lenguaje, AFD, AFND, AP, MT, aceptación, simulación, equivalencias, indecidibilidad).
- Componentes esenciales: título, autores, resumen, palabras clave, introducción, marco teórico, metodología, resultados, discusión, conclusiones y referencias.

Criterio «Estructura y organización» (secciones Título, Autores, Resumen ejecutivo, Introducción, Marco teórico o referencial, Metodología, Resultados, Discusión, Conclusiones, Referencias bibliográficas, siguiendo la norma):

- Título y Autores: cabecera del artículo.
- Resumen ejecutivo: sección Resumen.
- Introducción: Sección I (problema, referencia [1], pregunta de investigación, objetivo general y específicos).
- Marco teórico o referencial: Sección II (conceptos del curso con citas [3] y [4]).
- Metodología: Sección III (fases reales incluida la fase diegética e inmersiva, TDD, contratos de escena y de ranuras, revisión, herramientas, justificación con [5] y [6]).
- Resultados: Sección IV (niveles, arquitectura, motores y jueces, diseño y accesibilidad con [7], métricas y calidad con [8], hipervínculo al video).
- Discusión: Sección V (juez exacto frente a acotado, honestidad, amenazas a la validez).
- Conclusiones: Sección VI (logros, aprendizaje, limitaciones, trabajo futuro).
- Referencias bibliográficas: 8 referencias numeradas en orden de aparición, todas citadas en el cuerpo.
- Norma: plantilla IEEE de conferencia (estilos, columnas, orden, pies).

Criterio «Estilo de escritura y presentación» (claridad, gramática, citas y referencias actualizadas y contextualizadas con la norma solicitada, presentación visual profesional):

- Español académico neutro, registro formal, sin regionalismos.
- 8 citas reales verificadas por web (Hopcroft–Motwani–Ullman, Sipser, Sommerville, Beck, Connolly et al., Rodger–Finley, ISO/IEC 25010:2023, WCAG 2.2), con DOI o URL verificables.
- Presentación sobre la plantilla IEEE: estilos propios, dos columnas, tablas con epígrafe, referencias numeradas.

Criterios de sustentación (claridad, comunicación y dominio del tema): fuera del alcance de este entregable escrito; el contenido del artículo (Secciones II, IV y V) sirve como guion de dominio del tema.
