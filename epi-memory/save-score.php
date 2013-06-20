<?php

define('SCORES_FILE', 'scores.json');

$request = @json_decode(file_get_contents('php://input'));

if ($request && isset($request['login']) && isset($request['promo']) && isset($request['city']) && isset($request['score'])) {
    
    $scores = @file_get_contents(SCORES_FILE);
    
    if (!$scores || !is_array($scores)) {
        $scores = array();
    }
    
    foreach (array('login', 'promo', 'city', 'score') as $var) {
        ${$var} = $request[$var];
    }
    
    $key = "$login/$promo/$city";
    
    $scores[$key] = $score;
    
    // Save scores
    file_put_contents(SCORES_FILE, json_encode($scores));

}