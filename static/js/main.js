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