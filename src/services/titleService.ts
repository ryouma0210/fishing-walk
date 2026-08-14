import AsyncStorage from "@react-native-async-storage/async-storage";

const SELECTED_TITLE_KEY="fishing_walk_selected_title";

export async function getSelectedTitle() {
  return AsyncStorage.getItem(SELECTED_TITLE_KEY);
}

export async function setSelectedTitle(title:string) {
  await AsyncStorage.setItem(SELECTED_TITLE_KEY,title);
}
