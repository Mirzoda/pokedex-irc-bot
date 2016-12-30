/* global describe, it */

const expect = require("expect.js");
const Config = require("../../dist/config.js")["default"];

// Load a say instance
var say = require("../../dist/commands/Say.js")["default"];

describe('Commands/Say', function () {

    it('should send a message to a certain channel', function (done) {

        say.doCommand("say #channel test", Config.irc.globaladmins[0], Config.irc.botname, function (result, channel) {
            expect(result).to.be.a("string");
            expect(result).to.be("test");
            expect(channel).to.be.a("string");
            expect(channel).to.be("#channel");
            done();
        });

    });

});