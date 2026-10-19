# Entrega: GitHub y PDF

## 1. Antes de subir el código

- Instala dependencias, inicia el proyecto y crea una cuenta de prueba.
- Configura tu token real de TMDB en `.env`.
- Comprueba búsqueda, detalle, registro, inicio de sesión y favoritos.
- Ejecuta `npm test`.

## 2. GitHub

Crea en GitHub un repositorio llamado `CineFinder`, inicialmente vacío, sin añadir README ni .gitignore desde GitHub. Instala Git si no lo tienes. Abre la terminal en la carpeta del proyecto:

```sh
git init
git add .
git status
```

Antes de continuar, comprueba que **no aparecen `.env`, `node_modules/` ni archivos de `data/` excepto `.gitkeep`**. Deben aparecer `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, `README.md`, `src/`, `public/`, `tests/` y `docs/`.

```sh
git check-ignore .env
git commit -m "Proyecto CineFinder con autenticacion y API de TMDB"
git branch -M main
```

El primer comando debe responder `.env`. Agrega el remoto que GitHub te muestra; reemplaza `TU_USUARIO`:

```sh
git remote add origin https://github.com/TU_USUARIO/CineFinder.git
git push -u origin main
```

Si Git solicita nombre y correo, configúralos con tus datos antes de repetir el commit. GitHub puede pedirte autenticarte mediante el navegador. No coloques tokens de GitHub en los archivos del proyecto.

**Comparte el enlace del repositorio.** Si es privado, asegúrate de dar acceso al profesor. Subir el repositorio no publica automáticamente el servidor Express como página web; el profesor puede ejecutarlo con las instrucciones del README. GitHub Pages por sí solo no ejecuta este backend.

No arrastres toda la carpeta al formulario de subida web de GitHub: ese formulario no aplica `.gitignore` como `git add`, y podrías subir `.env` por accidente.

## 3. PDF con capturas de la página funcionando

Toma capturas reales de la aplicación en tu navegador después de configurar TMDB. Usa datos de prueba en el registro y oculta contraseñas/tokens. Puedes usar `Windows + Shift + S`.

Orden sugerido:

1. **Portada:** CineFinder, nombre, materia, docente, grupo y fecha.
2. **Inicio:** presentación y menú.
3. **Validación:** registro con correo inválido o contraseñas que no coinciden, mostrando el mensaje.
4. **Registro exitoso:** mensaje de bienvenida al crear la cuenta de prueba.
5. **Inicio de sesión:** formulario y, en otra captura, sesión iniciada; no muestres la contraseña.
6. **Catálogo real:** una búsqueda con TMDB configurado y sin aviso de muestra.
7. **Detalle:** sinopsis y calificación de una película.
8. **Mi lista:** película guardada; recarga para comprobar que se conserva.
9. **Enlace del repositorio:** agrega la URL completa y una frase sobre cómo ejecutar el proyecto.

Coloca cada captura en Word o Google Docs, con una explicación de una o dos líneas. Exporta como PDF. El PDF no está incluido en este ZIP: todavía falta tu token real y las capturas finales de tu ejecución. No uses imágenes de muestra como prueba de una conexión real con TMDB.

## Lista final

- [ ] Repositorio accesible para el profesor.
- [ ] README con instalación.
- [ ] `.env` y base de datos fuera de Git.
- [ ] TMDB real probado.
- [ ] PDF con capturas legibles.
- [ ] Enlace de GitHub enviado junto al PDF.
