// Prop compartido: la tijera del taller.
//
// Los cinco contratos usan el mismo objeto: el asset final del N1
// (`levels.01.scissors`, `assets/levels/01/props/scissors.webp`). Cada escena
// solo decide dónde se apoya: la tijera hereda la clase de posición de la
// mesa (`.level-scissors`, `.l2-scissors`, `.museum-cut`, `.l4-cut`).
//
// El prop no decide nada: es un `<button type="button">` real con
// `data-action="cut"`. El parent engancha `toggleScissors` y sincroniza
// `is-active` + `aria-pressed` sobre todos los `[data-action="cut"]`.

export const SCISSORS_ASSET = 'assets/levels/01/props/scissors.webp';
export const SCISSORS_SLOT = 'levels.01.scissors';

export function createScissorsProp({
  className = '',
  nameClass = 'scissors-prop-name',
  label = 'Cortar un cable',
  name = 'Tijera',
} = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = ['scissors-prop', className].filter(Boolean).join(' ');
  button.setAttribute('data-action', 'cut');
  button.setAttribute('aria-label', label);
  button.setAttribute('aria-pressed', 'false');

  const image = document.createElement('img');
  image.className = 'scissors-prop-img';
  image.setAttribute('src', SCISSORS_ASSET);
  image.setAttribute('data-src', SCISSORS_ASSET);
  image.setAttribute('data-asset', SCISSORS_SLOT);
  image.setAttribute('data-status', 'final');
  image.setAttribute('alt', '');
  image.setAttribute('draggable', 'false');
  image.setAttribute('aria-hidden', 'true');
  button.append(image);

  if (typeof name === 'string' && name !== '') {
    const caption = document.createElement('span');
    caption.className = nameClass;
    caption.textContent = name;
    button.append(caption);
  }

  return button;
}
