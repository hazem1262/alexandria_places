// this SPA displays some places in alexandria, egypt
//using knockout.js, foursquare api and google maps apis


// initializing our app

function initAll() {
    
            // the initial places
            initialLocations = [
                    {
                        name: 'Citadel of Qaitbay',
                        latlng: {lat: 31.21257, lng: 29.883932}
                    },
                    {
                        name: 'princess Aisha Fahmys Palace',
                        latlng: {lat: 31.242206, lng: 29.961133}
                    },
                    {
                        name: 'Montaza Palace',
                        latlng: {lat: 31.288497, lng: 30.01597}
                    },
                    {
                        name: 'Royal Jewelry Museum)',
                        latlng: {lat: 31.240558, lng: 29.96343}
                    },
                    {
                        name: 'El Safa Palace',
                        latlng: {lat: 31.244237, lng: 29.964152}
                    },
                    {
                        name: 'Alexandria Stadium',
                        latlng: {lat: 31.196668, lng: 29.914183}
                    },
                    {
                        name: 'Roman Auditorium ("Theatre") and Bathhouse',
                        latlng: {lat: 31.194512, lng: 29.905219}
                    },
                    {
                        name: 'Al Qaaed Ibrahim Basha Mosque',
                        latlng: {lat: 31.203003, lng: 29.903864}
                    },
                    {
                        name: 'Bibliotheca Alexandrina',
                        latlng: {lat: 31.209722, lng: 29.909403}
                    },
                    {
                        name: 'United Kingdom Consulate',
                        latlng: {lat: 31.22502, lng: 29.955695}
                    },
                ];
        
        
            initializeMap();

            myViewModel = new controller();

            ko.applyBindings( myViewModel );

            myViewModel.initialize();
        
}

function errorInitAll() {
    alert("Error loading Google Maps API library");
}



//the third party data
// loading the foursquare content

function loadFoueSquareContent(index){
    // the latitude of the place
    var placeLat  = myViewModel.locations()[index]().latlng.lat;  
    
    // the longitude of the place
    var placeLng  = myViewModel.locations()[index]().latlng.lng;  
    
    // the name of the place
    var placeName = myViewModel.locations()[index]().name;        
    var url = 'https://api.foursquare.com/v2/venues/search' +
                '?client_id=0UK5OMAR5R4XHPCONM3NE1KYGYV4A1M25UI32FZTY2GTWDRD' +
                '&client_secret=JNSRTD2VV12OGADYVU2JKP3SNO253DHIZ2JW0V411BCVJA4K' +
                '&ll=' + placeLat + ',' + placeLng +
                '&query=' + placeName +
                '&v=20170610&m=foursquare';
    
    // initialize the content of the info window
    var content = '';
    
    // when reading the json object from the foursquare
    $.getJSON(url).done(function(response1) {
        var url = 'https://api.foursquare.com/v2/venues/' +
                    response1.response.venues[0].id +
                    '?client_id=0UK5OMAR5R4XHPCONM3NE1KYGYV4A1M25UI32FZTY2GTWDRD' +
                    '&client_secret=JNSRTD2VV12OGADYVU2JKP3SNO253DHIZ2JW0V411BCVJA4K' +
                    '&v=20170610&m=foursquare';
        $.getJSON(url).done(function(response2) {
            
            // add the url to the content
            if(response2.response.venue.shortUrl){
                
                content += '<a href=" ' + response2.response.venue.shortUrl + '" target="_blank">';
            }
            
            // add the name to the content if availaple
            if(response2.response.venue.name){
                content += '' + response2.response.venue.name;
                }
            if(response2.response.venue.shortUrl){
                content += '</a>';
            }
            
            // add the rating of the place
            if(response2.response.venue.rating) {
                content += '<br>Rating: ' + response2.response.venue.rating;
            }
            
            // add the phonr number
            if (response2.response.venue.contact.formattedPhone !== null && response2.response.venue.contact.formattedPhone !== undefined) {
              content += '<br>Phone: ' + response2.response.venue.contact.formattedPhone + ' ';
            } else {
              content += '<br>Phone: not available' + ' ';
            }
            
            // the photo of the place
            if(response2.response.venue.bestPhoto) {
                content += '<br><img src=" ' + response2.response.venue.bestPhoto.prefix + '150x150' + response2.response.venue.bestPhoto.suffix + '">';
            }
            
            myViewModel.saveFourSquareContent(index, content);
        }).fail(function(jqXHR, status) {
            myViewModel.hideInfo();
            alert("Requesting third-party data failed: " + status);
        });
    }).fail(function(jqXHR, status) {
        myViewModel.hideInfo();
        alert("Requesting third-party data failed: " + status);
    });
}







// the view model of our app

var controller = function(){
    var self = this;
    
    self.markers = [];  //initialize the markers
    self.infowindow = new google.maps.InfoWindow();  //our info window
    var locations = [];    //initialize the locations

    // Fill the locations
    // Creating filtered objects
    for (var x=0;x<initialLocations.length;x++) {
        
        initialLocations[x].filtered = ko.observable(1);
        initialLocations[x].thirdPartyContent = '';
        locations[x] = ko.observable(initialLocations[x]);
        locations[x].subscribe(self.changedHandlerPlace);
    }

    self.locations = ko.observableArray(locations);    //save the location to an observable array

    
    
    

    // the filter object
    self.filterVal = ko.observable('');             //use the ko observable to save the filterval
    
    self.filterVal.subscribe(function (newVal) {    // the filter function
        var searchName = newVal.toLowerCase().trim();    //manipulating the name of the place
        var locs = self.locations().slice();        //use the slice function
        for (var x=0;x<self.locations().length;x++) {
            
            if(searchName==='' || self.locations()[x]().name.toLowerCase().indexOf(searchName) >= 0){
                self.locations()[x]().filtered(1);
            } else {
                self.locations()[x]().filtered(0);
            }
            self.changedHandlerPlace(self.locations()[x]());
        }
    });

    // change the handeler place
    self.changedHandlerPlace = function(newLocation){
        var index = self.locationIndex(newLocation);                          //requesting the index of the new location
        self.markers[index].setVisible(newLocation.filtered() ? true : false);  //set the marker to true or false
        self.hideInfo();                                                  //hide the info window
    };
    
    // hiding the info window
    self.hideInfo = function(){
        
        self.infowindow.close();    // close the info window
        
    };

    
    
    
    // Create the function "clickLocation"
    self.clickLocation = function(location){
        var index = self.locationIndex(location);  // request the index of location
        self.LocationByIndex(index);
    };

    // Create a function to return the index of location
    self.locationIndex = function(location){
        var index = -1;
        for (var x=0;x<self.locations().length;x++) {
            if(self.locations()[x]().latlng.lat == location.latlng.lat && 
                self.locations()[x]().latlng.lng == location.latlng.lng){
                return x;
            }
        }
    };

    

    // Create the function "LocationByIndex"
    self.LocationByIndex = function(index){
        var marker = self.markers[index];
        dropMarker(marker);
        self.showInfoWindowByIndex(index);
    };
    
    // google event location function
    self.locationByGoogleEvent = function(e){
        var index = self.locationIndex({latlng: {lat: e.latLng.lat(), lng: e.latLng.lng()}});   //request the index
        self.LocationByIndex(index);                                                            //set the location
    };

    // Create the function "saveFourSquareContent"
    self.saveFourSquareContent = function(index, content){
        
        var newLocation = self.locations()[index]();                            //get the location
        newLocation.thirdPartyContent = content;                                //get the info of the place
        self.locations.replace(self.locations()[index](), newLocation);         //replace the info    
        self.showInfoWindowByIndex(index);                                      // show the info window
    };
    //  reset the markers
    self.locations.subscribe(function (newLocations) {
        clearMarkers(self.markers); // clearing the markers
        self.markers = [];
        var myBounds = new google.maps.LatLngBounds();    //the bounds object
        
        for (var x=0;x<newLocations.length;x++) {
            
            if(newLocations[x]().filtered()) {
                myBounds.extend(newLocations[x]().latlng);
            }
            
            self.markers[x] = new google.maps.Marker({
                map: (newLocations[x]().filtered() ? map : null),
                title: newLocations[x]().name,
                position: newLocations[x]().latlng,
                animation: google.maps.Animation.DROP,
            });
            
            // updating the latlng
            // search for location in locations obsArray
            var latLng = self.markers[x].getPosition();
            newLocations[x]().latlng = {lat: latLng.lat(), lng: latLng.lng()};
            self.markers[x].addListener('click', self.locationByGoogleEvent);
        }
        
        if(myBounds.getCenter().lat()!==0 && myBounds.getCenter().lng()!==0){
            //fitting the bounds
            map.fitBounds(myBounds);
            google.maps.event.addDomListener(window, 'resize', function() {
            map.fitBounds(myBounds);
            });
        }
    });
    

    // initialize function 
    self.initialize = function(){
        self.locations.valueHasMutated();           //mute the vale of the location
    };
    
    //  create a function to show the info
    self.showInfoWindowByIndex = function(index){
        var location = self.locations()[index]();   //request the location
        var marker = self.markers[index];           //set the marker to that location
        
        //check if the place has its third party content or not
        if(!location.thirdPartyContent) {
            loadFoueSquareContent(index);
            self.infowindow.setContent('<div id="infoWindow" title="' + location.name + '">' + location.name + '<br>Loading 3rd-party data ...' + '</div>');
        } else {
            self.infowindow.setContent('<div id="infoWindow" title="' + location.name + '">' + location.thirdPartyContent + '</div>');
        }
        self.infowindow.open(map, marker);
    };
    

};



// initializing the map to alexandria

function initializeMap() {
    // initialize the map with the first place
    map = new google.maps.Map($('.map')[0], {
        zoom: 13,                                       //set the zoom
        center: initialLocations[0].latlng,             //set the center of the map
        mapTypeControl: false
    });
}

// clearing the markers
function clearMarkers(markers) {
    for (var x=0;x<markers.length;x++) {
        markers[x].setVisible(false);
    }
}

// add drop animation to the marker

function dropMarker(marker) {
    marker.setAnimation(google.maps.Animation.DROP);
    setTimeout(function(){ marker.setAnimation(null); }, 1300);
}



