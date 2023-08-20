/* refer to https://spicyyoghurt.com/tutorials/html5-javascript-game-development/collision-detection-physics */

class GameObject
{
    constructor (context, x, y, vx, vy, mass)
    {
        this.context = context;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = mass;
        this.restitution = pseudoRandomNoGenerator(0, 9) / 10;
        this.is_colliding = false; 
    }
}

class Square extends GameObject
{
    constructor (context, x, y, vx, vy, mass)
    {
        super(context, x, y, vx, vy, mass);
        this.width = 50;
        this.height = 50;
    }

    draw()
    {
        // draw a simple Square
        this.context.fillStyle = this.is_colliding ? '#ff8080' : '#0099b0';
        this.context.fillRect(this.x, this.y, this.width, this.height);
    }

    update(seconds_passed)
    {
        // move with the velocity
        this.x += this.vx * seconds_passed;
        this.y += this.vy * seconds_passed;
    }
}

class Circle extends GameObject
{
    constructor(context, x, y, vx, vy, mass) {
        super(context, x, y, vx, vy, mass);
        this.radius = pseudoRandomNoGenerator(5, 16);
    }

    draw()
    {
        this.context.beginPath();
        this.context.fillStyle = this.is_colliding ? '#ff8080' : '#0099b0';
        this.context.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        this.context.fill();

        // draw heading vector, higher speed => longer line
        this.context.beginPath();
        this.context.moveTo(this.x, this.y);
        this.context.lineTo(this.x+this.vx, this.y+this.vy);
        this.context.stroke();
    }

    update(seconds_passed) {
        this.vy += g * seconds_passed;
        // move with the velocity
        this.x += this.vx * seconds_passed;
        this.y += this.vy * seconds_passed;

        // calculate the angle (vy before vx)
        let radians = Math.atan2(this.vy, this.vx);

        // conver to degrees
        let degrees = 180 * radians / Math.PI;
    }
}

// gravity const
const g = 9.81;
// set a restitution, a lower value will loose more energy when colliding
const RESTITUTION = 0.60;
const MAX_MASS = 5000;
const canvas = document.getElementById('game_canvas');
const context = canvas.getContext('2d');
const canvas_h = canvas.height;
const canvas_w = canvas.width;
let game_objects = [];
let seconds_passed;
let previous_time_stamp = 0;

gameInit();

function gameInit() {
    createWorld();
    requestAnimationFrame(gameLoop);
}

function createWorld()
{
    for (let i=0; i<10; i++)
    {
        let x = pseudoRandomNoGenerator(0, canvas_w);
        let y = pseudoRandomNoGenerator(0, canvas_h);
        let vx = pseudoRandomNoGenerator(-80, 80);
        let vy = pseudoRandomNoGenerator(-80, 80);
        let m = pseudoRandomNoGenerator(1, MAX_MASS);
        game_objects.push(new Circle(context, x, y, vx, vy, m));
    }
}

function gameLoop(time_stamp)
{
    seconds_passed = (time_stamp - previous_time_stamp) / 1000;
    previous_time_stamp = time_stamp;

    for (let i=0; i<game_objects.length; i++)
    {
        game_objects[i].update(seconds_passed);
    }
    clearCanvas();
    collisionDetect();
    edgeCollisionDetect();
    for (let i = 0; i < game_objects.length; i++) {
        game_objects[i].draw();
    }

    requestAnimationFrame(gameLoop);
}

function clearCanvas()
{
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function collisionDetect()
{
    let obj1;
    let obj2;
    for (let i=0; i<game_objects.length; i++)
    {
        game_objects[i].is_colliding = false;
    }
    for (let i=0; i<game_objects.length; i++)
    {
        obj1 = game_objects[i];
        for (let j=i+1; j<game_objects.length; j++)
        {
            obj2 = game_objects[j];
            // if (rectIntersect(obj1.x, obj1.y, obj1.width, obj1.height,
            //     obj2.x, obj2.y, obj2.width, obj2.height))
            // {
            //     game_objects[i].is_colliding = true;
            //     game_objects[j].is_colliding = true;
            // }
            if (circleIntersect(obj1.x, obj1.y, obj1.radius, obj2.x, obj2.y, obj2.radius))
            {
                game_objects[i].is_colliding = true;
                game_objects[j].is_colliding = true;
                let v_collision = { x: obj2.x-obj1.x, y: obj2.y-obj1.y };
                let distance = Math.sqrt((obj1.x - obj2.x) * (obj1.x - obj2.x) 
                    + (obj1.y - obj2.y) * (obj1.y - obj2.y));
                let v_collision_normal = {
                    x: v_collision.x / distance, 
                    y: v_collision.y / distance
                };
                let v_relative_velocity = { x: obj1.vx - obj2.vx, y: obj1.vy - obj2.vy };
                let speed = v_relative_velocity.x * v_collision_normal.x
                    + v_relative_velocity.y * v_collision_normal.y;
                speed *= Math.min(obj1.restitution, obj2.restitution);
                if (speed < 0)
                    break;
                let impulse = 2 * speed / (obj1.mass + obj2.mass);
                obj1.vx -= (impulse * obj2.mass * v_collision_normal.x);
                obj1.vy -= (impulse * obj2.mass * v_collision_normal.y);
                obj2.vx += (impulse * obj1.mass * v_collision_normal.x);
                obj2.vy += (impulse * obj1.mass * v_collision_normal.y);
            }
        }
    }
}

function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2)
{
    if (x2 > x1+w1 || x1 > x2+w2 || y2 > y1+h1 || y1 > y2+h2)
        return false;
    return true;
}

function circleIntersect(x1, y1, r1, x2, y2, r2)
{
    let square_distance = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
    return square_distance <= ((r1+r2) * (r1+r2));
}

function edgeCollisionDetect()
{
    let obj;
    for (let i=0; i<game_objects.length; i++)
    {
        obj = game_objects[i];
        if (obj.x < obj.radius)
        {
            obj.vx = Math.abs(obj.vx) * RESTITUTION;
            obj.x = obj.radius;
        }
        else if (obj.x > canvas.width - obj.radius)
        {
            obj.vx = -Math.abs(obj.vx) * RESTITUTION;
            obj.x = canvas.width - obj.radius;
        }
        if (obj.y < obj.radius)
        {
            obj.vy = Math.abs(obj.vy) * RESTITUTION;
            obj.y = obj.radius;
        }
        else if ( obj.y > canvas.height - obj.radius)
        {
            obj.vy = -Math.abs(obj.vy) * RESTITUTION;
            obj.y = canvas.height - obj.radius;
        }
    }
}