'use strict';
if (typeof Models === 'undefined') var Models = {};

Models.Airplane = function(params)
{
    var nVars = Object.keys(this.vars).length;
    for(var i = 0; i < nVars; i++)
    {
        var key = Object.keys(this.vars)[i];
        this[key] = (typeof params[key] == 'undefined')?this.vars[key]:params[key];
    }
    integrationStep(this, ['x', 'vx', 'y', 'vy', 'pitch', 'pitch_rate', 'elevator_angle', 'throttle', 'brake'], 0.02);
}

Models.Airplane.prototype.vars = 
{
    x: 0.0,
    vx: 0.0,
    y: 1.51,
    vy: 0.0,
    pitch: 0.01,
    pitch_rate: 0.0,
    elevator_angle: 0.0,
    throttle: 0.0,
    brake: 0.0,
    T: 0,
    elevator_command: 0.0,
    throttle_command: 0.0,
    brake_command: 0.0,
    max_load_factor: 0.0,
    thrust: 0.0,
    wings: [
        { // Main wing
            px: -0.4,
            py: -0.2,
            incidence_angle: 4.25/60,
            area: 16.0,
        },
        { // Horizontal stabilizer
            px: -5.0,
            py:  0.2,
            incidence_angle: -1.5/60,
            area: 3.0,
        }
    ],
    wheels: [
        { // Main gear
            px: -0.7,
            py: -1.4,
            radius: 0.3,
            compression: 0.0,
            fx: 0.0,
            fy: 0.0,
        },
        { // Nose gear
            px:  2.8,
            py: -1.4,
            radius: 0.2,
            compression: 0.0,
            fx: 0.0,
            fy: 0.0,
        }
    ],
    hitbox: [[2.5,0.9], [4.5,-0.2], [4.0,-0.65], [-2.5,-0.65], [-6.1,-0.0], [-7.0,2.35], [-5.8,2.35]],
    airplane_path: new Path2D("m 65.846587,46.472565 c 0,0 37.196543,-0.360388 49.806183,-0.5114 12.60964,-0.151012 25.29262,12.456859 8.922,12.480144 -16.37062,0.02329 -10.89443,0.01026 -18.14665,0.07498 -7.25222,0.06472 -16.942581,0.06569 -25.409316,-0.492473 C 72.552068,57.46565 69.803478,56.558812 64.840484,55.759541 59.87749,54.96027 51.067509,53.357967 51.067509,53.357967 l -7.325255,-18.810592 9.660984,-0.183924 12.496088,12.145508"),
    airfoil_path: new Path2D("m 21.677842,79.894736 c 0,0 94.793228,-8.938838 125.753348,-8.939856 30.96013,-0.001 51.96,3.796246 52.05,8.776878 0.09,4.980631 -22.51007,8.353451 -52.15923,8.967375 C 117.67281,89.313057 21.677842,79.894736 21.677842,79.894736 Z"),
    tree_top_path: new Path2D("m 120.05921,61.843985 c -1.65357,4.617685 -9.48191,3.214979 -7.25752,-2.171054 -4.9742,1.615489 -5.88787,-8.07854 -0.36777,-9.044457 -4.04463,-0.828636 -5.2462,-6.785239 0.57074,-7.081693 -4.68062,-3.854027 1.14553,-9.268045 6.39039,-6.339913 2.43053,-4.964987 11.68181,-1.747989 9.21899,3.292002 4.96647,-2.237211 9.25272,0.901048 5.7187,5.695746 5.3658,-1.177213 6.80193,4.035241 0.0864,6.499932 5.98069,-0.237782 5.52476,8.859962 0.93045,8.405075 0.37445,5.924168 -5.67999,5.280539 -7.38158,0.744362 -0.29224,5.440368 -7.04019,3.824441 -7.90883,0 z"),
    tree_stem_path: new Path2D("m 123.9023,92.632809 3.94757,-0.04386 c 0,0 -0.41981,-13.495462 -0.50284,-17.344903 -0.083,-3.849441 -0.68143,-4.849212 -0.68143,-4.849212 l 4.51778,-6.79859 -1.49131,-0.219311 -3.94757,4.824807 -1.62289,-8.246033 -1.97378,0.131585 1.27199,7.017901 -5.36361,-5.193492 -1.11031,1.416428 c 0,0 5.54169,4.122034 6.40125,6.741505 0.85956,2.619471 1.51329,3.890814 1.47625,7.781722 -0.037,3.890908 -0.9211,14.781453 -0.9211,14.781453 z"),
};

Models.Airplane.prototype.aero_coefficients = function (cos_alpha, sin_alpha)
{
    const [cos2, sin2] = double_angle(cos_alpha, sin_alpha);
    const [cos4, sin4] = double_angle(cos2, sin2);
    const [cos6, sin6] = angle_sum(cos2,sin2,cos4,sin4);

    const CL = 1.4405 * sin2 + 0.5092 * sin4 + 0.16 * sin6;
    const CD = 0.03 + 1.5 * (0.5*(1 - cos2));
    return [CL, CD];
}

Models.Airplane.prototype.wing_force = function (wing, vx, vy, pitch, pitch_rate)
{
    vx -= pitch_rate * wing.py;
    vy += pitch_rate * wing.px;

    let speed_squared = vx*vx + vy*vy;
    let speed = Math.max(Math.sqrt(speed_squared), 0.0001);

    let evx = vx / speed;
    let evy = vy / speed;

    const [cos_alpha, sin_alpha] = angle_difference(Math.cos(wing.incidence_angle), Math.sin(wing.incidence_angle), evx, evy);

    const [CL, CD] = this.aero_coefficients(cos_alpha, sin_alpha);

    let qbarS = 0.5 * 1.2 * speed_squared * wing.area;
    let fx = qbarS * (-CD * evx - CL * evy);
    let fy = qbarS * (-CD * evy + CL * evx);

    return [fx, fy, wing.px * fy - wing.py * fx];
}

Models.Airplane.prototype.simulate = function (dt, controlFunc)
{
    var input = controlFunc({x: this.x, vx: this.vx, y: this.y, vy: this.vy, pitch: this.pitch, pitch_rate: this.pitch_rate, T: this.T}); // call user controller
    if(typeof input != 'object'
    || typeof input.elevator != 'number'
    || typeof input.throttle != 'number'
    || typeof input.brake != 'number'
    )
        throw "Error: The controlFunction must return an object: {elevator:number, throttle:number, brake:number}";
    this.elevator_command = Math.max(-0.3, Math.min(0.3, input.elevator));
    this.throttle_command = Math.max(0.0, Math.min(1.0, input.throttle));
    this.brake_command    = Math.max(0.0, Math.min(1.0, input.brake));
    integrationStep(this, ['x', 'vx', 'y', 'vy', 'pitch', 'pitch_rate', 'elevator_angle', 'throttle', 'brake'], dt);
}

Models.Airplane.prototype.ode = function (x) {

    let vx              = x[1];
    let py              = x[2];
    let vy              = x[3];
    let pitch           = x[4];
    let pitch_rate      = x[5];
    let elevator_angle  = x[6];
    let throttle        = x[7];
    let brake           = x[8];

    const g0 = 9.81;

    let C = Math.cos(pitch);
    let S = Math.sin(pitch);

    let vx_body =  C * vx + S * vy;
    let vy_body = -S * vx + C * vy;

    this.wings[1].incidence_angle = -elevator_angle;

    const [fx0, fy0, M0] = this.wing_force(this.wings[0], vx_body, vy_body, pitch, pitch_rate);
    const [fx1, fy1, M1] = this.wing_force(this.wings[1], vx_body, vy_body, pitch, pitch_rate);

    let m = 1000.0;
    let J = 4000.0;

    this.max_load_factor = Math.max(this.max_load_factor, Math.sqrt(fx0*fx0 + fy0*fy0) / (m*g0));
    this.max_load_factor = Math.max(this.max_load_factor, Math.sqrt(fx1*fx1 + fy1*fy1) / (m*g0));

    this.thrust = throttle * m * 5.0;

    let ax_body = (fx0 + fx1 + this.thrust) / m;
    let ay_body = (fy0 + fy1) / m;
    let pitch_accel = (M0 + M1) / J;

    let ax = C * ax_body - S * ay_body;
    let ay = S * ax_body + C * ay_body - g0;

    for(let i = 0; i < this.wheels.length; i++)
    {
        let px_rel = C * this.wheels[i].px - S * this.wheels[i].py;
        let py_rel = S * this.wheels[i].px + C * this.wheels[i].py;
        let py_wheel = py + py_rel - this.wheels[i].radius;
        let vy_wheel = vy + pitch_rate * C * this.wheels[i].px - pitch_rate * S * this.wheels[i].py;
        this.wheels[i].compression = C * Math.max(-py_wheel, 0);
        this.wheels[i].fy = Math.max(-m * py_wheel * 40, 0);
        if(py_wheel < 0) this.wheels[i].fy += Math.max(-vy_wheel * m * 2.0, 0);
        if(i == 0) this.wheels[i].fx = -0.8 * brake * this.wheels[i].fy * vx / Math.max(Math.abs(vx), 0.3);
        else this.wheels[i].fx = 0.0;
        ax += this.wheels[i].fx / m;
        ay += this.wheels[i].fy / m;
        pitch_accel += (this.wheels[i].fy * px_rel - this.wheels[i].fx * py_rel) / J;

        this.max_load_factor = Math.max(this.max_load_factor, Math.sqrt(this.wheels[i].fx*this.wheels[i].fx + this.wheels[i].fy*this.wheels[i].fy) / (m*g0));
    }

    return [
        vx,
        ax,
        vy,
        ay,
        pitch_rate,
        pitch_accel,
        30.0 * (this.elevator_command - elevator_angle),
        10.0 * (this.throttle_command - throttle),
        10.0 * (this.brake_command - brake),
    ];
}

Models.Airplane.prototype.crashed = function ()
{
    if(this.y > 20) return false;
    let C = Math.cos(this.pitch);
    let S = Math.sin(this.pitch);
    for(let i = 0; i < this.hitbox.length; i++)
    {
        let py = this.y + S * this.hitbox[i][0] + C * this.hitbox[i][1];
        if(py < 0) return true;
    }
    return false;
}

Models.Airplane.prototype.structural_overload = function ()
{
    return this.max_load_factor > 2.5;
}

Models.Airplane.prototype.draw = function (ctx, canvas)
{
    ctx.scale(0.32, 0.32);
    ctx.translate(0,-3);

    const force_scale = 0.0005;

    // Background (back to front)
    const profiles = [
        [0.00e+00,3.65e-02,1.22e-01,4.16e-01,5.02e-01,3.41e-01,5.69e-01,5.22e-01,4.70e-01,5.28e-01,2.48e-01,4.46e-01,8.12e-03,-1.55e-01,-2.75e-01,-3.72e-02,-1.60e-01,-6.88e-02,-1.63e-01,8.41e-02,2.15e-01,5.27e-01,5.18e-01,2.90e-01,3.37e-01,2.19e-01,-7.31e-02,-3.84e-01,6.35e-02,-8.37e-02,-1.62e-01,-3.74e-01,-4.66e-01,-8.53e-01,-9.89e-01,-1.00e+00,-9.83e-01,-8.37e-01,-9.67e-01,-8.81e-01,-3.58e-01,-5.03e-01,-4.74e-01,-3.13e-01,-1.38e-01,-1.67e-03,-1.69e-01,-1.35e-01,-5.94e-01,-8.36e-01,-6.02e-01,-3.62e-01,-3.48e-01,6.84e-03,-3.99e-01,6.19e-03,5.05e-01,5.52e-01,4.74e-01,3.80e-01,4.98e-01,1.62e-01,2.48e-01,4.84e-01,6.86e-01,1.92e-01,-3.51e-01,-5.89e-01,-6.26e-01,-4.76e-01,-6.52e-01,-7.35e-01,-7.17e-01,-5.34e-01,-7.51e-01,-7.77e-01,-6.96e-01,-8.93e-01,-8.77e-01,-4.08e-01,-4.52e-01,-3.28e-01,2.78e-01,2.30e-01,-2.43e-02,2.72e-01,2.16e-01,4.79e-01,7.23e-01,6.91e-01,9.18e-01,8.02e-01,7.51e-01,6.05e-01,6.47e-01,4.56e-01,3.34e-01,1.26e-01,3.51e-01,0.00e+00],
        [0.00e+00,3.42e-02,2.23e-02,-9.52e-02,-6.64e-02,-2.03e-01,-2.73e-01,-2.60e-01,-2.75e-01,-3.92e-01,-4.07e-01,-4.29e-01,-3.91e-01,-4.17e-01,-3.69e-01,-3.37e-01,-3.77e-01,-4.54e-01,-5.80e-01,-4.49e-01,-4.76e-01,-5.30e-01,-3.87e-01,-3.65e-01,-4.34e-01,-4.13e-01,-4.29e-01,-4.25e-01,-5.25e-01,-6.76e-01,-7.09e-01,-8.20e-01,-7.71e-01,-7.98e-01,-7.60e-01,-7.75e-01,-6.84e-01,-6.27e-01,-6.64e-01,-8.74e-01,-9.33e-01,-1.00e+00,-9.39e-01,-8.26e-01,-8.53e-01,-7.16e-01,-8.18e-01,-6.60e-01,-6.24e-01,-5.98e-01,-5.45e-01,-4.51e-01,-4.08e-01,-3.97e-01,-4.40e-01,-4.24e-01,-4.19e-01,-4.71e-01,-4.04e-01,-5.23e-01,-4.37e-01,-4.31e-01,-4.98e-01,-5.20e-01,-3.98e-01,-3.26e-01,-3.12e-01,-3.75e-01,-4.21e-01,-3.38e-01,-3.26e-01,-2.86e-01,-2.19e-01,-2.02e-01,-1.77e-01,-1.48e-01,-2.32e-01,-1.25e-01,-1.44e-01,-1.84e-01,-2.31e-01,-1.74e-01,-1.77e-01,-1.03e-01,-2.06e-01,-3.75e-02,4.11e-02,6.51e-02,2.40e-02,-9.62e-02,-1.01e-01,-1.09e-01,-2.91e-02,2.95e-02,9.23e-02,-1.44e-02,8.34e-02,8.71e-03,1.95e-02,0.00e+00],
        [0.00e+00,-1.51e-03,1.64e-01,9.90e-02,3.57e-01,1.80e-01,1.25e-02,1.03e-01,1.73e-01,7.11e-03,-3.31e-02,2.40e-01,1.34e-01,4.02e-01,4.97e-01,5.64e-01,5.35e-01,4.96e-01,4.77e-01,4.87e-01,6.55e-01,6.39e-01,4.08e-01,4.28e-01,4.97e-01,4.76e-01,3.15e-01,2.94e-01,1.34e-01,3.65e-01,2.10e-01,3.07e-01,2.80e-01,3.80e-01,1.74e-01,1.91e-01,1.89e-01,2.70e-01,-1.01e-01,-7.13e-02,9.58e-02,2.22e-01,1.96e-01,1.04e-01,3.12e-02,7.74e-03,1.54e-01,1.61e-01,1.00e-01,1.57e-01,1.28e-01,1.81e-01,3.99e-02,-9.85e-02,-3.06e-01,-4.78e-01,-2.24e-01,-1.76e-01,-1.84e-01,-4.26e-01,-5.31e-01,-5.74e-01,-6.29e-01,-6.47e-01,-7.31e-01,-6.49e-01,-2.53e-01,-5.54e-01,-6.49e-01,-6.16e-01,-6.98e-01,-8.05e-01,-6.08e-01,-6.48e-01,-8.33e-01,-7.70e-01,-8.26e-01,-9.43e-01,-7.06e-01,-5.56e-01,-6.36e-01,-3.96e-01,-5.17e-01,-8.40e-01,-8.38e-01,-9.62e-01,-1.00e+00,-8.98e-01,-8.87e-01,-8.74e-01,-4.78e-01,-4.19e-01,-5.33e-01,-6.01e-01,-5.77e-01,-5.87e-01,-5.62e-01,-3.03e-01,-4.15e-01,0.00e+00],
        [0.00e+00,1.59e-01,-1.14e-01,1.76e-01,3.41e-02,6.47e-02,3.55e-01,3.70e-01,3.99e-01,2.72e-01,6.56e-02,1.99e-01,2.80e-01,6.50e-02,5.76e-02,2.25e-01,2.08e-01,-2.01e-02,2.42e-01,1.88e-01,3.89e-01,6.97e-01,5.79e-01,6.04e-01,6.70e-01,3.75e-01,4.06e-01,6.97e-01,4.23e-01,3.03e-01,4.85e-01,2.84e-01,1.52e-01,9.80e-02,1.74e-01,5.20e-01,4.67e-01,4.81e-01,4.47e-01,5.27e-01,6.60e-01,9.46e-01,9.72e-01,9.71e-01,9.24e-01,8.73e-01,8.03e-01,9.47e-01,8.63e-01,7.31e-01,9.06e-01,7.13e-01,4.46e-01,4.95e-01,2.75e-01,2.24e-01,1.71e-01,-6.88e-02,9.95e-04,3.16e-01,3.22e-01,5.33e-01,5.36e-01,1.89e-01,1.24e-01,-2.26e-01,-2.67e-01,-4.51e-01,-2.62e-01,-6.15e-01,-4.93e-01,-5.02e-01,-6.97e-01,-6.64e-01,-9.32e-01,-1.00e+00,-9.19e-01,-3.63e-01,-5.26e-01,-2.72e-01,-2.78e-01,-3.77e-01,-2.00e-01,-6.35e-02,-1.05e-01,1.84e-02,2.79e-01,4.62e-01,9.03e-02,2.81e-01,3.06e-01,2.96e-01,5.30e-01,6.46e-01,3.59e-01,6.06e-01,5.41e-01,5.34e-01,3.71e-01,0.00e+00],
        [0.00e+00,5.40e-02,-1.64e-01,-5.51e-02,-2.59e-01,-2.18e-01,-2.89e-01,-5.92e-01,-8.96e-01,-8.44e-01,-8.53e-01,-8.13e-01,-8.14e-01,-8.55e-01,-6.60e-01,-8.29e-01,-8.75e-01,-9.09e-01,-7.82e-01,-1.00e+00,-9.52e-01,-8.74e-01,-8.81e-01,-8.35e-01,-7.11e-01,-6.63e-01,-4.96e-01,-5.18e-01,-4.78e-01,-4.62e-01,-5.68e-01,-7.15e-01,-8.03e-01,-8.60e-01,-9.17e-01,-6.34e-01,-4.88e-01,-4.43e-01,-4.81e-01,-5.52e-01,-4.64e-01,-5.22e-01,-4.21e-01,-6.42e-01,-3.88e-01,-4.51e-01,-7.06e-01,-7.38e-01,-6.49e-01,-3.52e-01,-1.65e-01,-3.88e-01,-5.79e-01,-5.10e-01,-4.90e-01,-4.98e-01,-5.76e-01,-5.85e-01,-3.38e-01,-3.56e-01,-5.21e-01,-6.76e-01,-8.73e-01,-7.94e-01,-5.73e-01,-4.48e-01,-4.94e-01,-5.01e-01,-2.70e-02,2.70e-02,-5.15e-02,4.24e-02,1.61e-01,3.41e-01,3.57e-01,2.94e-01,5.19e-01,4.03e-01,4.53e-01,1.84e-01,3.43e-02,2.49e-01,1.07e-01,3.66e-01,4.22e-01,3.38e-01,3.99e-01,3.95e-01,3.55e-01,2.31e-01,3.46e-01,3.86e-01,1.46e-01,-1.05e-01,-2.43e-01,-6.60e-02,2.45e-01,2.09e-02,1.78e-01,0.00e+00],
    ];

    const palette = ["#7C9EC1", "#5B84B1", "#4B719D", "#2C496F", "#193252"];

    for(let i = 0; i < profiles.length; i++)
    {
        const z = 6000 - i*1000;
        const delta_x = 60.0;
        const width = delta_x * (profiles[i].length-1);
        const x_mod = this.x % width;

        ctx.save();
        ctx.scale(40/z, 40/z);
        ctx.translate(-x_mod - width/2, -this.y);
        ctx.fillStyle = palette[i];
        ctx.beginPath();
        ctx.moveTo(0, -2000);
        for(let k = 0; k < 2; k++)
        {
            for(let j = 0; j < profiles[i].length; j++)
            {
                ctx.lineTo(k * width + delta_x * j, 200.0 * (profiles[i][j] + 1.0));
            }
        }
        ctx.lineTo(2*width, -2000);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Trees
    for(let i = 0; i < 2; i++)
    {
        ctx.save();
        ctx.translate(-(this.x % 60.0 - i * 60.0) * 0.5, -this.y);
        ctx.scale(0.1, -0.1);
        ctx.translate(-126.0,-92.0);
        ctx.beginPath();
        ctx.fillStyle="#541e00";
        ctx.fill(this.tree_stem_path);
        ctx.beginPath();
        ctx.fillStyle="#49842a";
        ctx.fill(this.tree_top_path);
        ctx.restore();
    }

    // Ground
    ctx.save();
    ctx.translate(0, -this.y);
    ctx.fillStyle = "#5B3E2A";
    ctx.beginPath();
    ctx.moveTo(-100,    0);
    ctx.lineTo(100,     0);
    ctx.lineTo(100,  -200);
    ctx.lineTo(-100, -200);
    ctx.closePath();
    ctx.fill();

    // Runway stripes
    const stripe_width = 12.0;
    for(let i = 0; i < 3; i++)
    {
        ctx.fillStyle = "#ccc";
        ctx.beginPath();
        let stripe_x = -(this.x % (2*stripe_width)) + (i-1)*(2*stripe_width);
        ctx.moveTo(stripe_x, 0);
        ctx.lineTo(stripe_x + stripe_width, 0);
        ctx.lineTo(stripe_x + stripe_width, -1);
        ctx.lineTo(stripe_x, -1);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // Body coordinates
    ctx.save();
    ctx.rotate(this.pitch);

    // Wheels
    for(let i = 0; i < this.wheels.length; i++)
    {
        ctx.strokeStyle="#555";
        drawLine(ctx, this.wheels[i].px, this.wheels[i].py + this.wheels[i].compression, this.wheels[i].px, 0, 0.5 * this.wheels[i].radius);
        ctx.beginPath();
        ctx.arc(this.wheels[i].px, this.wheels[i].py + this.wheels[i].compression, this.wheels[i].radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#111';
        ctx.fill();
        ctx.strokeStyle="#eee";
        ctx.lineWidth = 0.03;
        ctx.stroke();
    }

    // Body outline
    ctx.save();
    ctx.scale(0.13, -0.13);
    ctx.translate(-98,-53);
    ctx.beginPath();
    ctx.fillStyle="#999999";
    ctx.fill(this.airplane_path);
    ctx.restore();

    let C = Math.cos(this.pitch);
    let S = Math.sin(this.pitch);
    let vx_body =  C * this.vx + S * this.vy;
    let vy_body = -S * this.vx + C * this.vy;
    for(let i = 0; i < this.wings.length; i++)
    {
        // Airfoil
        ctx.save();
        ctx.translate(this.wings[i].px,this.wings[i].py);
        let sq = Math.sqrt(this.wings[i].area);
        ctx.scale(0.004 * sq, 0.005 * sq);
        ctx.rotate(this.wings[i].incidence_angle);
        ctx.translate(-150.0,-80.0);
        ctx.beginPath();
        ctx.fillStyle="#666666";
        ctx.fill(this.airfoil_path);
        ctx.restore();

        // Aero forces
        const [fx, fy, M] = this.wing_force(this.wings[i], vx_body, vy_body, this.pitch, this.pitch_rate);
        ctx.strokeStyle="#ff0000";
        let fxs = force_scale * fx;
        let fys = force_scale * fy;
        if(fxs*fxs + fys*fys > 0.01)
        {
            drawArrow(ctx, this.wings[i].px, this.wings[i].py, fxs, fys, 0.15, 0.1);
        }
    }

    // Thrust force
    if(force_scale * this.thrust > 0.01) drawArrow(ctx, 1.0, 0, force_scale * this.thrust, 0, 0.15, 0.1);
    ctx.restore(); // End of body coordinates

    // Wheel forces
    for(let i = 0; i < this.wheels.length; i++)
    {
        let px_rel = C * this.wheels[i].px - S * (this.wheels[i].py + this.wheels[i].compression);
        let py_rel = S * this.wheels[i].px + C * (this.wheels[i].py + this.wheels[i].compression);
        ctx.strokeStyle="#ff0000";
        let fxs = force_scale * this.wheels[i].fx;
        let fys = force_scale * this.wheels[i].fy;
        if(fxs*fxs + fys*fys > 0.01)
        {
            drawArrow(ctx, px_rel, py_rel, fxs, fys, 0.15, 0.1);
        }
    }

    if(this.crashed()) {
        ctx.save();
        ctx.scale(0.07,-0.07);
        ctx.textAlign="center";
        ctx.font="10px Verdana";
        ctx.fillStyle="#000";
        ctx.fillText("CRASHED!",0.4,0.4);
        ctx.fillStyle="#f00";
        ctx.fillText("CRASHED!",0,0);
        ctx.restore();
    }
    else if(this.structural_overload()) {
        ctx.save();
        ctx.scale(0.07,-0.07);
        ctx.textAlign="center";
        ctx.font="10px Verdana";
        ctx.fillStyle="#000";
        ctx.fillText("Structural overload!",0.4,0.4);
        ctx.fillStyle="#f00";
        ctx.fillText("Structural overload!",0,0);
        ctx.restore();
    }
}

Models.Airplane.prototype.infoText = function ()
{
    return  "vehicle.x          = " + round(this.x,2)
        + "\nvehicle.vx         = " + round(this.vx,2)
        + "\nvehicle.y          = " + round(this.y,2)
        + "\nvehicle.vy         = " + round(this.vy,2)
        + "\nvehicle.pitch      = " + round(this.pitch,2)
        + "\nvehicle.pitch_rate = " + round(this.pitch_rate,2)
        + "\nvehicle.T          = " + round(this.T,2);
}
