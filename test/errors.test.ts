
import api = require("..");
import logger = require("../dist/logger");
import assert = require("assert");

describe("archol-dev-server error detection", () => {
    let log: logger.ILogData[] = [];
    let serverLog: logger.ILogData[] = [];
    const testLogger = (data) => log.push(data);
    const testServerLogger = (data) => serverLog.push(data);
    beforeEach(() => {
        log = [];
        serverLog = [];
        logger.addLogListenner(testLogger);
        logger.addServerOnlyLogListenner(testServerLogger);
    });
    afterEach(() => {
        logger.removeLogListenner(testLogger);
        logger.removeServerOnlyLogListenner(testServerLogger);
    });
    it("no logListenner", () => {
        logger.removeLogListenner(testLogger);
        try {
            logger.log({
                kind: "error",
                message: "sample",
            });
            assert.equal("no error", "no logListenner error");
        } catch (err) {
            //
        }
        assert.equal(log.length, 0, "log.length");
        assert.equal(serverLog.length, 0, "serverLog.length");
    });
    it("no serverOnlyLogListenner", () => {
        logger.removeServerOnlyLogListenner(testServerLogger);
        try {
            logger.serverOnlyLog({
                kind: "error",
                message: "sample",
            });
            assert.equal("no error", "no logListenner error");
        } catch (err) {
            //
        }
        assert.equal(log.length, 0, "log.length");
        assert.equal(serverLog.length, 0, "serverLog.length");
    });

    it("with out package.json", () => {
        if (api.loadConfig(__dirname + "/../dist")) {
            assert.equal("no error", "loadConfig must fail");
        }
        assert.equal(log.length, 0, "log.length");
        assert.equal(serverLog.length, 1, "serverLog.length");
    });
    it("invalid package.json", () => {
        if (api.loadConfig(__dirname + "/invalid/1")) {
            assert.equal("no error", "loadConfig must fail");
        }
        assert.equal(log.length, 0, "log.length");
        assert.equal(serverLog.length, 1, "serverLog.length");
    });
    it("invalid plugins in package.json", () => {
        if (api.loadConfig(__dirname + "/invalid/2")) {
            assert.equal("no error", "loadConfig must fail");
        }
        assert.equal(log.length, 0, "log.length");
        assert.equal(serverLog.length, 1, "serverLog.length");
    });
    it("invalid file in package.json", () => {
        try {
            if (api.loadConfig(__dirname + "/invalid/3")) {
                assert.equal("no error", "loadConfig has invalid plugin");
            }
        } catch (err) {
            //
        }
        assert.equal(log.length, 0, "log.length");
        assert.equal(serverLog.length, 0, "serverLog.length");
    });
});
