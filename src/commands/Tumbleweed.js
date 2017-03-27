import Config from '../config.js';

const irc = require('irc');
const moment = require('moment');

/**
 * When no messages have been said for a certain period of time, introduce the tumbleweed user
 */
export default class Tumbleweed {
    static timers = {};

    static catchAll(from, to, message, raw) {

	// Not in weekends
	if (+moment().day() < 6)
	{

            // Only between working hours
            if (+moment().format("k") > 7 && +moment().format("k") < 17)
            {
                // Clear any previous timeout
                if (Tumbleweed.timers[to])
                    clearTimeout(Tumbleweed.timers[to]);

                // Wait 25 minutes before tumbleweed joins
                Tumbleweed.timers[to] = setTimeout(function () {
                    Tumbleweed.introduceTumbleweed(to);
                }, 1000 * 60 * (30 + (Math.random() * 30)));

            }

	}
    }

    /**
     *  This function introduces tumbleweed for a short time to the channel
     */
    static introduceTumbleweed(channel) {

        // Create irc connection
		var client = new irc.Client(Config.irc.server, "Tumbleweed", {
    	    channels: [channel],
	    	autoConnect: false,
	    	autoRejoin: false,
	    	retryCount: 10,
	    	userName: "Desert"
        });

        // Connect to irc
        client.connect();

        // Disconnect from irc
        setTimeout(function () {
            client.disconnect("... Tumbleweed floats away ...");
        }, Math.random() * 5000);

    }

}
