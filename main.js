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
    occupant: {},
    date: "",
    hangouts: [["Computing", 44], ["Engineering", 23], ["Science", 33]]
    //databaseURL:
  },
  firebase: {
    hangouts: user.child("0").child("hangouts")
  },
  methods: {
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

    increment: function() {
      this.counter++;
    },

    printData: function() {
      this.hangouts = user.child("0").child("hangouts");
      console.log(user.child("0").child("hangouts"));
    }
  }
});
