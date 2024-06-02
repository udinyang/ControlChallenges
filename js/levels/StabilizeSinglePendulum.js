'use strict';
if (typeof Levels === 'undefined') var Levels = {};

Levels.StabilizeSinglePendulum = function()
{
    this.name = "StabilizeSinglePendulum";
    this.title = "Inverted Pendulum: Stabilize";
    this.sampleSolution = "function controlFunction(pendulum)\n{\n  let L = 1.0;\n  let v_pendulum = pendulum.dx + L * pendulum.dtheta;\n  let v_pendulum_cmd = -0.6 * pendulum.x;\n  monitor('v_pendulum', v_pendulum);\n  let theta_cmd = Math.min(0.07, Math.max(-0.07, 0.3 * (v_pendulum_cmd - v_pendulum)));\n  return 200 * pendulum.dtheta + 1500 * (Math.sin(pendulum.theta) - theta_cmd);\n}\n";
    this.boilerPlateCode = "function controlFunction(pendulum)\n{\n  return 10*Math.sin(8*pendulum.T);\n}";
    this.difficultyRating = 2;
    this.description = "Stabilize the pendulum so that it stays upright, moves to the center (x=0) and stays there in perfect balance. Calculate the horizontal force on the cart necessary to achieve this.";
    this.model = new Models.SinglePendulum({m0: 10,m1: .5,L: 1,g: 9.81,theta: 0.001,dtheta: 0.001,x: -2.5,dx: 0.0,F: 0,T: 0});
}


Levels.StabilizeSinglePendulum.prototype.levelComplete = function()
{
    return Math.abs(this.model.x) < 0.01 
    && Math.abs(this.model.dx) < 0.01 
    && Math.abs(this.model.dtheta) < 0.01 
    && Math.abs(Math.sin(this.model.theta)) < 0.001
    && Math.cos(this.model.theta) > 0.999;
}

Levels.StabilizeSinglePendulum.prototype.levelFailed = function()
{
    return false;
}


Levels.StabilizeSinglePendulum.prototype.simulate = function (dt, controlFunc)
{
    this.model.simulate (dt, controlFunc);
}

Levels.StabilizeSinglePendulum.prototype.getSimulationTime = function() {return this.model.T;}


Levels.StabilizeSinglePendulum.prototype.draw = function(ctx, canvas){this.model.draw(ctx, canvas);}

Levels.StabilizeSinglePendulum.prototype.infoText = function(ctx, canvas){return this.model.infoText();}