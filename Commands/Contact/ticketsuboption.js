import { EmbedBuilder } from "discord.js";
import db from "../../Events/loadDatabase.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'ticketsuboption',
	helpname: 'ticketsuboption',
	description: "Permet de gérer les sous-catégories d'une catégorie de ticket (menu affiché uniquement à l'utilisateur après son choix de catégorie)",
	help: 'ticketsuboption add <parentId> <label> [@role...] | remove <id> | list <parentId> | setroles <id> [@role...] | setlabel <id> <label>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const sub = args[0]?.toLowerCase();
		const roleIds = message.mentions.roles.map(r => r.id);

		const getParent = (parentId) => new Promise((resolve, reject) => {
			db.get('SELECT * FROM ticketoptions WHERE id = ? AND guild = ?', [parentId, message.guild.id], (err, row) => {
				if (err) reject(err);
				resolve(row);
			});
		});

		if (sub === 'add') {
			const parentId = parseInt(args[1]);
			const label = args.slice(2).join(' ').replace(/<@&\d+>/g, '').trim();
			if (!parentId || !label) {
				return message.reply(`Utilisation : \`${config.prefix}ticketsuboption add <parentId> <label> [@role...]\`. Voir \`${config.prefix}ticketoption list\` pour les ID de catégorie. Les rôles sont optionnels.`);
			}

			const parent = await getParent(parentId).catch(() => null);
			if (!parent) return message.reply('Catégorie parente introuvable.');

			db.run('INSERT INTO ticketsuboptions (guild, parentId, label, roles) VALUES (?, ?, ?, ?)',
				[message.guild.id, parentId, label, roleIds.join(',')],
				function (err) {
					if (err) { console.error(err); return message.reply('Erreur lors de la création.'); }
					message.reply(`Sous-catégorie **${label}** créée sous **${parent.label}** (ID: \`${this.lastID}\`)${roleIds.length ? ` avec ${roleIds.length} rôle(s) ping automatique(s)` : ' sans rôle ping'}.`);
				});
			return;
		}

		if (sub === 'remove') {
			const id = parseInt(args[1]);
			if (!id) return message.reply(`Indique l'ID de la sous-catégorie. Voir \`${config.prefix}ticketsuboption list <parentId>\`.`);
			db.run('DELETE FROM ticketsuboptions WHERE id = ? AND guild = ?', [id, message.guild.id], function (err) {
				if (err) return message.reply('Erreur.');
				if (this.changes === 0) return message.reply('Sous-catégorie introuvable.');
				message.reply('Sous-catégorie supprimée.');
			});
			return;
		}

		if (sub === 'list') {
			const parentId = parseInt(args[1]);
			if (!parentId) return message.reply(`Utilisation : \`${config.prefix}ticketsuboption list <parentId>\`.`);

			const parent = await getParent(parentId).catch(() => null);
			if (!parent) return message.reply('Catégorie parente introuvable.');

			db.all('SELECT * FROM ticketsuboptions WHERE guild = ? AND parentId = ?', [message.guild.id, parentId], (err, rows) => {
				if (err || !rows || rows.length === 0) {
					return message.reply(`Aucune sous-catégorie configurée pour **${parent.label}**. Utilise \`${config.prefix}ticketsuboption add ${parentId} <label>\`.`);
				}
				const embed = new EmbedBuilder()
					.setTitle(`Sous-catégories — ${parent.label}`)
					.setColor(config.color)
					.setDescription(rows.map(r => {
						const roles = r.roles ? r.roles.split(',').filter(Boolean).map(id => `<@&${id}>`).join(', ') : 'Aucun';
						return `**ID \`${r.id}\`** — ${r.label}\nRôles ping automatique : ${roles}`;
					}).join('\n\n'));
				message.reply({ embeds: [embed] });
			});
			return;
		}

		if (sub === 'setroles') {
			const id = parseInt(args[1]);
			if (!id) return message.reply(`Indique l'ID de la sous-catégorie. Voir \`${config.prefix}ticketsuboption list <parentId>\`.`);
			db.run('UPDATE ticketsuboptions SET roles = ? WHERE id = ? AND guild = ?', [roleIds.join(','), id, message.guild.id], function (err) {
				if (err) return message.reply('Erreur.');
				if (this.changes === 0) return message.reply('Sous-catégorie introuvable.');
				message.reply(roleIds.length ? `Rôles ping automatique mis à jour (${roleIds.length}).` : 'Rôles ping automatique retirés de cette sous-catégorie.');
			});
			return;
		}

		if (sub === 'setlabel') {
			const id = parseInt(args[1]);
			const label = args.slice(2).join(' ').replace(/<@&\d+>/g, '').trim();
			if (!id || !label) return message.reply(`Utilisation : \`${config.prefix}ticketsuboption setlabel <id> <label>\``);
			db.run('UPDATE ticketsuboptions SET label = ? WHERE id = ? AND guild = ?', [label, id, message.guild.id], function (err) {
				if (err) return message.reply('Erreur.');
				if (this.changes === 0) return message.reply('Sous-catégorie introuvable.');
				message.reply(`Label mis à jour : **${label}**`);
			});
			return;
		}

		message.reply(`Sous-commande invalide. Voir \`${config.prefix}help ticketsuboption\`.`);
	},
};