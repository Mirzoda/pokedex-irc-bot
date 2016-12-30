/* global describe, it */

const expect = require("expect.js");

// Load an eightball instance
var eightball = require("../../dist/commands/EightBall.js")["default"];

describe("Commands/EightBall", function () {

    it("should cache results", function (done) {

        eightball.doCommand("!kan dit?", "mocha", "#test", function (result) {
            expect(result).to.be.a("string");

            eightball.doCommand("!kan dit?", "mocha", "#test", function (result2) {
                expect(result).to.be(result2);
                done();
            });
        });

    });

});