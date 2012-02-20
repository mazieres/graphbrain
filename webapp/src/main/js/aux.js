/**
 * (c) 2012 GraphBrain Ltd. All rigths reserved.
 */

// extending Object to return size (useful for dictionaries)
Object.prototype.size = function () {
    var len = this.length ? --this.length : -1;
    for (var k in this)
        len++;
    return len;
}