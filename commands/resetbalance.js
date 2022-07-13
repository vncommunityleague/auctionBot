const { ADMIN_ROLE_ID, BIDDER_ROLE_ID } = require('../modules/config');

module.exports = {
    data: {
        name: "resetbalance",
        description: "Reset toàn bộ số dư cả server",
        options: [{
            name: "amount",
            type: "INTEGER",
            description: "Số tiền mặc định khi reset",
            required: true,
        }],
    },
    handler: async (interaction, db) => {
        await interaction.guild.members.fetch();
        const bidders = interaction.guild.roles.cache.get(BIDDER_ROLE_ID).members.map(m => m.id);
        db.run(`DELETE
                FROM bidders`);

        const amount = interaction.options.get("amount").value;
        db.run(`INSERT INTO bidders (discord_id, balance)
                VALUES ${bidders.map(id => `(${id}, ${amount})`).join(",")}`)

        interaction.reply(`Đã reset số dư của ${bidders.length} bidders về \`${amount}\` `);
    }
}
