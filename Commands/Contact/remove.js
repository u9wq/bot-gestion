import { EmbedBuilder } from 'discord.js';
import config from '../../config.json' with { type: 'json' };
import sendLog from '../../Events/sendlog.js';
import * as Discord from "discord.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'remove',
	helpname: 'remove <mention/id>',
	description: 'Permet de retirer une personne du ticket',
	help: 'remove <mention/id>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const userArg = args[0];
		const user = message.mentions.users.first() || await bot.users.fetch(userArg).catch(() => null);
		if (!user) return;

		const channel = message.channel;
		channel.permissionOverwrites.edit(user.id, { ViewChannel: false })
			.then(() => {
				message.reply(`${user} a été enlevé du ticket`);

				const embed = new Discord.EmbedBuilder()
					.setColor(config.color)
					.setDescription(`<@${message.author.id}> a remove <@${user.id}> du salon ${channel.name}`)
					.setTimestamp();

				sendLog(message.guild, embed, 'ticketlog');
			}
			)
	},
}