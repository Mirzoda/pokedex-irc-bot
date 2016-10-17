import Config from '../config.js';

export default class Say {

    static doCommand(msg, from, to, callBack) {
        if (to === Config.irc.botname && Config.irc.globaladmins.indexOf(from) > -1) {

            var channel = msg.replace(/^say (\#.*?) (.*)$/, '$1');
            var say = msg.replace(/^say (\#.*?) (.*)$/, '$2');

            callBack(say, channel);

        }
    }

    static getCommands() {
        return [
            "^say (\#.+?) (.+)$"
        ];
    }

}
