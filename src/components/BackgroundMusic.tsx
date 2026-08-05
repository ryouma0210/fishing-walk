import { useEffect } from "react";
import { AudioPlayer, useAudioPlayer } from "expo-audio";
import { usePathname } from "expo-router";
import { useAppSettings } from "../services/settingsService";

const bgmSources = {
  area: require("../../assets/audio/bgm-area.wav"),
  menu: require("../../assets/audio/bgm-menu.wav"),
  shop: require("../../assets/audio/bgm-shop.wav"),
} as const;

function startLoop(player: AudioPlayer, volume: number) {
  player.loop = true;
  player.volume = volume;
  void player.seekTo(0).then(() => player.play());
}

export function BackgroundMusic() {
  const pathname = usePathname();
  const settings = useAppSettings();
  const area = useAudioPlayer(bgmSources.area);
  const menu = useAudioPlayer(bgmSources.menu);
  const shop = useAudioPlayer(bgmSources.shop);

  useEffect(() => {
    const players = [area, menu, shop];
    players.forEach((player) => player.pause());
    if (settings.soundVolume <= 0 || pathname.includes("/fish")) return;

    const player = pathname.includes("/map") ? area : pathname.includes("/shop") ? shop : menu;
    startLoop(player, Math.min(0.48, settings.soundVolume * 0.55));
    return () => player.pause();
  }, [area, menu, pathname, settings.soundVolume, shop]);

  return null;
}
