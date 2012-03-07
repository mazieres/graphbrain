(function() {
  Object.prototype.size = function () {
    var len = this.length ? --this.length : -1;
    for (var k in this)
        len++;
    return len;
};
  var Graph, GraphPos, Link, Node, Quaternion, SNode, VisualObj, curTargNode, dotProduct, draggedNode, dragging, g, initGraph, initInterface, interRect, lastX, lastY, lineRectOverlap, lineSegsOverlap, m4x4mulv3, newLink, nodeCount, pointInTriangle, rectsDist, rectsDist2, rectsOverlap, rotRectsOverlap, rotateAndTranslate, sepAxis, sepAxisSide, tipVisible, tmpVec, v3dotv3,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    _this = this;

  rotateAndTranslate = function(point, angle, tx, ty) {
    var rx, ry, x, y;
    x = point[0];
    y = point[1];
    rx = Math.cos(angle) * x - Math.sin(angle) * y;
    ry = Math.sin(angle) * x + Math.cos(angle) * y;
    x = rx + tx;
    y = ry + ty;
    point[0] = x;
    return point[1] = y;
  };

  dotProduct = function(p0, p1) {
    return (p0[0] * p1[0]) + (p0[1] * p1[1]);
  };

  pointInTriangle = function(A, B, C, P) {
    var dot00, dot01, dot02, dot11, dot12, invDenom, u, v, v0, v1, v2;
    v0 = [0, 0];
    v1 = [0, 0];
    v2 = [0, 0];
    v0[0] = C[0] - A[0];
    v0[1] = C[1] - A[1];
    v1[0] = B[0] - A[0];
    v1[1] = B[1] - A[1];
    v2[0] = P[0] - A[0];
    v2[1] = P[1] - A[1];
    dot00 = dotProduct(v0, v0);
    dot01 = dotProduct(v0, v1);
    dot02 = dotProduct(v0, v2);
    dot11 = dotProduct(v1, v1);
    dot12 = dotProduct(v1, v2);
    invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    v = (dot00 * dot12 - dot01 * dot02) * invDenom;
    return (u > 0) && (v > 0) && (u + v < 1);
  };

  /*
  Return the intersection point between the line segment defined by (x1, y1) and (x2, y2)
  and a rectangle defined by (rleft, rtop, rright, rbottom)
  
  (x1, y1) is assumed to be inside the rectangle and (x2, y2) outside
  */

  interRect = function(x1, y1, x2, y2, rleft, rtop, rright, rbottom) {
    var dx, dy, edge, ix, iy, t, tx, ty;
    dx = x2 - x1;
    dy = y2 - y1;
    t = tx = ty = 0;
    if ((dx === 0) && (dy === 0)) return 0;
    if (dx !== 0) {
      if (dx > 0) {
        edge = rright;
      } else {
        edge = rleft;
      }
      tx = (edge - x1) / dx;
    }
    if (dy !== 0) {
      if (dy > 0) {
        edge = rbottom;
      } else {
        edge = rtop;
      }
      ty = (edge - y1) / dy;
    }
    if (dx === 0) {
      t = ty;
    } else if (dy === 0) {
      t = tx;
    } else {
      if (tx < ty) {
        t = tx;
      } else {
        t = ty;
      }
    }
    ix = x1 + dx * t;
    iy = y1 + dy * t;
    return [ix, iy];
  };

  rectsOverlap = function(r1_x1, r1_y1, r1_x2, r1_y2, r2_x1, r2_y1, r2_x2, r2_y2) {
    if (r1_x1 < r2_x2 && r1_x2 > r2_x1 && r1_y1 < r2_y2 && r1_y2 > r2_y1) {
      return true;
    }
    return false;
  };

  sepAxisSide = function(a1, a2, point) {
    var dp;
    dp = ((a2.x - a1.x) * (point.y - a1.y)) - ((a2.y - a1.y) * (point.x - a1.x));
    if (dp < 0) {
      return -1;
    } else {
      return 1;
    }
  };

  sepAxis = function(a1, a2, point, rect) {
    var sign1, sign2;
    sign1 = sepAxisSide(a1, a2, point);
    sign2 = sepAxisSide(a1, a2, rect.v1);
    if (sign1 === sign2) return false;
    if (sign2 !== sepAxisSide(a1, a2, rect.v2)) return false;
    if (sign2 !== sepAxisSide(a1, a2, rect.v3)) return false;
    if (sign2 !== sepAxisSide(a1, a2, rect.v4)) return false;
    return true;
  };

  rotRectsOverlap = function(rect1, rect2) {
    if (sepAxis(rect1.v1, rect1.v2, rect1.v3, rect2)) return false;
    if (sepAxis(rect1.v2, rect1.v3, rect1.v1, rect2)) return false;
    if (sepAxis(rect1.v3, rect1.v4, rect1.v1, rect2)) return false;
    if (sepAxis(rect1.v4, rect1.v1, rect1.v2, rect2)) return false;
    if (sepAxis(rect2.v1, rect2.v2, rect2.v3, rect1)) return false;
    if (sepAxis(rect2.v2, rect2.v3, rect2.v1, rect1)) return false;
    if (sepAxis(rect2.v3, rect2.v4, rect2.v1, rect1)) return false;
    if (sepAxis(rect2.v4, rect2.v1, rect2.v2, rect1)) return false;
    return true;
  };

  rectsDist2 = function(r1_x1, r1_y1, r1_x2, r1_y2, r2_x1, r2_y1, r2_x2, r2_y2) {
    var c1_x, c1_y, c2_x, c2_y, deltaX, deltaY, p1, p2;
    if (rectsOverlap(r1_x1, r1_y1, r1_x2, r1_y2, r2_x1, r2_y1, r2_x2, r2_y2)) {
      return 0;
    }
    c1_x = r1_x1 + ((r1_x2 - r1_x1) / 2);
    c1_y = r1_y1 + ((r1_y2 - r1_y1) / 2);
    c2_x = r2_x1 + ((r2_x2 - r2_x1) / 2);
    c2_y = r2_y1 + ((r2_y2 - r2_y1) / 2);
    p1 = interRect(c1_x, c1_y, c2_x, c2_y, r1_x1, r1_y1, r1_x2, r1_y2);
    p2 = interRect(c2_x, c2_y, c1_x, c1_y, r2_x1, r2_y1, r2_x2, r2_y2);
    deltaX = p1[0] - p2[0];
    deltaY = p1[1] - p2[1];
    return (deltaX * deltaX) + (deltaY * deltaY);
  };

  rectsDist = function(r1_x1, r1_y1, r1_x2, r1_y2, r2_x1, r2_y1, r2_x2, r2_y2) {
    var dist;
    dist = rectsDist2(r1_x1, r1_y1, r1_x2, r1_y2, r2_x1, r2_y1, r2_x2, r2_y2);
    return Math.sqrt(dist);
  };

  lineSegsOverlap = function(x1, y1, x2, y2, x3, y3, x4, y4) {
    var denom, ua, ub;
    denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    ua = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
    ub = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);
    if (denom === 0) {
      if ((ua === 0) && (ub === 0)) {
        return true;
      } else {
        return false;
      }
    }
    ua /= denom;
    ub /= denom;
    if ((ua >= 0) && (ua <= 1) && (ub >= 0) && (ub <= 1)) {
      return true;
    } else {
      return false;
    }
  };

  lineRectOverlap = function(x1, y1, x2, y2, rect) {
    if (lineSegsOverlap(x1, y1, x2, y2, rect.v1.x, rect.v1.y, rect.v2.x, rect.v2.y)) {
      return true;
    }
    if (lineSegsOverlap(x1, y1, x2, y2, rect.v2.x, rect.v2.y, rect.v3.x, rect.v3.y)) {
      return true;
    }
    if (lineSegsOverlap(x1, y1, x2, y2, rect.v3.x, rect.v3.y, rect.v4.x, rect.v4.y)) {
      return true;
    }
    if (lineSegsOverlap(x1, y1, x2, y2, rect.v4.x, rect.v4.y, rect.v1.x, rect.v1.y)) {
      return true;
    }
    return false;
  };

  /*
  Collection of linear algebra functions for vectors with 3 elements and 4x4 matrices.
  Useful for 3D calculations.
  */

  tmpVec = new Array(3);

  /*
  Caluculates the dot product of a and b,
  where a and b are vectors with 3 elements.
  */

  v3dotv3 = function(a, b) {
    return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
  };

  /*
  r = m * v
  
  m: 4x4 matrix
  v: vector with 3 elements
  r: vetor with 3 elements to store results
  */

  m4x4mulv3 = function(m, v, r) {
    var w;
    tmpVec[0] = m[3];
    tmpVec[1] = m[7];
    tmpVec[2] = m[11];
    w = v3dotv3(v, tmpVec) + m[15];
    tmpVec[0] = m[0];
    tmpVec[1] = m[4];
    tmpVec[2] = m[8];
    r[0] = (v3dotv3(v, tmpVec) + m[12]) / w;
    tmpVec[0] = m[1];
    tmpVec[1] = m[5];
    tmpVec[2] = m[9];
    r[1] = (v3dotv3(v, tmpVec) + m[13]) / w;
    tmpVec[0] = m[2];
    tmpVec[1] = m[6];
    tmpVec[2] = m[10];
    return r[2] = (v3dotv3(v, tmpVec) + m[14]) / w;
  };

  /*
  This class implements certain aspects of quaternion arithmetic
  necessary to perfrom 3D rotations without gimbal lock.
  More info: http://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation
  */

  Quaternion = (function() {

    function Quaternion() {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    }

    Quaternion.prototype.fromEuler = function(pitch, yaw, roll) {
      var cosp, cosr, cosy, sinp, sinr, siny;
      sinp = Math.sin(pitch);
      siny = Math.sin(yaw);
      sinr = Math.sin(roll);
      cosp = Math.cos(pitch);
      cosy = Math.cos(yaw);
      cosr = Math.cos(roll);
      this.x = sinr * cosp * cosy - cosr * sinp * siny;
      this.y = cosr * sinp * cosy + sinr * cosp * siny;
      this.z = cosr * cosp * siny - sinr * sinp * cosy;
      this.w = cosr * cosp * cosy + sinr * sinp * siny;
      return this.normalise();
    };

    /*
        Normalise the quaternion so that it's length is 1
        Does not do anything if current length is within a certain tolerance
    */

    Quaternion.prototype.normalise = function() {
      var TOLERANCE, l;
      TOLERANCE = 0.00001;
      l = (this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w);
      if (Math.abs(l - 1) > TOLERANCE) {
        l = Math.sqrt(l);
        this.x /= l;
        this.y /= l;
        this.z /= l;
        return this.w /= l;
      }
    };

    /*
        Multiply quaternion q by this and store result in this
        (this = q * this)
        Purpose:
        Changes rotation represented by this by rotation represented by q
    */

    Quaternion.prototype.mul = function(q) {
      var _w, _x, _y, _z;
      _x = (this.w * q.x) + (this.x * q.w) + (this.y * q.z) - (this.z * q.y);
      _y = (this.w * q.y) - (this.x * q.z) + (this.y * q.w) + (this.z * q.x);
      _z = (this.w * q.z) + (this.x * q.y) - (this.y * q.x) + (this.z * q.w);
      _w = (this.w * q.w) - (this.x * q.x) - (this.y * q.y) - (this.z * q.z);
      this.x = _x;
      this.y = _y;
      this.z = _z;
      return this.w = _w;
    };

    /*
        Creates affine transformation matrix for the rotation represented by
        this quaternion.
        Matrix is written to the array with length 16 that must be provided as parameter.
        (for eficiency, avoid unnecesssary creation and destruction of arrays)
    */

    Quaternion.prototype.getMatrix = function(m) {
      var wx, wy, wz, x2, xy, xz, y2, yz, z2;
      x2 = this.x * this.x;
      y2 = this.y * this.y;
      z2 = this.z * this.z;
      xy = this.x * this.y;
      xz = this.x * this.z;
      yz = this.y * this.z;
      wx = this.w * this.x;
      wy = this.w * this.y;
      wz = this.w * this.z;
      m[0] = 1 - (2 * (y2 + z2));
      m[1] = 2 * (xy - wz);
      m[2] = 2 * (xz + wy);
      m[3] = 0;
      m[4] = 2 * (xy + wz);
      m[5] = 1 - (2 * (x2 + z2));
      m[6] = 2 * (yz - wx);
      m[7] = 0;
      m[8] = 2 * (xz - wy);
      m[9] = 2 * (yz + wx);
      m[10] = 1 - (2 * (x2 + y2));
      m[11] = 0;
      m[12] = 0;
      m[13] = 0;
      m[14] = 0;
      return m[15] = 1;
    };

    return Quaternion;

  })();

  VisualObj = (function() {

    function VisualObj() {
      this.rect = [];
      this.rect.v1 = [];
      this.rect.v2 = [];
      this.rect.v3 = [];
      this.rect.v4 = [];
      this.rect.v1.x = 0;
      this.rect.v1.y = 0;
      this.rect.v1.z = 0;
      this.rect.v2.x = 0;
      this.rect.v2.y = 0;
      this.rect.v2.z = 0;
      this.rect.v3.x = 0;
      this.rect.v3.y = 0;
      this.rect.v3.z = 0;
      this.rect.v4.x = 0;
      this.rect.v4.y = 0;
      this.rect.v4.z = 0;
    }

    VisualObj.prototype.overlaps = function(obj) {
      return rotRectsOverlap(this.rect, obj.rect);
    };

    return VisualObj;

  })();

  nodeCount = 0;

  Node = (function() {

    function Node(id, text, type, snode) {
      this.id = id;
      this.text = text;
      this.type = type;
      this.snode = snode;
      this.divid = 'n' + nodeCount++;
      this.rpos = Array(3);
      this.subNodes = [];
      this.sx = 0;
      this.sy = 0;
    }

    Node.prototype.calcPos = function() {
      var nodeDiv, offset;
      nodeDiv = $('#' + this.divid);
      offset = nodeDiv.offset();
      this.rpos[0] = offset.left + this.halfWidth;
      this.rpos[1] = offset.top + this.halfHeight;
      this.rpos[2] = 0;
      this.x0 = this.rpos[0] - this.halfWidth;
      this.y0 = this.rpos[1] - this.halfHeight;
      this.x1 = this.rpos[0] + this.halfWidth;
      this.y1 = this.rpos[1] + this.halfHeight;
      this.sx = this.rpos[0] - this.snode.x - this.snode.halfWidth;
      return this.sy = this.rpos[1] - this.snode.y - this.snode.halfHeight;
    };

    Node.prototype.estimatePos = function() {
      this.rpos[0] = this.snode.rpos[0] + this.sx;
      this.rpos[1] = this.snode.rpos[1] + this.sy;
      this.rpos[2] = this.snode.rpos[2];
      this.x0 = this.rpos[0] - this.halfWidth;
      this.y0 = this.rpos[1] - this.halfHeight;
      this.x1 = this.rpos[0] + this.halfWidth;
      return this.y1 = this.rpos[1] + this.halfHeight;
    };

    Node.prototype.place = function() {
      var node, nodeDiv, snodeDiv, _height, _width;
      node = document.createElement('div');
      node.setAttribute('class', 'node_' + this.snode.depth);
      node.setAttribute('id', this.divid);
      if (this.type === 'text') {
        node.innerHTML = '<a href="/node/' + this.id + '" id="' + this.divid + '">' + this.text + '</a>';
      } else if (this.type === 'image') {
        node.innerHTML = '<a href="/node/' + this.id + '" id="' + this.divid + '"><img src="' + this.text + '" width="50px" /></a>';
      }
      snodeDiv = document.getElementById(this.snode.id);
      snodeDiv.appendChild(node);
      nodeDiv = $('#' + this.divid);
      _width = nodeDiv.outerWidth();
      _height = nodeDiv.outerHeight();
      if (this.type === 'image') {
        _width = 50;
        _height = 80;
      }
      this.width = _width;
      this.height = _height;
      this.halfWidth = _width / 2;
      return this.halfHeight = _height / 2;
    };

    return Node;

  })();

  SNode = (function(_super) {

    __extends(SNode, _super);

    function SNode(id) {
      this.id = id;
      SNode.__super__.constructor.call(this);
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.rpos = Array(3);
      this.auxVec = new Array(3);
      this.nodes = {};
      this.subNodes = [];
      this.parent = 'unknown';
      this.links = [];
      this.weight = 0;
    }

    SNode.prototype.updatePos = function(_x, _y) {
      var key, link, _i, _len, _ref, _results;
      this.x = _x;
      this.y = _y;
      this.z = 0;
      this.auxVec[0] = this.x - g.halfWidth;
      this.auxVec[1] = this.y - g.halfHeight;
      this.auxVec[2] = 0;
      m4x4mulv3(g.affinMat, this.auxVec, this.rpos);
      this.rpos[0] += g.halfWidth;
      this.rpos[1] += g.halfHeight;
      this.x0 = this.rpos[0] - this.halfWidth;
      this.y0 = this.rpos[1] - this.halfHeight;
      this.x1 = this.rpos[0] + this.halfWidth;
      this.y1 = this.rpos[1] + this.halfHeight;
      this.rect.v1.x = this.rpos[0] - this.halfWidth;
      this.rect.v1.y = this.rpos[1] - this.halfHeight;
      this.rect.v2.x = this.rpos[0] - this.halfWidth;
      this.rect.v2.y = this.rpos[1] + this.halfHeight;
      this.rect.v3.x = this.rpos[0] + this.halfWidth;
      this.rect.v3.y = this.rpos[1] + this.halfHeight;
      this.rect.v4.x = this.rpos[0] + this.halfWidth;
      this.rect.v4.y = this.rpos[1] - this.halfHeight;
      for (key in this.nodes) {
        if (this.nodes.hasOwnProperty(key)) this.nodes[key].estimatePos();
      }
      _ref = this.links;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        link = _ref[_i];
        _results.push(link.updatePos());
      }
      return _results;
    };

    SNode.prototype.moveTo = function(x, y) {
      var transformStr;
      this.updatePos(x, y);
      transformStr = 'translate3d(' + (this.rpos[0] - this.halfWidth) + 'px,' + (this.rpos[1] - this.halfHeight) + 'px,' + this.rpos[2] + 'px)';
      return $('div#' + this.id).css('-webkit-transform', transformStr);
    };

    SNode.prototype.place = function() {
      var key, nodeObj, nodesCount, nodesDiv, snode, _height, _width,
        _this = this;
      snode = document.createElement('div');
      nodesCount = 0;
      for (key in this.nodes) {
        if (this.nodes.hasOwnProperty(key)) nodesCount++;
      }
      if (nodesCount > 1) {
        snode.setAttribute('class', 'snode_' + this.depth);
      } else {
        snode.setAttribute('class', 'snode1_' + this.depth);
      }
      snode.setAttribute('id', this.id);
      nodesDiv = document.getElementById("nodesDiv");
      nodesDiv.appendChild(snode);
      for (key in this.nodes) {
        if (this.nodes.hasOwnProperty(key)) this.nodes[key].place();
      }
      _width = $('div#' + this.id).outerWidth();
      _height = $('div#' + this.id).outerHeight();
      this.width = _width;
      this.height = _height;
      this.halfWidth = _width / 2;
      this.halfHeight = _height / 2;
      this.moveTo(this.x, this.y);
      for (key in this.nodes) {
        if (this.nodes.hasOwnProperty(key)) this.nodes[key].calcPos();
      }
      nodeObj = this;
      $('div#' + this.id).bind('mousedown', function(e) {
        var draggedNode, newLink;
        if (uiMode === 'drag') {
          draggedNode = nodeObj;
          return false;
        } else {
          newLink = new Link(0, nodeObj, false, '...');
          newLink.tx = e.pageX;
          newLink.ty = e.pageY;
          return false;
        }
      });
      $('div#' + this.id).bind('click', function(e) {
        var dragging;
        if (dragging) {
          dragging = false;
          return false;
        } else {
          return true;
        }
      });
      return $("div#" + this.id).hover(function(e) {
        if (newLink) return newLink.targ = nodeObj;
      }, function(e) {});
    };

    SNode.prototype.toString = function() {
      var key;
      for (key in this.nodes) {
        if (this.nodes.hasOwnProperty(key)) {
          return '{' + this.nodes[key].text + ', ...}';
        }
      }
    };

    return SNode;

  })(VisualObj);

  Link = (function(_super) {

    __extends(Link, _super);

    function Link(id, orig, sorig, targ, starg, label) {
      this.id = id;
      this.orig = orig;
      this.sorig = sorig;
      this.targ = targ;
      this.starg = starg;
      this.label = label;
      Link.__super__.constructor.call(this);
      this.ox = 0;
      this.oy = 0;
      this.tx = 0;
      this.ty = 0;
      this.len = 0;
    }

    Link.prototype.updatePos = function() {
      var i, origSuper, p, p0, p1, slope, targSuper, x0, x1, y0, y1, _dx, _dy, _orig, _targ;
      _orig = false;
      _targ = false;
      origSuper = false;
      targSuper = false;
      if (this.orig) {
        _orig = this.orig;
      } else if (this.sorig) {
        _orig = this.sorig;
        this.origSuper = true;
      }
      if (this.targ) {
        _targ = this.targ;
      } else if (this.starg) {
        _targ = this.starg;
        this.targSuper = true;
      }
      x0 = _orig.rpos[0];
      y0 = _orig.rpos[1];
      x1 = _targ.rpos[0];
      y1 = _targ.rpos[1];
      p0 = interRect(x0, y0, x1, y1, _orig.x0, _orig.y0, _orig.x1, _orig.y1);
      p1 = interRect(x1, y1, x0, y0, _targ.x0, _targ.y0, _targ.x1, _targ.y1);
      this.x0 = p0[0];
      this.y0 = p0[1];
      this.z0 = _orig.rpos[2];
      this.x1 = p1[0];
      this.y1 = p1[1];
      this.z1 = _targ.rpos[2];
      _dx = this.x1 - this.x0;
      _dy = this.y1 - this.y0;
      this.dx = _dx;
      this.dy = _dy;
      this.len = (_dx * _dx) + (_dy * _dy);
      this.len = Math.sqrt(this.len);
      this.cx = this.x0 + ((this.x1 - this.x0) / 2);
      this.cy = this.y0 + ((this.y1 - this.y0) / 2);
      slope = (this.y1 - this.y0) / (this.x1 - this.x0);
      this.angle = Math.atan(slope);
      p = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
      if ((this.x0 < this.x1) || ((this.x0 === this.x1) && (this.y0 < this.y1))) {
        p[0][0] = -this.halfWidth;
        p[0][1] = -this.halfHeight;
        p[1][0] = -this.halfWidth;
        p[1][1] = this.halfHeight;
        p[2][0] = this.halfWidth;
        p[2][1] = this.halfHeight;
        p[3][0] = this.halfWidth + 6;
        p[3][1] = 0;
        p[4][0] = this.halfWidth;
        p[4][1] = -this.halfHeight;
      } else {
        p[0][0] = -this.halfWidth;
        p[0][1] = -this.halfHeight;
        p[1][0] = -this.halfWidth - 6;
        p[1][1] = 0;
        p[2][0] = -this.halfWidth;
        p[2][1] = this.halfHeight;
        p[3][0] = this.halfWidth;
        p[3][1] = this.halfHeight;
        p[4][0] = this.halfWidth;
        p[4][1] = -this.halfHeight;
      }
      i = 0;
      while (i < 5) {
        rotateAndTranslate(p[i], this.angle, this.cx, this.cy);
        i++;
      }
      this.points = p;
      if ((this.x0 < this.x1) || ((this.x0 === this.x1) && (this.y0 < this.y1))) {
        this.rect.v1.x = p[0][0];
        this.rect.v1.y = p[0][1];
        this.rect.v2.x = p[1][0];
        this.rect.v2.y = p[1][1];
        this.rect.v3.x = p[2][0];
        this.rect.v3.y = p[2][1];
        this.rect.v4.x = p[4][0];
        return this.rect.v4.y = p[4][1];
      } else {
        this.rect.v1.x = p[0][0];
        this.rect.v1.y = p[0][1];
        this.rect.v2.x = p[2][0];
        this.rect.v2.y = p[2][1];
        this.rect.v3.x = p[3][0];
        this.rect.v3.y = p[3][1];
        this.rect.v4.x = p[4][0];
        return this.rect.v4.y = p[4][1];
      }
    };

    Link.prototype.pointInLabel = function() {
      return pointInTriangle(this.points[0], this.points[1], this.points[2], p) || pointInTriangle(this.points[2], this.points[3], this.points[4], p) || pointInTriangle(this.points[0], this.points[2], this.points[4], p);
    };

    Link.prototype.intersectsLink = function(link2) {
      return lineSegsOverlap(this.x0, this.y0, this.x1, this.y1, link2.x0, link2.y0, link2.x1, link2.y1);
    };

    Link.prototype.intersectsSNode = function(snode) {
      return lineRectOverlap(this.x0, this.y0, this.x1, this.y1, snode.rect);
    };

    Link.prototype.place = function() {
      var labelWidth, linkDiv, nodesDiv, _height;
      linkDiv = document.createElement('div');
      linkDiv.setAttribute('class', 'link');
      linkDiv.setAttribute('id', 'link' + this.id);
      nodesDiv = document.getElementById("nodesDiv");
      nodesDiv.appendChild(linkDiv);
      $('#link' + this.id).append('<div class="linkLine" id="linkLine' + this.id + '"></div>');
      $('#link' + this.id).append('<div class="linkLabel" id="linkLabel' + this.id + '">' + this.label + '</div>');
      _height = $('#link' + this.id).outerHeight();
      this.halfHeight = _height / 2;
      labelWidth = $('#linkLabel' + this.id).outerWidth();
      this.halfLabelWidth = labelWidth / 2;
      return $('#linkLine' + this.id).css('top', '' + this.halfHeight + 'px');
    };

    Link.prototype.visualUpdate = function() {
      var cx, cy, cz, deltaX, deltaY, deltaZ, len, roty, rotz, transformStr, tx, ty, tz;
      deltaX = this.x1 - this.x0;
      deltaY = this.y1 - this.y0;
      deltaZ = this.z1 - this.z0;
      cx = this.x0 + (deltaX / 2);
      cy = this.y0 + (deltaY / 2);
      cz = this.z0 + (deltaZ / 2);
      len = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY) + (deltaZ * deltaZ));
      rotz = Math.atan2(deltaY, deltaX);
      roty = 0;
      if (deltaX >= 0) {
        roty = -Math.atan2(deltaZ * Math.cos(rotz), deltaX);
      } else {
        roty = Math.atan2(deltaZ * Math.cos(rotz), -deltaX);
      }
      $('#link' + this.id).css('width', '' + len + 'px');
      $('#linkLine' + this.id).css('height', '1px');
      $('#linkLabel' + this.id).css('left', '' + ((len / 2) - this.halfLabelWidth) + 'px');
      tx = cx - (len / 2);
      ty = cy - this.halfHeight;
      tz = cz;
      transformStr = 'translate3d(' + tx + 'px,' + ty + 'px,' + tz + 'px)' + ' rotateZ(' + rotz + 'rad)' + ' rotateY(' + roty + 'rad)';
      return $('#link' + this.id).css('-webkit-transform', transformStr);
    };

    return Link;

  })(VisualObj);

  GraphPos = (function() {

    function GraphPos(snode, width, height) {
      var deltaX, deltaY;
      this.snode = snode;
      this.width = width;
      this.height = height;
      this.angDivs = 12;
      this.radDivs = 10;
      this.ang2 = Math.PI * 0.5;
      this.halfWidth = this.width / 2;
      this.halfHeight = this.height / 2;
      this.done = false;
      this.angStep = 0;
      this.radStep = 1;
      this.x = this.halfWidth;
      this.y = this.halfHeight;
      if (this.snode.depth > 1) {
        deltaX = this.snode.parent.x - this.halfWidth;
        deltaY = this.snode.parent.y - this.halfHeight;
        this.baseAngle = Math.atan2(deltaY, deltaX);
        this.minRadius = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
        this.maxRadius = Math.sqrt((this.halfWidth * this.halfWidth) + (this.halfHeight * this.halfHeight));
      }
      this.next();
    }

    GraphPos.prototype.next = function() {
      if (this.snode.depth === 1) {
        return this.next1();
      } else {
        return this.next2();
      }
    };

    GraphPos.prototype.next1 = function() {
      var a, angle, b;
      if (this.angStep >= this.angDivs) {
        this.radStep++;
        this.angStep = 0;
      }
      if (this.radStep > this.radDivs) {
        this.done = true;
        return;
      }
      angle = Math.PI * 2 * (this.angStep / this.angDivs);
      a = this.halfWidth * (this.radStep / this.radDivs);
      b = this.halfHeight * (this.radStep / this.radDivs);
      this.x = this.halfWidth + (a * Math.cos(angle));
      this.y = this.halfHeight + (b * Math.sin(angle));
      return this.angStep++;
    };

    GraphPos.prototype.next2 = function() {
      var angle, r;
      if (this.angStep >= this.angDivs) {
        this.radStep++;
        this.angStep = 0;
      }
      if (this.radStep >= this.radDivs) {
        this.done = true;
        return;
      }
      angle = (this.ang2 * (this.angStep / this.angDivs)) - (this.ang2 / 2);
      angle += this.baseAngle;
      r = this.radStep / this.radDivs;
      r *= this.maxRadius - this.minRadius;
      r += this.minRadius;
      this.x = this.halfWidth + (r * Math.cos(angle));
      this.y = this.halfHeight + (r * Math.sin(angle));
      return this.angStep++;
    };

    return GraphPos;

  })();

  Graph = (function() {

    function Graph() {
      this.snodes = {};
      this.nodes = {};
      this.links = [];
      this.newNode = false;
      this.newNodeActive = false;
      this.quat = new Quaternion();
      this.deltaQuat = new Quaternion();
      this.affinMat = new Array(16);
      this.quat.getMatrix(this.affinMat);
    }

    Graph.prototype.rotateX = function(angle) {
      this.deltaQuat.fromEuler(angle, 0, 0);
      this.quat.mul(this.deltaQuat);
      this.quat.normalise();
      return this.quat.getMatrix(this.affinMat);
    };

    Graph.prototype.rotateY = function(angle) {
      this.deltaQuat.fromEuler(0, 0, angle);
      this.quat.mul(this.deltaQuat);
      this.quat.normalise();
      return this.quat.getMatrix(this.affinMat);
    };

    Graph.prototype.placeNodes = function() {
      var key, _results;
      _results = [];
      for (key in this.snodes) {
        if (this.snodes.hasOwnProperty(key)) {
          _results.push(this.snodes[key].place());
        }
      }
      return _results;
    };

    Graph.prototype.placeLinks = function() {
      var link, _i, _len, _ref, _results;
      _ref = this.links;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        link = _ref[_i];
        _results.push(link.place());
      }
      return _results;
    };

    Graph.prototype.updateViewLinks = function() {
      var link, _i, _len, _ref, _results;
      _ref = this.links;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        link = _ref[_i];
        _results.push(link.visualUpdate());
      }
      return _results;
    };

    Graph.prototype.updateView = function() {
      var key, sn;
      for (key in this.snodes) {
        if (!(this.snodes.hasOwnProperty(key))) continue;
        sn = this.snodes[key];
        sn.moveTo(sn.x, sn.y);
      }
      return this.updateViewLinks();
    };

    Graph.prototype.labelAtPoint = function(x, y) {
      var i, p;
      p = [x, y];
      i = this.links.length - 1;
      while (i >= 0) {
        if (this.links[i].pointInLabel(p)) return this.links[i];
        i--;
      }
      return -1;
    };

    Graph.prototype.genSNodeKeys = function() {
      var key, _i, _len, _ref, _results;
      _ref = this.snodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        _results.push(key);
      }
      return _results;
    };

    Graph.prototype.layoutSNode = function(snode, fixedSNodes, width, height) {
      var bestPenalty, bestX, bestY, gp, iters, link, penalty, slink, snode2, x, y, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _m, _n, _ref, _ref2, _ref3, _ref4, _ref5;
      iters = 100;
      snode.fixed = true;
      bestPenalty = 99999999;
      bestX = bestY = 0;
      gp = new GraphPos(snode, width, height);
      while (!gp.done) {
        penalty = 0;
        x = gp.x;
        y = gp.y;
        snode.updatePos(x, y);
        for (_i = 0, _len = fixedSNodes.length; _i < _len; _i++) {
          snode2 = fixedSNodes[_i];
          if (snode.overlaps(snode2)) penalty += 1000000;
          _ref = snode.links;
          for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
            link = _ref[_j];
            if (link.overlaps(snode2)) penalty += 10000;
          }
        }
        _ref2 = this.links;
        for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
          link = _ref2[_k];
          if (link.sorig.fixed && link.starg.fixed && snode.overlaps(link)) {
            penalty += 10000;
          }
        }
        _ref3 = this.links;
        for (_l = 0, _len4 = _ref3.length; _l < _len4; _l++) {
          link = _ref3[_l];
          if (link.sorig.fixed && link.starg.fixed) {
            _ref4 = snode.links;
            for (_m = 0, _len5 = _ref4.length; _m < _len5; _m++) {
              slink = _ref4[_m];
              if (slink.sorig.fixed && slink.starg.fixed && link.intersectsLink(slink)) {
                penalty += 10000;
              }
            }
          }
        }
        _ref5 = snode.links;
        for (_n = 0, _len6 = _ref5.length; _n < _len6; _n++) {
          link = _ref5[_n];
          if (link.sorig.fixed && link.starg.fixed) penalty += link.len;
        }
        if (penalty < bestPenalty) {
          bestPenalty = penalty;
          bestX = x;
          bestY = y;
        }
        gp.next();
      }
      return snode.moveTo(bestX, bestY);
    };

    Graph.prototype.nextByWeight = function(depth) {
      var bestSNode, bestWeight, key, snode;
      bestWeight = -1;
      bestSNode = false;
      for (key in this.snodes) {
        if (!(this.snodes.hasOwnProperty(key))) continue;
        snode = this.snodes[key];
        if ((!snode.fixed) && (snode.depth === depth)) {
          if (snode.weight > bestWeight) {
            bestWeight = snode.weight;
            bestSNode = snode;
          }
        }
      }
      return bestSNode;
    };

    Graph.prototype.layout = function(width, height) {
      var fixedSNodes, key, snode, snodeCount, x, y, _results;
      this.halfWidth = width / 2;
      this.halfHeight = height / 2;
      for (key in this.snodes) {
        if (this.snodes.hasOwnProperty(key)) this.snodes[key].fixed = false;
      }
      fixedSNodes = [g.root];
      g.root.moveTo(width / 2, height / 2);
      g.root.fixed = true;
      snodeCount = this.snodes.size();
      if (snodeCount > 1) {
        snode = this.nextByWeight(1);
        x = width / 2;
        x -= g.root.width / 2;
        x -= snode.width / 2;
        x -= 100;
        y = height / 2;
        snode.moveTo(x, y);
        snode.fixed = true;
        fixedSNodes.push(snode);
      }
      if (snodeCount > 2) {
        snode = this.nextByWeight(1);
        if (snode) {
          x = width / 2;
          x += g.root.width / 2;
          x += snode.width / 2;
          x += 100;
          y = height / 2;
          snode.moveTo(x, y);
          snode.fixed = true;
          fixedSNodes.push(snode);
        }
      }
      if (snodeCount > 3) {
        snode = this.nextByWeight(1);
        if (snode) {
          x = width / 2;
          y = height / 2;
          y -= g.root.height / 2;
          y -= snode.height / 2;
          y -= 100;
          snode.moveTo(x, y);
          snode.fixed = true;
          fixedSNodes.push(snode);
        }
      }
      if (snodeCount > 4) {
        snode = this.nextByWeight(1);
        if (snode) {
          x = width / 2;
          y = height / 2;
          y += g.root.height / 2;
          y += snode.height / 2;
          y += 100;
          snode.moveTo(x, y);
          snode.fixed = true;
          fixedSNodes.push(snode);
        }
      }
      for (key in this.snodes) {
        if (!(this.snodes.hasOwnProperty(key))) continue;
        snode = this.snodes[key];
        if ((snode.depth === 1) && (!snode.fixed)) {
          this.layoutSNode(snode, fixedSNodes, width, height);
          fixedSNodes.push(snode);
        }
      }
      _results = [];
      for (key in this.snodes) {
        if (!(this.snodes.hasOwnProperty(key))) continue;
        snode = this.snodes[key];
        if (snode.depth === 2) {
          this.layoutSNode(snode, fixedSNodes, width, height);
          _results.push(fixedSNodes.push(snode));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return Graph;

  })();

  g = false;

  newLink = false;

  draggedNode = false;

  dragging = false;

  curTargNode = false;

  tipVisible = false;

  lastX = 0;

  lastY = 0;

  initInterface = function() {
    var _this = this;
    if (error !== '') {
      $("#tip").html('<div class="error">' + error + '</div>');
      $("#tip").fadeIn("slow", function() {
        return tipVisible = true;
      });
    }
    $("#nodesDiv").bind("mouseup", function(e) {
      dragging = false;
      return draggedNode = false;
    });
    $("#nodesDiv").bind("mousedown", function(e) {
      dragging = true;
      lastX = e.pageX;
      lastY = e.pageY;
      return false;
    });
    return $("#nodesDiv").bind("mousemove", function(e) {
      var deltaX, deltaY;
      if (dragging) {
        deltaX = e.pageX - lastX;
        deltaY = e.pageY - lastY;
        lastX = e.pageX;
        lastY = e.pageY;
        g.rotateX(-deltaX * 0.0015);
        g.rotateY(deltaY * 0.0015);
        g.updateView();
      }
      if (draggedNode) {
        draggedNode.moveTo(e.pageX, e.pageY);
        return dragging = true;
      }
    });
  };

  initGraph = function() {
    var halfHeight, halfWidth, key, l, link, linkID, nid, nlist, nod, node, orig, parentID, sid, sn, snode, sorig, starg, subNode, targ, text, type, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _m, _ref;
    g = new Graph();
    for (_i = 0, _len = snodes.length; _i < _len; _i++) {
      sn = snodes[_i];
      sid = sn['id'];
      nlist = sn['nodes'];
      snode = new SNode(sid);
      for (_j = 0, _len2 = nlist.length; _j < _len2; _j++) {
        nid = nlist[_j];
        nod = nodes[nid];
        text = nod['text'];
        type = nod['type'];
        parentID = nod['parent'];
        node = new Node(nid, text, type, snode);
        snode.nodes[nid] = node;
        g.nodes[nid] = node;
        if ((snode.parent === 'unknown') || (parentID === '')) {
          snode.parent = parentID;
        }
      }
      g.snodes[sid] = snode;
    }
    for (_k = 0, _len3 = snodes.length; _k < _len3; _k++) {
      sn = snodes[_k];
      sid = sn['id'];
      snode = g.snodes[sid];
      parentID = snode.parent;
      if (parentID === '') {
        g.root = snode;
        snode.parent = false;
      } else {
        snode.parent = g.nodes[parentID].snode;
        g.nodes[parentID].snode.subNodes[g.nodes[parentID].snode.subNodes.length] = snode;
      }
    }
    for (key in g.snodes) {
      if (!(g.snodes.hasOwnProperty(key))) continue;
      snode = g.snodes[key];
      snode.weight = snode.nodes.size();
      if (!snode.parent) {
        snode.depth = 0;
      } else if (snode.parent === g.root) {
        snode.depth = 1;
        _ref = snode.subNodes;
        for (_l = 0, _len4 = _ref.length; _l < _len4; _l++) {
          subNode = _ref[_l];
          snode.weight += subNode.nodes.size();
        }
      } else {
        snode.depth = 2;
      }
    }
    g.genSNodeKeys();
    linkID = 0;
    for (_m = 0, _len5 = links.length; _m < _len5; _m++) {
      l = links[_m];
      orig = '';
      targ = '';
      sorig = '';
      starg = '';
      if ('orig' in l) {
        console.log('orig:' + l['orig']);
        orig = g.nodes[l['orig']];
        sorig = orig.snode;
      } else {
        orig = false;
        sorig = g.snodes[l['sorig']];
      }
      if ('targ' in l) {
        targ = g.nodes[l['targ']];
        starg = targ.snode;
      } else {
        targ = false;
        starg = g.snodes[l['starg']];
      }
      link = new Link(linkID++, orig, sorig, targ, starg, l['relation']);
      g.links.push(link);
      sorig.links.push(link);
      starg.links.push(link);
    }
    halfWidth = window.innerWidth / 2;
    halfHeight = window.innerHeight / 2;
    g.placeNodes();
    g.placeLinks();
    g.layout(window.innerWidth, window.innerHeight);
    return g.updateView();
  };

  $(function() {
    initInterface();
    return initGraph();
  });

}).call(this);