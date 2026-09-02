import db from "../../Events/loadDatabase.js";
import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'piconly',
	helpname: 'piconly <#salon>',
	description: "Permet de définir un salon pour le piconly.",
	help: 'piconly <#salon>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const channel = message.mentions.channels.first();
		if (!channel) {
			return message.reply("Veuillez mentionner un salon valide.");
		}

		db.run(`INSERT OR REPLACE INTO piconly_channels (guild, channel_id) VALUES (?, ?)`, [message.guild.id, channel.id], (err) => {
			if (err) {
				console.error('Erreur lors de la sauvegarde du salon piconly :', err);
				return message.reply("Une erreur est survenue");
			}

			message.reply(`Le salon <#${channel.id}> est configuré pour le piconly.`);
		});
	},
}