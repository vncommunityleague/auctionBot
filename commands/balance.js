const { BIDDER_ROLE_ID } = require('../modules/config');

module.exports = {
    data: {
        name: "balance",
        description: "Kiểm tra số dư của bạn",
    },
    handler: async (interaction, db) => {
        const row = await db.get(`
                    SELECT balance
                    FROM bidders
                    WHERE discord_id = ?`,
            interaction.user.id,
        );

        const content = row ? `Số dư của bạn: ${row.balance}` : "Chưa có dữ liệu, vui lòng gọi nhân viên hỗ trợ!";
        interaction.reply({ content, ephemeral: true });
    },
}
