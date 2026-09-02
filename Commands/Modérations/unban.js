import * as Discord from "discord.js";
import { EmbedBuilder } from "discord.js";
import config from "../../config.json" with { type: 'json' }
import sendLog from "../../Events/sendlog.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'unban',
	helpname: 'unban <id>',
	description: "Permet de unban",
	help: 'unban <id>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const userId = args[0];
		if (!userId) {
			return message.reply("Veuillez fournir l'ID de l'utilisateurs.");
		}

		try {
			await message.guild.members.unban(userId);
			message.reply(`<@${userId}> a été unban.`);
			const embed = new Discord.EmbedBuilder()
				.setColor(config.color)
				.setDescription(`<@${message.author.id}> a débanni <@${userId}> (${userId})`)
				.setTimestamp();

			sendLog(message.guild, embed, 'modlog');
		} catch (error) {
			console.error('Erreur lors du débannissement :', error);
			return message.reply("L'utilisateur n'est pas banni.");
		}
	},
}