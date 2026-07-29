import { EmbedBuilder } from "discord.js";
import db from "../../Events/loadDatabase.js";

export const command = {
	name: 'ticketoption',
	helpname: 'ticketoption',
	description: "Permet de gérer les catégories de ticket (rôles ping automatiques inclus)",
	help: 'ticketoption add <label> [@role...] | remove <id> | list | setroles <id> [@role...] | setlabel <id> <label>',
	run: async (bot, message, args, config) => {
		const checkPerm = async (message, commandName) => {
			if (config.owners.includes(message.author.id)) return true;

			const publicStatut = await new Promise((resolve, reject) => {
				db.get('SELECT statut FROM public WHERE guild = ? AND statut = ?', [message.guild.id, 'on'], (err, row) => {
					if (err) reject(err);
					resolve(!!row);
				});
			});

			if (publicStatut) {
				const checkPublicCmd = await new Promise((resolve, reject) => {
					db.get('SELECT command FROM cmdperm WHERE perm = ? AND command = ? AND guild = ?', ['public', commandName, message.guild.id], (err, row) => {
						if (err) reject(err);
						resolve(!!row);
					});
				});
				if (checkPublicCmd) return true;
			}

			try {
				const checkUserWl = await new Promise((resolve, reject) => {
					db.get('SELECT id FROM whitelist WHERE id = ?', [message.author.id], (err, row) => {
						if (err) reject(err);
						resolve(!!row);
					});
				});
				if (checkUserWl) return true;

				const checkDbOwner = await new Promise((resolve, reject) => {
					db.get('SELECT id FROM owner WHERE id = ?', [message.author.id], (err, row) => {
						if (err) reject(err);
						resolve(!!row);
					});
				});
				if (checkDbOwner) return true;

				const roles = message.member.roles.cache.map(role => role.id);
				const permissions = await new Promise((resolve, reject) => {
					db.all('SELECT perm FROM permissions WHERE id IN (' + roles.map(() => '?').join(',') + ') AND guild = ?', [...roles, message.guild.id], (err, rows) => {
						if (err) reject(err);
						resolve(rows.map(row => row.perm));
					});
				});
				if (permissions.length === 0) return false;

				const checkCmdPermLevel = await new Promise((resolve, reject) => {
					db.all('SELECT command FROM cmdperm WHERE perm IN (' + permissions.map(() => '?').join(',') + ') AND guild = ?', [...permissions, message.guild.id], (err, rows) => {
						if (err) reject(err);
						resolve(rows.map(row => row.command));
					});
				});
				return checkCmdPermLevel.includes(commandName);
			} catch (error) {
				console.error('Erreur lors de la vérification des permissions:', error);
				return false;
			}
		};

		if (!(await checkPerm(message, command.name))) {
			const noacces = new EmbedBuilder()
				.setDescription("Vous n'avez pas la permission d'utiliser cette commande")
				.setColor(config.color);
			return message.reply({ embeds: [noacces] }).then(m => setTimeout(() => m.delete().catch(() => { }), 2000));
		}

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