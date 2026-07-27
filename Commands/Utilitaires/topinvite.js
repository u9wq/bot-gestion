import { EmbedBuilder } from 'discord.js';
import db from '../../Events/loadDatabase.js';

export const command = {
	name: 'topinvite',
	helpname: 'topinvite',
	description: 'Affiche le classement des membres ayant le plus d\'invitations pour les giveaways',
	help: 'topinvite',
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
					db.get(
						'SELECT command FROM cmdperm WHERE perm = ? AND command = ? AND guild = ?',
						['public', commandName, message.guild.id],
						(err, row) => {
							if (err) reject(err);
							resolve(!!row);
						}
					);
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
					db.all('SELECT perm FROM permissions WHERE id IN (' + roles.map(() => '?').join(',') + ') AND guild = ?',
						[...roles, message.guild.id], (err, rows) => {
							if (err) reject(err);
							resolve(rows.map(row => row.perm));
						});
				});
				if (permissions.length === 0) return false;

				const checkCmdPermLevel = await new Promise((resolve, reject) => {
					db.all('SELECT command FROM cmdperm WHERE perm IN (' + permissions.map(() => '?').join(',') + ') AND guild = ?',
						[...permissions, message.guild.id], (err, rows) => {
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
			return message.reply({ embeds: [noacces], allowedMentions: { repliedUser: true } })
				.then(m => setTimeout(() => m.delete().catch(() => {}), 2000));
		}

		const rows = await new Promise((resolve) => {
			db.all(
				'SELECT userId, invites FROM giveaway_invites WHERE guildId = ? AND invites > 0 ORDER BY invites DESC LIMIT 10',
				[message.guild.id],
				(err, rows) => resolve(err ? [] : (rows || []))
			);
		});

		if (rows.length === 0) {
			const empty = new EmbedBuilder()
				.setDescription("Aucune invitation enregistrée pour l'instant.")
				.setColor(config.color);
			return message.reply({ embeds: [empty] });
		}

		const lines = rows.map((row, i) => {
			return `**#${i + 1}** <@${row.userId}> — **${row.invites}** invitation${row.invites > 1 ? 's' : ''}`;
		});

		const embed = new EmbedBuilder()
			.setTitle('Classement des invitations')
			.setDescription(lines.join('\n'))
			.setFooter({ text: 'Ces invitations donnent des chances bonus lors des giveaways' })
			.setColor(config.color);

		return message.reply({ embeds: [embed] });
	},
};