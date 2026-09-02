import * as Discord from "discord.js";
import { EmbedBuilder } from "discord.js";
import config from '../../Utils/config.js';
import sendLog from "../../Events/sendlog.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'addrole',
	helpname: 'addrole <mention/id> <@role/id>',
	description: "Ajoute un rôle à un membre.",
	help: 'addrole <mention/id> <@role/id>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

		const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
		if (!role) {
			return
		}

		if (message.member.roles.highest.position <= role.position) {
			return message.reply("Vous ne pouvez pas ajouter un rôle supérieur au votre.");
		}

		try {
			await member.roles.add(role);
			message.reply(`Le rôle a été ajouté à <@${member.id}>.`);

			const embed = new Discord.EmbedBuilder()
				.setColor(config.color)
				.setDescription(`<@${message.author.id}> a ajouté le role ${role} (<@${role.id}>) à <@${member.id}> (${member.id})`)
				.setTimestamp();

			sendLog(message.guild, embed, 'rolelog');
		} catch (error) {
			console.error(error);
			return
		}
	},
}