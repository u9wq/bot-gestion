import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Chargeur de configuration.
 *
 * Trois rôles :
 *  - lire config.json sans `import ... with { type: 'json' }`, qui exige Node 20.10
 *    et empêche le bot de démarrer sur les images Node 18 courantes ;
 *  - créer config.json au premier lancement à partir des variables du panneau
 *    d'hébergement, pour qu'un client n'ait aucun fichier à écrire à la main ;
 *  - refuser de démarrer avec un message clair si l'essentiel manque, plutôt que
 *    de planter sur une erreur incompréhensible.
 *
 * Les chemins sont résolus depuis ce fichier, jamais depuis le dossier de
 * lancement : la commande de démarrage du panneau n'a donc aucune importance.
 */

export const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CHEMIN_CONFIG = path.join(RACINE, 'config.json');

const DEFAUTS = {
	prefix: '+',
	color: '#ED4245',
	owners: [],
	guildId: '',
	titre: 'Tickets',
	description: 'Sélectionne une catégorie ci-dessous pour ouvrir un ticket.',
	tfooter: '',
	ticketBanner: '',
	vouchBanner: '',
	ticketColor: '',
	vouchColor: '',
	confessColor: '',
	suggestColor: '',
	sanctionColor: '',
	dmOnSanction: true,
	ctitre: 'Vérification',
	cdescription: 'Clique sur le bouton pour accéder au serveur.',
	ccolor: '#ED4245',
	cimage: '',
	cemoji: ''
};

function depuisEnvironnement() {
	const owners = (process.env.OWNERS || '')
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean);

	return {
		...DEFAUTS,
		prefix: process.env.PREFIX || DEFAUTS.prefix,
		color: process.env.COLOR || DEFAUTS.color,
		guildId: process.env.GUILD_ID || DEFAUTS.guildId,
		owners
	};
}

function arreter(titre, lignes) {
	console.error('\x1b[31m\n' + titre + '\x1b[0m');
	for (const ligne of lignes) console.error('  ' + ligne);
	console.error('');
	process.exit(1);
}

function charger() {
	let config;

	if (fs.existsSync(CHEMIN_CONFIG)) {
		try {
			config = { ...DEFAUTS, ...JSON.parse(fs.readFileSync(CHEMIN_CONFIG, 'utf8')) };
		} catch (error) {
			arreter('config.json est illisible', [
				'Le fichier existe mais son contenu n\'est pas du JSON valide.',
				'Détail : ' + error.message,
				'Corrigez-le, ou supprimez-le pour qu\'il soit recréé au prochain démarrage.'
			]);
		}
	} else {
		config = depuisEnvironnement();

		try {
			fs.writeFileSync(CHEMIN_CONFIG, JSON.stringify(config, null, 2));
			console.log('[CONFIG] config.json créé à partir des variables d\'environnement');
		} catch (error) {
			console.warn('[CONFIG] config.json n\'a pas pu être écrit :', error.message);
		}
	}

	if (!process.env.TOKEN) {
		arreter('Le token du bot est absent', [
			'Renseignez la variable TOKEN dans le panneau d\'hébergement,',
			'ou dans un fichier .env à la racine (voir .env.example).',
			'Le token se récupère sur https://discord.com/developers/applications'
		]);
	}

	if (!config.guildId) {
		arreter('L\'identifiant du serveur est absent', [
			'Ce bot ne fonctionne que sur un seul serveur et quitte tous les autres.',
			'Sans guildId, il quitterait donc immédiatement le vôtre.',
			'Renseignez la variable GUILD_ID dans le panneau,',
			'ou la clé "guildId" dans config.json.'
		]);
	}

	if (!Array.isArray(config.owners) || config.owners.length === 0) {
		arreter('Aucun propriétaire n\'est défini', [
			'Sans propriétaire, personne ne peut utiliser la moindre commande.',
			'Renseignez la variable OWNERS dans le panneau (identifiants séparés par des virgules),',
			'ou la clé "owners" dans config.json.'
		]);
	}

	return config;
}

const config = charger();

/** Enregistre la configuration courante sur le disque. */
export function sauvegarder() {
	return new Promise((resolve, reject) => {
		fs.writeFile(CHEMIN_CONFIG, JSON.stringify(config, null, 2), (err) =>
			(err ? reject(err) : resolve()));
	});
}

export default config;
