/* global describe, it */

const expect = require("expect.js");

// Load a jokes instance
var jokes = require("../../dist/commands/Jokes.js")["default"];
jokes.init();

describe("Commands/Jokes", function () {

    for (var i = 0; i < 5; i++)
    {
        it("should return a joke", function (done) {

            jokes.doCommand("!joke", "mocha", "#test", function (result) {
                expect(result).to.be.a("string");
                done();
            });

        }).timeout(2e3);
    }

});