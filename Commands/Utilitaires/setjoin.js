import db from "../../Events/loadDatabase.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'setjoin',
	helpname: 'setjoin <salon/off> <message>',
	description: 'Permet de configurer un message de bienvenue',
	help: 'setjoin <salon/off> <message>\nVoir la commande variable',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const arg = message.content.trim().split(/ +/g);

		if (arg[1].toLowerCase() === "off") {
			db.run(`UPDATE joinsettings SET channel = ?, message = ? WHERE guildId = ?`, ['off', '', message.guild.id], function (err) {
				if (err) return message.reply("Erreur lors de la désactivation ou est-ce déjà désactivé ?");
				return message.reply("Le message de bienvenue a bien été désactivé.");
			});
		}

		const channelId = arg[1].replace("<#", "").replace(">", "");
		const joinChannel = message.guild.channels.cache.get(channelId);
		if (!joinChannel || joinChannel.type !== 0) {
			return message.reply("Le salon doit etre un salon textuel.");
		}

		const joinMsg = arg.slice(2).join(" ");

		db.get('SELECT channel FROM joinsettings WHERE guildId = ?', [message.guild.id], (err, row) => {
			if (err) return message.reply("Erreur SQL.");
			if (!row) {
				db.run('INSERT INTO joinsettings (guildId, channel, message) VALUES (?, ?, ?)', [message.guild.id, channelId, joinMsg]);
			} else {
				db.run('UPDATE joinsettings SET channel = ?, message = ? WHERE guildId = ?', [channelId, joinMsg, message.guild.id]);
			}
			message.reply(`Le salon de bienvenue a bien été configuré.`);
		});
	},
}