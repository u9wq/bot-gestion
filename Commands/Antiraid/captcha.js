import { ButtonBuilder, ButtonStyle } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import { denyIfNoPerm } from '../../Utils/perms.js';
import { panel, notice, send, footerText } from '../../Utils/ui.js';

export const command = {
	name: 'captcha',
	helpname: 'captcha [role]',
	description: 'Permet de configurer/envoyer le captcha',
	help: 'captcha [role]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		if (args[0]) {
			const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
			if (!role) {
				return send(message.channel, notice('Rôle invalide ou introuvable.', config.color));
			}

			db.run(`INSERT OR REPLACE INTO captcha (guild, id) VALUES (?, ?)`, [message.guild.id, role.id], (err) => {
				if (err) console.error(err);
				send(message.channel, notice(`Le rôle captcha est désormais ${role}.`, config.color));
			});
			return;
		}

		db.get('SELECT id FROM captcha WHERE guild = ?', [message.guild.id], async (err, row) => {
			if (err) console.error(err);
			if (!row) {
				return send(message.channel, notice(
					`Utilise \`${config.prefix}captcha <role>\` pour configurer le rôle.`,
					config.color
				));
			}

			const button = new ButtonBuilder()
				.setCustomId('cbutton')
				.setLabel('Se vérifier')
				.setStyle(ButtonStyle.Success);

			if (config.cemoji && config.cemoji.trim() !== '') {
				button.setEmoji(config.cemoji);
			}

			await send(message.channel, panel({
				banner: config.cimage && config.cimage.trim() !== '' ? config.cimage : null,
				title: config.ctitre,
				body: config.cdescription,
				accent: config.ccolor || config.color,
				accessory: button,
				footer: await footerText(message.guild, config)
			}));
		});
	},
}
