// Author: Dmitrii Cucleschin
// Email: dmitrii.cucleschin@gmail.com
// File: main.js
// 
// This code is distributed under GPL v2 license.


// Careful: Global variables may cause death full of suffering.
var state = null;
var drawer = null;
var listener = null;

var canvas = null;
var c = null;
//

$(document).ready(function () {
	canvas = document.getElementById("canvas");
	c = canvas.getContext("2d");

	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;

	state = new State();
	drawer = new Drawer();
	listener = new Listener();

	$("#starter").show();
	$("#viewer").hide();
	$("#menu").hide();

	$("#menu").draggable();

	$("#team").on('keydown', function(e) {
		if (e.which == 13) {
			e.preventDefault();
			if ($("#team").val() && $("#server").val()) {
				connect($("#server").val(), $("#team").val());
			}
		}
	});

	$("#server").on('keydown', function(e) {
		if (e.which == 13) {
			e.preventDefault();
			if ($("#team").val() && $("#server").val()) {
				connect($("#server").val(), $("#team").val());
			}
		}
	});

	$("#lock_button").on('click', function(e) {
		var lock = $("#lock_button");

		if (lock.hasClass("fa-unlock")) {
			drawer.locked = false;
			lock.removeClass("fa-unlock");
			lock.addClass("fa-lock");
		}
		else {
			drawer.locked = true;
			lock.removeClass("fa-lock");
			lock.addClass("fa-unlock");
		}

		drawer.redraw();
	});
});

function connect(server,team) {
	console.log("Connecting to " + server + " . Listening to " + team + ".");

	// Start listening
	listener.startListening(server, team);
}