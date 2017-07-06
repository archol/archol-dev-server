import api = require('..');
import assert = require('assert');
import http = require('http');
import url = require('url');

describe('archol-dev-server-tests', function () {

    before(function (done) {
        api.loadConfig(__dirname + '/sample');
        api.startServer(done);
    });

    after(function (done) {
        api.stopServer(done);
    });

    it('ping', function (done) {
        httpExpect('/~ads/ping', /20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ/g, done);
    });

    it('echo', function (done) {
        httpExpect('/~sample/echo?s=123', '123', done);
    });

    it('html with injected code - noinject.txt', function (done) {
        httpExpect('/~samplesite/noinject.txt', '<html><body>ok</body></html>', done);
    });

    it('html with injected code - index.html', function (done) {
        httpExpect('/~samplesite/index.html', '<html><body>ok<script src="~samplesite/index.js"></script></body></html>', done);
    });
    
    it('html with injected code - sub/index.html', function (done) {
        httpExpect('/~samplesite/sub/index.html', '<html><body>sub<script src="~samplesite/index.js"></script></body></html>', done);
    });

    it('html with injected code - HEAD - index.html', function (done) {
        httpExpect('/~samplesite/index.html', '', done, 'HEAD');
    });

    it('html with injected code - POST - index.html', function (done) {
        httpExpectError('/~samplesite/index.html', 404, done, 'POST');
    });

    it('html with injected code - service file index.html', function (done) {
        httpExpect('/~samplefile', '<html><body>ok<script src="~samplesite/index.js"></script></body></html>', done);
    });

    it('html with injected code - nobody.html', function (done) {
        httpExpectError('/~samplesite/nobody.html', 200, done);
    });

    it('html with injected code - nofile.html', function (done) {
        httpExpectError('/~samplesite/nofile.html', 404, done);
    });

    it('html with injected code - no route', function (done) {
        httpExpectError('', 404, done);
    });

    it('html with injected code - default redirect', function (done) {
        httpExpect('/~samplesite/sub', '<html><body>sub<script src="~samplesite/index.js"></script></body></html>', done);
    });

    it('html with injected code - default', function (done) {
        httpExpect('/~samplesite/', '<html><body>ok<script src="~samplesite/index.js"></script></body></html>', done);
    });

    it('html with injected code - sub/default', function (done) {
        httpExpect('/~samplesite/sub/', '<html><body>sub<script src="~samplesite/index.js"></script></body></html>', done);
    });

    it('try registerPlugin after startServer', function (done) {
        try {
            api.registerPlugin({ handlers: {}, injections: [] });
            assert.equal('no error', 'Server yet started error');
            done();
        } catch (err) {
            done();
        }
    });
});

describe('archol-dev-server-tests', function () {
    it('with out package.json', function () {
        if (api.loadConfig(__dirname + '/../bin'))
            assert.equal('no error', 'loadConfig must fail');
    });
    it('invalid package.json', function () {
        if (api.loadConfig(__dirname + '/invalid/1'))
            assert.equal('no error', 'loadConfig must fail');
    });
    it('invalid plugins in package.json', function () {
        if (api.loadConfig(__dirname + '/invalid/2'))
            assert.equal('no error', 'loadConfig must fail');
    });
    it('invalid file in package.json', function () {
        try {
            if (api.loadConfig(__dirname + '/invalid/3'))
                assert.equal('no error', 'loadConfig has invalid plugin');
        } catch (err) {
            //
        }        
    });
});

function httpExpect(link: string, expected: string | RegExp, callback: () => void, method?: string) {
    let options=api.serverLink(link);
    options.method = method || 'GET';
    const req=http.request(options, function (res) {
        if (res.statusCode === 301) {
            let u = url.parse(link);
            let l = res.headers.location;
            link = Array.isArray(l) ? l.join('') : l as string;
            u.pathname = link;
            httpExpect(link, expected, callback, method);
            return
        }
        assert.equal(200, res.statusCode);
        var data = '';

        res.on('data', function (chunk) {
            data += chunk;
        });

        res.on('error', function (err) {
            assert.equal(err.message || err.toString(), 'no error');
            callback();
        });

        res.on('end', function () {
            if (expected instanceof RegExp && !expected.test(data))
                assert.equal(data, expected.source, link);

            if (typeof expected === 'string')
                assert.equal(data, expected, link);
            callback();
        });
    });
    req.end();
}

function httpExpectError(link: string, expectedError: number, callback: () => void, method?: string) {
    let options=api.serverLink(link);
    options.method = method || 'GET';
    const req=http.request(options, function (res) {
        if (res.statusCode === 301) {
            let u = url.parse(link);
            let l = res.headers.location;
            link = Array.isArray(l) ? l.join('') : l as string;
            u.pathname = link;
            httpExpectError(link, expectedError, callback);
            return
        }
        assert.equal(expectedError, res.statusCode);
        callback();
    });
    req.end();
}