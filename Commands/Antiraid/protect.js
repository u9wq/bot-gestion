import { EmbedBuilder } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'protect',
	helpname: 'protect',
	aliases: ['secur'],
	description: "Permet d'affiche l'antiraid",
	help: 'protect',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;



		db.get('SELECT * FROM antiraid WHERE guild = ?', [message.guild.id], (err, row) => {
			if (err) {
				console.error('Erreur lors de la récupération des protections:', err);
				return message.reply('Erreur lors de la récupération des paramètres de protection.');
			}

			const protections = {
				Antispam: row?.antispam ? `✅ (${row.nombremessage}/${row.spam_duration}${row.spam_unit}・${row.timeout ? Math.round(row.timeout / 1000) + 's' : '60s'})` : '❌',
				Antilien: row?.antilink ? `✅ (${row.type === 'invite' ? 'invite' : 'all'})` : '❌',
				Antichannel: row?.antichannel ? '✅' : '❌',
				Antirole: row?.antirole ? '✅' : '❌',
				Antiupdate: row?.antiupdate ? '✅' : '❌',
				Antivanity: row?.antivanity ? '✅' : '❌',
				Antiwebhook: row?.antiwebhook ? '✅' : '❌',
				Antiban: row?.antiban ? '✅' : '❌',
				Antieveryone: row?.antieveryone ? '✅' : '❌',
				Antibot: row?.antibot ? '✅' : '❌',
				Antitoken: row?.antitoken ? `✅ (${row.antitokenjours || 7}j)` : '❌'
			};

			const description = Object.entries(protections)
				.map(([name, status]) => `**${name} :** \`${status}\``)
				.join('\n');

			const embed = new EmbedBuilder()
				.setDescription(description)
				.setColor(config.color)
				.setFooter({ text: bot.user.username });

			message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
		});
	},
}