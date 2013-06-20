<?php

define('SCORES_FILE', 'scores.json');

$request = @json_decode(file_get_contents('php://input'));

if ($request && isset($request->login) && isset($request->promo) && isset($request->city) && isset($request->score)) {
    
    $scores = @json_decode(file_get_contents(SCORES_FILE));
    
    if (!$scores || !is_object($scores)) {
        $scores = new stdClass();
    }
    
    foreach (array('login', 'promo', 'city', 'score') as $var) {
        ${$var} = $request->$var;
    }
    
    $key = "$login/$promo/$city";
    
    if (!isset($scores->$key) || $scores->$key < $score)
    	$scores->$key = $score;
    
    // Save scores
    file_put_contents(SCORES_FILE, json_encode($scores));

}