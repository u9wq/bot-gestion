import Discord from "discord.js"
import { EmbedBuilder } from "discord.js";
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'calc',
	helpname: 'calc <calcul>',
	description: 'Permet de faire un calcul simple',
	help: 'calc <calcul> | multiplier = * | diviser = /',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const result = eval(args.join(" ").replace(/[^-()\d/*+.%]/g, ''))
		const embed = new Discord.EmbedBuilder()
			.setColor(config.color)
			.addFields(
				{ name: "Calculatrice", value: `\`\`\`${args.join(" ")}\`\`\`` },
				{ name: "Résultat", value: `\`\`\`${result}\`\`\`` }
			)
		return message.reply({ embeds: [embed] });
	},
}