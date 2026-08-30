import { EmbedBuilder } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'resetinvites',
	helpname: 'resetinvites [@user]',
	description: 'Remet à zéro le compteur d\'invitations pour les giveaways',
	help: 'resetinvites [@user] | resetinvites all',
	run: async (bot, message, args, config) => {

		if (await denyIfNoPerm(message, command.name, config)) return;

		if (args[0] === 'all') {
			db.run('DELETE FROM giveaway_invites WHERE guildId = ?', [message.guild.id], function (err) {
				if (err) return message.reply('Erreur SQL.');
				const embed = new EmbedBuilder()
					.setDescription(`Tous les compteurs d'invitations ont été remis à zéro.`)
					.setColor(config.color);
				message.reply({ embeds: [embed] });
			});
			return;
		}

		const user = message.mentions.users.first();
		if (!user) {
			return message.reply(`Utilisation : \`${config.prefix}resetinvites @user\` ou \`${config.prefix}resetinvites all\``);
		}

		db.run('DELETE FROM giveaway_invites WHERE guildId = ? AND userId = ?',
			[message.guild.id, user.id], function (err) {
				if (err) return message.reply('Erreur SQL.');
				if (this.changes === 0) return message.reply(`Aucune invitation enregistrée pour **${user.tag}**.`);
				const embed = new EmbedBuilder()
					.setDescription(`Compteur d'invitations de **${user.tag}** remis à zéro.`)
					.setColor(config.color);
				message.reply({ embeds: [embed] });
			});
	},
};