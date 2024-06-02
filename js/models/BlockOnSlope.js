'use strict';
if (typeof Models === 'undefined') var Models = {};

Models.BlockOnSlope = function(params)
{
    var nVars = Object.keys(this.vars).length;
    for(var i = 0; i < nVars; i++)
    {
        var key = Object.keys(this.vars)[i];
        this[key] = (typeof params[key] == 'undefined')?this.vars[key]:params[key];
    }
}

Models.BlockOnSlope.prototype.vars = 
{
    g: 9.81,
    x: 0,
    dx: 0,
    slope: 1,
    F: 0,
    F_cmd: 0,
    friction: 0,
    T: 0,
};

Models.BlockOnSlope.prototype.simulate = function (dt, controlFunc)
{
    this.F_cmd = controlFunc({x:this.x,dx:this.dx,T:this.T});
    if(typeof this.F_cmd != 'number' || isNaN(this.F_cmd)) throw "Error: The controlFunction must return a number.";
    this.F_cmd = Math.max(-20,Math.min(20,this.F_cmd));
    integrationStep(this, ['x', 'dx', 'F'], dt);
}

Models.BlockOnSlope.prototype.ode = function (x)
{
    return [
        x[1],
        (x[2]) - (Math.sin(this.slope) * this.g) - (this.friction * x[1]),
        20.0 * (this.F_cmd - x[2])
    ];
}


Models.BlockOnSlope.prototype.draw = function (ctx, canvas)
{
    ctx.rotate(this.slope);

    ctx.strokeStyle="#333366";
    drawLine(ctx,-10,-.025,10,-.025,0.05);

    var cartWidth = 0.4;
    var cartHeight = 0.7*cartWidth;

    // block
    ctx.fillStyle="#4444FF";
    ctx.fillRect(this.x-cartWidth/2,0,cartWidth,cartHeight);

    // force arrow
    ctx.strokeStyle="#FF0000";
    drawArrow(ctx, this.x, 0.5*cartHeight, 0.1*this.F, 0, 0.05, 0.025);

    // target arrow
    ctx.strokeStyle="#4444FF";
    drawArrow(ctx, 0, 4.5*cartHeight, 0, -2.5*cartHeight, 0.05, 1/30);
}

Models.BlockOnSlope.prototype.infoText = function ()
{
    return  "/* Position        */ block.x  = " + round(this.x,2)
        + "\n/* Velocity        */ block.dx = " + round(this.dx,2)
        + "\n/* Simulation time */ block.T  = " + round(this.T,2);    
}
