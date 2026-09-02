import fs from "fs"
import config from "../../config.json" with { type: 'json' };
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'setcolor',
	helpname: 'setcolor',
	description: "Permet de changer la couleur des embed",
	aliases: ['color'],
	help: 'setcolor <#hex>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const color = args[0];
		if (!color || !/^#([0-9a-fA-F]{6})$/i.test(color)) {
			return message.reply(`La couleur est ${config.color}.`);
		}

		config.color = color;
		fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
			if (err) {
				console.error('Erreur lors de la mise à jour de la couleur :', err);
				return message.reply("Une erreur est survenue.");
			}

			message.reply(`La couleur est maintenant: ${color}`);
		});
	},
}