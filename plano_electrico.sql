-- Esquema base para instalación manual desde phpMyAdmin o el cliente MySQL.
CREATE DATABASE IF NOT EXISTS `plano_electrico`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `plano_electrico`;

-- Una fila por proyecto; project_data contiene el dibujo serializado en JSON.
CREATE TABLE IF NOT EXISTS `projects` (
  -- Identificador que se usa para abrir y actualizar el proyecto.
  `id` INT NOT NULL AUTO_INCREMENT,
  -- Datos descriptivos que se muestran en la galería y en el PDF.
  `name` VARCHAR(255) NOT NULL,
  `client_name` VARCHAR(255) DEFAULT '',
  `address` VARCHAR(255) DEFAULT '',
  `designer` VARCHAR(255) DEFAULT '',
  -- Estado del proyecto y fechas de creación/última modificación.
  `status` VARCHAR(50) DEFAULT 'draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Contenido completo del plano: objetos, capas y metadatos complementarios.
  `project_data` JSON DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
