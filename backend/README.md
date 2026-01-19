app/
  main.py

  api/
    routes/
      documents.py

  services/
    document_service.py
    question_service.py

  ai/
    client.py
    prompts/
      document_generation.py
    agents/
      document_agent.py

  schemas/
    db/
      session_db.py
      document_db.py
      chunk_db.py
      question_db.py
    ai/
      document_generation_schema.py
    api/
      documents_api.py
      common_api.py

  db/
    client.py
    migrations/
      document.sql
    repositories/
      sessions_repo.py
      documents_repo.py
      chunks_repo.py
      questions_repo.py

  utils/
    pdf.py
    embedder.py
    storage.py
    json_utils.py