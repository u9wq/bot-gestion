import db from "../../Events/loadDatabase.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'soutien',
	helpname: 'soutien <clear/role> <texte>',
	description: "Permet de configurer le soutien",
	help: 'soutien <clear/role> <texte>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		if (args[0] && args[0].toLowerCase() === 'clear') {
			db.run('DELETE FROM soutien WHERE guild = ?', [message.guild.id], (err) => {
				if (err) return message.reply("Une erreur est survenue lors du clear.");
				return message.reply("Le soutien est désactivé.");
			});
			return;
		}

		const text = args.slice(1).join(" ");
		let role = null;

		if (message.mentions.roles.size > 0) {
			role = message.mentions.roles.first();
		} else if (args[0] && message.guild.roles.cache.get(args[0])) {
			role = message.guild.roles.cache.get(args[0]);
		}

		db.run(
			`CREATE TABLE IF NOT EXISTS soutien (guild TEXT PRIMARY KEY, id TEXT, texte TEXT)`,
			[],
			(err) => {
				if (err) return message.reply("Une erreur est survenue.");
				db.run(
					`INSERT OR REPLACE INTO soutien (guild, id, texte) VALUES (?, ?, ?)`,
					[message.guild.id, role.id, text],
					(err) => {
						if (err) return message.reply("Une erreur est survenue.");
						message.reply(`Rôle soutien ${role} - Texte: ${text}`);
					}
				);
			}
		);
	},
}