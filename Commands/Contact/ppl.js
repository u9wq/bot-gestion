import { EmbedBuilder } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'ppl',
	helpname: 'ppl <@user>',
	description: 'Envoie le lien PayPal d\'un utilisateur',
	help: 'ppl <@user>',
	run: async (bot, message, args, config) => {

		if (await denyIfNoPerm(message, command.name, config)) return;

		const user = message.mentions.users.first();
		if (!user) {
			return message.reply(`Mentionne un utilisateur. Exemple : \`${config.prefix}ppl @user\``);
		}

		db.get('SELECT paypal FROM paypallinks WHERE userId = ?', [user.id], (err, row) => {
			if (err) return message.reply('Erreur SQL.');
			if (!row) {
				return message.reply(`Aucun lien PayPal configuré pour **${user.tag}**.`);
			}

			const embed = new EmbedBuilder()
				.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
				.setTitle('Lien de Paiement')
				.setColor(config.color)
				.setDescription([
					`Voici le lien PayPal : ***${row.paypal}***\n`,
					'**Pas de note**',
					'> Ne mettez **aucun message** dans la note de paiement.\n',
					'**En ami proche**',
					'> Sélectionnez **"A un ami"** et non "Pour des biens ou services".',
				].join('\n'));

			message.channel.send({ embeds: [embed] });
			message.delete().catch(() => {});
		});
	},
};