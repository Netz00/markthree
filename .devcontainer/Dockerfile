FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

RUN apt-get update \
    && apt-get install --no-install-recommends -y graphviz \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*