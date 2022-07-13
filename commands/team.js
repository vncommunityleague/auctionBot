const { BIDDER_ROLE_ID } = require('../modules/config');

module.exports = {
    data: {
        name: "team",
        description: "Hiển thị team của bạn",
    },
    handler: async (interaction, db) => {
        const rows = await db.all(`
            SELECT *
            FROM players p,
                 bids b
            WHERE p.user_id = b.player_id
              AND b.final_bidder = '${interaction.user.id}';`,
        );

        if (!rows.length) {
            interaction.reply({ content: "Bạn chưa săn ai về đội cả!", ephemeral: true });
            return;
        }

        interaction.reply({ content: rows.map(p => `${p.username} ($${p.sale_value})`).join("\n") })
    }
}
