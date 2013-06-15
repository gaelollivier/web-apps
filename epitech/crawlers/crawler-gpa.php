<?php

// A basic crawler that take JSON files with lists of students
// And generated new files with corresponding retrieved GPA's

$headers = array(
	// Insert your session ID cookie here
	'Cookie' => 'PHPSESSID='
);

$headersValue = '';
foreach ($headers as $k => $v) {
	$headersValue .= $k . ':' . $v . "\r\n";
}

$context = stream_context_create(array
(
	'http' => array(
		'method' => 'GET',
		'header' => $headersValue
	)
));

foreach (array(1, 2, 3, 4, 5) as $promo) {
	$usersFile = 'tek'.$promo.'.json';
	$users = json_decode(file_get_contents($usersFile));
	foreach ($users as $i => $user) {
			$gpa = get_gpa($user);
			if ($gpa !== false) {
				$user->gpa = $gpa;
				echo $usersFile . ': ' . ($i+1) . ' / ' . count($users) . "\n";
			} else {
				echo '------- ERROR: ' . $user->login . ' -------' . "\n";
			}
	}
	file_put_contents('tek'.$promo.'-gpa.json', json_encode($users));
}

function get_gpa($user) {
	global $context;
	$url = 'https://intra.epitech.eu/user/'.$user->login;
	$data = file_get_contents($url, false, $context);
	if ($data) {
		$dom = @DOMDocument::loadHTML($data);
		$labels = $dom->getElementsByTagName('label');
		foreach ($labels as $label) {
			if ($label->textContent == 'G.P.A.') {
				// Find span next to label
				$span = $label->nextSibling;
				while ($span && $span->tagName != 'span')
					$span = $span->nextSibling;
				if ($span)
					return (float)str_replace(',', '.', trim($span->textContent));
				break;
			}
		}
	}
	return false;
}