import db from '../Events/loadDatabase.js';

export async function checkPerm(message, commandName, config) {
	if (config.owners.includes(message.author.id)) return true;

	const publicStatut = await new Promise((resolve, reject) => {
		db.get('SELECT statut FROM public WHERE guild = ? AND statut = ?', [message.guild.id, 'on'], (err, row) => {
			if (err) reject(err);
			resolve(!!row);
		});
	});

	if (publicStatut) {
		const checkPublicCmd = await new Promise((resolve, reject) => {
			db.get('SELECT command FROM cmdperm WHERE perm = ? AND command = ? AND guild = ?', ['public', commandName, message.guild.id], (err, row) => {
				if (err) reject(err);
				resolve(!!row);
			});
		});
		if (checkPublicCmd) return true;
	}

	try {
		const checkUserWl = await new Promise((resolve, reject) => {
			db.get('SELECT id FROM whitelist WHERE id = ?', [message.author.id], (err, row) => {
				if (err) reject(err);
				resolve(!!row);
			});
		});
		if (checkUserWl) return true;

		const checkDbOwner = await new Promise((resolve, reject) => {
			db.get('SELECT id FROM owner WHERE id = ?', [message.author.id], (err, row) => {
				if (err) reject(err);
				resolve(!!row);
			});
		});
		if (checkDbOwner) return true;

		const roles = message.member.roles.cache.map(role => role.id);

		const permissions = await new Promise((resolve, reject) => {
			db.all('SELECT perm FROM permissions WHERE id IN (' + roles.map(() => '?').join(',') + ') AND guild = ?', [...roles, message.guild.id], (err, rows) => {
				if (err) reject(err);
				resolve(rows.map(row => row.perm));
			});
		});
		if (permissions.length === 0) return false;

		const checkCmdPermLevel = await new Promise((resolve, reject) => {
			db.all('SELECT command FROM cmdperm WHERE perm IN (' + permissions.map(() => '?').join(',') + ') AND guild = ?', [...permissions, message.guild.id], (err, rows) => {
				if (err) reject(err);
				resolve(rows.map(row => row.command));
			});
		});

		return checkCmdPermLevel.includes(commandName);
	} catch (error) {
		console.error('Erreur lors de la vérification des permissions:', error);
		return false;
	}
}

export async function denyIfNoPerm(message, commandName, config) {
	if (await checkPerm(message, commandName, config)) return false;

	const { notice, send } = await import('./ui.js');
	const msg = await send(message.channel, notice("Vous n'avez pas la permission d'utiliser cette commande", config.color));
	setTimeout(() => msg.delete().catch(() => { }), 2000);
	return true;
}
