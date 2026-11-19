import { useState, type CSSProperties, type JSX } from 'react';

interface BearImageProps {
  imageUrl: string | null;
  name: string;
}

const imageStyle: CSSProperties = { width: '200px', height: 'auto' };

const placeholderStyle: CSSProperties = {
  width: '200px',
  height: '120px',
  border: '2px dashed #999',
  color: '#666',
};

function BearImage({ imageUrl, name }: BearImageProps): JSX.Element {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (imageUrl === null) {
    return <div style={placeholderStyle}>No image found</div>;
  }

  if (imageUrl === failedUrl) {
    return <div style={placeholderStyle}>Not possible to load image</div>;
  }

  return (
    <img
      src={imageUrl}
      alt={`Image of ${name}`}
      style={imageStyle}
      onError={() => {
        setFailedUrl(imageUrl);
      }}
    />
  );
}

export default BearImage;
