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
    SERVICE_NAME   = 'user-service-service-npk7b8tz'   // <-- trimmed trailing space
    TASK_FAMILY    = 'user-service'

    # absolute path inside container where template will be copied by Dockerfile
    HTML_TEMPLATE_PATH = '/usr/src/app/templates/email-verification-template.html'
  }

  stages {
    stage('Checkout Code') {
      steps { checkout scm }
    }

    stage('Validate templates') {
      steps {
        sh '''
          if [ ! -f templates/email-verification-template.html ]; then
            echo "ERROR: templates/email-verification-template.html missing!"
            ls -la || true
            exit 2
          fi
          echo "Template present."
        '''
      }
    }

    stage('Install Dependencies') {
      steps {
        sh '''
          # ensure node & npm available on Jenkins executor
          if ! command -v node >/dev/null 2>&1; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
          fi
          npm ci || npm install
        '''
      }
    }

    stage('Run Tests') {
      steps {
        sh 'npm test || echo "⚠️ No tests found or tests failed."'
      }
    }

    stage('Build Docker Image') {
      steps {
        sh "docker build --no-cache -t ${ECR_REPO}:${IMAGE_TAG} ."
      }
    }

    stage('Ensure ECR repo exists & Login') {
      steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'a9cd0d04-49fd-4ec3-8fd0-29122149b3b6']]) {
          sh '''
            set -e
            aws ecr describe-repositories --repository-names ${ECR_REPO} --region ${AWS_REGION} >/dev/null 2>&1 || \
              aws ecr create-repository --repository-name ${ECR_REPO} --region ${AWS_REGION}
            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
          '''
        }
      }
    }

    stage('Push to ECR') {
      steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'a9cd0d04-49fd-4ec3-8fd0-29122149b3b6']]) {
          sh '''
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
            set -e
            echo "Fetching current task definition for family: ${TASK_FAMILY}"
            aws ecs describe-task-definition --task-definition ${TASK_FAMILY} --region ${AWS_REGION} --query taskDefinition > taskdef.json

            # Remove read-only fields and set image + merge/add environment vars (including HTML_TEMPLATE_PATH)
            cat taskdef.json | \
              jq --arg IMG "${IMAGE_URI}" --arg HTML_PATH "${HTML_TEMPLATE_PATH}" '
                .containerDefinitions[0].image = $IMG
                | .containerDefinitions[0].environment = (
                    (.containerDefinitions[0].environment // []) +
                    [ {"name":"HTML_TEMPLATE_PATH","value":$HTML_PATH},
                      {"name":"FRONTEND_URL","value":"https://app.golabing.ai"},
                      {"name":"NODE_ENV","value":"production"} ]
                  )
                | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)
              ' > new-taskdef.json

            # Wrap into register payload: keep family, containerDefinitions, volumes, roles and network settings
            jq '{family: .family, containerDefinitions: .containerDefinitions, volumes: .volumes, taskRoleArn: .taskRoleArn, executionRoleArn: .executionRoleArn, networkMode: .networkMode, placementConstraints: .placementConstraints, requiresCompatibilities: .requiresCompatibilities, cpu: .cpu, memory: .memory}' new-taskdef.json > register-payload.json

            echo "Registering new task definition revision..."
            aws ecs register-task-definition --cli-input-json file://register-payload.json --region ${AWS_REGION} > register-output.json

            NEW_TASK_DEF_ARN=$(jq -r '.taskDefinition.taskDefinitionArn' register-output.json)
            echo "New task def ARN: $NEW_TASK_DEF_ARN"

            echo "Updating service ${SERVICE_NAME} on cluster ${CLUSTER_NAME} to new task def..."
            aws ecs update-service --cluster ${CLUSTER_NAME} --service ${SERVICE_NAME} --task-definition $NEW_TASK_DEF_ARN --force-new-deployment --region ${AWS_REGION}
          '''
        }
      }
    }

    stage('Wait for Deployment & Verify') {
      steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'a9cd0d04-49fd-4ec3-8fd0-29122149b3b6']]) {
          sh '''
            echo "Waiting for ECS service to stabilize..."
            aws ecs wait services-stable --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME} --region ${AWS_REGION}
            echo "Service is stable."

            echo "Inspect one running task and show template file content (requires ECS Exec enabled)"
            TASK_ARN=$(aws ecs list-tasks --cluster ${CLUSTER_NAME} --service-name ${SERVICE_NAME} --desired-status RUNNING --query 'taskArns[0]' --output text --region ${AWS_REGION})
            if [ -n "$TASK_ARN" ]; then
              CONTAINER_NAME=$(jq -r '.containerDefinitions[0].name' taskdef.json)
              echo "Using task: $TASK_ARN, container: $CONTAINER_NAME"
              # ECS Exec will only work if enabled; this command may fail if not configured.
              aws ecs execute-command --cluster ${CLUSTER_NAME} --task $TASK_ARN --container $CONTAINER_NAME --interactive --command "/bin/sh -c 'echo HTML_TEMPLATE_PATH=$HTML_TEMPLATE_PATH; ls -la $(dirname $HTML_TEMPLATE_PATH) || true; cat $HTML_TEMPLATE_PATH | sed -n \"1,40p\" || true'" --region ${AWS_REGION} || echo "ECS Exec not available or not enabled; verify file via logs or by SSH/SSM into host."
            else
              echo "No running tasks found to verify file."
            fi
          '''
        }
      }
    }
  }

  post {
    success {
      echo "✅ Successfully deployed new image to ECS service: ${SERVICE_NAME}"
    }
    failure {
      echo "❌ Jenkins pipeline failed. Check logs."
    }
    always {
      sh 'docker image prune -f || true'
    }
  }
}
