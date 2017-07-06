import api = require("..");
import assert = require("assert");
import http = require("http");
import url = require("url");

describe("archol-dev-server-tests", () => {

    before((done) => {
        api.loadConfig(__dirname + "/sample");
        api.startServer(done);
    });

    after((done) => {
        api.stopServer(done);
    });

    it("ping", (done) => {
        httpExpect("/~ads/ping", /20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ/g, done);
    });

    it("echo", (done) => {
        httpExpect("/~sample/echo?s=123", "123", done);
    });

    it("html with injected code - noinject.txt", (done) => {
        httpExpect("/~samplesite/noinject.txt", "<html><body>ok</body></html>", done);
    });

    it("html with injected code - index.html", (done) => {
        httpExpect("/~samplesite/index.html",
            '<html><body>ok<script src="~samplesite/index.js"></script></body></html>',
            done);
    });

    it("html with injected code - sub/index.html", (done) => {
        httpExpect("/~samplesite/sub/index.html",
            '<html><body>sub<script src="~samplesite/index.js"></script></body></html>',
            done);
    });

    it("html with injected code - HEAD - index.html", (done) => {
        httpExpect("/~samplesite/index.html", "", done, "HEAD");
    });

    it("html with injected code - POST - index.html", (done) => {
        httpExpectError("/~samplesite/index.html", 404, done, "POST");
    });

    it("html with injected code - service file index.html", (done) => {
        httpExpect("/~samplefile", '<html><body>ok<script src="~samplesite/index.js"></script></body></html>', done);
    });

    it("html with injected code - nobody.html", (done) => {
        httpExpectError("/~samplesite/nobody.html", 200, done);
    });

    it("html with injected code - nofile.html", (done) => {
        httpExpectError("/~samplesite/nofile.html", 404, done);
    });

    it("html with injected code - no route", (done) => {
        httpExpectError("", 404, done);
    });

    it("html with injected code - default redirect", (done) => {
        httpExpect("/~samplesite/sub",
            '<html><body>sub<script src="~samplesite/index.js"></script></body></html>',
            done);
    });

    it("html with injected code - default", (done) => {
        httpExpect("/~samplesite/", '<html><body>ok<script src="~samplesite/index.js"></script></body></html>', done);
    });

    it("html with injected code - sub/default", (done) => {
        httpExpect("/~samplesite/sub/",
            '<html><body>sub<script src="~samplesite/index.js"></script></body></html>',
            done);
    });

    it("try registerPlugin after startServer", (done) => {
        try {
            api.registerPlugin({ handlers: {}, injections: [] });
            assert.equal("no error", "Server yet started error");
            done();
        } catch (err) {
            done();
        }
    });
});

describe("archol-dev-server-tests", () => {
    it("with out package.json", () => {
        if (api.loadConfig(__dirname + "/../bin")) {
            assert.equal("no error", "loadConfig must fail");
        }
    });
    it("invalid package.json", () => {
        if (api.loadConfig(__dirname + "/invalid/1")) {
            assert.equal("no error", "loadConfig must fail");
        }
    });
    it("invalid plugins in package.json", () => {
        if (api.loadConfig(__dirname + "/invalid/2")) {
            assert.equal("no error", "loadConfig must fail");
        }
    });
    it("invalid file in package.json", () => {
        try {
            if (api.loadConfig(__dirname + "/invalid/3")) {
                assert.equal("no error", "loadConfig has invalid plugin");
            }
        } catch (err) {
            //
        }
    });
});

function httpExpect(link: string, expected: string | RegExp, callback: () => void, method?: string) {
    const options = api.serverLink(link);
    options.method = method || "GET";
    const req = http.request(options, (res) => {
        if (res.statusCode === 301) {
            const u = url.parse(link);
            const l = res.headers.location;
            link = Array.isArray(l) ? l.join("") : l as string;
            u.pathname = link;
            httpExpect(link, expected, callback, method);
            return;
        }
        assert.equal(200, res.statusCode);
        let data = "";

        res.on("data", (chunk) => {
            data += chunk;
        });

        res.on("error", (err) => {
            assert.equal(err.message || err.toString(), "no error");
            callback();
        });

        res.on("end", () => {
            if (expected instanceof RegExp && !expected.test(data)) {
                assert.equal(data, expected.source, link);
            }

            if (typeof expected === "string") {
                assert.equal(data, expected, link);
            }
            callback();
        });
    });
    req.end();
}

function httpExpectError(link: string, expectedError: number, callback: () => void, method?: string) {
    const options = api.serverLink(link);
    options.method = method || "GET";
    const req = http.request(options, (res) => {
        if (res.statusCode === 301) {
            const u = url.parse(link);
            const l = res.headers.location;
            link = Array.isArray(l) ? l.join("") : l as string;
            u.pathname = link;
            httpExpectError(link, expectedError, callback);
            return;
        }
        assert.equal(expectedError, res.statusCode);
        callback();
    });
    req.end();
}
