jQuery(document).ready(function($) {

    var filePath = getUrlParameter('data');
    var diameter = getUrlParameter('diameter');
    diameter = diameter === undefined ? 700 : diameter;
    $('#svgfull').html('file: ' + filePath);
    $.getJSON(filePath, function(data) {
        circleChart('#svgfull', 10, diameter, data);
    });
});

var getUrlParameter = function getUrlParameter(sParam) {

    var query = window.location.search.substring(1);
    var sURLVariables = decodeURIComponent(query).split('&');
    var sParameterName;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? 
                true : sParameterName[1];
        }
    }
};