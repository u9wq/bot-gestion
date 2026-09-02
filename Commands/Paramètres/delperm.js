import config from '../../config.json' with { type: 'json' };
import db from '../../Events/loadDatabase.js';
import { denyIfNoPerm } from '../../Utils/perms.js';


export const command = {
	name: 'delperm',
	helpname: 'delperm [perms] [role]',
	description: "Permet de retirer un rôle d'une permission",
	help: 'delperm [perms] [role]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;



		if (!args[0] || !args[1]) {
			return
		}

		const permLevel = parseInt(args[0], 10);
		if (isNaN(permLevel) || permLevel < 1 || permLevel > 12) {
			return
		}

		const role = message.guild.roles.cache.get(args[1].replace(/[<@&>]/g, ''));
		if (!role) {
			return
		}

		db.get('SELECT * FROM permissions WHERE perm = ? AND id = ? AND guild = ?',
			[permLevel, role.id, message.guild.id],
			(err, row) => {
				if (err) {
					return
				}

				if (!row) {
					return
				}

				db.run('DELETE FROM permissions WHERE perm = ? AND id = ? AND guild = ?',
					[permLevel, role.id, message.guild.id],
					(err) => {
						if (err) {
							return
						}
						message.reply(`Le rôle \`${role.name}\` a été retiré de la permission \`${permLevel}\``);
					}
				);
			}
		);
	},
}