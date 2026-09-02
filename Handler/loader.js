import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { RACINE } from '../Utils/config.js';

/**
 * Liste récursivement les fichiers .js d'un dossier.
 * Remplace les doubles boucles racine + sous-dossiers dupliquées dans chaque handler.
 */
export function listeFichiers(dossier) {
	// Resolu depuis la racine du projet : la commande de demarrage du panneau
	// d'hebergement peut pointer n'importe ou sans casser le chargement.
	const absolu = path.isAbsolute(dossier) ? dossier : path.resolve(RACINE, dossier);
	if (!fs.existsSync(absolu)) return [];

	return fs.readdirSync(absolu, { withFileTypes: true }).flatMap((entree) => {
		const complet = path.join(absolu, entree.name);
		if (entree.isDirectory()) return listeFichiers(complet);
		return entree.name.endsWith('.js') ? [complet] : [];
	});
}

/**
 * Importe un fichier par son chemin. pathToFileURL est nécessaire sous Windows,
 * où un chemin absolu type D:\... n'est pas un specifier valide pour import().
 */
export function importer(fichier) {
	return import(pathToFileURL(path.resolve(fichier)).href);
}
