# Cloud Cost Compass Helm Chart

This Helm chart deploys the Cloud Cost Compass application, including both the AWS poller and the Streamlit dashboard, onto a Kubernetes cluster.

## Features
- Deploys both poller and dashboard as separate Deployments and Services
- Configurable images, environment variables, and service types
- Supports LoadBalancer and ClusterIP service types
- Easy configuration via `values.yaml`

## Structure
```
cloud-cost-compass/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── k8s-dashboard.yaml
    ├── svc-dashboard.yaml
    ├── k8s-poller.yaml
    └── svc-poller.yaml
```

## Values
All configuration is done via `values.yaml`:

### Dashboard
- `dashboard.image`: Docker image for the dashboard
- `dashboard.service.type`: Service type (e.g., LoadBalancer)
- `dashboard.service.port`: Service port (default: 80)
- `dashboard.service.targetPort`: Container port (default: 8501)
- `dashboard.env`: Environment variables for DB connection

### Poller
- `poller.image`: Docker image for the poller
- `poller.service.type`: Service type (default: ClusterIP)
- `poller.service.port`: Service port (default: 80)
- `poller.env`: Environment variables for AWS roles and DB connection

## Usage

### 1. Install the Chart
```sh
helm install cloud-cost-compass .
```

### 2. Upgrade the Chart
```sh
helm upgrade cloud-cost-compass .
```

### 3. Uninstall
```sh
helm uninstall cloud-cost-compass
```

### 4. Customization
Edit `values.yaml` to set your images, environment variables, and service types as needed.

## Example
```yaml
dashboard:
  image: yourrepo/cloud-cost-dashboard:latest
  service:
    type: LoadBalancer
    port: 80
    targetPort: 8501
  env:
    POSTGRES_HOST: mydb.example.com
    POSTGRES_PORT: "5432"
    POSTGRES_DB: cloudcost
    POSTGRES_USER: admin
    POSTGRES_PASSWORD: secret

poller:
  image: yourrepo/cloud-cost-poller:latest
  service:
    type: ClusterIP
    port: 80
  env:
    AWS_ROLES: arn:aws:iam::123456789012:role/Role1
    POSTGRES_HOST: mydb.example.com
    POSTGRES_PORT: "5432"
    POSTGRES_DB: cloudcost
    POSTGRES_USER: admin
    POSTGRES_PASSWORD: secret
```

## Notes
- Ensure your images are built and pushed to a registry accessible by your cluster.
- The dashboard will be available at the LoadBalancer IP on port 80.
- The poller runs as a background job and does not expose an external port.

## License
MIT 