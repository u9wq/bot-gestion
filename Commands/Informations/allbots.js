import { EmbedBuilder } from 'discord.js';
import config from '../../config.json' with { type: 'json' };
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'allbots',
	helpname: 'allbots',
	description: "Permet de voir la liste des bots",
	help: 'allbots',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const bots = message.guild.members.cache.filter(member => member.user.bot);

		if (bots.size === 0) {
			return message.reply({ content: "Aucun bot sur le serveur.", allowedMentions: { repliedUser: false } });
		}

		const embed = new EmbedBuilder()
			.setTitle('Liste des Bots')
			.setDescription(bots.map(bot => `<@${bot.user.id}> - ${bot.user.id}`).join('\n'))
			.setColor(config.color)
			.setFooter({ text: bot.user.username });

		return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
	},
};