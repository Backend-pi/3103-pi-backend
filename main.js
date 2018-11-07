var db = firebase
  .initializeApp({
    databaseURL: "https://space-czar.firebaseio.com/"
  })
  .database();

var realtimeRef = db.ref("realtime");
var forecastRef = db.ref("forecast");
var user = db.ref("user");

var app = new Vue({
  el: "#app",
  data: {
    counter: 0,
    locations: ["Central Library", "Mac Commons", "Study Room 1"],
    hangouts: ""
    //databaseURL:
  },
  methods: {
    increment: function() {
      this.counter++;
    },
    enter: function() {
      var today = new Date();
      var date =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      var time =
        today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      this.date = date;
      realtimeRef.child(location).push({
        // something
        Date: ["A1234567X", time]
      });
    },
    exit: function() {
      console.log(forecastRef.child());
      forecastRef.child(forecast[location]).push({
        Data: this.occupant // mot sure if correct
      });
      // remove from realtime
      realtimeRef
        .child(realtime[location])
        .child("occupants")
        .child(occupant)
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
    }
  }
});
