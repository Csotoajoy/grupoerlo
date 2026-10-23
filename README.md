# grupoerlo

Pantallas web de producción y seguimiento de proyectos de **Grupo Erlo S.A.** (Heavendly Digital).
Se publican con GitHub Pages en `https://csotoajoy.github.io/grupoerlo/` y se alimentan de archivos JSON
que Power Automate actualiza desde SharePoint.

## Pantallas

| Página | Para quién | Qué muestra | Datos que lee | Refresco |
|---|---|---|---|---|
| `estacion.html` | Operarios en cada estación | Orden de producción activa de la estación; frases 5S cuando no hay OP | `ps_all.json` | 30 s |
| `recepcion.html` | Pantalla de recepción / TV | Resumen de órdenes de producción en curso | `ps_data.json` | 30 s |
| `supervisor.html` | Supervisor de planta | Vista general de OPs, máquinas e inventario | `ps_all.json` | 30 s |
| `alisto.html` | E-Alisto / despacho | Pedidos por alistar, inventario PT, rutas y carga del camión. Registra el alisto en SharePoint mediante un flujo de Power Automate | `ps_pedidos.json`, `ps_inventario.json`, `ps_data.json`, `ps_rutas.json` | 30 s |
| `plan_trabajo_v2.html` | Planificación | Plan de trabajo por máquina (resina, sacos, OCs) | `ps_all.json`, `ps_pedidos.json` | 60 s |
| `index.html` | Gerencia de proyectos | Panel de Proyectos 2026: Scrum, Gantt y matriz de prioridad | `tareas.json` | Manual |

### Versiones nuevas en prueba

| Página | Reemplazaría a | Qué cambia |
|---|---|---|
| `recepcion-v2.html` | `recepcion.html` | Cielo animado en tiempo real, logo en vector, indicadores de pedidos y entregas vencidas, lista de próximas entregas, aviso cuando los datos de SharePoint están desactualizados. Lee `ps_all.json` y `ps_pedidos.json` |

Se publican junto a la versión actual; la original no se toca hasta aprobar la nueva en la TV.

## Efectos visuales (`fx/`)

| Archivo | Para qué |
|---|---|
| `fx/realce.js` | Complemento para las pantallas existentes: pone el cielo detrás, vuelve semitransparentes los fondos, cambia el logo por el vector y anima los números cuando cambian. No toca el contenido ni la lógica de la página. Está activo en `estacion`, `recepcion`, `supervisor`, `alisto` y `plan_trabajo_v2`. Se apaga con `?realce=0` en la URL |
| `fx/cielo.js` | Fondo de cielo dibujado en tiempo real con WebGL a la resolución nativa de la pantalla (hasta 4K). Sigue la hora de Costa Rica: amanecer, día, atardecer y noche con estrellas y luna. Ajusta su calidad sola si la pantalla no da abasto |
| `fx/motion.js` | Animaciones de datos: números que cuentan, barras que se llenan, destello cuando algo cambia, desplazamiento automático de listas largas |
| `fx/erlo-logo.svg` | Logo de Grupo Erlo en vector, nítido a cualquier tamaño |
| `fx/vendor/gsap.min.js` | Librería de animación GSAP 3.15, incluida en el repo para no depender de un CDN |

Parámetros para probar en la TV sin tocar código (se agregan a la URL):

- `?cielo=amanecer`, `dia`, `atardecer` o `noche` — fija el momento del día (por defecto sigue la hora real)
- `?calidad=alta`, `media` o `baja` — fija la calidad; por defecto se ajusta sola
- `?fps=24` — cuadros por segundo máximos (30 por defecto)
- `?nubes=0.8` — cantidad de nubes de 0 a 1
- `?cielodebug=1` — muestra resolución, nivel de calidad y fps reales
- `?blur=1` — paneles con vidrio esmerilado (más pesado; solo para equipos potentes)
- `?astros=1` — muestra el disco del sol y la luna (en las pantallas existentes van ocultos para no quedar detrás de las tablas)
- `?realce=0` — apaga el cielo y las animaciones en esa pantalla

Ejemplo: `recepcion-v2.html?cielo=atardecer&cielodebug=1`

### Archivos de apoyo / heredados

- `Panel_Prioridades_Proyectos_12.html` — versión anterior de `index.html` que leía las tareas directo desde SharePoint. Se mantiene como respaldo.
- `debug_ops.html` — diagnóstico antiguo; apunta a `ps_ops.json`, que ya no existe.
- `ps_ops_frontend.json`, `ps_pedidos.ejemplo.json` — ejemplos de estructura, no datos reales.

## Archivos de datos

| Archivo | Contenido | Lo actualiza |
|---|---|---|
| `ps_data.json` | Órdenes de producción (`ops`: código, SKU, estación, prioridad, estado, cantidades, resina, molde) | Power Automate |
| `ps_all.json` | Consolidado: órdenes, inventario PT, inventario SKU, insumos y órdenes de compra | Power Automate |
| `ps_inventario.json` | Inventario de producto terminado (`invPT`) | Power Automate |
| `ps_pedidos.json` | Pedidos de clientes (OC, producto, unidades, cajas, estado, fechas, cliente) | Power Automate |
| `ps_rutas.json` | Clientes y rutas de entrega | Carga manual |
| `tareas.json` | Tareas del portafolio de proyectos 2026 | Carga manual |

Las sincronizaciones automáticas aparecen en el historial como commits `Sync <archivo>.json`.

## Configuración

`config.js` es el único archivo que se edita para cambiar URLs de datos, sitio y listas de SharePoint,
catálogo de estaciones y máquinas, prioridades, estados, resinas, capacidad del camión y frases 5S.

Hoy solo `alisto.html` carga `config.js`; las demás páginas tienen sus URLs dentro del propio HTML
(con los mismos valores). Al cambiar una URL de datos, revisar también esas páginas.

## Flujo de datos

```
SharePoint (listas)  →  Power Automate  →  JSON en este repo  →  GitHub Pages  →  pantallas
                                                                         alisto.html  →  Power Automate  →  SharePoint
```

## Cómo publicar cambios

1. Editar el archivo y hacer commit en `main`.
2. GitHub Pages publica en uno o dos minutos.
3. Las pantallas toman los cambios al recargar; los datos se refrescan solos según la tabla de arriba.
