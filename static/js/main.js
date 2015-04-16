$(document).ready(function() {
    
    // Setup Websocket connections and details
	var ws = new WebSocket("ws://" + window.location.hostname + ":5000/socket?Id=1");
	ws.onopen = function(){
	}
	ws.onmessage = function (evt) {
	}
	ws.onclose = function() {
		ws.send("Closing socket connection");
	}
    
    //Dynamically resize the map
    $('#content').height(function(){
       return $(window).height() * 0.9;
    });
    
    // Setup event listener for mouse click
    var canvas = document.getElementById("map");
    canvas.addEventListener("mousedown", function(e){
        var x = e.x;
        var y = e.y;
        
        x -= canvas.offsetLeft;
        y -= canvas.offsetTop;
        
        alert("x:" + x + " y:" + y);
    }, false);
    
    // Setup the Twitter autocomplete integration
    
    var substringMatcher = function(strs) {
      return function findMatches(q, cb) {
        var matches, substrRegex;
        // an array that will be populated with substring matches
        matches = [];
        // regex used to determine if a string contains the substring `q`
        substrRegex = new RegExp(q, 'i');
        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        $.each(strs, function(i, str) {
          if (substrRegex.test(str)) {
            // the typeahead jQuery plugin expects suggestions to a
            // JavaScript object, refer to typeahead docs for more info
            matches.push({ value: str });
          }
        });
        cb(matches);
      };
    };
    
    $.get('../search', function(data){
        $('.typeahead').typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        }, {
            name: 'names',
            displayKey: 'value',
            source: substringMatcher(jQuery.parseJSON(data)['names'])
        });
    });
    
    // Add Easter Egg
    $( window ).konami({
       code : [38,38,40,40,37,39,37,39], // up up down down left right left right
       cheat: function() {
           var img = $('#logo').show();
           var width = img.get(0).width;
           var screenWidth = "+=" + $(window).width();
           var duration = 10000;
           
           img.css("left", -width).animate({
               "left": screenWidth}, duration, function() {
                    img.fadeOut(1000);
           });
           
       }
    });
});