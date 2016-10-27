const _ = require('underscore');
const fs = require('fs');

import Cache from '../common/Cache.js';
import Config from './../config.js';
import Log from '../common/Log.js';

const file = __dirname + '/../data/triviascore.json';

/**
 * Trivia bot
 * Let's play a quiz
 */
export default class Trivia {
    channels = [];

    /**
     *  We need to go over all answers to see if the correct answer is given
     */
    static catchAll(from, to, message, raw, pmCallBack, callBack) {
        // Make sure there is data in cache
        Cache.instance.rememberForever('trivia' + to, () => { return {} });

        // Do we have a question?
        var qa = Cache.instance.get('trivia' + to);
        if (!qa.hasOwnProperty("question")) {
            return;
        }

        // Does it match the answer?
        var correct = false;
        if (typeof qa.answer === "string")
            qa.answer = [qa.answer];
        for (var i in qa.answer) {
            if (qa.answer[i].toLowerCase() === message.toLowerCase()) {
                correct = true;
                break;
            }
        }
        if (correct) {

            // Create scorefile if needed
            try {
                fs.accessSync(file);
            } catch (e) {
                fs.writeFileSync(file, "{}");
            }

            // Add the score
            fs.readFile(file, (err, data) => {
                if (err) {
                    Trivia.log('Could not save trivia score: ' + err);
                    return;
                }

                // Parse the data
                var channels = {};
                try {
                    channels = JSON.parse(data);
                } catch (e) {}

                // Add score for this user
                var channel = {};
                if (channels.hasOwnProperty(to)) {
                    channel = channels[to];
                }
                if (channel.hasOwnProperty(from)) {
                    channel[from] += 1;
                } else {
                    channel[from] = 1;
                }

                // Write the data back to the file
                channels[to] = channel;
                fs.writeFile(file, JSON.stringify(channels));

                // Let the players know
                callBack("[Trivia] " + from + " is correct! " + from + " now has " + channel[from] + " points!");

            });

            // Stop the game
            Cache.instance.put('trivia' + to, -1, {});

        }


    }


    /**
     *  A trivia command has been triggered
     */
    static doCommand(command, from, to, callBack, pmCallBack) {
        if (typeof callBack !== "function")
            callBack = (msg) => {};

        if (command === '!trivia') {
            this.startTrivia(to, callBack, pmCallBack);
        }

    }


    /**
     *  The game has ended!
     */
    static endGame(channel, qa, callBack) {

        // End the game
        Cache.instance.put("trivia" + channel, -1, {});

        // Get the answer
        if (typeof qa.answer !== "string")
            qa.answer = qa.answer[0];

        // Let the users know
        callBack(channel, '[Trivia] Nobody guessed the answer and the time has run out!');
        callBack(channel, '[Trivia] The answer was "' + qa.answer + '".');
    }


    /**
     *  The commands we listen for
     */
    static getCommands() {
    	return [
    	    "^!trivia$",
    	    "^!triviascore$"
    	];
    }


    /**
     *  Give a hint about the answer
     */
    static giveHint(channel, minutes, data, callBack) {

        // How man letters do we reveal?
        var cntReveal = Math.floor(data.answer.length * (.2 * minutes));

        // Add function to replace at index
        String.prototype.replaceAt = function(index, character) {
            return this.substr(0, index) + character + this.substr(index+character.length);
        };

        // Get the answer
        var answer = data.answer;
        if (typeof answer !== "string")
            answer = data.answer[0];

        // Create a string
        var hint = new Array(answer.length + 1).join('_');
        if (data.hasOwnProperty('hintstr'))
            hint = data.hintstr;
        do
        {
            // Replace a character
            var index = _.random(0, answer.length - 1);
            hint = hint.replaceAt(index, answer[index]);
        }
        while ((hint.match(/_/g) || []).length > answer.length - cntReveal);

        // Send the hint to the users
        callBack(channel, "[Trivia] Let me give you a hint: " + hint);

        // Save the hintstring
        data.hintstr = hint;
        Cache.instance.put("trivia" + channel, -1, data);
    }


    /**
     *  Log something
     */
    static log(msg) {
        Log.log("[Trivia] " + msg);
    }


    /**
     *  If it takes too long, give a hint
     */
    static minuteInvoke(callBack) {

        // Loop over channels that have trivia as a module
        _.each(Config.irc.channels, (data, channel) => {
            if (data.modules.indexOf("Trivia") > -1) {

                // Get the data from cache
                var qa = Cache.instance.get("trivia" + channel);
                if (!qa.hasOwnProperty("question"))
                    return;

                // Do we need to give a hint?
                var minutes = Math.round((new Date().getTime() - qa.start) / 6e4);
                console.log(minutes);
                switch (minutes)
                {
                    case 1:
                    case 2:
                    case 3:
                        Trivia.giveHint(channel, minutes, qa, callBack);
                        break;

                    case 4:
                        Trivia.endGame(channel, qa, callBack);
                        break;

                    default:
                        break;
                }

            }
        });

    }


    /**
     *  Ask a new question
     */
    static startTrivia(channel, callBack, pmCallBack) {

        // Get the question object
        var data = Cache.instance.rememberForever('trivia' + channel, () => {
            return {};
        });

        // Are we playing already?
        if (data.hasOwnProperty("question")) {
            pmCallBack("A question is being played right now, answer that one first!");
            return;
        }

        // Load a new question
        fs.readdir(__dirname + "/../data/trivia/", (err, files) => {
            if (err) {
                Trivia.Log("Problem loading question files: " + err);
                return;
            }

            // No question files, no question to ask...
            if (files.length === 0) {
                Trivia.Log("No question files found...");
                return;
            }

            // Find a json file
            var file;
            do
            {
                file = _.sample(files);
            }
            while (!file.match(/\.json$/));

            fs.readFile(__dirname + "/../data/trivia/" + file, (err, data) => {
                if (err) {
                    Trivia.Log("Error reading file '" + file + "': " + err);
                    return;
                }

                // Pick a question
                data = JSON.parse(data);
                var qa = _.sample(data);
                qa.start = new Date().getTime();
                Cache.instance.put('trivia' + channel, -1, qa);

                // Send the question to the players
                callBack("[" + file.replace(/\.json$/, '') + "] " + qa.question);

            });
        });

    }

}
