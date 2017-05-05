"use strict";

const _ = require('underscore');
const fs = require('fs');
const mysql = require("mysql");
const PastebinAPI = require('pastebin-js');

import Config from '../config.js';
import Cache from '../common/Cache.js';
import Channel from '../common/Channel.js';
import Log from '../common/Log.js';
import Logger from './Logger.js';

/**
 *  !facts - Learn and display facts created by users
 */
export default class FactsDB {

    static doCommand(command, from, to, callBack, pmCallback, raw) {
		if (typeof callBack !== "function")
		    callBack = (msg) => {};

		// What are we doing?
		var matches;
		if (command === "!facts")
		{
			FactsDB.countFacts((count) => {
				callBack("I know " + count + " facts!");
			});
		}
		else if (command === "!factlist")
		{
			// Do we have a list in cache?
			if (Cache.instance.get("pastebin_facts")) {
				callBack(Cache.instance.get("pastebin_facts"));
				return;
			}

			// Find all facts
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

				FactsDB.getFacts((facts) => {

					// Create new string with facts
					var fstring = "";
					for (var fact in facts) {
						var responses = [];
						var r = facts[fact].responses;
						for (var i in r) {
							var resp = "";

							if (i > 0)
								resp += new Array(31).join(" ");

							responses.push(resp + r[i]);
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
			});
		}
		else if ((matches = command.match(/^!fact ([\w\d-:]+)/)) && matches !== null)
		{
			var key = matches[1];
			FactsDB.getFact(key, (fact) => {
	        	if (fact.responses.length === 0) {
	        		return;
	        	}

				// List users
				var users = fact.users.join(', ');
				users = users.replace(/, ([^,]+)$/, " and $1");

				callBack("I learned !" + key + " from " + users + ".");
				callBack("It has been used " + fact.uses + " times.");
			});
		}
		else if ((matches = command.match(new RegExp("^" + Config.irc.botname + ": !([\\w\\d-]+)(\\[(del)?\\])?( (.{2,}))?$"))) && matches !== null)
		{
      		if (!matches[5] || matches[5].lengh === 0) {
				return;
			}

			if ((matches[5].match(/%randomuser%/ig) || []).length > 2) {
				callBack(from + ": Stop annoying users!");
				return;
			}

			// var locked = false;
			// if (matches[5].match(/ --lock$/) && Config.irc.isAdmin(to, from)) {
			// 	matches[5] = matches[5].replace(/ --lock$/, '');
			// 	locked = true;
			// }

			var newfact = {
				is_array: matches[2] === '[]' || matches[2] === '[del]',
				key: matches[1],
				response: matches[5],
				user: from
			};

			// Find an existing fact
			this.getFact(newfact.key, (fact) => {

				// If its an array and your not doing an array request, block it!
				if (fact.exists && fact.is_array && !newfact.is_array) {
					callBack("!" + newfact.key + " is an array, use [] to add a value.");
					return;
				}

				// Add the new value
				FactsDB._getConnection((conn) => {

					// Remove existing facts if not an array
					if (fact.exists && !fact.is_array) {
						conn.query('DELETE FROM facts WHERE `key` = ?', [newfact.key]);
					}

					// Insert the new fact
					Logger._getChannelAndUser(conn, raw, to, (userid) => {

						conn.query('INSERT INTO facts SET ?', {
							key: newfact.key,
							response: newfact.response,
							user_id: userid,
							nickname: from,
							is_array: (fact.exists && fact.is_array) || newfact.is_array
						});

					});

				});

			});
		}
		else if ((matches = command.match(/^!([\w\d-:]+)(\s(.*?))?$/)) && matches !== null)
		{
		    // Is this fact in the cache?
	        if (matches.length < 2) {
	            return;
	        }

			var key = matches[1];
	        FactsDB.getFact(key, (fact) => {
	        	if (fact.responses.length === 0) {
	        		return;
	        	}

				// Get a random response
				var response = _.sample(fact.responses);

				// Update facts usage
				FactsDB.updateFactUsage(key, response);

				// Format the response a bit
				response = response.replace(/%user%/g, from);
				response = response.replace(/%randomuser%/g, () => { return _.sample(Channel.instance.get(to).users); });
				response = response.replace(/%param(:(.*?))?%/g, (a, b, def) => {
					if (matches.length > 3 && matches[3] !== undefined)
					    return matches[3].trim();
					else if (def !== undefined)
					    return def;
					else
						return " ";
			    });
			    response = response.replace(/%dice:(\d+):(\d+)%/g, function (all, min, max) {
					return Math.floor(Math.random() * (Number(max) - Number(min) + 1)) + Number(min);
				});

				// Send back a response
	        	callBack(response);

	        });

		}

    }

    static getCommands() {
        return [
	    "^" + Config.irc.botname + ": ![\\w\\d+](\\[(del)?\\])?",
	    "^!facts$",
	    "^!factlist$",
	    "^!fact [\\w\\d-]+$",
	    "^![\\w\\d]+"
        ];
    }


	/**
	 *	Log a message
	 */
	static log(message) {
		Log.log("[Facts] " + message);
	}


	/**
	 *	Count the current facts
	 */
	static countFacts(callBack) {

		this._getConnection((conn) => {

			conn.query({sql: 'SELECT count(*) AS `count` FROM (SELECT DISTINCT `key` FROM facts) as factkeys'}, (err, rows) => {
				if (err) {
					FactsDB.log('Critical error:' + err);
					return;
				}

				// Close the connection
				conn.end();

				// Send the count back
				callBack(rows[0].count);
			});

		});

	}


	/**
	 *	Get a specific fact
	 */
	static getFact(key, callBack) {

		this._getConnection((conn) => {

			conn.query({sql: 'SELECT * FROM facts WHERE `key` = ?', values: [key]}, (err, rows) => {
				if (err) {
					FactsDB.log('Critical error:' + err);
					return;
				}

				// Close the connection
				conn.end();

				// Format fact
				var fact = {
					exists: rows.length > 0,
					is_array: rows.length > 0 && rows[0].is_array,
					key: key,
					responses: _.map(rows, (row) => { return row.response; }),
					users: _.unique(_.map(rows, (row) => { return row.nickname; })),
					uses: _.reduce(rows, (memo, row) => { return memo + row.uses; }, 0)
				};

				// Send the fact back
				callBack(fact);

			});

		});

	}


	/**
	 *	Get a list of all facts
	 */
	static getFacts(callBack) {

		this._getConnection((conn) => {

			conn.query({sql: 'SELECT * FROM facts'}, (err, rows) => {
				if (err) {
					FactsDB.log('Critical error:' + err);
					return;
				}

				// Close the connection
				conn.end();

				// Format facts
				var facts = {};
				for (var i in rows) {
					var row = rows[i];

					// Don't add a fact twice
					if (facts.hasOwnProperty(row.key))
						continue;

					// Get all facts with this key
					var keyfacts = _.where(rows, {key: row.key});

					// Format this keyfact
					facts[row.key] = {
						exists: true,
						is_array: keyfacts.length > 1,
						key: row.key,
						responses: _.map(keyfacts, (row) => { return row.response; }),
						users: _.unique(_.map(keyfacts, (row) => { return row.nickname; })),
						uses: _.reduce(keyfacts, (memo, row) => { return memo + row.uses; }, 0)
					};
				}

				// Send the fact back
				callBack(facts);

			});
		});
	}


	/**
	 *	Update the fact usage
	 */
	static updateFactUsage(key, response) {
		this._getConnection((conn) => {
			conn.query(
				'UPDATE facts SET uses = uses + 1 WHERE `key` = ? AND `response` = ?',
				[key, response.replace(/%/g, '%%')]
			);

			conn.end();
		});
	}



	/**
	 *	Create a connection to the mysql database
	 */
    static _getConnection(callBack) {
        // Get database info
        fs.readFile(__dirname + "/../data/logger.json", function (err, data) {
            if (err) {
                console.log("Error reading logger.json: " + err);
                return;
            }

            // Create mysql connection
            var config = JSON.parse(data);
            let connection = mysql.createConnection(config.db);
            connection.connect();

            // Prevent errors
            connection.on('error', (err) => { FactsDB.log('global error: ' + err); });

            // Send the connection object back
            callBack(connection);
        });
    }

}
