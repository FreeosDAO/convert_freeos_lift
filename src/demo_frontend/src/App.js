import { html, render } from 'lit-html';
import { demo_backend } from 'declarations/demo_backend';
import { mylower, GREETING_MESSAGE } from './tom';
import logo from './logo2.svg';

class App {
  greeting = mylower(GREETING_MESSAGE);

  constructor() {
    this.#render();
  }

  #handleSubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    this.greeting = await demo_backend.greet(name);
    this.#render();
  };

  #render() {
    let body = html`
      <main>
        <br />
        <br />
        <form action="#">
          <label for="name">Enter your name: &nbsp;</label>
          <input id="name" alt="Name" type="text" />
          <button type="submit">Click Me!</button>
        </form>
        <section id="greeting">${this.greeting}</section>
      </main>
    `;
    render(body, document.getElementById('root'));
    document
      .querySelector('form')
      .addEventListener('submit', this.#handleSubmit);
  }
}

export default App;
