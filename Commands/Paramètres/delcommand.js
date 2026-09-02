import db from "../../Events/loadDatabase.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'delcommand',
	helpname: 'delcommand [perms] [commande]',
	aliases: ['delcmd', 'delcommande'],
	description: "Permet de retirer une commande d'une ou plusieurs permissions",
	help: 'delcommand [perms] [commande]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		if (!args[0] || args.length < 2) {
			return
		}


		const permLevels = args[0]
			.split(',')
			.map(level => {
				const trimmed = level.trim().toLowerCase();
				if (trimmed === "public") return "public";
				const num = parseInt(trimmed, 10);
				if (!isNaN(num) && num >= 1 && num <= 12) return num;
				return null;
			})
			.filter(level => level !== null);

		const commands = args.slice(1).join(' ').split(',').map(cmd => cmd.trim().toLowerCase());

		if (permLevels.length === 0) {
			return;
		}

		if (commands.length === 0) {
			return;
		}

		for (const permLevel of permLevels) {
			for (const command of commands) {
				db.run(
					`DELETE FROM cmdperm WHERE perm = ? AND command = ? AND guild = ?`,
					[permLevel, command, message.guild.id],
					(err) => {
						if (err) {
							return;
						}
					}
				);
			}
		}

		message.reply(`La commande \`${commands.join(', ')}\` a été retirée de la permission \`${permLevels.join(', ')}\`.`);
	},
}