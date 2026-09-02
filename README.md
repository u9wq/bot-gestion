# Bot de gestion Discord

Bot de gestion mono-serveur écrit en Node.js avec discord.js v14. Il couvre la
modération, la protection contre les raids, les tickets, la journalisation et
l'animation d'un serveur communautaire.

Le bot est volontairement **mono-serveur** : il quitte automatiquement toute
guilde dont l'identifiant ne correspond pas à `guildId` dans la configuration.

## Fonctionnalités

- **Modération** — bannissement, expulsion, derank, mute textuel et vocal,
  verrouillage et recréation de salons, nettoyage de messages. Les avertissements
  sont conservés en base et consultables membre par membre.
- **Protection anti-raid** — 10 modules indépendants (liens, spam, bots, webhooks,
  everyone, bannissements, salons, rôles, mises à jour du serveur, vanity URL),
  chacun avec sa propre sanction : ban, kick, derank ou timeout. Captcha à bouton
  pour filtrer les arrivées.
- **Tickets** — menu à catégories et sous-catégories, rôles mentionnés
  automatiquement à l'ouverture, gestion des participants, conditions de service,
  liens PayPal par vendeur.
- **Journalisation** — 8 flux indépendants (modération, messages, raids, rôles,
  tickets, vocaux, boosts, configuration), chacun dirigé vers le salon de votre
  choix. `+configlog <id catégorie>` les installe tous d'un coup, visibles des
  seuls owners.
- **Animation** — giveaways avec classement des invitations, confessions anonymes,
  suggestions votées, avis clients, salons vocaux temporaires, salons de
  statistiques, message de bienvenue à variables, rôle automatique.
- **Permissions** — 12 niveaux attribuables aux rôles, avec attachement des
  commandes niveau par niveau, whitelist et liste d'owners.

## Prérequis

| Dépendance | Version |
| --- | --- |
| Node.js | 18 ou plus récent |
| npm | fourni avec Node.js |
| Outils de compilation | requis par `sqlite3` (build-essential sous Linux, Visual Studio Build Tools sous Windows) |

Côté Discord, l'application doit avoir les **trois intents privilégiés activés**
dans le portail développeur : Presence, Server Members et Message Content. Sans
Message Content, aucune commande à préfixe ne fonctionne.

## Installation

```bash
git clone <url-du-depot>
cd bot-gestion
npm install
```

Copiez ensuite le fichier d'exemple et renseignez-le :

```bash
cp .env.example .env
```

`config.json` n'est pas à créer à la main : il est généré au premier démarrage à
partir des variables ci-dessous. `config.example.json` sert uniquement de référence
pour connaître toutes les clés disponibles.

## Configuration

### Variables d'environnement — `.env`

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `TOKEN` | oui | Token du bot, depuis le portail développeur Discord |
| `GUILD_ID` | oui | Identifiant du serveur autorisé. Sans lui le bot quitterait votre serveur au démarrage |
| `OWNERS` | oui | Identifiants des propriétaires, séparés par des virgules |
| `PREFIX` | non | Préfixe des commandes, `+` par défaut |
| `COLOR` | non | Couleur des panneaux, `#ED4245` par défaut |

Sur un panneau d'hébergement type Pterodactyl, ces variables se renseignent dans
l'interface : aucun fichier à écrire à la main.

`GUILD_ID`, `OWNERS`, `PREFIX` et `COLOR` ne servent qu'au **premier démarrage**,
où elles créent `config.json`. Ensuite ce fichier fait foi, et tout se règle depuis
Discord avec `+config`, `+prefix`, `+setcolor` et `+setfooter`. Seul `TOKEN` reste
lu à chaque lancement.

Si une valeur obligatoire manque, le bot s'arrête au démarrage avec un message
expliquant précisément quoi renseigner et où.

### Configuration du serveur — `config.json`

| Clé | Rôle |
| --- | --- |
| `prefix` | Préfixe des commandes |
| `color` | Couleur par défaut des panneaux, au format `#RRGGBB` |
| `owners` | Tableau d'identifiants ayant accès à tout, non modifiable par commande |
| `guildId` | Identifiant de l'unique serveur autorisé |
| `titre`, `description`, `tfooter`, `ticketBanner` | Panneau de tickets |
| `vouchBanner` | Bannière des avis |
| `ctitre`, `cdescription`, `ccolor`, `cimage`, `cemoji` | Panneau de captcha |
| `ticketColor`, `vouchColor`, `confessColor`, `suggestColor` | Couleur par famille de panneau, repli sur `color` |

Hormis `owners` et `guildId`, toutes ces clés se modifient en jeu avec `+config`,
`+prefix`, `+setcolor` et `+setfooter`.

## Lancement

```bash
npm start
```

La base SQLite `database.sqlite3` est créée automatiquement au premier démarrage,
avec l'ensemble de ses tables.

## Architecture

`index.js` est **le point d'entrée**. C'est le seul fichier à exécuter. Il
construit le client, branche les gestionnaires, puis se connecte — dans cet
ordre, pour qu'aucun événement n'arrive avant que ses écouteurs soient posés.

`command.template.js` n'est **pas** un point d'entrée et n'est jamais chargé par
le bot. C'est un gabarit à copier pour créer une nouvelle commande. Il portait
auparavant le nom `base.js`, qui laissait croire à un second démarrage possible.

```
index.js               point d'entrée unique
command.template.js    gabarit de commande, jamais chargé
Commands/              commandes à préfixe, un dossier par catégorie
SlashCommands/         commandes slash
Events/                écouteurs d'événements Discord
Handler/               chargeurs et branchements
Utils/                 code partagé : permissions, panneaux, présence, audit
Games/                 logique du jeu snake
```

### Handler

| Fichier | Rôle |
| --- | --- |
| `loader.js` | Parcours récursif des dossiers et import compatible Windows |
| `Commands.js` | Charge `Commands/`, enregistre noms et alias |
| `slashCommands.js` | Charge `SlashCommands/` et prépare l'enregistrement Discord |
| `Events.js` | Branche les écouteurs et capture leurs erreurs |
| `giveaways.js` | Gestionnaire de tirages et récapitulatif de fin |
| `anticrash.js` | Journalise les erreurs non capturées, arrêt propre sur SIGINT |

## Convention de commande

Chaque fichier de `Commands/` et `SlashCommands/` exporte un objet nommé
`command`. Le chargeur ignore tout fichier qui n'expose pas au minimum `name` et
`run`, et le signale au démarrage sans interrompre le reste.

```js
export const command = {
	name: 'exemple',                          // nom d'appel, unique
	helpname: 'exemple <argument> [option]',  // syntaxe affichée dans +help
	aliases: [],                              // facultatif
	description: 'Une ligne pour +help',
	help: 'Texte long pour +help exemple',
	run: async (bot, message, args, config) => { /* ... */ }
};
```

Les commandes slash remplacent `helpname` et `help` par `options`, au format
attendu par l'API Discord, et reçoivent une interaction à la place du message :
`run: async (bot, interaction, args, config)`.

Partez de `command.template.js` : il contient déjà le contrôle de permission et
les utilitaires d'affichage.

## Permissions

Chaque commande vérifie les droits de son auteur dans cet ordre, le premier test
qui passe autorisant l'exécution :

1. `owners` de `config.json` — accès total
2. Commandes publiques, si `+setpublic on` est actif et la commande rattachée
3. Whitelist, gérée par `+whitelist`
4. Owners ajoutés en base par `+setowner`
5. Niveaux 1 à 12 : `+setperm <niveau> <rôle>` puis `+setcommand <niveau> <commande>`

Par défaut aucun niveau n'est attribué : seul un owner peut lancer des commandes.

## Commandes

Les paramètres entre chevrons sont obligatoires, ceux entre crochets facultatifs.
`+help` n'affiche à chaque membre que les commandes auxquelles il a accès.

### Modérations — 18

| Commande | Rôle |
| --- | --- |
| `+addrole <mention/id> <@role/id>` | Ajoute un rôle à un membre. |
| `+ban <mention/id> <raison>` | Permet de bannir un membre. |
| `+clear [nombre]` | Permet de supprimer le nombre de messages donné |
| `+delallsanction <mention/id>` | Permet d'effacer toutes les sanctions d'un membre |
| `+delrole <mention/id> <@role/id>` | Retire un rôle à un membre. |
| `+delsanction <mention/id> <nombre>` | Permet de retirer la sanction d'un membre |
| `+derank <mention/id> <raison>` | Permet de derank un membre. |
| `+kick <mention/id> <raison>` | Permet de kick un membre. |
| `+lock [salon]` | Permet de verrouiller un salon |
| `+mute <mention/id> [1s/1m/1h/1d]` | Mute un membre. |
| `+piconly <#salon>` | Permet de définir un salon pour le piconly. |
| `+renew [salon]` | Permet de recréer un salon |
| `+sanction [mention/id]` | Permet de voir la liste des sanctions d'un membre |
| `+unban <id>` | Permet de unban |
| `+unlock [salon]` | Permet de déverrouiller un salon |
| `+unmute <mention/id>` | Retire le timeout d'un membre. |
| `+vmute <mention/id> <durée> <raison>` | Permet de mute une personne en vocal. |
| `+warn <mention/id> <raison>` | Permet de sanctionner un membre |

### Antiraid — 13

| Commande | Rôle |
| --- | --- |
| `+antiban <on/off>` | Active/désactive l'antiban |
| `+antibot <on/off>` | Active/désactive l'antibot |
| `+antichannel <on/off>` | Active/désactive l'antichannel |
| `+antieveryone <on/off>` | Active/désactive l'antieveryone |
| `+antilink <on/off> [invite/all]` | Active ou désactive l'antilink |
| `+antirole <on/off>` | Active/désactive l'antirole |
| `+antispam <on/off> [nombre de messages]` | Active ou désactive l'antispam |
| `+antiupdate <on/off>` | Active/désactive l'antiupdate |
| `+antivanity <on/off>` | Active/désactive l'antivanity |
| `+antiwebhook <on/off>` | Active/désactive l'antiwebhook |
| `+captcha [role]` | Permet de configurer/envoyer le captcha |
| `+protect` | Permet d'affiche l'antiraid |
| `+punish <module> <ban/kick/derank/timeout>` | Permet de gérer les sanctions pour l'antiraid |

### Contact — 10

| Commande | Rôle |
| --- | --- |
| `+add <mention/id>` | Permet d'ajouter une personne au ticket |
| `+close` | Permet de close le ticket |
| `+ppl <@user>` | Envoie le lien PayPal d'un utilisateur |
| `+pplconfig <@user> <lien>` | Configure le lien PayPal d'un utilisateur |
| `+remove <mention/id>` | Permet de retirer une personne du ticket |
| `+rename <message>` | Permet de renommer un ticket |
| `+ticket <catégorie id>` | Permet de configurer les tickets |
| `+ticketoption` | Permet de gérer les catégories de ticket (rôles ping automatiques inclus) |
| `+ticketsuboption` | Permet de gérer les sous-catégories d'une catégorie de ticket (menu affiché uniquement à l'utilisateur après son choix de catégorie) |
| `+tos` | Envoie les conditions de service dans un ticket |

### Logs — 9

| Commande | Rôle |
| --- | --- |
| `+boostlog [off]` | Active/désactive les logs boosts |
| `+configlog <id catégorie/off>` | Crée tous les salons de logs dans une catégorie, visibles par les owners |
| `+messagelog [off]` | Active/désactive les logs messages |
| `+modlog [off]` | Active/désactive les logs de modération |
| `+presetlogs [off]` | Active/désactive les logs prédéfinis |
| `+raidlog [off]` | Active/désactive les logs raid |
| `+rolelog [off]` | Active/désactive les logs rôle |
| `+ticketlog [off]` | Active/désactive les logs ticket |
| `+voicelog [off]` | ACtive/désactive les logs vocals |

### Utilitaires — 22

| Commande | Rôle |
| --- | --- |
| `+calc <calcul>` | Permet de faire un calcul simple |
| `+deletestats` | Supprimer les salons de statistiques |
| `+embed` | Permet de créer un embed |
| `+emoji <emoji>` | Permet de créer un emoji |
| `+gend <messsageId>` | Permet de terminer un giveaway |
| `+ghostping <#1,#etc>` | Permet de configurer le ghostping |
| `+greroll <messageId>` | Permet de prendre un nouveau gagnant pour un giveaway |
| `+gstart <durée> <gagnant> <prix>` | Permet de créer un giveaway |
| `+resetinvites [@user]` | Remet à zéro le compteur d'invitations pour les giveaways |
| `+say <message>` | Permet de faire répéter un message |
| `+setautorole <@role/off>` | Configurer le rôle automatique aux nouveaux membres |
| `+setconfess <salon/off>` | Permet de configurer le salon de confession |
| `+setjoin <salon/off> <message>` | Permet de configurer un message de bienvenue |
| `+setsuggest <salon/off>` | Permet de configurer le salon de suggestions |
| `+setupstats` | Créer les salons de statistiques |
| `+setvouch [salon/off]` | Permet de configurer le salon des avis |
| `+snipe` | Permet d'afficher le dernier message qui a été supprimé |
| `+soutien <clear/role> <texte>` | Permet de configurer le soutien |
| `+tempvoc <off/salon> <catégorie>` | Permet de configurer le salon vocal temporaire |
| `+topinvite` | Affiche le classement des membres ayant le plus d'invitations pour les giveaways |
| `+variable` | Permet d'afficher les variables pour le message de bienvenue |
| `+voicemove <@mention/id>` | Permet de déplacer un membre de vocal |

### Informations — 16

| Commande | Rôle |
| --- | --- |
| `+alladmins` | Permet d'afficher la liste des administrateurs |
| `+allbans` | Permet de voir la liste des membres bannis |
| `+allbots` | Permet de voir la liste des bots |
| `+banner [mention/id]` | Permet d'afficher la bannière d'une personne |
| `+boosters` | Permet de voir la liste des boosters |
| `+help` | Permet d'afficher la liste des commandes |
| `+helpall` | Permet d'afficher la liste des commandes par permissions |
| `+pic [mention/id]` | Permet d'afficher la photo de profil d'une personne |
| `+ping` | Permet d'afficher la latence du bot |
| `+roleinfo <mention/id>` | Affiche des informations sur un rôle |
| `+rolemembers <mention/id>` | Permet d'afficher un rôle avec ses membres |
| `+serverbanner` | Affiche la bannière du serveur |
| `+serverinfo` | Affiche les informations du serveur |
| `+serverpic` | Affiche l'icône du serveur |
| `+userinfo [mention/id]` | Permet d'afficher des informations sur un membre du serveur |
| `+vc` | Permet d'afficher les statistiques du serveur |

### Paramètres — 15

| Commande | Rôle |
| --- | --- |
| `+config [clé] [valeur/reset]` | — |
| `+delcommand [perms] [commande]` | Permet de retirer une commande d'une ou plusieurs permissions |
| `+delperm [perms] [role]` | Permet de retirer un rôle d'une permission |
| `+owner` | Permet de voir la liste des owner |
| `+perms` | Permet de gérer les permissions |
| `+prefix` | Permet de changer le préfixe |
| `+setcolor` | Permet de changer la couleur des embed |
| `+setcommand [perms] [commande]` | Permet d'ajouter plusieurs commandes à une ou plusieurs permissions |
| `+setfooter <nom/reset>` | Permet de choisir le nom affiché dans le bas des panneaux |
| `+setowner <mention/id> [mention/id...]` | Permet d'ajouter des owners |
| `+setperm [perms] [role]` | Permet d'ajouter une permission à un rôle |
| `+setpublic <on/off>` | Active ou désactive les commandes publiques. |
| `+unowner <mention/id>` | Permet de retirer un utilisateur de la liste des owners |
| `+unwhitelist <mention/id>` | Permet de retirer un utilisateur de la whitelist |
| `+whitelist [mention/id]` | Permet de gérer la whitelist |

### Gestions — 4

| Commande | Rôle |
| --- | --- |
| `+activity <listen/play/stream/watch/compet/custom/stop> [texte]` | Permet de changer l'activité du bot |
| `+avatar <url>` | Permet de changer la photo de profil du bot |
| `+name <texte>` | Permet de changer le nom |
| `+presence <online/idle/dnd/invisible>` | Permet de changer le statut du bot |

### Jeux — 1

| Commande | Rôle |
| --- | --- |
| `+snake` | Permet de jouer au snake |

### Commandes slash — 1

| Commande | Rôle |
| --- | --- |
| `/vouch` | Permet de vouch |
## Licence

MIT — voir [LICENSE](LICENSE).
