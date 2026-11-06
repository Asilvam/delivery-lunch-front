# Sabores Angelicales — identidad visual

La marca combina frambuesa, rosa suave y fondos claros. Las fotos de comida aportan
calidez; los controles priorizan lectura, espacio y claridad de las acciones.
Los tokens se definen en `src/theme/brandColors.ts` y se aplican desde `appTheme.ts`.

| Token | Color | Uso |
| --- | --- | --- |
| Frambuesa | #D81B60 | Acción principal, marca y sección activa |
| Frambuesa oscuro | #9C0F45 | Hover, enlaces y foco visible |
| Rosa | #F06292 | Acentos decorativos, nunca texto pequeño sobre blanco |
| Rosa suave | #FCE4EC | Iconos y superficies de apoyo |
| Fondo | #FDF2F8 | Fondo general |
| Superficie | #FFFFFF | Formularios y tarjetas |
| Tinta | #1A0A2E | Títulos y texto principal |
| Texto secundario | #6B5B73 | Ayudas, descripciones y pie de página |
| Borde | #EEDCE5 | Separación entre superficies |
| Éxito | #237A45 | Pedido recibido o entregado |
| Aviso | #9A5B00 | Pendientes, stock bajo y envíos inciertos |
| Error | #B42338 | Validación y errores recuperables |
| Información | #215A88 | Sesión vencida y mensajes informativos |

## Contraste calculado

- Frambuesa con blanco: 4.95:1.
- Tinta sobre blanco: 18.64:1.
- Texto secundario sobre blanco: 6.23:1.
- Frambuesa oscuro sobre el fondo rosa: 7.49:1.

## Reglas del sistema

- Una acción principal visible por etapa. Cancelar o cerrar sesión tiene menor peso.
- El color de estado siempre se acompaña de texto; no depender solo del color.
- Controles principales de al menos 44 px de alto, labels visibles y foco de teclado.
- El login del equipo mantiene usuario/contraseña y detecta el rol sin un selector extra.
- En escritorio, la fotografía refuerza la marca; en móvil se prioriza el formulario.
- Los errores conservan los datos escritos. El botón indica carga y evita envíos repetidos.
- Los datos de cliente, credenciales y tokens nunca se registran en consola.

## Próximas ideas

1. Carrito móvil con acceso persistente a cantidad de platos y total.
2. Cocina con vistas «Por preparar», «En preparación» y «Entregados».
3. Comprobante con número de pedido, estado y siguiente paso explicado.
4. Reutilizar componentes React para títulos, estados vacíos, alertas y botones de acción.
5. Mantener estados y permisos en NestJS; React representa la respuesta de la API
   mediante etiquetas, colores y acciones permitidas.

## Estructura común de páginas

`PageLayout` comparte `BrandHeader`, ancho de contenido, fondo y `BrandFooter`
entre menú, login, administración, cocina y métricas. El footer está en flujo normal:
sigue inmediatamente al contenido con 20–24 px de separación, sin `position: fixed`,
`margin-top: auto` ni contenedores que se estiran para empujarlo fuera de vista.
Los acompañamientos se explican una sola vez sobre la grilla; las tarjetas muestran
plato, guarnición, precio y acción. Solo el hipocalórico agrega el selector de proteína.
