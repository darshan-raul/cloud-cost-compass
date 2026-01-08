import os
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain_openai import ChatOpenAI

app = FastAPI(title="Cloud Cost Compass Chatbot")

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
STEAMPIPE_HOST = os.getenv("STEAMPIPE_HOST", "localhost")
STEAMPIPE_PORT = os.getenv("STEAMPIPE_PORT", "9193")
STEAMPIPE_USER = os.getenv("STEAMPIPE_USER", "steampipe")
STEAMPIPE_DB = os.getenv("STEAMPIPE_DB", "steampipe")
STEAMPIPE_PASSWORD = os.getenv("STEAMPIPE_PASSWORD", "") # Steampipe often has no password locally, but good to have

# Database Connection
# Steampipe runs a Postgres-compatible interface
db_uri = f"postgresql://{STEAMPIPE_USER}:{STEAMPIPE_PASSWORD}@{STEAMPIPE_HOST}:{STEAMPIPE_PORT}/{STEAMPIPE_DB}"
db = SQLDatabase.from_uri(db_uri)

# LLM & Agent Setup
llm = ChatOpenAI(model="gpt-4", temperature=0)
agent_executor = create_sql_agent(llm, db=db, agent_type="openai-tools", verbose=True)

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"status": "ok", "service": "Cloud Cost Compass Chatbot"}

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        # The agent handles the text-to-SQL and execution
        response = agent_executor.invoke(request.message)
        return {"response": response["output"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
