const fs = require('fs');

fs.readFile(__dirname + '/dist/data/facts.json', function(err, data) {
    if (err) {
        console.log(err);
        return;
    }

    data = JSON.parse(data);

    for (var i in data) {

        var fact = data[i];

        // Make sure the responses is an array
        var responses = fact[1];
        if (typeof fact[1] !== "object")
            responses = [fact[1]];

        // Loop over responses
        for (var j in responses) {
            console.log(
                "\"" + i + "\",\"" + responses[j].replace(/\"/g, "'") + "\",\"" + fact[0] + "\"," + (j == 0 ? fact[2] : 0) + "," + (responses.length > 1 ? 1 : 0)
            );

        }
    }
});