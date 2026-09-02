import { EmbedBuilder } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import config from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'punish',
	helpname: 'punish <module> <ban/kick/derank/timeout>',
	description: "Permet de gérer les sanctions pour l'antiraid",
	help: 'punish <module> <ban/kick/derank/timeout>',
	run: async (bot, message, args) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const [module, sanction] = args;

		const modules = [
			'antispam', 'antichannel', 'antirole', 'antiupdate', 'antivanity',
			'antiwebhook', 'antiban', 'antieveryone', 'antibot', 'antilink'
		];
		const sanc = ['ban', 'kick', 'derank', 'timeout'];

		if (!module && !sanction) {
			db.all('SELECT module, punition FROM punish WHERE guild = ?', [message.guild.id], (err2, rows) => {
				if (err2) {
					console.error('Erreur lors de la récupération des sanctions:', err2);
					return message.reply('Erreur lors de la récupération des sanctions.');
				}

				let description = '';
				if (rows && rows.length > 0) {
					description = rows
						.map(r => `**${r.module} :** \`${r.punition || ''}\``)
						.join('\n');
				} else {
					description = 'Aucune sanction définie.';
				}

				const embed = new EmbedBuilder()
					.setDescription(description)
					.setColor(config.color)
					.setFooter({ text: bot.user.username });

				return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
			});
			return;
		}

		if (!module || !sanction || !modules.includes(module.toLowerCase()) || !sanc.includes(sanction.toLowerCase())) {
			return message.reply({
				content: `\`${command.use}\`\nModules: ${modules.join(', ')}\nSanctions: ${sanc.join(', ')}`,
				allowedMentions: { repliedUser: false }
			});
		}

		db.run(
			`INSERT INTO punish (guild, module, punition)
     VALUES (?, ?, ?)
     ON CONFLICT(guild, module) DO UPDATE SET punition = ?`,
			[message.guild.id, module.toLowerCase(), sanction.toLowerCase(), sanction.toLowerCase()],
			(err) => {
				if (err) return message.reply('Erreur lors de la mise à jour de la sanction.');

				db.all('SELECT module, punition FROM punish WHERE guild = ?', [message.guild.id], (err2, rows) => {
					if (err2) {
						console.error('Erreur lors de la récupération des sanctions:', err2);
						return message.reply('Erreur lors de la récupération des sanctions.');
					}

					let description = '';
					if (rows && rows.length > 0) {
						description = rows
							.map(r => `**${r.module} :** \`${r.punition || ''}\``)
							.join('\n');
					} else {
						description = 'Aucune sanction définie.';
					}

					const embed = new EmbedBuilder()
						.setDescription(description)
						.setColor(config.color)
						.setFooter({ text: bot.user.username });

					message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
				});
			}
		);
	},
}