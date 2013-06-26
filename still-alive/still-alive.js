(function() {
    'use strict';

    // Expose the app to main scope
    window.stillAlive = {
        isPlaying: false,
        time: 0
    };


    var stillAlive = window.stillAlive,
        // Private members
        timer,
        previousTime,
        lyricsText,
        creditsText,
        asciiArts,
        asciiArtsScript,

        // Dom elements
        container,
        audioElement,
        progressBar,
        playButton,

        // Configuration
        totalTime = 182,
        songStartTime = 6.5;

    function parseText(input) {
        var result = [],
            lines = input.split("\n"),
            parts,
            currentKey,
            currentTime = 0,
            i,
            l;

        function parseTime(time) {
            var value = 0, parts;
            if (time.charAt(0) === '+') {
                // Relative time
                value += currentTime;
                time = time.substr(1);
            }
            // Syntax min:s
            parts = time.split(':');
            value += parts.length > 1 ? parseFloat(parts[0]) * 60 + parseFloat(parts[1]) : parseFloat(parts[0]);
            return value;
        }

        function parseDuration(duration, time) {
            // Duration syntax (relative to start time)
            if (duration.charAt(0) === ':') {
                return parseFloat(duration.substr(1));
            }
            // End time syntax time
            return parseTime(duration) - time;
        }

        for (i = 0, l = lines.length; i < l; i += 1) {
            parts = lines[i].split('|');
            if (parts.length > 1) {
                currentKey = {
                    time: parseTime(parts[0]),
                    value: parts[parts.length - 1].replace(/\\n/g, "\n")
                };
                currentTime = currentKey.time;
                currentKey.duration = parts.length > 2  ? parseDuration(parts[1], currentKey.time) : 0;
                currentTime += currentKey.duration;
                result.push(currentKey);
            }
        }

        return result;
    }

    function renderText(text, time, cursor) {
        var result = '',
            animProgress,
            i,
            l;

        if (cursor === undefined) {
            cursor = true;
        }

        // Go to the time in the interval we are
        // And append all passed text to the result
        for (i = 0, l = text.length; i < l; i += 1) {
            if (text[i].time < time && (!text[i].duration || text[i].time + text[i].duration < time)) {
                // New page
                if (text[i].value === '//--//') {
                    result = '';
                } else {
                    result += text[i].value;
                }
            } else {
                // Now render only the part of the text needed
                // according to the animation progress
                animProgress = 1 - (((text[i].time + text[i].duration) - time) / text[i].duration);
                if (animProgress >= 1) {
                    result += text[i].value;
                } else {
                    result += text[i].value.substr(0, animProgress * text[i].value.length);
                }
                break;
            }
        }
        if (cursor && time % 0.5 > 0.25) {
            result += '_';
        }
        return result.split("\n");
    }

    function renderCredits() {
        var lines = renderText(creditsText, stillAlive.time),
            i;

        // Render only 16 last lines        
        if (lines.length > 16) {
            lines = lines.slice(lines.length - 16, lines.length);
        } else {
            // If we have less than 16 lines, stick first lines to bottom
            for (i = lines.length; i < 16; i += 1) {
                lines.unshift('');
            }
        }
        return lines;
    }

    function horizontalLine(length, text) {
        var line = '',
            i;

        if (!text) {
            text = '-';
        }
        for (i = 0; i < length; i += 1) {
            line += text;
        }
        return line;
    }

    function padRight(text, length) {
        var i;

        if (!text) {
            text = '';
        }
        for (i = text.length; i < length; i += 1) {
            text += ' ';
        }
        return text;
    }

    function render() {
        // Render the lyrics and credits text
        var lyricsLines = renderText(lyricsText, stillAlive.time),
            creditsLines = renderCredits(creditsText),
            asciiLines = renderText(asciiArtsScript, stillAlive.time, false),
            result = '',
            totalHeight = 39,
            i;

        // Render the page
        for (i = 0; i < totalHeight; i += 1) {
            // First and last lines
            if (i === 0 || i === totalHeight - 1) {
                result += horizontalLine(47);
                if (i === 0) {
                    result += '  ' + horizontalLine(50) + "\n";
                }
            } else {
                result += '|' + padRight(lyricsLines.length > (i - 1) ? lyricsLines[i - 1] : '', 46)
                        + '|';
                if (i <= 16) {
                    result += padRight(creditsLines[i - 1], 51);
                } else if (i === 17) {
                    result += horizontalLine(51);
                } else {
                    result += horizontalLine(6, ' ') + padRight(asciiLines[i - 18], 45);
                }
                if (i <= 16) {
                    result += "|";
                }
                result += "\n";
            }
        }

        container.text(result);

        // Update the song
        if (stillAlive.isPlaying && stillAlive.time > songStartTime) {
            if (audioElement.paused) {
                audioElement.play();
            }
        } else if (!audioElement.paused) {
            audioElement.pause();
        }

        // Update progress bar
        progressBar.css({'width': Math.min(100, stillAlive.time / totalTime * 100) + '%'});
    }

    function loop() {
        var ellapsedTime = 0;

        if (previousTime) {
            ellapsedTime = new Date().getTime() - previousTime;
        }
        stillAlive.time += ellapsedTime / 1000;
        previousTime = new Date().getTime();

        if (stillAlive.time > totalTime) {
            stillAlive.pause();
        }

        render();
    }

    function buildAsciiArtsScript() {
        var texts = {},
            i;

        asciiArts = ['aperture', 'cake', 'explosion', 'radio', 'atom',
                     'biohazard', 'black-mesa', 'broken-heart', 'check',
                     'companion-cube', 'fire', 'glados', 'lightbulb',
                     'claw-arm', 'personality-sphere'];

        for (i = 0; i < asciiArts.length; i += 1) {
            // Substr(1) if to remove the fist "\n"
            texts[asciiArts[i]] = $('#ascii-' + asciiArts[i]).text().substr(1);
        }

        asciiArtsScript = parseText($('#ascii-arts-script').text());

        for (i = 0; i < asciiArtsScript.length; i += 1) {
            if (texts.hasOwnProperty(asciiArtsScript[i].value)) {
                asciiArtsScript[i].value = texts[asciiArtsScript[i].value];
            }
        }
    }

    stillAlive.play = function() {
        if (this.isPlaying) {
            return;
        }

        this.isPlaying = true;

        // Prevent from adding the time not playing
        previousTime = false;

        clearInterval(timer);
        // 25fps
        timer = setInterval(loop, 40);

        // Update the song
        audioElement.currentTime = this.time - songStartTime;

        // Update play button
        playButton.text('pause');
    };

    stillAlive.pause = function() {
        this.isPlaying = false;

        clearInterval(timer);
        audioElement.pause();

        // Update play button
        playButton.text('play');
    };

    stillAlive.togglePlay = function(e) {
        // If called from a key event, limit to spacebar
        if (e.keyCode !== undefined && e.keyCode !== 32) {
            return;
        }
        e.preventDefault();
        if (stillAlive.isPlaying) {
            //$('#debug').text(stillAlive.time);
            stillAlive.pause();
        } else {
            stillAlive.play();
        }
    };

    stillAlive.setTime = function(newTime) {
        this.time = newTime;
        try {
            audioElement.currentTime = newTime - songStartTime;
        } catch (ignore) {
        }
        render();
    };

    // Initialisation
    $(function() {
        var dragging = false,
            playAfterDragging = false,
            progressElement = $('#progress'),
            autoPlayStarted = false;

        // Load the song text
        lyricsText = parseText($('#lyrics-text').text());
        creditsText = parseText($('#credits-text').text());

        buildAsciiArtsScript();

        container = $('#container');
        progressBar = $('#progress .bar');
        playButton = $('#play-button');
        audioElement = $('#song')[0];

        // Events
        playButton.click(stillAlive.togglePlay);
        $(document).keydown(stillAlive.togglePlay);
        progressElement.mousedown(function(e) {
            // Click position relative to bar
            var pos = e.clientX - progressBar.offset().left,
                newProgress = Math.max(0, Math.min(1, pos / (progressElement.width())));

            stillAlive.setTime(totalTime * newProgress);
            dragging = true;
            playAfterDragging = stillAlive.isPlaying;
        });
        $(document).mouseup(function() {
            if (playAfterDragging) {
                stillAlive.play();
            }
            dragging = false;
        });
        $(document).mousemove(function(e) {
            if (dragging) {
                e.preventDefault();
                stillAlive.pause();
                // Pointer position relative to bar
                var pos = e.clientX - progressBar.offset().left,
                    newProgress = Math.max(0, Math.min(1, pos / (progressElement.width())));
                stillAlive.setTime(totalTime * newProgress);
            }
        });

        // Set time to 0 (render a first time)
        stillAlive.setTime(0);

        // Load the song
        audioElement.addEventListener('loadeddata', function() {
            // Check the URL for seeking time
            if (window.location.search.indexOf('?') !== -1) {
                stillAlive.setTime(parseFloat(window.location.search.substr(1)));
            }

            if (autoPlayStarted) {
                return;
            }

            // Song is ready, let's play !
            stillAlive.play();
            autoPlayStarted = true;
        }, true);

        // If the loaded data doesn't fire, launch the song after 2s
        // (and hope the song will be ready on time !
        setTimeout(function() {
            if (!autoPlayStarted) {
                stillAlive.play();
                autoPlayStarted = true;
            }
        }, 2000);
    });

}());