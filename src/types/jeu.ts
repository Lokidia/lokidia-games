export interface PrixMarchand {
  url: string;
  prix: string;
}

export interface AcheterJeu {
  amazon: PrixMarchand;
  philibert: PrixMarchand;
  cultura: PrixMarchand;
  fnac: PrixMarchand;
}

export type Complexite = "Très simple" | "Simple" | "Intermédiaire" | "Complexe" | "Expert";

export type Jeu = {
  id: string;
  slug: string;
  nom: string;
  annee: number;
  description: string;
  joueursMin: number;
  joueursMax: number;
  dureeMin: number;
  dureeMax: number;
  ageMin: number;
  complexite: Complexite;
  note: number;
  categories: string[];
  categoryLinks?: { nom: string; slug: string }[];
  mecaniques: string[];
  regles: string[];
  pointsForts?: string[];
  imageUrl: string;
  acheter: AcheterJeu;
  spotifyPlaylistId?: string | null;
  categorySpotifyPlaylistId?: string | null;
  youtubeId?: string | null;
};
