import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'voicemove',
	helpname: 'voicemove <@mention/id>',
	description: "Permet de déplacer un membre de vocal",
	help: 'voicemove <@mention/id>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
		if (!member) return message.reply("Utilisateur introuvable.");
		if (!member.voice.channel) return message.reply("Ce membre n'est pas en vocal.");
		if (!message.member.voice.channel) return message.reply("Vous devez être en vocal pour utiliser cette commande.");

		try {
			await member.voice.setChannel(message.member.voice.channel);
			message.reply(`<@${member.id}> a été move.`);
		} catch (e) {
			message.reply("Je n'ai pas la permission de le move.");
		}
	},
}