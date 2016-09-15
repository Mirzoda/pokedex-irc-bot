const _ = require("underscore");
const _s = require("underscore.string");
var fs = require("fs");

import Log from '../common/Log.js';
import Cache from '../common/Cache.js';

const file = __dirname + '/../data/ignore.json';

export default class AutoIgnore {

    static catchAll(from, to, message, raw, pmCallback) {

        // Only read pokedex commands
        if (!_s.startsWith(message, '!'))
            return;

        // Get the userdata
        var user = Cache.instance.get('autoignore.' + raw.user, []);

        // Add the new message
        var now = Math.floor(new Date().getTime() / 1000);
        user.push(now);

        // Remove messages older than 10s
        for (var i in user) {
            if (user[i] < now - 10)
                delete user[i];
        }

        // If more than 5 messages, ignore the user for 5 minutes
        if (user.length > 5) {
            fs.readFile(file, (err, data) => {
                if (err) {
                    AutoIgnore.log('[!ERROR!] ' + err);
                    return;
                }

                // Set the ignore
                data = JSON.parse(data);
                if (!data.hasOwnProperty(from)) {
                    AutoIgnore.log('Ignoring ' + from + ' for 5 minutes...');
                    pmCallback("You are spamming too much and will be ignored for 5 minutes...");
                    data[from] = now + 300;
                }

                // Save the file
                fs.writeFile(file, JSON.stringify(data));

            });
        }

        // Save this in the cache
        Cache.instance.put('autoignore.' + raw.user, 1, user);

    }


    /**
     *  Clear the ignore list on startup
     */
    static init() {
        fs.writeFile(file, '{}');
    }


    /**
     *
     */
    static log(msg) {
        Log.log("[AutoIgnore] " + msg);
    }


    /**
     *  Check if users should be un-ignored
     */
    static minuteInvoke() {
        fs.readFile(file, (err, data) => {
            if (err) {
                AutoIgnore.log('[!ERROR!] ' + err);
                return;
            }

            data = JSON.parse(data);
            var now = Math.floor(new Date().getTime() / 1000);
            var changes = false;

            // Check users
            for (var user in data) {
                if (data[user] < now) {
                    delete data[user];
                    changes = true;
                }
            }

            // Write the file
            if (changes) {
                fs.writeFile(file, JSON.stringify(data));
            }
        });
    }

}
