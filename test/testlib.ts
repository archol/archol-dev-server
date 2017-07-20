
import api = require('..');
import assert = require('assert');
import http = require('http');
import url = require('url');

export function httpExpect(link: string, expected: string | RegExp, callback: () => void, method?: string) {
    const options = api.serverLink(link);
    options.method = method || 'GET';
    const req = http.request(options, (res) => {
        if (res.statusCode === 301) {
            const u = url.parse(link);
            const l = res.headers.location;
            link = Array.isArray(l) ? l.join('') : l as string;
            u.pathname = link;
            httpExpect(link, expected, callback, method);
            return;
        }
        assert.equal(200, res.statusCode);
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('error', (err) => {
            assert.equal(err.message || err.toString(), 'no error');
            callback();
        });

        res.on('end', () => {
            if (expected instanceof RegExp && !expected.test(data)) {
                assert.equal(data, expected.source, link);
            }

            if (typeof expected === 'string') {
                assert.equal(data, expected, link);
            }
            callback();
        });
    });
    req.end();
}

export function httpExpectError(link: string, expectedError: number, callback: () => void, method?: string) {
    const options = api.serverLink(link);
    options.method = method || 'GET';
    const req = http.request(options, (res) => {
        if (res.statusCode === 301) {
            const u = url.parse(link);
            const l = res.headers.location;
            link = Array.isArray(l) ? l.join('') : l as string;
            u.pathname = link;
            httpExpectError(link, expectedError, callback);
            return;
        }
        assert.equal(expectedError, res.statusCode);
        callback();
    });
    req.end();
}
