import axios from "axios";

export const RICKROLL_VIDEO_ID = "dQw4w9WgXcQ";

export const youtubeApi = axios.create({
  baseURL: "https://www.googleapis.com/youtube/v3",
  params: {
    key: process.env.YOUTUBE_API_KEY,
  },
});
