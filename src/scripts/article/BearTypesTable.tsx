import type { JSX } from 'react';
import type { BearType } from './bearTypes';

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
            <td>{bearType.type}</td>
            <td>{bearType.coat}</td>
            <td>{bearType.adultSize}</td>
            <td>{bearType.habitat}</td>
            <td>{bearType.lifespan}</td>
            <td>{bearType.diet}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default BearTypesTable;
