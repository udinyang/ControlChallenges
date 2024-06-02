'use strict';
if (typeof Levels === 'undefined') var Levels = {};

Levels.SwingUpSinglePendulum = function()
{
    this.name = "SwingUpSinglePendulum";
    this.title = "Inverted Pendulum: Swing up";

    this.sampleSolution = "function controlFunction(pendulum)\n{\n  if (pendulum.T < 2.0) return 50 * Math.cos(3 * pendulum.T);\n  if (pendulum.T < 4.7) return 1000 * pendulum.dtheta;\n  if (pendulum.T < 5.22) return -1000;\n  if (pendulum.T < 6.2) return 0;\n  \n  let L = 1.0;\n  let v_pendulum = pendulum.dx + L * pendulum.dtheta;\n  let v_pendulum_cmd = -0.6 * pendulum.x;\n  monitor('v_pendulum', v_pendulum);\n  let theta_cmd = Math.min(0.07, Math.max(-0.07, 0.3 * (v_pendulum_cmd - v_pendulum)));\n  return 200 * pendulum.dtheta + 1500 * (Math.sin(pendulum.theta) - theta_cmd);\n}\n";
    this.boilerPlateCode = "function controlFunction(pendulum)\n{\n  return 10*Math.sin(8*pendulum.T);\n}";
    this.difficultyRating = 3;
    this.description = "Bring the pendulum into an upright position and keep it upright in the center (x=0).";
    this.model = new Models.SinglePendulum({m0: 10,m1: .5,L: 1,g: 9.81,theta: 3.1415,dtheta: 0,x: 0,dx: 0,F: 0,T: 0});
}


Levels.SwingUpSinglePendulum.prototype.levelComplete = function()
{
    return Math.abs(this.model.x) < 0.01 
    && Math.abs(this.model.dx) < 0.01 
    && Math.abs(this.model.dtheta) < 0.01 
    && Math.abs(Math.sin(this.model.theta)) < 0.001
    && Math.cos(this.model.theta) > 0.999;
}

Levels.SwingUpSinglePendulum.prototype.levelFailed = function()
{
    return false;
}


Levels.SwingUpSinglePendulum.prototype.simulate = function (dt, controlFunc)
{
    this.model.simulate (dt, controlFunc);
}

Levels.SwingUpSinglePendulum.prototype.getSimulationTime = function() {return this.model.T;}


Levels.SwingUpSinglePendulum.prototype.draw = function(ctx, canvas){this.model.draw(ctx, canvas);}

Levels.SwingUpSinglePendulum.prototype.infoText = function(ctx, canvas){return this.model.infoText();}