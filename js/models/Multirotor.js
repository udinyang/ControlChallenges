'use strict';
if (typeof Models === 'undefined') var Models = {};

Models.Multirotor = function(params)
{
    var nVars = Object.keys(this.vars).length;
    for(var i = 0; i < nVars; i++)
    {
        var key = Object.keys(this.vars)[i];
        this[key] = (typeof params[key] == 'undefined')?this.vars[key]:params[key];
    }
}

Models.Multirotor.prototype.vars = 
{
    mass: 1,
    I: 1/.12/100, // moment of inertia
    Length: .1,
    g: 9.81,
    theta: .01,
    dtheta: 0,
    thrustLeft: 9.81/2,
    thrustRight: 9.81/2,
    maxThrust: 20,
    x: 0,
    dx: 0,
    y: 0,
    dy: 0,
    T: 0,
    imgURL:'',
};

Models.Multirotor.prototype.simulate = function (dt, controlFunc)
{
    var input = controlFunc({x: this.x, dx: this.dx, y: this.y, dy: this.dy, theta: this.theta, dtheta: this.dtheta, T: this.T}); // call user controller
    if(typeof input != 'object' || typeof input.thrustLeft != 'number' || typeof input.thrustRight != 'number') 
        throw "Error: The controlFunction must return an object: {thrustLeft:number, thrustRight:number}";
    this.thrustLeft_cmd = Math.max(0,Math.min(this.maxThrust,input.thrustLeft));
    this.thrustRight_cmd = Math.max(0,Math.min(this.maxThrust,input.thrustRight));
    integrationStep(this, ['x', 'dx', 'y', 'dy', 'theta', 'dtheta', 'thrustLeft', 'thrustRight'], dt);
}

Models.Multirotor.prototype.ode = function (x) {
    return[
        x[1],
        Math.sin(x[4]) / this.mass * (this.thrustLeft+this.thrustRight),
        x[3],
        Math.cos(x[4]) / this.mass * (this.thrustLeft+this.thrustRight) - this.g,
        x[5],
        (this.thrustLeft-this.thrustRight) * this.Length / this.I,
        12.0 * (this.thrustLeft_cmd - x[6]),
        12.0 * (this.thrustRight_cmd - x[7])
    ];
}




Models.Multirotor.prototype.drawVehicle = function (ctx, canvas) {
    ctx.save();
    ctx.translate(this.x,this.y);
    ctx.rotate(-this.theta);
    ctx.scale(this.Length,this.Length);

    var imgData = ImageDataCache.get(this.imgURL);
    if(imgData){
        ctx.save();        
        ctx.scale(3.6/imgData.width,-3.6/imgData.width);
        ctx.translate(-imgData.width/2,-imgData.height/2);
        ctx.drawImage(imgData.image,0,0);
        ctx.restore();
    } else {
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        drawLine(ctx,-2,0,2,0,.02);
        drawLine(ctx,0,-1,0,1,.02);
    }

    // draw force vectors
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle="#FF0000";
    var forceScale = 0.4;
    var arrowScale = 0.2;
    if(this.thrustLeft>0){
        drawLine(ctx,-1,0.7,-1,0.7+forceScale*this.thrustLeft,.1);
        drawLine(ctx,-1,0.7+forceScale*this.thrustLeft,-1+arrowScale,-arrowScale+0.7+forceScale*this.thrustLeft,.1);
        drawLine(ctx,-1,0.7+forceScale*this.thrustLeft,-1-arrowScale,-arrowScale+0.7+forceScale*this.thrustLeft,.1);
    }

    if(this.thrustRight>0){
        drawLine(ctx,1,0.7,1,0.7+forceScale*this.thrustRight,.1);
        drawLine(ctx,1,0.7+forceScale*this.thrustRight,1+arrowScale,-arrowScale+0.7+forceScale*this.thrustRight,.1);
        drawLine(ctx,1,0.7+forceScale*this.thrustRight,1-arrowScale,-arrowScale+0.7+forceScale*this.thrustRight,.1);
    }


    ctx.restore();
}

Models.Multirotor.prototype.infoText = function ()
{
    return  "/* Horizontal position */ vehicle.x      = " + round(this.x,2)
        + "\n/* Horizontal velocity */ vehicle.dx     = " + round(this.dx,2)
        + "\n/* Vertical position   */ vehicle.y      = " + round(this.y,2)
        + "\n/* Vertical velocity   */ vehicle.dy     = " + round(this.dy,2)
        + "\n/* Angle from vertical */ vehicle.theta  = " + round(this.theta,2)
        + "\n/* Angular velocity    */ vehicle.dtheta = " + round(this.dtheta,2)
        + "\n/* Simulation time     */ vehicle.T      = " + round(this.T,2);    
}
