import Discord from "discord.js"
import { EmbedBuilder } from "discord.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'variable',
	helpname: 'variable',
	description: "Permet d'afficher les variables pour le message de bienvenue",
	help: 'variable',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		const variables = [
			'{user}',
			'{user.name}',
			'{user.tag}',
			'{user.id}',
			'{guild}',
			'{guild.memberCount}'
		];
		const desc = variables.map(v => `• \`${v}\``).join('\n') +
			'\n\nExemple : Bienvenue {user} sur {guild}';
		const embed = new Discord.EmbedBuilder()
			.setTitle('Variables pour les messages de bienvenue')
			.setDescription(desc)
			.setColor(config.color);
		message.reply({ embeds: [embed] });
	},
}