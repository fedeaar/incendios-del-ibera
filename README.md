# Incendios del iberá

Un análisis exploratorio sobre los incendios que ocurrieron en los Esteros del Iberá durante enero y febrero del 2022. Realizado junto al equipo de datos de TN. 

Los resultados se pueden leer acá.

Todas las imágenes en éste repositorio son cortesía del U.S. Geological Survey (landsat-8) y Copernicus Sentinel Data (sentinel-2).

Los scripts están escritos para funcionar con la interfaz que provee el servicio de [Google Earth Engine](https://earthengine.google.com/).

Los archivos en .gitignore se descartaron del repositorio por su peso, son imágenes gigantes y geometrías base. Los links a las geometrías están en `src.txt`.

</br></br>

# Metodología

## Imágenes satelitales

Se crearon mosaicos de la provincia de Corrientes sobre imágenes satelitales del Landsat-8. 

Las composiciones fueron procesadas con el algoritmo simpleComposite de GEE, para colecciones de imágenes de a rangos mensuales.

Para algunos meses donde las composiciones no lograban mostrar el total del territorio, por falta de imágenes o presencia elevadas de nubes, se extendió el rango considerado por a lo sumo 15 días.

Para las imágenes de enero y febrero se iteró el proceso varias veces, con distintos filtros para las nubes. Luego se procedió a unirlas de manera manual, con el objetivo de preservar la visión del humo en las zonas de incendio y descartar las nubes en otras áreas. 

Previo a la compresión se utilizó la siguiente escala: 1 px = 30 m2.

Sobre las imágenes base se procedió a recortar distintas areas de interés en torno a:

- La ciudad de Mercedes.
- La ciudad de Corrientes.
- El noroeste de la provincia.
- Las localidades de Colonia Romero y Loreto.
-  El lago Esteros del Iberá.
- La reserva provincial Iberá. 

</br></br>

## Área quemada

Se replicó de manera exploratoria [este estudio del INTA](https://inta.gob.ar/documentos/un-millon-cuarenta-y-dos-mil-quinientas-catorce-hectareas) sobre la superficie quemada por los incendios, al 27/02/2022, en la provincia de Corrientes.

Para ello se utilizaron imágenes del dataset: “Harmonized Sentinel-2 MSI: MultiSpectral Instrument, Level-1C”, provenientes del Satélite Sentinel-2 de Copernicus. 

Sobre las imágenes tomadas entre el 01/02/2022 y el 27/02/2022, para Corrientes, se armó un mosaico bajo el siguiente criterio:

- Enmascarar nubes, humo y agua, según la clasificación realizada por el algoritmo de Hollstein. 
- Componer la imagen priorizando por fecha más reciente. 

El mosaico resultante fue el siguiente:

</br></br>
<p align="center">
    <img src="./gen/imagenes/base_nbr.png?raw=true" alt="composición base." width="250"/>
</p>
</br></br>

Las partes blancas son nubes que el algoritmo no pudo corregir. Las zonas transparentes corresponden a cuerpos de agua. A pesar de no ser de calidad óptima, las zonas de incendio principales (céntricas) no resultaron afectadas.

Sobre la imágen se calculó el índice normalizado de superficie quemada (NBR):
</br></br>
<p align="center">
    $NBR = \frac{NIR - SWIR}{NIR + SWIR}$
</p>
</br></br>

donde NIR refiere a las longitudes de onda del infrarrojo cercano, y SWIR a las del infrarrojo de onda corta. 

El índice sirve para resaltar las áreas quemadas en grandes zonas de incendio. 

En el sentinel-2, la banda de imágen ‘B8’ corresponde al espectro de infrarrojo cercano, y ‘B12’ al espectro de infrarrojo medio.

Siguiendo la metodología del INTA, se procedió a clasificar por umbral entre zonas quemadas y no quemadas. De manera unitemporal. Se tomó el rango: [-1, -.080] para designar la superficie quemada: 

</br></br>
<p align="center">
    <img src="./gen/imagenes/resultado_nbr.png?raw=true" alt="resultado NBR." width="250"/>
</p>
</br></br>

Esta decisión arrojó los mejores resultados en relación al estudio del INTA (el mismo no aclara el umbral utilizado). Es importante considerar que una selección correcta, [en realidad](https://minerva.usc.es/xmlui/bitstream/handle/10347/3819/RR_5_7.pdf?sequence=1&isAllowed=y), debería optimizar iterativamente los resultados para disminuir tanto los errores por comisión, como por omisión. Por ello, se remarca el carácter exploratorio de este análisis. 

En base al resultado, se procedió a vectorizar y calcular el área de superficie quemada para las distintas zonas de interés dentro de Corrientes, además de la misma provincia:

- La ecorregión Esteros del Iberá.
- La reserva provincial Iberá.
- El parque provincial Iberá.
- El parque nacional Mburucuyá.
- El parque nacional Iberá. 

Según las geometrías disponibles en [APN](https://mapas.apn.gob.ar/layers/) y [OSM](https://www.openstreetmap.org/relation/10421113#map=9/-28.1931/-57.3184
).


Se tomó una escala de 1 px = 20 m2 para realizar el cálculo.

</br>

Resultados:

| zona | Area quemada | Total | Porcentaje |
| ---- | ------------ | ----- | ---------- |
| Corrientes | 1,044,331 ha | 8,938,395 ha | 11.68% |
| Esteros del Iberá |577,207 ha |3,922,153 ha | 14.72% |
| Parque nacional Iberá | 93,976 ha | 197,888 ha | 48.97% |
| Parque nacional Mburucuyá | 70 ha | 17,718 ha | 0.39% |
| Parque provincial Iberá | 34,970 ha | 563,764 ha | 6.20% |
| Reserva provincial Iberá | 237,735 ha | 1,144,177 ha | 20.78% |

</br></br>

## Recuperación temprana

Siguiendo la propuesta de Torres et al. ([Indicator-based assessment of post-fire recovery dynamics using satellite NDVI time-series](https://www.sciencedirect.com/science/article/abs/pii/S1470160X18300852)), se calculó el índice de tiempo medio de recuperación (HRT). El mismo da una medida del ritmo de recuperación a corto plazo de la vegetación. 

Según los autores, este es un índice de alcance moderado, en tanto su capacidad predictiva. Sirve para dar una primera impresión, pero un verdadero análisis de los efectos y recuperación post-incendio requiere de una evaluación a más largo plazo (desde el momento del hecho) y de un trabajo más transversal.

El HRT expresa ‘la velocidad inicial de recuperación’, relacionada a características propias al tipo de vegetación y condiciones climáticas inmediatamente posteriores al fuego. Es: la cantidad de días necesarios para alcanzar el 50% de recuperación desde el mínimo NDVI observado durante el año del fuego hasta el valor mediano previo al fuego. 

El NDVI se define como la diferencia normalizada entre las bandas de Infrarrojo cercano (‘B8’ en el Sentinel-2) y el espectro rojo (‘B5’). Da cuenta de la presencia de vegetación sana en una zona:

</br></br>
<p align="center">
$NDVI = \frac{NIR - RED}{NIR + RED}$
</p>
</br></br>

Nosotros tomamos la mediana del 2021, pero los autores utilizan un periodo más largo en su analisis (cuatro años). Respecto al mínimo NDVI, se tomó como punto de partida el 27 de febrero, mismo día base para el que se estimó el NBR.


Para la mediana 2021 se utilizó el siguiente mosaico:

</br></br>
<p align="center">
    <img src="./gen/imagenes/mediana_2021.png?raw=true" alt="mediana NDVI 2021." width="250"/>
</p>
</br></br>

Que corresponde a una composición sobre las medianas de cada píxel para la colección de imágenes satelitales en el periodo 2021-01-01 a 2021-12-31, descartando imágenes con presencia elevada de nubes. 

Sobre este mosaico se enmascaró para reducir el área de estudio a la zona quemada y se procedió a calcular el NDVI y posteriormente a reducir para encontrar el valor mediano. 

</br>

El procedimiento se repitió para calcular las medianas de las distintas regiones:


| **zona** | **NDVI mediano 2021** |
| ---- | ----------------- |
| Corrientes | 0.4961 |
| Esteros del Iberá | 0.4727 |
| Parque nacional Iberá | 0.4258 |
| Parque nacional Mburucuyá | 0.3655 |
| Parque provincial Iberá | 0.3867 |
| Reserva provincial Iberá | 0.4414 |

</br>

Para realizar el cálculo de HRT se tomaron 5 momentos de referencia: 27 de febrero, 31 de marzo, 30 de abril, 31 de mayo y 30 de junio.

Para cada fecha se generó un mosaico sobre un periodo de a lo sumo 45 días previos a la fecha, donde se descartaron imágenes con gran presencia de nubes y se  priorizó por fecha más cercana a la fecha objetivo para cada una (en general, las fotos están dentro del mismo mes. Solo en marzo un ‘tile’ de la imágen corresponde a febrero). 

Se aislaron las zona de incendio dentro de cada región de interés (por enmascaramiento), luego se clasificó por umbral el área correspondiente a un NDVI mayor o igual a la mediana 2021 de cada región, y finalmente se calculó el área total vectorizada.

</br>

Febrero, imágen base y resultado:

</br></br>
<p align="center">
    <img src="./gen/imagenes/base_hrt_feb.png?raw=true" alt="febrero base hrt." width="250"/>
    <img src="./gen/imagenes/resultado_hrt_feb.png?raw=true" alt="febrero resultado hrt." width="250"/>
</p>
</br></br>

Las zonas grises corresponden al área quemada. Las verdes al área que es igual o superior a la mediana del 2021 para la totalidad de corrientes. 

Vale la pena notar que en el periodo para febrero, a pesar de ser el mismo mes en que ocurrieron los incendios, se registran algunos valores iguales o por encima de la media del 2021 (si bien pocos). Esto tiene que ver con la intensidad del fuego en esas zonas en particular. 

</br>

Marzo, imágen base y resultado:

</br></br>
<p align="center">
    <img src="./gen/imagenes/base_hrt_mar.png?raw=true" alt="marzo base hrt." width="250"/>
    <img src="./gen/imagenes/resultado_hrt_mar.png?raw=true" alt="marzo resultado hrt." width="250"/>
</p>
</br></br>

Abril, imágen base y resultado:

</br></br>
<p align="center">
    <img src="./gen/imagenes/base_hrt_abr.png?raw=true" alt="abril base hrt." width="250"/>
    <img src="./gen/imagenes/resultado_hrt_abr.png?raw=true" alt="abril resultado hrt." width="250"/>
</p>
</br></br>

Mayo, imágen base y resultado:

</br></br>
<p align="center">
    <img src="./gen/imagenes/base_hrt_may.png?raw=true" alt="mayo base hrt." width="250"/>
    <img src="./gen/imagenes/resultado_hrt_may.png?raw=true" alt="mayo resultado hrt." width="250"/>
</p>
</br></br>

Junio, imágen base y resultado:

</br></br>
<p align="center">
    <img src="./gen/imagenes/base_hrt_jun.png?raw=true" alt="junio base hrt." width="250"/>
    <img src="./gen/imagenes/resultado_hrt_jun.png?raw=true" alt="junio resultado hrt." width="250"/>
</p>
</br></br>

En conclusión, las áreas estimada que presentan indicios de recuperación (>= mediana ndvi 2021 para cada zona en particular), por fecha, son:

</br>

| fecha | Corrientes | Esteros del Iberá | Parque nacional Iberá | Parque nacional Mburucuyá | Parque provincial Iberá | Reserva provincial Iberá |
|------ | ---------- | ----------------- | --------------------- | ------------------------- | ----------------------- | ------------------------ |
| 02-27 | 8938 ha | 9249 ha | 11211 ha | 0.7 ha | 3932 ha | 13561 ha |
| 03-31 | 113042 ha | 72426 ha | 31768 ha | 15 ha | 8075 ha | 50536 ha |
| 04-30 | 508014 ha | 260758 ha | 65277 ha | 31 ha | 23067 ha | 145396 ha |
| 05-31 | 634275 ha | 346621 ha | 76366 ha | 44 ha | 25580 ha | 170928 ha |
| 06-30 | 560726 ha | 316102 ha | 73376 ha | 40 ha | 23853 ha | 160132 ha |

</br></br>

En porcentaje, respecto al total quemado:

</br>

| fecha | Corrientes | Esteros del Iberá | Parque nacional Iberá | Parque nacional Mburucuyá | Parque provincial Iberá | Reserva provincial Iberá |
|------ | ---------- | ----------------- | --------------------- | ------------------------- | ----------------------- | ------------------------ |
| 02-27 | 0.86% | 1.60% | 11.93% | 1.01% | 11.25% | 5.70% |
| 03-31 | 10.82% | 12.55% | 33.81% | 21.83% | 23.09% | 21.26% |
| 04-30 | 48.64% | 45.18% | 69.46% | 45.30% | 65.96% | 61.16% |
| 05-31 | 60.74% | 60.05% | 81.26% | 63.24% | 73.15% | 71.90% |
| 06-30 | 53.69% | 54.76% | 78.08% | 57.71% | 68.21% | 67.36% |

</br>

Es decir, entre finales de abril y mayo se habría superado el umbral de recuperación temprana. Un HRT de entre 60 y 90 días. 

La investigación se realizó también con el dataset de MODIS (que mide niveles de NDVI cada 16 días, pero en una resolución menor: 250mts). En este caso, el resultado da indicios que para mediados de abril ya se habría alcanzado la recuperación temprana en la mayoría de las zonas (salvo el Parque Nacional Mburucuyá), los datos se encuentran en `./gen/analisis`. 






