import Channel from './common/Channel.js';
import Config from './config.js';

// Libraries
const _ = require('underscore');
const fs = require('fs');
const irc = require('irc');

// The actual class
export default class Pokedex {
	catchAlls = [];
    client = null;
    commands = {};
    modules = {};

    constructor () {

		// Load required modules dynamicaly
		for (var ch in Config.irc.channels) {
			var channel = Config.irc.channels[ch];
			for (var m in channel.modules) {
				var mod = channel.modules[m];
					this.modules[mod] = require("./commands/" + mod + ".js")["default"];
			}
		}

        // Load a list of Commands
		this.commands = {};
		this.catchAlls = [];
		this.doKicks = [];
		this.doTopics = [];
		this.minuteInvokes = [];
        for (var i in this.modules) {
            var c = this.modules[i];

			// Execute init functions
		    if (c.init)
		        c.init();

			// Add catchalls
		    if (c.catchAll)
		    	this.catchAlls.push(i);

			// Add kick catches
			if (c.doKick)
				this.doKicks.push(i);

		    // Add topic catches
		    if (c.doTopic)
		    	this.doTopics.push(i);

		    // Add invokes for every minute
		    if (c.minuteInvoke)
				this.minuteInvokes.push(i);

			// Add commands to the list
			if (c.getCommands) {
	            for (var j in c.getCommands()) {
	                this.commands[c.getCommands()[j]] = i;
	            }
			}
        }

    }

    init () {

		// Create irc connection
		this.client = new irc.Client(Config.irc.server, Config.irc.botname, {
    	    channels: _.keys(Config.irc.channels),
	    	autoConnect: false,
	    	autoRejoin: true,
	    	retryCount: 10,
	    	userName: Config.irc.botname
        });

		// Prevent message flooding
		this.client.activateFloodProtection();

		// Keep track of the users in the channels
		this.users = {};
		for (var i in _.keys(Config.irc.channels)) {
		    var channel = _.keys(Config.irc.channels)[i];
		    var client = this.client;
		    (function (channel, client) {
				client.addListener('names' + channel, (nicks) => {
    	            var users = [];
    	            for (var user in nicks) {
		  	        	users.push(user);
		            }

			    	Channel.instance.set(channel, {users});
		        });
		    } (channel, client));
		}

		// Create an event for incomming messages
		(function(catchalls, client, commands, doTopics, doKicks, modules) {

			let msgevent = (from, to, message, raw) => {

				fs.readFile(__dirname + '/data/ignore.json', (err, ignoredata) => {
					if (err) {}

					// Make sure the user is not in the ignore list
					if (ignoredata) {
						ignoredata = JSON.parse(ignoredata);
						if (ignoredata.hasOwnProperty(from)) {
							return;
						}
					}

				    // Only read messages from channels or admins
				    if (_.keys(Config.irc.channels).indexOf(to) === -1 && Config.irc.isAdmin(to, from))
						return;

				    // Don't reply to your own messages! moron!
				    if (Config.irc.botname === from)
						return;

				    // Loop over commands to match one of them
				    for (var i in commands) {
			   	        var regex = i;
		                if (message.match(new RegExp(regex))) {
						    modules[commands[i]].doCommand(message, from, to,
						    	(msg, customTo) => {
									to = typeof customTo !== 'undefined' ? customTo : to;

						    		// Viveslan 28 Oliental!
						    		//msg = msg.replace(/r/g, 'l');
						    		//msg = msg.replace(/R/g, 'L');

									if (msg.indexOf("/me ") === 0)
									    client.action(to, msg.substr(4));
									else
							            client.say(to, msg);
					    		},
					    		(msg) => {
					    			client.say(from, msg);
					    		},
					    		raw
				    		);
				 	    	break;
				        }
				    }

				    // Send the message to the catchalls
				    _.each(catchalls, (mod) => {
				    	if (Config.irc.isChannelModule(to, mod)) {
					    	var ca = modules[mod];
					    	ca.catchAll(from, to, message, raw, (msg) => {
					    		client.say(from, msg);
					    	}, (msg) => {
					    		client.say(to, msg);
					    	});
				    	}
				    });

				});

	        };

	        client.addListener('action', (from, to, message, raw) => {
				msgevent(from, to, "/me " + message, raw);
			});
			client.addListener('kick', (channel, nick, by, reason, message) => {
			    _.each(doKicks, (mod) => {
			    	if (Config.irc.isChannelModule(channel, mod)) {
				    	var dk = modules[mod];
				    	dk.doKick(channel, nick, by, reason, message);
			    	}
			    });
			});
			client.addListener('message', msgevent);
			client.addListener('topic', (channel, topic, nick, raw) => {
				_.each(doTopics, (mod) => {
			    	if (Config.irc.isChannelModule(channel, mod)) {
				    	var dt = modules[mod];
			    		dt.doTopic(channel, topic, nick, raw);
			    	}
			    });
			});

		} (this.catchAlls, this.client, this.commands, this.doTopics, this.doKicks, this.modules));


		// Set the minuteInvokes (every minute)
		(function (client, minuteInvokes, modules) {
			setInterval(() => {
				_.each(minuteInvokes, (mod) => {
			    	var mi = modules[mod];
		    		mi.minuteInvoke((channel, message) => {
						client.say(channel, message);
					});
			    });
			}, 6e4);
		} (this.client, this.minuteInvokes, this.modules));

		// Connect to irc!
		this.client.connect();

    }
}
