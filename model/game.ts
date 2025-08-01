import { z } from "zod";

export enum GameStatusEnum {
  Unstarted = "Unstarted",
  InProgress = "In-Progress",
  Ended = "Ended",
}

export enum DifficultyEnum {
  "Very Easy",
  "Easy",
  "Medium",
  "Hard",
  "Very Hard",
}

export const StartGameParamsSchema = z.object({
  artists: z.array(z.string()).optional(),
  genres: z.array(z.string()).optional(),
  decades: z.array(z.string()).optional(),
  moods: z.array(z.string()).optional(),
  limit: z.number(),
});

export const SubmitAnswerParamsSchema = z.object({
  answer: z.string(),
  gameId: z.string(),
  tileId: z.string(),
});

export const GetGameParamsSchema = z.object({
  gameId: z.string(),
});

export const GameTileDTOSchema = z.object({
  tileId: z.string(),
  previewUrl: z.string(),
  difficulty: z.nativeEnum(DifficultyEnum),
  points: z.number(),
  answeredBy: z.string().nullable(),
});

export const GameTileSchema = GameTileDTOSchema.extend({
  artist: z.string(),
  title: z.string(),
});

export const GameBoardSchema = z.object({
  gameId: z.string().uuidv4(),
  creatorId: z.string().uuid(),
  tiles: z.array(GameTileSchema),
  state: z.nativeEnum(GameStatusEnum),
});

export const GameBoardDTOSchema = z.object({
  gameId: z.string().uuid(),
  creatorId: z.string().uuid(),
  playerId: z.string().uuid(),
  tiles: z.array(GameTileDTOSchema),
  state: z.nativeEnum(GameStatusEnum),
  playerScores: z.record(z.string(), z.number()),
  currentPlayerId: z.string().uuid().nullable(),
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
  difficulty: z.nativeEnum(DifficultyEnum),
});

// Infer types
export type StartGameParams = z.infer<typeof StartGameParamsSchema>;
export type GameTileDTO = z.infer<typeof GameTileDTOSchema>;
export type GameBoardDTO = z.infer<typeof GameBoardDTOSchema>;
export type GameBoard = z.infer<typeof GameBoardSchema>;

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
