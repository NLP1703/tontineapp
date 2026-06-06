// =====================================================================
// Pipeline CI/CD TontineApp
// Déclenché à chaque push sur main : Checkout → Install → Test → Build
// → Push (Docker Hub) → Deploy (Kubernetes).
// Prérequis Jenkins : Docker, kubectl, credentials 'dockerhub' et 'kubeconfig'.
// =====================================================================

pipeline {
  agent any

  environment {
    DOCKER_REGISTRY = 'docker.io'
    DOCKER_NAMESPACE = 'tontineapp'              // remplacer par votre compte Docker Hub
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    DOCKERHUB = credentials('dockerhub')         // user/password Docker Hub
  }

  options {
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        dir('services/auth-service')         { sh 'npm ci' }
        dir('services/tontine-service')      { sh 'npm ci' }
        dir('services/notification-service') { sh 'npm ci' }
        dir('frontend')                      { sh 'npm ci' }
      }
    }

    stage('Test') {
      steps {
        dir('services/auth-service')    { sh 'npm test' }
        dir('services/tontine-service') { sh 'npm test' }
      }
      post {
        always {
          // Publie les rapports de couverture Jest si présents.
          archiveArtifacts artifacts: 'services/**/coverage/**', allowEmptyArchive: true
        }
      }
    }

    stage('Build') {
      steps {
        script {
          def services = ['auth-service', 'tontine-service', 'notification-service']
          for (s in services) {
            sh "docker build -t ${DOCKER_NAMESPACE}/${s}:${IMAGE_TAG} ./services/${s}"
          }
          sh "docker build -t ${DOCKER_NAMESPACE}/frontend:${IMAGE_TAG} ./frontend"
        }
      }
    }

    stage('Push') {
      steps {
        sh 'echo $DOCKERHUB_PSW | docker login -u $DOCKERHUB_USR --password-stdin'
        script {
          def images = ['auth-service', 'tontine-service', 'notification-service', 'frontend']
          for (img in images) {
            sh "docker push ${DOCKER_NAMESPACE}/${img}:${IMAGE_TAG}"
          }
        }
      }
    }

    stage('Deploy') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh 'kubectl apply -f infrastructure/k8s/ --recursive'
          // Met à jour l'image de chaque déploiement vers le tag fraîchement construit.
          sh """
            kubectl -n tontineapp set image deployment/auth-service auth-service=${DOCKER_NAMESPACE}/auth-service:${IMAGE_TAG}
            kubectl -n tontineapp set image deployment/tontine-service tontine-service=${DOCKER_NAMESPACE}/tontine-service:${IMAGE_TAG}
            kubectl -n tontineapp set image deployment/notification-service notification-service=${DOCKER_NAMESPACE}/notification-service:${IMAGE_TAG}
            kubectl -n tontineapp set image deployment/frontend frontend=${DOCKER_NAMESPACE}/frontend:${IMAGE_TAG}
            kubectl -n tontineapp rollout status deployment/tontine-service --timeout=120s
          """
        }
      }
    }
  }

  post {
    success { echo "✅ Pipeline réussi — build #${env.BUILD_NUMBER} déployé." }
    failure { echo "❌ Pipeline en échec — voir les logs du build #${env.BUILD_NUMBER}." }
    always  { sh 'docker logout || true' }
  }
}
