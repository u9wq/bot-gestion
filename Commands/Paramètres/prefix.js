import config, { sauvegarder } from '../../Utils/config.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'prefix',
	helpname: 'prefix [prefix]',
	description: "Permet de changer le préfixe",
	help: 'prefix [prefix]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const prefix = args[0];
		if (!prefix) {
			return message.reply(`Le préfixe est ${config.prefix}.`);
		}

		config.prefix = prefix;

		try {
			await sauvegarder();
		} catch (error) {
			console.error('Erreur lors de la mise à jour du préfixe :', error);
			return message.reply("Une erreur est survenue.");
		}

		return message.reply(`Le préfixe est maintenant: ${prefix}`);
	},
}
