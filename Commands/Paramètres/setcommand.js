import db from "../../Events/loadDatabase.js";
import fs from "fs"
import path from "path";
import config from "../../config.json" with { type: 'json' };
import { denyIfNoPerm } from '../../Utils/perms.js';

export const command = {
	name: 'setcommand',
	helpname: 'setcommand [perms] [commande]',
	aliases: ['setcmd', 'setcommande'],
	description: "Permet d'ajouter plusieurs commandes à une ou plusieurs permissions",
	help: 'setcommand [perms] [commande]',
	run: async (bot, message, args, config) => {
		if (await denyIfNoPerm(message, command.name, config)) return;


		const permLevels = args[0]
			.split(',')
			.map(level => {
				const trimmed = level.trim().toLowerCase();
				if (trimmed === "public") return "public";
				const num = parseInt(trimmed, 10);
				if (!isNaN(num) && num >= 1 && num <= 12) return num;
				return null;
			})
			.filter(level => level !== null);

		const commands = args.slice(1).join(' ').split(',').map(cmd => cmd.trim().toLowerCase());

		if (permLevels.length === 0) {
			return
		}

		if (commands.length === 0) {
			return
		}

		const commandExists = async (commandName) => {
			const commandFolders = fs.readdirSync('./Commands').filter((file) => fs.statSync(path.join('./Commands', file)).isDirectory());
			for (const folder of commandFolders) {
				const commandFiles = fs.readdirSync(`./Commands/${folder}`).filter(file => file.endsWith('.js'));
				for (const file of commandFiles) {
					const cmd = (await import(`../../Commands/${folder}/${file}`)).command;
					if (cmd.help && cmd.help.name.toLowerCase() === commandName) {
						return true;
					}
				}
			}
			return false;
		};

		for (const command of commands) {
			if (!commandExists(command)) {
				return
			}
		}

		for (const permLevel of permLevels) {
			for (const command of commands) {
				db.get(
					'SELECT * FROM cmdperm WHERE perm = ? AND command = ? AND guild = ?',
					[permLevel, command, message.guild.id],
					(err, row) => {
						if (err) {
							console.error("Erreur lors de la vérification des permissions dans la base de données :", err);
							return;
						}

						if (row) {
							return;
						} else {
							db.run(
								`INSERT INTO cmdperm (perm, command, guild) VALUES (?, ?, ?)`,
								[permLevel, command, message.guild.id],
								(err) => {
									if (err) {
										return;
									}
								}
							);
						}
					}
				);
			}
		}
		message.reply(`La/Les commande \`${commands.join(', ')}\` a/ont été ajouté à/aux permission \`${permLevels.join(', ')}\`.`);
	},
}