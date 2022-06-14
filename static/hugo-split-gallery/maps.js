var Promise = window.Promise || JSZip.external.Promise;

var map = null;
var bounds = null;
var currentColor = -1;
var colors = ['#000'];

function initMap() {
  if ($("#mapid").length === 0) return;

  map = L.map('mapid');
  L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
    attribution: `Map tiles by <a href="https://stamen.com">Stamen Design</a>,
                  under <a href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &#124;
                  Map data by <a href="https://openstreetmap.org">OpenStreetMap</a> contributors`,
    subdomains: 'abcd',
    minZoom: 2,
    maxZoom: 15,
    ext: 'jpg'
  }).addTo(map);
}

function addBounds(o) {
  bounds = (bounds === null) ? o.pad(0.5) : bounds.extend(o.pad(0.5));
}

function addGPX(track, color) {
  var start = null;
  var end = null;
  var featuregroup = L.featureGroup();
  var layers = L.geoJSON(track).getLayers();

  for (let i = 0; i < layers.length; i += 1) {
    if (layers[i] instanceof L.Polyline) {
      layers[i].setStyle({ opacity: 0.5, weight: 3, color: color });
      layers[i].addTo(featuregroup);
      var latlngs = layers[i].getLatLngs();

      if (start === null) {
        start = latlngs[0];
        x = L.marker(start, {
          icon: L.icon({ iconUrl: '/crow-solid.svg', iconSize: [25, 20], iconAnchor: [15, 20] }),
        }).addTo(featuregroup);
      }
      end = latlngs[latlngs.length - 1];
    }
  }

  if (start && end) {
    featuregroup.addTo(map);
    addBounds(featuregroup.getBounds());
    return featuregroup;
  }

  console.warn("Empty track");
  return null;
}

function addMarker(latlng, idx) {
  var marker = L.marker(latlng, {
    icon: L.icon({ iconUrl: '/camera-solid.svg', iconSize: [15, 15] })
  }).on('click', function () {
    $('.split-grid a').eq(idx).trigger('click');
  }).addTo(map);

  addBounds(latlng.toBounds(100));

  $('.split-grid a').eq(idx).hover(function () {
    map.flyTo(marker.getLatLng());
    marker.setOpacity(1);
  }, function () {
    marker.setOpacity(null);
    if (bounds) map.flyToBounds(bounds);
  });

  return marker;
}

function nextColor() {
  currentColor = (currentColor + 1) % colors.length;
  return currentColor;
}

function add(gpxs, markers, index) {
  var a = [];
  var b = null;

  $.each(gpxs, function (i, gpx) {
    var featuregroup = addGPX(gpx[0], colors[nextColor()]);
    if (featuregroup) {
      var featuregroupbounds = featuregroup.getBounds().pad(0.5);
      featuregroup.bindPopup(gpx[1]);
      b = (b === null) ? featuregroupbounds : b.extend(featuregroupbounds);
      a = a.concat(featuregroup);
    }
  });

  $.each(markers, function (i, marker) {
    var m = addMarker(marker[0], marker[1]);
    if (marker.length > 2) m.bindPopup(marker[2]);
  });

  if (index !== undefined && gpxs.length > 0) {
    $('.split-grid a').eq(index).hover(function () {
      map.flyTo(b.getCenter());
      a.forEach(element => element.invoke('setOpacity', 1));
    }, function () {
      a.forEach(element => element.invoke('setOpacity', null));
      if (bounds) map.flyToBounds(bounds);
    });
  }
}

function finalizeMap() {
  if (bounds) map.fitBounds(bounds);
}
