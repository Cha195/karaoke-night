import {
  DifficultyEnumType,
  GameBoard,
  GameParams,
  SpotifyTrack,
} from "~/model/game";
import { fetchTracks, queryGenerator, fetchVideoLinks } from "./game-provider";

const DifficultyBucket: DifficultyEnumType[] = [
  "Very Easy",
  "Easy",
  "Medium",
  "Hard",
  "Very Hard",
];

export const generateBoard = async (params: GameParams): Promise<GameBoard> => {
  const query = queryGenerator(params);
  const tracks = await fetchTracks(query, params.limit);

  if (!tracks.length) throw new Error("Could not fetch tracks");

  const videoLinks = await fetchVideoLinks(tracks);
  const sortedTracks = [...tracks].sort((a, b) => a.popularity - b.popularity);

  return {
    gameId: crypto.randomUUID(),
    tiles: sortedTracks.map((track: SpotifyTrack, index) => ({
      tileId: track.id,
      previewUrl: videoLinks[track.id],
      artist: track.artists[0]?.name || "Unknown Artist",
      title: track.name,
      difficulty: DifficultyBucket[Math.floor(index / 5)],
    })),
  };
};
