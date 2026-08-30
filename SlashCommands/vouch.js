import { ApplicationCommandOptionType } from 'discord.js';
import db from '../Events/loadDatabase.js';
import { panel, notice, send, reply, footerText, accentFor } from '../Utils/ui.js';

export const command = {
	name: 'vouch',
	description: 'Permet de vouch',
	dm_permission: false,
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: 'service',
			description: 'Le service',
			required: true,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: 'avis',
			description: 'Votre avis',
			required: true,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: 'note',
			description: 'Note sur 5',
			required: true,
			choices: [
				{ name: '1 / 5', value: '1' },
				{ name: '2 / 5', value: '2' },
				{ name: '3 / 5', value: '3' },
				{ name: '4 / 5', value: '4' },
				{ name: '5 / 5', value: '5' },
			],
		},
	],
	run: async (bot, interaction, args, config) => {
		const service = interaction.options.getString('service');
		const avis = interaction.options.getString('avis');
		const note = interaction.options.getString('note');
		const guildId = interaction.guild.id;

		const total = await new Promise((resolve, reject) => {
			db.get('SELECT total FROM vouch WHERE guild = ?', [guildId], (err, row) => {
				if (err) return reject(err);
				resolve(row ? row.total + 1 : 1);
			});
		});

		await new Promise((resolve, reject) => {
			db.run(`
        INSERT INTO vouch (guild, total)
        VALUES (?, 1)
        ON CONFLICT(guild) DO UPDATE SET total = total + 1
      `, [guildId], function (err) {
				if (err) return reject(err);
				resolve();
			});
		});

		const salon = await new Promise((resolve) => {
			db.get('SELECT channel FROM vouchchannel WHERE guild = ?', [guildId], (err, row) => {
				resolve(err || !row ? null : row.channel);
			});
		});

		const quote = avis.split('\n').map(line => `> ${line}`).join('\n');

		const carte = panel({
			banner: config.vouchBanner,
			title: `Avis #${total}`,
			body: `Note ${note}/5 · <@${interaction.user.id}> · service \`${service}\`\n${quote}`,
			accent: accentFor(config, 'vouch'),
			footer: await footerText(interaction.guild, config, { updated: false })
		});

		const cible = salon ? interaction.guild.channels.cache.get(salon) : null;

		if (cible) {
			const envoye = await send(cible, carte, { allowedMentions: { parse: [] } }).catch(() => null);
			if (envoye) {
				return reply(interaction, notice(
					`Merci, ton avis a été publié dans <#${cible.id}>.`,
					accentFor(config, 'vouch')
				), { ephemeral: true });
			}
		}

		await reply(interaction, carte);
	}
};
