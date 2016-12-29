const fs = require("fs");
const moment = require("moment");
const mysql = require("mysql");

import Log from '../common/Log.js';

/**
 * Simple command that displays users in the channel.
 * Only for testing purposes...
 */
export default class Vote {

    static doCommand(command, from, to, callBack, pmCallBack, raw) {
        if (typeof callBack !== "function")
            callBack = (msg) => {};

        // Remove the voting object if voting is over
        if (this.vote != null && this.vote.ending_at < new Date().getTime())
        {
            this._endVoting(callBack);
            return;
        }

        // A new voting session is starting
        if (command.indexOf("!newvote") === 0)
        {
            // Any vote in progress?
            if (this.vote != null) {
                callBack(from + ": a vote is already in progress, \"" + this.vote.question + "\".");
                callBack("Voting ends in " + moment.duration(this.vote.ending_at - this.vote.created_at, 'milliseconds').humanize());
                return;
            }

            // The vote paramters
            var params = command.replace(/^!newvote\s+/, '').split('|');
            var customanswers = false;
            var question = params[params.length - 1].trim();
            var created_at = new Date().getTime();
            var ending_at = created_at;
            for (var i in params) {
                if (params[i].trim() === "+c")
                {
                    customanswers = true;
                }
                else if (params[i].trim().match(/^\d+$/))
                {
                    var minutes = params[i].trim() * 1;
                    if (minutes > 15)
                        minutes = 15;

                    ending_at += minutes * 6e4;
                }
            }
            var vote = {question, customanswers, ending_at, created_at};

            // Insert the object in the database
            this._getConnection(function (connection) {
                Vote._getChannelAndUser(connection, raw, to, (userid) => {

                    // Add some extra parameters
                    vote.channel = to;
                    vote.user_id = userid;
                    vote.username = from;
                    vote.votes = {};

                    // Insert the object
                    connection.query(
                        "INSERT INTO voteQuestions SET ?",
                        {
                            user_id: vote.user_id,
                            username: vote.username,
                            channel: vote.channel,
                            question: vote.question,
                            customanswers: vote.customanswers,
                            created_at: moment(vote.created_at).format(),
                            ending_at: moment(vote.ending_at).format()
                        },
                        (err, result) => {

                            // Save the local object
                            vote.id = result.insertId;
                            Vote.vote = vote;

                        }
                    );
                    connection.end();

                    // Let the other users know
                    callBack(from + " is starting a vote, \"" + question + "\"!");
                    callBack("Voting ends in " + moment.duration(vote.ending_at - vote.created_at, 'milliseconds').humanize());

                });
            });
        }
        else if (command == "!voteyes" || command == "!voteno")
        {
            // A vote must be in progress first
            if (this.vote == null)
                return;

            // Get database information
            this._getConnection(function (connection) {
                Vote._getChannelAndUser(connection, raw, to, (userid) => {

                    // Make sure the user hasn't already voted
                    if (Vote.vote.votes.hasOwnProperty(from)) {
                        pmCallBack("You already voted for the current vote, wait for the results!");
                        return;
                    }

                    // Insert the vote in the database
                    connection.query(
                        "INSERT INTO votes SET ?",
                        {
                            user_id: userid,
                            username: from,
                            votequestion_id: Vote.vote.id,
                            voteyes: command == "!voteyes" ? 1 : 0
                        }
                    );
                    connection.end();

                    // Save the vote in a local object
                    Vote.vote.votes[from] = command == "!voteyes";

                    // Let the users know
                    var yes = 0, no = 0;
                    for (var i in Vote.vote.votes) {
                        if (Vote.vote.votes[i])
                            yes++;
                        else
                            no++;
                    }
                    callBack(from + " voted \"" + (command == "!voteyes" ? "Yes" : "No") + "\". Current results: " + yes + " Yes, " + no + " No");

                });
            });
        }
        else if (command == "!votequestion")
        {
            if (this.vote == null)
                return;

            callBack("The current vote by " + Vote.vote.username + " is \"" + Vote.vote.question + "\".");
        }
        else if (command == "!votetime")
        {
            if (this.vote == null)
                return;

            callBack("Voting ends in " + moment.duration(this.vote.ending_at - this.vote.created_at, 'milliseconds').humanize());
        }
        else if (command == "!endvote")
        {
            if (this.vote == null)
                return;

            // Make sure the user is the admin
            this._getConnection(function (connection) {
                Vote._getChannelAndUser(connection, raw, to, (userid) => {

                    if (userid != Vote.vote.user_id)
                        return;

                    // Set the stopped date
                    connection.query("UPDATE voteQuestions SET stopped_at = ? WHERE id = ?", [ moment().format(), Vote.vote.id ]);
                    connection.end();

                    // Stop the voting
                    Vote._endVoting(callBack);

                });
            });

        }
    }


    /**
     *  Stop if the voting is over!
     */
    static minuteInvoke(callBack) {
        if (this.vote != null && this.vote.ending_at < new Date().getTime())
            this._endVoting(callBack, true);
    }


    static getCommands() {
    	return [
    	    //"^!dontvote",
    	    "^!endvote$",
    	    "^!newvote",
    	    "^!voteno$",
    	    "^!votequestion$",
    	    "^!votetime$",
    	    "^!voteyes$",
    	    //"^!vote (.+?)$"
    	];
    }


    /**
     *  Voting has ended, display the stats!
     */
    static _endVoting(callBack, addChannel) {
        addChannel = addChannel || false;

        // Voting has ended, display the results
        var yes = 0, no = 0;
        for (var i in Vote.vote.votes) {
            if (Vote.vote.votes[i])
                yes++;
            else
                no++;
        }

        if (addChannel)
        {
            callBack(
                Vote.vote.channel,
                "Voting for \"" + Vote.vote.question + "\" has ended!. Results: " + yes + " Yes, " + no + " No"
            );
        }
        else
        {
            callBack("Voting for \"" + Vote.vote.question + "\" has ended!. Results: " + yes + " Yes, " + no + " No");
        }

        // Clear the vote object
        Vote.vote = null;
    }


    /**
     *  Make sure the channel exists in the database and get the user id
     */
    static _getChannelAndUser(connection, raw, to, callBack) {

        // No raw data, no log
        if (!raw) {
            connection.end();
            return;
        }

        // Find the channel in the db
        connection.query(
            "SELECT name FROM channels WHERE name = ?",
            [to],
            (err, rows) => {
                if (err) {
                    Vote.log("mysql error: " + err);
                    return;
                }

                // Function to get the user once we have the channel
                var getUser = function (channel) {

                    connection.query(
                        "SELECT id FROM users WHERE name = ? AND host = ?",
                        [ raw.user, raw.host ],
                        (err, rows) => {
                            if (err) {
                                Vote.log("mysql error: " + err);
                                return;
                            }

                            // New user?
                            if (rows.length === 0) {
                                connection.query(
                                    "INSERT INTO users SET ?",
                                    {
                                        name: raw.user,
                                        host: raw.host
                                    },
                                    (err, result) => {
                                        if (err) {
                                            Log.log('User insert error: ' + err);
                                            return;
                                        }

                                        // Insert worked, get the user info
                                        callBack(result.insertId);
                                    }
                                );
                            } else {
                                callBack(rows[0]["id"]);
                            }
                        }
                    );

                };

                // The channel has to be created
                if (rows.length === 0) {
                    connection.query(
                        "INSERT INTO channels SET ?",
                        { name: to },
                        (err, result) => {
                            if (err) {
                                Log.log('Channel insert error: ' + err);
                                return;
                            }

                            // Insert worked, get the user info
                            getUser(to);
                        }
                    );
                } else {
                    getUser(to);
                }
            }
        );

    }


    /**
     *  Create a database connectino
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
            connection.on('error', (err) => { Vote.log('global error: ' + err); });

            // Send the connection object back
            callBack(connection);
        });
    }


    /**
     *  Log anything to the console
     */
    static log(msg) {
        Log.log("[Logger] " + msg);
    }

}
