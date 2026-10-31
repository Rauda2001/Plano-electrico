<?php
require_once __DIR__ . '/../config.php';

// Crea el esquema necesario y devuelve una conexión PDO lista para consultas.
function getDbConnection(): PDO {
    $config = require __DIR__ . '/../config.php';
    $db = $config['db'];
    // El nombre se inserta como identificador SQL; solo se permiten caracteres seguros.
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $db['database'])) {
        throw new RuntimeException('El nombre de la base de datos configurado no es válido.');
    }

    $serverDsn = sprintf(
        'mysql:host=%s;port=%s;charset=%s',
        $db['host'],
        $db['port'],
        $db['charset']
    );

    // Fuerza errores explícitos y consultas preparadas nativas.
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    // La primera conexión no selecciona una base para poder crearla si hace falta.
    $server = new PDO($serverDsn, $db['username'], $db['password'], $options);
    $server->exec(sprintf(
        'CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
        $db['database']
    ));

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        $db['host'],
        $db['port'],
        $db['database'],
        $db['charset']
    );
    $pdo = new PDO($dsn, $db['username'], $db['password'], $options);
    // Mantiene disponible el esquema usado por el editor y la galería.
    $pdo->exec("CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        client_name VARCHAR(255) DEFAULT '',
        address VARCHAR(255) DEFAULT '',
        designer VARCHAR(255) DEFAULT '',
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        project_data JSON DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    return $pdo;
}
