import { youtubeEmbedUrl } from "@/lib/youtube";

interface PropertyYouTubeVideoProps {
  videoId: string;
  title: string;
  origin: string;
}

export default function PropertyYouTubeVideo({ videoId, title, origin }: PropertyYouTubeVideoProps) {
  const embedSrc = youtubeEmbedUrl(videoId, { origin });

  return (
    <section aria-label="Property video tour">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Video tour</h2>
      <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-black aspect-video">
        <iframe
          src={embedSrc}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </section>
  );
}
