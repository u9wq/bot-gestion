import * as Discord from "discord.js";
import db from "../../Events/loadDatabase.js";
import { EmbedBuilder } from "discord.js";
import config from "../../config.json" with { type: 'json' }
import sendLog from "../../Events/sendlog.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'close',
	helpname: 'close',
	description: 'Permet de close le ticket',
	help: 'close',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		db.get('SELECT channelId FROM ticketchannel WHERE channelId = ?', [message.channel.id], async (err, row) => {
			if (err) return console.error(err);
			if (!row) return;

			const channelName = message.channel.name;

			db.run('DELETE FROM ticketchannel WHERE channelId = ?', [message.channel.id], (err2) => {
				if (err2) console.error(err2);
			});

			const embed = new Discord.EmbedBuilder()
				.setColor(config.color)
				.setDescription(`<@${message.author.id}> a fermé le ticket ${channelName}`)
				.setTimestamp();

			sendLog(message.guild, embed, 'ticketlog');
			message.channel.delete().catch(() => { });
		});
	},
}