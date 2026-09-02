import { EmbedBuilder } from 'discord.js';
import sendLog from '../Events/sendlog.js';
import { checkPerm } from './perms.js';
import { resolveColor } from './ui.js';

export const COMMANDES_SENSIBLES = new Set([
	// permissions et acces
	'setowner', 'unowner', 'whitelist', 'unwhitelist', 'perms',
	'setperm', 'delperm', 'setcommand', 'delcommand', 'setpublic',
	// apparence et configuration
	'config', 'prefix', 'setcolor', 'setfooter',
	// identite du bot
	'name', 'avatar', 'activity', 'presence',
	// panneaux et salons
	'ticket', 'ticketoption', 'ticketsuboption', 'captcha',
	'setvouch', 'setconfess', 'setsuggest', 'setjoin', 'setautorole',
	'tempvoc', 'ghostping', 'soutien', 'setupstats', 'deletestats',
	'pplconfig', 'resetinvites',
	// antiraid
	'punish', 'antiban', 'antibot', 'antichannel', 'antieveryone', 'antilink',
	'antirole', 'antispam', 'antiupdate', 'antivanity', 'antiwebhook',
	// usurpation
	'say', 'embed',
	// logs eux-memes
	'configlog', 'modlog', 'messagelog', 'raidlog', 'rolelog',
	'ticketlog', 'boostlog', 'voicelog', 'presetlogs'
]);

export async function auditCommand(message, commandName, args, config) {
	if (!COMMANDES_SENSIBLES.has(commandName)) return;
	if (!message.guild) return;

	let autorise = false;
	try {
		autorise = await checkPerm(message, commandName, config);
	} catch {
		autorise = false;
	}

	let arguments_ = args.join(' ').trim();
	if (arguments_.length > 900) arguments_ = arguments_.slice(0, 900) + '…';

	const embed = new EmbedBuilder()
		.setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
		.setTitle(autorise ? 'Commande de configuration' : 'Tentative refusée')
		.setDescription(`\`${config.prefix}${commandName}${arguments_ ? ' ' + arguments_ : ''}\``)
		.addFields(
			{ name: 'Auteur', value: `<@${message.author.id}>`, inline: true },
			{ name: 'Salon', value: `<#${message.channel.id}>`, inline: true },
			{ name: 'Résultat', value: autorise ? 'Autorisée' : 'Refusée', inline: true }
		)
		.setColor(autorise ? resolveColor(config.color) : 0xED4245)
		.setTimestamp();

	sendLog(message.guild, embed, 'configlog');
}
