const Discord = require("discord.js")
const { MIN_INCREMENT, INITIAL_TIMER, IDLE_TIMER, MAX_BID } = require('../modules/config');
const MAX_MEMBERS = 4;

function checkBid(bidValue, bidInteraction, balance, teamMembers, saleValue) {
    if (teamMembers.length == MAX_MEMBERS) { 
        bidInteraction.reply({ 
            content: `Bạn đã vượt quá giới hạn số người chơi cho phép là ${teamMembers.length}!`, 
            ephemeral: true, 
        }); 
        return false; 
    }

    if (bidValue > MAX_BID) {
        bidInteraction.reply({
            content: `Bạn chỉ được bid tối đa ${MAX_BID}! Đặt bid ${MAX_BID} để đưa thành viên về đội ngay lập tức!`,
            ephemeral: true,
        });
        return false;
    }

    if (bidValue > balance) {
        bidInteraction.reply({
            content: `Bạn không thể bid nhiều hơn số tiền đang có! (${balance})`,
            ephemeral: true,
        });
        return false;
    }

    if (teamMembers.length < 2 && bidValue > balance * 0.75) {
        bidInteraction.reply({
            content: `Bạn không thể bid nhiều hơn 75% số tiền còn lại (${balance * 0.75}) trước khi đội có ít nhất 2 thành viên!`,
            ephemeral: true,
        });
        return false;
    }

    if (bidValue < saleValue + MIN_INCREMENT) {
        bidInteraction.reply({
            content: `You have to bid at least ${saleValue + MIN_INCREMENT} or higher!`,
            ephemeral: true,
        });
        return false;
    }

    if (bidValue % MIN_INCREMENT !== 0) {
        bidInteraction.reply({
            content: `The bid was not an increment of ${MIN_INCREMENT}!`,
            ephemeral: true,
        });
        return false;
    }

    return true;
}

function initCollector(interaction, db, player) {
    let saleValue = MIN_INCREMENT;
    let lastBidder = null;

    const collector = new Discord.InteractionCollector(interaction.client, {
        channel: interaction.channel,
        time: INITIAL_TIMER,
    });

    collector.on("collect", async bidInteraction => {
        if (!bidInteraction.isCommand()) return;
        if (bidInteraction.commandName.toLowerCase() !== "bid") return;

        const bidValue = bidInteraction.options.get("amount").value;
        const teamMembers = await db.all(`
            SELECT *
            FROM bids
            WHERE final_bidder = '${bidInteraction.user.id}'`,
        );
        const { balance } = await db.get(`
            SELECT balance
            FROM bidders
            WHERE discord_id = '${bidInteraction.user.id}'
        `);

        if (!checkBid(bidValue, bidInteraction, balance, teamMembers, saleValue)) return;

        saleValue = bidValue;
        lastBidder = bidInteraction.user.id;
        bidInteraction.reply(`${bidInteraction.member.displayName} bids ${bidValue}.`);

        if (bidValue === MAX_BID) collector.stop();
        collector.resetTimer({ time: IDLE_TIMER });
    });

    collector.on("end", async () => {
        if (lastBidder == null) {
            await interaction.followUp("No one has bid on the player.");
            await db.run(`
                UPDATE bids
                SET ongoing = FALSE
                WHERE ongoing = TRUE;
            `)
        } else {
            const bidderName = interaction.guild.members.cache.get(lastBidder).displayName;
            await interaction.followUp(`${player.username} has been sold to ${bidderName} for ${saleValue}`);
            await db.run(`
                UPDATE bids
                SET sale_value   = ${saleValue},
                    final_bidder = '${lastBidder}',
                    ongoing      = FALSE
                WHERE ongoing = TRUE;
            `);
            await db.run(`
                UPDATE bidders
                SET balance = balance - ${saleValue}
                WHERE discord_id = '${lastBidder}';
            `);
        }
    });
}

function generatePlayerCard(player) {
    return {
        "content": "Bidding has started! Use `/bid <amount>` to start placing a bid.",
        "embeds": [
            {
                "color": 5814783,
                "fields": [
                    {
                        "name": "Rank",
                        "value": `#${player.rank}`,
                        "inline": true,
                    },
                    {
                        "name": "Country",
                        "value": `:flag_${player.country.toLowerCase()}:`,
                        "inline": true,
                    }
                ],
                "author": {
                    "name": player.username,
                    "url": "https://osu.ppy.sh/users/" + player.user_id,
                    "icon_url": `https://a.ppy.sh/${player.user_id}?.png`,
                },
                "footer": {
                    "text": "Rank is from end of signups",
                },
            },
        ],
    };
}

module.exports = {
    data: {
        name: "newsale",
        description: "Create a new sale",
    },
    handler: async (interaction, db) => {
        const ongoing = await db.get(`
            SELECT *
            FROM bids
            WHERE ongoing = TRUE`,
        );

        if (ongoing) {
            interaction.reply("There is already a sale ongoing!")
            return;
        }

        // Random available player
        const player = await db.get(`
            SELECT *
            FROM players
            WHERE user_id NOT IN (SELECT player_id FROM bids)
            ORDER BY RANDOM()
            LIMIT 1;`,
        );

        if (!player) {
            interaction.reply("No more players to auction!");
            return;
        }

        // create bid
        await db.run(`
            INSERT INTO bids (player_id, sale_value, ongoing, start_time)
            VALUES (?, 0, TRUE, datetime('now'))
        `, player.user_id)

        interaction.reply(generatePlayerCard(player))

        initCollector(interaction, db, player);
    }
}
