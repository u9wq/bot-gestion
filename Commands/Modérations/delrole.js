import * as Discord from "discord.js";
import { EmbedBuilder } from "discord.js";
import config from "../../config.json" with { type: 'json' }
import sendLog from "../../Events/sendlog.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'delrole',
	helpname: 'delrole <mention/id> <@role/id>',
	description: "Retire un rôle à un membre.",
	help: 'delrole <mention/id> <@role/id>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
		if (!member) {
			return message.reply("Utilisateur introuvable.");
		}

		const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
		if (!role) {
			return message.reply("Rôle introuvable.");
		}

		if (message.member.roles.highest.position <= role.position) {
			return message.reply("Vous ne pouvez pas retirer un rôle à un membre supérieur à vous.");
		}

		try {
			await member.roles.remove(role);
			message.reply(`Le rôle ${role} a été retiré à <@${member.id}>.`);
			const embed = new Discord.EmbedBuilder()
				.setColor(config.color)
				.setDescription(`<@${message.author.id}> a retiré le rôle ${role} de <@${member.id}> (${member.id})`)
				.setTimestamp();

			sendLog(message.guild, embed, 'rolelog');
		} catch (error) {
			console.error('Erreur lors du retrait du rôle :', error);
			return message.reply("Impossible de retirer le rôle.");
		}
	},
}