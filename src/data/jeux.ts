import { Jeu } from "@/types/jeu";

export const jeux: Jeu[] = [
  {
    id: "1",
    slug: "les-colons-de-catane",
    nom: "Les Colons de Catane",
    annee: 1995,
    description: "Colonisez l'île de Catane en collectant des ressources, en construisant des routes et des villes, et en commerçant avec vos adversaires. Un classique incontournable du jeu moderne.",
    joueursMin: 3,
    joueursMax: 4,
    dureeMin: 60,
    dureeMax: 120,
    ageMin: 10,
    complexite: "Simple",
    note: 8.2,
    categories: ["Stratégie", "Familial"],
    mecaniques: ["Placement de routes", "Commerce", "Gestion de ressources"],
    regles: [
      "Chaque joueur commence avec 2 colonies et 2 routes",
      "À chaque tour, lancez 2 dés pour produire des ressources",
      "Construisez routes, colonies et villes avec vos ressources",
      "Échangez avec la banque (4:1) ou les autres joueurs",
      "Le voleur bloque une ressource quand un 7 est lancé",
      "Premier à 10 points de victoire gagne"
    ],
    imageUrl: "/images/catane.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B00U2XSVR4", prix: "36,50€" },
      philibert: { url: "https://www.philibertnet.com/fr/kosmos/594-catane-3770000282827.html", prix: "34,95€" },
      cultura: { url: "https://www.cultura.com/p-les-colons-de-catane-3770000282827.html", prix: "37,99€" },
      fnac: { url: "https://www.fnac.com/a2728147/Kosmos-Les-Colons-de-Catane", prix: "38,99€" }
    }
  },
  {
    id: "2",
    slug: "pandemic",
    nom: "Pandémie",
    annee: 2008,
    description: "Travaillez en équipe pour éradiquer quatre maladies qui se propagent à travers le monde. Un chef-d'œuvre coopératif où chaque décision compte.",
    joueursMin: 2,
    joueursMax: 4,
    dureeMin: 45,
    dureeMax: 60,
    ageMin: 8,
    complexite: "Simple",
    note: 9.1,
    categories: ["Coopératif", "Stratégie"],
    mecaniques: ["Coopération", "Gestion de main", "Déplacement"],
    regles: [
      "Les joueurs incarnent des spécialistes aux rôles uniques",
      "À chaque tour : effectuez 4 actions puis piochez 2 cartes",
      "Les villes s'infectent automatiquement à chaque fin de tour",
      "Trouvez les 4 remèdes en rassemblant 5 cartes de même couleur",
      "Si une ville dépasse 3 cubes de maladie, c'est une épidémie en chaîne",
      "Gagnez en trouvant les 4 remèdes avant que le temps ne manque"
    ],
    imageUrl: "/images/pandemic.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B001BKUXUA", prix: "29,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/z-man-games/1540-pandemic-681706711003.html", prix: "27,95€" },
      cultura: { url: "https://www.cultura.com/p-pandemie-681706711003.html", prix: "31,99€" },
      fnac: { url: "https://www.fnac.com/a5342311/Z-Man-Games-Pandemic", prix: "32,99€" }
    }
  },
  {
    id: "3",
    slug: "les-aventuriers-du-rail",
    nom: "Les Aventuriers du Rail",
    annee: 2004,
    description: "Construisez des lignes ferroviaires à travers l'Amérique en collectant des cartes locomotives. Accessible, tendu et toujours plaisant.",
    joueursMin: 2,
    joueursMax: 5,
    dureeMin: 60,
    dureeMax: 90,
    ageMin: 8,
    complexite: "Très simple",
    note: 8.7,
    categories: ["Familial", "Stratégie"],
    mecaniques: ["Collection de sets", "Placement de wagons", "Connexion de routes"],
    regles: [
      "Collectez des cartes wagons de couleurs identiques",
      "Posez vos wagons sur des routes en dépensant les cartes correspondantes",
      "Reliez les villes indiquées sur vos billets de destination",
      "Les billets non complétés vous font perdre des points",
      "Bonus pour la plus longue route continue",
      "Le jeu se termine quand un joueur a 2 wagons ou moins"
    ],
    imageUrl: "/images/aventuriers-rail.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B00008URUS", prix: "41,50€" },
      philibert: { url: "https://www.philibertnet.com/fr/days-of-wonder/169-les-aventuriers-du-rail-824968717011.html", prix: "39,95€" },
      cultura: { url: "https://www.cultura.com/p-les-aventuriers-du-rail-824968717011.html", prix: "42,99€" },
      fnac: { url: "https://www.fnac.com/a1145801/Days-of-Wonder-Les-Aventuriers-du-Rail", prix: "43,99€" }
    }
  },
  {
    id: "4",
    slug: "wingspan",
    nom: "Wingspan",
    annee: 2019,
    description: "Attirez des oiseaux dans vos réserves naturelles pour créer un habitat accueillant et productif. Un jeu magnifique alliant stratégie et passion de l'ornithologie.",
    joueursMin: 1,
    joueursMax: 5,
    dureeMin: 40,
    dureeMax: 70,
    ageMin: 10,
    complexite: "Intermédiaire",
    note: 9.0,
    categories: ["Stratégie", "Familial", "Solo"],
    mecaniques: ["Pose d'ouvriers", "Collection de sets", "Gestion de plateau"],
    regles: [
      "Choisissez 5 cartes oiseaux et 2 objectifs de fin de partie au départ",
      "À votre tour : jouez un oiseau, collectez de la nourriture, pondez des œufs ou piochez des cartes",
      "Chaque oiseau active une chaîne de pouvoirs sur son habitat",
      "Les oiseaux coûtent de la nourriture et des œufs pour être joués",
      "Gérez vos 3 habitats : forêt, prairie et marécage",
      "Comptez les points de toutes vos cartes, objectifs et œufs"
    ],
    imageUrl: "/images/wingspan.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B07YL9MFKB", prix: "54,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/stonemaier-games/90555-wingspan-826956600054.html", prix: "52,95€" },
      cultura: { url: "https://www.cultura.com/p-wingspan-826956600054.html", prix: "55,99€" },
      fnac: { url: "https://www.fnac.com/a14508849/Stonemaier-Games-Wingspan", prix: "56,99€" }
    }
  },
  {
    id: "5",
    slug: "7-wonders",
    nom: "7 Wonders",
    annee: 2010,
    description: "Construisez la plus grande civilisation antique en développant votre ville et votre merveille du monde. Un jeu de draft de cartes fluide et brillant.",
    joueursMin: 2,
    joueursMax: 7,
    dureeMin: 30,
    dureeMax: 45,
    ageMin: 10,
    complexite: "Simple",
    note: 8.6,
    categories: ["Stratégie", "Familial"],
    mecaniques: ["Draft de cartes", "Gestion de ressources", "Construction de civilisation"],
    regles: [
      "Chaque joueur dirige une cité antique avec sa merveille unique",
      "Piochez des cartes, gardez-en une et passez le reste au voisin",
      "Construisez des bâtiments en payant les ressources requises",
      "Commercez avec vos voisins pour obtenir leurs ressources",
      "Construisez les étages de votre merveille pour des bonus puissants",
      "Après 3 âges, comptez les points militaires, civils et scientifiques"
    ],
    imageUrl: "/images/7wonders.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B004DGOOJG", prix: "37,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/repos-production/2491-7-wonders-5425016921012.html", prix: "35,95€" },
      cultura: { url: "https://www.cultura.com/p-7-wonders-5425016921012.html", prix: "38,99€" },
      fnac: { url: "https://www.fnac.com/a5055661/Repos-Production-7-Wonders", prix: "39,99€" }
    }
  },
  {
    id: "6",
    slug: "carcassonne",
    nom: "Carcassonne",
    annee: 2000,
    description: "Posez des tuiles pour construire un paysage médiéval et placez vos partisans stratégiquement pour marquer des points. Simple à apprendre, profond à maîtriser.",
    joueursMin: 2,
    joueursMax: 5,
    dureeMin: 35,
    dureeMax: 45,
    ageMin: 7,
    complexite: "Très simple",
    note: 8.3,
    categories: ["Familial", "Stratégie"],
    mecaniques: ["Placement de tuiles", "Contrôle de zone", "Gestion de meeples"],
    regles: [
      "Piochez une tuile et placez-la en continuant le paysage existant",
      "Placez optionnellement un partisan (meeple) sur la tuile posée",
      "Les villes fermées rapportent 2 points par tuile et bouclier",
      "Les routes terminées rapportent 1 point par tuile",
      "Les monastères entourés rapportent 9 points",
      "En fin de partie, les éléments inachevés rapportent la moitié des points"
    ],
    imageUrl: "/images/carcassonne.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B00UAVKQOU", prix: "29,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/hans-im-gluck/631-carcassonne-4015566300798.html", prix: "27,95€" },
      cultura: { url: "https://www.cultura.com/p-carcassonne-4015566300798.html", prix: "31,99€" },
      fnac: { url: "https://www.fnac.com/a1082669/Hans-im-Gluck-Carcassonne", prix: "32,99€" }
    }
  },
  {
    id: "7",
    slug: "terraforming-mars",
    nom: "Terraforming Mars",
    annee: 2016,
    description: "Incarnez une corporation et terraformez Mars en augmentant la température, l'oxygène et les océans. Un jeu de moteur de cartes épique et satisfaisant.",
    joueursMin: 1,
    joueursMax: 5,
    dureeMin: 120,
    dureeMax: 180,
    ageMin: 12,
    complexite: "Complexe",
    note: 9.2,
    categories: ["Stratégie", "Expert", "Solo"],
    mecaniques: ["Construction de moteur", "Gestion de main", "Placement de tuiles"],
    regles: [
      "Chaque joueur représente une corporation avec des capacités uniques",
      "Jouez des cartes projet en payant leur coût en mégacrédits",
      "Augmentez les paramètres globaux : température, oxygène, océans",
      "Placez des tuiles forêt, océan et cité sur le plateau de Mars",
      "Récoltez vos ressources à chaque génération selon votre production",
      "La partie se termine quand les 3 paramètres atteignent leurs maximums"
    ],
    imageUrl: "/images/terraforming-mars.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B01MCWMKLM", prix: "54,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/fryxgames/69973-terraforming-mars-3760175511234.html", prix: "52,95€" },
      cultura: { url: "https://www.cultura.com/p-terraforming-mars-3760175511234.html", prix: "55,99€" },
      fnac: { url: "https://www.fnac.com/a11025965/FryxGames-Terraforming-Mars", prix: "56,99€" }
    }
  },
  {
    id: "8",
    slug: "azul",
    nom: "Azul",
    annee: 2017,
    description: "Collectez des carreaux de faïence colorés pour décorer le palais du roi du Portugal. Un jeu d'une élégance absolue, tendu et accessible.",
    joueursMin: 2,
    joueursMax: 4,
    dureeMin: 30,
    dureeMax: 45,
    ageMin: 8,
    complexite: "Simple",
    note: 8.8,
    categories: ["Familial", "Stratégie"],
    mecaniques: ["Draft", "Placement de tuiles", "Gestion de pénalités"],
    regles: [
      "Les fabriques sont remplies de 4 carreaux aléatoires chacune",
      "À votre tour, prenez tous les carreaux d'une même couleur d'une fabrique",
      "Les carreaux non pris vont au centre, disponibles pour tous",
      "Placez vos carreaux sur les lignes de votre plateau personnel",
      "Les lignes complètes se transfèrent sur le mur et rapportent des points",
      "Les carreaux en trop tombent sur la ligne de plancher et pénalisent"
    ],
    imageUrl: "/images/azul.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B075M7H7BZ", prix: "34,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/plan-b-games/78179-azul-826956600030.html", prix: "32,95€" },
      cultura: { url: "https://www.cultura.com/p-azul-826956600030.html", prix: "35,99€" },
      fnac: { url: "https://www.fnac.com/a12059095/Plan-B-Games-Azul", prix: "36,99€" }
    }
  },
  {
    id: "9",
    slug: "sheriff-of-nottingham",
    nom: "Sheriff of Nottingham",
    annee: 2014,
    description: "Bluffez, négociez et corrompez le shérif pour faire passer vos marchandises en ville. Un jeu de bluff hilarant qui crée des souvenirs mémorables.",
    joueursMin: 3,
    joueursMax: 5,
    dureeMin: 60,
    dureeMax: 90,
    ageMin: 14,
    complexite: "Simple",
    note: 7.8,
    categories: ["Ambiance", "Bluff", "Négociation"],
    mecaniques: ["Bluff", "Négociation", "Gestion de main"],
    regles: [
      "À tour de rôle, un joueur devient le shérif",
      "Les marchands mettent des cartes dans une sacoche et déclarent leur contenu",
      "Le shérif décide d'inspecter ou de laisser passer chaque sacoche",
      "Si le contenu correspond, le shérif paye une pénalité",
      "Si le marchand a menti, il perd ses marchandises illégales",
      "On peut négocier, promettre ou corrompre le shérif librement"
    ],
    imageUrl: "/images/sheriff-nottingham.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B00NFXOUMI", prix: "39,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/cmon/8186-sheriff-of-nottingham-889696000514.html", prix: "37,95€" },
      cultura: { url: "https://www.cultura.com/p-sheriff-of-nottingham-889696000514.html", prix: "40,99€" },
      fnac: { url: "https://www.fnac.com/a8069752/CMON-Sheriff-of-Nottingham", prix: "41,99€" }
    }
  },
  {
    id: "10",
    slug: "dixit",
    nom: "Dixit",
    annee: 2008,
    description: "Racontez des histoires à travers de magnifiques illustrations poétiques. Le jeu de créativité par excellence, accessible à tous dès 6 ans.",
    joueursMin: 3,
    joueursMax: 6,
    dureeMin: 30,
    dureeMax: 45,
    ageMin: 6,
    complexite: "Très simple",
    note: 8.1,
    categories: ["Familial", "Créativité", "Ambiance"],
    mecaniques: ["Storytelling", "Votation", "Déduction"],
    regles: [
      "Le conteur choisit une carte et dit un mot, une phrase ou fait un son",
      "Les autres joueurs choisissent leur carte la plus proche de l'indice",
      "Toutes les cartes sont mélangées et révélées face visible",
      "Chaque joueur vote pour la carte qu'il pense être celle du conteur",
      "Si tout le monde ou personne ne trouve, le conteur marque 0 point",
      "Les bons votants et le conteur marquent des points si au moins un trouve"
    ],
    imageUrl: "/images/dixit.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B003PZKIJ8", prix: "27,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/libellud/1095-dixit-3307320000004.html", prix: "25,95€" },
      cultura: { url: "https://www.cultura.com/p-dixit-3307320000004.html", prix: "28,99€" },
      fnac: { url: "https://www.fnac.com/a3851982/Libellud-Dixit", prix: "29,99€" }
    }
  },
  {
    id: "11",
    slug: "ticket-to-ride-europe",
    nom: "Les Aventuriers du Rail : Europe",
    annee: 2005,
    description: "Voyagez à travers l'Europe en construisant votre réseau ferroviaire. Cette version européenne ajoute tunnels, ferries et gares pour encore plus de profondeur.",
    joueursMin: 2,
    joueursMax: 5,
    dureeMin: 60,
    dureeMax: 90,
    ageMin: 8,
    complexite: "Très simple",
    note: 8.5,
    categories: ["Familial", "Stratégie"],
    mecaniques: ["Collection de sets", "Placement de wagons", "Connexion de routes"],
    regles: [
      "Mêmes règles de base que la version américaine",
      "Les tunnels nécessitent des cartes supplémentaires aléatoires",
      "Les ferries exigent des locomotives (jokers)",
      "Construisez des gares pour emprunter les routes adverses",
      "Les billets de destination longue distance rapportent plus de points",
      "Bonus de 10 points pour le plus long trajet continu"
    ],
    imageUrl: "/images/aventuriers-rail-europe.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B001DJZNIA", prix: "44,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/days-of-wonder/170-les-aventuriers-du-rail-europe-824968717028.html", prix: "42,95€" },
      cultura: { url: "https://www.cultura.com/p-les-aventuriers-du-rail-europe-824968717028.html", prix: "45,99€" },
      fnac: { url: "https://www.fnac.com/a1419801/Days-of-Wonder-Les-Aventuriers-du-Rail-Europe", prix: "46,99€" }
    }
  },
  {
    id: "12",
    slug: "splendor",
    nom: "Splendor",
    annee: 2014,
    description: "Devenez le marchand de gemmes le plus prospère de la Renaissance. Un jeu de collection et de développement d'une fluidité remarquable.",
    joueursMin: 2,
    joueursMax: 4,
    dureeMin: 30,
    dureeMax: 60,
    ageMin: 10,
    complexite: "Simple",
    note: 8.0,
    categories: ["Familial", "Stratégie"],
    mecaniques: ["Collection de gemmes", "Construction de moteur", "Course aux points"],
    regles: [
      "À votre tour : prenez des jetons gemmes, achetez une carte ou réservez",
      "Prenez 3 jetons de couleurs différentes, ou 2 jetons de même couleur",
      "Les cartes développement offrent des bonus permanents de gemmes",
      "Réservez une carte et prenez un jeton or (joker)",
      "Les nobles visitent automatiquement celui qui réunit leurs bonus",
      "Premier à 15 points de prestige remporte la partie"
    ],
    imageUrl: "/images/splendor.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B00IZEUFIA", prix: "32,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/space-cowboys/8354-splendor-3558380021476.html", prix: "30,95€" },
      cultura: { url: "https://www.cultura.com/p-splendor-3558380021476.html", prix: "33,99€" },
      fnac: { url: "https://www.fnac.com/a7688345/Space-Cowboys-Splendor", prix: "34,99€" }
    }
  },
  {
    id: "13",
    slug: "coup",
    nom: "Coup",
    annee: 2012,
    description: "Éliminez vos adversaires en bluffant sur votre identité dans ce jeu de déduction intense. Une partie dure 15 minutes mais on ne peut pas s'arrêter.",
    joueursMin: 2,
    joueursMax: 6,
    dureeMin: 15,
    dureeMax: 20,
    ageMin: 10,
    complexite: "Très simple",
    note: 7.9,
    categories: ["Ambiance", "Bluff", "Apéro"],
    mecaniques: ["Bluff", "Déduction", "Élimination de joueurs"],
    regles: [
      "Chaque joueur reçoit 2 cartes personnage secrètes et 2 pièces",
      "À votre tour, effectuez une action (selon votre personnage ou non)",
      "N'importe qui peut contester votre action si elle semble fausse",
      "Si vous bluffez et êtes démasqué, vous perdez une influence",
      "Perdre ses 2 influences vous élimine de la partie",
      "Le dernier joueur avec des influences gagne"
    ],
    imageUrl: "/images/coup.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B00GDI4HX4", prix: "12,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/indie-boards-and-cards/8003-coup-851395006086.html", prix: "10,95€" },
      cultura: { url: "https://www.cultura.com/p-coup-851395006086.html", prix: "13,99€" },
      fnac: { url: "https://www.fnac.com/a7688300/Indie-Boards-Cards-Coup", prix: "14,99€" }
    }
  },
  {
    id: "14",
    slug: "puerto-rico",
    nom: "Puerto Rico",
    annee: 2002,
    description: "Développez votre plantation à Puerto Rico en choisissant des rôles et en exportant des marchandises vers l'Europe. Un classique de la stratégie.",
    joueursMin: 3,
    joueursMax: 5,
    dureeMin: 90,
    dureeMax: 150,
    ageMin: 12,
    complexite: "Complexe",
    note: 8.5,
    categories: ["Stratégie", "Expert"],
    mecaniques: ["Sélection de rôles", "Gestion de ressources", "Construction"],
    regles: [
      "À chaque round, les joueurs choisissent des rôles à tour de rôle",
      "Chaque rôle offre un avantage supplémentaire à celui qui le choisit",
      "Cultivez des plantations et construisez des bâtiments de production",
      "Exportez vos marchandises par navire pour gagner des points de victoire",
      "Vendez vos productions au marché pour obtenir des doublons",
      "La partie se termine quand les jetons victoire ou les bâtiments s'épuisent"
    ],
    imageUrl: "/images/puerto-rico.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B000QNPD5E", prix: "44,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/alea/193-puerto-rico-4005556813063.html", prix: "42,95€" },
      cultura: { url: "https://www.cultura.com/p-puerto-rico-4005556813063.html", prix: "45,99€" },
      fnac: { url: "https://www.fnac.com/a1082670/Ravensburger-Puerto-Rico", prix: "46,99€" }
    }
  },
  {
    id: "15",
    slug: "hanabi",
    nom: "Hanabi",
    annee: 2010,
    description: "Créez le feu d'artifice parfait en coopérant avec vos équipiers, sans voir vos propres cartes. Un défi de communication unique et fascinant.",
    joueursMin: 2,
    joueursMax: 5,
    dureeMin: 25,
    dureeMax: 30,
    ageMin: 8,
    complexite: "Simple",
    note: 7.7,
    categories: ["Coopératif", "Familial", "Apéro"],
    mecaniques: ["Coopération", "Déduction", "Gestion d'information limitée"],
    regles: [
      "Tenez vos cartes face vers les autres joueurs, sans les voir vous-même",
      "À votre tour, donnez un indice, défaussez ou jouez une carte",
      "Un indice précise soit une couleur soit un numéro pour un autre joueur",
      "Jouez les cartes dans l'ordre 1-2-3-4-5 pour chaque couleur de feu",
      "Chaque erreur coûte un jeton de foudre, 3 erreurs = défaite",
      "Visez le score parfait de 25 points"
    ],
    imageUrl: "/images/hanabi.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B00CXC2T9G", prix: "11,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/r-r-games/7780-hanabi-655132003956.html", prix: "9,95€" },
      cultura: { url: "https://www.cultura.com/p-hanabi-655132003956.html", prix: "12,99€" },
      fnac: { url: "https://www.fnac.com/a7261982/R-R-Games-Hanabi", prix: "13,99€" }
    }
  },
  {
    id: "16",
    slug: "blood-rage",
    nom: "Blood Rage",
    annee: 2015,
    description: "Menez votre clan viking à la gloire avant Ragnarok ! Conquérez, pillez et mourez avec honneur dans cet épique jeu de combat et de draft.",
    joueursMin: 2,
    joueursMax: 4,
    dureeMin: 60,
    dureeMax: 90,
    ageMin: 14,
    complexite: "Intermédiaire",
    note: 8.6,
    categories: ["Stratégie", "Combat", "Expert"],
    mecaniques: ["Draft de cartes", "Contrôle de zone", "Gestion de clan"],
    regles: [
      "3 âges scandés par l'avancée de Ragnarok sur le plateau",
      "Draftez des cartes pour améliorer votre clan avant chaque âge",
      "Envahissez les provinces avec vos figurines vikings",
      "Combattez en révélant simultanément des cartes de rage",
      "Mourir au combat n'est pas une honte : cela rapporte de la gloire",
      "Accumulez de la gloire via les combats, les pillages et les quêtes"
    ],
    imageUrl: "/images/blood-rage.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B00UANRM9S", prix: "69,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/cmon/26073-blood-rage-889696000682.html", prix: "67,95€" },
      cultura: { url: "https://www.cultura.com/p-blood-rage-889696000682.html", prix: "70,99€" },
      fnac: { url: "https://www.fnac.com/a9280734/CMON-Blood-Rage", prix: "71,99€" }
    }
  },
  {
    id: "17",
    slug: "codenames",
    nom: "Codenames",
    annee: 2015,
    description: "Guidez votre équipe vers les bons mots-espions avec des indices d'un seul mot. Un jeu d'association d'idées brillant qui révèle comment votre cerveau fonctionne.",
    joueursMin: 2,
    joueursMax: 8,
    dureeMin: 15,
    dureeMax: 30,
    ageMin: 10,
    complexite: "Très simple",
    note: 8.4,
    categories: ["Ambiance", "Coopératif", "Apéro"],
    mecaniques: ["Association de mots", "Déduction", "Communication limitée"],
    regles: [
      "25 cartes de mots sont disposées en grille 5x5",
      "Chaque équipe a un maître espion qui voit la carte des agents",
      "Le maître espion donne un mot + un nombre pour guider son équipe",
      "L'équipe désigne les mots qu'elle pense être ses agents",
      "Toucher l'assassin fait perdre instantanément",
      "L'équipe qui contacte tous ses agents en premier gagne"
    ],
    imageUrl: "/images/codenames.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B018ROZYCE", prix: "19,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/czech-games-edition/60908-codenames-8594156310393.html", prix: "17,95€" },
      cultura: { url: "https://www.cultura.com/p-codenames-8594156310393.html", prix: "20,99€" },
      fnac: { url: "https://www.fnac.com/a9280730/Czech-Games-Edition-Codenames", prix: "21,99€" }
    }
  },
  {
    id: "18",
    slug: "arkham-horror-lcg",
    nom: "Arkham Horror : Le Jeu de Cartes",
    annee: 2016,
    description: "Plongez dans l'univers lovecraftien et affrontez des horreurs indicibles dans ce jeu de cartes narratif coopératif. Chaque campagne est une aventure unique.",
    joueursMin: 1,
    joueursMax: 4,
    dureeMin: 60,
    dureeMax: 120,
    ageMin: 14,
    complexite: "Complexe",
    note: 8.9,
    categories: ["Coopératif", "Expert", "Solo", "Aventure"],
    mecaniques: ["Construction de deck", "Narration", "Gestion de santé mentale"],
    regles: [
      "Choisissez votre investigateur parmi les différents archétypes disponibles",
      "Construisez votre deck avec des cartes d'actifs, événements et compétences",
      "Explorez les lieux de la carte en résolvant des tests de caractéristiques",
      "Gérez votre santé physique et mentale tout au long de l'aventure",
      "Les choix narratifs ont des conséquences permanentes sur la campagne",
      "Défaites des monstres et résolvez des actes pour progresser dans l'intrigue"
    ],
    imageUrl: "/images/arkham-horror-lcg.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B01M67JYTK", prix: "44,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/fantasy-flight-games/69241-arkham-horror-le-jeu-de-cartes-841333102111.html", prix: "42,95€" },
      cultura: { url: "https://www.cultura.com/p-arkham-horror-le-jeu-de-cartes-841333102111.html", prix: "45,99€" },
      fnac: { url: "https://www.fnac.com/a10932701/Fantasy-Flight-Games-Arkham-Horror-Le-Jeu-de-Cartes", prix: "46,99€" }
    }
  },
  {
    id: "19",
    slug: "gloomhaven",
    nom: "Gloomhaven",
    annee: 2017,
    description: "L'expérience ultime du jeu de plateau : une campagne de donjon-crawler coopératif avec une histoire persistante et des mécaniques de combat innovantes.",
    joueursMin: 1,
    joueursMax: 4,
    dureeMin: 60,
    dureeMax: 120,
    ageMin: 12,
    complexite: "Expert",
    note: 9.4,
    categories: ["Expert", "Coopératif", "Solo", "Aventure"],
    mecaniques: ["Programmation de cartes", "Combat tactique", "Campagne persistante"],
    regles: [
      "Choisissez votre classe de mercenaire parmi les 17 disponibles",
      "Planifiez vos actions en jouant 2 cartes face cachée simultanément",
      "L'ordre d'initiative est déterminé par les cartes jouées",
      "Les ennemis agissent selon leurs cartes de comportement automatiques",
      "Gérez votre main limitée comme ressource principale d'endurance",
      "Vos décisions modifient de façon permanente le monde du jeu"
    ],
    imageUrl: "/images/gloomhaven.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B01LPHENOM", prix: "139,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/cephalofair-games/78895-gloomhaven-019962194719.html", prix: "134,95€" },
      cultura: { url: "https://www.cultura.com/p-gloomhaven-019962194719.html", prix: "141,99€" },
      fnac: { url: "https://www.fnac.com/a12059100/Cephalofair-Games-Gloomhaven", prix: "144,99€" }
    }
  },
  {
    id: "20",
    slug: "les-charlatans-de-belcastel",
    nom: "Les Charlatans de Belcastel",
    annee: 2018,
    description: "Préparez des potions magiques en piochant des ingrédients dans votre sac. Un jeu de push-your-luck délicieusement stressant où l'avidité vous perdra.",
    joueursMin: 2,
    joueursMax: 4,
    dureeMin: 45,
    dureeMax: 75,
    ageMin: 10,
    complexite: "Simple",
    note: 8.3,
    categories: ["Familial", "Stratégie"],
    mecaniques: ["Push your luck", "Construction de sac", "Gestion de risque"],
    regles: [
      "Piochez des ingrédients de votre sac un par un pour remplir votre chaudron",
      "Les ingrédients blancs font exploser votre potion si leur total dépasse 7",
      "Arrêtez-vous quand vous voulez pour sécuriser vos points",
      "Dépensez des rubis pour acheter de nouveaux ingrédients puissants",
      "Améliorez votre sac en retirant ou ajoutant des composants",
      "Le joueur avec le plus de points après 8 tours gagne la partie"
    ],
    imageUrl: "/images/charlatans-belcastel.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B07HLQ7NVL", prix: "39,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/schmidt-spiele/86283-les-charlatans-de-belcastel-4001504882280.html", prix: "37,95€" },
      cultura: { url: "https://www.cultura.com/p-les-charlatans-de-belcastel-4001504882280.html", prix: "40,99€" },
      fnac: { url: "https://www.fnac.com/a13087529/Schmidt-Spiele-Les-Charlatans-de-Belcastel", prix: "41,99€" }
    }
  },
  {
    id: "21",
    slug: "root",
    nom: "Root",
    annee: 2018,
    description: "Quatre factions asymétriques s'affrontent pour contrôler une forêt. Chaque camp joue différemment, créant une expérience de jeu unique et riche.",
    joueursMin: 2,
    joueursMax: 4,
    dureeMin: 60,
    dureeMax: 90,
    ageMin: 10,
    complexite: "Complexe",
    note: 8.7,
    categories: ["Stratégie", "Expert"],
    mecaniques: ["Asymétrie de faction", "Contrôle de zone", "Gestion de cartes"],
    regles: [
      "Chaque faction a ses propres règles, objectifs et mécaniques",
      "Le Marquis de Chat construit et exploite des bâtiments industriels",
      "La Dynastie des Rapaces contrôle le ciel par le décret",
      "L'Alliance de la Forêt se lève de l'ombre du peuple",
      "Le Vagabond agit seul et peut aider ou nuire à tous",
      "Premier à 30 points de victoire ou domination de faction gagne"
    ],
    imageUrl: "/images/root.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B07FMR974J", prix: "54,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/leder-games/87035-root-602573655900.html", prix: "52,95€" },
      cultura: { url: "https://www.cultura.com/p-root-602573655900.html", prix: "55,99€" },
      fnac: { url: "https://www.fnac.com/a13087530/Leder-Games-Root", prix: "56,99€" }
    }
  },
  {
    id: "22",
    slug: "cascadia",
    nom: "Cascadia",
    annee: 2021,
    description: "Créez un écosystème naturel du Pacifique Nord-Ouest en plaçant des tuiles de paysage et des animaux. Le Spiel des Jahres 2022, zen et élégant.",
    joueursMin: 1,
    joueursMax: 4,
    dureeMin: 30,
    dureeMax: 45,
    ageMin: 10,
    complexite: "Simple",
    note: 8.5,
    categories: ["Familial", "Solo", "Stratégie"],
    mecaniques: ["Placement de tuiles", "Gestion de faune", "Objectifs variables"],
    regles: [
      "Piochez une tuile habitat et un jeton faune associé",
      "Placez la tuile adjacent à votre nature, puis le jeton sur une tuile compatible",
      "Chaque animal a ses propres conditions de placement",
      "Les cartes objectif définissent comment chaque animal rapporte des points",
      "Les cônes de pin permettent d'éliminer des jetons indésirables",
      "Comptez les points de chaque espèce selon les objectifs en jeu"
    ],
    imageUrl: "/images/cascadia.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B09BDDVKNL", prix: "39,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/flatout-games/107906-cascadia-798304339809.html", prix: "37,95€" },
      cultura: { url: "https://www.cultura.com/p-cascadia-798304339809.html", prix: "40,99€" },
      fnac: { url: "https://www.fnac.com/a16784321/Flatout-Games-Cascadia", prix: "41,99€" }
    }
  },
  {
    id: "23",
    slug: "mysterium",
    nom: "Mysterium",
    annee: 2015,
    description: "Un fantôme communique avec des médiums via des cartes vision oniriques. Un jeu coopératif d'une atmosphère unique et de communication créative.",
    joueursMin: 2,
    joueursMax: 7,
    dureeMin: 42,
    dureeMax: 60,
    ageMin: 10,
    complexite: "Simple",
    note: 8.0,
    categories: ["Coopératif", "Ambiance", "Familial"],
    mecaniques: ["Déduction", "Communication via images", "Coopération"],
    regles: [
      "Un joueur incarne le fantôme, les autres sont des médiums",
      "Le fantôme envoie des cartes vision (images oniriques) sans parler",
      "Les médiums doivent deviner leur suspect, lieu et arme grâce aux visions",
      "Le fantôme peut envoyer plusieurs cartes par manche pour guider",
      "Tous les médiums doivent résoudre leur dossier en 7 manches",
      "Lors de la révélation finale, votez tous pour le vrai coupable"
    ],
    imageUrl: "/images/mysterium.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B0143KTVXY", prix: "39,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/libellud/27077-mysterium-3558380020400.html", prix: "37,95€" },
      cultura: { url: "https://www.cultura.com/p-mysterium-3558380020400.html", prix: "40,99€" },
      fnac: { url: "https://www.fnac.com/a9280732/Libellud-Mysterium", prix: "41,99€" }
    }
  },
  {
    id: "24",
    slug: "tout-est-faux",
    nom: "Tout est faux !",
    annee: 2018,
    description: "Inventez de fausses définitions pour tromper vos adversaires dans ce jeu de bluff culturel hilarant. Idéal pour les soirées en famille ou entre amis.",
    joueursMin: 4,
    joueursMax: 8,
    dureeMin: 30,
    dureeMax: 60,
    ageMin: 12,
    complexite: "Très simple",
    note: 7.5,
    categories: ["Ambiance", "Bluff", "Apéro"],
    mecaniques: ["Bluff", "Écriture créative", "Votation"],
    regles: [
      "Le meneur lit un mot rare ou peu connu à voix haute",
      "Chaque joueur écrit une définition convaincante mais fausse",
      "Le meneur mélange les fausses définitions avec la vraie",
      "Chacun vote pour la définition qu'il croit être la vraie",
      "Points si vous avez trouvé la vraie ou si quelqu'un a voté pour votre bluff",
      "Changez de meneur et recommencez avec un nouveau mot"
    ],
    imageUrl: "/images/tout-est-faux.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B07MHL43F7", prix: "19,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/cocktail-games/85291-tout-est-faux-3760052143509.html", prix: "17,95€" },
      cultura: { url: "https://www.cultura.com/p-tout-est-faux-3760052143509.html", prix: "20,99€" },
      fnac: { url: "https://www.fnac.com/a13087531/Cocktail-Games-Tout-est-faux", prix: "21,99€" }
    }
  },
  {
    id: "25",
    slug: "brass-birmingham",
    nom: "Brass : Birmingham",
    annee: 2018,
    description: "Bâtissez un empire industriel dans l'Angleterre victorienne. Le meilleur jeu du monde selon BoardGameGeek, alliant stratégie économique et réseau de connexions.",
    joueursMin: 2,
    joueursMax: 4,
    dureeMin: 60,
    dureeMax: 120,
    ageMin: 14,
    complexite: "Complexe",
    note: 9.5,
    categories: ["Stratégie", "Expert"],
    mecaniques: ["Construction de réseau", "Gestion économique", "Planification"],
    regles: [
      "La partie se joue en 2 ères : Canal puis Rail",
      "Jouez des cartes pour construire des industries ou des liaisons",
      "Les industries développées rapportent des points à la fin de chaque ère",
      "Vous ne pouvez construire que dans des villes connectées à votre réseau",
      "Les cartes de villes vous permettent de bâtir dans ces villes",
      "À la fin de chaque ère, comptez les points des industries vendues"
    ],
    imageUrl: "/images/brass-birmingham.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B07BBQ4RVD", prix: "59,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/roxley/82042-brass-birmingham-3770005193356.html", prix: "57,95€" },
      cultura: { url: "https://www.cultura.com/p-brass-birmingham-3770005193356.html", prix: "60,99€" },
      fnac: { url: "https://www.fnac.com/a13087532/Roxley-Brass-Birmingham", prix: "61,99€" }
    }
  },
  {
    id: "26",
    slug: "sushi-go",
    nom: "Sushi Go !",
    annee: 2013,
    description: "Attrapez les meilleurs sushis qui défilent devant vous dans ce jeu de draft express et coloré. Parfait pour tous les âges, une partie en 20 minutes.",
    joueursMin: 2,
    joueursMax: 5,
    dureeMin: 15,
    dureeMax: 20,
    ageMin: 8,
    complexite: "Très simple",
    note: 7.5,
    categories: ["Familial", "Apéro"],
    mecaniques: ["Draft de cartes", "Collection de sets"],
    regles: [
      "Distribuez les cartes selon le nombre de joueurs",
      "Choisissez une carte, posez-la face cachée devant vous",
      "Révélez simultanément et passez le reste de votre main au voisin",
      "Répétez jusqu'à épuisement des cartes",
      "Les nigiri rapportent des points fixes, les wasabi les triplent",
      "Les dumplings valent exponentiel, les puddings comptent en fin de partie"
    ],
    imageUrl: "/images/sushi-go.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B00J5DAVXS", prix: "14,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/gamewright/32684-sushi-go-759751005245.html", prix: "12,95€" },
      cultura: { url: "https://www.cultura.com/p-sushi-go-759751005245.html", prix: "15,99€" },
      fnac: { url: "https://www.fnac.com/a8069753/Gamewright-Sushi-Go", prix: "16,99€" }
    }
  },
  {
    id: "27",
    slug: "love-letter",
    nom: "Love Letter",
    annee: 2012,
    description: "Faites parvenir votre lettre d'amour à la princesse avec seulement 16 cartes. Un chef-d'œuvre de design minimaliste, intense et rapide.",
    joueursMin: 2,
    joueursMax: 4,
    dureeMin: 20,
    dureeMax: 30,
    ageMin: 10,
    complexite: "Très simple",
    note: 7.6,
    categories: ["Apéro", "Bluff", "Familial"],
    mecaniques: ["Déduction", "Bluff", "Gestion de main"],
    regles: [
      "Piochez une carte et jouez l'une de vos 2 cartes",
      "Chaque carte a un pouvoir unique : élimination, protection, espionnage",
      "Le Garde (1) devine la carte d'un adversaire pour l'éliminer",
      "La Baronne (3) compare secrètement avec un autre joueur",
      "La Comtesse (7) doit être jouée avec le Roi ou le Prince",
      "La Princesse (8) : si vous la défaussez, vous êtes éliminé"
    ],
    imageUrl: "/images/love-letter.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B00AYKPLNY", prix: "10,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/z-man-games/9007-love-letter-681706100106.html", prix: "8,95€" },
      cultura: { url: "https://www.cultura.com/p-love-letter-681706100106.html", prix: "11,99€" },
      fnac: { url: "https://www.fnac.com/a7688301/Z-Man-Games-Love-Letter", prix: "12,99€" }
    }
  },
  {
    id: "28",
    slug: "scythe",
    nom: "Scythe",
    annee: 2016,
    description: "Dans une Europe alternative des années 1920, des factions dieselpunk s'affrontent pour contrôler une région mystérieuse. Un monument de l'eurogame moderne.",
    joueursMin: 1,
    joueursMax: 5,
    dureeMin: 90,
    dureeMax: 115,
    ageMin: 14,
    complexite: "Complexe",
    note: 8.8,
    categories: ["Stratégie", "Expert", "Solo"],
    mecaniques: ["Sélection d'actions", "Contrôle de zone", "Construction de moteur"],
    regles: [
      "Chaque faction a un plateau personnel et des capacités asymétriques",
      "Utilisez un système d'actions : top de plateau puis bottom (lié)",
      "Déployez des mechs pour défendre, attaquer et débloquer capacités",
      "Récoltez des ressources pour construire, améliorer et recruter",
      "Le combat se résout par enchère secrète de points de puissance",
      "La partie s'arrête quand un joueur atteint 6 étoiles d'accomplissement"
    ],
    imageUrl: "/images/scythe.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B076BFXNTB", prix: "79,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/stonemaier-games/69241-scythe-653341025005.html", prix: "77,95€" },
      cultura: { url: "https://www.cultura.com/p-scythe-653341025005.html", prix: "80,99€" },
      fnac: { url: "https://www.fnac.com/a11025966/Stonemaier-Games-Scythe", prix: "81,99€" }
    }
  },
  {
    id: "29",
    slug: "la-resistance",
    nom: "La Résistance",
    annee: 2009,
    description: "Des résistants tentent de faire échouer les missions de l'Empire, pendant que des espions sabotent de l'intérieur. Un jeu de déduction sociale intense.",
    joueursMin: 5,
    joueursMax: 10,
    dureeMin: 30,
    dureeMax: 45,
    ageMin: 13,
    complexite: "Simple",
    note: 7.8,
    categories: ["Ambiance", "Bluff", "Grande tablée"],
    mecaniques: ["Déduction sociale", "Vote", "Rôles cachés"],
    regles: [
      "Des rôles Résistant ou Espion sont distribués secrètement",
      "Le leader propose une équipe pour chaque mission",
      "Tous votent pour approuver ou rejeter l'équipe proposée",
      "Les membres d'équipe jouent succès ou échec (les espions peuvent saboter)",
      "Une mission échoue si au moins un échec est joué",
      "Les Résistants gagnent 3 missions réussies, les Espions gagnent 3 sabotées"
    ],
    imageUrl: "/images/resistance.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B008F0RJYE", prix: "15,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/indie-boards-and-cards/1572-la-resistance-851395002030.html", prix: "13,95€" },
      cultura: { url: "https://www.cultura.com/p-la-resistance-851395002030.html", prix: "16,99€" },
      fnac: { url: "https://www.fnac.com/a7030122/Indie-Boards-Cards-La-Resistance", prix: "17,99€" }
    }
  },
  {
    id: "30",
    slug: "welcome-to",
    nom: "Welcome To...",
    annee: 2018,
    description: "Construisez le quartier résidentiel américain parfait des années 50. Un flip-and-write jouable en simultané, sans attente et sans élimination.",
    joueursMin: 1,
    joueursMax: 100,
    dureeMin: 25,
    dureeMax: 30,
    ageMin: 10,
    complexite: "Très simple",
    note: 7.9,
    categories: ["Familial", "Solo", "Grande tablée", "Apéro"],
    mecaniques: ["Flip and write", "Simultané", "Gestion de feuille"],
    regles: [
      "3 combinaisons numéro/action sont révélées chaque tour",
      "Tous les joueurs choisissent une combinaison en même temps",
      "Inscrivez le numéro dans une maison de votre quartier",
      "Les numéros dans chaque rue doivent être croissants de gauche à droite",
      "Complétez des objectifs communs pour marquer des points bonus",
      "La partie se termine quand 3 objectifs sont complétés ou qu'une feuille est épuisée"
    ],
    imageUrl: "/images/welcome-to.jpg",
    acheter: {
      amazon: { url: "https://www.amazon.fr/dp/B07MSMJXQS", prix: "24,90€" },
      philibert: { url: "https://www.philibertnet.com/fr/deep-water-games/86965-welcome-to-850000576476.html", prix: "22,95€" },
      cultura: { url: "https://www.cultura.com/p-welcome-to-850000576476.html", prix: "25,99€" },
      fnac: { url: "https://www.fnac.com/a13087533/Deep-Water-Games-Welcome-To", prix: "26,99€" }
    }
  }
];

export function getJeuBySlug(slug: string): Jeu | undefined {
  return jeux.find((j) => j.slug === slug);
}
