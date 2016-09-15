import Channel from './common/Channel.js';
import Config from './config.js';

// Command classes
import AutoIgnore from './commands/AutoIgnore.js';
//import CAH from './commands/CardsAgainstHumanity.js';
import Countdown from './commands/Countdown.js';
import EightBall from './commands/EightBall.js';
import Facts from './commands/Facts.js';
import Jokes from './commands/Jokes.js';
import Logger from './commands/Logger.js';
//import PingPong from './commands/PingPong.js';
import PokedexCommand from './commands/PokedexCommand.js';
import Rio2016 from './commands/Rio2016.js';
import User from './commands/User.js';
import Wiki from './commands/Wiki.js';

// Libraries
const fs = require('fs');
const irc = require('irc');

// The actual class
export default class Pokedex {
	catchAlls = [];
    client = null;
    commands = {};

    constructor () {

        // Classes
        var classes = [
        	AutoIgnore,
        	//CAH,
	    	Countdown,
	    	EightBall,
	    	Jokes,
	    	Logger,
	    	//PingPong,
	    	PokedexCommand,
	    	Rio2016,
	    	User,
            Wiki,
	    	Facts
        ];

        // Load a list of Commands
		this.commands = {};
		this.catchAlls = [];
		this.doKicks = [];
		this.doTopics = [];
		this.minuteInvokes = [];
        for (var i in classes) {
            var c = classes[i];

			// Execute init functions
		    if (c.init)
		        c.init();

			// Add catchalls
		    if (c.catchAll)
		    	this.catchAlls.push(c);

			// Add kick catches
			if (c.doKick)
				this.doKicks.push(c);

		    // Add topic catches
		    if (c.doTopic)
		    	this.doTopics.push(c);

		    // Add invokes for every minute
		    if (c.minuteInvoke)
				this.minuteInvokes.push(c);

			// Add commands to the list
			if (c.getCommands) {
	            for (var j in c.getCommands()) {
	                this.commands[c.getCommands()[j]] = c;
	            }
			}
        }

    }

    init () {

		// Create irc connection
		this.client = new irc.Client(Config.irc.server, Config.irc.botname, {
    	    channels: Config.irc.channels,
	    	autoConnect: false,
	    	autoRejoin: true,
	    	retryCount: 10
        });

		// Prevent message flooding
		this.client.activateFloodProtection();

		// Keep track of the users in the channels
		this.users = {};
		for (var i in Config.irc.channels) {
		    var channel = Config.irc.channels[i];
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
		var commands = this.commands;
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
			    if (Config.irc.channels.indexOf(to) === -1 && Config.irc.admins.indexOf(from) === -1)
					return;

			    // Don't reply to your own messages! moron!
			    if (Config.irc.botname === from)
					return;

			    // Loop over commands to match one of them
			    for (var i in commands) {
		   	        var regex = i;
	                if (message.match(new RegExp(regex))) {
					    commands[regex].doCommand(message, from, to, (msg) => {
							if (msg.indexOf("/me ") === 0)
							    client.action(to, msg.substr(4));
							else
					            client.say(to, msg);
				    	});
			 	    	break;
			        }
			    }

			    // Send the message to the catchalls
			    for (var i in this.catchAlls) {
			    	var ca = this.catchAlls[i];
			    	ca.catchAll(from, to, message, raw, (msg) => {
			    		client.say(from, msg);
			    	});
			    }

			});

        };

        this.client.addListener('action', (from, to, message, raw) => {
			msgevent(from, to, "/me " + message, raw);
		});
		this.client.addListener('kick', (channel, nick, by, reason, message) => {
			for (var i in this.doKicks) {
		    	var dk = this.doKicks[i];
		    	dk.doKick(channel, nick, by, reason, message);
		    }
		});
		this.client.addListener('message', msgevent);
		this.client.addListener('topic', (channel, topic, nick, raw) => {
			for (var i in this.doTopics) {
		    	var dt = this.doTopics[i];
		    	dt.doTopic(channel, topic, nick, raw);
		    }
		});

		// Set the minuteInvokes (every five minutes)
		(function (client, minuteInvokes) {
			setInterval(() => {
				for (var i in minuteInvokes) {
					var mi = minuteInvokes[i];
					mi.minuteInvoke((channel, message) => {
						client.say(channel, message);
					});
				}
			}, 6e4);
		} (this.client, this.minuteInvokes));

		// Connect to irc!
		this.client.connect();

    }
}
