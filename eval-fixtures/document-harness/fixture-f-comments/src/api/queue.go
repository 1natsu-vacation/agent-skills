package api

const capacity = 1000 // ｷｭｰ の容量（半角カタカナ）

// 保留キューは最初はメモリ上に置いていた。しばらくして再起動で消えることが分かり、
// 永続化した。その後もう一度、順序の問題で作り直している。
type Queue struct{ size int }
