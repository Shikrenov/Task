export function createRandomCode(): number[] {
  const code = [1, 2, 3, 4, 5, 6];

  for (let index = code.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [code[index], code[randomIndex]] = [code[randomIndex], code[index]];
  }

  return code;
}
