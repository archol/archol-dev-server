var assert = require('assert'),
    http = require('http'),
    api = require('..');

describe('archol-dev-server-tests', function () {    

    before(function (done) {
        api.loadConfig();
        api.loadPlugins();
        api.startServer(done);
    });

    after(function () {
        api.stopServer();
    });

    it('ping', function (done) {
        httpGet('http://localhost:54321/~ads/ping', function (err, res) {
            if (err)
                assert.fail(err);
            else if (!/20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ/.test(res))
                assert.fail('invalid content: ' + res);
            done();
        });
    });
});

function httpGet(url, callback) {
    http.get(url, function (res) {
        assert.equal(200, res.statusCode);
        var data = '';

        res.on('data', function (chunk) {
            data += chunk;
        });

        res.on('error', function (err) {
            callback(res);
        });

        res.on('end', function () {
            callback(null, data);
        });
    });
}