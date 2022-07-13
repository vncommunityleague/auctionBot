const { ADMIN_ROLE_ID, BIDDER_ROLE_ID } = require('../modules/config');

module.exports = {
    data: {
        name: "setbalance",
        description: "Thay đổi số dư của bidder",
        options: [{
            name: "amount",
            type: "INTEGER",
            description: "Số dư cần thay đổi",
            required: true,
        }, {
            name: "user",
            type: "USER",
            description: "Tên người cần thay đổi",
            required: true,
        }],
    },
    handler: async (interaction, db) => {
        const { member } = interaction.options.get("user");
        if (!member.roles.cache.get(BIDDER_ROLE_ID)) {
            await interaction.reply("Người được ping ko phải là bidder!");
            return;
        }
        const amount = interaction.options.get("amount").value;

        db.run(`REPLACE INTO bidders (discord_id, balance)
                VALUES ('${member.id}', ${amount})`)

        await interaction.reply(`Đã thay đổi số dư của ${member.displayName} thành ${amount}`);
    }
}
