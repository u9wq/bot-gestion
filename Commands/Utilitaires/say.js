import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'say',
	helpname: 'say <message>',
	description: "Permet de faire répéter un message",
	help: 'say <message>',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const text = args.join(' ');
		if (!text) {
			return
		}
		await message.delete();
		await message.channel.send(text);
	},
}