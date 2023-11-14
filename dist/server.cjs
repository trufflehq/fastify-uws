"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
















var _chunkNGE5WKMJcjs = require('./chunk-NGE5WKMJ.cjs');

// src/server.js
var _events = require('events'); var _events2 = _interopRequireDefault(_events);
var _fs = require('fs');
var _assert = require('assert'); var _assert2 = _interopRequireDefault(_assert);
var _uWebSocketsjs = require('uWebSockets.js'); var _uWebSocketsjs2 = _interopRequireDefault(_uWebSocketsjs);
var _ipaddrjs = require('ipaddr.js'); var _ipaddrjs2 = _interopRequireDefault(_ipaddrjs);
var _tempy = require('tempy'); var _tempy2 = _interopRequireDefault(_tempy);





















function createApp(https) {
  if (!https)
    return _uWebSocketsjs2.default.App();
  if (!https.key)
    return _uWebSocketsjs2.default.SSLApp(https);
  const keyFile = _tempy2.default.file();
  _fs.writeFileSync.call(void 0, keyFile, https.key);
  const certFile = _tempy2.default.file();
  _fs.writeFileSync.call(void 0, certFile, https.cert);
  return _uWebSocketsjs2.default.SSLApp({
    key_file_name: keyFile,
    cert_file_name: certFile,
    passphrase: https.passphrase
  });
}
var mainServer = {};
var Server = class extends _events2.default {
  /**
   * @param {(req: Request, res: Response) => void} handler
   * @param {ServerOptions} opts
   */
  constructor(handler, opts = {}) {
    super();
    const { connectionTimeout = 0, https = false } = opts;
    _assert2.default.call(void 0, !https || typeof https === "object", "https must be a valid object { key: string, cert: string } or follow the uws.AppOptions");
    this[_chunkNGE5WKMJcjs.kHandler] = handler;
    this.timeout = connectionTimeout;
    this[_chunkNGE5WKMJcjs.kHttps] = https;
    this[_chunkNGE5WKMJcjs.kWs] = null;
    this[_chunkNGE5WKMJcjs.kAddress] = null;
    this[_chunkNGE5WKMJcjs.kListenSocket] = null;
    this[_chunkNGE5WKMJcjs.kApp] = createApp(this[_chunkNGE5WKMJcjs.kHttps]);
    this[_chunkNGE5WKMJcjs.kClosed] = false;
  }
  /** @type {boolean} */
  get encrypted() {
    return !!this[_chunkNGE5WKMJcjs.kHttps];
  }
  /**
   * @param {number} timeout
   */
  setTimeout(timeout) {
    this.timeout = timeout;
  }
  /**
   * @returns {{ address: string, port: number }}
   */
  address() {
    return this[_chunkNGE5WKMJcjs.kAddress];
  }
  /**
   *
   * @param {{ host: string, port: number }} listenOptions
   * @param {() => void} cb
   */
  listen(listenOptions, cb) {
    this[_chunkNGE5WKMJcjs.kListen](listenOptions).then(() => cb && cb()).catch((err) => {
      this[_chunkNGE5WKMJcjs.kAddress] = null;
      process.nextTick(() => this.emit("error", err));
    });
  }
  /**
   * @param {() => void} [cb]
   */
  close(cb = () => {
  }) {
    if (this[_chunkNGE5WKMJcjs.kClosed])
      return cb();
    const port = _optionalChain([this, 'access', _ => _[_chunkNGE5WKMJcjs.kAddress], 'optionalAccess', _2 => _2.port]);
    if (port !== void 0 && mainServer[port] === this) {
      delete mainServer[port];
    }
    this[_chunkNGE5WKMJcjs.kAddress] = null;
    this[_chunkNGE5WKMJcjs.kClosed] = true;
    if (this[_chunkNGE5WKMJcjs.kListenSocket]) {
      _uWebSocketsjs2.default.us_listen_socket_close(this[_chunkNGE5WKMJcjs.kListenSocket]);
      this[_chunkNGE5WKMJcjs.kListenSocket] = null;
    }
    if (this[_chunkNGE5WKMJcjs.kWs]) {
      this[_chunkNGE5WKMJcjs.kWs].connections.forEach((conn) => conn.close());
    }
    setTimeout(() => {
      this.emit("close");
      cb();
    }, 1);
  }
  ref() {
  }
  unref() {
  }
  async [_chunkNGE5WKMJcjs.kListen]({ port, host }) {
    if (port !== void 0 && port !== null && Number.isNaN(Number(port))) {
      throw new (0, _chunkNGE5WKMJcjs.ERR_SOCKET_BAD_PORT)(port);
    }
    port = port === void 0 || port === null ? 0 : Number(port);
    this[_chunkNGE5WKMJcjs.kAddress] = {
      address: host === "localhost" ? "::1" : host,
      port
    };
    if (this[_chunkNGE5WKMJcjs.kAddress].address.startsWith("["))
      throw new (0, _chunkNGE5WKMJcjs.ERR_ENOTFOUND)(this[_chunkNGE5WKMJcjs.kAddress].address);
    const parsedAddress = _ipaddrjs2.default.parse(this[_chunkNGE5WKMJcjs.kAddress].address);
    this[_chunkNGE5WKMJcjs.kAddress].family = parsedAddress.kind() === "ipv6" ? "IPv6" : "IPv4";
    const longAddress = parsedAddress.toNormalizedString();
    const app = this[_chunkNGE5WKMJcjs.kApp];
    const onRequest = (method) => (res, req) => {
      const socket = new (0, _chunkNGE5WKMJcjs.HTTPSocket)(this, res, method === "GET" || method === "HEAD");
      const request = new (0, _chunkNGE5WKMJcjs.Request)(req, socket, method);
      const response = new (0, _chunkNGE5WKMJcjs.Response)(socket);
      if (request.headers.upgrade) {
        this.emit("upgrade", request, socket);
      }
      this[_chunkNGE5WKMJcjs.kHandler](request, response);
    };
    app.connect("/*", onRequest("CONNECT")).del("/*", onRequest("DELETE")).get("/*", onRequest("GET")).head("/*", onRequest("HEAD")).options("/*", onRequest("OPTIONS")).patch("/*", onRequest("PATCH")).post("/*", onRequest("POST")).put("/*", onRequest("PUT")).trace("/*", onRequest("TRACE"));
    if (port !== 0 && mainServer[port]) {
      this[_chunkNGE5WKMJcjs.kWs] = mainServer[port][_chunkNGE5WKMJcjs.kWs];
    }
    if (this[_chunkNGE5WKMJcjs.kWs]) {
      this[_chunkNGE5WKMJcjs.kWs].addServer(this);
    }
    return new Promise((resolve, reject) => {
      app.listen(longAddress, port, (listenSocket) => {
        if (!listenSocket)
          return reject(new (0, _chunkNGE5WKMJcjs.ERR_ADDRINUSE)(this[_chunkNGE5WKMJcjs.kAddress].address, port));
        this[_chunkNGE5WKMJcjs.kListenSocket] = listenSocket;
        port = this[_chunkNGE5WKMJcjs.kAddress].port = _uWebSocketsjs2.default.us_socket_local_port(listenSocket);
        if (!mainServer[port]) {
          mainServer[port] = this;
        }
        resolve();
      });
    });
  }
};
var serverFactory = (handler, opts) => {
  return new Server(handler, opts);
};
var getUws = (fastify) => {
  const { server } = fastify;
  if (!server[_chunkNGE5WKMJcjs.kApp])
    throw new (0, _chunkNGE5WKMJcjs.ERR_UWS_APP_NOT_FOUND)();
  return server[_chunkNGE5WKMJcjs.kApp];
};
























exports.DEDICATED_COMPRESSOR_128KB = _uWebSocketsjs.DEDICATED_COMPRESSOR_128KB; exports.DEDICATED_COMPRESSOR_16KB = _uWebSocketsjs.DEDICATED_COMPRESSOR_16KB; exports.DEDICATED_COMPRESSOR_256KB = _uWebSocketsjs.DEDICATED_COMPRESSOR_256KB; exports.DEDICATED_COMPRESSOR_32KB = _uWebSocketsjs.DEDICATED_COMPRESSOR_32KB; exports.DEDICATED_COMPRESSOR_3KB = _uWebSocketsjs.DEDICATED_COMPRESSOR_3KB; exports.DEDICATED_COMPRESSOR_4KB = _uWebSocketsjs.DEDICATED_COMPRESSOR_4KB; exports.DEDICATED_COMPRESSOR_64KB = _uWebSocketsjs.DEDICATED_COMPRESSOR_64KB; exports.DEDICATED_COMPRESSOR_8KB = _uWebSocketsjs.DEDICATED_COMPRESSOR_8KB; exports.DEDICATED_DECOMPRESSOR = _uWebSocketsjs.DEDICATED_DECOMPRESSOR; exports.DEDICATED_DECOMPRESSOR_16KB = _uWebSocketsjs.DEDICATED_DECOMPRESSOR_16KB; exports.DEDICATED_DECOMPRESSOR_1KB = _uWebSocketsjs.DEDICATED_DECOMPRESSOR_1KB; exports.DEDICATED_DECOMPRESSOR_2KB = _uWebSocketsjs.DEDICATED_DECOMPRESSOR_2KB; exports.DEDICATED_DECOMPRESSOR_32KB = _uWebSocketsjs.DEDICATED_DECOMPRESSOR_32KB; exports.DEDICATED_DECOMPRESSOR_4KB = _uWebSocketsjs.DEDICATED_DECOMPRESSOR_4KB; exports.DEDICATED_DECOMPRESSOR_512B = _uWebSocketsjs.DEDICATED_DECOMPRESSOR_512B; exports.DEDICATED_DECOMPRESSOR_8KB = _uWebSocketsjs.DEDICATED_DECOMPRESSOR_8KB; exports.DISABLED = _uWebSocketsjs.DISABLED; exports.SHARED_COMPRESSOR = _uWebSocketsjs.SHARED_COMPRESSOR; exports.SHARED_DECOMPRESSOR = _uWebSocketsjs.SHARED_DECOMPRESSOR; exports.Server = Server; exports.WebSocketStream = _chunkNGE5WKMJcjs.WebSocketStream; exports.getUws = getUws; exports.serverFactory = serverFactory;
