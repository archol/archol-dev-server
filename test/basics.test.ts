import api = require('..');
import { httpExpect, httpExpectError } from './testlib';
import assert = require('assert');
import logger = require('../dist/logger');

describe('archol-dev-server basics', () => {

    let logCount = 0;
    const logInc = () => logCount++;

    before((done) => {
        logger.addLogListenner(logInc);
        logger.addServerOnlyLogListenner(logInc);
        api.loadConfig(__dirname + '/sample');
        api.startServer(done);
    });

    after((done) => {
        logger.removeLogListenner(logInc);
        logger.removeServerOnlyLogListenner(logInc);
        api.stopServer(done);
    });

    beforeEach(() => {
        logCount = 0;
    });

    it('ping', (done) => {
        httpExpect('/~ads/ping', /20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ/g, done);
        assert.equal(logCount, 0, 'logCount');
    });

    it('echo', (done) => {
        httpExpect('/~sample/echo?s=123', '123', () => {
            assert.equal(logCount, 0, 'logCount');
            done();
        });
    });

    it('html with injected code - noinject.txt', (done) => {
        httpExpect('/~samplesite/noinject.txt', '<html><body>ok</body></html>', () => {
            assert.equal(logCount, 0, 'logCount');
            done();
        });
    });

    it('html with injected code - index.html', (done) => {
        httpExpect('/~samplesite/index.html',
            '<html><body>ok<script src="~samplesite/index.js"></script></body></html>', () => {
                assert.equal(logCount, 0, 'logCount');
                done();
            });
    });

    it('html with injected code - sub/index.html', (done) => {
        httpExpect('/~samplesite/sub/index.html',
            '<html><body>sub<script src="~samplesite/index.js"></script></body></html>',
            () => {
                assert.equal(logCount, 0, 'logCount');
                done();
            });
    });

    it('html with injected code - HEAD - index.html', (done) => {
        httpExpect('/~samplesite/index.html', '', () => {
            assert.equal(logCount, 0, 'logCount');
            done();
        }, 'HEAD');
    });

    it('html with injected code - POST - index.html', (done) => {
        httpExpectError('/~samplesite/index.html', 404, () => {
            assert.equal(logCount, 0, 'logCount');
            done();
        }, 'POST');
    });

    it('html with injected code - service file index.html', (done) => {
        httpExpect('/~samplefile', '<html><body>ok<script src="~samplesite/index.js"></script></body></html>', () => {
            assert.equal(logCount, 0, 'logCount');
            done();
        });
    });

    it('html with injected code - nobody.html', (done) => {
        httpExpectError('/~samplesite/nobody.html', 200, () => {
            assert.equal(logCount, 0, 'logCount');
            done();
        });
    });

    it('html with injected code - nofile.html', (done) => {
        httpExpectError('/~samplesite/nofile.html', 404, () => {
            assert.equal(logCount, 0, 'logCount');
            done();
        });
    });

    it('html with injected code - no route', (done) => {
        httpExpectError('', 404, () => {
            assert.equal(logCount, 0, 'logCount');
            done();
        });
    });

    it('html with injected code - default redirect', (done) => {
        httpExpect('/~samplesite/sub',
            '<html><body>sub<script src="~samplesite/index.js"></script></body></html>', () => {
                assert.equal(logCount, 0, 'logCount');
                done();
            });
    });

    it('html with injected code - default', (done) => {
        httpExpect('/~samplesite/', '<html><body>ok<script src="~samplesite/index.js"></script></body></html>', () => {
            assert.equal(logCount, 0, 'logCount');
            done();
        });
    });

    it('html with injected code - sub/default', (done) => {
        httpExpect('/~samplesite/sub/',
            '<html><body>sub<script src="~samplesite/index.js"></script></body></html>', () => {
                assert.equal(logCount, 0, 'logCount');
                done();
            });
    });

    it('try registerPlugin after startServer', (done) => {
        try {
            api.registerPlugin({
                handlers: {},
                injections: [],
                transformers: {},
            });
            assert.equal('no error', 'Server yet started error');
        } catch (err) {
            //
        }
        assert.equal(logCount, 0, 'logCount');
        done();
    });
});
