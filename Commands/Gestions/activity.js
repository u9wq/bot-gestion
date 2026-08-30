import { denyIfNoPerm } from '../../Utils/perms.js';
import { notice, send } from '../../Utils/ui.js';
import { ACTIVITY_TYPES, savePresence, applyPresence } from '../../Utils/presence.js';

export const command = {
	name: 'activity',
	helpname: 'activity <listen/play/stream/watch/compet/custom/stop> [texte]',
	description: 'Permet de changer l\'activité du bot',
	help: 'activity <listen/play/stream/watch/compet/custom/stop> [texte]\nPour un stream : activity stream <url> <texte>\nL\'activité est conservée après un redémarrage.',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const types = [...Object.keys(ACTIVITY_TYPES), 'stop'];
		const type = args[0] ? args[0].toLowerCase() : '';

		if (!types.includes(type)) {
			return send(message.channel, notice(
				`Usage : \`${config.prefix}activity <${types.join('/')}> [texte]\`\n-# Pour un stream : \`${config.prefix}activity stream <url> <texte>\``,
				config.color
			));
		}

		if (type === 'stop') {
			await savePresence({ type: 'stop', text: null, url: null });
			await applyPresence(bot);
			return send(message.channel, notice('L\'activité a bien été désactivée.', config.color));
		}

		const rest = args.slice(1);
		let url = null;

		if (type === 'stream' && rest[0] && /^https?:\/\//i.test(rest[0])) {
			url = rest.shift();
		}

		const text = rest.join(' ') || 'Sans titre';

		await savePresence({ type, text, url });
		const { activity } = await applyPresence(bot);

		if (type === 'stream' && !activity.url) {
			return send(message.channel, notice(
				`Activité changée : **${text}**\n-# Aucune URL de stream valide, l'activité s'affiche en « Joue à ». Ajoute une URL Twitch pour un vrai stream.`,
				config.color
			));
		}

		return send(message.channel, notice(`Activité changée : **${text}**`, config.color));
	},
};
