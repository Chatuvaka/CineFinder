# CineFinder 🎬

Página web académica independiente, con el diseño oscuro y amarillo de CineFinder. Utiliza HTML, CSS, JavaScript, Node.js + Express y SQLite. No necesita ChatGPT, React, Cloudflare, MySQL ni una etapa de compilación.

## Inicio rápido (Windows)

1. Instala **Node.js 24 LTS** desde https://nodejs.org/ si no lo tienes. También admite Node.js 22.13 o posterior. Cierra y abre la terminal después de instalarlo.
2. Extrae el ZIP completo. Abre la carpeta **CineFinder** en Visual Studio Code.
3. Abre una terminal dentro de esa carpeta (debes ver `package.json`) y ejecuta:

```powershell
npm install
npm start
```

4. Abre **http://localhost:3000** en tu navegador.
5. Detén el servidor con `Ctrl+C` cuando termines.

Si PowerShell bloquea `npm.ps1`, utiliza `npm.cmd install` y `npm.cmd start`, o selecciona una terminal de tipo **Command Prompt** en VS Code. No hace falta cambiar las políticas de seguridad de Windows.

**No abras `index.html` con doble clic ni con Live Server:** el registro, las sesiones y TMDB necesitan el servidor Express.

## Activar la API externa de TMDB

El ZIP incluye un `.env` vacío, listo para editar. La configuración privada nunca se sirve al navegador.

1. En https://www.themoviedb.org/settings/api obtén el **API Read Access Token** (token de acceso de lectura). Esta implementación usa ese token largo, no la clave corta v3.
2. Abre `.env` en la raíz y completa únicamente esta línea:

```dotenv
TMDB_READ_TOKEN=PEGA_AQUI_TU_TOKEN_DE_LECTURA
```

3. Guarda, detén el servidor y vuelve a ejecutar `npm start`.
4. Abre Explorar y busca una película que no aparezca en las ocho fichas de muestra. Al estar configurado el token desaparecerá el aviso de muestra y el servidor consultará TMDB.

No compartas el token ni lo muestres en las capturas. `.env.example` es la plantilla pública sin claves; `.env` está excluido por `.gitignore`.

**Sin token:** la aplicación funciona con ocho películas de muestra para probar registro y favoritos. **Eso todavía no cumple el requisito de consumir la API externa en funcionamiento.** Debes configurar tu cuenta antes de la entrega. Una clave rechazada o un fallo de TMDB se muestran como error, sin fingir que los datos de muestra son resultados en vivo.

## Pantallas y funciones

| Pantalla | Ruta | Funciones |
|---|---|---|
| Inicio | `/` | Presentación, películas destacadas y navegación |
| Registro | `/registro` | Nombre, correo, contraseña, confirmación, género y consentimiento |
| Inicio de sesión | `/login` | Correo y contraseña propios de CineFinder |
| Catálogo | `/catalogo` | Búsqueda, géneros, orden y paginación |
| Detalle | `/pelicula/693134` | Póster, sinopsis, calificación y duración cuando están disponibles |
| Mi lista | `/mi-lista` | Favoritos privados y persistentes |

El registro inicia la sesión automáticamente. Crea tu propia cuenta; no hay credenciales predeterminadas. El correo se usa como identificador, sin envío de correo de verificación. El proyecto no incluye recuperación de contraseñas. La búsqueda con género filtra la página actual recibida de TMDB; la interfaz lo indica.

## Estructura

- `server.js`: arranque, lectura de `.env` y puerto.
- `src/app.js`: rutas del servidor y middleware de seguridad.
- `src/auth.js`: hash de contraseñas y sesiones.
- `src/database.js`: creación automática de las tablas SQLite.
- `src/validation.js`: validación de registro en el servidor.
- `src/tmdb.js`: peticiones autenticadas a TMDB, caché y errores.
- `src/movies.js`: géneros y catálogo de muestra.
- `public/index.html`: estructura HTML.
- `public/app.js`: pantallas, interacción y validación en navegador.
- `public/styles.css`: diseño adaptable a computadora y celular.
- `data/cinefinder.sqlite`: base de datos, generada al iniciar; no se incluye ni se sube a GitHub.
- `tests/app.test.js`: pruebas automatizadas de registro, sesiones, privacidad, persistencia y adaptación a TMDB.
- `docs/ENTREGA.md`: pasos de GitHub y lista de capturas para el PDF.
- `docs/SEGURIDAD-Y-API.md`: explicación breve para la exposición.

## Seguridad implementada

- Contraseñas derivadas con **scrypt y sal aleatoria**, no guardadas en texto plano.
- Sesiones aleatorias en cookies **HttpOnly y SameSite**, con expiración y revocación al cerrar sesión. En SQLite solo se almacena el hash del token de sesión.
- Validación de campos en navegador y servidor.
- Consultas SQL parametrizadas y favoritos filtrados por el usuario autenticado.
- Comprobación del origen en las escrituras para proteger frente a CSRF.
- Límite de intentos de registro/inicio de sesión por dirección IP.
- Escape de texto antes de insertarlo en el HTML y política de seguridad de contenido.
- `.env`, base de datos, sesiones y `node_modules` excluidos de Git.
- La clave de TMDB solo se utiliza en el servidor.

Está preparada para ejecutarse localmente. Para publicarla en un alojamiento independiente deben configurarse HTTPS, el origen público (`APP_ORIGIN`) y `NODE_ENV=production` para las cookies Secure. No actives `production` mientras uses HTTP local.

## Pruebas

```powershell
npm test
```

Las pruebas crean bases temporales y no cambian tus usuarios. Cubren registros inválidos y duplicados, hash de contraseña, inicio/cierre de sesión, aislamiento entre usuarios, favoritos y persistencia tras reiniciar. La integración con TMDB se prueba con respuestas simuladas; no sustituye comprobar tu token real.

Para desarrollo con reinicio automático:

```powershell
npm run dev
```

## Problemas comunes

- **`node` no se reconoce:** instala Node.js y vuelve a abrir VS Code.
- **`No such built-in module: node:sqlite`:** actualiza Node.js a 24 LTS.
- **Puerto 3000 ocupado:** cambia `PORT=3001` en `.env` y abre http://localhost:3001.
- **TMDB rechazó el token:** utiliza el token de lectura completo, sin escribir `Bearer` antes, y reinicia el servidor.
- **No cargan pósters/fuentes:** requieren conexión a internet. Si falla un póster se muestra su título como alternativa.
- **Quiero datos limpios:** detén el servidor y respalda `data/` antes de borrar su contenido. Borrarlo elimina las cuentas y listas locales.

## Créditos y fuentes

Datos e imágenes de TMDB. El sitio incluye el logotipo aprobado y la atribución correspondiente.

This product uses the TMDB API but is not endorsed or certified by TMDB.

- https://developer.themoviedb.org/docs/faq
- https://developer.themoviedb.org/reference/discover-movie
- https://developer.themoviedb.org/reference/search-movie
- https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html
- https://expressjs.com/
