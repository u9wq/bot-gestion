import { denyIfNoPerm } from '../../Utils/perms.js';
import { notice, send } from '../../Utils/ui.js';
import { STATUSES, savePresence, applyPresence } from '../../Utils/presence.js';

export const command = {
	name: 'presence',
	helpname: 'presence <online/idle/dnd/invisible>',
	description: 'Permet de changer le statut du bot',
	help: 'presence <online/idle/dnd/invisible>\nLe statut est conservé après un redémarrage.',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const status = args[0] ? args[0].toLowerCase() : '';

		if (!STATUSES.includes(status)) {
			return send(message.channel, notice(
				`Usage : \`${config.prefix}presence <${STATUSES.join('/')}>\``,
				config.color
			));
		}

		await savePresence({ status });
		await applyPresence(bot);

		return send(message.channel, notice(`Statut changé : **${status}**`, config.color));
	},
};
