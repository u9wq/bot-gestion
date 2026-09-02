import db from "../../Events/loadDatabase.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'setperm',
	helpname: 'setperm [perms] [role]',
	description: "Permet d'ajouter une permission à un rôle",
	help: 'setperm [perms] [role]',
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

		db.get('SELECT * FROM permissions WHERE id = ? AND guild = ?', [role.id, message.guild.id], (err, row) => {
			if (err) {
				console.error("Erreur lors de la vérification des permissions dans la base de données :", err);
				return;
			}

			if (row) {
				return
			}

			db.run(`INSERT INTO permissions (perm, id, guild) VALUES (?, ?, ?)`,
				[permLevel, role.id, message.guild.id],
				(err) => {
					if (err) {
						console.error("Erreur lors de l'ajout du rôle dans la base de données :", err);
						return;
					}
					message.reply(`Le rôle \`${role.name}\` est maintenant lié à la permission \`${permLevel}\`.`);
				}
			);
		});
	},
}