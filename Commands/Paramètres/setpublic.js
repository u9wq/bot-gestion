import db from "../../Events/loadDatabase.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'setpublic',
	helpname: 'setpublic <on/off>',
	description: "Active ou désactive les commandes publiques.",
	help: 'setpublic <on/off>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const value = args[0]?.toLowerCase();

		try {
			if (value === 'on') {
				await new Promise((resolve, reject) => {
					db.run('INSERT OR REPLACE INTO public (statut, guild) VALUES (?, ?)', ['on', message.guild.id], (err) => {
						if (err) reject(err);
						else resolve();
					});
				});
				return message.reply("Le mode public est activé.");
			} else {
				await new Promise((resolve, reject) => {
					db.run('DELETE FROM public WHERE guild = ?', [message.guild.id], (err) => {
						if (err) reject(err);
						else resolve();
					});
				});
				return message.reply("Le mode public est désactivé.");
			}
		} catch (error) {
			console.error('Erreur lors du changement du mode public :', error);
			return message.reply("Une erreur est survenue.");
		}
	},
}