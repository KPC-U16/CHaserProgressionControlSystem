from pydantic import BaseModel

class RoundData(BaseModel):
    coolScore: int
    coolPut: bool
    coolCutting: bool
    hotScore: int
    hotPut: bool
    hotCutting: bool

class InputData(BaseModel):
    firstName: str
    secondName: str
    firstRound: RoundData
    secondRound: RoundData

