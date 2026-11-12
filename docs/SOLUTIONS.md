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

## Nivel 5 — El banco central (tambor y cinta)

En este nivel cada púa se escribe como `sección · símbolo · escribe · mueve · siguiente`: lo que hay que escribir en la cinta, hacia dónde mover el cabezal (`←` izquierda, `→` derecha) y a qué sección ir. Una púa vacía deja la alarma encendida. El símbolo vacío se muestra como `vacío`.

### Reparación: el contador suma 1 al número de la cinta

En `Llevar`, la púa para `1` escribe `1`: con la cinta `1` el contador marca `11` en vez de `10`.

Cambiar:

- `Llevar · 1 · 1 · ← · Llevar` por `Llevar · 1 · 0 · ← · Llevar` (se escribe `0`, se sigue moviendo a la izquierda, se sigue en `Llevar`).

### Construcción: el contador suma los dos números separados por `+`

Tabla de referencia completa (`Listo` no lleva púas: es el cerrojo):

```text
Buscar el final · 0 · 0 · → · Buscar el final
Buscar el final · 1 · 1 · → · Buscar el final
Buscar el final · + · + · → · Buscar el final
Buscar el final · vacío · vacío · ← · Restar
Restar · 0 · 1 · ← · Restar
Restar · 1 · 0 · ← · Volver al signo
Restar · + · vacío · → · Limpiar
Volver al signo · 0 · 0 · ← · Volver al signo
Volver al signo · 1 · 1 · ← · Volver al signo
Volver al signo · + · + · ← · Llevar
Llevar · 1 · 0 · ← · Llevar
Llevar · 0 · 1 · → · Buscar el final
Llevar · vacío · 1 · → · Buscar el final
Limpiar · 0 · vacío · → · Limpiar
Limpiar · 1 · vacío · → · Limpiar
Limpiar · vacío · vacío · → · Listo
```

Con la cinta `101+11` el contador deja `1000`; con `1+1` deja `10`.
