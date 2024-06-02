'use strict';
if (typeof Models === 'undefined') var Models = {};

Models.BouncingBallPlatform = function(params)
{
    var nVars = Object.keys(this.vars).length;
    for(var i = 0; i < nVars; i++)
    {
        var key = Object.keys(this.vars)[i];
        this[key] = (typeof params[key] == 'undefined')?this.vars[key]:params[key];
    }
}

Models.BouncingBallPlatform.prototype.vars = 
{
    ball_x: -2.0,
    ball_y: -1.1,
    ball_dx: 1.5,
    ball_dy: 0.01,
    ball_radius: 0.2,
    platform_base_y: -5.0,
    piston_length: 2.0,
    piston_speed: 0.0,
    piston_length_min: 1.5,
    piston_length_max: 2.3,
    paddle_half_width: 1.5,
    paddle_thickness: 0.15,
    hinge_angle: 0.05,
    hinge_angular_speed: 0.0,
    hinge_angle_max: 0.7,
    g: 9.81,
    T: 0,
    contact_point_rel_x: 0,
    contact_distance: 10,
    edge_balance_win_condition_counter: 0,
    bounce_win_condition_counter: 0,
    show_zero_cross: false,
};


Models.BouncingBallPlatform.prototype.simulate = function (dt, controlFunc)
{
    var commands = controlFunc(
        {
            x:this.ball_x,
            y:this.ball_y,
            vx:this.ball_dx,
            vy:this.ball_dy,
        },
        {
            length:this.piston_length,
            speed:this.piston_speed,
        },
        {
            angle:this.hinge_angle,
            speed:this.hinge_angular_speed,
        },
        this.T
    ); 
    if(typeof commands != 'object' || typeof commands.pistonAcceleration != 'number' || typeof commands.hingeAcceleration != 'number') 
        throw "Error: The controlFunction must return an object: {pistonAcceleration:number, hingeAcceleration:number}";

    commands.pistonAcceleration = Math.max(-10.0, Math.min(10.0, commands.pistonAcceleration)); // input limits
    commands.hingeAcceleration = Math.max(-15.0, Math.min(15.0, commands.hingeAcceleration)); // input limits

    var n_substeps = 5;
    for (var i = 0; i < n_substeps; i++)
    {
        this.simulate_substep(dt/n_substeps, commands);
    }
}

Models.BouncingBallPlatform.prototype.simulate_substep = function (dt, commands)
{
    this.ball_x += dt * this.ball_dx;
    this.ball_y += dt * this.ball_dy + (0.5*dt*dt)*(-this.g);
    this.ball_dy -= dt * this.g;

    if(this.ball_y - this.ball_radius < this.platform_base_y) this.ball_dy = Math.abs(this.ball_dy);

    this.hinge_angular_speed += dt * commands.hingeAcceleration;
    this.hinge_angle += dt * this.hinge_angular_speed;

    this.piston_speed += dt * commands.pistonAcceleration;
    this.piston_length += dt * this.piston_speed;

    if(this.piston_length > this.piston_length_max)
    {
        this.piston_length = this.piston_length_max;
        this.piston_speed = Math.min(0.0, this.piston_speed);
    }

    if(this.piston_length < this.piston_length_min)
    {
        this.piston_length = this.piston_length_min;
        this.piston_speed = Math.max(0.0, this.piston_speed);
    }

    if(this.hinge_angle > this.hinge_angle_max)
    {
        this.hinge_angle = this.hinge_angle_max;
        this.hinge_angular_speed = Math.min(0.0, this.hinge_angular_speed);
    }

    if(this.hinge_angle < -this.hinge_angle_max)
    {
        this.hinge_angle = -this.hinge_angle_max;
        this.hinge_angular_speed = Math.max(0.0, this.hinge_angular_speed);
    }

    // Collision calculations
    var C = Math.cos(this.hinge_angle);
    var S = Math.sin(this.hinge_angle);

    var dC_dt = -Math.sin(this.hinge_angle) * this.hinge_angular_speed;
    var dS_dt =  Math.cos(this.hinge_angle) * this.hinge_angular_speed;

    var paddle_center_x =                                           - S * this.paddle_thickness;
    var paddle_center_y = this.platform_base_y + this.piston_length + C * this.paddle_thickness;

    var paddle_center_velocity_x =                   - dS_dt * this.paddle_thickness;
    var paddle_center_velocity_y = this.piston_speed + dC_dt * this.paddle_thickness;

    var ball_rel_x =  C * (this.ball_x - paddle_center_x) + S * (this.ball_y - paddle_center_y);
    var ball_rel_y = -S * (this.ball_x - paddle_center_x) + C * (this.ball_y - paddle_center_y);

    var contact_point_rel_x = Math.max(-this.paddle_half_width, Math.min(this.paddle_half_width, ball_rel_x));
    this.contact_point_rel_x = contact_point_rel_x;

    var contact_point_x = paddle_center_x + C * contact_point_rel_x;
    var contact_point_y = paddle_center_y + S * contact_point_rel_x;

    var contact_point_velocity_x = paddle_center_velocity_x + dC_dt * contact_point_rel_x;
    var contact_point_velocity_y = paddle_center_velocity_y + dS_dt * contact_point_rel_x;

    var contact_normal_x = this.ball_x - contact_point_x;
    var contact_normal_y = this.ball_y - contact_point_y;

    var contact_distance = Math.sqrt(contact_normal_x*contact_normal_x + contact_normal_y*contact_normal_y);
    this.contact_distance = contact_distance;
    contact_normal_x /= contact_distance;
    contact_normal_y /= contact_distance;

    var ball_delta_velocity_x = this.ball_dx - contact_point_velocity_x;
    var ball_delta_velocity_y = this.ball_dy - contact_point_velocity_y;

    var ball_delta_velocity_normal = contact_normal_x * ball_delta_velocity_x + contact_normal_y * ball_delta_velocity_y;

    ball_delta_velocity_x += contact_normal_x * (-1.9 * ball_delta_velocity_normal);
    ball_delta_velocity_y += contact_normal_y * (-1.9 * ball_delta_velocity_normal);

    if(ball_delta_velocity_normal < 0 && contact_distance < this.ball_radius)
    {
        this.ball_dx = ball_delta_velocity_x + contact_point_velocity_x;
        this.ball_dy = ball_delta_velocity_y + contact_point_velocity_y;

        this.ball_x = contact_point_x + contact_normal_x * this.ball_radius;
        this.ball_y = contact_point_y + contact_normal_y * this.ball_radius;
    }

    // Balance level win condition
    if(
        (contact_distance < 2 * this.ball_radius) &&
        (Math.abs(contact_point_rel_x + this.paddle_half_width) < 0.05) &&
        (Math.abs(this.ball_dx) < 0.01) &&
        (Math.abs(this.ball_dy) < 0.5) &&
        (Math.abs(this.hinge_angular_speed) < 0.01) &&
        (Math.abs(this.piston_speed) < 0.01) &&
        (this.hinge_angle < -0.02)
    )
    {
        this.edge_balance_win_condition_counter += 1;
    }
    else
    {
        this.edge_balance_win_condition_counter = 0;
    }

    // Bounce level win condition
    var apogee = this.ball_y + this.ball_dy*this.ball_dy / (2 * this.g);
    if(
        (Math.abs(apogee) < 0.01) &&
        (Math.abs(this.ball_dx) < 0.01) &&
        (Math.abs(this.ball_x) < 0.01)
    )
    {
        this.bounce_win_condition_counter += 1;
    }
    else
    {
        this.bounce_win_condition_counter = 0;
    }

    this.T += dt;
    return this;
}


Models.BouncingBallPlatform.prototype.draw = function (ctx, canvas)
{
    ctx.scale(0.7,0.7);

    if(this.show_zero_cross)
    {
        ctx.strokeStyle="#333366";
        drawLine(ctx,0.1,0.1,-0.1,-0.1,0.05);
        drawLine(ctx,0.1,-0.1,-0.1,0.1,0.05);
    }


    // Piston and cylinder
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(-0.1, this.platform_base_y, 0.2, this.piston_length);
    ctx.fillStyle = '#555555';
    ctx.fillRect(-0.2, this.platform_base_y, 0.4, this.piston_length_min - 0.2);

    // Floor
    ctx.strokeStyle="#222222";
    drawLine(ctx,-1,this.platform_base_y,1,this.platform_base_y,1/40.0);

    ctx.save();
    ctx.translate(0,this.platform_base_y);
    ctx.translate(0,this.piston_length);
    ctx.rotate(this.hinge_angle);

    // Paddle
    ctx.fillStyle = '#0000aa';
    ctx.fillRect(-this.paddle_half_width, 0.0, 2*this.paddle_half_width, this.paddle_thickness);

    // Hinge
    ctx.beginPath();
    ctx.arc(0, 0, 0.12, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 0.09, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#000000';
    ctx.fill();

    ctx.restore();


    // Ball
    ctx.beginPath();
    ctx.arc(this.ball_x, this.ball_y, this.ball_radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#4444FF';
    ctx.fill();


    /*

    // Collision debugging graphics

    var C = Math.cos(this.hinge_angle);
    var S = Math.sin(this.hinge_angle);

    var dC_dt = -Math.sin(this.hinge_angle) * this.hinge_angular_speed;
    var dS_dt =  Math.cos(this.hinge_angle) * this.hinge_angular_speed;

    var paddle_center_x =                                           - S * this.paddle_thickness;
    var paddle_center_y = this.platform_base_y + this.piston_length + C * this.paddle_thickness;

    var paddle_center_velocity_x =                   - dS_dt * this.paddle_thickness;
    var paddle_center_velocity_y = this.piston_speed + dC_dt * this.paddle_thickness;

    var ball_rel_x =  C * (this.ball_x - paddle_center_x) + S * (this.ball_y - paddle_center_y);
    var ball_rel_y = -S * (this.ball_x - paddle_center_x) + C * (this.ball_y - paddle_center_y);

    var contact_point_rel_x = Math.max(-this.paddle_half_width, Math.min(this.paddle_half_width, ball_rel_x));

    var contact_point_x = paddle_center_x + C * contact_point_rel_x;
    var contact_point_y = paddle_center_y + S * contact_point_rel_x;

    var contact_point_velocity_x = paddle_center_velocity_x + dC_dt * contact_point_rel_x;
    var contact_point_velocity_y = paddle_center_velocity_y + dS_dt * contact_point_rel_x;

    var contact_normal_x = this.ball_x - contact_point_x;
    var contact_normal_y = this.ball_y - contact_point_y;

    var contact_distance = Math.sqrt(contact_normal_x*contact_normal_x + contact_normal_y*contact_normal_y);
    contact_normal_x /= contact_distance;
    contact_normal_y /= contact_distance;

    var ball_delta_velocity_x = this.ball_dx - contact_point_velocity_x;
    var ball_delta_velocity_y = this.ball_dy - contact_point_velocity_y;

    var ball_delta_velocity_normal = contact_normal_x * ball_delta_velocity_x + contact_normal_y * ball_delta_velocity_y;

    ball_delta_velocity_x += contact_normal_x * (-1.9 * ball_delta_velocity_normal);
    ball_delta_velocity_y += contact_normal_y * (-1.9 * ball_delta_velocity_normal);


    var ball_dx_new = ball_delta_velocity_x + contact_point_velocity_x;
    var ball_dy_new = ball_delta_velocity_y + contact_point_velocity_y;


    ctx.strokeStyle="#ff0000";
    var X = contact_point_x;
    var Y = contact_point_y;
    drawLine(ctx,X+0.1,Y+0.1,X-0.1,Y-0.1,0.02);
    drawLine(ctx,X+0.1,Y-0.1,X-0.1,Y+0.1,0.02);



    ctx.strokeStyle="#ff00ff";
    drawLine(ctx, contact_point_x, contact_point_y, contact_point_x + contact_normal_x, contact_point_y + contact_normal_y,0.03);

    if(ball_delta_velocity_normal < 0)
    {
        ctx.strokeStyle="#00ffff";
        drawLine(ctx, contact_point_x, contact_point_y, contact_point_x + ball_dx_new, contact_point_y + ball_dy_new, 0.03);
    }*/


}


Models.BouncingBallPlatform.prototype.infoText = function ()
{
    return  "ball.x        = " + this.ball_x.toFixed(2).padStart(6,' ')
        + "\nball.vx       = " + this.ball_dx.toFixed(2).padStart(6,' ')
        + "\nball.y        = " + this.ball_y.toFixed(2).padStart(6,' ')
        + "\nball.vy       = " + this.ball_dy.toFixed(2).padStart(6,' ')
        + "\npiston.length = " + this.piston_length.toFixed(2).padStart(6,' ')
        + "\npiston.speed  = " + this.piston_speed.toFixed(2).padStart(6,' ')
        + "\nhinge.angle   = " + this.hinge_angle.toFixed(2).padStart(6,' ')
        + "\nhinge.speed   = " + this.hinge_angular_speed.toFixed(2).padStart(6,' ')
        + "\nT             = " + this.T.toFixed(2).padStart(6,' ');   
}