import * as Discord from "discord.js";
import { EmbedBuilder } from "discord.js";
import config from "../../config.json" with { type: 'json' }
import sendLog from "../../Events/sendlog.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'unmute',
	helpname: 'unmute <mention/id>',
	description: "Retire le timeout d'un membre.",
	help: 'unmute <mention/id>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
		if (!member) {
			return message.reply("Utilisateur introuvable.");
		}

		try {
			await member.timeout(null);
			message.reply(`<@${member.id}> a été unmute.`);
			const embed = new Discord.EmbedBuilder()
				.setColor(config.color)
				.setDescription(`<@${message.author.id}> a unmute <@${member.id}> (${member.id})`)
				.setTimestamp();

			sendLog(message.guild, embed, 'modlog');
		} catch (error) {
			console.error('Erreur lors du unmute :', error);
			return message.reply("Impossible de unmute.");
		}
	},
}