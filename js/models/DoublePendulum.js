'use strict';
if (typeof Models === 'undefined') var Models = {};

Models.DoublePendulum = function(params)
{
    var nVars = Object.keys(this.vars).length;
    for(var i = 0; i < nVars; i++)
    {
        var key = Object.keys(this.vars)[i];
        this[key] = (typeof params[key] == 'undefined')?this.vars[key]:params[key];
    }
}

Models.DoublePendulum.prototype.vars = 
{
    m0: 10,
    m1: 2,
    m2: 4,
    L1: 0.618,
    L2: 1,
    g: 2,
    theta1: 0.001,
    dtheta1: 0.001,
    theta2: 0.001,
    dtheta2: 0.001,
    x: -1,
    dx: 0,
    F: 0,
    T: 0
};

Models.DoublePendulum.prototype.simulate = function (dt, controlFunc)
{
    this.F = controlFunc({x:this.x,dx:this.dx,theta1:this.theta1,dtheta1:this.dtheta1,theta2:this.theta2,dtheta2:this.dtheta2,T:this.T});
    this.F = Math.max(-50,Math.min(50,this.F));
    if(typeof this.F != 'number' || isNaN(this.F)) throw "Error: The controlFunction must return a number.";
    integrationStep(this, ['x', 'dx', 'theta1', 'dtheta1', 'theta2', 'dtheta2'], dt);
}

Models.DoublePendulum.prototype.ode = function (x)
{
    let s1 = Math.sin(x[2]);
    let c1 = Math.cos(x[2]);
    let s2 = Math.sin(x[4]);
    let c2 = Math.cos(x[4]);
    let dthetasq1 = x[3] * x[3];
    let dthetasq2 = x[5] * x[5];
    let t = this;

    // colns:ddx0 ddtheta1  ddtheta2  ddx1  ddx2  ddy1  ddy2   T1   T2
    let M =[[t.m0,       0,        0,    0,    0,    0,    0, -s1,   0],
            [   0,       0,        0, t.m1,    0,    0,    0,  s1, -s2],
            [   0,       0,        0,    0, t.m2,    0,    0,   0,  s2],
            [   0,       0,        0,    0,    0, t.m1,    0,  c1, -c2],
            [   0,       0,        0,    0,    0,    0, t.m2,   0,  c2],
            [  -1,-t.L1*c1,        0,    1,    0,    0,    0,   0,   0],
            [   0,       0, -t.L2*c2,   -1,    1,    0,    0,   0,   0],
            [   0, t.L1*s1,        0,    0,    0,    1,    0,   0,   0],
            [   0,       0,  t.L2*s2,    0,    0,   -1,    1,   0,   0],];

    let b = [
         this.F,
        0,
        0,
        - this.m1* this.g,
        - this.m2* this.g,
        - this.L1*s1*dthetasq1,
        - this.L2*s2*dthetasq2,
        - this.L1*c1*dthetasq1,
        - this.L2*c2*dthetasq2
    ];
    let ddx = numeric.solve(M,b);
    return [x[1],ddx[0],x[3],ddx[1],x[5],ddx[2]];
}

Models.DoublePendulum.prototype.draw = function (ctx, canvas)
{
    var L = this.L1 + this.L2;
    ctx.translate(0,-L);
    
    var cartWidth = 0.2*L;
    var cartHeight = 0.7*cartWidth;
    
    var tipX = this.x+this.L1*Math.sin(this.theta1);
    var tipY = this.L1*Math.cos(this.theta1)+cartHeight;
    var tip2X = this.L2*Math.sin(this.theta2) + tipX;
    var tip2Y = this.L2*Math.cos(this.theta2) + tipY;
    
    // ground
    ctx.strokeStyle="#333366";
    drawLine(ctx,-100,-.025,100,-.025,0.05);
    
    // cart
    ctx.fillStyle="#4444FF";
    ctx.fillRect(this.x-cartWidth/2,0,cartWidth,cartHeight);
        
    // shaft
    ctx.strokeStyle="#AAAAFF";
    ctx.lineCap = 'round';
    drawLine(ctx,this.x,cartHeight,tipX,tipY,L/20.0);
    drawLine(ctx,tipX,tipY,tip2X,tip2Y,L/20.0);
        
    // tip-mass
    ctx.beginPath();
    ctx.arc(tipX, tipY, 0.1, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#4444FF';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tip2X, tip2Y, 0.1, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#4444FF';
    ctx.fill();
    
    // force arrow
    ctx.strokeStyle="#FF0000";
    ctx.lineCap = 'round';
    drawArrow(ctx, this.x, 0.5*cartHeight, 0.1*this.F, 0, 0.05, 1/40.0);
}

Models.DoublePendulum.prototype.infoText = function ()
{
    return  "/* Horizontal position         */ pendulum.x       = " + round(this.x,2)
        + "\n/* Horizontal velocity         */ pendulum.dx      = " + round(this.dx,2)
        + "\n/* Angle from vertical (lower) */ pendulum.theta1  = " + round(this.theta1,2)
        + "\n/* Angular velocity    (lower) */ pendulum.dtheta1 = " + round(this.dtheta1,2)
        + "\n/* Angle from vertical (upper) */ pendulum.theta2  = " + round(this.theta2,2)
        + "\n/* Angular velocity    (upper) */ pendulum.dtheta2 = " + round(this.dtheta2,2)
        + "\n/* Simulation time             */ pendulum.T       = " + round(this.T,2);    
}
