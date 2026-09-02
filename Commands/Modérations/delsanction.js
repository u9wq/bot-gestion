import * as Discord from "discord.js";
import db from "../../Events/loadDatabase.js";
import { EmbedBuilder } from "discord.js";
import config from '../../Utils/config.js';
import sendLog from "../../Events/sendlog.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'delsanction',
	helpname: 'delsanction <mention/id> <nombre>',
	description: 'Permet de retirer la sanction d\'un membre',
	help: 'delsanction <mention/id> <nombre>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		const user = message.mentions.users.first() || await bot.users.fetch(args[0]).catch(() => null);
		if (!user) return;

		const sanctionNumber = parseInt(args[1], 10);
		if (isNaN(sanctionNumber)) {
			return message.reply("Le numéro de sanction est invalide.");
		}

		db.all('SELECT id FROM sanctions WHERE userId = ? AND guild = ? ORDER BY date DESC', [user.id, message.guild.id], (err, rows) => {
			if (err) {
				console.error('Erreur lors de la récupération des sanctions:', err);
				return;
			}

			if (sanctionNumber < 1 || sanctionNumber > rows.length) {
				return message.reply("Le numéro de sanction est invalide.");
			}

			const sanctionToRemove = rows[sanctionNumber - 1].id;
			db.run('DELETE FROM sanctions WHERE id = ?', [sanctionToRemove], (err) => {
				if (err) {
					console.error('Erreur lors de la suppression de la sanction:', err);
					return;
				}
				db.all('SELECT id FROM sanctions WHERE userId = ? AND guild = ? ORDER BY date DESC', [user.id, message.guild.id], (err, updatedRows) => {
					if (err) {
						console.error('Erreur lors de la réorganisation des sanctions:', err);
						return;
					}

					updatedRows.forEach((row, index) => {
						db.run('UPDATE sanctions SET rowid = ? WHERE id = ?', [index + 1, row.id], (err) => {
							if (err) {
								console.error('Erreur lors de la mise à jour des sanctions:', err);
							}
						});
					});

					message.reply(`La sanction #${sanctionNumber} de <@${user.tag}> a été supprimée.`);
					const embed = new Discord.EmbedBuilder()
						.setColor(config.color)
						.setDescription(`<@${message.author.id}> a supprimé la sanction #${sanctionNumber} de <@${user.tag}> (${user.id})`)
						.setTimestamp();

					sendLog(message.guild, embed, 'modlog');
				});
			});
		});
	},
}