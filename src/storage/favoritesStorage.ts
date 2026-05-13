import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'favorite_wods';

export async function getFavorites(): Promise<string[]> {
  const data = await AsyncStorage.getItem(FAVORITES_KEY);
  return data ? JSON.parse(data) : [];
}

export async function toggleFavorite(wodId: string): Promise<boolean> {
  const favs = await getFavorites();
  const isFav = favs.includes(wodId);
  const updated = isFav ? favs.filter((id) => id !== wodId) : [...favs, wodId];
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return !isFav;
}

export async function isFavorite(wodId: string): Promise<boolean> {
  const favs = await getFavorites();
  return favs.includes(wodId);
}
