import {
  DifficultyEnumType,
  GameBoard,
  GameParams,
  SpotifyTrack,
} from "~/model/game";
import { fetchSongs, queryGenerator } from "./game-provider";

const DifficultyBucket: DifficultyEnumType[] = [
  "Very Easy",
  "Easy",
  "Medium",
  "Hard",
  "Very Hard",
];

export const generateBoard = async (params: GameParams): Promise<GameBoard> => {
  const query = queryGenerator(params);
  const tracks = await fetchSongs(query, params.limit);

  if (!tracks.length) throw new Error("Could not fetch tracks");

  const sortedTracks = [...tracks].sort((a, b) => a.popularity - b.popularity);

  return {
    gameId: crypto.randomUUID(),
    tiles: sortedTracks.map((track: SpotifyTrack, index) => ({
      tileId: track.id,
      previewUrl: track.preview_url!,
      artist: track.artists[0]?.name || "Unknown Artist",
      title: track.name,
      difficulty: DifficultyBucket[Math.floor(index / 5)],
    })),
  };
};
