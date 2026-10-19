# Cómo explicar CineFinder

## Recorrido de una búsqueda

El usuario escribe un título. El navegador envía una petición GET a `/api/movies?q=...`. Express consulta TMDB desde `src/tmdb.js`, agregando el token que leyó de `.env` al encabezado Authorization. TMDB devuelve JSON y el servidor selecciona los campos que se muestran. El navegador dibuja las tarjetas de películas.

El navegador nunca recibe el token de TMDB. Que `.env` no esté en GitHub no basta por sí solo: también es importante que el secreto se use exclusivamente en el servidor.

## Registro y acceso

El navegador valida los campos para informar rápido al usuario. El servidor vuelve a validarlos porque una petición puede enviarse sin utilizar el formulario. Se exige nombre de 2 a 60 caracteres, correo válido, contraseña de 8 a 128 caracteres, confirmación coincidente, género permitido y consentimiento.

La contraseña se deriva con scrypt usando una sal aleatoria por cuenta. Al iniciar sesión se deriva la contraseña ingresada con la misma sal y se compara el resultado. No se necesita ni se guarda la contraseña original.

La sesión utiliza un token aleatorio en una cookie HttpOnly, que JavaScript no puede leer. En SQLite se guarda únicamente su hash y fecha de vencimiento. Cerrar sesión elimina esa sesión del servidor.

## Datos privados

Cada favorito tiene el identificador del usuario. El servidor obtiene ese identificador desde la sesión; no acepta un usuario elegido por el cliente. Todas las consultas de favoritos filtran por el usuario autenticado.

## Servicios del proyecto

| Método y ruta | Función |
|---|---|
| GET `/api/config` | Géneros y modo muestra/en vivo |
| POST `/api/auth/register` | Crear una cuenta |
| POST `/api/auth/login` | Iniciar sesión |
| POST `/api/auth/logout` | Cerrar sesión |
| GET `/api/auth/me` | Consultar la sesión actual |
| GET `/api/movies` | Consultar películas y buscar |
| GET `/api/movies/:id` | Detalle de una película |
| GET `/api/favorites` | Lista personal |
| POST `/api/favorites` | Agregar o quitar un favorito |

Estas rutas intercambian JSON mediante HTTP y forman una API de estilo REST. TMDB es la API externa de terceros. SQLite es la base de datos local, no una API externa.

## Límites de la demostración

Sin token, las películas pertenecen a un conjunto de muestra identificado. Las pruebas automáticas verifican la lógica sin consumir la cuenta real de TMDB; la demostración final debe usar el token del estudiante. No se incluyen pagos, reproducción de películas, correo de verificación ni recuperación de contraseñas, porque no son necesarios para el alcance de esta actividad.
