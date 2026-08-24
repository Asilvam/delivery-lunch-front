# Delivery Lunch Front

Frontend web de **Sabores Angelicales** para gestionar el flujo completo de pedidos de almuerzo: compra del cliente, validación administrativa, preparación en cocina y estadísticas.

Construido con React, TypeScript y Vite. Consume la API de `delivery-lunch-back`; no utiliza datos mock como respaldo.

## Funcionalidades

### Cliente

- Consulta el menú diario desde el backend.
- Selecciona platos, acompañamientos y opciones disponibles.
- Administra cantidades respetando el stock compartido de cada plato.
- Confirma y envía el pedido a la API.
- Recibe mensajes visuales de éxito, error y límites de stock.

### Administración

- Autenticación mediante JWT con rol `admin`.
- Recepción de pedidos nuevos en tiempo real mediante SSE.
- Aprobación, cancelación y actualización del estado de pedidos.
- Dashboard con indicadores, ingresos, platos más vendidos, horas punta y cancelaciones.

### Cocina

- Acceso con rol `kitchen` o `admin`.
- Carga inicial de pedidos aprobados.
- Recepción de pedidos y cambios de estado en tiempo real mediante SSE.
- Gestión de pedidos pendientes, en preparación y finalizados.

## Stack

- React 19
- TypeScript 5
- Vite 8
- React Router 7
- Material UI 7
- Axios
- Microsoft Fetch Event Source
- Recharts
- SweetAlert2
- Day.js

## Requisitos

- Node.js 22, según `.nvmrc`
- npm
- Una instancia disponible de `delivery-lunch-back`

## Configuración local

```bash
# Usar la versión de Node del proyecto, si tienes nvm
nvm use

# Instalar dependencias
npm install

# Crear la configuración local
cp .env.example .env
```

Variables disponibles:

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Sí | URL base del backend, sin slash final. Ejemplo: `http://localhost:3500`. |

Las variables `VITE_*` se incorporan durante la compilación. Después de modificarlas es necesario reiniciar el servidor de desarrollo o generar un build nuevo.

## Ejecución

```bash
# Servidor de desarrollo
npm run dev

# Compilación de producción
npm run build

# Vista previa del build
npm run preview

# Análisis estático
npm run lint
```

Vite muestra en la terminal la URL local, normalmente `http://localhost:5173`.

## Rutas de la aplicación

| Ruta | Acceso | Descripción |
| --- | --- | --- |
| `/` | Público | Menú diario, carrito y creación del pedido. |
| `/login` | Público | Inicio de sesión para administración y cocina. |
| `/admin` | `admin` | Validación y gestión de pedidos. |
| `/dashboard` | `admin` | Estadísticas del negocio. |
| `/cocina` | `admin`, `kitchen` | Gestión de preparación y entrega. |

Las rutas privadas esperan un JWT emitido por el backend. El token debe incluir el claim `role` con valor `admin` o `kitchen`.

## Integración con la API

El frontend utiliza estos endpoints de `VITE_API_BASE_URL`:

| Área | Endpoints |
| --- | --- |
| Autenticación | `POST /auth/login` |
| Menú | `GET /menu/today` |
| Cliente | `POST /orders` |
| Administración | `GET /orders`, `PATCH /orders/:id/admin-validate`, `PATCH /orders/:id/cancel`, `PATCH /orders/:id/status` |
| Cocina | `GET /orders/ByAdminTrue`, `PATCH /orders/:id/status` |
| Tiempo real | `GET /orders/stream/admin`, `GET /orders/stream/kitchen` |
| Estadísticas | `GET /statistics/summary`, `/top-dishes`, `/peak-hours`, `/revenue`, `/cancellations` |

Las conexiones SSE también envían el JWT en el encabezado `Authorization`.

## Deploy en Cloudflare Pages

El frontend se publica como sitio **completamente estático** en Cloudflare Pages. No utiliza Pages Functions, Workers ni Containers y no necesita ejecutar un servidor Node.js en producción.

La API permanece desplegada en Heroku. La variable `VITE_API_BASE_URL` debe contener la URL pública de esa aplicación.

### Integración con Git

1. En Cloudflare, abre **Workers & Pages** y crea una aplicación de Pages.
2. Conecta el repositorio `delivery-lunch-front`.
3. Configura el build:

   | Opción | Valor |
   | --- | --- |
   | Framework preset | `Vite` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Node.js | `22` |

4. Agrega `VITE_API_BASE_URL` como variable de producción con la URL pública del backend en Heroku.
5. Guarda la configuración y despliega. Cada push a la rama de producción generará un nuevo build.

El sitio quedará disponible en un dominio `*.pages.dev` y puede asociarse posteriormente a un dominio personalizado.

> No habilitar Pages Functions, Workers, Containers ni planes pagados de Cloudflare sin autorización explícita del propietario.

Documentación oficial: [Cloudflare Pages para proyectos Vite](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/) y [precios de Pages](https://developers.cloudflare.com/pages/functions/pricing/).

## Estructura principal

```text
src/
├── api/                 # Fachadas públicas de acceso a datos
├── components/          # Componentes de cliente, administración, cocina y dashboard
├── context/             # Estado de autenticación
├── data/
│   ├── mappers/         # Conversión de respuestas del backend
│   └── services/        # Clientes HTTP por dominio
├── domain/cart/         # Reglas y utilidades del carrito
├── hooks/               # Streams SSE de administración y cocina
├── pages/               # Páginas asociadas a las rutas
├── router/              # Protección de rutas por rol
├── shared/              # Logging y utilidades compartidas
├── theme/               # Tema de Material UI
├── types/               # Tipos de menú, carrito y pedidos
├── App.tsx              # Definición de rutas
└── main.tsx             # Punto de entrada
```

## Pruebas

Actualmente el proyecto no tiene una suite de pruebas automatizadas configurada. Las verificaciones disponibles son:

```bash
npm run build
npm run lint
```
