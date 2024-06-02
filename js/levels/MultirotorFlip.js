'use strict';
if (typeof Levels === 'undefined') var Levels = {};

Levels.MultirotorFlip = function()
{
    this.name = "MultirotorFlip";
    this.title = "Multirotor Flip";
    this.boilerPlateCode = "function controlFunction(vehicle){  \n  return {thrustLeft: 9.81/2+.001, thrustRight: 9.81/2-0.001};\n};";
    this.sampleSolution = "function attitude_control(theta_ref, thrust_ref, vehicle) {\n  let diff = 4.0 * (vehicle.dtheta - 3.0 * Math.sin(theta_ref - vehicle.theta));  \n  return {thrustLeft: thrust_ref/2 - diff, thrustRight: thrust_ref/2 + diff};\n}\n\nfunction acceleration_control(ax_ref, ay_ref, vehicle) {\n  ay_ref += 9.81;\n  let theta_ref = Math.atan2(ax_ref, ay_ref);\n  let thrust_ref = Math.sqrt(1e-3 + ax_ref*ax_ref + ay_ref*ay_ref);\n  return attitude_control(theta_ref, thrust_ref, vehicle);\n}\n\nfunction position_control(px, py, vehicle) {\n  return acceleration_control(\n    -1.8 * (vehicle.dx + 0.8 * (vehicle.x - px)), \n    -1.8 * (vehicle.dy + 0.8 * (vehicle.y - py)), \n    vehicle);\n}\n\nvar state = 0;\nfunction controlFunction(vehicle){\n  if(state == 0) {\n    if(vehicle.T > 1.4) state++;\n    return position_control(-0.7, -0.6, vehicle);\n  }\n  else if (state == 1) {\n    if(vehicle.x > 0.0) state++;\n    return acceleration_control(1.0, 0.3, vehicle);    \n  }\n  else if (state == 2) {\n    if(vehicle.theta < 5.8) state++;\n    return {thrustLeft:0, thrustRight:20};\n  }\n  else if (state == 3) {\n    if(vehicle.theta < 2.0) state++;\n    return {thrustLeft:0, thrustRight:0};\n  }\n  else {\n    return position_control(0, 0, vehicle);\n  }\n};\n";
    this.difficultyRating = 3;
    this.description = "Make a counter-clockwise flip and stop in the green box. Do not touch the walls!";
    ImageDataCache.load('img/multirotor_lowres.png');
    this.model = new Models.Multirotor({imgURL:'img/multirotor_lowres.png',    theta: 2*Math.PI,dtheta: 0,x: 0,dx: 0,y: 0,dy: 0});
    this.boxRadius = 1;
    this.collisionRadius = this.boxRadius - 0.8 * this.model.Length;
}


Levels.MultirotorFlip.prototype.levelComplete = function(){
    return Math.abs(this.model.x) < 0.01
        && Math.abs(this.model.y) < 0.01
        && Math.abs(this.model.dx) < 0.01
        && Math.abs(this.model.dy) < 0.01
        && Math.abs(this.model.theta) < 0.01
        && Math.abs(this.model.dtheta) < 0.01;
}

Levels.MultirotorFlip.prototype.levelFailed = function(){
    return this.model.x >  this.collisionRadius
        || this.model.x < -this.collisionRadius
        || this.model.y >  this.collisionRadius
        || this.model.y < -this.collisionRadius;
}

Levels.MultirotorFlip.prototype.simulate = function (dt, controlFunc)
{ this.model.simulate (dt, controlFunc); }

Levels.MultirotorFlip.prototype.getSimulationTime = function() {return this.model.T;}

Levels.MultirotorFlip.prototype.draw = function(ctx, canvas) {
    ctx.scale(2,2);
    ctx.fillStyle="#88ff88";
    var s = this.model.Length;
    ctx.fillRect(-2*s,-.8*s,4*s,1.6*s);


    ctx.fillStyle="#883300";
    var d = 0.1;
    var r = this.boxRadius;
    ctx.fillRect(-d-r,-d-r,d,2*(r+d));
    ctx.fillRect(-d-r,-d-r,2*(r+d),d);
    ctx.fillRect(r,-r-d,d,2*(r+d));
    ctx.fillRect(-r-d,r,2*(r+d),d);

    this.model.drawVehicle(ctx, canvas);

    if(this.levelFailed()){
        ctx.save();
        ctx.translate(-1,0);
        ctx.scale(0.005,-0.005);
        ctx.font="10px Verdana";
        ctx.textAlign="center"; 
        ctx.fillStyle="#990000";
        ctx.fillText("CRASHED!",0,0);
        ctx.restore();
    }
}

Levels.MultirotorFlip.prototype.infoText = function(ctx, canvas){return this.model.infoText();}