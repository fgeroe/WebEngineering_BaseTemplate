import { useEffect, type JSX } from 'react';
import { loadBears } from './bears';
import { initCommentForm, initCommentToggle } from './comments';
import { initSearch } from './search';
import bearMp3 from '../media/bear.mp3';
import bearOgg from '../media/bear.ogg';
import urbanBear from '../media/urban-bear.jpg';
import wildBear from '../media/wild-bear.jpg';

function App(): JSX.Element {
  useEffect(() => {
    initCommentToggle();
    initCommentForm();
    initSearch();
    void loadBears();
  }, []);

  return (
    <>
      <header>
        <h1>Welcome to our wildlife website</h1>
      </header>

      <nav>
        <ul>
          <li>
            <a href="#">Home</a>
          </li>
          <li>
            <a href="#">Our team</a>
          </li>
          <li>
            <a href="#">Projects</a>
          </li>
          <li>
            <a href="#">Blog</a>
          </li>
        </ul>

        <form className="search">
          <label htmlFor="q" className="visually-hidden">
            Search query
          </label>
          <input type="search" name="q" id="q" placeholder="Search query" />
          <input type="submit" value="Go!" />
        </form>
      </nav>

      <main>
        <article>
          <h1>The trouble with Bears</h1>

          <p>By Evan Wild</p>

          <p>
            Tall, lumbering, angry, dangerous. The real live bears of this world
            are proud, independent creatures, self-serving and always on the
            hunt for food.
          </p>

          <h2>Types of bear</h2>

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
              <tr>
                <td>Wild</td>
                <td>Brown or black</td>
                <td>1.4 to 2.8 meters</td>
                <td>Woods and forests</td>
                <td>25 to 28 years</td>
                <td>Fish, meat, plants</td>
              </tr>
              <tr>
                <td>Urban</td>
                <td>North Face</td>
                <td>18 to 22</td>
                <td>Condos and coffee shops</td>
                <td>20 to 32 years</td>
                <td>Starbucks, sushi</td>
              </tr>
            </tbody>
          </table>

          <h2>Habitats and Eating habits</h2>

          <p>
            Wild bears eat a variety of meat, fish, fruit, nuts, and other
            natually growing ingredients...
          </p>

          <img src={wildBear} alt="Wild bear in forest" />

          <p>
            Urban (gentrified) bears on the other hand have largely abandoned
            the old ways...
          </p>

          <img src={urbanBear} alt="Urban bear near buildings" />

          <h2>Mating rituals</h2>

          <p>Bears are romantic creatures by nature...</p>

          <audio controls>
            <source src={bearMp3} type="audio/mpeg" />
            <source src={bearOgg} type="audio/ogg" />
            <p>
              It looks like your browser doesn&apos;t support HTML5 audio
              players.
            </p>
          </audio>

          <aside>
            <h2>About the author</h2>

            <p>Evan Wild is an unemployed plumber from Doncaster...</p>
          </aside>

          <section className="comments">
            <button type="button" className="show-hide" aria-expanded="false">
              Show comments
            </button>

            <div className="comment-wrapper">
              <h4>Add comment</h4>
              <form className="comment-form">
                <div className="flex-pair">
                  <label htmlFor="name">Your name:</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="flex-pair">
                  <label htmlFor="comment">Your comment:</label>
                  <textarea
                    name="comment"
                    id="comment"
                    rows={3}
                    placeholder="Enter your comment"
                  ></textarea>
                </div>
                <div>
                  <input type="submit" value="Submit comment" />
                </div>
              </form>

              <h4>Comments</h4>
              <ul className="comment-container">
                <li>
                  <p>Bob Fossil</p>
                  <p>
                    Oh I am so glad you taught me all about the big brown angry
                    guys...
                  </p>
                </li>
              </ul>
            </div>
          </section>

          <section className="more_bears">
            <h2>More Bears</h2>
          </section>
        </article>

        <aside>
          <h2>Related</h2>
          <ul>
            <li>
              <a href="#">The trouble with Bees</a>
            </li>
            <li>
              <a href="#">The trouble with Otters</a>
            </li>
            <li>
              <a href="#">The trouble with Penguins</a>
            </li>
            <li>
              <a href="#">The trouble with Octopi</a>
            </li>
            <li>
              <a href="#">The trouble with Lemurs</a>
            </li>
          </ul>
        </aside>
      </main>

      <footer>
        <p>©Copyright 2050 by nobody. All rights reversed.</p>
      </footer>
    </>
  );
}

export default App;
