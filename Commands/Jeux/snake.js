import config from '../../config.json' with { type: 'json' };
import SnakeGame from '../../Games/SnakeGame.js';
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'snake',
	helpname: 'snake',
	help: 'snake',
	sname: 'snake',
	aliases: ['snake', 'serpent', 'snakegame'],
	description: 'Permet de jouer au snake',
	use: 'snake',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;

		const game = new SnakeGame({
			message: message,
			buttons: true
		});

		game.start();

	},
}