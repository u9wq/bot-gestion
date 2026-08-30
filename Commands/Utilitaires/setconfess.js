import db from "../../Events/loadDatabase.js";
import { denyIfNoPerm } from '../../Utils/perms.js';
import { notice, send } from '../../Utils/ui.js';
import { confessPanel } from '../../Utils/panels.js';

export const command = {
	name: 'setconfess',
	helpname: 'setconfess <salon/off>',
	description: 'Permet de configurer le salon de confession',
	help: 'setconfess <salon/off>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		if (!args[0]) {
			return send(message.channel, notice(
				`Usage : \`${config.prefix}setconfess <salon/off>\``,
				config.color
			));
		}

		if (args[0].toLowerCase() === 'off') {
			return db.get(`SELECT channel FROM Confess WHERE guildId = ?`, [message.guild.id], (err, row) => {
				if (err) return send(message.channel, notice('Erreur SQL.', config.color));

				if (row && row.channel === 'off') {
					return send(message.channel, notice(`<@${message.author.id}>, le salon est déjà désactivé`, config.color));
				}

				if (!row) {
					db.run(`INSERT INTO Confess (guildId, channel) VALUES (?, ?)`, [message.guild.id, 'off']);
				} else {
					db.run(`UPDATE Confess SET channel = ? WHERE guildId = ?`, ['off', message.guild.id]);
				}

				send(message.channel, notice(`<@${message.author.id}>, le salon a bien été désactivé !`, config.color));
			});
		}

		const channelId = args[0].replace('<#', '').replace('>', '');
		const confessChannel = message.guild.channels.cache.get(channelId);

		if (!confessChannel || confessChannel.type !== 0) {
			return send(message.channel, notice(`<@${message.author.id}>, le salon est invalide`, config.color));
		}

		db.get(`SELECT channel FROM Confess WHERE guildId = ?`, [message.guild.id], async (err, row) => {
			if (err) return send(message.channel, notice('Erreur SQL.', config.color));

			if (row && row.channel === channelId) {
				return send(message.channel, notice(`<@${message.author.id}>, le salon est déjà configuré sur ce salon`, config.color));
			}

			if (!row) {
				db.run(`INSERT INTO Confess (guildId, channel) VALUES (?, ?)`, [message.guild.id, channelId]);
			} else {
				db.run(`UPDATE Confess SET channel = ? WHERE guildId = ?`, [channelId, message.guild.id]);
			}

			await send(confessChannel, await confessPanel(message.guild, config));
			await send(message.channel, notice(`<@${message.author.id}>, le salon des confessions a bien été activé`, config.color));
		});
	},
}
