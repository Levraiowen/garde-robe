// Miroir des schémas de l'API (backend/src/garde_robe/api/schemas.py).

export type Categorie = 'haut' | 'bas' | 'robe' | 'veste' | 'chaussures' | 'accessoire';
export type Saison = 'printemps' | 'ete' | 'automne' | 'hiver';

export type Utilisateur = {
  id: string;
  email: string;
  pseudo: string;
  profil_public: boolean;
  cree_le: string;
};

export type Session = {
  token: string;
  utilisateur: Utilisateur;
};

export type VetementSaisie = {
  nom: string;
  categorie: Categorie;
  couleur: string;
  styles: string[];
  saisons: Saison[];
  formalite: number;
  marque: string | null;
};

export type Vetement = VetementSaisie & {
  id: string;
  image: string | null;
  cree_le: string;
  nb_ports: number;
  dernier_port: string | null;
};

export type Tenue = {
  score: number;
  raisons: string[];
  pieces: Vetement[];
  favori_id: string | null;
};

export type Favori = { id: string; cree_le: string; pieces: Vetement[] };
export type Port = { id: string; porte_le: string; pieces: Vetement[] };

export type PartStyle = { style: string; part: number };

export type Suggestion = {
  style: string;
  categorie: Categorie;
  requete: string;
  raison: string;
  liens: Record<string, string>;
};

/** Photo choisie sur l'appareil, pas encore envoyée. */
export type PhotoLocale = { uri: string; mimeType?: string | null; fileName?: string | null };
