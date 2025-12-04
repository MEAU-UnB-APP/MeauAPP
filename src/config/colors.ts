export const Colors = {
    roxo:"#6c69a7",
    roxoclaro:"#8786b9",
    verde:"#d7d657",
    rosa:"#ffc1cc",
    rosaescuro:"#f37aac",
    preto:"#000000",
    branco:"#ffffff",
    cinza:"#EBEAEA",
} as const;

export type ColorsType = typeof Colors;

export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = Colors;
  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Cor não encontrada: ${path}`);
      return '#000000';
    }
  }
  return value;
};

