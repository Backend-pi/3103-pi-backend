var db = firebase
  .initializeApp({
    databaseURL: "https://space-czar.firebaseio.com/"
  })
  .database();

var realtimeRef = db.ref("realtime");
var forecastRef = db.ref("forecast");
var bookingsRef = db.ref("bookings");
var rtDiscRef = db.ref("realtimeDiscussion");
var userRef = db.ref("user");
var interval;

var app = new Vue({
  el: "#app",
  data() {
    return {
      counter: 0,
      occupancy: 0,
      vacancy: 0,
      rec: 0, 
      rec_vacancy: 0,
      forecastchart: [],
      opening: 0,
      closing: 0,
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
  mounted() { 
    this.getRegionfromLoc();
    this.updateRealtime();
  },
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
            //console.log(temp);
            arr.push([openHangouts.key, openHangouts.val()]);
          });
          //console.log(arr);
        });
      this.hangouts = arr;
      return arr;
    },
    //update_data: helps store historical data for forecasting
    update_data: async function (region, location, date, time, pax) {
      //uncomment below when testing
      //var location = "Central Library"
      //var date = "26102018"
      //var pax = 500
      //var time = 1700
      forecastRef
        .child(region)
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
    occupied: async function(region, location, formatDate, time) {
      //uncommment below when testing
      //location = "Central Library";
      //formatDate = 13112018;
      //time = 2100;
      var temp = [];
      await forecastRef
        .child(region)
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

    //forecasting model: the model takes in a string location and region,
    //and a date object
    forecast: async function(region, location, date, time) {
      var i;
      var total = 0;
      //var time = await this.formatTime(date); //time derived from date object
      for (i = 0; i < 4; i = i + 1) {
        var tempDate = new Date();
        await tempDate.setDate((await date.getDate()) - 7 * i);
        console.log("tempDate: " + tempDate);
        var formatedDate = await this.formatDate(tempDate);
        console.log(formatedDate);
        var num = await this.occupied(region, location, formatedDate, time);
        console.log(num[0]);
        total = total + num[0];
        //console.log(total)
      }
      total = Math.floor(total / 3);
      //console.log(total);
      this.occupancy = total; //occupancy is used for displaying the return value on
      return total; //html, since the function return a promise object
    },

    // takes in a string location and
    // a string region and
    // a string parameter called end (accepted values: open/close)
    // for retrieval of opening/closing hours
    operatingHours: async function(region, location, end) {
      var temp = [];
      await forecastRef
        .child(region)
        .child(location)
        .child(end)
        .once("value", function(snap) {
          temp.push(snap.val());
          //console.log(snap.val());
          //console.log(temp);
        });
      if (end === "open") {
        this.opening = temp[0];
      } else if (end === "close") {
        this.closing = temp[0];
      }
      console.log(temp[0]);
      return temp[0];
    },

    display: async function(region, location, date) {
      var open = await this.operatingHours(region, location, "open");
      var close = await this.operatingHours(region, location, "close");
      var list = [];
      var time;

      for (time = open; time <= close; time = time + 100) {
        var num = await this.forecast(region, location, date, time);
        list.push([time, num]);
      }
      console.log(list);
      this.forecastchart = list;
    },
    
    //vacant: finds the number of vacant seats in realtime for a given region and location
    vacant: async function(region, location) {
      var temp = 0;
      await realtimeRef
        .child(region)
        .child(location)
        .child("study rooms")
        .child("total")
        .once("value", function (snap) {
          temp = snap.val();
          console.log(temp);
          //console.log(snap.val());
        });

      await realtimeRef
        .child(region)
        .child(location)
        .child("study rooms")
        .child("in use")
        .once("value", function (snap) {
          temp = temp - snap.val();
          //console.log(snap.val());
          console.log(temp);
        });
      console.log("temp");
      //console.log(await temp);
      this.vacancy = temp;
      return temp;
    },
    
    //Finds the place with the greatest number of vacant slots in a given region
    recommend: async function(region) {
      var locations = [];
      await realtimeRef
      .child(region)
      .once("value", function(snap) {
        //console.log(snap.val());
        locations = snap.val();
      });
      var max = 0;
      var most = [];
      var location;
      for (location in locations) {
        //console.log(location);
        var num = await this.vacant(region, location);
        console.log(num);
        if (num > max) {
          max = num;
          most = [];
          most.push(location);
         }
        //else if (num == max){
        //most.push(location);
        //}
      }
      console.log(most);
      console.log(max);
      this.rec = most;
      this.rec_vacancy = max;
    },
    
    // generate random values, push current value from realtime to forecast, push new 
    //value to realtime
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
    // takes in a region name
    // find the next nearest region that has discussion rooms available
    nearestDiscRegion(currRegion){
      var text = "";
      switch (currRegion) {
        case "Arts and Social Sciences":
          text = "General"; // or computing?
          break;
        case "Business":
          text = "Business";
          break;
        case "Computing":
          text = "Computing";
          break;
        case "Dentistry":
          text = "Science"; // or medicine?
          break;
        case "Design and Environment":
          text = "General";
          break;
        case "Engineering":
          text = "General";
          break;
        case "General":
          text = "General";
          break;
        case "Medicine":
          text = "Medicine";
          break;
        case "Music":
          text = "General";
          break;
        case "Science":
          text = "Science";
          break;
        default:
          text = "General";
      }
      //console.log(text);
      return text;
    },
    // takes in a region name, currTime
    // find the number of disc room available
    // assumes each region only has one location
    numDiscAvail: async function(r, time){
      var r = "Computing";
      var time = "1400";
      var finalNum;
      var loc;
      await rtDiscRef.child(r).once('value', function(snap){
        var obj = snap.val();
        loc = Object.keys(obj);
      });
      console.log(loc);
      rtDiscRef.child(r).child(loc).once('value', function(snap){
        // continue on from here
      });
    },
    // recommendation algo for discussion rooms
    recomDisc(){},
    // write to realtimeBookings node from bookings node
    // when date = today and time = this hour
    updateRealtime() {
      // get curr date and time
      var today = this.getTodayDate();
      console.log(today);
      var thisTime = this.getMyTime();
      console.log(thisTime);
      bookingsRef.once('value', function (openBookings) {
        // openBookings are the regions
        var obj = openBookings.val();
        var reg = Object.keys(obj);
        //console.log(reg);
        reg.forEach(function (region) {
          var obj2 = openBookings.child(region).val();
          var loc = Object.keys(obj2);
          //console.log(loc);
          loc.forEach(function (location) { // doesn't loop now since each region only has one location
            var obj3 = openBookings.child(region).child(location).val();
            var rm = Object.keys(obj3);
            //console.log(rm);
            rm.forEach(function (room) {
              var obj4 = openBookings.child(region).child(location).child(room).val();
              var dt = Object.keys(obj4);
              //console.log(dt);
              var bookedDates = [];
              var updated = false;
              dt.forEach(function (date) {
                var obj5 = openBookings.child(region).child(location).child(room).child(date).val();
                var tm = Object.keys(obj5);
                //console.log(tm);
                //console.log(loc + " " + room + " " + updated);
                if ((date == today)) {
                  var bookedTime = [];
                  bookedDates.push(date);
                  tm.forEach(function (time) {
                    var user = openBookings.child(region).child(location).child(room).child(date).child(time).val();
                    //console.log(user);
                    if ((time == thisTime) && (user != "")) {
                      if (time < 1000) {
                        var newTime = '0' + time;
                        rtDiscRef.child(region).child(location).child(room).update({ [newTime]: user });
                        updated = true;
                        bookedTime.push(newTime);
                      } else {
                        rtDiscRef.child(region).child(location).child(room).update({ [time]: user });
                        updated = true;
                        bookedTime.push(time);
                      }
                    }
                    // if the time node does not exist
                    else if ((updated === false) && !(time in bookedTime)) { // && !(date in bookedDates)
                      //console.log("new condition " + loc + " " + room + " " + updated);
                      rtDiscRef.child(region).child(location).child(room).update({ [thisTime]: "" });
                      updated = true;
                      //console.log("new condition " + loc + " " + room + " " + updated);
                    }
                  });
                }
                // if date node does not exist in the loc and room and updated is still false
                // update node to be ""
                else if ((updated === false) && !(date in bookedDates)) {
                  rtDiscRef.child(region).child(location).child(room).update({ [thisTime]: "" });
                  updated = true;
                }
              });
              //console.log(loc + " " + room + " " + updated);
            });
          }); //console.log(region);
        });
      });
    },
    // increments number of hangouts in region by 1
    addHangouts(region) {
      //var region = "General";
      user.child('0').child('hangouts').once('value', function (hosnapshot) {
        var x = hosnapshot.child(region).val();
        console.log(x);
        x++;
        console.log(x);
        user.child('0').child('hangouts').update({ [region]: x });
      });
    },
    // retrieve user's bookings data and store it as dictionary for display on html
    displayBookings() {
      const self = this;
      var arr = [];
      var passed = {};
      user
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
              //passed.push(date);
              //console.log(passed);
              var loc = [];
              var obj = openBookings.val();
              var keys = Object.keys(obj);
              keys.forEach(function (time) {
                var place = openBookings.child(time).val();
                var region = place.slice(0, 3);
                loc.push(region);
              });
              passed[date] = loc;
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
          //console.log("passed: " + passed);
          var passedKeys = Object.keys(passed);
          //console.log("yo: "+passedKeys);

          passedKeys.forEach(function (pastDate) {
            var code = passed[pastDate]
            //console.log(passed[pastDate]);
            code.forEach(function (regCode) {
              var reg = self.getRegionfromBooking(regCode);
              self.addHangouts(reg); // add to hangouts
            });
            // remove from bookings node
            user.child('0').child('bookings').child(pastDate).remove();
          });
        });
      this.myBookings = arr;
      return arr;
    },
    // adds number of available disc rooms for booking to this.bookings
    // used for showing how many rooms each location is avail to book
    bookingsAvail(userDate, userTime) {
      //var userDate = "16112018";
      //var userTime = "1000";
      var arr = [];
      bookingsRef.once("value", function (openBookings) {
        // gets the region
        openBookings.forEach(function (openBookings) {
          //console.log(openBookings.val()); //Object {Central Library: Object}
          var obj = openBookings.val();
          var key = Object.keys(obj);
          //console.log("location key " + key); //["Central Library"]
          // loop through each location
          var location = key;
          var tempCount = 0; // store the # of rooms available for each loc
          var temp = {};
          //key.forEach(function (loc) {
          //console.log(openBookings.child(loc).val()); //Object {DR1: Object, DR2: Object}
          var rooms = openBookings.child(key).val();
          var roomKey = Object.keys(rooms);
          //console.log("roomKey " + roomKey); //["DR1", "DR2"]
          //console.log("length: " + roomKey.length);
          // loop through each discussion room
          roomKey.forEach(function (room) {
            var currDate = openBookings
              .child(key)
              .child(room)
              .val();
            var storedDate = Object.keys(currDate);
            //console.log(storedDate); //["15112018"]
            // if date node does not exist
            if (!(storedDate.includes(userDate))) {
              tempCount = roomKey.length;
            }
            else {
              // loop through each date
              storedDate.forEach(function (day) {
                //console.log(day);
                var currTime = openBookings
                  .child(key)
                  .child(room)
                  .child(day)
                  .val();
                var currTimeKey = Object.keys(currTime);
                //console.log(currTimeKey); //["1500", "1600"]
                //console.log(day); //15112018
                //console.log(typeof day); // string
                // if current time does not exist as a node
                //if (!(userTime in currTimeKey)){}
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
                        .child(key)
                        .child(room)
                        .child(userDate)
                        .child(userTime)
                        .val();
                      //console.log(value); // "" or nusnetID
                      // time is free -> store data!
                      if (value == "") {
                        tempCount += 1;
                        //location = key;
                        //console.log("the key: " + key)
                      } //console.log("the key: " + key + ", count: " + tempCount);
                    }
                  });
                }
              });
            }
          });
          //console.log(location);
          if (tempCount != 0) {
            temp.location = location[0];
            temp.available = tempCount;
            arr.push(temp);
          }
        });
      });
      //});
      this.bookings = arr;
    },
    // to be used when user makes a booking
    // takes in the user, date, time, location of booking
    makeBooking: function (bdate, btime, bloc) {
      var bdate = "15112018";
      var btime = "1400";
      var bloc = "Central Library";
      var bregion = this.regionLoc; // gets region from getRegionfromLoc function
      var self = this;
      //console.log(this.regionLoc);
      var availRoom = [];
      var temp = {};
      // retrieve available room from bloc
      bookingsRef
        .child(bregion)
        .child(bloc)
        .once("value", function (snapshot) {
          var obj = snapshot.val();
          var rooms = Object.keys(obj);
          rooms.forEach(function (something) {
            var user0 = snapshot
              .child(something)
              .child(bdate)
              .child(btime)
              .val();
            //console.log(something); // returns the loc node
            // post to bookings node if room is free at that time
            if (user0 === "") {
              //availRoom.push(something);
              temp.free = something;
              //console.log(availRoom);
              bookingsRef
                .child(bregion)
                .child(bloc)
                .child(something)
                .child(bdate)
                .update({
                  [btime]: "" // get userID and put here
                  //this.userName
                });
            }
          });
          availRoom.push(temp);
          self.myBookings = availRoom; //{ "free": "DR1" }
          //console.log(self.myBookings); // [Object]
          // get region for booking
          var region = self.getRegionCode(bregion);
          // post to user node
          user
            .child("0")
            .child("bookings")
            .child(bdate)
            .update({ [btime]: region + " " + bloc + " " + temp['free'] });
        });
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
      user.child("0").child("bookings").child(bdate).child(btime).remove();
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
    // takes in the location code and returns the location name
    // eg: takes in GEN and returns General
    getRegionfromBooking(location) {
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
        //default:
        //  text = "Faculty";
      }
      //this.regionBook = text;
      //console.log(this.regionBook);
      //console.log(text);
      return text;
    },
    // takes in the location name and returns the location code
    // eg: takes in General and returns GEN
    getRegionCode(region) {
      //var region = "General";
      var text = "";
      switch (region) {
        case "Arts and Social Sciences":
          text = "ASS";
          break;
        case "Business":
          text = "BIZ";
          break;
        case "Computing":
          text = "COM";
          break;
        case "Dentistry":
          text = "DEN";
          break;
        case "Design and Environment":
          text = "SDE";
          break;
        case "Engineering":
          text = "ENG";
          break;
        case "General":
          text = "GEN";
          break;
        case "Medicine":
          text = "MED";
          break;
        case "Music":
          text = "MUS";
          break;
        case "Science":
          text = "SCI";
          break;
        default:
          text = "Faculty";
      }
      //this.regionBook = text;
      //console.log(text);
      return text;
    }
  }
});
