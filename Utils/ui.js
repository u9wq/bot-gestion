import {
	ContainerBuilder,
	SeparatorSpacingSize,
	MessageFlags
} from 'discord.js';
import db from '../Events/loadDatabase.js';

const DEFAULT_ACCENT = 0xED4245;

export function resolveColor(color, fallback = DEFAULT_ACCENT) {
	if (typeof color === 'number') return color;
	if (typeof color === 'string') {
		const hex = parseInt(color.replace('#', ''), 16);
		if (!Number.isNaN(hex)) return hex;
	}
	return fallback;
}

export function accentFor(config, name) {
	if (!config) return undefined;
	const specific = config[`${name}Color`];
	if (typeof specific === 'string' && specific.trim() !== '') return specific;
	return config.color;
}

export function getFooterName(guild, config) {
	return new Promise((resolve) => {
		db.get('SELECT name FROM panelfooter WHERE guild = ?', [guild.id], (err, row) => {
			if (!err && row && row.name) return resolve(row.name);
			if (config?.tfooter && config.tfooter.trim() !== '') return resolve(config.tfooter);
			resolve(guild.client?.user?.username || guild.name);
		});
	});
}

export function setFooterName(guild, name) {
	return new Promise((resolve, reject) => {
		db.run('INSERT OR REPLACE INTO panelfooter (guild, name) VALUES (?, ?)', [guild.id, name], (err) => {
			if (err) return reject(err);
			resolve();
		});
	});
}

export function clearFooterName(guild) {
	return new Promise((resolve, reject) => {
		db.run('DELETE FROM panelfooter WHERE guild = ?', [guild.id], (err) => {
			if (err) return reject(err);
			resolve();
		});
	});
}

export async function footerText(guild, config, { updated = true } = {}) {
	const name = await getFooterName(guild, config);
	if (!updated) return name;
	return `${name} · MAJ <t:${Math.floor(Date.now() / 1000)}:R>`;
}

export function panel({ title, body, banner, accent, footer, components = [], accessory }) {
	const container = new ContainerBuilder().setAccentColor(resolveColor(accent));

	if (banner) {
		container.addMediaGalleryComponents(gallery => gallery.addItems(item => item.setURL(banner)));
	}

	const head = [title ? `## ${title}` : null, body || null].filter(Boolean).join('\n');

	if (head && accessory) {
		container.addSectionComponents(section => section
			.addTextDisplayComponents(text => text.setContent(head))
			.setButtonAccessory(accessory));
	} else if (head) {
		container.addTextDisplayComponents(text => text.setContent(head));
	}

	if (components.length) {
		container.addSeparatorComponents(sep => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true));
		for (const component of components) {
			container.addActionRowComponents(row => row.setComponents(component));
		}
	}

	if (footer) {
		container.addTextDisplayComponents(text => text.setContent(`-# ${footer}`));
	}

	return container;
}

export function notice(body, accent) {
	return new ContainerBuilder()
		.setAccentColor(resolveColor(accent))
		.addTextDisplayComponents(text => text.setContent(body));
}

export const send = (target, container, extra = {}) =>
	target.send({ components: [container], flags: MessageFlags.IsComponentsV2, ...extra });

export const reply = (interaction, container, { ephemeral = false, ...extra } = {}) =>
	interaction.reply({
		components: [container],
		flags: ephemeral
			? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
			: MessageFlags.IsComponentsV2,
		...extra
	});
