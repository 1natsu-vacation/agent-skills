MAX_ATTEMPTS = 5


def should_retry(attempts: int) -> bool:
    """
    再送するかを判定する。docstring の本文は抽出できない。
    """
    return attempts < MAX_ATTEMPTS  # 上限に達したら False


# 2025-08-12 に田中さんの依頼でこの関数を追加した。その後1回直している。
def backoff(attempts: int) -> float:
    return min(2 ** attempts, 60)
