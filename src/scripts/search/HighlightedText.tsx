import { Fragment, useContext, type JSX } from 'react';
import { SearchContext } from './searchContext';

interface TextPart {
  text: string;
  isMatch: boolean;
  start: number;
}

function splitByTerm(text: string, term: string): TextPart[] {
  if (term === '') {
    return [{ text, isMatch: false, start: 0 }];
  }

  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const parts: TextPart[] = [];

  let position = 0;
  let index = lowerText.indexOf(lowerTerm);

  while (index !== -1) {
    if (index > position) {
      parts.push({
        text: text.slice(position, index),
        isMatch: false,
        start: position,
      });
    }
    parts.push({
      text: text.slice(index, index + term.length),
      isMatch: true,
      start: index,
    });
    position = index + term.length;
    index = lowerText.indexOf(lowerTerm, position);
  }

  if (position < text.length) {
    parts.push({ text: text.slice(position), isMatch: false, start: position });
  }

  return parts;
}

interface HighlightedTextProps {
  children: string;
}

function HighlightedText({ children }: HighlightedTextProps): JSX.Element {
  const searchTerm = useContext(SearchContext);
  const parts = splitByTerm(children, searchTerm);

  return (
    <>
      {parts.map((part) =>
        part.isMatch ? (
          <mark key={part.start} className="highlight">
            {part.text}
          </mark>
        ) : (
          <Fragment key={part.start}>{part.text}</Fragment>
        )
      )}
    </>
  );
}

export default HighlightedText;
