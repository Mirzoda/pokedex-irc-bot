const cheerio = require("cheerio");
const request = require("request");

import Log from '../common/Log.js';
import Cache from '../common/Cache.js';

/**
 * Display a random joke
 */
export default class Users {

    static doCommand(command, from, to, callBack) {
        if (typeof callBack !== "function")
            callBack = (msg) => {};

        // Do logging
        this.log(from + " requested a joke");

        // Check the joke credits
        var credits = JSON.parse(Cache.instance.get(this.cacheCreditSlug)) || {};
        if (!credits.hasOwnProperty(from)) {
            credits[from] = {
                credits: this.initialCredits,
                reset: (new Date().getTime()) + 3600000
            };
        }
        if (credits[from].reset < new Date().getTime()) {
            credits[from] = {
                credits: this.initialCredits,
                reset: (new Date().getTime()) + 3600000
            };
        }
        credits[from].credits = credits[from].credits - 1;
        if (credits[from].credits === 0) {
            credits[from].credits = credits[from].credits - 1;
            callBack(from + ': You have no joke credits left, try again later.');
        }
        Cache.instance.put(this.cacheCreditSlug, -1, JSON.stringify(credits));

        // Get a joke from a random website
        if (credits[from].credits > 0) {
            switch (Math.ceil(Math.random() * 1)) {
                case 1:
                    this.getJokeOnelinefun(callBack);
                    break;
            }
        }
    }

    static getCommands() {
    	return [
    	    "^!joke"
    	];
    }

    static init() {

        // Set some data
        this.cacheCreditSlug = 'jokecredits';
        this.initialCredits = 6;

        // Set the jokecredits
        Cache.instance.put(this.cacheCreditSlug, -1, "{}");
    }

    static log(msg) {
        Log.log("[Jokes] " + msg);
    }



    /**
     *  Get a joke from onelinefun
     */
    static getJokeOnelinefun(callBack) {

        // First, find the number of pages
        request("http://onelinefun.com", function (error, response, html) {

            // Parse the html
            var $ = cheerio.load(html);

            // Find last page number
            var pnr = $(".pagination a").last().attr("href").replace(/[^\d]/g, '') * 1;

            // Load a random page
            request("http://onelinefun.com/" + Math.ceil(Math.random() * pnr) + "/", function (error, response, html) {

                // Find the jokes and load a random one
                var $ = cheerio.load(html);
                var jokes = $(".oneliner p");
                var joke = jokes.eq(Math.floor(Math.random() * jokes.length)).text();

                // Send it back
                callBack(joke);

            });


        });

    }
}
