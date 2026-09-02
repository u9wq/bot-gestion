import 'dotenv/config';
import Discord from 'discord.js';
import config from './Utils/config.js';

import commandHandler from './Handler/Commands.js';
import slashCommandHandler from './Handler/slashCommands.js';
import eventHandler from './Handler/Events.js';
import anticrashHandler from './Handler/anticrash.js';
import giveawayHandler from './Handler/giveaways.js';

const bot = new Discord.Client({
	intents: 3276799,
	partials: [
		Discord.Partials.Channel,
		Discord.Partials.Message,
		Discord.Partials.User,
		Discord.Partials.GuildMember,
		Discord.Partials.Reaction,
		Discord.Partials.ThreadMember,
		Discord.Partials.GuildScheduledEvent
	]
});

bot.commands = new Discord.Collection();
bot.slashCommands = new Discord.Collection();
bot.setMaxListeners(70);

anticrashHandler(bot);
giveawayHandler(bot, config);

// Les écouteurs sont enregistrés avant la connexion, sinon les premiers
// événements reçus par le client n'ont personne pour les traiter.
await commandHandler(bot);
await slashCommandHandler(bot);
await eventHandler(bot);

try {
	await bot.login(process.env.TOKEN);
} catch (error) {
	console.error('\x1b[31m[!] Connexion impossible. Vérifiez TOKEN dans .env et activez les intents privilégiés.\x1b[0m');
	console.error(error.message);
	process.exit(1);
}
