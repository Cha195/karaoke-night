export const getGameCreationPrompt = (
  prompt: string
) => `You are a karaoke game generator. Given this user description: "${prompt}", extract game parameters and return them as a JSON object.

Available parameters:
- artists: Array of artist names (e.g., ["The Weeknd", "Taylor Swift"])
- genres: Array of genres (e.g., ["pop", "rock", "hip-hop", "country", "r-n-b"])
- decades: Array of decades (e.g., ["1970s", "1980s", "1990s", "2000s", "2010s"])
- moods: Array of moods (e.g., ["happy", "sad", "energetic"])
- limit: Number of songs (default: 25)

Rules:
1. Only include parameters that are explicitly mentioned in the prompt
2. Use lowercase for all values
3. Return valid JSON only
4. Default limit is 25 if not specified
5. Based on the input, figure out the language of the songs and add it to the genres array except for english

Return only the JSON object, no additional text.`;
