"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/errors.js
var _nanoerror = require('nanoerror'); var _nanoerror2 = _interopRequireDefault(_nanoerror);
var ERR_HEAD_SET = _nanoerror2.default.call(void 0, "ERR_HEAD_SET", "Cannot set headers after they are sent to the client");
var ERR_ADDRINUSE = _nanoerror2.default.call(void 0, "EADDRINUSE", "listen EADDRINUSE: address already in use %s:%s");
var ERR_UPGRADE = _nanoerror2.default.call(void 0, "ERR_UPGRADE", "Cannot upgrade to WebSocket protocol %o");
var ERR_STREAM_DESTROYED = _nanoerror2.default.call(void 0, "ERR_STREAM_DESTROYED", "Stream destroyed");
var ERR_UWS_APP_NOT_FOUND = _nanoerror2.default.call(void 0, "ERR_UWS_APP_NOT_FOUND", "uWebSockets app not found");
var ERR_ENOTFOUND = _nanoerror2.default.call(void 0, "ERR_ENOTFOUND", "getaddrinfo ENOTFOUND %s");
var ERR_SOCKET_BAD_PORT = _nanoerror2.default.call(void 0, "ERR_SOCKET_BAD_PORT", "RangeError [ERR_SOCKET_BAD_PORT]: options.port should be >= 0 and < 65536. Received (%s)");

// src/symbols.js
var kHttps = Symbol("uws.https");
var kReq = Symbol("uws.req");
var kRes = Symbol("uws.res");
var kServer = Symbol("uws.server");
var kHeaders = Symbol("uws.headers");
var kUrl = Symbol("uws.url");
var kAddress = Symbol("uws.address");
var kRemoteAdress = Symbol("uws.remoteAddress");
var kEncoding = Symbol("uws.encoding");
var kTimeoutRef = Symbol("uws.timeoutRef");
var kEnded = Symbol("uws.ended");
var kReadyState = Symbol("uws.readyState");
var kWriteOnly = Symbol("uws.writeOnly");
var kHandler = Symbol("uws.handler");
var kListenSocket = Symbol("uws.listenSocket");
var kListen = Symbol("uws.listen");
var kApp = Symbol("uws.app");
var kClosed = Symbol("uws.closed");
var kWs = Symbol("uws.ws");
var kTopic = Symbol("uws.topic");
var kDestroyError = Symbol("uws.destroyError");
var kUwsRemoteAddress = Symbol("uws.uwsRemoteAddress");
var kQueue = Symbol("uws.queue");
var kHead = Symbol("uws.head");
var kWebSocketOptions = Symbol("uws.webSocketOptions");

// src/http-socket.js
var _events = require('events'); var _events2 = _interopRequireDefault(_events);
var _fastq = require('fastq'); var _fastq2 = _interopRequireDefault(_fastq);
var localAddressIpv6 = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
var toHex = (buf, start, end2) => buf.slice(start, end2).toString("hex");
var noop = () => {
};
function onAbort() {
  this.aborted = true;
  this.emit("aborted");
  this.errored && this.emit("error", this.errored);
  this.emit("close");
}
function onDrain() {
  this.emit("drain");
  return true;
}
function onTimeout() {
  if (!this.destroyed) {
    this.emit("timeout");
    this.abort();
  }
}
function onWrite(data, cb) {
  const res = this[kRes];
  this[kReadyState].write = true;
  if (this[kHead]) {
    writeHead(res, this[kHead]);
    this[kHead] = null;
  }
  const drained = res.write(getChunk(data));
  if (drained) {
    this.bytesWritten += byteLength(data);
    return cb();
  }
  drain(this, res, data, cb);
}
function cork(res, data) {
  writeHead(res, this[kHead]);
  this[kHead] = null;
  res.end(data);
}
function end(socket, data) {
  socket._clearTimeout();
  const res = socket[kRes];
  if (socket[kHead]) {
    res.cork(cork.bind(socket, res, getChunk(data)));
  } else {
    res.end(getChunk(data));
  }
  socket.bytesWritten += byteLength(data);
  socket.emit("close");
  socket.emit("finish");
}
function drain(socket, res, data, cb) {
  socket.writableNeedDrain = true;
  let done = false;
  const onClose = () => {
    socket.removeListener("drain", onDrain2);
    if (done)
      return;
    done = true;
    cb();
  };
  const onDrain2 = () => {
    if (done)
      return;
    done = res.write(getChunk(data));
    if (done) {
      socket.writableNeedDrain = false;
      this.bytesWritten += byteLength(data);
      socket.removeListener("close", onClose);
      socket.removeListener("drain", onDrain2);
      cb();
    }
  };
  socket.on("drain", onDrain2);
  socket.once("close", onClose);
}
function writeHead(res, head) {
  if (head.status)
    res.writeStatus(head.status);
  if (head.headers) {
    for (const header of head.headers.values()) {
      res.writeHeader(header.name, header.value);
    }
  }
}
function byteLength(data) {
  if (data.byteLength !== void 0)
    return data.byteLength;
  return Buffer.byteLength(data);
}
function getChunk(data) {
  if (data.chunk)
    return data.chunk;
  return data;
}
var HTTPSocket = class extends _events2.default {
  constructor(server, res, writeOnly) {
    super();
    this.aborted = false;
    this.writableNeedDrain = false;
    this.bytesRead = 0;
    this.bytesWritten = 0;
    this.writableEnded = false;
    this.errored = null;
    this[kServer] = server;
    this[kRes] = res;
    this[kWriteOnly] = writeOnly;
    this[kReadyState] = {
      read: false,
      write: false
    };
    this[kEncoding] = null;
    this[kRemoteAdress] = null;
    this[kUwsRemoteAddress] = null;
    this[kHead] = null;
    this.once("error", noop);
    res.onAborted(onAbort.bind(this));
    res.onWritable(onDrain.bind(this));
    if (server.timeout) {
      this[kTimeoutRef] = setTimeout(onTimeout.bind(this), server.timeout);
    }
  }
  get readyState() {
    const state = this[kReadyState];
    if (state.read && !state.write)
      return "readOnly";
    if (!state.read && state.write)
      return "writeOnly";
    if (state.read)
      return "open";
    return "opening";
  }
  get writable() {
    return true;
  }
  get readable() {
    return true;
  }
  get encrypted() {
    return !!this[kServer][kHttps];
  }
  get remoteAddress() {
    let remoteAddress = this[kRemoteAdress];
    if (remoteAddress)
      return remoteAddress;
    let buf = this[kUwsRemoteAddress];
    if (!buf) {
      buf = this[kUwsRemoteAddress] = Buffer.from(this[kRes].getRemoteAddress());
    }
    if (buf.length === 4) {
      remoteAddress = `${buf.readUInt8(0)}.${buf.readUInt8(1)}.${buf.readUInt8(2)}.${buf.readUInt8(3)}`;
    } else {
      if (buf.equals(localAddressIpv6)) {
        remoteAddress = "::1";
      } else {
        remoteAddress = `${toHex(buf, 0, 2)}:${toHex(buf, 2, 4)}:${toHex(buf, 4, 6)}:${toHex(buf, 6, 8)}:${toHex(buf, 8, 10)}:${toHex(buf, 10, 12)}:${toHex(buf, 12, 14)}:${toHex(buf, 14)}`;
      }
    }
    this[kRemoteAdress] = remoteAddress;
    return remoteAddress;
  }
  get remoteFamily() {
    if (!this[kUwsRemoteAddress]) {
      this[kUwsRemoteAddress] = Buffer.from(this[kRes].getRemoteAddress());
    }
    return this[kUwsRemoteAddress].length === 4 ? "IPv4" : "IPv6";
  }
  get destroyed() {
    return this.writableEnded || this.aborted;
  }
  address() {
    return { ...this[kServer][kAddress] };
  }
  abort() {
    if (this.aborted)
      return;
    this.aborted = true;
    this[kQueue] && this[kQueue].kill();
    if (!this[kWs] && !this.writableEnded) {
      this[kRes].close();
    }
  }
  setEncoding(encoding) {
    this[kEncoding] = encoding;
  }
  destroy(err) {
    if (this.aborted)
      return;
    this._clearTimeout();
    this.errored = err;
    this.abort();
  }
  onRead(cb) {
    if (this[kWriteOnly] || this.aborted)
      return cb(null, null);
    let done = false;
    this[kReadyState].read = true;
    const encoding = this[kEncoding];
    try {
      this[kRes].onData((data, isLast) => {
        if (done)
          return;
        let chunk = Buffer.alloc(data.byteLength);
        Buffer.from(data).copy(chunk);
        this.bytesRead += Buffer.byteLength(chunk);
        if (encoding) {
          chunk = chunk.toString(encoding);
        }
        this.emit("data", chunk);
        cb(null, chunk);
        if (isLast) {
          done = true;
          cb(null, null);
        }
      });
    } catch (err) {
      done = true;
      this.destroy(err);
      cb(err);
    }
  }
  end(data, _, cb = noop) {
    if (this.aborted)
      throw new ERR_STREAM_DESTROYED();
    if (!data)
      return this.abort();
    this.writableEnded = true;
    const queue = this[kQueue];
    if (!queue || queue.idle()) {
      end(this, data);
      cb();
      return;
    }
    queue.push(data, cb);
  }
  write(data, _, cb = noop) {
    if (this.destroyed)
      throw new ERR_STREAM_DESTROYED();
    if (!this[kQueue]) {
      this[kQueue] = _fastq2.default.call(void 0, this, onWrite, 1);
    }
    this[kQueue].push(data, cb);
    return !this.writableNeedDrain;
  }
  _clearTimeout() {
    this[kTimeoutRef] && clearTimeout(this[kTimeoutRef]);
  }
};

// src/request.js
var _streamx = require('streamx');
var noop2 = () => {
};
function onAbort2() {
  this.emit("aborted");
}
var Request = class extends _streamx.Readable {
  constructor(req, socket, method) {
    super();
    this.socket = socket;
    this.method = method;
    this.httpVersion = "1.1";
    this.readableEnded = false;
    this[kReq] = req;
    this[kUrl] = null;
    this[kHeaders] = null;
    this.once("error", noop2);
    const destroy = super.destroy.bind(this);
    socket.once("error", destroy);
    socket.once("close", destroy);
    socket.once("aborted", onAbort2.bind(this));
  }
  get aborted() {
    return this.socket.aborted;
  }
  get url() {
    let url = this[kUrl];
    if (url)
      return url;
    const query = this[kReq].getQuery();
    url = this[kUrl] = this[kReq].getUrl() + (query && query.length > 0 ? `?${query}` : "");
    return url;
  }
  set url(url) {
    this[kUrl] = url;
  }
  get headers() {
    let headers = this[kHeaders];
    if (headers)
      return headers;
    headers = this[kHeaders] = {};
    this[kReq].forEach((k, v) => {
      headers[k] = v;
    });
    return headers;
  }
  setEncoding(encoding) {
    this.socket.setEncoding(encoding);
  }
  setTimeout(timeout) {
    this.socket.setTimeout(timeout);
  }
  destroy(err) {
    if (this.destroyed || this.destroying)
      return;
    this.socket.destroy(err);
  }
  _read(cb) {
    if (this.destroyed || this.destroying || this.socket.destroyed)
      return cb();
    this.socket.onRead((err, data) => {
      if (err)
        return cb(err);
      if (this.destroyed || this.destroying)
        return cb();
      this.push(data);
      if (!data) {
        this.readableEnded = true;
      }
      cb();
    });
  }
};

// src/response.js
var _http = require('http');

var Header = class {
  constructor(name, value) {
    this.name = name;
    this.value = String(value);
  }
};
var EMPTY = Buffer.alloc(0);
var HTTPResponse = class {
  constructor(chunk, end2 = false) {
    this.chunk = chunk || EMPTY;
    this.empty = !chunk;
    this.end = end2;
    this.byteLength = this.empty ? 1 : Buffer.byteLength(this.chunk);
  }
};
function onAbort3() {
  this.emit("aborted");
}
var noop3 = () => {
};
var options = {
  byteLength(data) {
    return data.byteLength;
  }
};
var Response = class extends _streamx.Writable {
  constructor(socket) {
    super(options);
    this.socket = socket;
    this.statusCode = 200;
    this.headersSent = false;
    this.chunked = false;
    this.contentLength = null;
    this.writableEnded = false;
    this.firstChunk = true;
    this[kHeaders] = /* @__PURE__ */ new Map();
    const destroy = this.destroy.bind(this);
    this.once("error", noop3);
    socket.once("error", destroy);
    socket.once("close", destroy);
    socket.once("aborted", onAbort3.bind(this));
  }
  get aborted() {
    return this.socket.aborted;
  }
  get finished() {
    return this.socket.writableEnded && !this.socket.aborted;
  }
  get statusCodeWithMessage() {
    return `${this.statusCode} ${this.statusMessage || _http.STATUS_CODES[this.statusCode]}`;
  }
  get bytesWritten() {
    return this.socket.bytesWritten;
  }
  hasHeader(name) {
    return this[kHeaders].has(name.toLowerCase());
  }
  getHeader(name) {
    return _optionalChain([this, 'access', _2 => _2[kHeaders], 'access', _3 => _3.get, 'call', _4 => _4(name.toLowerCase()), 'optionalAccess', _5 => _5.value]);
  }
  getHeaders() {
    const headers = {};
    this[kHeaders].forEach((header, key) => {
      headers[key] = header.value;
    });
    return headers;
  }
  setHeader(name, value) {
    if (this.headersSent)
      throw new ERR_HEAD_SET();
    const key = name.toLowerCase();
    if (key === "content-length") {
      this.contentLength = Number(value);
      return;
    }
    if (key === "transfer-encoding") {
      this.chunked = value.includes("chunked");
      return;
    }
    this[kHeaders].set(key, new Header(name, value));
  }
  removeHeader(name) {
    if (this.headersSent)
      throw new ERR_HEAD_SET();
    this[kHeaders].delete(name.toLowerCase());
  }
  writeHead(statusCode, statusMessage, headers) {
    if (this.headersSent)
      throw new ERR_HEAD_SET();
    this.statusCode = statusCode;
    if (typeof statusMessage === "object") {
      headers = statusMessage;
    } else if (statusMessage) {
      this.statusMessage = statusMessage;
    }
    if (headers) {
      Object.keys(headers).forEach((key) => {
        this.setHeader(key, headers[key]);
      });
    }
  }
  end(data) {
    if (this.aborted)
      return;
    if (this.destroyed)
      throw new ERR_STREAM_DESTROYED();
    this.writableEnded = true;
    return super.end(new HTTPResponse(data, true));
  }
  destroy(err) {
    if (this.destroyed || this.destroying || this.aborted)
      return;
    this.socket.destroy(err);
  }
  // nestjs requires .status and .send to exist.
  // i'm not sure if this is supposed to match fastify's reply api
  // (ie if the problem is here, or in nest's code, or somewhere else)
  // but this gets things to work for now (https://fastify.dev/docs/latest/Reference/Reply/#senddata)
  // https://github.com/nestjs/nest/blob/d0850d2062373b3c15a4c8e2cf0fe6e546d7593e/packages/platform-fastify/adapters/fastify-adapter.ts#L361
  // fastify.Reply doesn't even have status (uses code) so i'm not sure what's going on there
  status(code) {
    this.statusCode = code;
    return this;
  }
  // see comment above status()
  send(data) {
    if (typeof data !== "string") {
      data = JSON.stringify(data);
    }
    this.setHeader("Content-Length", Buffer.byteLength(data));
    this.end(data);
  }
  write(data) {
    if (this.aborted)
      return;
    if (this.destroyed)
      throw new ERR_STREAM_DESTROYED();
    data = new HTTPResponse(data);
    if (this.firstChunk && this.contentLength !== null && this.contentLength === data.byteLength) {
      data.end = true;
      this.writableEnded = true;
      super.end(data);
      return true;
    }
    this.firstChunk = false;
    return super.write(data);
  }
  _write(data, cb) {
    if (this.aborted)
      return cb();
    if (!this.headersSent) {
      this.headersSent = true;
      this.socket[kHead] = {
        headers: this[kHeaders],
        status: this.statusCodeWithMessage
      };
    }
    if (data.end) {
      this.socket.end(data, null, cb);
      return;
    }
    this.socket.write(data, null, cb);
  }
  _destroy(cb) {
    if (this.socket.destroyed)
      return cb();
    this.socket.once("close", cb);
  }
};

// src/websocket-server.js

var _uWebSocketsjs = require('uWebSockets.js'); var _uWebSocketsjs2 = _interopRequireDefault(_uWebSocketsjs);

var defaultWebSocketConfig = {
  compression: _uWebSocketsjs2.default.SHARED_COMPRESSOR,
  maxPayloadLength: 16 * 1024 * 1024,
  idleTimeout: 16
};
var SEP = "!";
var SEP_BUFFER = Buffer.from(SEP);
var WebSocket = class _WebSocket extends _events2.default {
  /**
   * @param {Buffer} namespace
   * @param {Buffer | string} topic
   * @returns {Buffer}
   */
  static allocTopic(namespace, topic) {
    if (topic[kTopic])
      return (
        /** @type {Buffer} */
        topic
      );
    const buf = Buffer.concat([
      namespace,
      SEP_BUFFER,
      Buffer.isBuffer(topic) ? topic : Buffer.from(topic)
    ]);
    buf[kTopic] = true;
    return buf;
  }
  constructor(namespace, connection, topics = {}) {
    super();
    this.namespace = namespace;
    this.connection = connection;
    connection.websocket = this;
    this.topics = topics;
    this[kEnded] = false;
  }
  get uws() {
    return true;
  }
  /**
   * @param {Buffer | string} topic
   * @returns {Buffer}
   */
  allocTopic(topic) {
    if (this.topics[topic])
      return this.topics[topic];
    return _WebSocket.allocTopic(this.namespace, topic);
  }
  /**
   * @param {RecognizedString} message
   * @param {boolean} [isBinary]
   * @param {boolean} [compress]
   */
  send(message, isBinary, compress) {
    if (this[kEnded])
      return;
    return this.connection.send(message, isBinary, compress);
  }
  /**
   * @param {Buffer | string} topic
   * @param {RecognizedString} message
   * @param {boolean} [isBinary]
   * @param {boolean} [compress]
   */
  publish(topic, message, isBinary, compress) {
    if (this[kEnded])
      return;
    return this.connection.publish(this.allocTopic(topic), message, isBinary, compress);
  }
  /**
   * @param {Buffer | string} topic
   */
  subscribe(topic) {
    if (this[kEnded])
      return;
    return this.connection.subscribe(this.allocTopic(topic));
  }
  /**
   * @param {Buffer | string} topic
   */
  unsubscribe(topic) {
    if (this[kEnded])
      return;
    return this.connection.unsubscribe(this.allocTopic(topic));
  }
  /**
   * @param {Buffer | string} topic
   */
  isSubscribed(topic) {
    if (this[kEnded])
      return false;
    return this.connection.isSubscribed(this.allocTopic(topic));
  }
  getTopics() {
    if (this[kEnded])
      return [];
    return this.connection.getTopics().map((topic) => topic.slice(topic.indexOf(SEP) + 1));
  }
  close() {
    if (this[kEnded])
      return;
    this[kEnded] = true;
    return this.connection.close();
  }
  /**
   * @param {number} [code]
   * @param {RecognizedString} [shortMessage]
   */
  end(code, shortMessage) {
    if (this[kEnded])
      return;
    this[kEnded] = true;
    return this.connection.end(code, shortMessage);
  }
  /**
   * @param {() => void} cb
   */
  cork(cb) {
    if (this[kEnded])
      return;
    return this.connection.cork(cb);
  }
  getBufferedAmount() {
    if (this[kEnded])
      return 0;
    return this.connection.getBufferedAmount();
  }
  /**
   * @param {RecognizedString} message
   */
  ping(message) {
    if (this[kEnded])
      return;
    return this.connection.ping(message);
  }
  /**
   * @template {keyof WebsocketEvent} T
   * @param {T} eventName
   * @param {WebsocketEvent[T]} listener
   */
  on(eventName, listener) {
    return super.on(eventName, listener);
  }
  /**
   * @template {keyof WebsocketEvent} T
   * @param {T} eventName
   * @param {WebsocketEvent[T]} listener
   */
  once(eventName, listener) {
    return super.once(eventName, listener);
  }
};
var WebSocketStream = class extends _streamx.Duplex {
  /**
   *
   * @param {WebSocket} socket
   * @param {{
   *  compress?: boolean | false
   *  highWaterMark?: number | 16384
   *  mapReadable?: (packet: { data: any, isBinary: boolean }) => any // optional function to map input data
   *  byteLengthReadable?: (packet: { data: any, isBinary: boolean }) => number | 1024 // optional function that calculates the byte size of input data,
   *  mapWritable?: (data: any) => { data: any, isBinary: boolean, compress: boolean } // optional function to map input data
   *  byteLengthWritable?: (packet: { data: any, isBinary: boolean, compress: boolean }) => number | 1024 // optional function that calculates the byte size of input data
   * }} opts
   */
  constructor(socket, opts = {}) {
    const { compress = false } = opts;
    super({
      highWaterMark: opts.highWaterMark,
      mapReadable: (packet) => {
        if (opts.mapReadable)
          return opts.mapReadable(packet);
        return packet.data;
      },
      byteLengthReadable: (packet) => {
        if (opts.byteLengthReadable)
          return opts.byteLengthReadable(packet);
        return packet.isBinary ? packet.data.byteLength : 1024;
      },
      mapWritable: (data) => {
        if (opts.mapWritable)
          return opts.mapWritable(data);
        return { data, isBinary: Buffer.isBuffer(data), compress };
      },
      byteLengthWritable: (packet) => {
        if (opts.byteLengthWritable)
          return opts.byteLengthWritable(packet);
        return packet.isBinary ? packet.data.byteLength : 1024;
      }
    });
    this.socket = socket;
    this._onMessage = this._onMessage.bind(this);
  }
  _open(cb) {
    this.socket.on("message", this._onMessage);
    cb();
  }
  _close(cb) {
    this.socket.off("message", this._onMessage);
    this.socket.close();
    cb();
  }
  _onMessage(data, isBinary) {
    this.push({ data, isBinary });
  }
  _write(packet, cb) {
    this.socket.send(packet.data, packet.isBinary, packet.compress);
    cb();
  }
};
var WebSocketServer = class extends _events2.default {
  /**
   * @param {WSOptions} options
   */
  constructor(options2 = {}) {
    super();
    this.options = { ...options2, ...defaultWebSocketConfig };
    this.connections = /* @__PURE__ */ new Set();
  }
  /**
   * @param {import('./server.js').Server} server
   */
  addServer(server) {
    const { options: options2 } = this;
    const app = server[kApp];
    const listenerHandler = server[kHandler];
    app.ws("/*", {
      upgrade: async (res, req, context) => {
        const method = req.getMethod().toUpperCase();
        const socket = new HTTPSocket(server, res, method === "GET" || method === "HEAD");
        const request = new Request(req, socket, method);
        const response = new Response(socket);
        request[kWs] = context;
        server.emit("upgrade", request, socket);
        listenerHandler(request, response);
      },
      /**
       * @param {UWSocket} ws
       */
      open: (ws) => {
        this.connections.add(ws);
        ws.handler(ws);
        this.emit("open", ws);
      },
      /**
       *
       * @param {UWSocket} ws
       * @param {number} code
       * @param {ArrayBuffer} message
       */
      close: (ws, code, message) => {
        this.connections.delete(ws);
        ws.websocket[kEnded] = true;
        ws.req.socket.destroy();
        ws.websocket.emit("close", code, message);
        this.emit("close", ws, code, message);
      },
      /**
       * @param {UWSocket} ws
       */
      drain: (ws) => {
        ws.websocket.emit("drain");
        this.emit("drain", ws);
      },
      /**
       * @param {UWSocket} ws
       * @param {ArrayBuffer} message
       * @param {boolean} isBinary
       */
      message: (ws, message, isBinary) => {
        ws.websocket.emit("message", message, isBinary);
        this.emit("message", ws, message, isBinary);
      },
      /**
       * @param {UWSocket} ws
       * @param {ArrayBuffer} message
       */
      ping: (ws, message) => {
        ws.websocket.emit("ping", message);
        this.emit("ping", ws, message);
      },
      /**
       * @param {UWSocket} ws
       * @param {ArrayBuffer} message
       */
      pong: (ws, message) => {
        ws.websocket.emit("pong", message);
        this.emit("pong", ws, message);
      },
      ...options2
    });
  }
  /**
   * @template {keyof WebsocketServerEvent} T
   * @param {T} eventName
   * @param {WebsocketServerEvent[T]} listener
   */
  on(eventName, listener) {
    return super.on(eventName, listener);
  }
  /**
   * @template {keyof WebsocketServerEvent} T
   * @param {T} eventName
   * @param {WebsocketServerEvent[T]} listener
   */
  once(eventName, listener) {
    return super.once(eventName, listener);
  }
};





















exports.ERR_ADDRINUSE = ERR_ADDRINUSE; exports.ERR_UWS_APP_NOT_FOUND = ERR_UWS_APP_NOT_FOUND; exports.ERR_ENOTFOUND = ERR_ENOTFOUND; exports.ERR_SOCKET_BAD_PORT = ERR_SOCKET_BAD_PORT; exports.kHttps = kHttps; exports.kRes = kRes; exports.kAddress = kAddress; exports.kHandler = kHandler; exports.kListenSocket = kListenSocket; exports.kListen = kListen; exports.kApp = kApp; exports.kClosed = kClosed; exports.kWs = kWs; exports.HTTPSocket = HTTPSocket; exports.Request = Request; exports.Response = Response; exports.WebSocket = WebSocket; exports.WebSocketStream = WebSocketStream; exports.WebSocketServer = WebSocketServer;
