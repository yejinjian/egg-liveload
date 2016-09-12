'use strict';

function getScript (host, port) {
  var snippet = [
    "<!-- livereload snippet -->",
    "<script>document.write('<script src=\"http://'",
    " + (location.host || 'localhost').split(':')[0]",
    " + ':" + port + "/livereload.js?snipver=1\"><\\/script>')",
    "</script>",
    ""
  ].join('\n');
  return snippet;
}

// 加载liveload js
module.exports = options => {
  return function* liveload(next) {
    yield next;
    if (this.response.type && this.response.type.indexOf('html') < 0) return;

    var body = this.body;
    var len = this.response.length;
    //replace body
    if (Buffer.isBuffer(this.body)) {
      body = this.body.toString();
    }
    const snippet = getScript(this.hostname, options.port);
    if (typeof body === 'string') {
      this.body = body.replace(/<\/body>/, function (w) {
        if (len) { this.set('Content-Length', len + Buffer.byteLength(snippet)); }
        return snippet + w;
      }.bind(this));
    } else if (body instanceof Stream) {
      var stream = this.body = new PassThrough();
      body.setEncoding('utf8');
      if (len) { this.set('Content-Length', len + Buffer.byteLength(snippet)); }
      body.on('data', function (chunk) {
        chunk = chunk.replace(/<\/body>/, function (w) {
          return snippet + w;
        });
        stream.write(chunk);
      });
      body.on('end', function () {
        stream.end();
      })
      body.on('error', this.onerror);
    }
  };
};
