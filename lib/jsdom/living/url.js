"use strict";
const URL = require("whatwg-url").URL;

module.exports = function (core) {
  core.URL = URL;
};
