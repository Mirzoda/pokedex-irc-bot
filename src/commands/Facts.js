"use strict";

const fs = require('fs');
const PastebinAPI = require('pastebin-js');

import Cache from '../common/Cache.js';
import Channel from '../common/Channel.js';
import Config from '../config.js';
import Log from '../common/Log.js';

/**
 *  !facts - Learn and display facts created by users
 */
export default class Facts {

    static doCommand(command, from, to, callBack, pmCallback) {
		if (typeof callBack !== "function")
		    callBack = (msg) => {};

	        // Load all available facts
		var facts = Cache.instance.get(this.factsCacheSlug);

		// What are we doing?
		var matches;
		if (command === "!facts")
		{
		    callBack("I know " + Object.keys(facts).length + " facts!");
		}
		else if (command === "!factlist")
		{
			// Do we have a list in cache?
			if (Cache.instance.get("pastebin_facts")) {
				callBack(Cache.instance.get("pastebin_facts"));
				return;
			}

			// Find pastebin dev key
			fs.readFile(__dirname + "/../data/pastebin.json", function (err, data) {
				if (err) {
					console.log("Error reading pastebin settings: " + err);
				}

				// Get pastebin settings
				data = JSON.parse(data);
				if (!data.hasOwnProperty("devkey")) {
					callBack("Pastebin devkey is not set!");
					return;
				}

				// Get pastebin object
				var pastebin = new PastebinAPI(data.devkey);

				// Create new string with facts
				var fstring = "";
				for (fact in facts) {
					var responses = [facts[fact][1]];
					if (typeof facts[fact][1] === "object") {
						responses = [];
						var r = facts[fact][1];
						for (var i in r) {
							var resp = "";

							if (i > 0)
								resp += new Array(31).join(" ");

							responses.push(resp + r[i]);
						}
					}

					fstring += fact + ":" + new Array(30 - fact.length).join(" ") + responses.join("\r\n") + "\r\n";
				}

				pastebin.createPaste({
			        text: fstring,
			        title: "Pokedex facts",
			        format: null,
			        privacy: 1,
			        expiration: '1H'
			    })
			    .then(function (data) {

			    	// Keep the link in cache for one hour
			    	Cache.instance.put("pastebin_facts", 59, "These are all the facts: " + data);

					// Send the data back
			    	callBack("These are all the facts: " + data);
			    });
			});
		}
		else if ((matches = command.match(/^!fact ([\w\d-:]+)/)) && matches !== null)
		{
		    // Is this fact in the cache?
		    if (matches.length < 2 || !facts.hasOwnProperty(matches[1])) {
				callBack(from + ": I do not know this fact...");
				return;
		    }

		    // Find the fact and its info
		    var f = facts[matches[1]];
		    if (f) {
		    	callBack("I learned " + matches[1]  + " from " + f[0]  + "! It has been used " + f[2] + " times.");
		    } else {
		    	callBack(from + ": I do not know this fact...");
		    }
		}
		else if ((matches = command.match(new RegExp("^" + Config.irc.botname + ": !([\\w\\d-]+)(\\[(del)?\\])?( ([\\w\\d\\s\\/\\-\\%].*?))?$"))) && matches !== null)
		{
      		if (!matches[5] || matches[5].lengh === 0) {
				return;
			}

			if ((matches[5].match(/%randomuser%/ig) || []).length > 2) {
				callBack(from + ": Stop annoying users!");
				return;
			}

			var locked = false;
			if (matches[5].match(/ --lock$/) && Config.irc.isAdmin(to, from)) {
				matches[5] = matches[5].replace(/ --lock$/, '');
				locked = true;
			}

		    // Create the fact in the list
		    if (matches[2] === "[]") {
				if (facts.hasOwnProperty(matches[1]) && typeof (facts[matches[1]][1]) === "object") {
					this.log(from + " added to !" + matches[1] + "[]: " + matches[5]);
				    facts[matches[1]][1].push(matches[5]);
				} else {
					this.log(from + " created !" + matches[1] + "[]: " + matches[5]);
				    facts[matches[1]] = [
				    	from,
				    	[matches[5]],
				    	0
				    ];
		    	}
		    } else if (matches[2] === "[del]" && Config.irc.isAdmin(to, from)) {
		    	if (facts.hasOwnProperty(matches[1]) && typeof (facts[matches[1]][1]) === "object") {
		    		this.log(from + " removed all replies for !" + matches[1]);
				    delete facts[matches[1]];
				    callBack("All !" + matches[1] + " responses have been removed by " + from + ", blame him/her!");
				}
		    } else {
		    	if (facts.hasOwnProperty(matches[1]) && typeof (facts[matches[1]][1]) === "object") {
					callBack(matches[1] + " is an array, use !" + matches[1] + "[] to add a value.");
		    	} else {
		    		if (facts.hasOwnProperty(matches[1]) && facts[matches[1]].length > 3 && facts[matches[1]][3] === true && !Config.irc.isAdmin(to, from)) {
						pmCallback(matches[1] + " is locked, only an admin can edit this!");
						return;
		    		}
		    		this.log(from + " created !" + matches[1] + ": " + matches[5]);
			    	facts[matches[1]] = [
					    from,
					    matches[5],
				   	    0,
				   	    locked
			    	];
		    	}
		    }

            // Save all facts
		    this.saveFacts(facts);
		}
		else if ((matches = command.match(/^!([\w\d-:]+)(\s(.*?))?$/)) && matches !== null)
		{

		    // Is this fact in the cache?
	        if (matches.length < 2 || !facts.hasOwnProperty(matches[1])) {
	            return;
	        }

	        // Find the fact and its info
	        var f = facts[matches[1]];

		    // Update the usage
		    facts[matches[1]][2] = facts[matches[1]][2] + 1;
		    this.saveFacts(facts);

		    // Get the fact
		    var fact = f[1];
		    if (typeof fact === "object") {
				fact = fact[Math.floor(Math.random()*fact.length)];
		    }

		    // Replace parameters
		    fact = fact.replace(/%user%/g, from);
		    fact = fact.replace(/%randomuser%/g, function () {
				var users = Channel.instance.get(to).users;
		        var ruser;
		        if (users.length === 0) {
				    ruser = from;
		        } else {
				    ruser = users[Math.floor(Math.random() * users.length)];
		        }

				return ruser;
		    });
		    fact = fact.replace(/%param(:(.*?))?%/g, function (a, b, def) {
				if (matches.length > 3 && matches[3] !== undefined)
				    return matches[3].trim();
				else
				    return def;
		    });
		    fact = fact.replace(/%dice:(\d+):(\d+)%/g, function (all, min, max) {
				return Math.floor(Math.random() * (Number(max) - Number(min) + 1)) + Number(min);
			});

		    // Send the value back
	        callBack(fact);

		}

    };

    static getCommands() {
        return [
	    "^" + Config.irc.botname + ": ![\\w\\d+](\\[(del)?\\])?",
	    "^!facts$",
	    "^!factlist$",
	    "^!fact [\\w\\d-]+$",
	    "^![\\w\\d]+"
        ];
    };


    static init() {

		// Set the cache slug
		this.factsCacheSlug = "facts_cache";

		// Load existing facts from file
		var fcs = this.factsCacheSlug;
		fs.readFile(__dirname + '/../data/facts.json', function(err, data) {
		    if (err) return;
		    Cache.instance.put(fcs, -1, data.toString());
		});

    }


	/**
	 *	Log a message
	 */
	static log(message) {
		Log.log("[Facts] " + message);
	}

    /**
     *	Save the facts to the cache and to a file
     */
    static saveFacts(facts) {

		if (JSON.stringify(facts).length === 0) return;

		// Save the list to the cache
		Cache.instance.put(this.factsCacheSlug, -1, facts);

		// Save the list to the file
		fs.writeFile(__dirname + '/../data/facts.json', JSON.stringify(facts));

    }

}
