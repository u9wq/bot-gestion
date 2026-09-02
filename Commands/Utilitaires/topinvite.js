import { EmbedBuilder } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'topinvite',
	helpname: 'topinvite',
	description: 'Affiche le classement des membres ayant le plus d\'invitations pour les giveaways',
	help: 'topinvite',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

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