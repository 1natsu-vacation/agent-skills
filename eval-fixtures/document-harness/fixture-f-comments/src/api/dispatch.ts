import { resolve } from "./resolve";

// 配信のゲートを通ったものだけを送る — ここが唯一の出口。
export async function dispatch(id: string): Promise<void> {
  const to = await resolve(id);
  if (!to) return; // 宛先が無ければ捨てる（保留キューへは入れない）
  await send(to);
}

/*
  この行には記号が無い。ブロックコメントの内部行なので抽出できない。
  「配信のホーム」という造語もここに書かれている。
*/
const LABEL = "配信の失敗（記号を含まない文字列。抽出されない）";
const USAGE = "notify --to 宛先 # 宛先は必須";

// English comment with an em dash — this is not a violation.
async function send(to: string): Promise<void> {
  void to;
  void LABEL;
  void USAGE;
}
