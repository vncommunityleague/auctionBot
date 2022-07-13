const { ADMIN_ROLE_ID } = require('../modules/config');

module.exports = {
    data: {
        name: "ping",
        description: "Pong!",
    },
    handler: async (interaction, _) => await interaction.reply("Pong!"),
}
