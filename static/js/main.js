$(document).ready(function() {
    var clickedPositionX;
    var clickedPositionY;
    
    // Setup Websocket connections and details
	var ws = new WebSocket("ws://" + window.location.hostname + "/socket?Id=" + Math.floor((Math.random() * 2000) + 1));
	ws.onopen = function(){
	}
	ws.onmessage = function (evt) {
        $('#whoIsBeingLookedFor').html(evt.data);
        height = $(window).height() / 2;
        width = ($(window).width() / 2) - ($('#alertField').width() / 2);
        $('#alertField').css('top', height);
        $('#alertField').css('left', width);
        $('#alertField').show();
	}
	ws.onclose = function() {
		ws.send("Closing socket connection");
	}
    
    //Setup Raphael JS for drawing
    var paper = Raphael($("#map")[0], 2095, 1000);
    var mapImage = paper.image('/static/floorplan.jpg',0, 0, 2095, 1000);
    
    //Helper function to draw on map
    function drawCircleOnMap(x, y, firstLetterInName, radius, color, fadeTime){
        var circle = paper.circle(
                x, y, radius).attr({
                "fill": color,
                "stroke":"#000",
                "stroke-width":"5"
            });
        var text = paper.text(x, y, firstLetterInName);
        circle.animate({opacity:0}, fadeTime, function(){
            this.remove();
        });
        text.animate({opacity:0}, fadeTime, function(){
            this.remove();
        });
    }
    
    // Click on map and popup a modal to ask who the user saw
    mapImage.click( function(event){
        clickedPositionX = event.pageX + $('#content').scrollLeft();
        clickedPositionY = event.pageY + $('#content').scrollTop() - $('#navheader').outerHeight();
        $('#insertModal').modal('show');
    });
    
    //Dynamically resize the map
    $('#content').height(function(){
       return $(window).height() * 0.9;
    });
    
    // Add insert modal functionality
    function insertRecordOfWhoWasSeen(){
        var data = {};
        data['name'] = $('#insertName').val();
        data['posX'] = clickedPositionX;
        data['posY'] = clickedPositionY;
        
        $.get('../insert',data);
        
        $('#insertModal').modal('hide');
        drawCircleOnMap(clickedPositionX, clickedPositionY, data['name'][0], 30, '#b8dbd3', 3500);
    };
    $('#insertModal').modal('hide'); // Initial the modal
    $('#insertName').keypress(function(e){
       if(e.which == 13){
           insertRecordOfWhoWasSeen();
       }
    });
    $('#saveInsertModal').click(function(){
        insertRecordOfWhoWasSeen()
    });
    
    // Add request modal functionality
    function sendNameOfSomeoneToFind(){
        $('#requestModal').modal('hide');
        ws.send( $('#requestName').val() );
    }
    $('#requestModal').modal('hide');
    $('#requestButton').click(function(){
        $('#requestModal').modal('show');
    });
    $('#requestName').keypress(function(e){
       if(e.which == 13){
           sendNameOfSomeoneToFind();
       }
    });
    $('#requestModalSubmit').click(function(){
        sendNameOfSomeoneToFind();
    });
    
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
    
    // Add find professor functionality
    function showLastKnownLocationOfProfessorOnMap(){
        sendData = {'findName': $('#findName').val()};
        
        $.get('../find',
              sendData,
              function(data){
                var jData = jQuery.parseJSON(data);
                var color = randomColor();
            
                jData['rows'].forEach(function(dPoint){
                    var posX = dPoint['value']['posX'];
                    var posY = dPoint['value']['posY'];
                    var time = dPoint['value']['time'];
                    var currentTime = (new Date().getTime())/1000;
                    var timeDifference = currentTime - parseInt(time);
                    var radius;
                    
                    if ((timeDifference > 30000) || (timeDifference < 0)){
                        // Don't do anything! 
                    } else {
                        radius = 40 * Math.pow((30000 - timeDifference),6) / Math.pow(30000,6);
                        radius = (radius < 15 ? 10 : radius);
                        drawCircleOnMap(posX, posY, dPoint['key'][0], radius, color, 60000);
                    }
                });
        });
    };
    $('#findName').keypress(function(e){
       if(e.which == 13){
           showLastKnownLocationOfProfessorOnMap();
       }
    });
    $('#findButton').click(function(){
        showLastKnownLocationOfProfessorOnMap();
    });
    
    // Hide alert field
    $('#closeAlertButton').click(function(){
        $('#alertField').hide();
    });
    $('#alertField').hide();
    
    // Add Easter Egg
    $( window ).konami({
       code : [38,38,40,40,37,39,37,39], // up up down down left right left right
       cheat: function() {
           var img = $('#logo').show();
           var width = img.get(0).width;
           var height = $(window).height() / 4;
           var screenWidth = "+=" + $(window).width();
           var duration = 10000;
           
           img.css("top", height);
           img.css("left", -width).animate({
               "left": screenWidth}, duration, function() {
                    img.fadeOut(1000);
           });
           
       }
    });
});