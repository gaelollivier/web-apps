<?php

$url = 'http://perso.epitech.eu/~ol/work/raytracer/'.$_GET['gallery'].'/index.html';

// Could simply use 'file_get_contents' but 1and1 is blocking urls from it...
$page = httpGet($url);
// Remove line returns
$page = str_replace("\n", '', $page);
$xml = @DOMDocument::loadHTML($page);

$tables = $xml->getElementsByTagName('table');
$mainTable = false;
foreach ($tables as $table) {
	if ($table->hasAttribute('border') && $table->getAttribute('border') == 1) {
		$mainTable = $table;
		break;
	}
}

if (!$mainTable)
	die;

$tds = $mainTable->getElementsByTagName('td');

$images = array();

foreach ($tds as $td) {
	// Keep only td's with 'img' and 'a' elements and then match the data
	$imgs = $td->getElementsByTagName('img');
	$a = $td->getElementsByTagName('a');
	if ($imgs->length > 0 && $a->length > 0) {
		// Parse infos
		if (preg_match('#(?<login>[\w_-]+)( \((?<city>\w+)\) ?(\[vote: (?<votes>[0-9]+)\])?)?#', $td->textContent, $matches)) {
			$images[] = array(
				'login' => $matches['login'],
				'city' => $matches['city'] ? $matches['city'] : 'Paris',
				'votes' => (int)$matches['votes'],
				'mini' => $imgs->item(0)->getAttribute('src'),
				'big' => $a->item(0)->getAttribute('href')
			);
		}
	}
}

echo json_encode($images);

function httpGet($url) {
	// create curl resource 
	$ch = curl_init(); 
	
	// set url 
	curl_setopt($ch, CURLOPT_URL, $url); 
	
	//return the transfer as a string 
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
	
	// $output contains the output string 
	$output = curl_exec($ch); 
	
	// close curl resource to free up system resources 
	curl_close($ch);
	
	return $output;
}
