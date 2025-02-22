# Base image

# FROM ollama/ollama:latest
# EXPOSE 11434
# RUN mkdir -p /app
# RUN cat <<'EOF' > /app/start.sh
# #!/bin/bash
# ollama serve &
# sleep 5
# ollama pull llama3
# # Keep the Ollama server running in the foreground
# wait
# EOF
# RUN chmod +x /app/start.sh
# ENTRYPOINT ["/app/start.sh"]




FROM ollama/ollama:latest

# Install curl for health checks and downloading models
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# Create a script to initialize the model
COPY <<EOF /usr/local/bin/init-model.sh
#!/bin/bash
ollama serve &
sleep 5
ollama pull llama3
EOF

# Make the script executable
RUN chmod +x /usr/local/bin/init-model.sh

# Health check to ensure Ollama is running
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:11434/api/health || exit 1

# Expose the Ollama API port
EXPOSE 11434

# Run the initialization script
CMD ["/usr/local/bin/init-model.sh"]