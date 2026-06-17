import { useState } from "react";

export const ImageDisplay = ({
  src,
  alt,
  className = "",
  fallbackSrc = "/images/empty.jpg",
  handlePreview = () => {},
}: {
  src?: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  handlePreview?: (src: string) => void;
}) => {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [loading, setLoading] = useState(true);

  const handleError = () => {
    setImgSrc(fallbackSrc);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md" />
      )}
      <img
        onClick={() => handlePreview(imgSrc)}
        src={imgSrc}
        alt={alt}
        className={`w-10 h-10 rounded-md object-cover ${loading ? "opacity-0" : "opacity-100"}`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
};
