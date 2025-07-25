import { z } from "zod";

export const DifficultyEnum = z.enum([
  "Very Easy",
  "Easy",
  "Medium",
  "Hard",
  "Very Hard",
]);

export const GameParamsSchema = z.object({
  artists: z.array(z.string()).optional(),
  genres: z.array(z.string()).optional(),
  decades: z.array(z.string()).optional(),
  moods: z.array(z.string()).optional(),
  limit: z.number(),
});

export const GameTileSchema = z.object({
  tileId: z.string(),
  previewUrl: z.string().url(),
  artist: z.string(),
  title: z.string().optional(),
  difficulty: DifficultyEnum.optional(),
  column: z.string().optional(),
  points: z.number().optional(),
});

export const GameTileDTOSchema = z.object({
  tileId: z.string(),
  previewUrl: z.string().url(),
  difficulty: DifficultyEnum.optional(),
  column: z.string().optional(),
  points: z.number().optional(),
});

export const GameBoardSchema = z.object({
  gameId: z.string().uuidv4(),
  tiles: z.array(GameTileSchema),
});

export const GameBoardDTOSchema = z.object({
  gameId: z.string().uuid(),
  playerId: z.string().uuid(),
  tiles: z.array(GameTileDTOSchema),
});

export const AudioFeaturesSchema = z.object({
  danceability: z.number(),
  energy: z.number(),
  key: z.number(),
  loudness: z.number(),
  mode: z.number(),
  speechiness: z.number(),
  acousticness: z.number(),
  instrumentalness: z.number(),
  liveness: z.number(),
  valence: z.number(),
  tempo: z.number(),
  type: z.literal("audio_features"),
  id: z.string(),
  uri: z.string(),
  track_href: z.string().url(),
  analysis_url: z.string().url(),
  duration_ms: z.number(),
  time_signature: z.number(),
});

export const AudioFeaturesBatchSchema = z.array(AudioFeaturesSchema);

export const AudioFeaturesWithDifficultySchema = AudioFeaturesSchema.extend({
  difficulty: DifficultyEnum,
});

// Infer types
export type GameParams = z.infer<typeof GameParamsSchema>;
export type GameTileDTO = z.infer<typeof GameTileDTOSchema>;
export type GameBoardDTO = z.infer<typeof GameBoardDTOSchema>;
export type GameBoard = z.infer<typeof GameBoardSchema>;
export type DifficultyEnumType = z.infer<typeof DifficultyEnum>;

export type AudioFeatures = z.infer<typeof AudioFeaturesSchema>;
export type AudioFeaturesWithDifficulty = z.infer<
  typeof AudioFeaturesWithDifficultySchema
>;

// Spotify API types
export type SpotifyTrack = {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  popularity: number;
  preview_url: string | null;
  external_urls: { spotify: string };
  uri: string;
};

export type SpotifySearchTracksResponse = {
  tracks: {
    href: string;
    items: SpotifyTrack[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  };
};
