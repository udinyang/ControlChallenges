'use strict';
if (typeof Levels === 'undefined') var Levels = {};

Levels.CruiseControlIntro = function()
{
    this.name = "CruiseControlIntro";
    this.title = "Cruise Control";
    this.boilerPlateCode = "function controlFunction(vehicle){ \n  return Math.sin(2*vehicle.T);\n};";
    this.sampleSolution = "var speedErrorIntegral = 0;\nfunction controlFunction(vehicle){\n  let speedError = vehicle.targetSpeed - vehicle.speed;\n  if(Math.abs(speedError) < 3.0) speedErrorIntegral += 0.02 * speedError;\n  let throttle = 0.4 * (speedError + 0.7 * speedErrorIntegral);\n  monitor('speedError', speedError);\n  monitor('speedErrorIntegral', speedErrorIntegral);\n  monitor('throttle', throttle);\n  return throttle;\n};\n";
    this.difficultyRating = 1;
    this.description = "Attain and hold the target speed (magenta indicator) for 5 seconds. Keep the speed deviation below 0.2 units.";
    ImageDataCache.load('img/speedometer.png');
    ImageDataCache.load('img/car.png');
    this.model = new Models.CruiseControl({carImg:'img/car.png',speedometerImg:'img/speedometer.png'});
}


Levels.CruiseControlIntro.prototype.levelComplete = function(){return this.model.speedHoldTimer > 5;}

Levels.CruiseControlIntro.prototype.levelFailed = function(){return false;}

Levels.CruiseControlIntro.prototype.simulate = function (dt, controlFunc)
{ this.model.simulate (dt, controlFunc); }

Levels.CruiseControlIntro.prototype.getSimulationTime = function() {return this.model.T;}

Levels.CruiseControlIntro.prototype.draw = function(ctx, canvas){this.model.draw(ctx, canvas);}

Levels.CruiseControlIntro.prototype.infoText = function(ctx, canvas){return this.model.infoText();}