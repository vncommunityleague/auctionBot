const { ADMIN_ROLE_ID } = require('../modules/config');

module.exports = {
    data: {
        name: "allteams",
        description: "Kiểm tra lineup của bidder",
    },
    handler: async (interaction, db) => {
        const rows = await db.all(`
            SELECT *
            FROM bidders`,
        );

        if (!rows.length) interaction.reply({ content: "Không có bidder nào tồn tại!", ephemeral: true });
        else {
            const output = [];
            await interaction.guild.members.fetch();
            for (const r of rows) {
                const member = interaction.guild.members.cache.get(r.discord_id);
                const teamMembers = await db.all(`
                    SELECT p.username
                    FROM bids b,
                         players p
                    WHERE b.player_id = p.user_id
                      AND b.final_bidder = '${member.id}';
                `);
                if (teamMembers.length)
                    output.push(`${member.displayName} | ${teamMembers.map(p => p.username).join(", ")}`);
                else
                    output.push(`${member.displayName} | -`);
            }
            interaction.reply({ content: output.join("\n") });
        }
    }
}
