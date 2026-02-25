
//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::                                                  :::
//:::  Passed to function:                                                    :::
//:::    lat1, lon1 = Latitude and Longitude of point 1 (in decimal degrees)  :::
//:::    lat2, lon2 = Latitude and Longitude of point 2 (in decimal degrees)  :::
//:::    unit = the unit you desire for results                               :::
//:::           where: 'M' is statute miles (default)                         :::
//:::                  'K' is kilometers                                      :::
//:::                  'N' is nautical miles                                  :::
//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
export const getDistance = (lat1, lon1, lat2, lon2, unit = 'K') => {
  if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
}

export const getCurrentLocation = async () => {
  //console.log('llamando a getCurrentLocation');
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      geolocation => {
        console.log('llamando a getCurrentLocation', geolocation);
        resolve({
          lat: geolocation.coords.latitude,
          lng: geolocation.coords.longitude,
          accuracy: geolocation.coords.accuracy
        });
      },
      (e) => {
        console.log('Error CurrentLocation', e);
        reject(null);
      }
    );
  });
};

export const getCoordinates = async request => {
  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder
      .geocode(request)
      .then(result => {
        const { results } = result;
        const obj = {
          address: results[0].formatted_address,
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        };
        resolve(obj);
      })
      .catch(() => {
        reject(null);
      });
  });
};