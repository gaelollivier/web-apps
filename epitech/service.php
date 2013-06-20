<?php

define('DATA_PATH', '../../epitech-service-data/');

session_start();

if (isset($_GET['action'])) {
	$data = (object)array('action' => $_GET['action']);
} else {
	// Read JSON data from request body (angular send data this way)
	$data = json_decode(file_get_contents('php://input'));
}

if (isset($data->action)) {
	
	$actionName = $data->action.'Action';
	if (function_exists($actionName)) {
		$actionName($data);
	}
	
}

// No action executed, error!
echo sendResponse(null, false);


// Actions

function authAction($data) {
	if (authenticate($data->login, $data->password)) {
		$_SESSION['auth'] = true;
		$_SESSION['login'] = $data->login;
		sendResponse(array('auth'=>'success', 'login'=>$_SESSION['login']));
	} else {
		session_destroy();
		sendResponse(array('auth'=>'fail'));
	}
}

function logOutAction() {
	$_SESSION['auth'] = false;
	sendResponse(null);
}

function isAuthenticatedAction($data) {
	sendResponse(array(
		'auth'  => $_SESSION['auth'] === true ? 'success' : 'fail',
		'login' => isset($_SESSION['login']) ? $_SESSION['login'] : ''
	));
}

function citiesAction($data) {
	if (!isset($_SESSION['auth']) || !$_SESSION['auth']) {
		sendResponse(array('auth'=>'fail'));
	}
	// Get list of students
	$file = DATA_PATH.((int)$data->promo).'.json';
	if (is_file($file)) {
		$students = json_decode(file_get_contents($file));
		// And extract corresponding cities
		$cities = array();
		foreach ($students as $student) {
			$city = explode('/', $student->location);
			$city = $city[1];
			$cities[] = $city;			
		}
		sort($cities);
		// Keep only values (remove holes between keys)
		$cities = array_values(array_unique($cities));
		sendResponse(array('cities'=>$cities));
	}	
}

function studentsAction($data) {
	if (!isset($_SESSION['auth']) || !$_SESSION['auth']) {
		sendResponse(array('auth'=>'fail'));
	}
	
	// Get list of students
	$file = DATA_PATH.((int)$data->promo).'.json';
	if (is_file($file)) {
		$students = json_decode(file_get_contents($file));
		// And keep only the selected city
		foreach ($students as $i => $student) {
			$city = explode('/', $student->location);
			$city = $city[1];
			if ($city != $data->city) {
				unset($students[$i]);
			}
		}
		// Clean the array by keeping only values
		$students = array_values($students);
		sendResponse(array('students'=>$students));
	}
}

function studentsGPAAction($data) {
	if (!isset($_SESSION['auth']) || !$_SESSION['auth']) {
		sendResponse(array('auth'=>'fail'));
	}
	// Retrieve the data in the corresponding JSON file
	$file = DATA_PATH.((int)$data->promo).'-gpa.json';
	if (is_file($file)) {
		sendResponse(array('students'=>json_decode(file_get_contents($file))));
	}
	sendResponse(null, false);
}

// Core functions

function sendResponse($response, $success=true) {
	header('Content-Type: application/json');
	if (!$response) {
		$response = new stdClass();
	} else if (is_array($response)) {
		$response = (object)$response;
	}	
	if (!isset($response->status))
		$response->status = $success ? 'success' : 'error';
	echo json_encode($response);
	die;
}

function authenticate($login, $password) {
	$post = http_build_query(array(
		'login'=> $login,
		'password'=> $password
	));

	$url = 'https://intra.epitech.eu/';
	$ch = curl_init($url);

	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
 
	$response = curl_exec($ch);
	$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	curl_close($ch);
	return $httpStatus == 302;
}