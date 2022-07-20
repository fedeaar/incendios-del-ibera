// utils
var exportImage = function (image, geo, vis, scale, description) {
    var projection = image.projection().getInfo()
    Export.image.toDrive({
        "image": image.visualize(vis),
        "scale": scale,
        "description": description,
        "crs": projection.crs,
        "region": geo,
        fileFormat: 'GeoTIFF',
        maxPixels: 1e13
    }); 
}

var fromGeoJSON = function (geojson) { // -> ee.FeatureCollection
    var features = ee.FeatureCollection(geojson.features);
    Object.keys(geojson).map(function (p) {
        if (p == 'type' || p == 'features') {
            return;
        }
        features = features.set(p, geojson[p]);
    });
    return features;
}

var maskToGeometry = function (image, geom) { // -> ee.Image
    var mask = ee.Image.constant(1)
        .clip(geom)
        .mask();
    return image.updateMask(mask);
}
  
var addMillisBand = function (image) { // -> ee.Image
    var milli = ee.Image(image.getNumber('system:time_start'))
        .rename('millis')
        .toFloat();
    return image.addBands([milli]);
}


// indicadores
var nbr = function(image, nirBand, swirBand) { // -> ee.Image
    var _nbr = image
        .normalizedDifference([nirBand, swirBand])
        .rename('nbr');
    return _nbr;
}

var ndvi = function (image, nirBand, redBand) { // -> ee.Image
    var _ndvi = image
        .normalizedDifference([nirBand, redBand])
        .rename('ndvi');
    return _ndvi;
}


// procesamiento
var maskedArea = function (imageMask, geom, scale) { // -> { "masked_area": ee.Number, "total_area": ee.Number, "percent": ee.Number }
    var params = {
        "reducer": ee.Reducer.sum(),
        "geometry": geom,
        "scale": scale,
        "maxPixels": 1e20
    };

    var _area = ee.Image.pixelArea()
        .mask(imageMask);
    var _areaTotal = maskToGeometry(ee.Image.pixelArea(), geom);

    var _areaR = _area.reduceRegion(params);
    var _areaTotalR = _areaTotal.reduceRegion(params);

    var _areaV = ee.Number(_areaR.get('area'));
    var _areaTotalV = ee.Number(_areaTotalR.get('area'));
    var percent = _areaV.divide(_areaTotalV);

    return {
        "masked_area": _areaV,
        "total_area": _areaTotalV,
        "percent": percent
    };
}

var median = function (region, base, scale) { // -> ee.Number
    return base.reduceRegion({
        "reducer": ee.Reducer.median(),
        "geometry": region,
        "scale": scale,
        "maxPixels": 10e20
    });
}


exports.exportImage = exportImage;
exports.fromGeoJSON = fromGeoJSON;
exports.maskToGeometry = maskToGeometry;
exports.addMillisBand = addMillisBand;
exports.nbr = nbr;
exports.ndvi = ndvi;
exports.maskedArea = maskedArea;
exports.median = median;