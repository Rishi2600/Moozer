import { ExternalLink } from "lucide-react";

import { CopyButton } from "@/components/space/copy-button";
import { Button } from "@/components/ui/button";
import { songListText, youtubePlaylistLinks } from "@/lib/songs/playlist";

// Take the night's songs away: open them on YouTube as a playlist (in parts
// of 50), or copy them as a list.
export function TakeHome({ songs }: { songs: { videoId: string; title: string }[] }) {
  const links = youtubePlaylistLinks(songs.map((song) => song.videoId));
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-space-sm">
      {links.map((href, index) => (
        <Button key={href} asChild variant="secondary" className="h-11">
          <a href={href} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            {links.length > 1 ? `YouTube playlist, part ${index + 1}` : "Open as YouTube playlist"}
          </a>
        </Button>
      ))}
      <CopyButton text={songListText(songs)} label="Copy song list" />
    </div>
  );
}
