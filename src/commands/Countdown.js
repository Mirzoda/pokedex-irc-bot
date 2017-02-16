const fs = require('fs');

import Log from '../common/Log.js';

export default class Countdown {

    static doCommand(command, from, to, callBack) {
		if (typeof callBack !== "function")
		    callBack = (msg) => {};

		// Get the data from a file.
		// This way we can update the date without restarting Pokedex
		var file = __dirname + "/../data/countdown.json";
		fs.exists(file, (exists) => {
		    if (!exists) return;

		    // Parse data
		    fs.readFile(file, (err, data) => {
				if (err) {
				    this.log("error: " + err);
				    return;
				}

				// Custom countdown?
				var custom = command.replace(/^!countdown\s+/, '');

				// Parse json data and find the correct event
				data = JSON.parse(data);
				if (data.hasOwnProperty(custom)) {
					data = data[custom];
				} else if (data.hasOwnProperty(to)) {
					data = data[to];
				} else if (data.hasOwnProperty("default")) {
					data = data["default"];
				} else {
					callBack("No countdown is set, blame Nuva!");
					return;
				}

				// Calculate the difference
		    	var now = new Date();
		    	var diff = data.time - now.getTime();
		    	if (diff < 0) {
			    	callBack("Tis al gepasseert...");
		            return;
		     	}

	           	var day = Math.floor(diff / 86400000);
		   		diff = diff - (day * 86400000);

		    	var week = Math.floor(day / 7);
		    	day = day - (week * 7);

		    	var hour = Math.floor(diff / 3600000);
		    	diff = diff - (hour * 3600000);

		    	var minute = Math.floor(diff / 60000);
		    	diff = diff - (minute * 60000);

		    	var str = "Nog ";
		    	if (week > 0)
			    str += week + (week > 1 ? " weken, " : " week, ");

		    	if (day > 0)
			    str += day + (day > 1 ? " dagen, " : " dag, ");

	    	    	if (hour > 0)
			    str += hour + " uur, ";

		    	if (minute > 0)
		 	    str += minute + (minute > 1 ? " minuten " : " minuut ");

		    	var second = Math.floor(diff / 1000);
		    	if (second > 0)
			    str += "en " + second + (second > 1 ? " seconden " : " second ");

		    	if (data.event)
			    str += "tot " + data.event + "!";

		    	callBack(str);

		    });
		});

    }


    static getCommands() {
		return [
		    '!countdown'
		];
    }


    static log(msg) {
    	Log.log("[Countdown] " + msg);
    }

}
