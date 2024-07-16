// create the tile layers for the backgrounds of the map
var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// satellite imagery layer
var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// dark mode layer
var dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 20
});

// earth at night layer
var earthAtNight = L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
	attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
	bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
	minZoom: 1,
	maxZoom: 8,
	format: 'jpg',
	time: '',
	tilematrixset: 'GoogleMapsCompatible_Level'
});

// make basemaps object
let basemaps = {
    "Satellite View": satellite,
    "Dark Mode": dark,
    "Earth at Night": earthAtNight,
    "Street Map": defaultMap    
};

// make map object
var myMap = L.map("map", {
    center: [37.0902, -95.7129], 
    zoom: 4,
    layers: [defaultMap, satellite, dark, earthAtNight]
});

// add the default map
defaultMap.addTo(myMap);

// get the data for the tectonic plates and draw on the map
// variable to hold the tectonic plates layer
let tectonicPlates = new L.layerGroup();

// call the api to get the info for the tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function(plateData){
    // display data in console
    console.log(plateData);

    // load the data using GeoJSON and add to the tectonic plates layer
    L.geoJson(plateData, {
        // add styling
        color: "purple",
        weight: 3
    }).addTo(tectonicPlates);
});

// add the technotic plates to the map
tectonicPlates.addTo(myMap);

// variable to hold the earthquake data layer
let earthquakes = new L.layerGroup();

// get the data for the earthquake data
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson").then(function(eqData){
    // display data in console
    console.log(eqData);

    // plot circles, where the radius is dependent on the magnitude and the color is dependent on the depth
    
    // make a function that chooses the color of the data point
    function dataColor(depth){
        if (depth > 90)
            return "#de2323";
        else if (depth > 70)
            return "#de5b23";
        else if (depth > 50)
            return "#de9623";
        else if (depth > 30)
            return "#decb23";
        else if (depth > 10)
            return "#b2de23";
        else
            return "#5fde23";
    }

    // make a function that determines the size of the radius
    function radiusSize(mag){
        if (mag == 0)
            return 1; // makes sure that a 0 mag earthquake shows up
        else
            return mag * 4; // makes sure the circle is pronounced in the map
    }

    // add on to the style for each data point
    function dataStyle(feature){
        return {
            opacity: 0.8,
            fillOpacity: 0.8,
            fillColor: dataColor(feature.geometry.coordinates[2]), // use index 2 for depth
            color: "black",
            radius: radiusSize(feature.properties.mag), // grabs magnitude
            weight: 0.5
        }
    }

    // add the GeoJSON data
    L.geoJson(eqData, {
        // make each feature a maker that is on the map (cirlce)
        pointToLayer: function(feature, latLng) {
            return L.circleMarker(latLng);
        }, 
        // set the style for each marker
        style: dataStyle, // calls the data style function and passes in the earthquake data
        // add popups
        onEachFeature: function(feature, layer){
            layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>Depth: <b>${feature.geometry.coordinates[2]}</b><br>Location: <b>${feature.properties.place}</b>`)
        }
    }).addTo(earthquakes);
});

// add earthquake data to map
earthquakes.addTo(myMap);

// add the overlay for the tectonic plates
let overlays = {
    "Tectonic Plates": tectonicPlates,
    "Earthquakes": earthquakes
};

// add the Layer controls
L.control.layers(basemaps, overlays).addTo(myMap);

// add the legend to the map
let legend = L.control({
    position: "bottomright"
});

// add the properties for the legend
legend.onAdd = function() {
    // div for the legend to appear in the page
    let div = L.DomUtil.create("div", "info legend");

    // set up the intervals
    let intervals = [-10, 10, 30, 50, 70, 90];

    // set the colors for the intervals
    let colors = ["#5fde23","#b2de23","#decb23","#de9623","#de5b23","#de2323"];

    // loop through the intervals and colors to generate a label with a colored square for each interval
    for(var i = 0; i < intervals.length; i++) {
        // use innerHTML that sets the square for each interval and label
        div.innerHTML += "<i style=\"background: " + colors[i] + "\"></i> "
            + intervals[i] + (intervals[i + 1] ? "km to " + intervals[i + 1] + "km<br>" : "+");
    }

    return div;
};

// add legend to the map
legend.addTo(myMap);