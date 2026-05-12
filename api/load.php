<?php
 /*****************************************************
 * Kapitel 12: Website2DB > Schritt 2: Website -> DB
 * load.php
 * Daten als JSON-String vom Formular sender.html (später vom MC) serverseitig empfangen und Daten in die Datenbank einfügen
 * Datenbank-Verbindung
**************************/
// echo ("Empfange Daten...<br>");

require_once("../system/config.php");
// echo "This script receives HTTP POST messages and pushes their content into the database.";



###################################### Empfangen der JSON-Daten

$inputJSON = file_get_contents('php://input'); // JSON-Daten aus dem Body der Anfrage
$input = json_decode($inputJSON, true); 


###################################### receiving a post request from a HTML form, later from ESP

$wert = $input["wert"];         // Hol den Wert an der Stelle "wert" aus dem JS-Objekt (ehemals JSON-String)
# insert new user into db
// $sql = "INSERT INTO sensordata (wert) VALUES (?)";
$sql = "INSERT INTO `nuggi_sessions`(`tresor_id`, `start_time`, `end_time`, `duration_minutes`, `date`, `status`) VALUES ('2','2026-05-12 10:30:00','2026-05-12 12:00:00','90','2026-05-12','finished')";
$stmt = $pdo->prepare($sql);
$stmt->execute();
// $stmt->execute([$wert]);

?>







