import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeneratedWod } from '../data/wodGenerator';

const GENERATED_WOD_KEY = 'current_generated_wod';

export async function saveGeneratedWod(wod: GeneratedWod): Promise<void> {
  await AsyncStorage.setItem(GENERATED_WOD_KEY, JSON.stringify(wod));
}

export async function getGeneratedWod(): Promise<GeneratedWod | null> {
  const data = await AsyncStorage.getItem(GENERATED_WOD_KEY);
  return data ? JSON.parse(data) : null;
}
