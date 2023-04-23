// hosts a web api that will control the player

const PORT = 8123;

var express = require('express');
var app = express();
let exec = require('child_process').exec;

var plex_interact = require("./plex_interact");

app.get('/displayon', function (req, res) {
    res.send("ok");
    console.log('Received command to turn display on.');
    exec('xset -display :0.0 dpms force on');
    plex_interact.resumeVideo();
});

app.get('/displayoff', function (req, res) {
    res.send("ok");
    console.log('Received command to turn display off.');
    exec('xset -display :0.0 dpms force off');
    plex_interact.pauseVideo();
});

app.get('/pause', function (req, res) {
    res.send("ok");
    console.log('Received command to pause playback.');
    plex_interact.pauseVideo();
});

app.get('/resume', function (req, res) {
    res.send("ok");
    console.log('Received command to resume playback.');
    plex_interact.resumeVideo();
});

app.get('/skip', function (req, res) {
    res.send("ok");
    console.log('Received command to skip episode playback.');
    plex_interact.skipVideo();
});

app.get('/test', function (req, res) {
    res.send("ok");
    console.log('Received command to test.');
    //put test command here
});

var server = app.listen(PORT);
console.log("control api listening for requests on port "+PORT);