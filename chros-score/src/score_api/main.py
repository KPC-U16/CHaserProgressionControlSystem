from fastapi import Body, FastAPI

from .ranking import BoutResult, RankingResult, calculate_ranking

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}


@app.post("/ranking", response_model=RankingResult)
def create_ranking(bouts: list[BoutResult] = Body(...)) -> RankingResult:
    """対戦結果の配列を受け取り、順位表を返す。

    リクエストボディは対戦 (先攻・後攻それぞれ1回ずつで1試合) の配列。
    例:
        [
          {"hot": "player1", "cool": "player2", "winner": "hot", "reason": "put"},
          {"hot": "player2", "cool": "player1", "winner": "cool", "reason": "item"}
        ]
    """
    return calculate_ranking(bouts)
