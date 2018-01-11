const api_key = "2797b5a7-48f4-42a3-a062-bf8cf76357d9"
const mapsApi_key = "AIzaSyDl4DVYLh4h_5WdJ46t9_g0zwAqw57TJUU"
//https://api.um.warszawa.pl/api/action/dbtimetable_get/?id=e923fa0e-d96c-43f9-ae6e60518c9f3238&busstopId=7009&busstopNr=01&line=520&apikey=2797b5a7-48f4-42a3-a062-bf8cf76357d9
//https://api.um.warszawa.pl/api/action/dbtimetable_get/?id=88cd555f-6f31-43ca-9de4-66c479ad5942&busstopId=7009&busstopNr=01&apikey=2797b5a7-48f4-42a3-a062-bf8cf76357d9

window.onbeforeunload = function(){
    sessionStorage.setItem("origin", window.location.href);
}

window.onload = function(){
    if(window.location.href == sessionStorage.getItem("origin")){
        sessionStorage.clear();
    }
}

window.addEventListener('DOMContentLoaded', () => {
  initMap();
  const busForm = document.querySelector('form#busForm');
  busForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let busNumber = document.querySelector('input#bus').value
    busNumber = busNumber.trim();
    const busObject = {
      busNumber,
      replay: false
    }
    if(sessionStorage.getItem("bus") != null ){
      if(JSON.parse(sessionStorage.getItem("bus")).busNumber == busObject.busNumber){
        busObject.replay = true;
        sessionStorage.setItem("bus", JSON.stringify(busObject));
      }else{
        sessionStorage.setItem("bus", JSON.stringify(busObject));
      }
    }else{
      sessionStorage.setItem("bus", JSON.stringify(busObject));
      console.log("false")
    }

    busNumber = busNumber.split("")
    busNumber = busNumber.map(elem => {
      if(elem == elem.toLowerCase()){
        return elem.toUpperCase()
      }else{
        return elem
      }
    }).join("")

    if(busNumber.length > 3){
      busNumber = busNumber.split(" ")
      console.log(busNumber)
    }else{
      busNumber = [busNumber]
    }
    console.log(busNumber)
    getBus(busNumber)
  })

  const input = document.querySelector('input#bus');
	const span = document.querySelector('span.disapear');


		input.addEventListener('focus', function() {
			span.classList.add('move');
		})
		input.addEventListener('blur', function(e) {
			if(e.target.value.length == 0)
				span.classList.remove('move');
		})
	});

function getBus(busNumber){
  //console.log(busNumber, "busNumber z getBus")
  const object = []
  let avgLat = 0;
  let avgLng = 0;
  const urlArray = [];
  let type;
  for(let i = 0; i < busNumber.length; i++){
    (busNumber[i].length >= 3)? type = 1 : type = 2;
    urlArray.push(`https://api.um.warszawa.pl/api/action/busestrams_get/?resource_id=f2e5503e-927d-4ad3-9500-4ab9e55deb59&apikey=${api_key}&type=${type}&line=${busNumber[i]}`)
  }
  //console.log(urlArray, "urlArray")
  const promiseArray = urlArray.map( url => axios.get(url))
  axios.all(promiseArray)
  .then(function(results){
    let newResults = results.map(elem => elem.data.result)
    newResults = newResults.reduce((a, b) => a.concat(b), []);
    console.log(newResults)
    newResults.map(elem => {
      object.push([elem.Lines, elem.Lat, elem.Lon])
      avgLat += elem.Lat
      avgLng += elem.Lon
    })
    //console.log(object, "nowy obiekt")
  }).then( () => {
    avgLat = Number(avgLat/object.length)
    avgLng = Number(avgLng/object.length)
    //console.log(object, isNaN(avgLat), avgLng)
    if(object.length == 0){
      document.querySelector('#popupSpan').style.visibility = 'visible'
      //console.log("dziala visible")
    }else{
      document.querySelector('#popupSpan').style.visibility = 'hidden'
      //console.log("dziala invisible")
    }
  }).then( () => {
    initMap(object, avgLat, avgLng)
  });
}

function initMap(object, avgLat, avgLng) {
  const warsaw = {lat: 52.22977, lng: 21.01178}
  const myLatLng = {lat: avgLat, lng: avgLng};
  //var myLatLng = {lat: -29.363, lng: 131.044};

  const infowindow = new google.maps.InfoWindow();



    if(!isNaN(avgLat)){
      const map = new google.maps.Map(document.getElementById('map'), {
        zoom: ((JSON.parse(sessionStorage.getItem("bus")).replay) && JSON.parse(sessionStorage.getItem("myTemporaryPosition"))) ? (JSON.parse(sessionStorage.getItem("myTemporaryPosition")).mapZoom) : 12,
        center: ((JSON.parse(sessionStorage.getItem("bus")).replay) && JSON.parse(sessionStorage.getItem("myTemporaryPosition"))) ? (JSON.parse(sessionStorage.getItem("myTemporaryPosition")).mapCentre): myLatLng
      });


      if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(function(position) {
                const pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };

                let service ;
                const request = {
                   location: {lat: pos.lat , lng: pos.lng},
                   radius: 700,
                   types: ['bus_station']
                 };
                 service = new google.maps.places.PlacesService(map);
                 service.search(request, callback2);
              }, function() {
                handleLocationError(true, infowindow, map.getCenter());
              });
            } else {
              // Browser doesn't support Geolocation
              handleLocationError(false, infowindow, map.getCenter());
            }


    google.maps.event.addListener(map, 'zoom_changed', () => {
      const mapZoom = map.getZoom();
      const mapCentre = map.getCenter();
      const myTemporaryPosition = {
        mapZoom,
        mapCentre
      }
      sessionStorage.setItem("myTemporaryPosition", JSON.stringify(myTemporaryPosition));
    });

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
  }else{
    const map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: warsaw
    });
  }

}

function callback2(results, status) {
  const geoPOI = [];
  const geoPOI_ready = [];
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
    //  console.log(results)
      geoPOI.push(results[i]);
    }
  }
  geoPOI.forEach( (elem, i) => {
    geoPOI_ready.push([...elem.name.split(" ")])
  })
  console.log(geoPOI_ready)
}

function handleLocationError(browserHasGeolocation, infowindow, pos) {
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
}
