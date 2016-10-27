import Pokedex from './Pokedex.js';
import Log from './common/Log.js';

(function () {

    "use strict";

    // Verry safe crash handling ;)
    // process.on('uncaughtException', function (err) {
    //     Log.log("[!Pokedex!] Error: ");
    //     Log.log(err);
    // });

    // Start the pokedex bot!
    let pokedex = new Pokedex();
    pokedex.init();

}());
