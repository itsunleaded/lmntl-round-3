(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.window = global.window || {}));
}(this, function (exports) { 'use strict';

	var _svgPathExp = /[achlmqstvz]|(-?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig,
	    _scientific = /[\+\-]?\d*\.?\d+e[\+\-]?\d+/ig,
	    _DEG2RAD = Math.PI / 180,
	    _RAD2DEG = 180 / Math.PI,
	    _sin = Math.sin,
	    _cos = Math.cos,
	    _abs = Math.abs,
	    _sqrt = Math.sqrt,
	    _atan2 = Math.atan2,
	    _largeNum = 1e8,
	    _isNumber = function _isNumber(value) {
	  return typeof value === "number";
	},
	    _roundingNum = 1e5,
	    _round = function _round(value) {
	  return ~~(value * _roundingNum + (value < 0 ? -.5 : .5)) / _roundingNum;
	},
	    _copyMetaData = function _copyMetaData(source, copy) {
	  copy.totalLength = source.totalLength;

	  if (source.samples) {
	    copy.samples = source.samples.slice(0);
	    copy.lookup = source.lookup.slice(0);
	    copy.minLength = source.minLength;
	    copy.resolution = source.resolution;
	  } else {
	    copy.totalPoints = source.totalPoints;
	  }

	  return copy;
	},
	    _bestDistance;
	function copyRawPath(rawPath) {
	  var a = [],
	      i = 0;

	  for (; i < rawPath.length; i++) {
	    a[i] = _copyMetaData(rawPath[i], rawPath[i].slice(0));
	  }

	  return _copyMetaData(rawPath, a);
	}
	function subdivideSegment(segment, i, t) {
	  if (t <= 0 || t >= 1) {
	    return 0;
	  }

	  var ax = segment[i],
	      ay = segment[i + 1],
	      cp1x = segment[i + 2],
	      cp1y = segment[i + 3],
	      cp2x = segment[i + 4],
	      cp2y = segment[i + 5],
	      bx = segment[i + 6],
	      by = segment[i + 7],
	      x1a = ax + (cp1x - ax) * t,
	      x2 = cp1x + (cp2x - cp1x) * t,
	      y1a = ay + (cp1y - ay) * t,
	      y2 = cp1y + (cp2y - cp1y) * t,
	      x1 = x1a + (x2 - x1a) * t,
	      y1 = y1a + (y2 - y1a) * t,
	      x2a = cp2x + (bx - cp2x) * t,
	      y2a = cp2y + (by - cp2y) * t;
	  x2 += (x2a - x2) * t;
	  y2 += (y2a - y2) * t;
	  segment.splice(i + 2, 4, _round(x1a), _round(y1a), _round(x1), _round(y1), _round(x1 + (x2 - x1) * t), _round(y1 + (y2 - y1) * t), _round(x2), _round(y2), _round(x2a), _round(y2a));

	  if (segment.samples) {
	    segment.samples.splice(i / 6 * segment.resolution | 0, 0, 0, 0, 0, 0, 0, 0);
	  }

	  return 6;
	}
	function transformRawPath(rawPath, a, b, c, d, tx, ty) {
	  var j = rawPath.length,
	      segment,
	      l,
	      i,
	      x,
	      y;

	  while (--j > -1) {
	    segment = rawPath[j];
	    l = segment.length;

	    for (i = 0; i < l; i += 2) {
	      x = segment[i];
	      y = segment[i + 1];
	      segment[i] = x * a + y * c + tx;
	      segment[i + 1] = x * b + y * d + ty;
	    }
	  }

	  rawPath._dirty = 1;
	  return rawPath;
	}

	function arcToSegment(lastX, lastY, rx, ry, angle, largeArcFlag, sweepFlag, x, y) {
	  if (lastX === x && lastY === y) {
	    return;
	  }

	  rx = _abs(rx);
	  ry = _abs(ry);

	  var angleRad = angle % 360 * _DEG2RAD,
	      cosAngle = _cos(angleRad),
	      sinAngle = _sin(angleRad),
	      PI = Math.PI,
	      TWOPI = PI * 2,
	      dx2 = (lastX - x) / 2,
	      dy2 = (lastY - y) / 2,
	      x1 = cosAngle * dx2 + sinAngle * dy2,
	      y1 = -sinAngle * dx2 + cosAngle * dy2,
	      x1_sq = x1 * x1,
	      y1_sq = y1 * y1,
	      radiiCheck = x1_sq / (rx * rx) + y1_sq / (ry * ry);

	  if (radiiCheck > 1) {
	    rx = _sqrt(radiiCheck) * rx;
	    ry = _sqrt(radiiCheck) * ry;
	  }

	  var rx_sq = rx * rx,
	      ry_sq = ry * ry,
	      sq = (rx_sq * ry_sq - rx_sq * y1_sq - ry_sq * x1_sq) / (rx_sq * y1_sq + ry_sq * x1_sq);

	  if (sq < 0) {
	    sq = 0;
	  }

	  var coef = (largeArcFlag === sweepFlag ? -1 : 1) * _sqrt(sq),
	      cx1 = coef * (rx * y1 / ry),
	      cy1 = coef * -(ry * x1 / rx),
	      sx2 = (lastX + x) / 2,
	      sy2 = (lastY + y) / 2,
	      cx = sx2 + (cosAngle * cx1 - sinAngle * cy1),
	      cy = sy2 + (sinAngle * cx1 + cosAngle * cy1),
	      ux = (x1 - cx1) / rx,
	      uy = (y1 - cy1) / ry,
	      vx = (-x1 - cx1) / rx,
	      vy = (-y1 - cy1) / ry,
	      temp = ux * ux + uy * uy,
	      angleStart = (uy < 0 ? -1 : 1) * Math.acos(ux / _sqrt(temp)),
	      angleExtent = (ux * vy - uy * vx < 0 ? -1 : 1) * Math.acos((ux * vx + uy * vy) / _sqrt(temp * (vx * vx + vy * vy)));

	  if (isNaN(angleExtent)) {
	    angleExtent = PI;
	  }

	  if (!sweepFlag && angleExtent > 0) {
	    angleExtent -= TWOPI;
	  } else if (sweepFlag && angleExtent < 0) {
	    angleExtent += TWOPI;
	  }

	  angleStart %= TWOPI;
	  angleExtent %= TWOPI;

	  var segments = Math.ceil(_abs(angleExtent) / (TWOPI / 4)),
	      rawPath = [],
	      angleIncrement = angleExtent / segments,
	      controlLength = 4 / 3 * _sin(angleIncrement / 2) / (1 + _cos(angleIncrement / 2)),
	      ma = cosAngle * rx,
	      mb = sinAngle * rx,
	      mc = sinAngle * -ry,
	      md = cosAngle * ry,
	      i;

	  for (i = 0; i < segments; i++) {
	    angle = angleStart + i * angleIncrement;
	    x1 = _cos(angle);
	    y1 = _sin(angle);
	    ux = _cos(angle += angleIncrement);
	    uy = _sin(angle);
	    rawPath.push(x1 - controlLength * y1, y1 + controlLength * x1, ux + controlLength * uy, uy - controlLength * ux, ux, uy);
	  }

	  for (i = 0; i < rawPath.length; i += 2) {
	    x1 = rawPath[i];
	    y1 = rawPath[i + 1];
	    rawPath[i] = x1 * ma + y1 * mc + cx;
	    rawPath[i + 1] = x1 * mb + y1 * md + cy;
	  }

	  rawPath[i - 2] = x;
	  rawPath[i - 1] = y;
	  return rawPath;
	}

	function stringToRawPath(d) {
	  var a = (d + "").replace(_scientific, function (m) {
	    var n = +m;
	    return n < 0.0001 && n > -0.0001 ? 0 : n;
	  }).match(_svgPathExp) || [],
	      path = [],
	      relativeX = 0,
	      relativeY = 0,
	      twoThirds = 2 / 3,
	      elements = a.length,
	      points = 0,
	      errorMessage = "ERROR: malformed path: " + d,
	      i,
	      j,
	      x,
	      y,
	      command,
	      isRelative,
	      segment,
	      startX,
	      startY,
	      difX,
	      difY,
	      beziers,
	      prevCommand,
	      line = function line(sx, sy, ex, ey) {
	    difX = (ex - sx) / 3;
	    difY = (ey - sy) / 3;
	    segment.push(sx + difX, sy + difY, ex - difX, ey - difY, ex, ey);
	  };

	  if (!d || !isNaN(a[0]) || isNaN(a[1])) {
	    console.log(errorMessage);
	    return path;
	  }

	  for (i = 0; i < elements; i++) {
	    prevCommand = command;

	    if (isNaN(a[i])) {
	      command = a[i].toUpperCase();
	      isRelative = command !== a[i];
	    } else {
	      i--;
	    }

	    x = +a[i + 1];
	    y = +a[i + 2];

	    if (isRelative) {
	      x += relativeX;
	      y += relativeY;
	    }

	    if (!i) {
	      startX = x;
	      startY = y;
	    }

	    if (command === "M") {
	      if (segment) {
	        if (segment.length < 8) {
	          path.length -= 1;
	        } else {
	          points += segment.length;
	        }
	      }

	      relativeX = startX = x;
	      relativeY = startY = y;
	      segment = [x, y];
	      path.push(segment);
	      i += 2;
	      command = "L";
	    } else if (command === "C") {
	      if (!segment) {
	        segment = [0, 0];
	      }

	      if (!isRelative) {
	        relativeX = relativeY = 0;
	      }

	      segment.push(x, y, relativeX + a[i + 3] * 1, relativeY + a[i + 4] * 1, relativeX += a[i + 5] * 1, relativeY += a[i + 6] * 1);
	      i += 6;
	    } else if (command === "S") {
	      difX = relativeX;
	      difY = relativeY;

	      if (prevCommand === "C" || prevCommand === "S") {
	        difX += relativeX - segment[segment.length - 4];
	        difY += relativeY - segment[segment.length - 3];
	      }

	      if (!isRelative) {
	        relativeX = relativeY = 0;
	      }

	      segment.push(difX, difY, x, y, relativeX += a[i + 3] * 1, relativeY += a[i + 4] * 1);
	      i += 4;
	    } else if (command === "Q") {
	      difX = relativeX + (x - relativeX) * twoThirds;
	      difY = relativeY + (y - relativeY) * twoThirds;

	      if (!isRelative) {
	        relativeX = relativeY = 0;
	      }

	      relativeX += a[i + 3] * 1;
	      relativeY += a[i + 4] * 1;
	      segment.push(difX, difY, relativeX + (x - relativeX) * twoThirds, relativeY + (y - relativeY) * twoThirds, relativeX, relativeY);
	      i += 4;
	    } else if (command === "T") {
	      difX = relativeX - segment[segment.length - 4];
	      difY = relativeY - segment[segment.length - 3];
	      segment.push(relativeX + difX, relativeY + difY, x + (relativeX + difX * 1.5 - x) * twoThirds, y + (relativeY + difY * 1.5 - y) * twoThirds, relativeX = x, relativeY = y);
	      i += 2;
	    } else if (command === "H") {
	      line(relativeX, relativeY, relativeX = x, relativeY);
	      i += 1;
	    } else if (command === "V") {
	      line(relativeX, relativeY, relativeX, relativeY = x + (isRelative ? relativeY - relativeX : 0));
	      i += 1;
	    } else if (command === "L" || command === "Z") {
	      if (command === "Z") {
	        x = startX;
	        y = startY;
	        segment.closed = true;
	      }

	      if (command === "L" || _abs(relativeX - x) > 0.5 || _abs(relativeY - y) > 0.5) {
	        line(relativeX, relativeY, x, y);

	        if (command === "L") {
	          i += 2;
	        }
	      }

	      relativeX = x;
	      relativeY = y;
	    } else if (command === "A") {
	      beziers = arcToSegment(relativeX, relativeY, +a[i + 1], +a[i + 2], +a[i + 3], +a[i + 4], +a[i + 5], (isRelative ? relativeX : 0) + a[i + 6] * 1, (isRelative ? relativeY : 0) + a[i + 7] * 1);

	      if (beziers) {
	        for (j = 0; j < beziers.length; j++) {
	          segment.push(beziers[j]);
	        }
	      }

	      relativeX = segment[segment.length - 2];
	      relativeY = segment[segment.length - 1];
	      i += 7;
	    } else {
	      console.log(errorMessage);
	    }
	  }

	  i = segment.length;

	  if (i < 6) {
	    path.pop();
	    i = 0;
	  } else if (segment[0] === segment[i - 2] && segment[1] === segment[i - 1]) {
	    segment.closed = true;
	  }

	  path.totalPoints = points + i;
	  return path;
	}
	function bezierToPoints(x1, y1, x2, y2, x3, y3, x4, y4, threshold, points, index) {
	  var x12 = (x1 + x2) / 2,
	      y12 = (y1 + y2) / 2,
	      x23 = (x2 + x3) / 2,
	      y23 = (y2 + y3) / 2,
	      x34 = (x3 + x4) / 2,
	      y34 = (y3 + y4) / 2,
	      x123 = (x12 + x23) / 2,
	      y123 = (y12 + y23) / 2,
	      x234 = (x23 + x34) / 2,
	      y234 = (y23 + y34) / 2,
	      x1234 = (x123 + x234) / 2,
	      y1234 = (y123 + y234) / 2,
	      dx = x4 - x1,
	      dy = y4 - y1,
	      d2 = _abs((x2 - x4) * dy - (y2 - y4) * dx),
	      d3 = _abs((x3 - x4) * dy - (y3 - y4) * dx),
	      length;

	  if (!points) {
	    points = [x1, y1, x4, y4];
	    index = 2;
	  }

	  points.splice(index || points.length - 2, 0, x1234, y1234);

	  if ((d2 + d3) * (d2 + d3) > threshold * (dx * dx + dy * dy)) {
	    length = points.length;
	    bezierToPoints(x1, y1, x12, y12, x123, y123, x1234, y1234, threshold, points, index);
	    bezierToPoints(x1234, y1234, x234, y234, x34, y34, x4, y4, threshold, points, index + 2 + (points.length - length));
	  }

	  return points;
	}
	function pointsToSegment(points, curviness, cornerThreshold) {
	  var l = points.length - 2,
	      x = +points[0],
	      y = +points[1],
	      nextX = +points[2],
	      nextY = +points[3],
	      segment = [x, y, x, y],
	      dx2 = nextX - x,
	      dy2 = nextY - y,
	      prevX,
	      prevY,
	      angle,
	      slope,
	      i,
	      dx1,
	      dx3,
	      dy1,
	      dy3,
	      d1,
	      d2,
	      a,
	      b,
	      c;

	  if (isNaN(cornerThreshold)) {
	    cornerThreshold = Math.PI / 10;
	  }

	  curviness = curviness || curviness === 0 ? +curviness : 1;

	  for (i = 2; i < l; i += 2) {
	    prevX = x;
	    prevY = y;
	    x = nextX;
	    y = nextY;
	    nextX = +points[i + 2];
	    nextY = +points[i + 3];
	    dx1 = dx2;
	    dy1 = dy2;
	    dx2 = nextX - x;
	    dy2 = nextY - y;
	    dx3 = nextX - prevX;
	    dy3 = nextY - prevY;
	    a = dx1 * dx1 + dy1 * dy1;
	    b = dx2 * dx2 + dy2 * dy2;
	    c = dx3 * dx3 + dy3 * dy3;
	    angle = Math.acos((a + b - c) / _sqrt(4 * a * b));
	    d2 = angle / Math.PI * curviness;
	    d1 = _sqrt(a) * d2;
	    d2 *= _sqrt(b);

	    if (x !== prevX || y !== prevY) {
	      if (angle > cornerThreshold) {
	        slope = _atan2(dy3, dx3);
	        segment.push(_round(x - _cos(slope) * d1), _round(y - _sin(slope) * d1), _round(x), _round(y), _round(x + _cos(slope) * d2), _round(y + _sin(slope) * d2));
	      } else {
	        slope = _atan2(dy1, dx1);
	        segment.push(_round(x - _cos(slope) * d1), _round(y - _sin(slope) * d1));
	        slope = _atan2(dy2, dx2);
	        segment.push(_round(x), _round(y), _round(x + _cos(slope) * d2), _round(y + _sin(slope) * d2));
	      }
	    }
	  }

	  segment.push(_round(nextX), _round(nextY), _round(nextX), _round(nextY));
	  return segment;
	}

	function pointToSegDist(x, y, x1, y1, x2, y2) {
	  var dx = x2 - x1,
	      dy = y2 - y1,
	      t;

	  if (dx || dy) {
	    t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);

	    if (t > 1) {
	      x1 = x2;
	      y1 = y2;
	    } else if (t > 0) {
	      x1 += dx * t;
	      y1 += dy * t;
	    }
	  }

	  return Math.pow(x - x1, 2) + Math.pow(y - y1, 2);
	}

	function simplifyStep(points, first, last, tolerance, simplified) {
	  var maxSqDist = tolerance,
	      firstX = points[first],
	      firstY = points[first + 1],
	      lastX = points[last],
	      lastY = points[last + 1],
	      index,
	      i,
	      d;

	  for (i = first + 2; i < last; i += 2) {
	    d = pointToSegDist(points[i], points[i + 1], firstX, firstY, lastX, lastY);

	    if (d > maxSqDist) {
	      index = i;
	      maxSqDist = d;
	    }
	  }

	  if (maxSqDist > tolerance) {
	    if (index - first > 2) {
	      simplifyStep(points, first, index, tolerance, simplified);
	    }

	    simplified.push(points[index], points[index + 1]);

	    if (last - index > 2) {
	      simplifyStep(points, index, last, tolerance, simplified);
	    }
	  }
	}

	function simplifyPoints(points, tolerance) {
	  var prevX = parseFloat(points[0]),
	      prevY = parseFloat(points[1]),
	      temp = [prevX, prevY],
	      l = points.length - 2,
	      i,
	      x,
	      y,
	      dx,
	      dy,
	      result,
	      last;
	  tolerance = Math.pow(tolerance || 1, 2);

	  for (i = 2; i < l; i += 2) {
	    x = parseFloat(points[i]);
	    y = parseFloat(points[i + 1]);
	    dx = prevX - x;
	    dy = prevY - y;

	    if (dx * dx + dy * dy > tolerance) {
	      temp.push(x, y);
	      prevX = x;
	      prevY = y;
	    }
	  }

	  temp.push(parseFloat(points[l]), parseFloat(points[l + 1]));
	  last = temp.length - 2;
	  result = [temp[0], temp[1]];
	  simplifyStep(temp, 0, last, tolerance, result);
	  result.push(temp[last], temp[last + 1]);
	  return result;
	}

	function getClosestProgressOnBezier(iterations, px, py, start, end, slices, x0, y0, x1, y1, x2, y2, x3, y3) {
	  var inc = (end - start) / slices,
	      best = 0,
	      t = start,
	      x,
	      y,
	      d,
	      dx,
	      dy,
	      inv;
	  _bestDistance = _largeNum;

	  while (t <= end) {
	    inv = 1 - t;
	    x = inv * inv * inv * x0 + 3 * inv * inv * t * x1 + 3 * inv * t * t * x2 + t * t * t * x3;
	    y = inv * inv * inv * y0 + 3 * inv * inv * t * y1 + 3 * inv * t * t * y2 + t * t * t * y3;
	    dx = x - px;
	    dy = y - py;
	    d = dx * dx + dy * dy;

	    if (d < _bestDistance) {
	      _bestDistance = d;
	      best = t;
	    }

	    t += inc;
	  }

	  return iterations > 1 ? getClosestProgressOnBezier(iterations - 1, px, py, Math.max(best - inc, 0), Math.min(best + inc, 1), slices, x0, y0, x1, y1, x2, y2, x3, y3) : best;
	}

	function getClosestData(rawPath, x, y, slices) {
	  var closest = {
	    j: 0,
	    i: 0,
	    t: 0
	  },
	      bestDistance = _largeNum,
	      i,
	      j,
	      t,
	      segment;

	  for (j = 0; j < rawPath.length; j++) {
	    segment = rawPath[j];

	    for (i = 0; i < segment.length; i += 6) {
	      t = getClosestProgressOnBezier(1, x, y, 0, 1, slices || 20, segment[i], segment[i + 1], segment[i + 2], segment[i + 3], segment[i + 4], segment[i + 5], segment[i + 6], segment[i + 7]);

	      if (bestDistance > _bestDistance) {
	        bestDistance = _bestDistance;
	        closest.j = j;
	        closest.i = i;
	        closest.t = t;
	      }
	    }
	  }

	  return closest;
	}
	function rawPathToString(rawPath) {
	  if (_isNumber(rawPath[0])) {
	    rawPath = [rawPath];
	  }

	  var result = "",
	      l = rawPath.length,
	      sl,
	      s,
	      i,
	      segment;

	  for (s = 0; s < l; s++) {
	    segment = rawPath[s];
	    result += "M" + _round(segment[0]) + "," + _round(segment[1]) + " C";
	    sl = segment.length;

	    for (i = 2; i < sl; i++) {
	      result += _round(segment[i++]) + "," + _round(segment[i++]) + " " + _round(segment[i++]) + "," + _round(segment[i++]) + " " + _round(segment[i++]) + "," + _round(segment[i]) + " ";
	    }

	    if (segment.closed) {
	      result += "z";
	    }
	  }

	  return result;
	}

	var _doc,
	    _win,
	    _transformProp = "transform",
	    _transformOriginProp = _transformProp + "Origin",
	    _setDoc = function _setDoc(element) {
	  var doc = element.ownerDocument || element;

	  if (!(_transformProp in element.style) && "msTransform" in element.style) {
	    _transformProp = "msTransform";
	    _transformOriginProp = _transformProp + "Origin";
	  }

	  while (doc.parentNode && (doc = doc.parentNode)) {}

	  _win = window;
	  return _doc = doc;
	},
	    _svgTemps = [],
	    _divTemps = [],
	    _divContainer,
	    _svgContainer,
	    _svgOwner = function _svgOwner(element) {
	  return element.ownerSVGElement || ((element.tagName + "").toLowerCase() === "svg" ? element : null);
	},
	    _createSibling = function _createSibling(element, i) {
	  if (element.parentNode && (_doc || _setDoc(element))) {
	    var svg = _svgOwner(element),
	        ns = svg ? svg.getAttribute("xmlns") || "http://www.w3.org/2000/svg" : "http://www.w3.org/1999/xhtml",
	        type = svg ? i ? "rect" : "g" : "div",
	        x = i !== 2 ? 0 : 100,
	        y = i === 3 ? 100 : 0,
	        css = "position:absolute;display:block;",
	        e = _doc.createElementNS ? _doc.createElementNS(ns.replace(/^https/, "http"), type) : _doc.createElement(type);

	    if (i) {
	      if (!svg) {
	        if (!_divContainer) {
	          _divContainer = _createSibling(element);
	          _divContainer.style.cssText = css;
	        }

	        e.style.cssText = css + "width:1px;height:1px;top:" + y + "px;left:" + x + "px";

	        _divContainer.appendChild(e);
	      } else {
	        if (!_svgContainer) {
	          _svgContainer = _createSibling(element);
	        }

	        e.setAttribute("width", 1);
	        e.setAttribute("height", 1);
	        e.setAttribute("transform", "translate(" + x + "," + y + ")");

	        _svgContainer.appendChild(e);
	      }
	    }

	    return e;
	  }

	  throw "Need document and parent.";
	},
	    _placeSiblings = function _placeSiblings(element) {
	  var svg = _svgOwner(element),
	      isRootSVG = element === svg,
	      siblings = svg ? _svgTemps : _divTemps,
	      container,
	      m,
	      b,
	      x,
	      y;

	  if (element === _win) {
	    return element;
	  }

	  if (!siblings.length) {
	    siblings.push(_createSibling(element, 1), _createSibling(element, 2), _createSibling(element, 3));
	  }

	  container = svg ? _svgContainer : _divContainer;

	  if (svg) {
	    b = isRootSVG || element.tagName.toLowerCase() === "g" ? {
	      x: 0,
	      y: 0
	    } : element.getBBox();
	    m = element.transform.baseVal;

	    if (m.length) {
	      m = m.consolidate().matrix;
	      x = m.a * b.x + m.c * b.y;
	      y = m.b * b.x + m.d * b.y;
	    } else {
	      m = new Matrix2D();
	      x = b.x;
	      y = b.y;
	    }

	    container.setAttribute("transform", "matrix(" + m.a + "," + m.b + "," + m.c + "," + m.d + "," + (m.e + x) + "," + (m.f + y) + ")");
	    (isRootSVG ? svg : element.parentNode).appendChild(container);
	  } else {
	    container.style.top = element.offsetTop + "px";
	    container.style.left = element.offsetLeft + "px";
	    m = _win.getComputedStyle(element);
	    container.style[_transformProp] = m[_transformProp];
	    container.style[_transformOriginProp] = m[_transformOriginProp];
	    element.parentNode.appendChild(container);
	  }

	  return container;
	},
	    _setMatrix = function _setMatrix(m, a, b, c, d, e, f) {
	  m.a = a;
	  m.b = b;
	  m.c = c;
	  m.d = d;
	  m.e = e;
	  m.f = f;
	  return m;
	};

	var Matrix2D = function () {
	  function Matrix2D(a, b, c, d, e, f) {
	    if (a === void 0) {
	      a = 1;
	    }

	    if (b === void 0) {
	      b = 0;
	    }

	    if (c === void 0) {
	      c = 0;
	    }

	    if (d === void 0) {
	      d = 1;
	    }

	    if (e === void 0) {
	      e = 0;
	    }

	    if (f === void 0) {
	      f = 0;
	    }

	    _setMatrix(this, a, b, c, d, e, f);
	  }

	  var _proto = Matrix2D.prototype;

	  _proto.inverse = function inverse() {
	    var a = this.a,
	        b = this.b,
	        c = this.c,
	        d = this.d,
	        e = this.e,
	        f = this.f,
	        determinant = a * d - b * c;
	    return _setMatrix(this, d / determinant, -b / determinant, -c / determinant, a / determinant, (c * f - d * e) / determinant, -(a * f - b * e) / determinant);
	  };

	  _proto.multiply = function multiply(matrix) {
	    var a = this.a,
	        b = this.b,
	        c = this.c,
	        d = this.d,
	        e = this.e,
	        f = this.f,
	        a2 = matrix.a,
	        b2 = matrix.c,
	        c2 = matrix.b,
	        d2 = matrix.d,
	        e2 = matrix.e,
	        f2 = matrix.f;
	    return _setMatrix(this, a2 * a + c2 * c, a2 * b + c2 * d, b2 * a + d2 * c, b2 * b + d2 * d, e + e2 * a + f2 * c, f + e2 * b + f2 * d);
	  };

	  _proto.equals = function equals(matrix) {
	    var a = this.a,
	        b = this.b,
	        c = this.c,
	        d = this.d,
	        e = this.e,
	        f = this.f;
	    return a === matrix.a && b === matrix.b && c === matrix.c && d === matrix.d && e === matrix.e && f === matrix.f;
	  };

	  _proto.apply = function apply(point, decoratee) {
	    if (decoratee === void 0) {
	      decoratee = {};
	    }

	    var x = point.x,
	        y = point.y,
	        a = this.a,
	        b = this.b,
	        c = this.c,
	        d = this.d,
	        e = this.e,
	        f = this.f;
	    decoratee.x = x * a + y * c + e;
	    decoratee.y = x * b + y * d + f;
	    return decoratee;
	  };

	  return Matrix2D;
	}();
	function getGlobalMatrix(element, inverse) {
	  if (!element.parentNode) {
	    return new Matrix2D();
	  }

	  var svg = _svgOwner(element),
	      temps = svg ? _svgTemps : _divTemps,
	      container = _placeSiblings(element),
	      b1 = temps[0].getBoundingClientRect(),
	      b2 = temps[1].getBoundingClientRect(),
	      b3 = temps[2].getBoundingClientRect(),
	      parent = container.parentNode,
	      m = new Matrix2D((b2.left - b1.left) / 100, (b2.top - b1.top) / 100, (b3.left - b1.left) / 100, (b3.top - b1.top) / 100, b1.left, b1.top);

	  parent.removeChild(container);
	  return inverse ? m.inverse() : m;
	}

	var _numbersExp = /(?:(-)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig,
	    _doc$1,
	    _selectionColor = "#4e7fff",
	    _minimumMovement = 1,
	    _DEG2RAD$1 = Math.PI / 180,
	    _getTime = Date.now || function () {
	  return new Date().getTime();
	},
	    _lastInteraction = 0,
	    _isPressed = 0,
	    _interacted = function _interacted() {
	  return _lastInteraction = _getTime();
	},
	    _CTRL,
	    _ALT,
	    _SHIFT,
	    _CMD,
	    _recentlyAddedAnchor,
	    _editingAxis = {},
	    _history = [],
	    _point = {},
	    _temp = [],
	    _comma = ",",
	    _selectedPaths = [],
	    _createElement = function _createElement(type) {
	  return _doc$1.createElementNS ? _doc$1.createElementNS("http://www.w3.org/1999/xhtml", type) : _doc$1.createElement(type);
	},
	    _createSVG = function _createSVG(type, container, attributes) {
	  var element = _doc$1.createElementNS("http://www.w3.org/2000/svg", type),
	      reg = /([a-z])([A-Z])/g,
	      p;

	  attributes = attributes || {};
	  attributes["class"] = attributes["class"] || "path-editor";

	  for (p in attributes) {
	    if (element.style[p] !== undefined) {
	      element.style[p] = attributes[p];
	    } else {
	      element.setAttributeNS(null, p.replace(reg, "$1-$2").toLowerCase(), attributes[p]);
	    }
	  }

	  container.appendChild(element);
	  return element;
	},
	    _identityMatrixObject = {
	  matrix: {
	    a: 1,
	    b: 0,
	    c: 0,
	    d: 1,
	    e: 0,
	    f: 0
	  }
	},
	    _getConsolidatedMatrix = function _getConsolidatedMatrix(target) {
	  return (target.transform.baseVal.consolidate() || _identityMatrixObject).matrix;
	},
	    _addHistory = function _addHistory(pathEditor) {
	  var selectedIndexes = [],
	      a = pathEditor._selectedAnchors,
	      i;

	  for (i = 0; i < a.length; i++) {
	    selectedIndexes[i] = a[i].i;
	  }

	  _history.unshift({
	    path: pathEditor,
	    d: pathEditor.path.getAttribute("d"),
	    transform: pathEditor.path.getAttribute("transform") || "",
	    selectedIndexes: selectedIndexes
	  });

	  if (_history.length > 30) {
	    _history.length = 30;
	  }
	},
	    _round$1 = function _round(value) {
	  return ~~(value * 1000 + (value < 0 ? -.5 : .5)) / 1000;
	},
	    _getSquarePathData = function _getSquarePathData(size) {
	  size = _round$1(size);
	  return ["M-" + size, -size, size, -size, size, size, -size, size + "z"].join(_comma);
	},
	    _getCirclePathData = function _getCirclePathData(size) {
	  var circ = 0.552284749831,
	      rcirc = _round$1(size * circ);

	  size = _round$1(size);
	  return "M" + size + ",0C" + [size, rcirc, rcirc, size, 0, size, -rcirc, size, -size, rcirc, -size, 0, -size, -rcirc, -rcirc, -size, 0, -size, rcirc, -size, size, -rcirc, size, 0].join(_comma) + "z";
	},
	    _checkDeselect = function _checkDeselect(e) {
	  if (!e.target._gsSelection && !_isPressed && _getTime() - _lastInteraction > 100) {
	    var i = _selectedPaths.length;

	    while (--i > -1) {
	      _selectedPaths[i].deselect();
	    }

	    _selectedPaths.length = 0;
	  }
	},
	    _tempDiv,
	    _touchEventLookup,
	    _isMultiTouching = 0,
	    _addListener = function _addListener(element, type, func, capture) {
	  if (element.addEventListener) {
	    var touchType = _touchEventLookup[type];
	    capture = capture || {
	      passive: false
	    };
	    element.addEventListener(touchType || type, func, capture);

	    if (touchType && type !== touchType && touchType.substr(0, 7) !== "pointer") {
	      element.addEventListener(type, func, capture);
	    }
	  } else if (element.attachEvent) {
	    element.attachEvent("on" + type, func);
	  }
	},
	    _removeListener = function _removeListener(element, type, func) {
	  if (element.removeEventListener) {
	    var touchType = _touchEventLookup[type];
	    element.removeEventListener(touchType || type, func);

	    if (touchType && type !== touchType && touchType.substr(0, 7) !== "pointer") {
	      element.removeEventListener(type, func);
	    }
	  } else if (element.detachEvent) {
	    element.detachEvent("on" + type, func);
	  }
	},
	    _hasTouchID = function _hasTouchID(list, ID) {
	  var i = list.length;

	  while (--i > -1) {
	    if (list[i].identifier === ID) {
	      return true;
	    }
	  }

	  return false;
	},
	    _onMultiTouchDocumentEnd = function _onMultiTouchDocumentEnd(e) {
	  _isMultiTouching = e.touches && _dragCount < e.touches.length;

	  _removeListener(e.target, "touchend", _onMultiTouchDocumentEnd);
	},
	    _onMultiTouchDocument = function _onMultiTouchDocument(e) {
	  _isMultiTouching = e.touches && _dragCount < e.touches.length;

	  _addListener(e.target, "touchend", _onMultiTouchDocumentEnd);
	},
	    _bind = function _bind(func, scope) {
	  return function (e) {
	    return func.call(scope, e);
	  };
	},
	    _callback = function _callback(type, self, param) {
	  var callback = self.vars[type];

	  if (callback) {
	    callback.call(self.vars.callbackScope || self, param || self);
	  }

	  return self;
	},
	    _coreInitted,
	    _initCore = function _initCore() {
	  _doc$1 = document;
	  _tempDiv = _createElement("div");
	  _touchEventLookup = function (types) {
	    var standard = types.split(","),
	        converted = (_tempDiv.onpointerdown !== undefined ? "pointerdown,pointermove,pointerup,pointercancel" : _tempDiv.onmspointerdown !== undefined ? "MSPointerDown,MSPointerMove,MSPointerUp,MSPointerCancel" : types).split(","),
	        obj = {},
	        i = 4;

	    while (--i > -1) {
	      obj[standard[i]] = converted[i];
	      obj[converted[i]] = standard[i];
	    }

	    return obj;
	  }("touchstart,touchmove,touchend,touchcancel"), SVGElement.prototype.getTransformToElement = SVGElement.prototype.getTransformToElement || function (e) {
	    return e.getScreenCTM().inverse().multiply(this.getScreenCTM());
	  };

	  _doc$1.addEventListener("keydown", function (e) {
	    var key = e.key || e.which,
	        i,
	        state,
	        a,
	        path;

	    if (key === "Shift" || key === 16) {
	      _SHIFT = true;
	    } else if (key === "Control" || key === 17) {
	      _CTRL = true;
	    } else if (key === "Meta" || key === 91) {
	      _CMD = true;
	    } else if (key === "Alt" || key === 18) {
	      _ALT = true;
	      i = _selectedPaths.length;

	      while (--i > -1) {
	        _selectedPaths[i]._onPressAlt();
	      }
	    } else if ((key === "z" || key === 90) && (_CTRL || _CMD) && _history.length > 1) {
	      _history.shift();

	      state = _history[0];

	      if (state) {
	        path = state.path;
	        path.path.setAttribute("d", state.d);
	        path.path.setAttribute("transform", state.transform);
	        path.init();
	        a = path._anchors;

	        for (i = 0; i < a.length; i++) {
	          if (state.selectedIndexes.indexOf(a[i].i) !== -1) {
	            path._selectedAnchors.push(a[i]);
	          }
	        }

	        path._updateAnchors();

	        path.update();

	        if (path.vars.onUndo) {
	          path.vars.onUndo.call(path);
	        }
	      }
	    } else if (key === "Delete" || key === "Backspace" || key === 8 || key === 46 || key === 63272 || key === "d" && (_CTRL || _CMD)) {
	      i = _selectedPaths.length;

	      while (--i > -1) {
	        _selectedPaths[i]._deleteSelectedAnchors();
	      }
	    } else if ((key === "a" || key === 65) && (_CMD || _CTRL)) {
	      i = _selectedPaths.length;

	      while (--i > -1) {
	        _selectedPaths[i].select(true);
	      }
	    }
	  });

	  _doc$1.addEventListener("keyup", function (e) {
	    var key = e.key || e.which;

	    if (key === "Shift" || key === 16) {
	      _SHIFT = false;
	    } else if (key === "Control" || key === 17) {
	      _CTRL = false;
	    } else if (key === "Meta" || key === 91) {
	      _CMD = false;
	    } else if (key === "Alt" || key === 18) {
	      _ALT = false;
	      var i = _selectedPaths.length;

	      while (--i > -1) {
	        _selectedPaths[i]._onReleaseAlt();
	      }
	    }
	  });

	  _addListener(_doc$1, "mouseup", _checkDeselect);

	  _addListener(_doc$1, "touchend", _checkDeselect);

	  _coreInitted = 1;
	},
	    _onPress = function _onPress(e) {
	  var self = this,
	      ctm = getGlobalMatrix(self.target.parentNode, true),
	      touchEventTarget,
	      temp;
	  this._matrix = this.target.transform.baseVal.getItem(0).matrix;
	  this._ctm = ctm;

	  if (_touchEventLookup[e.type]) {
	    touchEventTarget = e.type.indexOf("touch") !== -1 ? e.currentTarget || e.target : _doc$1;

	    _addListener(touchEventTarget, "touchend", self._onRelease);

	    _addListener(touchEventTarget, "touchmove", self._onMove);

	    _addListener(touchEventTarget, "touchcancel", self._onRelease);

	    _addListener(_doc$1, "touchstart", _onMultiTouchDocument);
	  } else {
	    touchEventTarget = null;

	    _addListener(_doc$1, "mousemove", self._onMove);
	  }

	  _addListener(_doc$1, "mouseup", self._onRelease);

	  e.preventDefault();

	  if (e.preventManipulation) {
	    e.preventManipulation();
	  }

	  if (e.changedTouches) {
	    e = self.touch = e.changedTouches[0];
	    self.touchID = e.identifier;
	  } else if (e.pointerId) {
	    self.touchID = e.pointerId;
	  } else {
	    self.touch = self.touchID = null;
	  }

	  self._startPointerY = self.pointerY = e.pageY;
	  self._startPointerX = self.pointerX = e.pageX;
	  self._startElementX = self._matrix.e;
	  self._startElementY = self._matrix.f;

	  if (this._ctm.a === 1 && this._ctm.b === 0 && this._ctm.c === 0 && this._ctm.d === 1) {
	    this._ctm = null;
	  } else {
	    temp = self._startPointerX * this._ctm.a + self._startPointerY * this._ctm.c + this._ctm.e;
	    self._startPointerY = self._startPointerX * this._ctm.b + self._startPointerY * this._ctm.d + this._ctm.f;
	    self._startPointerX = temp;
	  }

	  self.isPressed = _isPressed = true;
	  self.touchEventTarget = touchEventTarget;

	  if (self.vars.onPress) {
	    self.vars.onPress.call(self.vars.callbackScope || self, self.pointerEvent);
	  }
	},
	    _onMove = function _onMove(e) {
	  var self = this,
	      originalEvent = e,
	      touches,
	      i;

	  if (!self._enabled || _isMultiTouching || !self.isPressed || !e) {
	    return;
	  }

	  self.pointerEvent = e;
	  touches = e.changedTouches;

	  if (touches) {
	    e = touches[0];

	    if (e !== self.touch && e.identifier !== self.touchID) {
	      i = touches.length;

	      while (--i > -1 && (e = touches[i]).identifier !== self.touchID) {}

	      if (i < 0) {
	        return;
	      }
	    }
	  } else if (e.pointerId && self.touchID && e.pointerId !== self.touchID) {
	    return;
	  }

	  originalEvent.preventDefault();

	  if (originalEvent.preventManipulation) {
	    originalEvent.preventManipulation();
	  }

	  self.setPointerPosition(e.pageX, e.pageY);

	  if (self.vars.onDrag) {
	    self.vars.onDrag.call(self.vars.callbackScope || self, self.pointerEvent);
	  }
	},
	    _onRelease = function _onRelease(e, force) {
	  var self = this;

	  if (!self._enabled || !self.isPressed || e && self.touchID != null && !force && (e.pointerId && e.pointerId !== self.touchID || e.changedTouches && !_hasTouchID(e.changedTouches, self.touchID))) {
	    return;
	  }

	  _interacted();

	  self.isPressed = _isPressed = false;
	  var originalEvent = e,
	      wasDragging = self.isDragging,
	      touchEventTarget = self.touchEventTarget,
	      touches,
	      i;

	  if (touchEventTarget) {
	    _removeListener(touchEventTarget, "touchend", self._onRelease);

	    _removeListener(touchEventTarget, "touchmove", self._onMove);

	    _removeListener(touchEventTarget, "touchcancel", self._onRelease);

	    _removeListener(_doc$1, "touchstart", _onMultiTouchDocument);
	  } else {
	    _removeListener(_doc$1, "mousemove", self._onMove);
	  }

	  _removeListener(_doc$1, "mouseup", self._onRelease);

	  if (e && e.target) {
	    _removeListener(e.target, "mouseup", self._onRelease);
	  }

	  if (wasDragging) {
	    self.isDragging = false;
	  } else if (self.vars.onClick) {
	    self.vars.onClick.call(self.vars.callbackScope || self, originalEvent);
	  }

	  if (e) {
	    touches = e.changedTouches;

	    if (touches) {
	      e = touches[0];

	      if (e !== self.touch && e.identifier !== self.touchID) {
	        i = touches.length;

	        while (--i > -1 && (e = touches[i]).identifier !== self.touchID) {}

	        if (i < 0) {
	          return;
	        }
	      }
	    }

	    self.pointerEvent = originalEvent;
	    self.pointerX = e.pageX;
	    self.pointerY = e.pageY;
	  }

	  if (originalEvent && !wasDragging && self.vars.onDragRelease) {
	    self.vars.onDragRelease.call(self, self.pointerEvent);
	  } else {
	    if (originalEvent) {
	      originalEvent.preventDefault();

	      if (originalEvent.preventManipulation) {
	        originalEvent.preventManipulation();
	      }
	    }

	    if (self.vars.onRelease) {
	      self.vars.onRelease.call(self.vars.callbackScope || self, self.pointerEvent);
	    }
	  }

	  if (wasDragging && self.vars.onDragEnd) {
	    self.vars.onDragEnd.call(self.vars.callbackScope || self, self.pointerEvent);
	  }

	  return true;
	},
	    _createSegmentAnchors = function _createSegmentAnchors(rawPath, j, editor, vars) {
	  var segment = rawPath[j],
	      l = segment.length,
	      a = [],
	      i;

	  for (i = 0; i < l; i += 6) {
	    a.push(new Anchor(editor, rawPath, j, i, vars));
	  }

	  return a;
	},
	    _getLength = function _getLength(segment, i, i2) {
	  var x = segment[i2] - segment[i],
	      y = segment[i2 + 1] - segment[i + 1];
	  return Math.sqrt(x * x + y * y);
	};

	var DraggableSVG = function () {
	  function DraggableSVG(target, vars) {
	    this.target = typeof target === "string" ? _doc$1.querySelectorAll(target)[0] : target;
	    this.vars = vars || {};
	    this._onPress = _bind(_onPress, this);
	    this._onMove = _bind(_onMove, this);
	    this._onRelease = _bind(_onRelease, this);
	    this.target.setAttribute("transform", (this.target.getAttribute("transform") || "") + " translate(0,0)");
	    this._matrix = this.target.transform.baseVal.getItem(0).matrix;
	    this.x = this._matrix.e;
	    this.y = this._matrix.f;
	    this.snap = vars.snap;

	    if (!isNaN(vars.maxX) || !isNaN(vars.minX)) {
	      this._bounds = 1;
	      this.maxX = +vars.maxX;
	      this.minX = +vars.minX;
	    } else {
	      this._bounds = 0;
	    }

	    this.enabled(true);
	  }

	  var _proto = DraggableSVG.prototype;

	  _proto.setPointerPosition = function setPointerPosition(pointerX, pointerY) {
	    var rnd = 1000,
	        xChange,
	        yChange,
	        x,
	        y,
	        temp;
	    this.pointerX = pointerX;
	    this.pointerY = pointerY;

	    if (this._ctm) {
	      temp = pointerX * this._ctm.a + pointerY * this._ctm.c + this._ctm.e;
	      pointerY = pointerX * this._ctm.b + pointerY * this._ctm.d + this._ctm.f;
	      pointerX = temp;
	    }

	    yChange = pointerY - this._startPointerY;
	    xChange = pointerX - this._startPointerX;

	    if (yChange < _minimumMovement && yChange > -_minimumMovement) {
	      yChange = 0;
	    }

	    if (xChange < _minimumMovement && xChange > -_minimumMovement) {
	      xChange = 0;
	    }

	    x = ((this._startElementX + xChange) * rnd | 0) / rnd;
	    y = ((this._startElementY + yChange) * rnd | 0) / rnd;

	    if (this.snap && !_SHIFT) {
	      _point.x = x;
	      _point.y = y;
	      this.snap.call(this, _point);
	      x = _point.x;
	      y = _point.y;
	    }

	    if (this.x !== x || this.y !== y) {
	      this._matrix.f = this.y = y;
	      this._matrix.e = this.x = x;

	      if (!this.isDragging && this.isPressed) {
	        this.isDragging = true;

	        _callback("onDragStart", this, this.pointerEvent);
	      }
	    }
	  };

	  _proto.enabled = function enabled(_enabled) {
	    if (!arguments.length) {
	      return this._enabled;
	    }

	    var dragging;
	    this._enabled = _enabled;

	    if (_enabled) {
	      _addListener(this.target, "mousedown", this._onPress);

	      _addListener(this.target, "touchstart", this._onPress);

	      _addListener(this.target, "click", this._onClick, true);
	    } else {
	      dragging = this.isDragging;

	      _removeListener(this.target, "mousedown", this._onPress);

	      _removeListener(this.target, "touchstart", this._onPress);

	      _removeListener(this.target, "click", this._onClick);

	      if (this.touchEventTarget) {
	        _removeListener(this.touchEventTarget, "touchcancel", this._onRelease);

	        _removeListener(this.touchEventTarget, "touchend", this._onRelease);

	        _removeListener(this.touchEventTarget, "touchmove", this._onMove);
	      }

	      _removeListener(_doc$1, "mouseup", this._onRelease);

	      _removeListener(_doc$1, "mousemove", this._onMove);

	      this.isDragging = this.isPressed = false;

	      if (dragging) {
	        _callback("onDragEnd", this, this.pointerEvent);
	      }
	    }

	    return this;
	  };

	  _proto.endDrag = function endDrag(e) {
	    this._onRelease(e);
	  };

	  return DraggableSVG;
	}();

	var Anchor = function () {
	  function Anchor(editor, rawPath, j, i, vars) {
	    this.editor = editor;
	    this.element = _createSVG("path", editor._selection, {
	      fill: _selectionColor,
	      stroke: _selectionColor,
	      strokeWidth: 2,
	      vectorEffect: "non-scaling-stroke"
	    });
	    this.update(rawPath, j, i);
	    this.element._gsSelection = true;
	    this.vars = vars || {};
	    this._draggable = new DraggableSVG(this.element, {
	      callbackScope: this,
	      onDrag: this.onDrag,
	      snap: this.vars.snap,
	      onPress: this.onPress,
	      onRelease: this.onRelease,
	      onClick: this.onClick,
	      onDragEnd: this.onDragEnd
	    });
	  }

	  var _proto2 = Anchor.prototype;

	  _proto2.onPress = function onPress() {
	    _callback("onPress", this);
	  };

	  _proto2.onClick = function onClick() {
	    _callback("onClick", this);
	  };

	  _proto2.onDrag = function onDrag() {
	    var s = this.segment;
	    this.vars.onDrag.call(this.vars.callbackScope || this, this, this._draggable.x - s[this.i], this._draggable.y - s[this.i + 1]);
	  };

	  _proto2.onDragEnd = function onDragEnd() {
	    _callback("onDragEnd", this);
	  };

	  _proto2.onRelease = function onRelease() {
	    _callback("onRelease", this);
	  };

	  _proto2.update = function update(rawPath, j, i) {
	    if (rawPath) {
	      this.rawPath = rawPath;
	    }

	    if (arguments.length <= 1) {
	      j = this.j;
	      i = this.i;
	    } else {
	      this.j = j;
	      this.i = i;
	    }

	    var prevSmooth = this.smooth,
	        segment = this.rawPath[j];
	    this.segment = segment;
	    this.smooth = i && i < segment.length - 2 && Math.abs(Math.atan2(segment[i + 1] - segment[i - 1], segment[i] - segment[i - 2]) - Math.atan2(segment[i + 3] - segment[i + 1], segment[i + 2] - segment[i])) < 0.09 ? 2 : 0;

	    if (this.smooth !== prevSmooth) {
	      this.element.setAttribute("d", this.smooth ? this.editor._circleHandle : this.editor._squareHandle);
	    }

	    this.element.setAttribute("transform", "translate(" + segment[i] + "," + segment[i + 1] + ")");
	  };

	  return Anchor;
	}();

	var PathEditor = function () {
	  function PathEditor(target, vars) {
	    vars = vars || {};

	    if (!_coreInitted) {
	      _initCore();
	    }

	    this.vars = vars;
	    this.path = typeof target === "string" ? _doc$1.querySelectorAll(target)[0] : target;
	    this._selectionHittest = _createSVG("path", this.path.ownerSVGElement, {
	      stroke: "transparent",
	      strokeWidth: 16,
	      fill: "none",
	      vectorEffect: "non-scaling-stroke"
	    });
	    this._selection = vars._selection || _createSVG("g", this.path.ownerSVGElement, {
	      "class": "path-editor-selection path-editor"
	    });
	    this._selectionPath = _createSVG("path", this._selection, {
	      stroke: _selectionColor,
	      strokeWidth: 2,
	      fill: "none",
	      vectorEffect: "non-scaling-stroke"
	    });
	    this._selectedAnchors = [];
	    this._line1 = _createSVG("polyline", this._selection, {
	      stroke: _selectionColor,
	      strokeWidth: 2,
	      vectorEffect: "non-scaling-stroke"
	    });
	    this._line2 = _createSVG("polyline", this._selection, {
	      stroke: _selectionColor,
	      strokeWidth: 2,
	      vectorEffect: "non-scaling-stroke"
	    });
	    this._line1.style.pointerEvents = this._line2.style.pointerEvents = this._selectionPath.style.pointerEvents = "none";
	    this._enabled = true;
	    var ctm = this.path.parentNode.getScreenCTM().inverse(),
	        size = (ctm.a + ctm.d) / 2 * (vars.handleSize || 5);
	    this._squareHandle = _getSquarePathData(size);
	    this._circleHandle = _getCirclePathData(size * 1.15);
	    this._handle1 = _createSVG("path", this._selection, {
	      d: this._squareHandle,
	      fill: _selectionColor,
	      stroke: "transparent",
	      strokeWidth: 6
	    });
	    this._handle2 = _createSVG("path", this._selection, {
	      d: this._squareHandle,
	      fill: _selectionColor,
	      stroke: "transparent",
	      strokeWidth: 6
	    });
	    this._handle1._draggable = new DraggableSVG(this._handle1, {
	      onDrag: this._onDragHandle1,
	      callbackScope: this,
	      onPress: this._onPressHandle1,
	      onRelease: this._onReleaseHandle,
	      onClick: this._onClickHandle1,
	      snap: vars.handleSnap
	    });
	    this._handle2._draggable = new DraggableSVG(this._handle2, {
	      onDrag: this._onDragHandle2,
	      callbackScope: this,
	      onPress: this._onPressHandle2,
	      onRelease: this._onReleaseHandle,
	      onClick: this._onClickHandle2,
	      snap: vars.handleSnap
	    });
	    this._handle1.style.visibility = this._handle2.style.visibility = "hidden";
	    var selectionItems = [this._handle1, this._handle2, this._line1, this._line2, this._selection, this._selectionPath, this._selectionHittest],
	        i = selectionItems.length;

	    while (--i > -1) {
	      selectionItems[i]._gsSelection = true;
	    }

	    if (vars.draggable !== false) {
	      this._draggable = new DraggableSVG(this._selectionHittest, {
	        callbackScope: this,
	        onPress: this.select,
	        onRelease: this._onRelease,
	        onDrag: this._onDragPath,
	        onDragEnd: this._saveState,
	        maxX: this.vars.maxX,
	        minX: this.vars.minX
	      });
	    }

	    this.init();
	    this._selection.style.visibility = vars.selected === false ? "hidden" : "visible";

	    if (vars.selected !== false) {
	      this.path._gsSelection = true;

	      _selectedPaths.push(this);
	    }

	    this._saveState();

	    _addListener(this._selectionHittest, "mousedown", _bind(this._onClickSelectionPath, this));

	    _addListener(this._selectionHittest, "touchstart", _bind(this._onClickSelectionPath, this));

	    _addListener(this._selectionHittest, "mouseup", _bind(this._onRelease, this));

	    _addListener(this._selectionHittest, "touchend", _bind(this._onRelease, this));
	  }

	  var _proto3 = PathEditor.prototype;

	  _proto3._onRelease = function _onRelease(e) {
	    var anchor = this._editingAnchor;

	    if (anchor) {
	      _editingAxis.x = anchor.segment[anchor.i];
	      _editingAxis.y = anchor.segment[anchor.i + 1];
	    }

	    _callback("onRelease", this, e);
	  };

	  _proto3.init = function init() {
	    var pathData = this.path.getAttribute("d"),
	        rawPath = stringToRawPath(pathData),
	        createAnchors = !this._rawPath || rawPath.totalPoints !== this._rawPath.totalPoints || rawPath.length !== this._rawPath.length,
	        anchorVars = {
	      callbackScope: this,
	      snap: this.vars.anchorSnap,
	      onDrag: this._onDragAnchor,
	      onPress: this._onPressAnchor,
	      onRelease: this._onRelease,
	      onClick: this._onClickAnchor,
	      onDragEnd: this._onDragEndAnchor,
	      maxX: this.vars.maxX,
	      minX: this.vars.minX
	    },
	        l,
	        i;

	    if (createAnchors && this._anchors && this._anchors.length) {
	      for (i = 0; i < this._anchors.length; i++) {
	        this._anchors[i].element.parentNode.removeChild(this._anchors[i].element);

	        this._anchors[i]._draggable.enabled(false);
	      }

	      this._selectedAnchors.length = 0;
	    }

	    this._rawPath = rawPath;

	    if (createAnchors) {
	      this._anchors = _createSegmentAnchors(rawPath, 0, this, anchorVars);
	      l = rawPath.length;

	      if (l > 1) {
	        for (i = 1; i < l; i++) {
	          this._anchors = this._anchors.concat(_createSegmentAnchors(rawPath, i, this, anchorVars));
	        }
	      }
	    } else {
	      i = this._anchors.length;

	      while (--i > -1) {
	        this._anchors[i].update(rawPath);
	      }
	    }

	    this._selection.appendChild(this._handle1);

	    this._selection.appendChild(this._handle2);

	    this._selectionPath.setAttribute("d", pathData);

	    this._selectionHittest.setAttribute("d", pathData);

	    this._selection.setAttribute("transform", this.path.getAttribute("transform") || "translate(0,0)");

	    this._selectionHittest.setAttribute("transform", this._selection.getAttribute("transform"));

	    this._updateAnchors();

	    return this;
	  };

	  _proto3._saveState = function _saveState() {
	    _addHistory(this);
	  };

	  _proto3._onClickSelectionPath = function _onClickSelectionPath(e) {
	    if (this._selection.style.visibility === "hidden") {
	      this.select();
	    } else if (_ALT || e && e.altKey) {
	      var anchorVars = {
	        callbackScope: this,
	        snap: this.vars.anchorSnap,
	        onDrag: this._onDragAnchor,
	        onPress: this._onPressAnchor,
	        onRelease: this._onRelease,
	        onClick: this._onClickAnchor,
	        onDragEnd: this._onDragEndAnchor,
	        maxX: this.vars.maxX,
	        minX: this.vars.minX
	      },
	          ctm = this._selection.getScreenCTM().inverse(),
	          newIndex,
	          _i,
	          anchor,
	          x,
	          y,
	          closestData;

	      if (this._draggable) {
	        this._draggable._onRelease(e);
	      }

	      if (ctm) {
	        x = e.clientX * ctm.a + e.clientY * ctm.c + ctm.e;
	        y = e.clientX * ctm.b + e.clientY * ctm.d + ctm.f;
	      }

	      closestData = getClosestData(this._rawPath, x, y);
	      subdivideSegment(this._rawPath[closestData.j], closestData.i, closestData.t);
	      newIndex = closestData.i + 6;

	      for (_i = 0; _i < this._anchors.length; _i++) {
	        if (this._anchors[_i].i >= newIndex) {
	          this._anchors[_i].i += 6;
	        }
	      }

	      anchor = new Anchor(this, this._rawPath, closestData.j, newIndex, anchorVars);

	      this._selection.appendChild(this._handle1);

	      this._selection.appendChild(this._handle2);

	      anchor._draggable._onPress(e);

	      _recentlyAddedAnchor = anchor;

	      this._anchors.push(anchor);

	      this._selectedAnchors.length = 0;

	      this._selectedAnchors.push(anchor);

	      this._updateAnchors();

	      this.update();

	      this._saveState();
	    }

	    _callback("onPress", this);
	  };

	  _proto3._onClickHandle1 = function _onClickHandle1() {
	    var anchor = this._editingAnchor,
	        i = anchor.i,
	        s = anchor.segment;

	    if (_ALT && Math.abs(s[i] - s[i - 2]) < 5 && Math.abs(s[i + 1] - s[i - 1]) < 5) {
	      this._onClickAnchor(anchor);
	    }
	  };

	  _proto3._onClickHandle2 = function _onClickHandle2() {
	    var anchor = this._editingAnchor,
	        i = anchor.i,
	        s = anchor.segment;

	    if (_ALT && Math.abs(s[i] - s[i + 2]) < 5 && Math.abs(s[i + 1] - s[i + 3]) < 5) {
	      this._onClickAnchor(anchor);
	    }
	  };

	  _proto3._onDragEndAnchor = function _onDragEndAnchor(e) {
	    _recentlyAddedAnchor = null;

	    this._saveState();
	  };

	  _proto3.isSelected = function isSelected() {
	    return this._selectedAnchors.length > 0;
	  };

	  _proto3.select = function select(allAnchors) {
	    this._selection.style.visibility = "visible";
	    this._editingAnchor = null;
	    this.path._gsSelection = true;

	    if (allAnchors === true) {
	      var _i2 = this._anchors.length;

	      while (--_i2 > -1) {
	        this._selectedAnchors[_i2] = this._anchors[_i2];
	      }
	    }

	    if (_selectedPaths.indexOf(this) === -1) {
	      _selectedPaths.push(this);
	    }

	    this._updateAnchors();

	    return this;
	  };

	  _proto3.deselect = function deselect() {
	    this._selection.style.visibility = "hidden";
	    this._selectedAnchors.length = 0;
	    this._editingAnchor = null;
	    this.path._gsSelection = false;

	    _selectedPaths.splice(_selectedPaths.indexOf(this), 1);

	    this._updateAnchors();

	    return this;
	  };

	  _proto3._onDragPath = function _onDragPath(e) {
	    var transform = this._selectionHittest.getAttribute("transform") || "translate(0,0)";

	    this._selection.setAttribute("transform", transform);

	    this.path.setAttribute("transform", transform);
	  };

	  _proto3._onPressAnchor = function _onPressAnchor(anchor) {
	    if (this._selectedAnchors.indexOf(anchor) === -1) {
	      if (!_SHIFT) {
	        this._selectedAnchors.length = 0;
	      }

	      this._selectedAnchors.push(anchor);
	    } else if (_SHIFT) {
	      this._selectedAnchors.splice(this._selectedAnchors.indexOf(anchor), 1);

	      anchor._draggable.endDrag();
	    }

	    _editingAxis.x = anchor.segment[anchor.i];
	    _editingAxis.y = anchor.segment[anchor.i + 1];

	    this._updateAnchors();

	    _callback("onPress", this);
	  };

	  _proto3._deleteSelectedAnchors = function _deleteSelectedAnchors() {
	    var anchors = this._selectedAnchors,
	        i = anchors.length,
	        anchor,
	        index,
	        j;

	    while (--i > -1) {
	      anchor = anchors[i];
	      anchor.element.parentNode.removeChild(anchor.element);

	      anchor._draggable.enabled(false);

	      index = anchor.i;

	      if (!index) {
	        anchor.segment.splice(index, 6);
	      } else if (index < anchor.segment.length - 2) {
	        anchor.segment.splice(index - 2, 6);
	      } else {
	        anchor.segment.splice(index - 4, 6);
	      }

	      anchors.splice(i, 1);

	      this._anchors.splice(this._anchors.indexOf(anchor), 1);

	      for (j = 0; j < this._anchors.length; j++) {
	        if (this._anchors[j].i >= index) {
	          this._anchors[j].i -= 6;
	        }
	      }
	    }

	    this._updateAnchors();

	    this.update();

	    this._saveState();

	    if (this.vars.onDeleteAnchor) {
	      this.vars.onDeleteAnchor.call(this.vars.callbackScope || this);
	    }
	  };

	  _proto3._onClickAnchor = function _onClickAnchor(anchor) {
	    var i = anchor.i,
	        segment = anchor.segment,
	        rnd = 1000,
	        isEnd = !i || i >= segment.length - 2,
	        angle1,
	        angle2,
	        length1,
	        length2,
	        sin,
	        cos;

	    if (_ALT && _recentlyAddedAnchor !== anchor && this._editingAnchor) {
	      anchor.smooth = !anchor.smooth;

	      if (isEnd) {
	        anchor.smooth = false;
	      }

	      anchor.element.setAttribute("d", anchor.smooth ? this._circleHandle : this._squareHandle);

	      if (anchor.smooth && !isEnd) {
	        angle1 = Math.atan2(segment[i + 1] - segment[i - 1], segment[i] - segment[i - 2]);
	        angle2 = Math.atan2(segment[i + 3] - segment[i + 1], segment[i + 2] - segment[i]);
	        angle1 = (angle1 + angle2) / 2;
	        length1 = _getLength(segment, i - 2, i);
	        length2 = _getLength(segment, i, i + 2);

	        if (length1 < 0.2) {
	          length1 = _getLength(segment, i, i - 6) / 4;
	          angle1 = angle2 || Math.atan2(segment[i + 7] - segment[i - 5], segment[i + 6] - segment[i - 6]);
	        }

	        if (length2 < 0.2) {
	          length2 = _getLength(segment, i, i + 6) / 4;
	          angle2 = angle1 || Math.atan2(segment[i + 7] - segment[i - 5], segment[i + 6] - segment[i - 6]);
	        }

	        sin = Math.sin(angle1);
	        cos = Math.cos(angle1);

	        if (Math.abs(angle2 - angle1) < Math.PI / 2) {
	          sin = -sin;
	          cos = -cos;
	        }

	        segment[i - 2] = ((segment[i] + cos * length1) * rnd | 0) / rnd;
	        segment[i - 1] = ((segment[i + 1] + sin * length1) * rnd | 0) / rnd;
	        segment[i + 2] = ((segment[i] - cos * length2) * rnd | 0) / rnd;
	        segment[i + 3] = ((segment[i + 1] - sin * length2) * rnd | 0) / rnd;

	        this._updateAnchors();

	        this.update();

	        this._saveState();
	      } else if (!anchor.smooth && !isEnd) {
	        if (i) {
	          segment[i - 2] = segment[i];
	          segment[i - 1] = segment[i + 1];
	        }

	        if (i < segment.length - 2) {
	          segment[i + 2] = segment[i];
	          segment[i + 3] = segment[i + 1];
	        }

	        this._updateAnchors();

	        this.update();

	        this._saveState();
	      }
	    } else if (!_SHIFT) {
	      this._selectedAnchors.length = 0;

	      this._selectedAnchors.push(anchor);
	    }

	    _recentlyAddedAnchor = null;

	    this._updateAnchors();
	  };

	  _proto3._updateAnchors = function _updateAnchors() {
	    var anchor = this._selectedAnchors.length === 1 ? this._selectedAnchors[0] : null,
	        segment = anchor ? anchor.segment : null,
	        i,
	        x,
	        y;
	    this._editingAnchor = anchor;

	    for (i = 0; i < this._anchors.length; i++) {
	      this._anchors[i].element.style.fill = this._selectedAnchors.indexOf(this._anchors[i]) !== -1 ? _selectionColor : "white";
	    }

	    if (anchor) {
	      this._handle1.setAttribute("d", anchor.smooth ? this._circleHandle : this._squareHandle);

	      this._handle2.setAttribute("d", anchor.smooth ? this._circleHandle : this._squareHandle);
	    }

	    i = anchor ? anchor.i : 0;

	    if (anchor && i) {
	      x = segment[i - 2];
	      y = segment[i - 1];
	      this._handle1.style.visibility = this._line1.style.visibility = !_ALT && x === segment[i] && y === segment[i + 1] ? "hidden" : "visible";

	      this._handle1.setAttribute("transform", "translate(" + x + _comma + y + ")");

	      this._line1.setAttribute("points", x + _comma + y + _comma + segment[i] + _comma + segment[i + 1]);
	    } else {
	      this._handle1.style.visibility = this._line1.style.visibility = "hidden";
	    }

	    if (anchor && i < segment.length - 2) {
	      x = segment[i + 2];
	      y = segment[i + 3];
	      this._handle2.style.visibility = this._line2.style.visibility = !_ALT && x === segment[i] && y === segment[i + 1] ? "hidden" : "visible";

	      this._handle2.setAttribute("transform", "translate(" + x + _comma + y + ")");

	      this._line2.setAttribute("points", segment[i] + _comma + segment[i + 1] + _comma + x + _comma + y);
	    } else {
	      this._handle2.style.visibility = this._line2.style.visibility = "hidden";
	    }
	  };

	  _proto3._onPressAlt = function _onPressAlt() {
	    var anchor = this._editingAnchor;

	    if (anchor) {
	      if (anchor.i) {
	        this._handle1.style.visibility = this._line1.style.visibility = "visible";
	      }

	      if (anchor.i < anchor.segment.length - 2) {
	        this._handle2.style.visibility = this._line2.style.visibility = "visible";
	      }
	    }
	  };

	  _proto3._onReleaseAlt = function _onReleaseAlt() {
	    var anchor = this._editingAnchor,
	        s,
	        i;

	    if (anchor) {
	      s = anchor.segment;
	      i = anchor.i;

	      if (s[i] === s[i - 2] && s[i + 1] === s[i - 1]) {
	        this._handle1.style.visibility = this._line1.style.visibility = "hidden";
	      }

	      if (s[i] === s[i + 2] && s[i + 1] === s[i + 3]) {
	        this._handle2.style.visibility = this._line2.style.visibility = "hidden";
	      }
	    }
	  };

	  _proto3._onPressHandle1 = function _onPressHandle1() {
	    if (this._editingAnchor.smooth) {
	      this._oppositeHandleLength = _getLength(this._editingAnchor.segment, this._editingAnchor.i, this._editingAnchor.i + 2);
	    }

	    _callback("onPress", this);
	  };

	  _proto3._onPressHandle2 = function _onPressHandle2() {
	    if (this._editingAnchor.smooth) {
	      this._oppositeHandleLength = _getLength(this._editingAnchor.segment, this._editingAnchor.i - 2, this._editingAnchor.i);
	    }

	    _callback("onPress", this);
	  };

	  _proto3._onReleaseHandle = function _onReleaseHandle(e) {
	    this._onRelease(e);

	    this._saveState();
	  };

	  _proto3._onDragHandle1 = function _onDragHandle1() {
	    var anchor = this._editingAnchor,
	        s = anchor.segment,
	        i = anchor.i,
	        rnd = 1000,
	        x = this._handle1._draggable.x,
	        y = this._handle1._draggable.y,
	        angle;
	    s[i - 2] = x = (x * rnd | 0) / rnd;
	    s[i - 1] = y = (y * rnd | 0) / rnd;

	    if (anchor.smooth) {
	      if (_ALT) {
	        anchor.smooth = false;
	        anchor.element.setAttribute("d", this._squareHandle);

	        this._handle1.setAttribute("d", this._squareHandle);

	        this._handle2.setAttribute("d", this._squareHandle);
	      } else {
	        angle = Math.atan2(s[i + 1] - y, s[i] - x);
	        x = this._oppositeHandleLength * Math.cos(angle);
	        y = this._oppositeHandleLength * Math.sin(angle);
	        s[i + 2] = ((s[i] + x) * rnd | 0) / rnd;
	        s[i + 3] = ((s[i + 1] + y) * rnd | 0) / rnd;
	      }
	    }

	    this.update();
	  };

	  _proto3._onDragHandle2 = function _onDragHandle2() {
	    var anchor = this._editingAnchor,
	        s = anchor.segment,
	        i = anchor.i,
	        rnd = 1000,
	        x = this._handle2._draggable.x,
	        y = this._handle2._draggable.y,
	        angle;
	    s[i + 2] = x = (x * rnd | 0) / rnd;
	    s[i + 3] = y = (y * rnd | 0) / rnd;

	    if (anchor.smooth) {
	      if (_ALT) {
	        anchor.smooth = false;
	        anchor.element.setAttribute("d", this._squareHandle);

	        this._handle1.setAttribute("d", this._squareHandle);

	        this._handle2.setAttribute("d", this._squareHandle);
	      } else {
	        angle = Math.atan2(s[i + 1] - y, s[i] - x);
	        x = this._oppositeHandleLength * Math.cos(angle);
	        y = this._oppositeHandleLength * Math.sin(angle);
	        s[i - 2] = ((s[i] + x) * rnd | 0) / rnd;
	        s[i - 1] = ((s[i + 1] + y) * rnd | 0) / rnd;
	      }
	    }

	    this.update();
	  };

	  _proto3._onDragAnchor = function _onDragAnchor(anchor, changeX, changeY) {
	    var anchors = this._selectedAnchors,
	        l = anchors.length,
	        rnd = 1000,
	        i,
	        j,
	        s,
	        a;

	    for (j = 0; j < l; j++) {
	      a = anchors[j];
	      i = a.i;
	      s = a.segment;

	      if (i) {
	        s[i - 2] = ((s[i - 2] + changeX) * rnd | 0) / rnd;
	        s[i - 1] = ((s[i - 1] + changeY) * rnd | 0) / rnd;
	      }

	      s[i] = ((s[i] + changeX) * rnd | 0) / rnd;
	      s[i + 1] = ((s[i + 1] + changeY) * rnd | 0) / rnd;

	      if (i < s.length - 2) {
	        s[i + 2] = ((s[i + 2] + changeX) * rnd | 0) / rnd;
	        s[i + 3] = ((s[i + 3] + changeY) * rnd | 0) / rnd;
	      }

	      if (a !== anchor) {
	        a.element.setAttribute("transform", "translate(" + s[i] + _comma + s[i + 1] + ")");
	      }
	    }

	    this.update();
	  };

	  _proto3.enabled = function enabled(_enabled2) {
	    if (!arguments.length) {
	      return this._enabled;
	    }

	    var i = this._anchors.length;

	    while (--i > -1) {
	      this._anchors[i]._draggable.enabled(_enabled2);
	    }

	    this._enabled = _enabled2;

	    this._handle1._draggable.enabled(_enabled2);

	    this._handle2._draggable.enabled(_enabled2);

	    if (this._draggable) {
	      this._draggable.enabled(_enabled2);
	    }

	    if (!_enabled2) {
	      this.deselect();
	      this.path.ownerSVGElement.removeChild(this._selectionHittest);
	      this.path.ownerSVGElement.removeChild(this._selection);
	    } else if (!this._selection.parentNode) {
	      this.path.ownerSVGElement.appendChild(this._selectionHittest);
	      this.path.ownerSVGElement.appendChild(this._selection);
	      this.init();

	      this._saveState();
	    }

	    this._updateAnchors();

	    return this.update();
	  };

	  _proto3.update = function update(readPath) {
	    var d = "",
	        anchor = this._editingAnchor,
	        i,
	        s,
	        x,
	        y;

	    if (readPath) {
	      this.init();
	    }

	    if (anchor) {
	      i = anchor.i;
	      s = anchor.segment;

	      if (i) {
	        x = s[i - 2];
	        y = s[i - 1];

	        this._handle1.setAttribute("transform", "translate(" + x + _comma + y + ")");

	        this._line1.setAttribute("points", x + _comma + y + _comma + s[i] + _comma + s[i + 1]);
	      }

	      if (i < s.length - 2) {
	        x = s[i + 2];
	        y = s[i + 3];

	        this._handle2.setAttribute("transform", "translate(" + x + _comma + y + ")");

	        this._line2.setAttribute("points", s[i] + _comma + s[i + 1] + _comma + x + _comma + y);
	      }
	    }

	    if (readPath) {
	      d = this.path.getAttribute("d");
	    } else {
	      for (i = 0; i < this._rawPath.length; i++) {
	        s = this._rawPath[i];

	        if (s.length > 7) {
	          d += "M" + s[0] + _comma + s[1] + "C" + s.slice(2).join(_comma);
	        }
	      }

	      this.path.setAttribute("d", d);

	      this._selectionPath.setAttribute("d", d);

	      this._selectionHittest.setAttribute("d", d);
	    }

	    if (this.vars.onUpdate && this._enabled) {
	      _callback("onUpdate", this, d);
	    }

	    return this;
	  };

	  _proto3.getRawPath = function getRawPath(applyTransforms, offsetX, offsetY) {
	    if (applyTransforms) {
	      var m = _getConsolidatedMatrix(this.path);

	      return transformRawPath(copyRawPath(this._rawPath), 1, 0, 0, 1, m.e + (offsetX || 0), m.f + (offsetY || 0));
	    }

	    return this._rawPath;
	  };

	  _proto3.getString = function getString(applyTransforms, offsetX, offsetY) {
	    if (applyTransforms) {
	      var m = _getConsolidatedMatrix(this.path);

	      return rawPathToString(transformRawPath(copyRawPath(this._rawPath), 1, 0, 0, 1, m.e + (offsetX || 0), m.f + (offsetY || 0)));
	    }

	    return this.path.getAttribute("d");
	  };

	  _proto3.getNormalizedSVG = function getNormalizedSVG(height, originY, shorten, onEaseError) {
	    var s = this._rawPath[0],
	        tx = s[0] * -1,
	        ty = originY === 0 ? 0 : -(originY || s[1]),
	        l = s.length,
	        sx = 1 / (s[l - 2] + tx),
	        sy = -height || s[l - 1] + ty,
	        rnd = 1000,
	        points,
	        i,
	        x1,
	        y1,
	        x2,
	        y2;
	    _temp.length = 0;

	    if (sy) {
	      sy = 1 / sy;
	    } else {
	      sy = -sx;
	    }

	    sx *= rnd;
	    sy *= rnd;

	    for (i = 0; i < l; i += 2) {
	      _temp[i] = ((s[i] + tx) * sx | 0) / rnd;
	      _temp[i + 1] = ((s[i + 1] + ty) * sy | 0) / rnd;
	    }

	    if (onEaseError) {
	      points = [];
	      l = _temp.length;

	      for (i = 2; i < l; i += 6) {
	        x1 = _temp[i - 2];
	        y1 = _temp[i - 1];
	        x2 = _temp[i + 4];
	        y2 = _temp[i + 5];
	        points.push(x1, y1, x2, y2);
	        bezierToPoints(x1, y1, _temp[i], _temp[i + 1], _temp[i + 2], _temp[i + 3], x2, y2, 0.001, points, points.length - 2);
	      }

	      x1 = points[0];
	      l = points.length;

	      for (i = 2; i < l; i += 2) {
	        x2 = points[i];

	        if (x2 < x1 || x2 > 1 || x2 < 0) {
	          onEaseError();
	          break;
	        }

	        x1 = x2;
	      }
	    }

	    if (shorten && l === 8 && _temp[0] === 0 && _temp[1] === 0 && _temp[l - 2] === 1 && _temp[l - 1] === 1) {
	      return _temp.slice(2, 6).join(",");
	    }

	    _temp[2] = "C" + _temp[2];
	    return "M" + _temp.join(",");
	  };

	  return PathEditor;
	}();
	PathEditor.simplifyPoints = simplifyPoints;
	PathEditor.pointsToSegment = pointsToSegment;

	PathEditor.simplifySVG = function (data, vars) {
	  var element, points, i, x1, x2, y1, y2, bezier, precision, tolerance, l, cornerThreshold;
	  vars = vars || {};
	  tolerance = vars.tolerance || 1;
	  precision = vars.precision || 1 / tolerance;
	  cornerThreshold = (vars.cornerThreshold === undefined ? 18 : +vars.cornerThreshold) * _DEG2RAD$1;

	  if (typeof data !== "string") {
	    element = data;
	    data = element.getAttribute("d");
	  }

	  if (data.charAt(0) === "#" || data.charAt(0) === ".") {
	    element = _doc$1.querySelector(data);

	    if (element) {
	      data = element.getAttribute("d");
	    }
	  }

	  points = vars.curved === false && !/[achqstvz]/ig.test(data) ? data.match(_numbersExp) : stringToRawPath(data)[0];

	  if (vars.curved !== false) {
	    bezier = points;
	    points = [];
	    l = bezier.length;

	    for (i = 2; i < l; i += 6) {
	      x1 = +bezier[i - 2];
	      y1 = +bezier[i - 1];
	      x2 = +bezier[i + 4];
	      y2 = +bezier[i + 5];
	      points.push(_round$1(x1), _round$1(y1), _round$1(x2), _round$1(y2));
	      bezierToPoints(x1, y1, +bezier[i], +bezier[i + 1], +bezier[i + 2], +bezier[i + 3], x2, y2, 1 / (precision * 200000), points, points.length - 2);
	    }

	    points = pointsToSegment(simplifyPoints(points, tolerance), vars.curviness, cornerThreshold);
	    points[2] = "C" + points[2];
	  } else {
	    points = simplifyPoints(points, tolerance);
	  }

	  data = "M" + points.join(",");

	  if (element) {
	    element.setAttribute("d", data);
	  }

	  return data;
	};

	PathEditor.create = function (target, vars) {
	  return new PathEditor(target, vars);
	};

	PathEditor.editingAxis = _editingAxis;

	PathEditor.getSnapFunction = function (vars) {
	  var r = vars.radius || 2,
	      big = 1e20,
	      minX = vars.x || vars.x === 0 ? vars.x : vars.width ? 0 : -big,
	      minY = vars.y || vars.y === 0 ? vars.y : vars.height ? 0 : -big,
	      maxX = minX + (vars.width || big * big),
	      maxY = minY + (vars.height || big * big),
	      containX = vars.containX !== false,
	      containY = vars.containY !== false,
	      axis = vars.axis,
	      grid = vars.gridSize;
	  r *= r;
	  return function (p) {
	    var x = p.x,
	        y = p.y,
	        gridX,
	        gridY,
	        dx,
	        dy;

	    if (containX && x < minX || (dx = x - minX) * dx < r) {
	      x = minX;
	    } else if (containX && x > maxX || (dx = maxX - x) * dx < r) {
	      x = maxX;
	    }

	    if (containY && y < minY || (dy = y - minY) * dy < r) {
	      y = minY;
	    } else if (containY && y > maxY || (dy = maxY - y) * dy < r) {
	      y = maxY;
	    }

	    if (axis) {
	      dx = x - axis.x;
	      dy = y - axis.y;

	      if (dx * dx < r) {
	        x = axis.x;
	      }

	      if (dy * dy < r) {
	        y = axis.y;
	      }
	    }

	    if (grid) {
	      gridX = minX + Math.round((x - minX) / grid) * grid;
	      dx = gridX - x;
	      gridY = minY + Math.round((y - minY) / grid) * grid;
	      dy = gridY - y;

	      if (dx * dx + dy * dy < r) {
	        x = gridX;
	        y = gridY;
	      }
	    }

	    p.x = x;
	    p.y = y;
	  };
	};

	PathEditor.version = "3.0.0";

	/*!
	 * MotionPathHelper 3.0.0
	 * https://greensock.com
	 *
	 * @license Copyright 2008-2019, GreenSock. All rights reserved.
	 * Subject to the terms at https://greensock.com/standard-license or for
	 * Club GreenSock members, the agreement issued with that membership.
	 * @author: Jack Doyle, jack@greensock.com
	*/

	var gsap,
	    _win$1,
	    _doc$2,
	    _docEl,
	    MotionPathPlugin,
	    _arrayToRawPath,
	    _rawPathToString,
	    _selectorExp = /(^[#\.][a-z]|[a-y][a-z])/i,
	    _isString = function _isString(value) {
	  return typeof value === "string";
	},
	    _createElement$1 = function _createElement(type, ns) {
	  var e = _doc$2.createElementNS ? _doc$2.createElementNS((ns || "http://www.w3.org/1999/xhtml").replace(/^https/, "http"), type) : _doc$2.createElement(type);
	  return e.style ? e : _doc$2.createElement(type);
	},
	    _getPositionOnPage = function _getPositionOnPage(target) {
	  var bounds = target.getBoundingClientRect(),
	      windowOffsetY = _docEl.clientTop - (_win$1.pageYOffset || _docEl.scrollTop || document.body.scrollTop || 0),
	      windowOffsetX = _docEl.clientLeft - (_win$1.pageXOffset || _docEl.scrollLeft || document.body.scrollLeft || 0);
	  return {
	    left: bounds.left + windowOffsetX,
	    top: bounds.top + windowOffsetY,
	    right: bounds.right + windowOffsetX,
	    bottom: bounds.bottom + windowOffsetY
	  };
	},
	    _getInitialPath = function _getInitialPath(x, y) {
	  var coordinates = [0, 31, 8, 58, 24, 75, 40, 90, 69, 100, 100, 100],
	      i;

	  for (i = 0; i < coordinates.length; i += 2) {
	    coordinates[i] += x;
	    coordinates[i + 1] += y;
	  }

	  return "M" + x + "," + y + "C" + coordinates.join(",");
	},
	    _getGlobalTime = function _getGlobalTime(animation) {
	  var time = animation.totalTime();

	  while (animation) {
	    time = animation.startTime() + time / (animation.timeScale() || 1);
	    animation = animation.parent;
	  }

	  return time;
	},
	    _copyElement,
	    _initCopyToClipboard = function _initCopyToClipboard() {
	  _copyElement = _createElement$1("textarea");
	  _copyElement.style.display = "none";

	  _doc$2.body.appendChild(_copyElement);
	},
	    _parsePath = function _parsePath(path, target, vars) {
	  return _isString(path) && _selectorExp.test(path) ? _doc$2.querySelector(path) : Array.isArray(path) ? _rawPathToString(_arrayToRawPath([{
	    x: gsap.getProperty(target, "x"),
	    y: gsap.getProperty(target, "y")
	  }].concat(path), vars)) : _isString(path) || path && (path.tagName + "").toLowerCase() === "path" ? path : 0;
	},
	    _addCopyToClipboard = function _addCopyToClipboard(target, getter, onComplete) {
	  target.addEventListener('click', function (e) {
	    if (e.target._gsHelper) {
	      var c = getter(e.target);
	      _copyElement.value = c;

	      if (c && _copyElement.select) {
	        console.log(c);
	        _copyElement.style.display = "block";

	        _copyElement.select();

	        try {
	          document.execCommand('copy');

	          _copyElement.blur();

	          if (onComplete) {
	            onComplete(target);
	          }
	        } catch (err) {
	          console.warn("Copy didn't work; this browser doesn't permit that.");
	        }

	        _copyElement.style.display = "none";
	      }
	    }
	  });
	},
	    _identityMatrixObject$1 = {
	  matrix: {
	    a: 1,
	    b: 0,
	    c: 0,
	    d: 1,
	    e: 0,
	    f: 0
	  }
	},
	    _getConsolidatedMatrix$1 = function _getConsolidatedMatrix(target) {
	  return (target.transform.baseVal.consolidate() || _identityMatrixObject$1).matrix;
	},
	    _findMotionPathTween = function _findMotionPathTween(target) {
	  var tweens = gsap.getTweensOf(target),
	      i = 0;

	  for (; i < tweens.length; i++) {
	    if (tweens[i].vars.motionPath) {
	      return tweens[i];
	    } else if (tweens[i].timeline) {
	      tweens.push.apply(tweens, tweens[i].timeline.getChildren());
	    }
	  }
	},
	    _initCore$1 = function _initCore(core, required) {
	  var message = "Please gsap.registerPlugin(MotionPathPlugin)";
	  _win$1 = window;
	  gsap = gsap || core || _win$1.gsap || console.warn(message);
	  _doc$2 = document;
	  _docEl = _doc$2.documentElement;
	  MotionPathPlugin = gsap && gsap.plugins.motionPath;

	  if (!MotionPathPlugin) {
	    required === true && console.warn(message);
	  } else {
	    _initCopyToClipboard();

	    _arrayToRawPath = MotionPathPlugin.arrayToRawPath;
	    _rawPathToString = MotionPathPlugin.rawPathToString;
	  }
	};

	var MotionPathHelper = function () {
	  function MotionPathHelper(targetOrTween, vars) {
	    if (vars === void 0) {
	      vars = {};
	    }

	    if (!MotionPathPlugin) {
	      _initCore$1(vars.gsap, 1);
	    }

	    var copyButton = _createElement$1("div"),
	        self = this,
	        offset = {
	      x: 0,
	      y: 0
	    },
	        target,
	        path,
	        isSVG,
	        startX,
	        startY,
	        position,
	        svg,
	        animation,
	        svgNamespace,
	        temp,
	        matrix,
	        refreshPath,
	        animationToScrub;

	    if (targetOrTween instanceof gsap.core.Tween) {
	      animation = targetOrTween;
	      target = animation.targets()[0];
	    } else {
	      target = gsap.utils.toArray(targetOrTween)[0];
	      animation = _findMotionPathTween(target);
	    }

	    path = _parsePath(vars.path, target, vars);
	    this.offset = offset;
	    position = _getPositionOnPage(target);
	    startX = parseFloat(gsap.getProperty(target, "x", "px"));
	    startY = parseFloat(gsap.getProperty(target, "y", "px"));
	    isSVG = target.getCTM && target.tagName.toLowerCase() !== "svg";

	    if (animation && !path) {
	      path = _parsePath(animation.vars.motionPath.path || animation.vars.motionPath, target, animation.vars.motionPath);
	    }

	    copyButton.style.cssText = "border-radius:8px; background-color:rgba(85, 85, 85, 0.7); color:#fff; cursor:pointer; padding:6px 12px; font-family:Signika Negative, Arial, sans-serif; position:fixed; left:50%; transform:translate(-50%, 0); font-size:19px; bottom:10px";
	    copyButton.innerText = "COPY MOTION PATH";
	    copyButton._gsHelper = self;

	    _doc$2.body.appendChild(copyButton);

	    _addCopyToClipboard(copyButton, function () {
	      return self.getString();
	    }, function () {
	      return gsap.fromTo(copyButton, {
	        backgroundColor: "white"
	      }, {
	        duration: 0.5,
	        backgroundColor: "rgba(85, 85, 85, 0.6)"
	      });
	    });

	    svg = path && path.ownerSVGElement;

	    if (!svg) {
	      svgNamespace = isSVG && target.ownerSVGElement && target.ownerSVGElement.getAttribute("xmlns") || "http://www.w3.org/2000/svg";

	      if (isSVG) {
	        svg = target.ownerSVGElement;
	        temp = target.getBBox();
	        matrix = _getConsolidatedMatrix$1(target);
	        startX = matrix.e;
	        startY = matrix.f;
	        offset.x = temp.x;
	        offset.y = temp.y;
	      } else {
	        svg = _createElement$1("svg", svgNamespace);

	        _doc$2.body.appendChild(svg);

	        svg.setAttribute("viewBox", "0 0 100 100");
	        svg.style.cssText = "overflow:visible; background-color: transparent; position:absolute; width:100px; height:100px; top:" + position.top + "px; left:" + position.left + "px;";
	      }

	      temp = _isString(path) && !_selectorExp.test(path) ? path : _getInitialPath(startX, startY);
	      path = _createElement$1("path", svgNamespace);
	      path.setAttribute("d", temp);
	      path.setAttribute("vector-effect", "non-scaling-stroke");
	      path.style.cssText = "fill:transparent; stroke-width:" + (vars.pathWidth || 3) + "; stroke:" + (vars.pathColor || "#555") + "; opacity:" + (vars.pathOpacity || 0.6);
	      svg.appendChild(path);

	      if (offset.x || offset.y) {
	        gsap.set(path, {
	          x: offset.x,
	          y: offset.y
	        });
	      }
	    }

	    if (!("selected" in vars)) {
	      vars.selected = true;
	    }

	    if (!("anchorSnap" in vars)) {
	      vars.anchorSnap = function (p) {
	        if (p.x * p.x + p.y * p.y < 16) {
	          p.x = p.y = 0;
	        }
	      };
	    }

	    animationToScrub = animation && animation.parent.data === "nested" ? animation.parent.parent : animation;

	    vars.onPress = function () {
	      animationToScrub.pause(0);
	    };

	    refreshPath = function refreshPath() {
	      var m = _getConsolidatedMatrix$1(path);

	      animation.vars.motionPath.offsetX = m.e - offset.x;
	      animation.vars.motionPath.offsetY = m.f - offset.y;
	      animation.invalidate();
	      animationToScrub.restart();
	    };

	    vars.onRelease = vars.onDeleteAnchor = refreshPath;
	    this.editor = PathEditor.create(path, vars);

	    if (vars.center) {
	      gsap.set(target, {
	        transformOrigin: "50% 50%",
	        xPercent: -50,
	        yPercent: -50
	      });
	    }

	    if (animation) {
	      if (animation.vars.motionPath.path) {
	        animation.vars.motionPath.path = path;
	      } else {
	        animation.vars.motionPath = {
	          path: path
	        };
	      }

	      if (animationToScrub.parent !== gsap.globalTimeline) {
	        gsap.globalTimeline.add(animationToScrub, _getGlobalTime(animationToScrub) - animationToScrub.delay());
	      }

	      animationToScrub.repeat(-1).repeatDelay(1);
	    } else {
	      animation = animationToScrub = gsap.to(target, {
	        motionPath: {
	          path: path,
	          start: vars.start || 0,
	          end: "end" in vars ? vars.end : 1,
	          autoRotate: "autoRotate" in vars ? vars.autoRotate : false
	        },
	        duration: vars.duration || 5,
	        ease: vars.ease || "Power1.easeInOut",
	        repeat: -1,
	        repeatDelay: 1,
	        paused: !vars.path
	      });
	    }

	    this.animation = animation;
	  }

	  var _proto = MotionPathHelper.prototype;

	  _proto.getString = function getString() {
	    return this.editor.getString(true, -this.offset.x, -this.offset.y);
	  };

	  return MotionPathHelper;
	}();
	MotionPathHelper.register = _initCore$1;

	MotionPathHelper.create = function (target, vars) {
	  return new MotionPathHelper(target, vars);
	};

	MotionPathHelper.version = "3.0.0";

	exports.MotionPathHelper = MotionPathHelper;
	exports.default = MotionPathHelper;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
