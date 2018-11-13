var db = firebase
  .initializeApp({
    databaseURL: "https://space-czar.firebaseio.com/"
  })
  .database();

var realtimeRef = db.ref("realtime");
var forecastRef = db.ref("forecast");
var bookingsRef = db.ref("bookings");
var user = db.ref("user");
var interval;

var app = new Vue({
  el: "#app",
  data: {
    counter: 0,
    occupancy: [0],
    locations: ["Central Library", "Mac Commons", "Study Room 1"],
    hangouts: "",
    timeOn: true,
    tempVal: "",
    myBookings: "", // users personal bookings
    bookings: "" // places that are available to show on html so user can choose which location they want
    //databaseURL:
  },
  methods: {
    increment: function() {
      this.counter++;
    },
    // get today's date DDMMYYYY
    getTodayDate: function() {
      var today = new Date();
      var date =
        today.getDate() +
        "" +
        (today.getMonth() + 1) +
        "" +
        today.getFullYear();
      return date;
    },
    // get current time in terms of hour HH00
    getMyTime: function() {
      var today = new Date();
      var time =
        //today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        //today.getMinutes() + "" + today.getSeconds();
        today.getHours() + "00";
      return time;
    },
    enter: function(region, location, room, pax) {
      realtimeRef
        .child(region)
        .child(location)
        .child(room)
        .update({ "in use": pax });
    },
    exit: function() {
      console.log(forecastRef.child());
      forecastRef.child(forecast[location]).push({
        //Data: this.occupant // mot sure if correct
      });
      // remove from realtime
      realtimeRef
        .child(realtime[location])
        .child("discussion rooms")
        .child("in use")
        .remove();
    },
    printData: function() {
      this.hangouts = user.child("0").child("hangouts");
      console.log(user.child("0").child("hangouts"));
    },
    // get data for hangouts pie chart
    get: function() {
      var arr = [];
      user
        .child("0")
        .child("hangouts")
        .once("value", function(openHangouts) {
          openHangouts.forEach(function(openHangouts) {
            var val = openHangouts.val();
            var temp = [openHangouts.key, openHangouts.val()];
            console.log(temp);
            arr.push([openHangouts.key, openHangouts.val()]);
          });
          console.log(arr);
        });
      this.hangouts = arr;
      return arr;
    },
    //update_data: helps store historical data for forecasting
    update_data: async function(location, date, time, pax) {
      //uncomment below when testing
      //var location = "Central Library"
      //var date = "26102018"
      //var pax = 500
      //var time = 1700
      forecastRef
        .child("General")
        .child(location)
        .child("study rooms")
        .child("Data")
        .child(date)
        .update({ [time]: pax });
    },
    //formatDate: takes in date objects and converts them into required
    //string format for storing into firebase
    formatDate: function(date) {
      //date = new Date();
      //date.setDate(date.getDate() - 7);
      var format_date =
        date.getDate().toString() +
        (date.getMonth() + 1).toString() +
        date.getFullYear().toString();
      return format_date;
    },
    //formatTime: takes in date objects and converts them into required string
    //format for storing into firebase
    formatTime: function(date) {
      var format_time = date.getHours().toString() + "00";
      return format_time;
    },
    //occupancy: finds the no. of occupants in a given location, time and date
    //formatDate: the date has been formated in the required form. Pass a date
    //object through formatDate before using this
    occupied: function() {
      //uncommment below when testing
      var location = "Central Library";
      var formatDate = "26102018";
      var time = 1600;
      var temp = [];
      forecastRef
        .child("General")
        .child(location)
        .child("study rooms")
        .child("Data")
        .child(formatDate)
        .child(time)
        .once("value", function(snap) {
          //console.log(snap.val());
          temp.push(snap.val());
          console.log(temp);
        });
      this.occupancy = temp;
      console.log("outside");
      console.log(temp);
      //return temp[0];
    },
    // generate random values, push current value from realtime to forecast, push new value to realtime
    createRandom: function() {
      var date = this.getTodayDate();
      var time = this.getMyTime();
      realtimeRef.once("value", function(snapshot) {
        //console.log(snapshot.val());
        snapshot.forEach(function(snapshot) {
          // for each region (snapshot is the region)
          var region = snapshot.key;
          console.log(region);
          console.log(snapshot.val());
          var obj = snapshot.val();
          var key = Object.keys(obj);
          console.log(key);
          // for each location (loc is the location)
          key.forEach(function(loc) {
            console.log(loc);
            // for each child node in each location
            snapshot.child(loc).forEach(function(locSnapshot) {
              // check if discussion rooms/study rooms node exists
              if (locSnapshot.key == "discussion rooms") {
                console.log("disc");
                //console.log(locSnapshot.child("total").val());
                var max = locSnapshot.child("total").val();
                var x = Math.floor(Math.random() * max + 1);
                // get current value in realtimeRef
                var now = locSnapshot.child("in use").val();
                // push current data to forecastRef
                forecastRef
                  .child(region)
                  .child(loc)
                  .child("discussion rooms")
                  .child("Data")
                  .child(date)
                  .update({ [time]: now });
                // create new value at realtimeRef
                realtimeRef
                  .child(region)
                  .child(loc)
                  .child("discussion rooms")
                  .update({ "in use": x });
              }
              if (locSnapshot.key == "study rooms") {
                console.log("study");
                //console.log(locSnapshot.child("total").val());
                var max = locSnapshot.child("total").val();
                var x = Math.floor(Math.random() * max + 1);
                // get current value in realtimeRef
                var now = locSnapshot.child("in use").val();
                // push current value to forecastRef
                forecastRef
                  .child(region)
                  .child(loc)
                  .child("study rooms")
                  .child("Data")
                  .child(date)
                  .update({ [time]: now });
                // generate new data for realtimeRef
                realtimeRef
                  .child(region)
                  .child(loc)
                  .child("study rooms")
                  .update({ "in use": x });
              }
            });
          });
        });
      });
      //console.log(region);
      //var x = Math.floor(Math.random() * 100 + 1);
      //console.log(x);
    },
    // timer to run random number generator
    randomTime: function() {
      if (this.timeOn) {
        const self = this;
        interval = setInterval(function() {
          self.createRandom();
        }, 3600000);
        console.log("setInterval");
      } else {
        clearInterval(interval);
        console.log("clearInterval");
      }
    },
    // start the timer
    startRandomTime: function() {
      this.timeOn = true;
      this.randomTime();
    },
    // stop the timer
    stopRandomTime: function() {
      this.timeOn = false;
      this.randomTime();
    },
    // retrieve data to get it to show on html
    tempFn: function() { 
      var temp = [];
      realtimeRef
        .child("General")
        .child("Central Library")
        .child("discussion rooms")
        .once("value", function(snapshot1) {
          temp.push(snapshot1.child("total").val());
          //console.log(snapshot1.child("total").val());
          console.log(temp);
        });
      this.tempVal = temp;
      //console.log(temp);
      //return temp;
    },
    // retrieve user's bookings data and store it as dictionary for display on html
    displayBookings() {
      var arr = [];
      user
        .child("0")
        .child("bookings")
        .once("value", function(openBookings) {
          openBookings.forEach(function(openBookings) {
            // openBookings is the date
            var date = openBookings.key;
            var obj = openBookings.val();
            //console.log(date); //16112018
            //console.log(obj); //Object {1300-1400: "COM1 DR4"}
            var keys = Object.keys(obj);
            //console.log(keys) // array of timings
            var temp = {};
            temp.date = date;
            keys.forEach(function(time) {
              //console.log(time); // 1300-1400
              var place = openBookings.child(time).val();
              //console.log(place); // location of booking
              temp.time = time;
              temp.location = place;
            });
            arr.push(temp);
          });
        });
      this.myBookings = arr;
      return arr;
    },
    // adds number of available disc rooms for booking to this.bookings
    bookingsAvail(userDate, userTime) {
      var userDate = "15112018";
      var userTime = "1500";
      var arr = [];
      bookingsRef.once("value", function(openBookings) {
        // gets the region
        openBookings.forEach(function(openBookings) {
          console.log(openBookings.val()); //Object {Central Library: Object}
          var obj = openBookings.val();
          var key = Object.keys(obj);
          console.log(key); //["Central Library"]
          // loop through each location
          var location = "";
          var tempCount = 0; // store the # of rooms available for each loc
          var temp = {};
          key.forEach(function(loc) {
            console.log(openBookings.child(loc).val()); //Object {DR1: Object, DR2: Object}
            var rooms = openBookings.child(loc).val();
            var roomKey = Object.keys(rooms);
            console.log(roomKey); //["DR1", "DR2"]
            // loop through each discussion room
            roomKey.forEach(function(room) {
              var currDate = openBookings
                .child(loc)
                .child(room)
                .val();
              var storedDate = Object.keys(currDate);
              console.log(storedDate); //["15112018"]
              // loop through each date
              storedDate.forEach(function(day) {
                var currTime = openBookings
                  .child(loc)
                  .child(room)
                  .child(day)
                  .val();
                var currTimeKey = Object.keys(currTime);
                console.log(currTimeKey); //["1500", "1600"]
                console.log(day); //15112018
                //console.log(typeof day); // string
                if (day == userDate) {
                  // if user wants this date, loop through the diff times of this date
                  // check that for the time the user wants, the number of rooms available
                  /*
                  if (!(userTime in currTimeKey)) {
                    // if that time is free
                    // store the data!
                    tempCount += 1;
                    location = loc;
                  } */
                  // to use if each hour is stored, those without bookings are stored as ""
                  currTimeKey.forEach(function(time) {
                    var value = openBookings.child(loc).child(room).child(day).child(time).val();
                    //console.log(value); // "" or nusnetID
                    if (value == ""){
                      tempCount += 1;
                      location = loc;
                    }
                  });
                }
              });
            });
          });
          temp.location = location;
          temp.available = tempCount;
          arr.push(temp);
        });
      });
      this.bookings = arr;
    },
  }
  
});
