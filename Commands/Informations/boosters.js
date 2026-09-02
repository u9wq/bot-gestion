import { EmbedBuilder } from 'discord.js';
import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'boosters',
	helpname: 'boosters',
	description: "Permet de voir la liste des boosters",
	help: 'boosters',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const boosters = message.guild.members.cache.filter(member => member.premiumSince);

		if (boosters.size === 0) {
			return message.reply({ content: "Aucun booster sur le serveur.", allowedMentions: { repliedUser: false } });
		}

		const embed = new EmbedBuilder()
			.setTitle('Liste des Boosters')
			.setDescription(boosters.map(booster => `<@${booster.user.id}> - ${booster.user.id}`).join('\n'))
			.setColor(config.color)
			.setFooter({ text: bot.user.username });

		return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
	},
}