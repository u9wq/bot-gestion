import db from "../../Events/loadDatabase.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'unowner',
	helpname: 'unowner <mention/id>',
	description: 'Permet de retirer un utilisateur de la liste des owners',
	help: 'unowner [mention/id]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		const user = message.mentions.users.first() || await bot.users.fetch(args[0]).catch(() => null);
		if (!user) {
			return
		}

		db.run(`DELETE FROM owner WHERE id = ?`, [user.id], function (err) {
			if (err) {
				return
			}

			if (this.changes === 0) {
				return message.reply(`<@${user.id}> n'était pas dans la liste des owners`);
			}

			message.reply(`<@${user.id}> a été retiré de la liste des owners`);
		});
	},
}