'use strict';
if (typeof Models === 'undefined') var Models = {};

Models.SinglePendulum = function(params)
{
    var nVars = Object.keys(this.vars).length;
    for(var i = 0; i < nVars; i++)
    {
        var key = Object.keys(this.vars)[i];
        this[key] = (typeof params[key] == 'undefined')?this.vars[key]:params[key];
    }
}

Models.SinglePendulum.prototype.vars = 
{
    m0: 10,
    m1: .5,
    L: 1,
    g: 9.81,
    theta: 0.2,
    dtheta: 0,
    x: 0,
    dx: 0,
    F: 0,
    F_cmd: 0,
    T: 0
};

Models.SinglePendulum.prototype.simulate = function (dt, controlFunc)
{
    this.F_cmd = controlFunc({x:this.x,dx:this.dx,theta:this.theta,dtheta:this.dtheta,T:this.T});
    if(typeof this.F_cmd != 'number' || isNaN(this.F_cmd)) throw "Error: The controlFunction must return a number.";
    this.F_cmd = Math.max(-30,Math.min(30,this.F_cmd));
    integrationStep(this, ['x', 'dx', 'theta', 'dtheta', 'F'], dt);
}

Models.SinglePendulum.prototype.ode = function (x)
{
    var s = Math.sin(x[2]);
    var c = Math.cos(x[2]);
    var dthetasq = x[3] * x[3];
    
    var M = [[this.m0,0,0,0,-s],
        [0,0,this.m1,0,s],
        [0,0,0,this.m1,c],
        [1,this.L*c,-1,0,0],
        [0,-this.L*s,0,-1,0]];
    var b = [x[4],0,-this.m1*this.g,s*dthetasq*this.L,c*dthetasq*this.L];
    var ddx = numeric.solve(M,b)
    return [x[1],ddx[0],x[3],ddx[1],40.0*(this.F_cmd - x[4])];
}


Models.SinglePendulum.prototype.draw = function (ctx, canvas)
{
    ctx.translate(0,-this.L);
    
    var cartWidth = 0.4*this.L;
    var cartHeight = 0.7*cartWidth;
    
    var tipX = this.x+this.L*Math.sin(this.theta);
    var tipY = this.L*Math.cos(this.theta)+cartHeight;
    
    // ground
    ctx.strokeStyle="#333366";
    drawLine(ctx,-100,-.025,100,-.025,0.05);
    
    // cart
    ctx.fillStyle="#4444FF";
    ctx.fillRect(this.x-cartWidth/2,0,cartWidth,cartHeight);
        
    // shaft
    ctx.strokeStyle="#AAAAFF";
    ctx.lineCap = 'round';
    drawLine(ctx,this.x,cartHeight,tipX,tipY,this.L/20.0);
        
    // tip-mass
    ctx.beginPath();
    ctx.arc(tipX, tipY, this.L/7, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#4444FF';
    ctx.fill();
    
    // force arrow
    ctx.strokeStyle="#FF0000";
    ctx.lineCap = 'round';
    drawArrow(ctx, this.x, 0.5*cartHeight, 0.1*this.F, 0, 0.05, this.L/40.0);
}

Models.SinglePendulum.prototype.infoText = function ()
{
    return  "/* Horizontal position       */ pendulum.x      = " + round(this.x,2)
        + "\n/* Horizontal velocity       */ pendulum.dx     = " + round(this.dx,2)
        + "\n/* Angle from vertical (rad) */ pendulum.theta  = " + round(this.theta,2)
        + "\n/* Angular velocity (rad/s)  */ pendulum.dtheta = " + round(this.dtheta,2)
        + "\n/* Simulation time (s)       */ pendulum.T      = " + round(this.T,2);    
}
