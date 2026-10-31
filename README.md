# Plano Eléctrico Pro

Aplicación web pública, sin autenticación, para crear proyectos eléctricos residenciales con editor SVG, almacenamiento en MySQL y exportación a PDF con Dompdf.

## Requisitos
- XAMPP con Apache y MySQL
- PHP 8+
- Composer

## Instalación
1. Copia esta carpeta a `htdocs` de XAMPP.
2. Ejecuta `composer install` dentro de la carpeta del proyecto.
3. Inicia MySQL en XAMPP. Para crear la base de datos desde phpMyAdmin, selecciona **Importar**, elige el archivo `plano_electrico.sql` de esta carpeta y pulsa **Importar**. El script crea la base `plano_electrico` y la tabla `projects`.
4. Abre `http://localhost/Plano%20electrico/project-manager.php` para entrar a la galería pública o `http://localhost/Plano%20electrico/index.php` para empezar un proyecto.

## Características
- Acceso libre sin inicio de sesión.
- Dashboard moderno para gestionar proyectos públicos.
- Editor SVG profesional con panel lateral, capas y propiedades.
- Colocación y movimiento de elementos, con ancho y largo editables en metros (100 unidades del plano equivalen a 1 m).
- Guardado en MySQL.
- Guarda un proyecto con el botón «Guardar» y continúa editándolo después desde «Proyectos» → «Abrir».
- Vista previa y exportación a PDF.

## Documentación
Consulta [DOCUMENTACION.md](DOCUMENTACION.md) para conocer la arquitectura, los bloques principales del código, el modelo de datos, los endpoints y el flujo de uso.

## Nota
Este proyecto está pensado para ser desplegado en un servidor web público sin autenticación, manteniendo un flujo simple y accesible para todos los usuarios.
