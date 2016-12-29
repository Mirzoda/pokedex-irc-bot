const _ = require('underscore');

import Cache from '../common/Cache.js';

export default class EightBall {

    static doCommand(msg, from, to, callBack) {
        if (msg.match(/^!hoe/)) {
            callBack(
                Cache.instance.remember("eightball_" + encodeURI(msg), 15, function () {
                    return _.sample([
                        'Met de auto van zijn zus',
                        'Via irc',
                        'Met die fiets die hij gisteren gepikt heeft',
                        'Via een teleporter',
                        'Met een toetsenbord',
                        'Met zijn kreditkaart'
                    ]);
                })
            );

            return;
        }

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
                        'Was dat gisteren niet?',
                        'In 5... 4... 3... 2...'
                    ]);
                })
            );

            return;
        }

        if (msg.match(/^!wat/)) {
            callBack(
                Cache.instance.remember("eightball_" + encodeURI(msg), 15, function () {
                    return _.sample([
                        'Dat weet ik toch niet...',
                        'Dat is allesinds iets heel vies :s',
                        'Het zelfde als dat van jou',
                        _.random(3, 9) + ' appelsienen',
                        'Iets vre plakkerig',
                        'Bakken sneeuw die gisteren uit de lucht vielen',
                        'Een ssh tunnel',
                        'Ne watermeloen'
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

            "^!hoe ",

            "^!wanneer ",

            "^!wat "
        ];
    }

}
