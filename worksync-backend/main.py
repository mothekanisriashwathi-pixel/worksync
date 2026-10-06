from fastapi import FastAPI

app = FastAPI(title="WorkSync API")


@app.get("/")
def root():
    return {"message": "WorkSync API is running."}
