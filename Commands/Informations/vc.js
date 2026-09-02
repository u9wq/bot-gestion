import { EmbedBuilder } from 'discord.js';
import config from '../../config.json' with { type: 'json' };
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'vc',
	helpname: 'vc',
	description: "Permet d'afficher les statistiques du serveur",
	help: 'vc',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;



		const total = message.guild.memberCount;
		const online = message.guild.presences.cache.filter(presence => presence.status !== 'offline').size;
		const vocal = message.guild.members.cache.filter(m => m.voice.channel).size;
		const boost = message.guild.premiumSubscriptionCount || '0';


		const embed = new EmbedBuilder()
			.setTitle(`${message.guild.name + " Statistiques"}`)
			.setColor(config.color)
			.setThumbnail(message.guild.iconURL({ dynamic: true }))
			.setDescription(`*Membres :* **${total}** \n*En ligne :* **${online}** \n*En vocal :* **${vocal}**  \n*Boost :* **${boost}**`)

		await message.channel.send({ embeds: [embed] });
		await message.delete();
	},
}