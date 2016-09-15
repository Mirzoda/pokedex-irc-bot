/* global describe, it */

var expect = require('expect.js');

// Load a cache instance
var Cache = require("../../dist/common/Cache.js")["default"];


describe('Common/Cache.js', function () {

    it('should remember an item forever', function () {
        var time = new Date().getTime();

        Cache.instance.rememberForever('time', function () {
            return time;
        });

        var result = Cache.instance.rememberForever('time', function () {
            return 0;
        });

        expect(result).to.be(time);
    });


    it('should override cache when putting', function () {
        var time = new Date().getTime();

        Cache.instance.rememberForever('time2', function () {
            return time;
        });

        Cache.instance.put('time2', 5, 0);
        var result = Cache.instance.get('time2');

        expect(result).to.be(0);
    });


    it('should forget cache after a while', function (done) {

        Cache.instance.put('time3', 1, 0);

        setTimeout(function () {

            var result = Cache.instance.get('time3');

            expect(result).to.be(null);

            done();

        }, 61e3);

    }).timeout(7e4);

});