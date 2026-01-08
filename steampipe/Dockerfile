FROM ghcr.io/turbot/steampipe:latest

# Install plugins
RUN steampipe plugin install aws azure gcp

# Copy configuration
COPY *.sp /workspace/config/

# Expose postgres port
EXPOSE 9193

# Run steampipe service
ENTRYPOINT ["steampipe", "service", "start", "--foreground"]
