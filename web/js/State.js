// Author: Dmitrii Cucleschin
// Email: dmitrii.cucleschin@gmail.com
// File: State.js
// 
// This code is distributed under GPL v2 license.

function State() {
	this.x = 0;
	this.y = 0;
	this.angle = 0;
	this.map = null;

	this.hp = 100;
	this.speed = 0;
	this.acceleration = 0;

	this.drunk = false;
	this.broken = false;
	
	this.time = 0;
}

State.prototype.parse = function (driver, map, fn) {
	if (map) {
		this.map = map;
		drawer.mapHeight = this.map.length;
		drawer.mapWidth = this.map[0].length;
	}

	this.x = driver.position.x;
	this.y = driver.position.y;
	this.angle = driver.position.angle;

	this.time = driver.timePassed;
	if (this.time == null) this.time = 0;

	this.hp = driver.health + "%";
	this.speed = driver.speed;
	this.acceleration = driver.acceleration;

	this.drunk = driver.drunk;
	this.broken = driver.broken;

	fn();
}