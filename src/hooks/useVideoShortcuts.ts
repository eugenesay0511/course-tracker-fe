import React, { useState } from "react";
import { type MediaPlayerInstance } from "@vidstack/react";
import type { BookmarksPanelHandle } from "../components/BookmarksPanel";

interface UseVideoShortcutsParams {
  playerRef: React.RefObject<MediaPlayerInstance | null>;
  bookmarksRef: React.RefObject<BookmarksPanelHandle | null>;
  playbackSpeed: number;
  onChangePlaybackSpeed?: (speed: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  autoplay?: boolean;
  onToggleAutoplay?: (enabled: boolean) => void;
}

export const useVideoShortcuts = ({
  playerRef,
  bookmarksRef,
  playbackSpeed,
  onChangePlaybackSpeed,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  autoplay,
  onToggleAutoplay,
}: UseVideoShortcutsParams) => {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const player = playerRef.current;
    if (!player) return;
    if (
      [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
    ) {
      e.preventDefault();
    }

    const key = e.key.toLowerCase();

    switch (key) {
      case " ":
      case "k":
        if (player.state.paused) player.play();
        else player.pause();
        break;
      case "f":
        if (!player.state.fullscreen) {
          player.enterFullscreen().catch((err) => {
            console.error(`Fullscreen error: ${err.message}`);
          });
        } else {
          player.exitFullscreen();
        }
        break;
      case "m":
        player.muted = !player.state.muted;
        break;
      case "b":
        e.preventDefault();
        bookmarksRef.current?.triggerOpen();
        break;
      case "arrowright":
      case "l":
        player.currentTime = Math.min(
          player.state.duration,
          player.state.currentTime + 5,
        );
        break;
      case "arrowleft":
      case "j":
        player.currentTime = Math.max(0, player.state.currentTime - 5);
        break;
      case "arrowup":
        player.volume = Math.min(1, player.state.volume + 0.1);
        break;
      case "arrowdown":
        player.volume = Math.max(0, player.state.volume - 0.1);
        break;
      case ",":
      case "<":
        if (onPrevious && hasPrevious) onPrevious();
        break;
      case ".":
      case ">":
        if (onNext && hasNext) onNext();
        break;
      case "c":
        if (player.textTracks) {
          const tracks = Array.from(player.textTracks);
          for (const track of tracks) {
            if (track && track.kind === "subtitles") {
              track.mode = track.mode === "showing" ? "hidden" : "showing";
            }
          }
        }
        break;
      case "?":
      case "/":
        setShowShortcuts((prev) => !prev);
        break;
      case "+":
      case "=": {
        const nextSpeed = Math.min(
          3,
          Math.round((playbackSpeed + 0.25) * 100) / 100,
        );
        onChangePlaybackSpeed?.(nextSpeed);
        const p = playerRef.current;
        if (p) p.playbackRate = nextSpeed;
        break;
      }
      case "-": {
        const nextSpeed = Math.max(
          0.25,
          Math.round((playbackSpeed - 0.25) * 100) / 100,
        );
        onChangePlaybackSpeed?.(nextSpeed);
        const p = playerRef.current;
        if (p) p.playbackRate = nextSpeed;
        break;
      }
      case "a":
        onToggleAutoplay?.(!autoplay);
        break;
      case "0":
        player.currentTime = 0;
        player.play();
        break;
    }
  };

  return { showShortcuts, setShowShortcuts, handleKeyDown };
};
