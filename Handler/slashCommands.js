import { listeFichiers, importer } from './loader.js';

export default async (bot) => {
	const arrayOfSlashCommands = [];
	let echecs = 0;

	for (const fichier of listeFichiers('./SlashCommands')) {
		try {
			const { command } = await importer(fichier);

			if (!command?.name || typeof command.run !== 'function') {
				console.warn(`[SLASH-COMMAND] ignoré (name ou run manquant) : ${fichier}`);
				echecs++;
				continue;
			}

			bot.slashCommands.set(command.name, command);
			arrayOfSlashCommands.push(command);
		} catch (error) {
			echecs++;
			console.error(`[SLASH-COMMAND] échec du chargement de ${fichier} :`, error.message);
		}
	}

	bot.arrayOfSlashCommands = arrayOfSlashCommands;

	console.log(`[SLASH-COMMAND] ${arrayOfSlashCommands.length} commandes chargées${echecs ? `, ${echecs} en échec` : ''}`);
};
