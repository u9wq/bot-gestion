import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { panel, send, footerText, accentFor } from './ui.js';

export async function suggestPanel(guild, config) {
	return panel({
		title: 'Suggestions',
		body: 'Clique sur le bouton ci-dessous pour proposer une idée.',
		accent: accentFor(config, 'suggest'),
		accessory: new ButtonBuilder()
			.setCustomId('suggest_open')
			.setLabel('Faire une suggestion')
			.setStyle(ButtonStyle.Primary),
		footer: await footerText(guild, config)
	});
}

export async function confessPanel(guild, config) {
	return panel({
		title: 'Confessions',
		body: 'Clique sur le bouton ci-dessous pour envoyer une confession anonyme.',
		accent: accentFor(config, 'confess'),
		accessory: new ButtonBuilder()
			.setCustomId('confess_open')
			.setLabel('Se confesser')
			.setStyle(ButtonStyle.Primary),
		footer: await footerText(guild, config)
	});
}

export async function refreshPanel(channel, botId, customId, container) {
	const messages = await channel.messages.fetch({ limit: 10 }).catch(() => null);

	if (messages) {
		const previous = messages.find(m =>
			m.author.id === botId && JSON.stringify(m.components ?? []).includes(customId)
		);
		if (previous) await previous.delete().catch(() => { });
	}

	return send(channel, container);
}
