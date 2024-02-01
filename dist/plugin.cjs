"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }




var _chunkK5PLFBKWcjs = require('./chunk-K5PLFBKW.cjs');

// src/plugin.js
var _fastifyplugin = require('fastify-plugin'); var _fastifyplugin2 = _interopRequireDefault(_fastifyplugin);
function defaultErrorHandler(err, conn, request) {
  request.log.error(err);
  request.raw.destroy(err);
}
function fastifyUws(fastify, opts, next) {
  const { server } = fastify;
  const { errorHandler = defaultErrorHandler, ...options } = opts || {};
  if (errorHandler && typeof errorHandler !== "function") {
    return next(new Error("invalid errorHandler function"));
  }
  const websocketServer = server[_chunkK5PLFBKWcjs.kWs] = new (0, _chunkK5PLFBKWcjs.WebSocketServer)(options);
  fastify.decorate("websocketServer", websocketServer);
  fastify.addHook("onRoute", (routeOptions) => {
    const isWebSocket = !!routeOptions.uws || routeOptions.uwsHandler;
    if (!isWebSocket || routeOptions.method !== "GET")
      return;
    const wsOptions = typeof routeOptions.uws === "object" ? routeOptions.uws : {};
    let httpHandler, uwsHandler;
    if (routeOptions.uwsHandler) {
      httpHandler = routeOptions.handler;
      uwsHandler = routeOptions.uwsHandler;
    } else {
      uwsHandler = routeOptions.handler;
    }
    const namespace = Buffer.from(routeOptions.url);
    const topics = {};
    if (wsOptions.topics) {
      wsOptions.topics.forEach((topic) => {
        topics[topic] = _chunkK5PLFBKWcjs.WebSocket.allocTopic(namespace, topic);
      });
    }
    routeOptions.handler = function(request, reply) {
      const requestRaw = (
        /** @type {Request} */
        /** @type {unknown} */
        request.raw
      );
      if (requestRaw[_chunkK5PLFBKWcjs.kWs]) {
        reply.hijack();
        const uRes = requestRaw.socket[_chunkK5PLFBKWcjs.kRes];
        requestRaw.socket[_chunkK5PLFBKWcjs.kWs] = true;
        if (requestRaw.socket.aborted || requestRaw.socket.destroyed)
          return;
        uRes.upgrade(
          {
            req: requestRaw,
            handler: (ws) => {
              request.uws = true;
              const conn = new (0, _chunkK5PLFBKWcjs.WebSocket)(namespace, ws, topics);
              let result;
              try {
                request.log.info("fastify-uws: websocket connection opened");
                conn.once("close", () => {
                  request.log.info("fastify-uws: websocket connection closed");
                });
                requestRaw.once("error", () => {
                  conn.close();
                });
                requestRaw.once("close", () => {
                  conn.end();
                });
                result = uwsHandler.call(this, conn, request);
              } catch (err) {
                return errorHandler.call(this, err, conn, request);
              }
              if (result && typeof result.catch === "function") {
                result.catch((err) => errorHandler.call(this, err, conn, request));
              }
            }
          },
          requestRaw.headers["sec-websocket-key"],
          requestRaw.headers["sec-websocket-protocol"],
          requestRaw.headers["sec-websocket-extensions"],
          requestRaw[_chunkK5PLFBKWcjs.kWs]
        );
      } else {
        return httpHandler.call(this, request, reply);
      }
    };
  });
  next();
}
var plugin_default = _fastifyplugin2.default.call(void 0, fastifyUws, {
  fastify: ">= 4.0.0",
  name: "fastify-uws"
});


exports.default = plugin_default;
