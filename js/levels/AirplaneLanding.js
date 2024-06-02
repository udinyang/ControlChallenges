'use strict';
if (typeof Levels === 'undefined') var Levels = {};

Levels.AirplaneLanding = function()
{
    this.name = "AirplaneLanding";
    this.title = "Airplane Landing";
    this.boilerPlateCode = "function controlFunction(vehicle) \n{\n  return {\n    elevator: 0.039, \n    throttle: 0.215, \n    brake: 0.0\n  };\n};\n";
    this.sampleSolution = "function controlFunction(vehicle) \n{\n  return {\n    elevator: 0.01 * (Math.max(-8*vehicle.T, Math.max(-25, -0.7 * (vehicle.y + 0.8))) - vehicle.vy),\n    throttle: 0.0, \n    brake: 0.8\n  };\n};\n";
    this.difficultyRating = 3;
    this.description = "Perform a descent, landing and full stop. All ground can be used as runway. There is no need to aim for a touchdown point.";
    this.model = new Models.Airplane({
        x: 0.0,
        vx: 50.0,
        y: 350.0,
        vy: 0.0,
        pitch: 0.01,
        pitch_rate: 0.0,
        elevator_angle: 0.039,
        throttle: 0.215,
        brake: 0.0,
    });
}


Levels.AirplaneLanding.prototype.levelComplete = function() {
    return Math.abs(this.model.vx) < 0.01
        && Math.abs(this.model.vy) < 0.01
        && Math.abs(this.model.y - 1.51) < 0.1
        && Math.abs(this.model.pitch) < 0.03
        && Math.abs(this.model.pitch_rate) < 0.01;
}

Levels.AirplaneLanding.prototype.levelFailed = function() {
    return this.model.crashed() || this.model.structural_overload();
}

Levels.AirplaneLanding.prototype.simulate = function (dt, controlFunc) { this.model.simulate (dt, controlFunc); }
Levels.AirplaneLanding.prototype.getSimulationTime = function() {return this.model.T;}
Levels.AirplaneLanding.prototype.draw = function(ctx, canvas){ this.model.draw(ctx, canvas); }
Levels.AirplaneLanding.prototype.infoText = function(ctx, canvas){return this.model.infoText();}