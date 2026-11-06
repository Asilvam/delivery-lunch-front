# Métricas para Sabores Angelicales

El objetivo es decidir cuántas porciones preparar, qué platos destacar y en qué etapa se pierden pedidos. El ticket promedio sale del panel principal: con un precio general común, las unidades vendidas resultan más directas para la operación. El backend conserva ese campo, con el cálculo corregido sobre pedidos entregados, para mantener la compatibilidad con clientes anteriores.

## Panel disponible

| Indicador                     | Definición                                                                                        | Decisión que ayuda a tomar                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Pedidos recibidos             | Todos los pedidos creados dentro del período, sin excluir estados abiertos.                       | Comparar volumen entre días.                                                                    |
| Ventas entregadas             | Suma del total de los pedidos actualmente entregados.                                             | Evaluar el importe vendido; no equivale a pagos cobrados ni a utilidad.                         |
| Menús vendidos                | Suma de las cantidades de ítems en pedidos entregados.                                            | Planificar porciones e insumos.                                                                 |
| Pedidos por atender           | Pedidos pendientes más pedidos en preparación del período.                                        | Detectar trabajo todavía abierto. El panel de pedidos sigue siendo la vista operativa completa. |
| Platos más vendidos           | Cantidad entregada por nombre de plato, agrupada entre menús diarios antes de limitar el ranking. | Elegir platos candidatos a destacar o aumentar producción.                                      |
| Ventas por día                | Importe de pedidos entregados agrupado por el día en que se recibió el pedido.                    | Comparar días bajo el mismo criterio del resumen.                                               |
| Horas de pedidos              | Pedidos recibidos por día de semana y hora de Chile.                                              | Planificar atención y estudiar cuándo publicar el menú.                                         |
| Resultado de pedidos cerrados | Entregados y cancelados, excluyendo pedidos abiertos.                                             | Revisar el cierre de los pedidos. No es conversión de visitantes a clientes.                    |

Todos los períodos se interpretan en America/Santiago, incluidos los cambios de horario. El botón Actualizar consulta nuevamente las cifras; no se muestran datos como si fueran en tiempo real. No hay pagos registrados en el modelo actual, por lo que las ventas entregadas no acreditan cobros.

## Próximas métricas, en orden de utilidad

1. **Pedidos de prueba separados.** Incorporar una marca explícita, administrable y auditable para excluir pruebas de informes comerciales. No borrar históricos ni deducir automáticamente que una compra de madrugada es una prueba. Hasta clasificarlos, el historial de marcha blanca no demuestra demanda comercial.
2. **Conversión del sitio.** Medir sesiones que ven el menú, agregan un plato, comienzan la confirmación, completan Google y envían un pedido que el backend confirma como creado. Deduplicar por sesión y pedido para que un reintento no cuente dos veces. Mostrar la muestra y el período junto con cada porcentaje.
3. **Fricción en Google.** Comparar confirmaciones iniciadas, acceso mostrado, acceso completado y errores técnicos. Un abandono no demuestra por sí solo rechazo a Google: puede deberse a lentitud, falta de stock o un error. Mantener Google obligatorio, según la decisión del negocio.
4. **Origen que genera pedidos entregados.** Usar enlaces identificados con UTM para WhatsApp, Instagram y Perfil de Empresa en Google; conservar la atribución en el pedido con una regla documentada. Los clics por sí solos no permiten medir ventas por canal.
5. **Clientes que vuelven.** Contar identidades con pedidos entregados en días distintos, excluyendo pruebas y cancelados. Mostrar clientes únicos y repetidores de 7 y 30 días, con su tamaño de muestra. Una cuenta no equivale necesariamente a una persona o un hogar.
6. **Motivos de cancelación.** Registrar una razón seleccionable y una nota opcional: solicitud del cliente, falta de disponibilidad, duplicado u otro. Esto permite corregir stock, comunicación o flujo según evidencia.
7. **Tiempo de atención.** Registrar un timestamp de aprobación administrativa. Hoy aceptadoEn se guarda al pasar a preparación y no mide exactamente la aprobación del administrador. Separar recibido→aprobado, aprobado→preparación y preparación→entregado; excluir pruebas antes de interpretar medianas o percentiles.
8. **Margen por plato.** Registrar costos variables de receta, ensalada, pan, postre, envase y comisiones aplicables. Mostrar precio menos costos variables; no llamarlo utilidad neta porque faltan costos fijos.
9. **Producción y desperdicio.** Registrar stock inicial, reposiciones y mermas. El stock disponible actual no basta para reconstruir cuánto se produjo ni una tasa fiable de venta de existencias.

## Acciones comerciales para validar durante la marcha blanca

- Mantener una propuesta central clara: almuerzo completo, precio general visible en el hero y fotografía del plato. Evitar repetir el mismo texto en cada tarjeta.
- Dirigir visitantes nuevos al hero y clientes habituales al menú; medir ambos recorridos antes de decidir si conviene acortarlos. Mantener las excepciones de precio en sus tarjetas.
- Publicar el menú con una fotografía clara, precio y un único enlace. Diferenciar el origen del enlace para saber qué publicación termina en pedidos entregados.
- Preparar la presencia en Google Maps con menú, horarios y dirección completa confirmados por el negocio. Las opciones de enlaces disponibles varían según perfil y región.
- Priorizar imágenes livianas y un botón de Google con estado de carga y recuperación ante errores. Durante la revisión el acceso apareció tras una carga inicial: conviene evitar un espacio vacío que parezca un fallo.
- Validar el proceso de confirmación antes de invertir en publicidad. Medir pedidos entregados y margen por campaña cuando estén disponibles los costos; no optimizar solo visitas, seguidores o pedidos enviados.
- Revisar resultados a diario con pocos cambios a la vez. El volumen de marcha blanca es reducido y mezcla registros sin clasificar; no hay evidencia suficiente para declarar un plato ganador o prometer porcentajes de mejora.

## Referencias para instrumentación y captación

- [Eventos de comercio electrónico de Google Analytics](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce): listas de productos, carrito e inicio de checkout. El envío inicial aquí es una solicitud pendiente de aprobación, por lo que debe distinguirse de una venta cerrada.
- [Enlaces de empresas locales en Google](https://support.google.com/business/answer/6218037?hl=es): enlaces al menú y pedidos según las funciones habilitadas para el perfil.

Estas métricas futuras son propuestas. No se instaló analítica publicitaria, no se envió información de clientes a servicios de marketing y no se publicaron campañas.
