import { EmbedBuilder } from "discord.js";
import db from "../../Events/loadDatabase.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'ticketoption',
	helpname: 'ticketoption',
	description: "Permet de gérer les catégories de ticket (rôles ping automatiques inclus)",
	help: 'ticketoption add <label> [@role...] | remove <id> | list | setroles <id> [@role...] | setlabel <id> <label>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const sub = args[0]?.toLowerCase();
		const roleIds = message.mentions.roles.map(r => r.id);

		if (sub === 'add') {
			const label = args.slice(1).join(' ').replace(/<@&\d+>/g, '').trim();
			if (!label) {
				return message.reply(`Indique un label. Exemple : \`${config.prefix}ticketoption add Buy Shop @RoleStaff\`. Les rôles sont optionnels.`);
			}
			db.run('INSERT INTO ticketoptions (guild, label, roles) VALUES (?, ?, ?)',
				[message.guild.id, label, roleIds.join(',')],
				function (err) {
					if (err) { console.error(err); return message.reply('Erreur lors de la création.'); }
					message.reply(`Catégorie **${label}** créée (ID: \`${this.lastID}\`)${roleIds.length ? ` avec ${roleIds.length} rôle(s) ping automatique(s)` : ' sans rôle ping'}.`);
				});
			return;
		}

		if (sub === 'remove') {
			const id = parseInt(args[1]);
			if (!id) return message.reply(`Indique l'ID de la catégorie. Voir \`${config.prefix}ticketoption list\`.`);
			db.run('DELETE FROM ticketoptions WHERE id = ? AND guild = ?', [id, message.guild.id], function (err) {
				if (err) return message.reply('Erreur.');
				if (this.changes === 0) return message.reply('Catégorie introuvable.');
				db.run('DELETE FROM ticketsuboptions WHERE parentId = ? AND guild = ?', [id, message.guild.id]);
				message.reply('Catégorie supprimée (ainsi que ses éventuelles sous-catégories).');
			});
			return;
		}

		if (sub === 'list') {
			db.all('SELECT * FROM ticketoptions WHERE guild = ?', [message.guild.id], (err, rows) => {
				if (err || !rows || rows.length === 0) {
					return message.reply(`Aucune catégorie de ticket configurée. Utilise \`${config.prefix}ticketoption add <label>\`.`);
				}
				db.all('SELECT parentId, COUNT(*) as count FROM ticketsuboptions WHERE guild = ? GROUP BY parentId', [message.guild.id], (err2, subRows) => {
					const subCounts = {};
					(subRows || []).forEach(r => { subCounts[r.parentId] = r.count; });

					const embed = new EmbedBuilder()
						.setTitle('Catégories de ticket')
						.setColor(config.color)
						.setDescription(rows.map(r => {
							const roles = r.roles ? r.roles.split(',').filter(Boolean).map(id => `<@&${id}>`).join(', ') : 'Aucun';
							const subInfo = subCounts[r.id] ? ` *(${subCounts[r.id]} sous-catégorie(s), voir \`${config.prefix}ticketsuboption list ${r.id}\`)*` : '';
							return `**ID \`${r.id}\`** — ${r.label}${subInfo}\nRôles ping automatique : ${roles}`;
						}).join('\n\n'));
					message.reply({ embeds: [embed] });
				});
			});
			return;
		}

		if (sub === 'setroles') {
			const id = parseInt(args[1]);
			if (!id) return message.reply(`Indique l'ID de la catégorie. Voir \`${config.prefix}ticketoption list\`.`);
			db.run('UPDATE ticketoptions SET roles = ? WHERE id = ? AND guild = ?', [roleIds.join(','), id, message.guild.id], function (err) {
				if (err) return message.reply('Erreur.');
				if (this.changes === 0) return message.reply('Catégorie introuvable.');
				message.reply(roleIds.length ? `Rôles ping automatique mis à jour (${roleIds.length}).` : 'Rôles ping automatique retirés de cette catégorie.');
			});
			return;
		}

		if (sub === 'setlabel') {
			const id = parseInt(args[1]);
			const label = args.slice(2).join(' ').replace(/<@&\d+>/g, '').trim();
			if (!id || !label) return message.reply(`Utilisation : \`${config.prefix}ticketoption setlabel <id> <label>\``);
			db.run('UPDATE ticketoptions SET label = ? WHERE id = ? AND guild = ?', [label, id, message.guild.id], function (err) {
				if (err) return message.reply('Erreur.');
				if (this.changes === 0) return message.reply('Catégorie introuvable.');
				message.reply(`Label mis à jour : **${label}**`);
			});
			return;
		}

		message.reply(`Sous-commande invalide. Voir \`${config.prefix}help ticketoption\`.`);
	},
};