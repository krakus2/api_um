const api_key = "2797b5a7-48f4-42a3-a062-bf8cf76357d9"
const mapsApi_key = "AIzaSyDl4DVYLh4h_5WdJ46t9_g0zwAqw57TJUU"
console.log(api_key)

window.addEventListener('DOMContentLoaded', () => {
  const busNumber = document.querySelector('form#busForm');
  busForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const busNumber = document.querySelector('input#bus').value
    console.log(busNumber)
    getBus(busNumber)
  })
})

function getBus(busNumber){
  const object = []
  let avgLat = 0;
  let avgLng = 0;
  axios.get(`https://api.um.warszawa.pl/api/action/busestrams_get/?resource_id=f2e5503e-927d-4ad3-9500-4ab9e55deb59&apikey=${api_key}&type=1&line=${busNumber}`)
    .then(response => {
      const results = response.data.result
      results.map(elem => {
        object.push([elem.Lines, elem.Lat, elem.Lon])
        //console.log(elem.Lat)
        avgLat += elem.Lat
        avgLng += elem.Lon
      })
    }).then( () => {
      avgLat = Number(avgLat/object.length)
      avgLng = Number(avgLng/object.length)
      console.log(object, typeof(avgLat), avgLng) 
    }).then( () => {
      initMap(object, avgLat, avgLng)
    });
}

function initMap(object, avgLat, avgLng) {
  var myLatLng = {lat: avgLat, lng: avgLng};
  //var myLatLng = {lat: -29.363, lng: 131.044};

  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: myLatLng
  });

  var infowindow = new google.maps.InfoWindow();
  let marker = 0;

  for (let i = 0; i < object.length; i++) {
     marker = new google.maps.Marker({
       position: new google.maps.LatLng(object[i][1], object[i][2]),
       map: map
     });

   google.maps.event.addListener(marker, 'click', (function(marker, i) {
         return function() {
           infowindow.setContent(object[i][0]);
           infowindow.open(map, marker);
         }
       })(marker, i));
  }

}
