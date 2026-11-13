# Biblioteca y menús del día

En **Administrador → Menús** hay dos pestañas: **Menús del día** y **Biblioteca de platos**.

## Carga y mantenimiento de la biblioteca

1. Abrir Biblioteca de platos y pulsar **Cargar los 23 platos preparados**. Esta acción importa nombres, categorías, notas y fotografías ya alojadas en Cloudinary.
2. Puede repetirse: solo agrega claves que faltan y conserva los cambios de las fichas existentes. No hay carga automática al iniciar el servidor o desplegar.
3. **Nuevo plato** permite cargar nombre completo, descripción, categoría y una fotografía PNG, JPG o WebP de hasta 10 MB. La foto se sube a Cloudinary antes de guardar la ficha.
4. Solo el hipocalórico puede tener opciones de proteína. Se ingresan separadas por comas en su ficha.
5. Desactivar un plato lo archiva para nuevas selecciones. Los menús y pedidos previos conservan sus datos.

Las notas internas permiten revisar detalles de las fotos, como la preparación del zapallo italiano o el relleno de la lasaña. No se muestran al cliente.

## Crear un menú

1. Pulsar **Crear nuevo menú** y elegir la fecha (se sugiere la próxima disponible desde hoy). **Continuar** abre el editor; no guarda ni publica todavía. Si ya existe un menú, se ofrece abrirlo sin sobrescribirlo. La fecha de la barra permite consultar otros días. Solo se pueden crear o publicar menús para hoy o una fecha futura; los históricos permanecen disponibles para consulta.
2. Si la fecha está libre, aparece el editor. El precio general inicia en **$5.500**, con ensalada surtida, pan fresco del día y postre del día editables.
3. Buscar y seleccionar platos. Cada selección propone 20 porciones, o 10 para el hipocalórico; las cantidades se pueden editar. Dejar **Precio especial** vacío para heredar el general, o escribir un valor distinto.
4. En el hipocalórico elegir cuáles de sus proteínas estarán disponibles ese día. El stock es del plato completo, compartido entre sus opciones.
5. **Guardar borrador** conserva el trabajo, incluso si faltan cantidades o proteínas. No aparece en el sitio público y no acepta pedidos.
6. **Previsualizar** muestra fotos, nombres, precios e ingredientes generales. **Publicar menú** exige al menos un plato activo con fotografía y cantidad positiva, y proteínas válidas para el hipocalórico.

Solo existe un menú por fecha. Un menú publicado para una fecha futura aparecerá en el inicio cuando llegue ese día, porque el sitio consulta el menú de la fecha actual.

## Reutilizar una selección

Desde un menú nuevo o borrador, **Usar selección de otro menú** recupera platos y acompañamientos. Las porciones se proponen en 20 por plato, o 10 para el hipocalórico, y los precios especiales se restablecen al precio general actual. Las proteínas recuperadas se pueden revisar antes de publicar.

Si un plato antiguo no tiene correspondencia en la biblioteca, se informa explícitamente. El administrador debe incorporarlo o descartar esa referencia antes de guardar.

## Historial y publicación

Cada publicación guarda una copia del nombre, descripción, imagen, opciones, precio y stock inicial, junto con la referencia al plato de biblioteca. Editar una ficha no modifica automáticamente publicaciones anteriores. Los pedidos mantienen los datos y precios con los que fueron registrados.

Los menús publicados permiten agregar platos desde la biblioteca, retirar platos, elegir proteínas del hipocalórico y cambiar el precio general o los precios especiales. Nombre, descripción y fotografía se editan exclusivamente en la biblioteca. Cada cambio del menú se guarda explícitamente con **Guardar cambios**.

**Stock disponible** representa las porciones que se pueden pedir ahora; admite cero para marcar agotado. Guardar otros datos conserva el stock que hayan descontado los nuevos pedidos. Si se modifica una cantidad y el stock cambió desde que se cargó el editor, se pide recargar antes de guardar. Los cambios administrativos del menú también se protegen por su versión de actualización.

Un plato solo puede retirarse si no tiene ningún pedido registrado, sin importar el estado (incluso cancelado). Si ya tiene pedidos, se ofrece **Marcar agotado**, que pone el stock en cero al guardar y conserva el plato visible. El backend comprueba la restricción al guardar. Los platos retirados sin pedidos conservan su registro e identificador para poder reincorporarlos. La publicación y su edición completa son transaccionales.

## Horario para pedidos

Los clientes pueden elegir platos y enviar pedidos todos los días de **08:00 a 16:00, hora de Chile continental (America/Santiago)**. A las 16:00 se bloquean la selección, el aumento de cantidades y el envío de nuevos pedidos, incluso sin recargar la página. La hora del dispositivo no cambia la zona horaria usada por la regla.

El backend valida el mismo horario y exige que la fecha del pedido y del menú correspondan a hoy, con el menú publicado. Lo comprueba antes de reservar stock y antes de guardar. Un menú pasado o futuro no acepta pedidos nuevos, aunque se conserve en una pestaña o carrito anterior. Se permite recuperar el resultado de un envío que ya se había guardado con la misma clave de idempotencia; esto no crea un pedido nuevo. Administración, biblioteca y atención de comandas siguen disponibles fuera del horario de compra.

## Vigencia del carrito

El backend entrega `venceEn`, la hora absoluta de cierre del menú (16:00 en America/Santiago), ajustada al horario de verano o invierno. El carrito guarda esa vigencia junto con el identificador y la fecha del menú en la sesión de la pestaña.

Al vencer, los platos siguen visibles, pero no se pueden aumentar cantidades ni confirmar un pedido nuevo. **Empezar un nuevo pedido** descarta ese carrito explícitamente y consulta el menú de hoy. Los platos anteriores nunca se trasladan por nombre o fotografía a otra publicación. Al cambiar el día, se vuelve a consultar el menú vigente; regresar a una pestaña comprueba de inmediato su vigencia.

Los carritos del formato anterior solo se vinculan si todos sus identificadores de plato pertenecen al mismo menú consultado. Si falta información para verificarlo, se conserva el contenido y se bloquea la confirmación. Los envíos pendientes de respuesta mantienen su clave y contenido original para recuperar el resultado sin duplicarlo, incluso después del cierre.

## Implementación y verificación

- Backend: `dish_library`, importación inicial idempotente, CRUD de administrador, validación Cloudinary y composición transaccional.
- Público: los borradores se excluyen del listado y de las consultas por fecha; checkout los rechaza.
- Fotografías: nuevas publicaciones usan las URLs de Cloudinary de la biblioteca y sus derivados para reducir la carga en móvil.
- La copia del endpoint anterior también crea un borrador con identificadores nuevos y stock cero.
- Las pruebas utilizan MongoDB temporal y WhatsApp simulado; no escriben en producción.

Las fotos subidas antes están registradas en `biblioteca-platos.json`. La lista inicial incluida en el backend es una copia de esos datos públicos, sin rutas locales ni credenciales.
