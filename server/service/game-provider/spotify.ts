import axios from "axios";

let spotifyAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

async function fetchSpotifyAccessToken(): Promise<string> {
  const now = Date.now();
  if (spotifyAccessToken && now < tokenExpiresAt) {
    return spotifyAccessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const response = await axios.post(
    `${process.env.SPOTIFY_AUTH_URL}`,
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  //   console.log("access token", response);

  spotifyAccessToken = response.data.access_token;
  tokenExpiresAt = now + (response.data.expires_in - 60) * 1000;
  return spotifyAccessToken || "";
}

const spotifyApi = axios.create({
  baseURL: process.env.SPOTIFY_API_URL,
});

spotifyApi.interceptors.request.use(async (config) => {
  const token = await fetchSpotifyAccessToken();
  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default spotifyApi;
