/**
 * Gabarit de commande à préfixe. Ce fichier n'est jamais chargé par le bot :
 * il sert de point de départ pour créer une commande dans Commands/<Catégorie>/.
 *
 * Copiez-le, renommez-le, et adaptez les champs ci-dessous.
 */
import { denyIfNoPerm } from './Utils/perms.js';
import { notice, send } from './Utils/ui.js';

export const command = {
	// Nom d'appel de la commande, sans le préfixe. Doit être unique.
	name: 'exemple',

	// Syntaxe affichée dans +help. <obligatoire> et [facultatif].
	helpname: 'exemple <argument> [option]',

	// Noms alternatifs, facultatif.
	aliases: [],

	// Une ligne, affichée dans +help.
	description: 'Décrit ce que fait la commande',

	// Texte long, affiché par +help exemple.
	help: 'exemple <argument> [option]',

	run: async (bot, message, args, config) => {
		// Contrôle de permission partagé : renvoie true et prévient l'auteur si refusé.
		if (await denyIfNoPerm(message, command.name, config)) return;

		if (!args[0]) {
			return send(message.channel, notice(
				`Usage : \`${config.prefix}${command.helpname}\``,
				config.color
			));
		}

		return send(message.channel, notice('Commande exécutée.', config.color));
	}
};
