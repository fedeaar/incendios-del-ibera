/* imports */
var funciones = require('users/faarienti/ibera:funciones')


/* geometria */

var roi = ee.Geometry.Polygon(
    [[
      -60.29323619723124,
      -30.889496256188266
    ],
    [
      -55.03078502535624,
      -30.889496256188266
    ],
    [
      -55.03078502535624,
      -27.153497560256174
    ],
    [
      -60.29323619723124,
      -27.153497560256174
    ],
    [
      -60.29323619723124,
      -30.889496256188266
    ]]
);

var imgs = [
    // mensuales
    ["2021-10-01", "2021-10-30"],
    ["2021-11-01", "2021-11-30"],
    ["2021-12-01", "2021-12-30"],
    ["2022-01-01", "2022-01-30"],
    ["2022-02-01", "2022-02-28"],
    ["2022-03-01", "2022-03-30"],
    ["2022-04-01", "2022-04-30"],
    ["2022-05-01", "2022-05-30"],
    ["2022-06-01", "2022-06-30"],
    // bimensuales
    ["2021-01-01", "2021-01-28"],
    ["2021-03-01", "2021-04-30"],
    ["2021-05-01", "2021-06-30"],
    ["2021-07-01", "2021-08-30"],
    ["2021-09-01", "2021-10-30"],
    ["2021-11-01", "2021-12-30"],
    ["2022-01-01", "2022-02-28"],
    ["2022-03-01", "2022-04-30"],
    ["2022-05-01", "2022-06-30"],
    // otras
    ["2021-11-15", "2021-12-30"],
    ["2021-02-01", "2021-03-10"]
]

for (var i = 0; i < imgs.length; ++i) {

    var start = imgs[i][0];
    var end = imgs[i][1];

    var ds = ee.ImageCollection("LANDSAT/LC08/C02/T1")
        .filterBounds(roi)
        .filterDate(start, end);

    var comp = ee.Algorithms.Landsat.simpleComposite({
        collection: ds,
        cloudScoreRange: 0
    });

    var vis = {
        bands: ['B4', 'B3', 'B2'],
        min: .04 * 255,
        max: .40 * 255,
        gamma: 2
    };

    var img = comp.visualize(vis);

    //Map.addLayer(img, {}, start + ' a ' + end);
    funciones.exportImage(img, roi, vis, 30, 'corrientes_30mts' + start + '_' + end);
    funciones.exportImage(img, roi, vis, 100, 'corrientes_100mts' + start + '_' + end);
}


