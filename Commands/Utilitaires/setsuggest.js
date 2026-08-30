import db from "../../Events/loadDatabase.js";
import { denyIfNoPerm } from '../../Utils/perms.js';
import { notice, send } from '../../Utils/ui.js';
import { suggestPanel } from '../../Utils/panels.js';

export const command = {
	name: 'setsuggest',
	helpname: 'setsuggest <salon/off>',
	description: 'Permet de configurer le salon de suggestions',
	help: 'setsuggest <salon/off>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		if (!args[0]) {
			return send(message.channel, notice(
				`Usage : \`${config.prefix}setsuggest <salon/off>\``,
				config.color
			));
		}

		if (args[0].toLowerCase() === 'off') {
			return db.run(`UPDATE Suggest SET channel = ? WHERE guildId = ?`, ['off', message.guild.id], (err) => {
				if (err) return send(message.channel, notice('Erreur lors de la désactivation.', config.color));
				send(message.channel, notice('Le système de suggestions a été désactivé.', config.color));
			});
		}

		const channelId = args[0].replace('<#', '').replace('>', '');
		const suggestChannel = message.guild.channels.cache.get(channelId);

		if (!suggestChannel || suggestChannel.type !== 0) {
			return send(message.channel, notice('Le salon doit être un salon textuel.', config.color));
		}

		db.get('SELECT channel FROM Suggest WHERE guildId = ?', [message.guild.id], async (err, row) => {
			if (err) return send(message.channel, notice('Erreur SQL.', config.color));

			if (!row) {
				db.run('INSERT INTO Suggest (guildId, channel) VALUES (?, ?)', [message.guild.id, channelId]);
			} else {
				db.run('UPDATE Suggest SET channel = ? WHERE guildId = ?', [channelId, message.guild.id]);
			}

			await send(suggestChannel, await suggestPanel(message.guild, config));
			await send(message.channel, notice(`Le salon de suggestions est <#${channelId}>`, config.color));
		});
	},
}
