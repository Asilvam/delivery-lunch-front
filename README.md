# React + TypeScript + Vite

## Local setup

Use Node.js **24.22.2 LTS**, pinned in `.nvmrc` and the Docker build.

```bash
nvm install
nvm use
npm install
npm run dev
```

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Backend real para menus

La app usa este flujo:

- Si existe `VITE_API_BASE_URL`, intenta consultar backend real.
- Si falla el backend o no existe esa variable, cae automaticamente al mock local.

Variables disponibles:

- `VITE_API_BASE_URL`: URL base del backend.
- `VITE_MENUS_PATH`: path del endpoint de menus (default: `/menus`).

Ejemplo rapido:

```bash
cp .env.example .env
npm run dev
```



## Deploy en Heroku

El frontend se despliega en una aplicación distinta de la API usando `heroku/nodejs`.
`heroku-postbuild` genera `dist`; el `Procfile` ejecuta `npm start` para servirlo
con `serve`, fallback de SPA y el puerto asignado por Heroku.

1. Instala Heroku CLI e inicia sesión con `heroku login`.
2. Desde este repositorio crea la aplicación (reemplaza el nombre de ejemplo):

   ```bash
   heroku create tu-app-frontend --buildpack heroku/nodejs
   ```

3. En **Settings → Config Vars**, define `VITE_API_BASE_URL` con la URL HTTPS
   real del backend (obtenida con `heroku info` en el repositorio de la API).
   Las variables `VITE_*` son públicas: no colocar contraseñas ni secretos.
   No configures `PORT`; Heroku lo asigna automáticamente.
4. Guarda los cambios en Git, incluyendo `package-lock.json`, y despliega:

   ```bash
   git push heroku main
   heroku ps:scale web=1
   heroku open
   ```

Vite incorpora la URL de la API al compilar. Si cambia `VITE_API_BASE_URL`,
vuelve a ejecutar un despliegue con build; reiniciar el dyno no actualiza el bundle.
Para probar el servidor localmente: `npm run build` y `npm start` (puerto 8080).
El `Dockerfile` es opcional y usa el mismo servidor de producción.

Referencia: [builds de Node.js en Heroku](https://devcenter.heroku.com/articles/nodejs-classic-buildpack-builds).

## Navegación y checkout local

El personal usa `/login`, `/admin`, `/cocina` y `/dashboard`, con navegación compartida
según su rol. Para clientes, el menú es público; enviar un pedido requiere Google.
Configura `VITE_GOOGLE_CLIENT_ID` con el mismo client ID del backend y autoriza
`http://localhost:5173` en Google Cloud. No colocar el client secret en variables VITE.
El carrito y los datos del formulario se conservan durante esta sesión del navegador.
Un envío incierto se reintenta con la misma key; mientras tanto, el pedido queda
bloqueado para evitar que un cambio accidental produzca un segundo pedido.
El checkout tiene dos pasos: revisar cantidades y confirmar. En la confirmación,
Google aparece primero; al iniciar sesión se muestran nombre editable y teléfono.
Acepta móviles chilenos sin prefijo y los normaliza a `+56`; otros países requieren
su prefijo internacional. Los errores se muestran junto al campo correspondiente.
El botón de envío incluye el total y las acciones permanecen visibles mientras el
contenido se desplaza en móvil. Durante el envío se bloquean cierre y nuevos envíos.

El comprobante muestra número de pedido, resumen, total y estado recibido de la API.
Se muestra al confirmar el envío y se descarta al cerrarlo, sin añadir accesos
al encabezado. Es un comprobante del envío, sin seguimiento automático de cambios posteriores. Los
pedidos nuevos quedan pendientes de aprobación del local; un reintento recuperado
muestra el estado devuelto por el servidor.

## Producción en Cloudflare Pages

Proyecto: `delivery-front`, conectado a `Asilvam/delivery-lunch-front`, rama `main`.
Comando de compilación: `npm run build`. Directorio publicado: `dist`.
La versión de Node se toma de `.nvmrc` (`v24.22.2`).

Variables de compilación públicas:

- `VITE_API_BASE_URL=https://delivery-back-e687ceeb9c0d.herokuapp.com`
- `VITE_GOOGLE_CLIENT_ID`: el client ID público del backend.

Dominio del frontend: `sabores.serviciosasm.cl`. En Google Cloud hay que autorizar
`https://sabores.serviciosasm.cl` como origen JavaScript del cliente OAuth.
Los secretos de MongoDB, JWT, Cloudinary y CallMeBot pertenecen únicamente a Heroku.


## Exportación de cocina a Excel

En **Cocina → Completados → Exportar a Excel** se descarga `Report-day-DDMMAA.xlsx`.
Reemplaza la exportación CSV y usa los mismos pedidos entregados o cancelados
actualizados hoy en Chile que se muestran en esa sección, para admin y cocina.
No agrega una exportación al panel de pedidos pendientes ni hace consultas extra.

Incluye **Pedidos** (una fila por pedido) y **Detalle** (una fila por plato), con
cliente, estado, creación, aceptación, entrega/cancelación, cantidades, selecciones
y precios reales. Los importes son numéricos en CLP y los teléfonos se conservan
como texto. Los totales usan `SUBTOTAL` y los horarios, `America/Santiago`.
El generador se carga al pulsar el botón, bloquea descargas repetidas durante la
preparación y permite reintentar si falla.

El aviso de exportación confirma únicamente que se solicitó la descarga al navegador.
No confirma que el archivo se guardó: si se cancela el diálogo de descarga, se
puede pulsar Exportar a Excel nuevamente.


## Mensajes y confirmaciones

`src/utils/notifications.ts` centraliza SweetAlert2 con los colores de la marca.
Los avisos transitorios aparecen arriba a la derecha con opción de cerrar:
hasta 3 segundos para clientes, 2 segundos para personal y 1 segundo para
acciones completadas como aprobar un pedido. Las confirmaciones y los errores
que requieren revisión usan un diálogo con respuesta explícita.

Los avisos de exportación indican solicitud de descarga, sin confirmar el guardado.
Las validaciones permanecen junto al campo correspondiente. Los estados duraderos
(comprobante, envío pendiente, configuración ausente o datos no disponibles)
permanecen dentro de la pantalla para que sigan accesibles.

El comprobante del cliente se muestra directamente en SweetAlert2 al recibir la
respuesta del pedido, con estado, número, selección y total. No agrega botones
al encabezado. El comprobante y las
confirmaciones que requieren una decisión no expiran automáticamente.
