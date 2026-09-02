import { EmbedBuilder } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import config from '../../Utils/config.js';
import sendLog from '../../Events/sendlog.js';
import * as Discord from "discord.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'rename',
	helpname: 'rename <message>',
	description: 'Permet de renommer un ticket',
	help: 'rename <message>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		if (!args[0]) {
			return;
		}

		db.get('SELECT channelId FROM ticketchannel WHERE channelId = ?', [message.channel.id], async (err, row) => {
			if (err) {
				console.error(err);
				return;
			}
			if (!row) {
				return message.reply("Ce salon n’est pas un ticket.");
			}

			const anc = message.channel.name;
			const nouv = args.join(' ');

			await message.channel.setName(nouv).catch(() => { });

			const embed = new EmbedBuilder()
				.setDescription(`Le ticket a été renommé en ${nouv}`)
				.setColor(config.color);

			message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });

			const logs = new Discord.EmbedBuilder()
				.setColor(config.color)
				.setDescription(`<@${message.author.id}> a renommé le salon ${anc} en ${nouv}`)
				.setTimestamp();

			sendLog(message.guild, logs, 'ticketlog');
		});
	},
}