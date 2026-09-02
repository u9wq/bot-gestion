import { listeFichiers, importer } from './loader.js';

export default async (bot) => {
	let charges = 0;
	let echecs = 0;

	for (const fichier of listeFichiers('./Commands')) {
		try {
			const { command } = await importer(fichier);

			if (!command?.name || typeof command.run !== 'function') {
				console.warn(`[COMMAND] ignoré (name ou run manquant) : ${fichier}`);
				echecs++;
				continue;
			}

			bot.commands.set(command.name, command);

			for (const alias of command.aliases ?? []) {
				if (alias !== command.name) bot.commands.set(alias, command);
			}

			charges++;
		} catch (error) {
			echecs++;
			console.error(`[COMMAND] échec du chargement de ${fichier} :`, error.message);
		}
	}

	console.log(`[COMMAND] ${charges} commandes chargées${echecs ? `, ${echecs} en échec` : ''}`);
};
