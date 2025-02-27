const Discord = require("discord.js");
const fs = require("fs");
const { TOKEN, GUILD_ID } = require('./config');

function importCommands() {
    const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));
    let commands = new Discord.Collection;
    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        commands.set(command.data.name, command);
    }
    return commands;
}

async function run(db) {
    let commands = importCommands();

    const intents = new Discord.Intents();
    intents.add(Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MEMBERS);
    const client = new Discord.Client({ intents });

    client.on("ready", async () => {
        console.log(`Logged in as ${client.user.tag}!`);

        const guild = await client.guilds.fetch(GUILD_ID);
        const guildCommands = await guild.commands.set(commands.map(c => c.data));
        console.log(`Registered commands ${commands.map((_, name) => name)}`);

        // Add IDs to commands dict
        for (const [id, command] of guildCommands.entries())
            commands.get(command.name).id = id;
    });

    client.on("interactionCreate", async interaction => {
        if (!interaction.isCommand()) return;
        const commandName = interaction.commandName.toLowerCase();
        console.log(`Received interaction "${commandName}" from "${interaction.user.username}"`)
        try {
            const command = commands.get(commandName);
            await command.handler(interaction, db);
        } catch (e) {
            console.error(e);
            try {
                await interaction.reply({
                    content: `Có lỗi xảy ra!\n\`${e}\``,
                    ephemeral: true,
                });
            } catch (e) {
                // interaction has already been replied to
                await interaction.followUp({
                    content: `Có lỗi xảy ra!\n\`${e}\``,
                    ephemeral: true,
                });
            }
        }
    });

    await client.login(TOKEN);
    return client;
}

module.exports = { run };
