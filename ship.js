// Daniel Shiffman
// http://codingrainbow.com
// http://patreon.com/codingrainbow
// Code for: https://youtu.be/hacZU523FyM

function Ship(pos, r) {
  Entity.call(this, width / 2, height / 2, 20);
  this.isDestroyed = false;
  this.destroyFrames = 600;
  this.shields = shieldTime;
  this.rmax = 4 / 3 * this.r;
  this.rmax2 = this.rmax * this.rmax;

  var scope = this;
  input.registerAsListener(" ".charCodeAt(0), function(char, code, press) {
    if (!press) {
      return;
    }

    var laser = new Laser(scope.pos, scope.heading);
    laser.playSoundEffect(laserSoundEffects[floor(random() * laserSoundEffects.length)]);
    lasers.push(laser);
  });
  input.registerAsListener(RIGHT_ARROW, function(char, code, press) {
    scope.setRotation(press ? 0.08 : 0);
  });
  input.registerAsListener(LEFT_ARROW, function(char, code, press) {
    scope.setRotation(press ? -0.08 : 0);
  });
  input.registerAsListener(UP_ARROW, function(char, code, press) {
    scope.setAccel(press ? 0.1 : 0);
  });

  this.update = function() {
    Entity.prototype.update.call(this);
    this.vel.mult(0.99);
    if (this.isDestroyed) {
      for (var i = 0; i < this.brokenParts.length; i++) {
        this.brokenParts[i].pos.add(this.brokenParts[i].vel);
        this.brokenParts[i].heading += this.brokenParts[i].rot;
      }
    } else {
      this.vel.mult(0.99);
    }
    if (this.shields > 0) {
      this.shields -= 1;
    }
  }

  this.brokenParts = [];
  this.destroy = function() {
    this.isDestroyed = true;
    for (var i = 0; i < 4; i++)
      this.brokenParts[i] = {
        pos: this.pos.copy(),
        vel: p5.Vector.random2D(),
        heading: random(0, 360),
        rot: random(-0.07, 0.07)
      };
  }

  this.hits = function(asteroid) {

    // Are shields up?
    if (this.shields > 0) {
      return false;
    }

    // Is the ship far from the asteroid?
    var dist2 = (this.pos.x - asteroid.pos.x) * (this.pos.x - asteroid.pos.x) + (this.pos.y - asteroid.pos.y) * (this.pos.y - asteroid.pos.y);
    if (dist2 >= (asteroid.rmax + this.rmax2) * (asteroid.rmax + this.rmax2)) {
      return false;
    }

    // Is the ship inside the asteroid?
    if (dist2 <= asteroid.rmin2) {
      return true;
    }

    // Otherwise, we need to check for line intersection  
    var vertices = this.vertices();
    var asteroid_vertices = asteroid.vertices();

    for (var i = 0; i < asteroid_vertices.length; i++) {
      for (var j = 0; j < vertices.length; j++) {
        if (lineIntersect(vertices[j], vertices[(j + 1) % vertices.length], asteroid_vertices[i], asteroid_vertices[(i + 1) % asteroid_vertices.length])) {
          return true;
        }
      }
    }
    return false;
  }

  this.render = function() {
    if (this.isDestroyed) {
      for (var i = 0; i < this.brokenParts.length; i++) {
        push();
        stroke(floor(255 * ((this.destroyFrames--) / 600)));
        var bp = this.brokenParts[i];
        translate(bp.pos.x, bp.pos.y);
        rotate(bp.heading);
        line(-this.r / 2, -this.r / 2, this.r / 2, this.r / 2);
        pop();
      }
    } else {
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.heading);
      fill(0);
      var shieldCol = random(map(this.shields, 0, shieldTime, 255, 0), 255);
      stroke(shieldCol, shieldCol, 255);
      triangle(-2 / 3 * this.r, -this.r, -2 / 3 * this.r, this.r, 4 / 3 * this.r, 0);

      if (this.accelMagnitude != 0) {
        translate(-this.r, 0);
        rotate(random(PI / 4, 3 * PI / 4));
        line(0, 0, 0, 10);
      }

      pop();
    }
  }

  this.vertices = function() {
    return [
      p5.Vector.add(createVector(-2 / 3 * this.r, this.r).rotate(this.heading), this.pos),
      p5.Vector.add(createVector(-2 / 3 * this.r, -this.r).rotate(this.heading), this.pos),
      p5.Vector.add(createVector(4 / 3 * this.r, 0).rotate(this.heading), this.pos)
    ];
  }

  this.within = function(pnt) {
    var p = this.vertices();
    var area = 2 * this.r * this.r;
    var s = 1 / (2 * area) * (p[0].y * p[2].x - p[0].x * p[2].y + (p[2].y - p[0].y) * pnt.x + (p[0].x - p[2].x) * pnt.y);
    var t = 1 / (2 * area) * (p[0].x * p[1].y - p[0].y * p[1].x + (p[0].y - p[1].y) * pnt.x + (p[1].x - p[0].x) * pnt.y);
    return (s >= 0 & t >= 0 & (1 - s - t) >= 0);
  }

  this.hits_seeker = function(seeker) {

    // Are shields up?
    if (this.shields > 0) {
      return false;
    }

    // Is the ship far away?
    var dist2 = (this.pos.x - seeker.pos.x) * (this.pos.x - seeker.pos.x) + (this.pos.y - seeker.pos.y) * (this.pos.y - seeker.pos.y);
    if (dist2 > this.rmax2) {
      return false;
    }

    // Otherwise check if the seeker is within the ship triangle
    return this.within(seeker.pos);
  }

  this.hits_ufo = function(u) {

    // Are shields up?
    if (this.shields > 0) {
      return false;
    }

    var dist2 = (this.pos.x - u.pos.x) * (this.pos.x - u.pos.x) + (this.pos.y - u.pos.y) * (this.pos.y - u.pos.y);
    return (dist2 <= 2500);
  }
}

Ship.prototype = Object.create(Entity.prototype);