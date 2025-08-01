import {
  StartGameParams,
  SpotifySearchTracksResponse,
  SpotifyTrack,
  DifficultyEnum,
} from "~/model/game";
import spotifyApi from "./spotify";
import { youtubeApi, RICKROLL_VIDEO_ID } from "./youtube";
import { getRedis } from "../redis";

export function queryGenerator(params: StartGameParams): string {
  const queryParts: string[] = [];

  if (params.artists && params.artists.length > 0) {
    // Spotify: artist:"Artist1" OR artist:"Artist2"

    queryParts.push(
      params.artists.map((artist: string) => `artist:${artist}`).join(" ")
    );
  }

  if (params.genres && params.genres.length > 0) {
    // Spotify: genre:"Genre1" OR genre:"Genre2"
    queryParts.push(
      params.genres.map((genre: string) => `genre:${genre}`).join(" ")
    );
  }

  if (params.decades && params.decades.length > 0) {
    // Spotify: year:1980-1989 OR year:1990-1999
    queryParts.push(
      params.decades
        .map((decade: string) => {
          const start = parseInt(decade, 10);
          if (!isNaN(start)) {
            return `year:${start}-${start + 9}`;
          }
          return "";
        })
        .filter(Boolean)
        .join(" ")
    );
  }

  if (params.moods && params.moods.length > 0) {
    // Moods are not a Spotify filter, so just add as free text
    queryParts.push(params.moods.join(" "));
  }

  // Join all parts with a space (Spotify treats space as AND)
  return queryParts.filter(Boolean).join(" ");
}

export const fetchTracks = async (
  query: string,
  limit: number
): Promise<SpotifyTrack[]> => {
  let offset = 0;
  let collected: SpotifyTrack[] = [];

  while (collected.length < limit) {
    const response = await spotifyApi.get<SpotifySearchTracksResponse>(
      "/v1/search",
      {
        params: {
          q: query,
          type: "track",
          limit,
          offset,
        },
      }
    );

    collected = response.data.tracks.items;

    // If there are no more tracks to fetch, break
    if (!response.data.tracks.next || collected.length === 0) {
      break;
    }

    offset += limit;
  }

  // Return only up to the requested limit
  return collected.slice(0, limit);
};

// export const fetchAudioFeatures = async (
//   tracks: SpotifyTrack[]
// ): Promise<AudioFeatures[]> => {
//   const trackIds = tracks.map((track) => track.id).join(",");
//   const response = await spotifyApi.get("/v1/audio-features", {
//     params: {
//       ids: trackIds,
//     },
//   });

//   const { success, data } = AudioFeaturesBatchSchema.safeParse(response.data);

//   if (!success || !data) {
//     throw new Error("Error parsing data");
//   }

//   return data;
// };

// export const classifyDifficulty = (
//   features: AudioFeatures
// ): AudioFeaturesWithDifficulty => {
//   const { energy, danceability, valence, tempo } = features;

//   const score =
//     energy * 0.4 +
//     danceability * 0.3 +
//     valence * 0.2 +
//     (tempo > 130 ? 1 : 0) * 0.1;

//   let difficulty: DifficultyEnumType;

//   if (score > 0.85) difficulty = "Easy";
//   else if (score > 0.7) difficulty = "Medium";
//   else if (score > 0.55) difficulty = "Hard";
//   else if (score > 0.4) difficulty = "Expert";
//   else difficulty = "Insane";

//   return {
//     ...features,
//     difficulty,
//   };
// };

export const classifyDifficulty = (track: SpotifyTrack): DifficultyEnum => {
  const { popularity } = track;
  if (popularity >= 90) return DifficultyEnum["Very Easy"];
  if (popularity >= 70) return DifficultyEnum["Easy"];
  if (popularity >= 40) return DifficultyEnum["Medium"];
  if (popularity >= 20) return DifficultyEnum["Hard"];
  return DifficultyEnum["Very Hard"];
};

export async function fetchVideoLinks(
  tracks: SpotifyTrack[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  const redis = getRedis();

  await Promise.all(
    tracks.map(async (track) => {
      const cacheKey = `yt:${track.id}`;

      // Check Redis first
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        results[track.id] = cached;
        return;
      }

      // Build query for YouTube search
      const query = `${track.name} ${track.artists[0].name} audio`;

      try {
        const res = await youtubeApi.get("/search", {
          params: { q: query },
        });

        const videoId = res.data.items?.[0]?.id?.videoId || RICKROLL_VIDEO_ID;

        // Cache it in Redis
        await redis.set(cacheKey, videoId, {
          ex: 60 * 60 * 24 * 7, // 7 days TTL
        });

        results[track.id] = videoId;
      } catch (err) {
        console.error(`YouTube search failed for ${track.name}:`, err);
        results[track.id] = RICKROLL_VIDEO_ID;
        await redis.set(cacheKey, RICKROLL_VIDEO_ID, {
          ex: 60 * 60 * 24 * 7,
        });
      }
    })
  );

  return results;
}
