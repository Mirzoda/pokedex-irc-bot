import Config from '../config.js';

const irc = require('irc');
const moment = require('moment');

/**
 * When no messages have been said for a certain period of time, introduce the tumbleweed user
 */
export default class Users {
    static timers = {};

    static catchAll(from, to, message, raw) {

        // Only between working hours
        if (moment().hour() > 7 && moment.hour() < 17)
        {
            // Clear any previous timeout
            if (this.timers[to])
                clearTimeout(this.timers[to]);

            // Wait 25 minutes before tumbleweed joins
            this.timers[to] = setTimeout(function () {
                this.introduceTumbleweed(to);
            }, 1000 * 60 * 25);

        }
    }

    /**
     *  This function introduces tumbleweed for a short time to the channel
     */
    static introduceTumbleweed(channel) {

        // Create irc connection
		var client = new irc.Client(Config.irc.server, Config.irc.botname, {
    	    channels: [channel],
	    	autoConnect: false,
	    	autoRejoin: false,
	    	retryCount: 10,
	    	userName: "Tumbleweed"
        });

        // Connect to irc
        client.connect();

        // Disconnect from irc
        setTimeout(function () {
            client.disconnect("... Tumbleweed floats away ...");
        }, Math.random() * 5000);

    }

}
