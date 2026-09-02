import { EmbedBuilder } from 'discord.js';
import config from '../../config.json' with { type: 'json' };
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'allbans',
	helpname: 'allbans',
	description: "Permet de voir la liste des membres bannis",
	help: 'allbans',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const bans = await message.guild.bans.fetch();

		if (bans.size === 0) {
			return message.reply({ content: "Aucune personne a été banni sur le serveur.", allowedMentions: { repliedUser: false } });
		}

		const embed = new EmbedBuilder()
			.setTitle('Liste des bannissements')
			.setDescription(bans.map(ban => `<@${ban.user.id}> - ${ban.user.tag}`).join('\n'))
			.setColor(config.color)
			.setFooter({ text: bot.user.username });

		return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
	},
}