import fs from "fs"
import config from "../../config.json" with { type: 'json' };
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'prefix',
	helpname: 'prefix',
	description: "Permet de changer le préfixe",
	help: 'prefix [prefix]]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const prefix = args[0];
		if (!prefix) {
			return message.reply(`Le préfixe est ${config.prefix}.`);
		}

		config.prefix = prefix;
		fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
			if (err) {
				console.error('Erreur lors de la mise à jour du préfixe :', err);
				return message.reply("Une erreur est survenue.");
			}

			message.reply(`Le préfixe est maintenant: ${prefix}`);
		});
	},
}