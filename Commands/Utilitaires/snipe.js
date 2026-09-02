import Discord from "discord.js"
import { EmbedBuilder } from "discord.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'snipe',
	helpname: 'snipe',
	description: "Permet d'afficher le dernier message qui a été supprimé",
	help: 'snipe',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		if (!bot.deletedMessages) {
			bot.deletedMessages = new Map();
		}

		const deletedMessages = bot.deletedMessages;
		const logsalon = deletedMessages.get(message.channel.id);

		if (!logsalon) {
			return message.reply({ content: "Aucun message n'a été supprimé récemment", allowedMentions: { repliedUser: false } });
		}

		const { msg, content } = logsalon;

		const embed = new Discord.EmbedBuilder()
			.setAuthor({ name: msg.author.tag, iconURL: msg.author.displayAvatarURL({ dynamic: true }) })
			.setDescription(content)
			.setColor(config.color)
			.setTimestamp(msg.deletedAt || new Date());

		return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
	},
}