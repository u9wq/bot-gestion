import { StringSelectMenuBuilder } from 'discord.js';
import db from '../../Events/loadDatabase.js';
import { denyIfNoPerm } from '../../Utils/perms.js';
import { panel, notice, send, footerText, accentFor } from '../../Utils/ui.js';

export const command = {
	name: 'ticket',
	helpname: 'ticket <catégorie id>',
	description: 'Permet de configurer les tickets',
	help: 'ticket <catégorie id>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const category = message.guild.channels.cache.get(args[0]);
		if (!category || category.type !== 4) {
			return send(message.channel, notice('ID Catégorie invalide.', config.color));
		}

		db.run(
			`INSERT OR REPLACE INTO ticket (guild, category) VALUES (?, ?)`,
			[message.guild.id, category.id]
		);

		db.all('SELECT * FROM ticketoptions WHERE guild = ?', [message.guild.id], async (err, rows) => {
			if (err) return console.error(err);
			if (!rows || rows.length === 0) {
				return send(message.channel, notice(
					`Aucune option de ticket configurée. Utilise \`${config.prefix}ticketoption add <label>\` pour en créer une.`,
					config.color
				));
			}

			const ticketMenu = new StringSelectMenuBuilder()
				.setCustomId('ticket_select')
				.setPlaceholder('Sélectionne une catégorie')
				.addOptions(
					rows.map(opt => ({
						label: opt.label,
						value: String(opt.id)
					}))
				);

			await send(message.channel, panel({
				banner: config.ticketBanner,
				title: config.titre && config.titre.trim() !== '' ? config.titre : null,
				body: config.description,
				accent: accentFor(config, 'ticket'),
				components: [ticketMenu],
				footer: await footerText(message.guild, config)
			}));
		});
	},
};
