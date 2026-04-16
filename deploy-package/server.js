"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/server.ts
var import_http = require("http");
var import_url = require("url");
var import_next = __toESM(require("next"));
var dev = process.env.COZE_PROJECT_ENV !== "PROD";
var hostname = process.env.HOSTNAME || "localhost";
var port = parseInt(process.env.PORT || "5000", 10);
var MAX_BODY_SIZE = 500 * 1024 * 1024;
var app = (0, import_next.default)({ dev, hostname, port });
var handle = app.getRequestHandler();
app.prepare().then(() => {
  const server = (0, import_http.createServer)(async (req, res) => {
    try {
      console.log(`${req.method} ${req.url}`);
      const parsedUrl = (0, import_url.parse)(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error:", req.url, err);
      res.writeHead(500);
      res.end("Internal server error");
    }
  });
  server.maxHeadersSize = 16 * 1024 * 1024;
  server.timeout = 600 * 1e3;
  server.listen(port, () => {
    console.log(`> Server at http://${hostname}:${port} as ${dev ? "development" : "production"}`);
    console.log(`> Max upload: ${MAX_BODY_SIZE / 1024 / 1024}MB`);
  });
});
