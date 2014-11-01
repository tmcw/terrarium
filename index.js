var instrument = require('./instrument');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var U = typeof URL !== 'undefined' ? URL : webkitURL;

function Terrarium() {
  EventEmitter.call(this);
  this.name = 'frame-' + Date.now().toString(16);
  this.iframe = document.body.appendChild(document.createElement('iframe'));
  this.iframe.setAttribute('name', this.name);
  this.iframe.style.display = 'none';
  this.context = window[this.name];
}

util.inherits(Terrarium, EventEmitter);

Terrarium.prototype.run = function(source) {
  var instrumented = instrument(source),
    html = '<!DOCTYPE html><html><head></head><body><script>' +
      instrumented.result + '</script></body></html>',
    blob = new Blob([html], { encoding: 'UTF-8', type: 'text/html' }),
    targetUrl = U.createObjectURL(blob);

  this.iframe.addEventListener('load', function() {
    this.iframe.contentWindow.run();
  }.bind(this));

  this.setInstrument(this.name, instrumented);
  this.iframe.src = targetUrl;
};

Terrarium.prototype.setInstrument = function(thisTick, instrumented) {
  var DATA = {};
  var start = Date.now();
  var TODO = instrumented.TODO;

  window.INSTRUMENT = function(name, number, val) {
    if (DATA[name + ':' + number] === undefined) {
      DATA[name + ':' + number] = [];
    }
    DATA[name + ':' + number].unshift({
      name: name,
      line: number,
      val: val,
      when: Date.now() - start
    });
    TODO[name + ':' + number] = true;
    for (var k in TODO) {
      if (!TODO[k]) return;
    }
    _UPDATE(thisTick);
  };

  window._UPDATE = function(tick) {
    if (tick !== thisTick) return;
    this.emit('data', DATA);
  }.bind(this);
};

module.exports = Terrarium;
