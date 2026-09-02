/**
 * Empêche le processus de s'arrêter sur une erreur non capturée.
 * Les erreurs sont journalisées plutôt qu'ignorées silencieusement.
 */
const anticrashHandler = (bot) => {
	bot.on('error', (error) => console.error('[CLIENT] erreur :', error));

	process.on('uncaughtException', (error, origine) =>
		console.error('[PROCESS] exception non capturée :', origine, error));

	process.on('unhandledRejection', (raison) =>
		console.error('[PROCESS] promesse rejetée sans catch :', raison));

	process.on('warning', (avertissement) => {
		// Node imprime déjà les avertissements de dépréciation : on ne double pas.
		// Celui de discord-giveaways vient de sa propre écoute de l'événement 'ready'.
		if (avertissement.name === 'DeprecationWarning') return;
		console.warn('[PROCESS] avertissement :', avertissement.message);
	});

	const arreter = async (signal) => {
		console.log(`[PROCESS] arrêt demandé (${signal}), déconnexion du bot`);
		await bot.destroy().catch(() => { });
		process.exit(0);
	};

	process.on('SIGINT', () => arreter('SIGINT'));
	process.on('SIGTERM', () => arreter('SIGTERM'));
};

export default anticrashHandler;
