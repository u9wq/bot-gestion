import db from "../../Events/loadDatabase.js";
import { denyIfNoPerm } from '../../Utils/perms.js';
import { notice, send } from '../../Utils/ui.js';

export const command = {
	name: 'setvouch',
	helpname: 'setvouch [salon/off]',
	description: 'Permet de configurer le salon des avis',
	help: "setvouch [salon/off]\nSans argument, choisit le salon dans lequel la commande est tapée.\n`off` renvoie les avis là où /vouch est utilisée.",
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		if (args[0] && args[0].toLowerCase() === 'off') {
			return db.run('DELETE FROM vouchchannel WHERE guild = ?', [message.guild.id], (err) => {
				if (err) {
					console.error(err);
					return send(message.channel, notice('Erreur lors de la désactivation.', config.color));
				}
				send(message.channel, notice(
					"Salon des avis désactivé. Les avis s'afficheront de nouveau là où `/vouch` est utilisée.",
					config.color
				));
			});
		}

		let channel = message.channel;

		if (args[0]) {
			const id = args[0].replace(/[<#>]/g, '').trim();
			channel = message.guild.channels.cache.get(id);
			if (!channel || channel.type !== 0) {
				return send(message.channel, notice('Le salon doit être un salon textuel.', config.color));
			}
		}

		db.run('INSERT OR REPLACE INTO vouchchannel (guild, channel) VALUES (?, ?)',
			[message.guild.id, channel.id], (err) => {
				if (err) {
					console.error(err);
					return send(message.channel, notice('Erreur SQL.', config.color));
				}
				send(message.channel, notice(
					`Les avis seront désormais publiés dans <#${channel.id}>.`,
					config.color
				), { allowedMentions: { parse: [] } });
			});
	},
}
