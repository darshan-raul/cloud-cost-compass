FROM ghcr.io/turbot/powerpipe:latest

# Copy configuration
COPY . /workspace/

# Expose powerpipe port
EXPOSE 9033

# Run powerpipe server
# We assume DATABASE_CONNECTION_STRING is passed as env var
ENTRYPOINT ["powerpipe", "server", "--ip", "0.0.0.0", "--port", "9033"]
