'use strict';
if (typeof Levels === 'undefined') var Levels = {};

Levels.AirplaneIntro = function()
{
    this.name = "AirplaneIntro";
    this.title = "Airplane Takeoff";
    this.boilerPlateCode = "function controlFunction(vehicle) {\n  // elevator: Angle in radian from -0.3 to 0.3\n  // throttle: Fraction from 0.0 to 1.0\n  // brake: Fraction from 0.0 to 1.0\n  return {elevator:0.05 + 0.2 * Math.sin(10 * vehicle.T), throttle:0.0, brake:1.0};\n};\n";
    this.sampleSolution = "var speed_error_integral = 0.0;\nvar height_error_integral = 0.0;\n\nfunction controlFunction(vehicle) \n{  \n  if(vehicle.T < 11) \n    return {elevator: 0.0, throttle: 1.0, brake: 0.0};\n  \n  let speed_error = vehicle.vx - 50.0;\n  let height_error = vehicle.y - 600.0;\n  \n  if(vehicle.T > 45)\n  {\n    let dt = 0.02;\n    speed_error_integral += dt * speed_error;\n    height_error_integral += dt * height_error;\n  }\n  \n  return {\n    elevator: 0.015 * (2.5 * (speed_error + 0.2 * speed_error_integral) - vehicle.vy), \n    throttle: 0.1 * (-0.3 * (height_error + 0.2 * height_error_integral) - vehicle.vy), \n    brake: 0.0\n  };\n};\n";
    this.difficultyRating = 2;
    this.description = "Perform a takeoff, climb and then maintain a precise height of y = 600.0 and speed of vx = 50.0.";
    this.model = new Models.Airplane({});
}


Levels.AirplaneIntro.prototype.levelComplete = function() {
    return Math.abs(this.model.vx - 50.0) < 0.1
        && Math.abs(this.model.y - 600.0) < 0.2
        && Math.abs(this.model.vy) < 0.1
        && Math.abs(this.model.pitch_rate) < 0.01;
}

Levels.AirplaneIntro.prototype.levelFailed = function() {
    return this.model.crashed() || this.model.structural_overload();
}

Levels.AirplaneIntro.prototype.simulate = function (dt, controlFunc) { this.model.simulate (dt, controlFunc); }
Levels.AirplaneIntro.prototype.getSimulationTime = function() {return this.model.T;}
Levels.AirplaneIntro.prototype.draw = function(ctx, canvas){ this.model.draw(ctx, canvas); }
Levels.AirplaneIntro.prototype.infoText = function(ctx, canvas){return this.model.infoText();}