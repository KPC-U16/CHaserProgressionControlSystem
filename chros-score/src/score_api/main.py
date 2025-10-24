from fastapi import FastAPI
from lupa import LuaRuntime
from src.score_api.types import InputData
import os

app = FastAPI()
lua = LuaRuntime(unpack_returned_tuples=True)

# Luaファイルの読み込み
try:
    base_dir = os.path.dirname(os.path.dirname(__file__))
    lua_file = os.path.join(base_dir, "score_calc_algo", "u16kushiro.lua")

    with open(lua_file, "r") as f:
        lua_code = f.read()
    lua.execute(lua_code)
except FileNotFoundError:
    print(f"警告: Luaファイルが見つかりません: {lua_file}")
except Exception as e:
    print(f"Lua読み込みエラー: {e}")

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

@app.post("/calc_score")
def calculate(
    data: InputData,
):
    try:
        func = lua.eval("calc_test")
        winner = func(5, 3)
        return {
            "winner": data.firstName
        }
    except Exception as e:
        return {"error": str(e)}
