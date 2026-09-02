import * as Discord from "discord.js";
import { EmbedBuilder } from "discord.js";
import config from '../../Utils/config.js';
import sendLog from "../../Events/sendlog.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'renew',
	helpname: 'renew [salon]',
	description: 'Permet de recréer un salon',
	help: 'renew [salon]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;



		const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;

		await message.delete();
		const clone = await channel.clone({ reason: 'Renew' });
		await channel.delete();
		const newMessage = await clone.send(`Le salon a été recréé par <@${message.author.id}>`);
		const embed = new Discord.EmbedBuilder()
			.setColor(config.color)
			.setDescription(`<@${message.author.id}> a recréé <#${channel.id}>`)
			.setTimestamp();

		sendLog(message.guild, embed, 'modlog');
		setTimeout(() => newMessage.delete().catch(console.error), 4000);
		try {
			await clone.setPosition(channel.position);
		} catch (error) {
			return
		}
	},
}