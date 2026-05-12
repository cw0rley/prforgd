import AsyncStorage from '@react-native-async-storage/async-storage';

const EQUIPMENT_KEY = 'user_equipment';

export async function getUserEquipment(): Promise<string[]> {
  const data = await AsyncStorage.getItem(EQUIPMENT_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveUserEquipment(equipment: string[]): Promise<void> {
  await AsyncStorage.setItem(EQUIPMENT_KEY, JSON.stringify(equipment));
}
