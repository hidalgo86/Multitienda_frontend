export enum Genre {
  NINA = "niña",
  NINO = "niño",
  UNISEX = "unisex",
}

export const genreLabels: Record<Genre, string> = {
  [Genre.NINA]: "Niña",
  [Genre.NINO]: "Niño",
  [Genre.UNISEX]: "Unisex",
};

const normalizeGenreValue = (genre: string): string =>
  genre
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

const genreAliases: Record<string, Genre> = Object.entries(genreLabels).reduce(
  (acc, [value, label]) => {
    const genre = value as Genre;
    acc[normalizeGenreValue(genre)] = genre;
    acc[normalizeGenreValue(label)] = genre;
    return acc;
  },
  {} as Record<string, Genre>,
);

export const parseGenre = (genre?: string | Genre | null): Genre | null => {
  if (!genre) return null;
  return genreAliases[normalizeGenreValue(String(genre))] || null;
};

export const formatGenreLabel = (genre?: string | Genre | null): string => {
  if (!genre) return "";
  const parsed = parseGenre(genre);
  return parsed ? genreLabels[parsed] : String(genre);
};
