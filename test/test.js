var assert = require('assert'),
    http = require('http'),
    api = require('..');

describe('archol-dev-server-tests', function () {    

    before(function (done) {
        api.loadConfig(__dirname+'/sample');
        api.loadPlugins();
        api.startServer(done);
    });

    after(function (done) {
        api.stopServer(done);
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

describe('archol-dev-server-tests', function () {    
    it('with out package.json', function () {
        if (api.loadConfig(__dirname+'/../bin'))
          assert.fail('must fail');
    });
    it('invalid package.json', function () {
        debugger
        if (api.loadConfig(__dirname+'/invalid'))
          assert.fail('must fail');
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