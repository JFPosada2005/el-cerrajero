# El Cerrajero — Soluciones

> **Spoilers.** Este documento es para probar el juego y para la presentación. No mostrarlo durante una partida.

Cada nivel tiene dos fases: **reparación** y **construcción**. Las soluciones se escriben como cables:

```text
origen —llave→ destino
```

En la UI: elegí la llave en la paleta, tocá la celda de origen y después la de destino. Para cortar un cable, activá la **tijera** y tocá el cable.

## Nivel 1 — La caja de seguridad (AFD)

### Reparación: abre con `1-2-3`

Cortar:

- `Entrada —2→ Cerrojo`
- `Celda 1 —1→ Cerrojo`

Conectar:

- `Celda 1 —2→ Celda 2`

Resultado:

```text
Entrada —1→ Celda 1 —2→ Celda 2 —3→ Cerrojo
```

### Construcción: abre con `3-1-4`

- `Entrada —3→ Celda 1`
- `Celda 1 —1→ Celda 2`
- `Celda 2 —4→ Cerrojo`

## Nivel 2 — El ascensor (AFD con bucle)

### Reparación: abre si la llave `1` se usó una cantidad impar de veces

- Conectar `Abierta —2→ Abierta` (auto-lazo; el engranaje ya está desbloqueado).

Resultado:

```text
Cerrada —1→ Abierta
Abierta —1→ Cerrada
Cerrada —2→ Cerrada
Abierta —2→ Abierta
```

### Construcción: abre si la secuencia termina en `2-1`

- `Espera —1→ Espera`
- `Espera —2→ Atenta`
- `Atenta —1→ Cerrojo`
- `Atenta —2→ Atenta`
- `Cerrojo —1→ Espera`
- `Cerrojo —2→ Atenta`

## Nivel 3 — El museo (AFND con épsilon)

### Reparación: abre si la secuencia contiene `1-2-2`

- Conectar `Espera —1→ Espera` (auto-lazo; con el `Espera —1→ Día 1` que ya está puesto crea el bifurcador).

Resultado:

```text
Entrada —resorte→ Espera
Espera —1→ Espera
Espera —1→ Día 1
Espera —2→ Espera
Día 1 —2→ Día 2
Día 2 —2→ Cerrojo
```

### Construcción: abre si la secuencia contiene `1-2-2` o `2-1-1`

Sin romper la rama de día, agregar:

- `Entrada —resorte→ Noche`
- `Noche —1→ Noche`
- `Noche —2→ Noche`
- `Noche —2→ Noche 1`
- `Noche 1 —1→ Noche 2`
- `Noche 2 —1→ Cerrojo`

## Nivel 4 — El teatro (AP con pila)

En este nivel cada cable y cada resorte lleva su condición de pila: **si arriba hay** (da igual / base / ficha) y **acción** (no tocar / cargar / soltar). La etiqueta del cable la muestra, por ejemplo `A · base · +ficha`.

### Reparación: giros balanceados, nunca vacío

Cortar:

- `Trabajo —resorte→ Cerrojo` (el resorte quedó con “da igual” y deja pasar `A`)

Conectar (con **si arriba hay: base** y **acción: no tocar** elegidos en la paleta):

- `Trabajo —resorte→ Cerrojo` (base, no tocar)

Resultado:

```text
Entrada —A→ Trabajo (da igual, cargar)
Trabajo —A→ Trabajo (da igual, cargar)
Trabajo —B→ Trabajo (ficha, soltar)
Trabajo —resorte→ Cerrojo (base, no tocar)
```

### Construcción: abre solo con `A^n B^n`, n ≥ 1

- `Entrada —A→ Cargando` (da igual, cargar)
- `Cargando —A→ Cargando` (da igual, cargar)
- `Cargando —B→ Soltando` (ficha, soltar)
- `Soltando —B→ Soltando` (ficha, soltar)
- `Soltando —resorte→ Cerrojo` (base, no tocar)

## Nivel 5

Pendiente de implementación. Este documento se completa cuando el nivel esté jugable.

- **Nivel 5:** MT (incremento y suma binaria).
