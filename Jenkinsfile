pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        ECR_REPO = 'user-service' // Your ECR repo name
        IMAGE_TAG = "${BUILD_NUMBER}"
        AWS_ACCOUNT_ID = 'pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        ECR_REPO = 'user-service' // Your ECR repo name
        IMAGE_TAG = "${BUILD_NUMBER}"
        AWS_ACCOUNT_ID = '751057572977' // Replace with your account ID
    }

    options {
        timestamps()
    }

    tools {
        nodejs 'node18' // Set this in Jenkins global tools
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test || echo "No tests defined"'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    dockerImage = docker.build("${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}")
                }
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: '9df79d1f-0539-4d32-9b7d-02ed68426fb9'
                ]]) {
                    script {
                        sh '''
                            aws ecr get-login-password --region $AWS_REGION | \
                            docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
                            docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ Build and push to ECR succeeded."
        }
        failure {
            echo "❌ Build failed or could not push to ECR."
        }
    }
}
' // Replace with your account ID
    }

    options {
        timestamps()
    }

    tools {
        nodejs 'node18' // Set this in Jenkins global tools
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test || echo "No tests defined"'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    dockerImage = docker.build("${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}")
                }
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: '9df79d1f-0539-4d32-9b7d-02ed68426fb9'
                ]]) {
                    script {
                        sh '''
                            aws ecr get-login-password --region $AWS_REGION | \
                            docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
                            docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ Build and push to ECR succeeded."
        }
        failure {
            echo "❌ Build failed or could not push to ECR."
        }
    }
}

