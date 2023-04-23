// hosts a web api that will control the player

const PORT = 8123;

var express = require('express');
var app = express();
let exec = require('child_process').exec;

var cr_interact = require("./plex_interact");

app.get('/displayon', function (req, res) {
    res.send("ok");
    console.log('Received command to turn display on.');
    exec('xset -display :0.0 dpms force on');
    cr_interact.resumeVideo();
});

app.get('/displayoff', function (req, res) {
    res.send("ok");
    console.log('Received command to turn display off.');
    exec('xset -display :0.0 dpms force off');
    cr_interact.pauseVideo();
});

app.get('/pause', function (req, res) {
    res.send("ok");
    console.log('Received command to pause playback.');
    cr_interact.pauseVideo();
});

app.get('/resume', function (req, res) {
    res.send("ok");
    console.log('Received command to resume playback.');
    cr_interact.resumeVideo();
});

app.get('/skip', function (req, res) {
    res.send("ok");
    console.log('Received command to skip episode playback.');
    cr_interact.skipVideo();
});

app.get('/test', function (req, res) {
    res.send("ok");
    console.log('Received command to test.');
    //put test command here
});

var server = app.listen(PORT);
console.log("control api listening for requests on port "+PORT);