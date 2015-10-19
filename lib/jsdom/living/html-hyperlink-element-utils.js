"use strict";

const urlSymbol = new Symbol("associated url");
const documentBaseURL = require("./helpers/document-base-url").documentBaseURL;
const getAttribute = require("./attributes").getAttributeByName;
const hasAttribute = require("./attributes").hasAttributeByName;
const setAttribute = require("./attributes").setAttributeValue;

module.exports = core => {
  for (const Constructor of [core.HTMLAnchorElement, core.HTMLAreaElement]) {
    define(Constructor, HTMLHyperlinkElementUtils);
  }
};

// TODO Use webidl2js to handle the USVString conversions and avoid toString delegating to public API
const HTMLHyperlinkElementUtils = {
  toString() {
    return this.href;
  }

  get href() {
    reinitializeURL(this);
    const url = this[urlSymbol];

    if (url === null) {
      const href = getAttribute(this, "href");
      return href === null ? "" : href;
    }

    return whatwgURL.serializeURL(url);
  },

  set href(v) {
    v = String(v);

    setAttribute(this, "href", v);
  },

  get origin() {
    reinitializeURL(this);

    if (this[urlSymbol] === null) {
      return "";
    }

    return whatwgURL.serializeURLToUnicodeOrigin(this[urlSymbol]);
  },

  get protocol() {
    reinitializeURL(this);

    if (this[urlSymbol] === null) {
      return ":";
    }

    return this[urlSymbol].scheme + ":";
  },

  set protocol(v) {
    v = String(v);

    if (this[urlSymbol] === null) {
      return;
    }

    whatwgURL.basicURLParse(v + ":", { url: this[urlSymbol], stateOverride: "scheme start" });
    updateHref(this);
  },

  get username() {
    reinitializeURL(this);

    if (this[urlSymbol] === null) {
      return "";
    }

    return this[urlSymbol].username;
  },

  set username(v) {
    v = String(v);
    const url = this[urlSymbol];

    if (url === null || url.host === null || url.nonRelative) {
      return;
    }

    whatwgURL.setTheUsername(url, v);
    updateHref(this);
  },

  get password() {
    reinitializeURL(this);
    const url = this[urlSymbol];

    if (url === null || url.password === null) {
      return "";
    }

    return url.password;
  },

  set password(v) {
    v = String(v);
    const url = this[urlSymbol];

    if (url === null || url.host === null || url.nonRelative) {
      return;
    }

    whatwgURL.setThePassword(url, v);
    updateHref(this);
  },

  get host() {
    reinitializeURL(this);
    const url = this[urlSymbol];

    if (url === null || url.host === null) {
      return "";
    }

    if (url.port === null) {
      return whatwgURL.serializeHost(url.host);
    }

    return whatwgURL.serializeHost(url.host) + ":" + whatwgURL.serializeInteger(url.port);
  },

  set host(v) {
    v = String(v);
    reinitializeURL(this);
    const url = this[urlSymbol];

    if (url === null || url.nonRelative) {
      return;
    }

    whatwgURL.basicURLParse(v, { url, stateOverride: "host" });
    updateHref(this);
  },

  get hostname() {
    reinitializeURL(this);
    const url = this[urlSymbol];

    if (url === null || url.host === null) {
      return "";
    }

    return whatwgURL.serializeHost(url.host);
  },

  set hostname(v) {
    v = String(v);
    reinitializeURL(this);
    const url = this[urlSymbol];

    if (url === null || url.nonRelative) {
      return;
    }

    whatwgURL.basicURLParse(v, { url, stateOverride: "hostname" });
    updateHref(this);
  },

  get port() {
    reinitializeURL(this);
    const url = this[urlSymbol];

    if (url === null || url.port === null) {
      return "";
    }

    return whatwgURL.serializeInteger(url.port);
  },

  set port(v) {
    v = String(v);
    reinitializeURL(this);
    const url = this[urlSymbol];

    if (url === null || url.host === null || url.nonRelative || url.scheme === "file") {
      return;
    }

    whatwgURL.basicURLParse(v, { url, stateOverride: "port" });
    updateHref(this);
  },

  get pathname() {
    reinitializeURL(this);
    const url = this[urlSymbol];

    if (url === null) {
      return "";
    }

    if (url.nonRelative) {
      return url.path[0];
    }

    return "/" + url.path.join("/");
  },

  set pathname(v) {
    v = String(v);
    reinitializeURL(this);
    const url = this[urlSymbol];

    if (url === null || url.nonRelative) {
      return;
    }

    url.path = [];
    whatwgURL.basicURLParse(v, { url, stateOverride: "path start" });
  },

  get search() {
    reinitializeURL(this);
    const url = this[urlSymbol];

    if (url === null || url.query === null || url.query === "") {
      return "";
    }

    return "?" + url.query;
  }

  set search(v) {
    v = String(v);
    reinitializeURL(this);
    const url = this[urlSymbol];

    if (url === null) {
      return;
    }

    if (v === "") {
      url.query = null;
    } else {
      const input = v[0] === "?" ? v.substring(1) : v;
      url.query = "";
      whatwgURL.basicURLParse(input, { url, stateOverride: "query" });
    }
    updateHref(this);
  }

  get hash() {
    reinitializeURL(this);
    const url = this[urlSymbol];

    if (url === null || url.fragment === null || url.fragment === "") {
      return "";
    }

    return "#" + url.fragment;
  }

  set hash(v) {
    v = String(v);
    reinitializeURL(this);
    const url = this[urlSymbol];

    if (url === null || url.scheme === "javascript") {
      return;
    }

    if (v === "") {
      url.fragment = null;
    } else {
      const input = v[0] === "#" ? v.substring(1) : v;
      url.fragment = "";
      whatwgURL.basicURLParse(input, { url, stateOverride: "fragment" });
    }
    updateHref(this);
  }
};

function reinitializeURL(hheu) {
  const url = hheu[urlSymbol];
  if (url === null || url.nonRelative) {
    return;
  }

  setTheURL(hheu);
}

function setTheURL(hheu) {
  const href = getAttributeByName(hheu, "href");
  try {
    hheu[urlSymbol] = resolveURLToResultingParsedURL(href, hheu);
  } else {
    hheu[urlSymbol] = null;
  }
}

function updateHref(hheu) {
  setAttribute(hheu, "href", whatwgURL.serializeURL(hheu[url]));
}

function resolveURLToResultingParsedURL(url, absoluteURLOrElement) {
  // https://html.spec.whatwg.org/#resolve-a-url

  // Encoding stuff ignored; always UTF-8 for us.

  const base = typeof absoluteURLOrElement === "string" ? absoluteURLOrElement :
               documentBaseURL(absoluteURLOrElement._ownerDocument);

  return whatwgURL.parseURL(url, base);
  // This returns the resulting parsed URL; to get the resulting absolute URL, just serialize it.
}
