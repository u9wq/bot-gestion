import config from '../Utils/config.js';
import { listeFichiers, importer } from './loader.js';

export default async (bot) => {
	let charges = 0;
	let echecs = 0;

	for (const fichier of listeFichiers('./Events')) {
		try {
			const module = await importer(fichier);
			const event = module.default;

			// loadDatabase.js et sendlog.js sont des modules utilitaires, pas des événements
			if (!event?.name || typeof event.execute !== 'function') continue;

			const relais = (...args) => {
				try {
					const resultat = event.execute(...args, bot, config);
					if (resultat instanceof Promise) {
						resultat.catch((error) =>
							console.error(`[EVENT] erreur dans ${event.name} :`, error));
					}
				} catch (error) {
					console.error(`[EVENT] erreur dans ${event.name} :`, error);
				}
			};

			if (event.once) bot.once(event.name, relais);
			else bot.on(event.name, relais);

			charges++;
		} catch (error) {
			echecs++;
			console.error(`[EVENT] échec du chargement de ${fichier} :`, error.message);
		}
	}

	console.log(`[EVENT] ${charges} événements chargés${echecs ? `, ${echecs} en échec` : ''}`);
};
