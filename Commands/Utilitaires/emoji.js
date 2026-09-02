import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'emoji',
	helpname: 'emoji <emoji>',
	description: "Permet de créer un emoji",
	help: 'emoji <emoji>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const emj = args[0].match(/<(a)?:([a-zA-Z0-9_]+):(\d+)>/);
		if (emj) {
			const animated = Boolean(emj[1]);
			const name = emj[2];
			const id = emj[3];
			const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?v=1`;
			const emoji = await message.guild.emojis.create({ name, attachment: url });
			return message.reply(`<${animated ? 'a' : ''}:${name}:${emoji.id}> a été ajouté au serveur.`);
		}
	},
}