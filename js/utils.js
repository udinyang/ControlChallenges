'use strict';

jQuery.fn.cleanWhitespace = function() {
    var textNodes = this.contents().filter(
    function() { return (this.nodeType == 3 && !/\S/.test(this.nodeValue)); })
    .remove();
    return this;
}

function round(x,d) {
    var shift = Math.pow(10, d);
    return Math.round(x*shift)/shift;
}

function drawLine(ctx,x1,y1,x2,y2,width) {
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.lineWidth = width;
    ctx.stroke();
}

function drawArrow(ctx, x_base, y_base, delta_x, delta_y, tip_size, line_width) {
    let x2 = x_base + delta_x;
    let y2 = y_base + delta_y;

    let len_squared = delta_x * delta_x + delta_y * delta_y;
    let len = Math.max(Math.sqrt(len_squared), 0.001);
    let ex = delta_x / len;
    let ey = delta_y / len;

    ctx.lineCap = 'round';
    drawLine(ctx, x_base, y_base, x2, y2, line_width);
    drawLine(ctx, x2, y2, x2 + tip_size * (-2.5*ex + ey), y2 + tip_size * (-2.5*ey - ex), line_width);
    drawLine(ctx, x2, y2, x2 + tip_size * (-2.5*ex - ey), y2 + tip_size * (-2.5*ey + ex), line_width);
    ctx.lineCap = 'butt';
}

function padSpaces(str,count) {
   return String('                                 ' + str).slice(-count);
};

function integrationStep(model, state_names, dt)
{
    let add = numeric.add;
    let mul = numeric.mul;
    let x0 = state_names.map(n=>model[n]);
    let k1 = model.ode(x0);
    let k2 = model.ode(add(x0, mul(0.5*dt, k1)));
    let k3 = model.ode(add(x0, mul(0.5*dt, k2)));
    let k4 = model.ode(add(x0, mul(    dt, k3)));
    let s1 = mul((1.0/6.0) * dt, k1);
    let s2 = mul((2.0/6.0) * dt, k2);
    let s3 = mul((2.0/6.0) * dt, k3);
    let s4 = mul((1.0/6.0) * dt, k4);
    let x1 = add(x0, add(add(s1,s2), add(s3,s4)));
    model.T += dt;
    for (let i = 0; i < x1.length; i++) model[state_names[i]] = x1[i];
}


function angle_sum(cos_a,sin_a,cos_b,sin_b)
{
    // return cos(a+b), sin(a+b)
    return [cos_a * cos_b - sin_a * sin_b, sin_a * cos_b + cos_a * sin_b]
}

function angle_difference(cos_a,sin_a,cos_b,sin_b)
{
    // returns cos(a-b), sin(a-b)
    return [cos_a * cos_b + sin_a * sin_b, sin_a * cos_b - cos_a * sin_b]
}

function double_angle(cos,sin)
{
    return angle_sum(cos,sin,cos,sin)
}