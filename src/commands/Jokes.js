const _ = require('underscore');
const cheerio = require("cheerio");
const request = require("request");

import Log from '../common/Log.js';
import Cache from '../common/Cache.js';

/**
 * Display a random joke
 */
export default class Jokes {

    static doCommand(command, from, to, callBack) {
        if (typeof callBack !== "function")
            callBack = (msg) => {};

        // Do logging
        this.log(from + " requested a joke");

        // Check the joke credits
        var credits = Cache.instance.get(this.cacheCreditSlug) || {};
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
        Cache.instance.put(this.cacheCreditSlug, -1, credits);

        // Get a joke from a random website
        if (credits[from].credits > 0) {
            let now = new Date();

            // Fill an array with sources of jokes
            var sources = [
                this.getJokeOnelinefun
            ];
            if (now.getMonth() == 1 && now.getDate() == 14) { // Valentine
                sources.push(this.getJokeOnelinefunValentine);
            }
            if (now.getMonth() == 3 && now.getDate() < 10) { // Easter
                sources.push(this.getJokes4usEaster);
                sources.push(this.getJokeOnelinefunEaster);
            }
            if((now.getMonth() == 9 && now.getDate() > 24) && (now.getMonth() == 10 && now.getDate() < 6)) { // Halloween
                sources.push(this.getJokeOnlinefunHalloween);
            }
            if (now.getMonth() == 11 && (now.getDate() > 6 && now.getDate() < 30)) { // Christmas
                sources.push(this.getChristmasCrackerJoke);
                sources.push(this.getRDChristmasJoke);
            }

            // Load a joke
            _.sample(sources)(callBack);
        }
    }

    static getCommands() {
    	return [
    	    "^!joke$"
    	];
    }

    static init() {

        // Set some data
        this.cacheCreditSlug = 'jokecredits';
        this.initialCredits = 6;

        // Set the jokecredits
        Cache.instance.put(this.cacheCreditSlug, -1, {});
    }

    static log(msg) {
        Log.log("[Jokes] " + msg);
    }




    /**
     *  getJokeOnelinefun
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
                let $ = cheerio.load(html);
                let jokes = $(".oneliner p");
                let joke = jokes.eq(Math.floor(Math.random() * jokes.length)).text();

                // Send it back
                callBack(joke);

            });
        });
    } // End getJokeOnelinefun
    
    /**
     *  getJokeOnlinefun - Valentine
     */
    static getJokeOnelinefunValentine(callBack) {

        // First, find the number of pages
        request("http://onelinefun.com/valentines/", function (error, response, html) {

            // Parse the html
            var $ = cheerio.load(html);

            // Find last page number
            var pnr = $(".pagination a").last().attr("href").replace(/[^\d]/g, '') * 1;

            // Load a random page
            request("http://onelinefun.com/valentines/" + Math.ceil(Math.random() * pnr) + "/", function (error, response, html) {

                // Find the jokes and load a random one
                let $ = cheerio.load(html);
                let jokes = $(".oneliner p");
                let joke = jokes.eq(Math.floor(Math.random() * jokes.length)).text();

                // Send it back
                callBack(joke);

            });
        });
    } // End getJokeOnelinefunValentine
    
    /**
     *  getJokeOnlinefun - Easter
     */
    static getJokeOnelinefunEaster(callBack) {

        // First, find the number of pages
        request("http://onelinefun.com/easter/", function (error, response, html) {

            // Parse the html
            var $ = cheerio.load(html);

            // Find last page number
            var pnr = $(".pagination a").last().attr("href").replace(/[^\d]/g, '') * 1;

            // Load a random page
            request("http://onelinefun.com/easter/" + Math.ceil(Math.random() * pnr) + "/", function (error, response, html) {

                // Find the jokes and load a random one
                let $ = cheerio.load(html);
                let jokes = $(".oneliner p");
                let joke = jokes.eq(Math.floor(Math.random() * jokes.length)).text();

                // Send it back
                callBack(joke);

            });
        });
    } // End getJokeOnelinefunEaster

    /**
     *  getJokeOnlinefun - Halloween
     */
    static getJokeOnelinefunHalloween(callBack) {

        // First, find the number of pages
        request("http://onelinefun.com/halloween/", function (error, response, html) {

            // Parse the html
            var $ = cheerio.load(html);

            // Find last page number
            var pnr = $(".pagination a").last().attr("href").replace(/[^\d]/g, '') * 1;

            // Load a random page
            request("http://onelinefun.com/halloween/" + Math.ceil(Math.random() * pnr) + "/", function (error, response, html) {

                // Find the jokes and load a random one
                let $ = cheerio.load(html);
                let jokes = $(".oneliner p");
                let joke = jokes.eq(Math.floor(Math.random() * jokes.length)).text();

                // Send it back
                callBack(joke);

            });
        });
    } // End getJokeOnelinefunHalloween
    
    /**
     *    getJokes4usEaster
     */
    static getJokes4usEaster(callBack) {

        // First, get the page source
        request("http://www.jokes4us.com/holidayjokes/easterjokes/easteronelinersjokes.html", function (error, response, html) {

            // Find the jokes and load a random one
            let $ = cheerio.load(html);
            let strJokes = $(".SocialShare + p + p").html().replace(/\r?\n|\r/g, "");
            let jokes = strJokes.split(/(<br\s?\/?>){2}/);

            // Send it back
            callBack(_.sample(jokes).replace("<br>", "\n"));
        });
    } // End getJokes4usEaster

    static getRDChristmasJoke(callBack) {

        // First, get the page source
        request("http://www.rd.com/jokes/christmas-jokes/", function (error, response, html) {

            // Find the jokes and load a random one
            var $ = cheerio.load(html);
            var jokes = $(".jokes-river--content");
            var joke = jokes.eq(Math.floor(Math.random() * jokes.length)).text();

            // Send it back
            callBack(joke);
        });
    } // End getRDChristmasJoke
    
    /**
     *  getChristmasCrackerJoke
     */
    static getChristmasCrackerJoke(callBack) {

        // First, get the page source
        request("http://www.whychristmas.com/fun/cracker_jokes.shtml", function (error, response, html) {

            // Find the jokes and load a random one
            let $ = cheerio.load(html);
            let jokes = $("#content p");
            let joke = jokes.eq(Math.floor(Math.random() * jokes.length - 3) + 3).text();

            // Send it back
            callBack(joke);
        });
    } // End getChristmasCrackerJoke
}
