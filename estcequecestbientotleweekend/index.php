<!DOCTYPE html>
<html ng-app="App">
	<head>
		<meta charset="utf-8">
		<title>Est-ce que c'est bientôt le week-end ?</title>
		
		<meta name="description" content="Est-ce que c'est bientôt le week end ?">
		<meta name="author" content="Gael Jochaud du Plessix">
		
		<link href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/css/bootstrap-combined.min.css" rel="stylesheet">
		
		<style type="text/css">
		
			body {
				padding-top: 20px !important;
			}
					
		</style>
		
	</head>	
	<body ng-controller="AppController">
	
        <!-- 
            ///////////////////////////////////////////////
            //     DEGAGE DE LÀ ESPÈCE DE VOYOU !        //
            // TU T'ES PRIS POUR UN HACKEUR OU QUOI ???  //
            //   non sérieux tu vas tout te spoil là     //
            //         revient plutôt demain             //
            //       si tu veux vraiment savoir!         //
            ///////////////////////////////////////////////
        -->	
		
		<div class="container">
		
		<div ng-show="fonctionnaire">
		    Ce site marche pas pour toi, retourne bosser!
		</div>
		<div ng-hide="fonctionnaire" class="hero-unit">
			<h1>{{estCeQueCestBientotLeWeekEnd}}</h1>
			<p ng-show="!cestLeWeekEnd">c'est le week end dans {{days}} jour{{days != 1 && 's' || ''}}, {{hours}} heure{{hours != 1 && 's' || ''}}, {{minutes}} minute{{minutes != 1 && 's' || ''}} et {{seconds}} seconde{{seconds != 1 && 's' || ''}}<!--  et {{milliseconds}} milliseconde{{milliseconds != 1 && 's' || ''}} --> !</p>
		</div>

		</div> <!-- /container -->				
		
		<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>		
		<script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.0.6/angular.min.js"></script>
		
		<script type="text/javascript">
		
			angular.module('App', []).
				controller('AppController', function($scope, $timeout) {
				    if (window.location.search.indexOf('fonctionnaire') !== -1) {
				        $scope.fonctionnaire = true;
    				    return ;
				    }
				    (function tick() {
    				    // Get the date of the next week end
    				    var weekEnd = new Date(),
    				        currentDay = weekEnd.getDay() - 1;
    				    // Current day with Monday as first day of the week
    				    if (currentDay < 0)
    				        currentDay = 6;
    				    if (currentDay >= 5 || (currentDay == 4 && weekEnd.getHours() >= 18)) {
        				    // C'est le week end !
        				    $scope.estCeQueCestBientotLeWeekEnd = "C'est le week end!";
        				    $scope.cestLeWeekEnd = true;
    				    } else {
        				    // C'est pas le week end :(
                            $scope.cestLeWeekEnd = false;
        				    // Get time of the next Friday at 18:00
        				    weekEnd.setHours(18);weekEnd.setMinutes(0);weekEnd.setSeconds(0);weekEnd.setMilliseconds(0);
        				    weekEnd.setTime(weekEnd.getTime() + (24 * 3600 * 1000 * (4 - currentDay)));    				    
        					var timeToWeekEnd = (weekEnd.getTime() - new Date().getTime());        					
        					// Countdown
                            $scope.days = Math.floor(timeToWeekEnd / (24 * 3600 * 1000));
        					$scope.hours = Math.floor((timeToWeekEnd % (24*3600*1000)) / (3600*1000));
                            $scope.minutes = Math.floor((timeToWeekEnd % (3600*1000)) / (60*1000));
                            $scope.seconds = Math.floor((timeToWeekEnd % (60*1000)) / (1000));
        					$scope.milliseconds = timeToWeekEnd % 1000;
        					
        					// Message
        					
        					// SPOILER ALERT -- SPOILER ALERT -- SPOILER ALERT
        					// SPOILER ALERT -- SPOILER ALERT -- SPOILER ALERT
        					// SPOILER ALERT -- SPOILER ALERT -- SPOILER ALERT
        					// SPOILER ALERT -- SPOILER ALERT -- SPOILER ALERT

<?php /*
        					var msgs = [
        					    [1, "C'est comme si, tu peux rester sur cette page en attendant!"],
        					    [2, "Pas encore mais ça va pas tarder..."],
        					    [5, "Presque! Tu peux commencer à ranger tes affaires."],
        					    [8, "Bientôt, bientôt. Mais pour le moment retourne bosser!"],
        					    [24, "Eh non! Revient demain!"],
        					    [24*2, "Non, mais le plus dur est fait!"],
        					    [24*3, "Pas tant!"],
        					    [24*4, "Non."]
        					    
        					];
        					
var msgs = [[1,"D(ftu!dpnnf!tj-!uv!qfvy!sftufs!tvs!dfuuf!qbhf!fo!buufoebou\""],[2,"Qbt!fodpsf!nbjt!èb!wb!qbt!ubsefs///"],[5,"Qsftrvf\"!Uv!qfvy!dpnnfodfs!á!sbohfs!uft!bggbjsft/"],[8,"Cjfouõu-!cjfouõu/!Nbjt!qpvs!mf!npnfou!sfupvsof!cpttfs\""],[24,"Fi!opo\"!Sfwjfou!efnbjo\""],[48,"Opo-!nbjt!mf!qmvt!evs!ftu!gbju\""],[72,"Qbt!ubou\""],[96,"Opo/"]];
                                    var msg = '';
                				    for (var j = 0; j < msgs[i][1].length; ++j) {
                    				    msg += String.fromCharCode(msgs[i][1].charCodeAt(j) - 1);
                				    }        					
*/ ?>
                            var times = [1, 2, 5, 8, 24, 24*2, 24*3, 24*4];
        					for (var i = 0; i < times.length; ++i) {
            					if ((timeToWeekEnd/(1000*3600)) < times[i] || i == times.length-1) {
            					
            					// Bon chance ! ;)
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('3 4=[[1,"D(6!f!g-!h!7!k!l!m!n!o!p\\""],[2,"9!q!a!èb!r!s!t///"],[5,"v\\"!w!7!x!á!y!z!A/"],[8,"Bõu-!Cõu/!E!F!c!G!H!I\\""],[J,"K!L\\"!M!N\\""],[O,"d-!a!c!P!Q!6!R\\""],[S,"9!T\\""],[U,"d/"]];3 e=\'\';V(3 j=0;j<4[i][1].W;++j){e+=X.Y(4[i][1].Z(j)-1)}',62,62,'|||var|msgs||ftu|qfvy||Qbt|nbjt||mf|Opo|msg|dpnnf|tj|uv|||sftufs|tvs|dfuuf|qbhf|fo|buufoebou|fodpsf|wb|qbt|ubsefs||Qsftrvf|Uv|dpnnfodfs|sbohfs|uft|bggbjsft|Cjfou|cjfou||Nbjt|qpvs|npnfou|sfupvsof|cpttfs|24|Fi|opo|Sfwjfou|efnbjo|48|qmvt|evs|gbju|72|ubou|96|for|length|String|fromCharCode|charCodeAt'.split('|'),0,{}))
            					
                					$scope.estCeQueCestBientotLeWeekEnd = msg;
                					break;
            					}
        					}
        				}
        				
        				$timeout(tick, 500);
    				}());
				});
		</script>	
		
		<script type="text/javascript">

		  var _gaq = _gaq || [];
		  _gaq.push(['_setAccount', 'UA-36533977-1']);
		  _gaq.push(['_trackPageview']);
		
		  (function() {
		    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
		    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
		    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
		  })();
		
		</script>			
				
	</body>

</html>
