var db = firebase
  .initializeApp({
    databaseURL: "https://space-czar.firebaseio.com/"
  })
  .database();

var realtimeRef = db.ref("realtime");
var forecastRef = db.ref("forecast");
var bookingsRef = db.ref("bookings");
var userRef = db.ref("user");
var interval;

var app = new Vue({
  el: "#app",
  data() {
    return {
      counter: 0,
      occupancy: 0,
      locations: ["Central Library", "Mac Commons", "Study Room 1"],
      userName: "",
      hangouts: "",
      timeOn: true,
      tempVal: "",
      myBookings: "", // users personal bookings
      bookings: "", // places that are available to show on html so user can choose which location they want
      regionLoc: "",
      //regionBook: ""
      //databaseURL:
    };
  },
  mounted() { this.getRegionfromLoc() },
  methods: {
    increment: function () {
      this.counter++;
    },
    // get today's date DDMMYYYY
    getTodayDate: function () {
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
    getMyTime: function () {
      var today = new Date();
      var time =
        //today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        //today.getMinutes() + "" + today.getSeconds();
        today.getHours() + "00";
      return time;
    },
    enter: function (region, location, room, pax) {
      realtimeRef
        .child(region)
        .child(location)
        .child(room)
        .update({ "in use": pax });
    },
    exit: function () {
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
    printData: function () {
      this.hangouts = userRef.child("0").child("hangouts");
      console.log(userRef.child("0").child("hangouts"));
    },
    // get data for hangouts pie chart
    get: function () {
      var arr = [];
      userRef
        .child("0")
        .child("hangouts")
        .once("value", function (openHangouts) {
          openHangouts.forEach(function (openHangouts) {
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
    update_data: async function (location, date, time, pax) {
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
    formatDate: function (date) {
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
    formatTime: function (date) {
      var format_time = date.getHours().toString() + "00";
      return format_time;
    },
    //occupied: finds the no. of occupants in a given location, time and date
    //formatDate: the date has been formated in the required form. Pass a date
    //object through formatDate before using this
    occupied: async function(location, formatDate, time) {
      //uncommment below when testing
      //location = "Central Library";
      //formatDate = 13112018;
      //time = 2100;
      var temp = [];
      await forecastRef
        .child("General")
        .child(location)
        .child("study rooms")
        .child("Data")
        .child(formatDate)
        .child(time)
        .once("value", function(snap) {
          temp.push(snap.val());
          //console.log(snap.val());
          //console.log(temp);
        });
      //console.log("temp");
      //console.log(await temp);
      return temp;
    },

    //forecasting model: the model takes in a string location, and a date object
    forecast: async function(location, time) { //change to date, instead of time when done with testing
      const date = new Date(2018, 11, 12, 22, 0, 30, 0);
      var i;
      var total = 0;
      var time = 2200; //can be derived from date later on
      for (i = 0; i < 4; i = i + 1) {
        var tempDate = new Date();
        await tempDate.setDate((await date.getDate()) - 7 * i);
        console.log("tempDate: " + tempDate);
        var formatedDate = await this.formatDate(tempDate);
        console.log(formatedDate);
        var num = await this.occupied(location, formatedDate, time);
        console.log(num[0]);
        total = total + num[0];
        //console.log(total)
      }
      console.log(total);
      this.occupancy = Math.floor(total/3);
      //console.log(this.occupancy);
      return total;
      //var time = this.formatTime(date); //find the hour of the date object
      //var total = 0;
      //var curr_date;
      //for (curr_date in dates) {
      //console.log(curr_date)
      //var num = await this.occupied(location, curr_date, 2200);
      //console.log(num);
      //total = total + this.occupancy;
      //}
      //var avg = total / 4;
      //return avg;
    },
    // generate random values, push current value from realtime to forecast, push new value to realtime
    createRandom: function () {
      var date = this.getTodayDate();
      var time = this.getMyTime();
      realtimeRef.once("value", function (snapshot) {
        //console.log(snapshot.val());
        snapshot.forEach(function (snapshot) {
          // for each region (snapshot is the region)
          var region = snapshot.key;
          console.log(region);
          console.log(snapshot.val());
          var obj = snapshot.val();
          var key = Object.keys(obj);
          console.log(key);
          // for each location (loc is the location)
          key.forEach(function (loc) {
            console.log(loc);
            // for each child node in each location
            snapshot.child(loc).forEach(function (locSnapshot) {
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
    randomTime: function () {
      if (this.timeOn) {
        const self = this;
        interval = setInterval(function () {
          self.createRandom();
        }, 3600000);
        console.log("setInterval");
      } else {
        clearInterval(interval);
        console.log("clearInterval");
      }
    },
    // start the timer
    startRandomTime: function () {
      this.timeOn = true;
      this.randomTime();
    },
    // stop the timer
    stopRandomTime: function () {
      this.timeOn = false;
      this.randomTime();
    },
    // retrieve data to get it to show on html
    tempFn: function () {
      var temp = [];
      realtimeRef
        .child("General")
        .child("Central Library")
        .child("study rooms")
        .once("value", function (snapshot1) {
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
      var passed = [];
      userRef
        .child("0")
        .child("bookings")
        .once("value", function (openBookings) {
          openBookings.forEach(function (openBookings) {
            // openBookings is the date
            var date = openBookings.key;
            //console.log(date); //16112018
            var formatted = date.slice(2, 4) + "/" + date.slice(0, 2) + "/" + date.slice(4, 8);
            var formatted = new Date(formatted);
            var now = new Date();
            now.setHours(0, 0, 0, 0);
            if (formatted < now) {
              passed.push(date);
              //console.log(passed);
            } else {
              var obj = openBookings.val();
              //console.log(obj); //Object {1300-1400: "COM1 DR4"}
              var keys = Object.keys(obj);
              //console.log(keys) // array of timings
              keys.forEach(function (time) {
                //console.log(time); // 1300-1400
                var temp = {}
                var place = openBookings.child(time).val();
                //console.log(place); // location of booking
                temp.date = date;
                temp.time = time;
                temp.location = place;
                arr.push(temp)
              });
            }
          });
          // remove bookings with date that is over
          //openBookings
        });
        console.log("passed: "+passed);
      this.myBookings = arr;
      return arr;
    },
    // adds number of available disc rooms for booking to this.bookings
    // used for showing how many rooms each location is avail to book
    bookingsAvail(userDate, userTime) {
      var userDate = "15112018";
      var userTime = "1400";
      var arr = [];
      bookingsRef.once("value", function (openBookings) {
        // gets the region
        openBookings.forEach(function (openBookings) {
          console.log(openBookings.val()); //Object {Central Library: Object}
          var obj = openBookings.val();
          var key = Object.keys(obj);
          console.log(key); //["Central Library"]
          // loop through each location
          var location = "";
          var tempCount = 0; // store the # of rooms available for each loc
          var temp = {};
          key.forEach(function (loc) {
            console.log(openBookings.child(loc).val()); //Object {DR1: Object, DR2: Object}
            var rooms = openBookings.child(loc).val();
            var roomKey = Object.keys(rooms);
            console.log(roomKey); //["DR1", "DR2"]
            // loop through each discussion room
            roomKey.forEach(function (room) {
              var currDate = openBookings
                .child(loc)
                .child(room)
                .val();
              var storedDate = Object.keys(currDate);
              console.log(storedDate); //["15112018"]
              // loop through each date
              storedDate.forEach(function (day) {
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
                  currTimeKey.forEach(function (time) {
                    if (time == userTime) {
                      var value = openBookings
                        .child(loc)
                        .child(room)
                        .child(userDate)
                        .child(userTime)
                        .val();
                      //console.log(value); // "" or nusnetID
                      // time is free -> store data!
                      if (value == "") {
                        tempCount += 1;
                        location = loc;
                      }
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
    // to be used when user makes a booking
    // takes in the user, date, time, location, region of booking
    makeBooking: function (bdate, btime, bloc, bregion) {
      var bdate = "15112018";
      var btime = "1400";
      var bloc = "Central Library";
      var bregion = this.regionLoc;
      var self = this;
      //console.log(this.region);
      var availRoom = [];
      var temp = {};
      // retrieve available room from bloc
      //var bregion = //this.getRegionfromLoc(bloc).then(() => {
      bookingsRef
        .child(bregion)
        .child(bloc)
        .once("value", function (snapshot) {
          var obj = snapshot.val();
          var rooms = Object.keys(obj);
          //console.log("try")
          rooms.forEach(function (something) {
            var user = snapshot
              .child(something)
              .child(bdate)
              .child(btime)
              .val();
            //console.log(something); // returns the loc node
            // post to bookings node if room is free at that time
            if (user === "") {
              //availRoom.push(something);
              temp.free = something;
              //availRoom.push(temp);
              //console.log(availRoom);
              bookingsRef
                .child(bregion)
                .child(bloc)
                .child(something)
                .child(bdate)
                .update({
                  [btime]: "" // E8646580
                  //this.userName
                });
              //console.log(availRoom);
              //{break;}
              //this.myBookings = availRoom;
            }
            //availRoom.push(temp);
            //console.log("this first" + availRoom);
            //console.log("THIS second " + availRoom)
          });
          availRoom.push(temp);
          //console.log(temp['free']);
          //console.log(availRoom);
          //console.log(self.myBookings);
          self.myBookings = availRoom;
          //console.log(self.myBookings);

          // post to user node
          userRef
            .child("0")
            .child("bookings")
            .child(bdate)
            .update({ [btime]: bloc + " " + temp['free'] });
        });
      //return this.getRegionfromLoc(bloc);
      //});
    },
    // cancel bookings
    // will take in date, time, place (region + loc + room)
    cancelBooking(bdate, btime, bplace) {
      //var bplace = "COM COM1 DR2";
      var len = bplace.length
      var room = bplace.slice(len - 3, len);
      var location = bplace.slice(4, len - 4);
      var region = this.getRegionfromBooking(bplace.slice(0, 3));
      //console.log(region);
      // remove booking from user bookings node
      userRef.child("0").child("bookings").child(bdate).child(btime).remove();
      // set booking for that location, date and time under bookings node as free
      bookingsRef.child(region).child(location).child(room).child(bdate).child(btime).set("");
    },
    // takes in the location and returns the region loc is in
    getRegionfromLoc: function (location) {
      //return new Promise(function(resolve, reject){
      var location = "Central Library";
      var self = this;
      //var final;
      realtimeRef.once("value", function (snapshot) {
        var obj = snapshot.val();
        var reg = Object.keys(obj);
        //console.log(reg);
        var theOne;
        reg.forEach(function (reg) {
          var obj = snapshot.child(reg).val();
          //console.log(obj);
          //var loc = Object.keys(obj);
          //console.log(obj.hasOwnProperty(location));
          if (obj.hasOwnProperty(location)) {
            //console.log("THIS IS THE ONE "+region);
            theOne = reg;
            //self.region = region;
            //console.log(this.region);
            //return region;
          }
        });
        //console.log(theOne);
        self.regionLoc = theOne;
        //final = theOne
        //console.log(final);
        //console.log(self.region);
        return theOne;
      });
      //console.log(final.key);
      //})

    },
    getRegionfromBooking(location){
      //var location = "GEN";
      var text = "";
      switch (location) {
        case "ASS":
          text = "Arts and Social Sciences";
          break;
        case "BIZ":
          text = "Business";
          break;
        case "COM":
          text = "Computing";
          break;
        case "DEN":
          text = "Dentistry";
          break;
        case "SDE":
          text = "Design and Environment";
          break;
        case "ENG":
          text = "Engineering";
          break;
        case "GEN":
          text = "General";
          break;
        case "MED":
          text = "Medicine";
          break;
        case "MUS":
          text = "Music";
          break;
        case "SCI":
          text = "Science";
          break;
        default:
          text = "Faculty";
      }
      //this.regionBook = text;
      //console.log(this.regionBook);
      return text;
    },
  }
});
