import { EmbedBuilder } from "discord.js";
import db from "../../Events/loadDatabase.js";

export const command = {
	name: 'ticketoption',
	helpname: 'ticketoption',
	description: "Permet de gérer les options de ticket (catégories, rôles)",
	help: 'ticketoption add <label> [@role...] | remove <id> | list | setroles <id> [@role...] | setlabel <id> <label> | buyshop <id> <on/off>',
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
				return message.reply(`Indique un label. Exemple : \`${config.prefix}ticketoption add Buy Shop @RoleStaff\``);
			}
			db.run('INSERT INTO ticketoptions (guild, label, roles, buyshop) VALUES (?, ?, ?, 0)',
				[message.guild.id, label, roleIds.join(',')],
				function (err) {
					if (err) { console.error(err); return message.reply('❌ Erreur lors de la création.'); }
					message.reply(`Option **${label}** cr
éée (ID: \`${this.lastID}\`)${roleIds.length ? ` avec ${roleIds.length} rôle(s)` : ''}.`);
				});
			return;
		}

		if (sub === 'remove') {
			const id = parseInt(args[1]);
			if (!id) return message.reply(`❌ Indique l'ID de l'option. Voir \`${config.prefix}ticketoption list\`.`);
			db.run('DELETE FROM ticketoptions WHERE id = ? AND guild = ?', [id, message.guild.id], function (err) {
				if (err) return message.reply('❌ Erreur.');
				if (this.changes === 0) return message.reply('❌ Option introuvable.');
				message.reply('Option supprimée.');

			});
			return;
		}

		if (sub === 'list') {
			db.all('SELECT * FROM ticketoptions WHERE guild = ?', [message.guild.id], (err, rows) => {
				if (err || !rows || rows.length === 0) {
					return message.reply(`Aucune option de ticket configurée. Utilise \`${config.prefix}ticketoption add <label>\`.`);
				}
				const embed = new EmbedBuilder()
					.setTitle('Options de ticket')
					.setColor(config.color)
					.setDescription(rows.map(r => {
						const roles = r.roles ? r.roles.split(',').filter(Boolean).map(id => `<@&${id}>`).join(', ') : 'Aucun';
						return `**ID \`${r.id}\`** — ${r.label}${r.buyshop ? ' *(sous-menu Buy Shop)*' : ''}\nRôles : ${roles}`;
					}).join('\n\n'));
				message.reply({ embeds: [embed] });
			});
			return;
		}

		if (sub === 'setroles') {
			const id = parseInt(args[1]);
			if (!id) return message.reply(`❌ Indique l'ID de l'option. Voir \`${config.prefix}ticketoption list\`.`);
			db.run('UPDATE ticketoptions SET roles = ? WHERE id = ? AND guild = ?', [roleIds.join(','), id, message.guild.id], function (err) {
				if (err) return message.reply('❌ Erreur.');
				if (this.changes === 0) return message.reply('❌ Option introuvable.');
				message.reply(roleIds.length ? `✅ Rôles mis à jour (${roleIds.length}).` : '✅ Rôles retirés de cette option.');
			});
			return;
		}

		if (sub === 'setlabel') {
			const id = parseInt(args[1]);
			const label = args.slice(2).join(' ').replace(/<@&\d+>/g, '').trim();
			if (!id || !label) return message.reply(`❌ Utilisation : \`${config.prefix}ticketoption setlabel <id> <label>\``);
			db.run('UPDATE ticketoptions SET label = ? WHERE id = ? AND guild = ?', [label, id, message.guild.id], function (err) {
				if (err) return message.reply('❌ Erreur.');
				if (this.changes === 0) return message.reply('❌ Option introuvable.');
				message.reply(`✅ Label mis à jour : **${label}**`);
			});
			return;
		}

		if (sub === 'buyshop') {
			const id = parseInt(args[1]);
			const state = args[2]?.toLowerCase();
			if (!id || (state !== 'on' && state !== 'off')) {
				return message.reply(`❌ Utilisation : \`${config.prefix}ticketoption buyshop <id> <on/off>\``);
			}
			db.run('UPDATE ticketoptions SET buyshop = ? WHERE id = ? AND guild = ?', [state === 'on' ? 1 : 0, id, message.guild.id], function (err) {
				if (err) return message.reply('❌ Erreur.');
				if (this.changes === 0) return message.reply('❌ Option introuvable.');
				message.reply(`✅ Sous-menu Buy Shop ${state === 'on' ? 'activé' : 'désactivé'} pour cette option.`);
			});
			return;
		}

		message.reply(`❌ Sous-commande invalide. Voir \`${config.prefix}help ticketoption\`.`);
	},
};