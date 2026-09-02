import { EmbedBuilder } from 'discord.js';
import config from '../../config.json' with { type: 'json' };
import sendLog from '../../Events/sendlog.js';
import * as Discord from "discord.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'add',
	helpname: 'add <mention/id>',
	description: 'Permet d\'ajouter une personne au ticket',
	help: 'add <mention/id>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		const userArg = args[0];
		const user = message.mentions.users.first() || await bot.users.fetch(userArg).catch(() => null);
		if (!user) return;

		const channel = message.channel;
		await channel.permissionOverwrites.edit(user.id, { ViewChannel: true });

		message.reply(`${user} a été ajouté au ticket`);

		const embed = new Discord.EmbedBuilder()
			.setColor(config.color)
			.setDescription(`<@${message.author.id}> a ajouté <@${user.id}> au salon ${channel.name}`)
			.setTimestamp();

		sendLog(message.guild, embed, 'ticketlog');

	},
};