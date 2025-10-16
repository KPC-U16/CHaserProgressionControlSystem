# ベースイメージを指定
FROM python:3.12-slim

# 環境変数を設定し、Poetryが仮想環境を作成しないようにする
# これにより、依存関係がコンテナのシステムPythonに直接インストールされる
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    PYTHONUNBUFFERED=1

# 作業ディレクトリを設定
WORKDIR /app

# Poetryをインストール
RUN pip install poetry

# 依存関係定義ファイルのみを先にコピーする
# これにより、依存関係に変更がない限りキャッシュが利用され、ビルドが高速化する
COPY pyproject.toml poetry.lock ./

# 依存関係をインストール
RUN poetry install --no-root

# ソースコードをコピー
COPY ./src ./src

# サーバー起動コマンド
# --reloadフラグで開発中のコード変更を自動反映
CMD ["poetry", "run", "uvicorn", "src.score_api.main:app", "--host", "0.0.0.0", "--port", "3002", "--reload"]
