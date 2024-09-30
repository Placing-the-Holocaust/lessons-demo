document.addEventListener('DOMContentLoaded', function () {
    const map = new maplibregl.Map({
      container: 'map', // container id
      style: '/styles/style.json', // replace with the URL to your custom style
      center: [-122.41877447993727, 37.7977350127602], // starting position [lng, lat]
      zoom: 10 // starting zoom
    });
  });