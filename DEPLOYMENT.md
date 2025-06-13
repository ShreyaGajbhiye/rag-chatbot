# DigiRestro SCM Training Chatbot - Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Azure services configured (OpenAI, Speech Services, AI Search)
- Environment variables configured

## Quick Deployment

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Azure credentials
nano .env
```

### 2. Docker Deployment

```bash
# Build and run with Docker Compose
npm run docker:run

# Or manually:
docker build -t digirestro-chatbot .
docker run -p 3001:3001 --env-file .env digirestro-chatbot
```

### 3. Verification

```bash
# Check health
curl http://localhost:3001/api/health

# Test speech services
npm test
```

## Production Deployment

### Cloud Platforms

#### Azure Container Instances (ACI)
```bash
# Build and push to Azure Container Registry
az acr build --registry <your-registry> --image digirestro-chatbot .

# Deploy to ACI
az container create \
  --resource-group <resource-group> \
  --name digirestro-chatbot \
  --image <your-registry>.azurecr.io/digirestro-chatbot \
  --ports 3001 \
  --environment-variables \
    NODE_ENV=production \
    PORT=3001 \
  --secure-environment-variables \
    AZURE_API_KEY=<key> \
    AZURE_SPEECH_KEY=<key>
```

#### Docker Hub + VPS
```bash
# Build and push
docker build -t your-username/digirestro-chatbot .
docker push your-username/digirestro-chatbot

# Deploy on VPS
docker pull your-username/digirestro-chatbot
docker run -d -p 3001:3001 --env-file .env your-username/digirestro-chatbot
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AZURE_API_KEY` | Azure OpenAI API key | ✅ |
| `ENDPOINT_URL` | Azure OpenAI endpoint | ✅ |
| `DEPLOYMENT_NAME` | GPT model deployment name | ✅ |
| `AZURE_SPEECH_KEY` | Azure Speech Services key | ✅ |
| `AZURE_SPEECH_REGION` | Azure region | ✅ |
| `AZURE_AI_SEARCH_ENDPOINT` | AI Search endpoint | ✅ |
| `AZURE_AI_SEARCH_KEY` | AI Search API key | ✅ |
| `AZURE_AI_SEARCH_INDEX` | Search index name | ✅ |
| `PORT` | Server port | ❌ (default: 3001) |
| `NODE_ENV` | Environment mode | ❌ (default: development) |

## Architecture

```
Internet → Load Balancer → Docker Container
                         ├── Frontend (Vite/React)
                         └── Backend (Express.js)
                              ├── Azure OpenAI
                              ├── Azure Speech Services
                              └── Azure AI Search
```

## Monitoring & Logs

- Health endpoint: `/api/health`
- Docker logs: `docker-compose logs -f`
- Application logs: Stored in `/app/logs` volume

## Security

- Environment variables are not included in Docker image
- Non-root user in container
- CORS properly configured
- API endpoints validated with Zod schemas

## Scaling

For high-traffic scenarios:
1. Use container orchestration (Kubernetes, Docker Swarm)
2. Add Redis for session storage
3. Implement rate limiting
4. Add CDN for static assets

## Troubleshooting

### Common Issues

1. **Audio conversion fails**: Ensure FFmpeg is installed
2. **Azure connection timeout**: Check network connectivity and keys
3. **CORS errors**: Verify frontend URL in backend CORS config

### Debug Commands

```bash
# Check container health
docker ps
docker logs <container-id>

# Test speech services
curl -X POST http://localhost:3001/api/speech/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world"}'

# Check Azure connectivity
curl http://localhost:3001/api/health
```
