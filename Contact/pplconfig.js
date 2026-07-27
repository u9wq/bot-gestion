import { EmbedBuilder } from 'discord.js';
import db from '../../Events/loadDatabase.js';

export const command = {
	name: 'pplconfig',
	helpname: 'pplconfig <@user> <lien>',
	description: 'Configure le lien PayPal d\'un utilisateur',
	help: 'pplconfig <@user> <lien> | pplconfig <@user> remove',
	run: async (bot, message, args, config) => {

		if (!message.member.permissions.has('Administrator')) {
			const embed = new EmbedBuilder()
				.setDescription("Vous n'avez pas la permission d'utiliser cette commande")
				.setColor(config.color);
			return message.reply({ embeds: [embed] })
				.then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
		}

		const user = message.mentions.users.first();
		const link = args[1];

		if (!user || !link) {
			return message.reply(`Utilisation : \`${config.prefix}pplconfig @user <lien>\` ou \`${config.prefix}pplconfig @user remove\``);
		}

		if (link === 'remove') {
			db.run('DELETE FROM paypallinks WHERE userId = ?', [user.id], function (err) {
				if (err) return message.reply('Erreur SQL.');
				if (this.changes === 0) return message.reply(`Aucun lien PayPal configuré pour ${user.tag}.`);
				const embed = new EmbedBuilder()
					.setDescription(`Lien PayPal de **${user.tag}** supprimé.`)
					.setColor(config.color);
				message.reply({ embeds: [embed] });
			});
			return;
		}

		db.run('INSERT OR REPLACE INTO paypallinks (userId, paypal) VALUES (?, ?)', [user.id, link], (err) => {
			if (err) return message.reply('Erreur SQL.');
			const embed = new EmbedBuilder()
				.setDescription(`Lien PayPal de **${user.tag}** configuré.`)
				.setColor(config.color);
			message.reply({ embeds: [embed] });
		});
	},
};