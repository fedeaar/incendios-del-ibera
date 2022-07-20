/* imports */

// require
var funciones = require('users/faarienti/ibera:funciones');

var cld = require('users/fitoprincipe/geetools:cloud_masks');
var sentinel = ee.ImageCollection("COPERNICUS/S2_HARMONIZED");


/* geometrias */
var geo = require('users/faarienti/ibera:geometrias');

var maskCorrientes = function(image) { return funciones.maskToGeometry(image, geo.corrientes); }
var roi = maskCorrientes


// vis
var vis = {
    bands: ['B4', 'B3', 'B2'],
    min: .001 * 65355,
    max: .1 * 65355,
    gamma: 2
}
var visNdvi = {
    palette: ['green']
}
var visNbr = {
    palette: ['red']
}



/* main */

// params
var imageSize = 500;
var scale_nbr = 20;
var scale_mediana = 30; // timeout con escala de 20mts
var scale_hrt = 30; 
var scale_modis_mediana = 250; // MODIS max res.
var scale_modis_hrt = 250; 




// === nbr === //

var fire = sentinel
    .filterBounds(geo.corrientes)
    .filterDate("2022-02-01", "2022-02-28");
    //.filterMetadata("CLOUD_COVERAGE_ASSESSMENT", "less_than", 20);

var comp_fire = fire  // sin nubes y por prioridad de mas reciente, aplicando hollstein
    .map(roi)    
    .map(cld.hollstein_S2())
    .map(funciones.addMillisBand)
    .qualityMosaic("millis");  

// procesamiento
var nbr_fire = funciones.nbr(comp_fire, 'B8', 'B12');
var nbr_mask = nbr_fire.lte(-.08);
var nbr_fire_masked = nbr_fire.updateMask(nbr_mask);

 
// area nbr para cada geometría
var nbr_areas = geo.geometrias.keys().map(function (key) {
    return [key, funciones.maskedArea(nbr_mask, geo.geometrias.get(key), scale_nbr)];
})
nbr_areas = ee.Dictionary(nbr_areas.flatten())
    .set("scale", scale_nbr);

print('nbr areas');
print(nbr_areas);

funciones.exportImage(comp_fire, geo.corrientes, vis, imageSize, "comp_fire");
funciones.exportImage(nbr_fire_masked, geo.corrientes, visNbr, imageSize, "nbr_fire_masked");
// Map.addLayer(nbr_fire_masked, visNbr, 'nbr');

// === //




// === ndvi mediana 2021 === //

var base = sentinel
    .filterBounds(geo.corrientes)
    .filterDate("2021-01-01", "2021-12-31")
    .filterMetadata("CLOUD_COVERAGE_ASSESSMENT", "less_than", 20);
  
var comp_base = base  // valores medianos para el 2021
    .map(roi)
    .median();  

var ndvi_base = funciones.ndvi(comp_base, 'B8', 'B4');
var ndvi_base_masked = ndvi_base.updateMask(nbr_mask);  // solo sobre las regiones quemadas

// medianas ndvi para cada geometria de interés
var ndvi_medians = geo.geometrias.keys().map(function (key) {
    var _median = funciones.median(geo.geometrias.get(key), ndvi_base_masked, scale_mediana).get('ndvi'); 
    return [key, ee.Number(_median)];
});
ndvi_medians = ee.Dictionary(ndvi_medians.flatten())
    .set("scale", scale_mediana);

print('ndvi medianas');
print(ndvi_medians);

funciones.exportImage(comp_base, geo.corrientes, vis, imageSize, "comp_base");

// === //




// === hrt === //

var hrt = function (desde, hasta) {
    
    var post = sentinel
        .filterBounds(geo.corrientes)
        .filterDate(desde, hasta)
        .filterMetadata("CLOUD_COVERAGE_ASSESSMENT", "less_than", 5);

    var comp_post = post   
        .map(roi)
        //.map(cld.hollstein_S2(['cloud', 'shadow', 'cirrus']))
        .map(funciones.addMillisBand)
        .qualityMosaic("millis");
        
    var ndvi_post = funciones.ndvi(comp_post, 'B8', 'B4');
    var ndvi_post_masked = ndvi_post
        .updateMask(nbr_mask);  // solo sobre las regiones quemadas

    var areas_ndvi = geo.geometrias.keys().map(function (key) {
        var mask = ndvi_post_masked.gt(ee.Number(ndvi_medians.get(key)));
        return [key, funciones.maskedArea(mask, geo.geometrias.get(key), scale_hrt)];
    });
    areas_ndvi = ee.Dictionary(areas_ndvi.flatten())
        .set("scale", scale_hrt);

    print(hasta);
    print(areas_ndvi);

    var mask = ndvi_post_masked.gt(ee.Number(ndvi_medians.get("corrientes")));
    var layer = ndvi_post_masked.updateMask(mask);
    funciones.exportImage(comp_post, geo.corrientes, vis, imageSize, "comp_post_" + desde + '_' + hasta);
    funciones.exportImage(layer, geo.corrientes, visNdvi, imageSize, "ndvi_post_" + desde + '_' + hasta);
    //Map.addLayer(layer, visNdvi, 'ndvi');

}

hrt("2022-02-01", "2022-02-28");
hrt("2022-02-15", "2022-03-31");
hrt("2022-03-15", "2022-04-30");
hrt("2022-04-15", "2022-05-31");
hrt("2022-05-01", "2022-06-30"); // no hay fotos buenas en la esquina inferior

// === //




// === modis ndvi === //

var modis = ee.ImageCollection("MODIS/061/MOD13Q1");

var modis_base = modis
    .filterBounds(geo.corrientes)
    .filterDate("2021-01-01", "2021-12-31");
  
var comp_modis = modis_base  // valores medianos para el 2021
    .map(roi)
    .median()
    .select('NDVI');  

var ndvi_modis_masked = comp_modis.updateMask(nbr_mask);  // solo sobre las regiones quemadas

// medianas ndvi para cada geometria de interés
var ndvi_modis_medians = geo.geometrias.keys().map(function (key) {
    var _median = funciones.median(geo.eometrias.get(key), ndvi_modis_masked, scale_modis_mediana).get('NDVI'); 
    return [key, ee.Number(_median)];
});
ndvi_modis_medians = ee.Dictionary(ndvi_modis_medians.flatten())
    .set("scale", scale_modis_mediana);

print('ndvi medianas');
print(ndvi_modis_medians);


// === hrt === //

var modis_hrt = function (desde, hasta) {
    
    var modis_post = modis
        .filterBounds(geo.corrientes)
        .filterDate(desde, hasta)

    var comp_modis = modis_post   
        .map(roi)
        .map(funciones.addMillisBand)
        .qualityMosaic("millis")
        .select('NDVI');
        
    var ndvi_modis_masked = comp_modis
        .updateMask(nbr_mask);  // solo sobre las regiones quemadas

    var areas_modis = geo.geometrias.keys().map(function (key) {
        var mask = ndvi_modis_masked.gt(ee.Number(ndvi_modis_medians.get(key)));
        return [key, funciones.maskedArea(mask, geo.geometrias.get(key), scale_modis_hrt)];
    });
    areas_modis = ee.Dictionary(areas_modis.flatten())
        .set("scale", scale_modis_hrt);

    print(hasta);
    print(areas_modis);

    var mask = ndvi_modis_masked.gt(ee.Number(ndvi_modis_medians.get("corrientes")));
    var layer = ndvi_modis_masked.updateMask(mask);
    
    funciones.exportImage(layer, geo.corrientes, visNdvi, imageSize, "modis_ndvi_post_" + hasta);
    Map.addLayer(layer, visNdvi, 'ndvi ' + hasta);
}

for (var i = 2; i < 7; i++) {
    modis_hrt("2022-0" + i + "-01", "2022-0" + i + "-16");
    modis_hrt("2022-0" + i + "-16", "2022-0" + i + (i != 2 ? "-30" : "-28"));
}

// === //