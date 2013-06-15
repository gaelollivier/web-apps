<?php

// A basic crawler that fetches 'trombi' pages form the EPITECH intranet
// And save lists of students in JSON files

$headers = array(
	// Insert your 'auth' cookie here
	'Cookie' => 'auth='
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

$promos = array(1, 2, 3, 4, 5);

foreach ($promos as $promo) {
	$students = array();
	$total = false;
	while ($total === false || count($students) < $total) {
		$offset = count($students);
		$url = 'https://intra.epitech.eu/user/filter/user?format=json&location=FR/BDX|FR/LIL|FR/LYN|FR/MAR|FR/MPL|FR/NCY|FR/NAN|FR/NCE|FR/PAR|FR/REN|FR/STG|FR/TLS&year=2010|2011|2012&active=true&course=bachelor/classic|bachelor/tek1ed|bachelor/tek2ed|bachelor/tek3s|bachelor/tek3si|master/classic&promo='.$promo.'&offset=' . $offset;
		echo "Offset: $offset/$total\n";
		$data = file_get_contents($url, false, $context);
		if ($data) {
			// Skip first line (crappy comment)
			$data = substr($data, strpos($data, "\n"));
			$data = json_decode($data);
			if ($data) {
				foreach ($data->items as $student) {
					$students[] = $student;
				}
				$total = $data->total;			
				continue;
			}
		}
		// Error
		echo "-------------- FAIL\n\n";
		var_dump($data);
		exit;
	}
	
	file_put_contents('promo.'.$promo.'.json', json_encode($students));
}