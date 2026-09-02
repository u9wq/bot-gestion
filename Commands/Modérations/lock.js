import * as Discord from "discord.js";
import { EmbedBuilder } from "discord.js";
import config from "../../config.json" with { type: 'json' }
import sendLog from "../../Events/sendlog.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'lock',
	helpname: 'lock [salon]',
	description: 'Permet de verrouiller un salon',
	help: 'lock [salon]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		const channel = message.mentions.channels.first() || message.channel;

		try {
			await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
				[Discord.PermissionFlagsBits.SendMessages]: false,
			});

			const infoMessage = await channel.send(`Le salon a été verrouillé par <@${message.author.id}>.`);
			const embed = new Discord.EmbedBuilder()
				.setColor(config.color)
				.setDescription(`<@${message.author.id}> a lock <#${channel.id}>`)
				.setTimestamp();

			sendLog(message.guild, embed, 'modlog');
			setTimeout(() => {
				infoMessage.delete().catch(console.error);
			}, 3000);

			await message.delete().catch(console.error);
		} catch (err) {
			console.error('Erreur lors du verrouillage du salon:', err);
		}
	},
}