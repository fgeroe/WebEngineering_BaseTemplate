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
import HighlightedText from '../search/HighlightedText';

function Article(): JSX.Element {
  return (
    <article>
      <h1>
        <HighlightedText>The trouble with Bears</HighlightedText>
      </h1>

      <p>
        <HighlightedText>By Evan Wild</HighlightedText>
      </p>

      <p>
        <HighlightedText>
          Tall, lumbering, angry, dangerous. The real live bears of this world
          are proud, independent creatures, self-serving and always on the hunt
          for food.
        </HighlightedText>
      </p>

      <h2>
        <HighlightedText>Types of bear</HighlightedText>
      </h2>

      <BearTypesTable bearTypes={bearTypes} />

      <h2>
        <HighlightedText>Habitats and Eating habits</HighlightedText>
      </h2>

      <p>
        <HighlightedText>
          Wild bears eat a variety of meat, fish, fruit, nuts, and other
          natually growing ingredients...
        </HighlightedText>
      </p>

      <img src={wildBear} alt="Wild bear in forest" />

      <p>
        <HighlightedText>
          Urban (gentrified) bears on the other hand have largely abandoned the
          old ways...
        </HighlightedText>
      </p>

      <img src={urbanBear} alt="Urban bear near buildings" />

      <h2>
        <HighlightedText>Mating rituals</HighlightedText>
      </h2>

      <p>
        <HighlightedText>
          Bears are romantic creatures by nature...
        </HighlightedText>
      </p>

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
