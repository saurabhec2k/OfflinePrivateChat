# Deployment Guide

## Prerequisites

- Docker and Docker Compose (optional but recommended)
- Node.js 18+ and npm
- Ollama server access
- A server or cloud platform

## Deployment Options

## Option 1: Traditional Server Deployment

### 1. Prepare Backend

```bash
# Build frontend
cd frontend
npm run build

# Copy dist to backend
cp -r dist ../server/public

# Install production dependencies
cd ../server
npm ci --only=production

# Set production environment
set NODE_ENV=production
```

### 2. Configure Environment

Update `/server/.env` for production:

```env
NODE_ENV=production
PORT=5000
OLLAMA_API_URL=http://ollama-server:11434
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
DATABASE_URL=your-db-url
```

### 3. Start Server

```bash
npm start
```

## Option 2: Docker Deployment

### 1. Create Docker Compose File

Already provided in `/docker/docker-compose.yml`

### 2. Build Images

```bash
docker-compose build
```

### 3. Run Containers

```bash
docker-compose up -d
```

### 4. View Logs

```bash
docker-compose logs -f
```

## Option 3: Kubernetes Deployment

### 1. Create Kubernetes Manifests

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: antigravity-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: antigravity
  template:
    metadata:
      labels:
        app: antigravity
    spec:
      containers:
      - name: server
        image: antigravity:latest
        ports:
        - containerPort: 5000
        env:
        - name: OLLAMA_API_URL
          value: "http://ollama:11434"
        - name: NODE_ENV
          value: "production"
```

### 2. Deploy

```bash
kubectl apply -f deployment.yaml
```

## Option 4: Cloud Platforms

### Vercel/Netlify (Frontend)

1. Connect GitHub repository
2. Select `frontend` as root directory
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://api.yourdomain.com`

### Heroku (Backend)

```bash
# Create Procfile
echo "web: npm start" > server/Procfile

# Deploy
git subtree push --prefix server heroku main
```

### AWS (Backend)

Use AWS Elastic Beanstalk or EC2:

```bash
# Elastic Beanstalk
eb init
eb create antigravity-env
eb deploy
```

### Azure (Backend)

Use Azure App Service:

```bash
# Create app
az webapp create --resource-group myGroup --plan myPlan --name antigravity-app

# Deploy
az webapp deployment source config-zip --resource-group myGroup --name antigravity-app --src app.zip
```

## Security Considerations

### 1. Environment Secrets

- Never commit `.env` file to version control
- Use platform secrets management (GitHub Secrets, AWS Secrets Manager, etc.)
- Rotate API keys regularly

### 2. CORS Configuration

```env
# Production
CORS_ORIGIN=https://yourdomain.com

# Multiple origins
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```

### 3. SSL/TLS

- Always use HTTPS in production
- Obtain SSL certificate (Let's Encrypt, AWS Certificate Manager, etc.)
- Configure reverse proxy (nginx, Apache)

### 4. Rate Limiting

Add to backend:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### 5. Authentication

- Implement user authentication (JWT, OAuth)
- Validate all inputs server-side
- Use HTTPS only cookies

## Performance Optimization

### 1. Frontend

- Minify CSS/JS
- Compress images
- Enable gzip compression
- Use CDN for static assets

### 2. Backend

- Enable caching headers
- Compress responses with gzip
- Implement request timeouts
- Use connection pooling

### 3. Database (when added)

- Create indexes on frequently queried fields
- Use connection pooling
- Implement query caching

## Monitoring & Logging

### 1. Application Monitoring

```bash
npm install pm2 -g
pm2 start server/src/index.js
pm2 logs
```

### 2. Log Aggregation

Consider services like:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Datadog
- CloudWatch
- Sentry

### 3. Health Checks

Implement health check endpoint (already included):

```bash
curl https://yourdomain.com/api/health
```

## Database Migration

When implementing database:

### 1. Schema Migrations

```bash
npm install knex
npx knex init
npx knex migrate:make initial_schema
npx knex migrate:latest
```

### 2. Backup Strategy

- Regular automated backups
- Test restore procedures
- Keep backups in multiple locations

## Scaling Strategy

### 1. Horizontal Scaling

- Load balancer (nginx, HAProxy)
- Multiple server instances
- Shared database
- Session management (Redis)

### 2. Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize code and queries

### 3. Caching

- Redis for session and data caching
- CDN for static assets
- Browser caching policies

## Disaster Recovery

### 1. Backup Strategy

- Daily automated backups
- Offsite backup storage
- Test restore procedures

### 2. High Availability

- Multi-region deployment
- Automatic failover
- Health checks and alerts

### 3. Disaster Response

- Documented procedures
- Team training
- Regular drills

## Troubleshooting

### Issue: High Memory Usage

```bash
# Check memory
docker stats
npm install --save clinic
clinic doctor -- node src/index.js
```

### Issue: Slow Response Times

- Check Ollama performance
- Monitor database queries
- Analyze request patterns

### Issue: Database Connection Failures

- Verify connection string
- Check firewall rules
- Monitor connection pool

## Rollback Procedures

### Docker

```bash
docker-compose down
docker-compose up -d
```

### Kubernetes

```bash
kubectl rollout history deployment/antigravity-app
kubectl rollout undo deployment/antigravity-app
```

### Traditional Server

```bash
git revert <commit-hash>
npm install
npm start
```

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] CORS properly configured
- [ ] Database connected (if applicable)
- [ ] Monitoring and logging active
- [ ] Backups configured
- [ ] Health checks passing
- [ ] Performance tested
- [ ] Security audit completed
- [ ] Documentation updated

## Support & Maintenance

- Regular security updates
- Dependency updates (npm)
- Performance monitoring
- User support procedures
- Feature enhancement roadmap

## Related Documentation

- [Development Setup](./DEV_SETUP.md)
- [API Reference](./API.md)
- [Architecture](../ARCHITECTURE.md)
