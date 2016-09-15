export default {

	"irc": {
		"botname": "Pokedex2",
		"channels": {
			"#pokedextest": {
				"admins": ["Nuva"],
				"modules": [
					"Logger",
					"AutoIgnore",
					"EightBall",
					"Facts"
				]
			}
		},
		"server": "portlane.se.quakenet.org",

		isAdmin: function (channel, username) {
			return this.channels.hasOwnProperty(channel)
				&& this.channels[channel].hasOwnProperty("admins")
				&& this.channels[channel].admins.indexOf(username) > -1;
		},

		isChannelModule: function (channel, mod) {
			return this.channels.hasOwnProperty(channel)
				&& this.channels[channel].hasOwnProperty("modules")
				&& this.channels[channel].modules.indexOf(mod) > -1;
		}
	}

};
