import { EmbedBuilder } from 'discord.js';
import config from "../../config.json" with { type: 'json' }
import * as Discord from "discord.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'ping',
	helpname: 'ping',
	description: "Permet d'afficher la latence du bot",
	help: 'ping',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const botLatency = Date.now() - message.createdTimestamp;
		const apiLatency = bot.ws.ping;

		const embed = new Discord.EmbedBuilder()
			.setDescription(`Latence: \`${botLatency}\` ms\nDiscord API: \`${apiLatency}\` ms`)
			.setFooter({ text: "Une faible latence = exécution rapide des commandes" })
			.setColor(config.color);

		return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
	},
};