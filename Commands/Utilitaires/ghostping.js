import db from "../../Events/loadDatabase.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'ghostping',
	helpname: 'ghostping <#1,#etc>',
	description: "Permet de configurer le ghostping",
	help: "ghostping <#01,#02,..>\nTu peux définir plusieurs salons en les séparant par des virgules sans espaces",
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		const channelId = args.join(' ').split(',').map(str => str.replace(/[<#> ]/g, '')).filter(Boolean);
		if (channelId.length === 0) return

		db.run(
			`CREATE TABLE IF NOT EXISTS ghostping (guild TEXT PRIMARY KEY, channels TEXT)`,
			[],
			(err) => {
				if (err) return
				db.run(
					`INSERT OR REPLACE INTO ghostping (guild, channels) VALUES (?, ?)`,
					[message.guild.id, channelId.join(',')],
					(err) => {
						if (err) return
						message.reply("Les salons pour le Ghostping: " + channelId.map(id => `<#${id}>`).join(', '));
					}
				);
			}
		);
	},
}