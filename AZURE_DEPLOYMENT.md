# Azure App Service Deployment Guide

## Overview
Deploy your DigiRestro SCM Training Chatbot directly to Azure App Service from GitHub without Docker.

## Prerequisites
- Azure subscription
- GitHub repository
- Azure CLI (optional, for manual setup)

## Deployment Steps

### 1. Create Azure App Service

#### Option A: Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Create → Web App
3. Configure:
   - **Name**: `digirestro-chatbot` (or your preferred name)
   - **Runtime**: Node.js 18 LTS
   - **Operating System**: Linux
   - **Pricing Plan**: B1 or higher (for production)

#### Option B: Azure CLI
```bash
# Login to Azure
az login

# Create resource group
az group create --name digirestro-rg --location eastus2

# Create App Service plan
az appservice plan create \
  --name digirestro-plan \
  --resource-group digirestro-rg \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --name digirestro-chatbot \
  --resource-group digirestro-rg \
  --plan digirestro-plan \
  --runtime "NODE|18-lts"
```

### 2. Configure Environment Variables

In Azure Portal → Your App Service → Configuration → Application Settings:

```
AZURE_API_KEY=your_azure_openai_api_key
ENDPOINT_URL=https://your-resource.openai.azure.com/
DEPLOYMENT_NAME=your_gpt_deployment_name
AZURE_SPEECH_KEY=your_speech_services_key
AZURE_SPEECH_REGION=eastus2
AZURE_SPEECH_ENDPOINT=https://eastus2.api.cognitive.microsoft.com/
AZURE_AI_SEARCH_ENDPOINT=https://your-search.search.windows.net
AZURE_AI_SEARCH_INDEX=your_index_name
AZURE_AI_SEARCH_KEY=your_search_key
NODE_ENV=production
WEBSITE_NODE_DEFAULT_VERSION=18.x
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

### 3. Set Up GitHub Deployment

#### Option A: GitHub Actions (Recommended)

1. **Get Publish Profile**:
   - Azure Portal → Your App Service → Get publish profile
   - Download the `.PublishSettings` file

2. **Add GitHub Secret**:
   - GitHub → Your repo → Settings → Secrets and variables → Actions
   - Add secret: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Paste the entire contents of the publish profile file

3. **Update Workflow**:
   - Edit `.github/workflows/azure-deploy.yml`
   - Change `AZURE_WEBAPP_NAME` to your app service name

4. **Deploy**:
   - Push to main/master branch
   - GitHub Actions will automatically deploy

#### Option B: Direct GitHub Integration

1. Azure Portal → Your App Service → Deployment Center
2. Source: GitHub
3. Authorize GitHub access
4. Select your repository and branch
5. Azure will auto-configure the build pipeline

### 4. Custom Domain & SSL (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name digirestro-chatbot \
  --resource-group digirestro-rg \
  --hostname your-domain.com

# Enable managed SSL
az webapp config ssl bind \
  --certificate-type SNI \
  --name digirestro-chatbot \
  --resource-group digirestro-rg \
  --ssl-type SNI
```

## Advantages of Azure App Service vs Docker

### ✅ **Azure App Service Benefits**:
- **Simpler Deployment**: Direct from GitHub
- **Automatic Scaling**: Built-in auto-scaling
- **Managed Infrastructure**: No container management
- **Integrated Monitoring**: Application Insights included
- **Easy SSL**: Free managed certificates
- **Deployment Slots**: Staging/production environments
- **Lower Cost**: No container orchestration overhead

### ❌ **Docker Container Instances**:
- More complex deployment pipeline
- Manual scaling configuration
- Container management overhead
- Additional networking setup

## Monitoring & Troubleshooting

### Application Insights
```bash
# Enable Application Insights
az monitor app-insights component create \
  --app digirestro-chatbot-insights \
  --location eastus2 \
  --resource-group digirestro-rg \
  --application-type web
```

### Log Streaming
```bash
# View live logs
az webapp log tail --name digirestro-chatbot --resource-group digirestro-rg

# Download logs
az webapp log download --name digirestro-chatbot --resource-group digirestro-rg
```

### Common Issues

1. **Build Failures**: Check environment variables and Node.js version
2. **Audio Processing**: Ensure speech service keys are correct
3. **CORS Issues**: Update CORS origin in backend for your domain

### Testing Deployment

```bash
# Health check
curl https://digirestro-chatbot.azurewebsites.net/api/health

# Test speech services
curl -X POST https://digirestro-chatbot.azurewebsites.net/api/speech/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from Azure!"}'
```

## Scaling Configuration

### Auto-scaling Rules
```bash
# Create auto-scale rule
az monitor autoscale create \
  --resource-group digirestro-rg \
  --resource digirestro-chatbot \
  --resource-type Microsoft.Web/serverfarms \
  --name autoscale-rule \
  --min-count 1 \
  --max-count 3 \
  --count 1
```

## Cost Optimization

- **Development**: Use Free tier (F1)
- **Testing**: Use Basic tier (B1)
- **Production**: Use Standard tier (S1) or higher
- **High Traffic**: Use Premium tier (P1V2+)

## Security Best Practices

1. **Environment Variables**: Store secrets in App Service configuration
2. **Managed Identity**: Use for Azure service authentication
3. **Network Security**: Configure App Service Environment if needed
4. **SSL/TLS**: Enable HTTPS only
5. **Authentication**: Configure Azure AD if required

Your DigiRestro chatbot is now ready for seamless Azure App Service deployment! 🚀
