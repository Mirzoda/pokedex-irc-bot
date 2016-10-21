const _ = require('underscore');

import Cache from '../common/Cache.js';

export default class EightBall {

    static doCommand(msg, from, to, callBack) {
        if (msg.match(/^!wanneer/)) {
            callBack(
                Cache.instance.remember("eightball_" + encodeURI(msg), 15, function () {
                    return _.sample([
                        _.random(2, 6) + ' maand geleden',
                        'Gisteren',
                        'Ik dacht dat dat morgen was.',
                        'Lang voor uwen tijd',
                        'Misschien ooit, wie weet...',
                        'Morgen',
                        'NEVAH!',
                        'Nooit',
                        'Over ' + _.random(2, 6) + ' maand ongeveer',
                        'Was dat gisteren niet?'
                    ]);
                })
            );

            return;
        }


        callBack(
            Cache.instance.remember("eightball_" + encodeURI(msg), 15, function () {

                var responses = [
                    "Ja",
                    "Ja!",
                    "Misschien ooit eens...",
                    "Natuurlijk",
                    "Natuurlijk!",
                    "Natuurlijk niet",
                    "Natuurlijk niet!",
                    "Nee",
                    "Nee!"
                ];

                return _.sample(responses);

            })
        );

    }

    static getCommands() {
        return [
            "^!kan ",
            "^!heeft ",
            "^!is ",
            "^!moet ",
            "^!wil ",
            "^!zal ",
            "^!zou ",

            "^!wanneer "
        ];
    }

}
