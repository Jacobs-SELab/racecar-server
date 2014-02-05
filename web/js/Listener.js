// Author: Dmitrii Cucleschin
// Email: dmitrii.cucleschin@gmail.com
// File: Listener.js
// 
// This code is distributed under GPL v2 license.

function Listener() {
	this.socket = null;
	this.team = null;
	this.server = null;
}

Listener.prototype.killSocket = function() {
	console.log("Killing socket...");

	this.socket.removeAllListeners("init_"+this.team);
	this.socket.removeAllListeners("status_"+this.team);
	this.socket.removeAllListeners("end_"+this.team);
	this.socket = null;
}

Listener.prototype.startListening = function(server, team) {

	// Connect to server, request map and initial state
	// Listen to events with dataReceived()
	this.server = server;
	this.team = team;
	this.socket = io.connect(server);

	var timeout = setTimeout(function() {
		alert("Error! Connection timed out.");
		listener.killSocket();
		clearTimeout(timeout);
	},2000);

	this.socket.on('init_'+team, function(data) {
		clearTimeout(timeout);

		if (data == null) {
			alert("Error! Team doesn't exist.");
			listener.killSocket();
			return;
		}
		listener.initialize(data);
	});

	this.socket.on('status_'+team, function(data) {
		//console.log("status: " + data);
		listener.dataReceived(data);
	});

	this.socket.on('end_'+team, function(data) {
		console.log("Race ended with state: " + data + " (" + state.time + " ms)." );
		listener.end(data);
	});
	
	this.socket.emit('init',{team: team});	
}

Listener.prototype.initialize = function(data) {
	console.log("Initializing canvas...");
	$("#starter").hide();
	$("#viewer").show();
	$("#menu").show();
	state.parse(data.driver, data.map, function() { drawer.redraw(); drawer.updateStats(); });
}

Listener.prototype.dataReceived = function(data) {
	//console.log(data);
	state.parse(data, null, function() { drawer.redraw(); drawer.updateStats(); });
}

Listener.prototype.end = function(data) {

	if (data == "dead") {
		alert("Lost! :(");
	}
	else if (data == "alive") {
		alert("Won! :)\nFinal time: " + state.time);
	}

	this.killSocket();

	$("#starter").show();
	$("#viewer").hide();
	$("#menu").hide();	

	drawer.clear();
}