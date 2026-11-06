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

1. Elegir la **fecha** en Menús del día. Si ya hay un menú publicado, se muestra su publicación y el editor de precios. Para preparar otro día se cambia la fecha.
2. Si la fecha está libre, aparece el editor. El precio general inicia en **$5.500**, con ensalada surtida, pan fresco del día y postre del día editables.
3. Buscar y seleccionar platos. En cada selección ingresar las porciones. Dejar **Precio especial** vacío para heredar el general, o escribir un valor distinto.
4. En el hipocalórico elegir cuáles de sus proteínas estarán disponibles ese día. El stock es del plato completo, compartido entre sus opciones.
5. **Guardar borrador** conserva el trabajo, incluso si faltan cantidades o proteínas. No aparece en el sitio público y no acepta pedidos.
6. **Previsualizar** muestra fotos, nombres, precios e ingredientes generales. **Publicar menú** exige al menos un plato activo con fotografía y cantidad positiva, y proteínas válidas para el hipocalórico.

Solo existe un menú por fecha. Un menú publicado para una fecha futura aparecerá en el inicio cuando llegue ese día, porque el sitio consulta el menú de la fecha actual.

## Reutilizar una selección

Desde un menú nuevo o borrador, **Usar selección de otro menú** recupera platos y acompañamientos. Las porciones quedan vacías y los precios especiales se restablecen al precio general actual. Las proteínas recuperadas se pueden revisar antes de publicar.

Si un plato antiguo no tiene correspondencia en la biblioteca, se informa explícitamente. El administrador debe incorporarlo o descartar esa referencia antes de guardar.

## Historial y publicación

Cada publicación guarda una copia del nombre, descripción, imagen, opciones, precio y stock inicial, junto con la referencia al plato de biblioteca. Editar una ficha no modifica automáticamente publicaciones anteriores. Los pedidos mantienen los datos y precios con los que fueron registrados.

La composición de un menú publicado queda cerrada. Sigue disponible el editor de precio general y excepciones. La creación y publicación del menú completo usa una transacción; los borradores se protegen frente a ediciones simultáneas mediante su versión de actualización.

## Implementación y verificación

- Backend: `dish_library`, importación inicial idempotente, CRUD de administrador, validación Cloudinary y composición transaccional.
- Público: los borradores se excluyen del listado y de las consultas por fecha; checkout los rechaza.
- Fotografías: nuevas publicaciones usan las URLs de Cloudinary de la biblioteca y sus derivados para reducir la carga en móvil.
- La copia del endpoint anterior también crea un borrador con identificadores nuevos y stock cero.
- Las pruebas utilizan MongoDB temporal y WhatsApp simulado; no escriben en producción.

Las fotos subidas antes están registradas en `biblioteca-platos.json`. La lista inicial incluida en el backend es una copia de esos datos públicos, sin rutas locales ni credenciales.
