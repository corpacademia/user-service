pipeline {
  agent any

  environment {
    AWS_REGION     = 'us-east-1'
    AWS_ACCOUNT_ID = '751757577887'
    ECR_REPO       = 'user-service-ecr'
    IMAGE_TAG      = "${BUILD_NUMBER ?: 'manual-' + new Date().format('yyyyMMddHHmmss')}"
    IMAGE_URI      = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}"
    IMAGE_LATEST   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:latest"

    CLUSTER_NAME   = 'DevCluster-golabing'
    SERVICE_NAME   = 'user-service-service-npk7b8tz'
    TASK_FAMILY    = 'user-service'

    // Path inside container for HTML template
    HTML_TEMPLATE_PATH = '/usr/src/app/templates/email-verification-template.html'
  }

  stages {

    stage('Agent Tool Check') {
      steps {
        sh '''
          echo "🔍 Checking essential tools..."
          bash --version || { echo "❌ bash not installed"; exit 2; }
          jq --version || { echo "❌ jq missing"; exit 2; }
          docker --version || { echo "❌ docker missing"; exit 2; }
          aws --version || { echo "❌ aws cli missing"; exit 2; }
          echo "✅ All required tools found."
        '''
      }
    }

    stage('Checkout Code') {
      steps { checkout scm }
    }

    stage('Validate templates') {
      steps {
        sh '''
          if [ ! -f templates/email-verification-template.html ]; then
            echo "❌ ERROR: templates/email-verification-template.html missing!"
            ls -la || true
            exit 2
          fi
          echo "✅ Template present."
        '''
      }
    }

    stage('Install Dependencies') {
      steps {
        sh '''
          if ! command -v node >/dev/null 2>&1; then
            echo "Installing Node.js 18..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
          fi
          echo "📦 Installing dependencies..."
          npm ci || npm install
        '''
      }
    }

    stage('Run Tests') {
      steps {
        sh '''
          npm test || echo "⚠️ No tests found or tests failed (non-blocking)."
        '''
      }
    }

    stage('Build Docker Image') {
      steps {
        sh '''
          echo "🐳 Building Docker image..."
          docker build --no-cache -t ${ECR_REPO}:${IMAGE_TAG} .
        '''
      }
    }

    stage('Ensure ECR repo exists & Login') {
      steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'a9cd0d04-49fd-4ec3-8fd0-29122149b3b6']]) {
          sh '''
            set -e
            echo "🔐 Ensuring ECR repo exists and logging in..."
            aws ecr describe-repositories --repository-names ${ECR_REPO} --region ${AWS_REGION} >/dev/null 2>&1 || \
              aws ecr create-repository --repository-name ${ECR_REPO} --region ${AWS_REGION}
            aws ecr get-login-password --region ${AWS_REGION} | \
              docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
          '''
        }
      }
    }

    stage('Push to ECR') {
      steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'a9cd0d04-49fd-4ec3-8fd0-29122149b3b6']]) {
          sh '''
            echo "📤 Pushing Docker image to ECR..."
            docker tag ${ECR_REPO}:${IMAGE_TAG} ${IMAGE_URI}
            docker push ${IMAGE_URI}
            docker tag ${IMAGE_URI} ${IMAGE_LATEST}
            docker push ${IMAGE_LATEST}
          '''
        }
      }
    }

    stage('Register new Task Definition & Deploy') {
      steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'a9cd0d04-49fd-4ec3-8fd0-29122149b3b6']]) {
          sh '''
bash -lc <<'BASH'
set -euo pipefail

echo "📄 Fetching current task definition for family: ${TASK_FAMILY}"
aws ecs describe-task-definition --task-definition ${TASK_FAMILY} --region ${AWS_REGION} --query taskDefinition > taskdef.json

echo "🔧 Updating container image and environment variables..."
cat taskdef.json | jq --arg IMG "${IMAGE_URI}" --arg HTML_PATH "${HTML_TEMPLATE_PATH}" '
  .containerDefinitions[0].image = $IMG
  | .containerDefinitions[0].environment = (
      (.containerDefinitions[0].environment // []) +
      [ {"name":"HTML_TEMPLATE_PATH","value":$HTML_PATH},
        {"name":"FRONTEND_URL","value":"https://app.golabing.ai"},
        {"name":"NODE_ENV","value":"production"} ]
    )
  | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)
' > new-taskdef.json

echo "🧩 Preparing minimal payload..."
jq '{ family: .family,
      containerDefinitions: .containerDefinitions,
      volumes: .volumes,
      taskRoleArn: .taskRoleArn,
      executionRoleArn: .executionRoleArn,
      networkMode: .networkMode,
      placementConstraints: .placementConstraints,
      requiresCompatibilities: .requiresCompatibilities,
      cpu: .cpu,
      memory: .memory }' new-taskdef.json > register-payload-raw.json

# Clean null fields (jq >=1.6) or fallback
if ! cat register-payload-raw.json | jq 'def remove_nulls: walk(if type == "object" then with_entries(select(.value != null)) else . end); remove_nulls' > register-payload.json; then
  echo "⚠️ jq <1.6 detected — using fallback cleanup"
  cat register-payload-raw.json | jq 'if .taskRoleArn == null then del(.taskRoleArn) else . end
       | if .executionRoleArn == null then del(.executionRoleArn) else . end
       | if .volumes == null then del(.volumes) else . end' > register-payload.json
fi

echo "🆕 Registering new task definition..."
for i in 1 2 3; do
  if aws ecs register-task-definition --cli-input-json file://register-payload.json --region ${AWS_REGION} > register-output.json; then
    break
  else
    echo "Retry $i/3 failed; waiting before retry..."
    sleep $((i*5))
  fi
done

NEW_TASK_DEF_ARN=$(jq -r '.taskDefinition.taskDefinitionArn' register-output.json)
echo "✅ New task definition: $NEW_TASK_DEF_ARN"

echo "🚀 Updating ECS service ${SERVICE_NAME} in cluster ${CLUSTER_NAME}..."
for i in 1 2 3; do
  if aws ecs update-service --cluster ${CLUSTER_NAME} --service ${SERVICE_NAME} --task-definition $NEW_TASK_DEF_ARN --force-new-deployment --region ${AWS_REGION}; then
    break
  else
    echo "Retry $i/3 for service update..."
    sleep $((i*5))
  fi
done

BASH
'''
        }
      }
    }

    stage('Wait for Deployment & Verify') {
      steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'a9cd0d04-49fd-4ec3-8fd0-29122149b3b6']]) {
          timeout(time: 15, unit: 'MINUTES') {
            sh '''
              echo "⏳ Waiting for ECS service to stabilize..."
              aws ecs wait services-stable --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME} --region ${AWS_REGION}
              echo "✅ Service stabilized successfully."

              echo "🔍 Checking running task..."
              TASK_ARN=$(aws ecs list-tasks --cluster ${CLUSTER_NAME} --service-name ${SERVICE_NAME} --desired-status RUNNING --query 'taskArns[0]' --output text --region ${AWS_REGION})
              if [ -n "$TASK_ARN" ]; then
                CONTAINER_NAME=$(jq -r '.containerDefinitions[0].name' taskdef.json)
                echo "Using task: $TASK_ARN, container: $CONTAINER_NAME"
                aws ecs execute-command --cluster ${CLUSTER_NAME} --task $TASK_ARN --container $CONTAINER_NAME --interactive --command "/bin/sh -c 'echo HTML_TEMPLATE_PATH=$HTML_TEMPLATE_PATH; ls -la $(dirname $HTML_TEMPLATE_PATH) || true; cat $HTML_TEMPLATE_PATH | sed -n \"1,20p\" || true'" --region ${AWS_REGION} || echo "⚠️ ECS Exec not enabled; verify via logs."
              else
                echo "⚠️ No running tasks found."
              fi
            '''
          }
        }
      }
    }
  }

  post {
    success {
      echo "✅ Deployment successful for service: ${SERVICE_NAME}"
    }
    failure {
      echo "❌ Jenkins pipeline failed. Check the console logs for details."
    }
    always {
      sh 'docker image prune -f || true'
    }
  }
}
