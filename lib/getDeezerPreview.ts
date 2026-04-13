export async function getDeezerPreview(
  title: string,
  artist: string = "Page KillerCutz",
): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${title} ${artist}`);
    const res = await fetch(`https://api.deezer.com/search?q=${query}&limit=1`);
    const data = await res.json();
    const track = data?.data?.[0];
    return track?.preview || null;
  } catch {
    return null;
  }
}
