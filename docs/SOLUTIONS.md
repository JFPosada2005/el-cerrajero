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

## Niveles 3-5

Pendientes de implementación. Este documento se completa cuando cada nivel esté jugable.

- **Nivel 3:** AFND con épsilon (bifurcador + resorte).
- **Nivel 4:** AP con pila (giros balanceados / `A^n B^n`).
- **Nivel 5:** MT (incremento y suma binaria).
