import type { JSX } from 'react';
import type { BearType } from './bearTypes';
import HighlightedText from '../search/HighlightedText';

interface BearTypesTableProps {
  bearTypes: BearType[];
}

function BearTypesTable({ bearTypes }: BearTypesTableProps): JSX.Element {
  return (
    <table>
      <caption>Types of bear</caption>
      <thead>
        <tr>
          <th scope="col">Bear Type</th>
          <th scope="col">Coat</th>
          <th scope="col">Adult size</th>
          <th scope="col">Habitat</th>
          <th scope="col">Lifespan</th>
          <th scope="col">Diet</th>
        </tr>
      </thead>
      <tbody>
        {bearTypes.map((bearType) => (
          <tr key={bearType.type}>
            <td>
              <HighlightedText>{bearType.type}</HighlightedText>
            </td>
            <td>
              <HighlightedText>{bearType.coat}</HighlightedText>
            </td>
            <td>
              <HighlightedText>{bearType.adultSize}</HighlightedText>
            </td>
            <td>
              <HighlightedText>{bearType.habitat}</HighlightedText>
            </td>
            <td>
              <HighlightedText>{bearType.lifespan}</HighlightedText>
            </td>
            <td>
              <HighlightedText>{bearType.diet}</HighlightedText>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default BearTypesTable;
