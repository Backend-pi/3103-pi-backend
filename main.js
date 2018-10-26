var db = firebase
  .initializeApp({
    databaseURL: "https://space-czar.firebaseio.com/"
  })
  .database();

var realtimeRef = db.ref("realtime");
var forecastRef = db.ref("forecast");

new Vue({
  el: "#app",
  data: {
    counter: 0,
    location: "",
    occupant: {}
    //databaseURL:
  },
  //firebase: {},
  methods: {
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
    }
  }
});
