import fs from 'fs';
import { denyIfNoPerm } from '../../Utils/perms.js';
import { panel, notice, send, footerText } from '../../Utils/ui.js';

const SETTINGS = {
	couleur: { key: 'color', label: 'Couleur par défaut de tous les panneaux', type: 'color', required: true },
	couleurticket: { key: 'ticketColor', label: 'Couleur des panneaux ticket', type: 'color' },
	couleurvouch: { key: 'vouchColor', label: 'Couleur des avis', type: 'color' },
	couleurconfess: { key: 'confessColor', label: 'Couleur des confessions', type: 'color' },
	couleursuggest: { key: 'suggestColor', label: 'Couleur des suggestions', type: 'color' },
	titre: { key: 'titre', label: 'Titre du panneau ticket' },
	description: { key: 'description', label: 'Description du panneau ticket' },
	banniere: { key: 'ticketBanner', label: 'Bannière du panneau ticket', type: 'url' },
	vouchbanniere: { key: 'vouchBanner', label: 'Bannière des avis', type: 'url' },
	ctitre: { key: 'ctitre', label: 'Titre du captcha' },
	cdescription: { key: 'cdescription', label: 'Description du captcha' },
	ccouleur: { key: 'ccolor', label: 'Couleur du captcha', type: 'color' },
	cimage: { key: 'cimage', label: 'Image du captcha', type: 'url' },
	cemoji: { key: 'cemoji', label: 'Emoji du bouton captcha' }
};

function saveConfig(config) {
	return new Promise((resolve, reject) => {
		fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
			if (err) return reject(err);
			resolve();
		});
	});
}

function display(value) {
	if (value === undefined || value === null || String(value).trim() === '') return '_vide_';
	return `\`${value}\``;
}

export const command = {
	name: 'config',
	helpname: 'config [clé] [valeur/reset]',
	aliases: ['setconfig'],
	description: 'Permet de configurer les textes des panneaux',
	help: 'config [clé] [valeur/reset]\nSans argument, affiche toute la configuration.',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const keys = Object.keys(SETTINGS);

		if (!args[0]) {
			const lines = keys.map(name => {
				const setting = SETTINGS[name];
				const value = config[setting.key];
				const shown = setting.type === 'color' && (value === undefined || String(value).trim() === '')
					? `_suit ${display(config.color)}_`
					: display(value);
				return `**${name}** · ${setting.label}\n-# ${shown}`;
			});

			return send(message.channel, panel({
				title: 'Configuration',
				body: `${lines.join('\n')}\n\nPour modifier : \`${config.prefix}config <clé> <valeur>\``,
				accent: config.color,
				footer: await footerText(message.guild, config, { updated: false })
			}));
		}

		const name = args[0].toLowerCase();
		const setting = SETTINGS[name];

		if (!setting) {
			return send(message.channel, notice(
				`Clé inconnue. Clés disponibles : ${keys.map(k => `\`${k}\``).join(', ')}`,
				config.color
			));
		}

		if (!args[1]) {
			return send(message.channel, notice(
				`**${name}** · ${setting.label}\n${display(config[setting.key])}`,
				config.color
			));
		}

		const raw = args.slice(1).join(' ').trim();
		const value = raw.toLowerCase() === 'reset' ? '' : raw;

		if (value === '' && setting.required) {
			return send(message.channel, notice(
				`**${name}** ne peut pas être vidé : c'est la couleur de repli des autres panneaux.`,
				config.color
			));
		}

		if (value !== '') {
			if (setting.type === 'color' && !/^#([0-9a-fA-F]{6})$/.test(value)) {
				return send(message.channel, notice('La couleur doit être au format `#RRGGBB`.', config.color));
			}
			if (setting.type === 'url' && !/^https?:\/\//i.test(value)) {
				return send(message.channel, notice("L'image doit être un lien commençant par `http`.", config.color));
			}
		}

		config[setting.key] = value;

		try {
			await saveConfig(config);
		} catch (err) {
			console.error('Erreur lors de la sauvegarde de la configuration :', err);
			return send(message.channel, notice('Une erreur est survenue lors de la sauvegarde.', config.color));
		}

		return send(message.channel, notice(
			value === ''
				? `**${name}** a été vidé.`
				: `**${name}** vaut maintenant ${display(value)}`,
			config.color
		));
	},
}
