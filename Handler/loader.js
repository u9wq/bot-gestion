import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Liste récursivement les fichiers .js d'un dossier.
 * Remplace les doubles boucles racine + sous-dossiers dupliquées dans chaque handler.
 */
export function listeFichiers(dossier) {
	if (!fs.existsSync(dossier)) return [];

	return fs.readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
		const complet = path.join(dossier, entree.name);
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
