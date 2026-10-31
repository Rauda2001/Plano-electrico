<?php
// Ajustes de conexión a MySQL y valores generales de la aplicación.
return [
    // Credenciales y parámetros del servidor MySQL.
    'db' => [
        'host' => '127.0.0.1',
        'port' => '3306',
        'database' => 'plano_electrico',
        'username' => 'root',
        'password' => '',
        'charset' => 'utf8mb4'
    ],
    // Datos generales disponibles para la aplicación.
    'app' => [
        'name' => 'Plano Eléctrico',
        'timezone' => 'America/Mexico_City'
    ]
];
