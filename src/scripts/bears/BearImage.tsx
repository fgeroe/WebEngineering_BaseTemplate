import type { CSSProperties, JSX } from 'react';
import type { ImageResult } from './types';

interface BearImageProps {
  result: ImageResult;
  name: string;
}

const imageStyle: CSSProperties = { width: '200px', height: 'auto' };

const placeholderStyle: CSSProperties = {
  width: '200px',
  height: '120px',
  border: '2px dashed #999',
  color: '#666',
};

function BearImage({ result, name }: BearImageProps): JSX.Element {
  if (result.ok) {
    return <img src={result.url} alt={`Image of ${name}`} style={imageStyle} />;
  }

  return <div style={placeholderStyle}>{result.reason}</div>;
}

export default BearImage;
