/*global describe, it*/


'use strict';


var assert = require('assert');

var helpers = require('./helpers');

var pako_utils = require('../lib/zlib/utils');
var pako = require('../index');


var samples = helpers.loadSamples();


function randomBuf(size) {
  var buf = pako_utils.Buf8(size);
  for (var i = 0; i < size; i++) {
    buf[i] = Math.round(Math.random() * 256);
  }
  return buf;
}

function testChunk(buf, expected, packer, chunkSize) {
  var i, _in, count, pos, size;

  count = Math.ceil(buf.length / chunkSize);
  pos = 0;
  for (i = 0; i < count; i++) {
    size = (buf.length - pos) < chunkSize ? buf.length - pos : chunkSize;
    _in = new pako_utils.Buf8(size);
    pako_utils.arraySet(_in, buf, pos, size, 0);
    packer.push(_in, i === count - 1);
    pos += chunkSize;
  }

  assert(!packer.err, 'Packer error: ' + packer.err);

  assert(helpers.cmpBuf(packer.result, expected), 'Result is different');
}

describe('Small input chunks', function () {

  it('deflate 100b by 1b chunk', function () {
    var buf = randomBuf(100);
    var deflated = pako.deflate(buf);
    testChunk(buf, deflated, new pako.Deflate(), 1);
  });

  it('deflate 8000b by 10b chunk', function () {
    var buf = randomBuf(8000);
    var deflated = pako.deflate(buf);
    testChunk(buf, deflated, new pako.Deflate(), 10);
  });

  it('inflate 100b result by 1b chunk', function () {
    var buf = randomBuf(100);
    var deflated = pako.deflate(buf);
    testChunk(deflated, buf, new pako.Inflate(), 1);
  });

  it('inflate 8000b result by 10b chunk', function () {
    var buf = randomBuf(8000);
    var deflated = pako.deflate(buf);
    testChunk(deflated, buf, new pako.Inflate(), 10);
  });

});


describe('Dummy push (force end)', function () {

  it('deflate end', function () {
    var data = samples.lorem_utf_100k;

    var deflator = new pako.Deflate();
    deflator.push(data);
    deflator.push([], true);

    assert(helpers.cmpBuf(deflator.result, pako.deflate(data)));
  });

  it('inflate end', function () {
    var data = pako.deflate(samples.lorem_utf_100k);

    var inflator = new pako.Inflate();
    inflator.push(data);
    inflator.push([], true);

    assert(helpers.cmpBuf(inflator.result, pako.inflate(data)));
  });

});
