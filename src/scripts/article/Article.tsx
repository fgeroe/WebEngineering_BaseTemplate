import type { JSX } from 'react';
import bearMp3 from '../../media/bear.mp3';
import bearOgg from '../../media/bear.ogg';
import urbanBear from '../../media/urban-bear.jpg';
import wildBear from '../../media/wild-bear.jpg';
import MoreBears from '../bears/MoreBears';
import CommentSection from '../comments/CommentSection';
import AuthorBio from './AuthorBio';
import BearTypesTable from './BearTypesTable';
import { bearTypes } from './bearTypes';

function Article(): JSX.Element {
  return (
    <article>
      <h1>The trouble with Bears</h1>

      <p>By Evan Wild</p>

      <p>
        Tall, lumbering, angry, dangerous. The real live bears of this world are
        proud, independent creatures, self-serving and always on the hunt for
        food.
      </p>

      <h2>Types of bear</h2>

      <BearTypesTable bearTypes={bearTypes} />

      <h2>Habitats and Eating habits</h2>

      <p>
        Wild bears eat a variety of meat, fish, fruit, nuts, and other natually
        growing ingredients...
      </p>

      <img src={wildBear} alt="Wild bear in forest" />

      <p>
        Urban (gentrified) bears on the other hand have largely abandoned the
        old ways...
      </p>

      <img src={urbanBear} alt="Urban bear near buildings" />

      <h2>Mating rituals</h2>

      <p>Bears are romantic creatures by nature...</p>

      <audio controls>
        <source src={bearMp3} type="audio/mpeg" />
        <source src={bearOgg} type="audio/ogg" />
        <p>
          It looks like your browser doesn&apos;t support HTML5 audio players.
        </p>
      </audio>

      <AuthorBio />

      <CommentSection />

      <MoreBears />
    </article>
  );
}

export default Article;
