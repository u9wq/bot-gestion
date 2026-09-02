import * as Discord from "discord.js";
import { EmbedBuilder } from "discord.js";
import config from "../../config.json" with { type: 'json' }
import sendLog from "../../Events/sendlog.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'unlock',
	helpname: 'unlock [salon]',
	description: 'Permet de déverrouiller un salon',
	help: 'unlock [salon]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const channel = message.mentions.channels.first() || message.channel;

		try {
			await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
				[Discord.PermissionFlagsBits.SendMessages]: null,
			});

			const infoMessage = await channel.send(`Le salon a été déverrouillé par <@${message.author.id}>.`);
			const embed = new Discord.EmbedBuilder()
				.setColor(config.color)
				.setDescription(`<@${message.author.id}> a unlock <#${channel.id}>`)
				.setTimestamp();

			sendLog(message.guild, embed, 'modlog');
			setTimeout(() => {
				infoMessage.delete().catch(console.error);
			}, 3000);

			await message.delete().catch(console.error);
		} catch (err) {
			console.error('Erreur lors du déverrouillage du salon:', err);
		}
	},
}