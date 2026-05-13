<?php
    $host = "db.fdgtzilbwjiuetrheoly.supabase.co";
    $port = 5432;
    $database = "postgres";
    $user = "postgres";
    $password = "vonhox-nubmu1-pupNor";
    try {
    $pdo = new PDO(
        "pgsql:host=$host;port=$port;dbname=$database",
        $user,
        $password
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connected successfully";

    } catch (PDOException $e) {
        die("Connection failed: " . $e->getMessage());
    }
?>