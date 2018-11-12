var db = firebase
  .initializeApp({
    databaseURL: "https://space-czar.firebaseio.com/"
  })
  .database();

var realtimeRef = db.ref("realtime");
var forecastRef = db.ref("forecast");
var user = db.ref("user");
var interval;

var app = new Vue({
  el: "#app",
  data: {
    counter: 0,
    locations: ["Central Library", "Mac Commons", "Study Room 1"],
    hangouts: "",
    timeOn: true
    //databaseURL:
  },
  methods: {
    increment: function() {
      this.counter++;
    },
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
    update_data: async function(region, location, room, date, time, pax) {
      //uncomment below when testing
      //var region = "General"
      //var location = "Central Library"
      //var room = "Discussion rooms"
      //var date = "27102018"
      //var pax = 2
      //var time = 1700
      forecastRef
        .child(region)
        .child(location)
        .child(room)
        .child("Data")
        .child(date)
        .update({ [time]: pax });
    },
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
    startRandomTime: function() {
      this.timeOn = true;
      this.randomTime();
    },
    stopRandomTime: function() {
      this.timeOn = false;
      this.randomTime();
    }
    //},
  }
});
