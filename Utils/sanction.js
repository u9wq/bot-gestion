import { panel, send, accentFor, footerText } from './ui.js';

const LIBELLES = {
	ban: 'Bannissement',
	kick: 'Expulsion',
	derank: 'Retrait des rôles',
	mute: 'Mute',
	vmute: 'Mute vocal',
	warn: 'Avertissement'
};

/**
 * Prévient en message privé le membre qui vient d'être sanctionné.
 *
 * À appeler AVANT un ban, un kick ou un derank : une fois la personne exclue,
 * elle n'a plus de serveur en commun avec le bot et l'envoi échoue.
 *
 * Ne lève jamais : un membre qui a fermé ses messages privés ne doit pas
 * faire échouer la commande de modération.
 */
export async function prevenirMembre(cible, guild, type, raison, config, duree) {
	if (!config?.dmOnSanction) return false;
	if (!cible || typeof cible.send !== 'function') return false;

	const titre = LIBELLES[type] || 'Sanction';

	const lignes = [`Serveur : **${guild.name}**`];
	if (duree) lignes.push(`Durée : ${duree}`);
	lignes.push(`Raison : ${raison || 'aucune raison fournie'}`);

	const container = panel({
		title: titre,
		body: lignes.join('\n'),
		accent: accentFor(config, 'sanction'),
		footer: await footerText(guild, config, { updated: false })
	});

	const envoye = await send(cible, container).catch(() => null);
	if (envoye) return true;

	// Repli en message simple si le format conteneur est refusé en privé.
	const secours = await cible.send({
		content: `**${titre}** — ${guild.name}\n${lignes.join('\n')}`
	}).catch(() => null);

	return Boolean(secours);
}
