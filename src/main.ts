import './style.css';
import { Game } from './game/Game';

const mount = document.querySelector<HTMLElement>('#game');

if (!mount) {
  throw new Error('Game mount element was not found.');
}

const game = new Game(mount);

try {
  await game.start();
} catch (error) {
  console.error('[Free the Tiger] Failed to start:', error);
  mount.innerHTML = '<p class="game-error">The jungle could not be loaded. Please refresh and try again.</p>';
}
